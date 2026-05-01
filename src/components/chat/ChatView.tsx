import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import styled from 'styled-components';
import { Spin, Button, message } from 'antd';
import { ThunderboltOutlined, NodeIndexOutlined } from '@ant-design/icons';
import { SyncRedactor } from 'cognosys-redact-pii';

import ChatInput from './ChatInput';
import ChatMessage from './ChatMessage';
import ReviewModal from './ReviewModal';
import ExportMenu from './ExportMenu';
import ConversationStats from './ConversationStats';
const WorkflowDrawer = lazy(() => import('./WorkflowDrawer'));
import { getProvider, getModelByTier } from '../../providers/registry';
import type { SessionHandle } from '../../providers/types';
import { addLog } from '../../db/logs';
import type { ChatMessage as ChatMessageType, Conversation } from '../../db';
import {
  createConversation,
  getConversation,
  updateConversation,
  addMessage,
  getMessages,
} from '../../db/conversations';
import type { UserProfile } from '../../types/profile';

const redactor = new SyncRedactor();

const PRESETS = [
  'Explain my blood test results',
  'Summarize this radiology report',
  'What do these lab values mean?',
  'Is this result within normal range?',
  'Explain this medication and its side effects',
  'Help me prepare questions for my doctor',
];

function applyMasking(text: string, level: string): string {
  if (level === 'none') return text;
  return redactor.redact(text);
}

function buildSystemPrompt(tone: string, detailLevel: string, profile?: UserProfile): string {
  const toneMap: Record<string, string> = {
    professional: 'Respond in a clear, clinical, professional tone.',
    friendly: 'Respond in a warm, friendly, approachable tone.',
    simple: 'Respond in plain language. Avoid medical jargon. Explain terms simply.',
  };
  const detailMap: Record<string, string> = {
    brief: 'Keep responses short and to the point.',
    standard: 'Provide balanced explanations with moderate detail.',
    detailed: 'Provide thorough explanations with full context and background.',
  };
  const backgroundMap: Record<string, string> = {
    doctor: 'The user is a physician; use appropriate clinical terminology and evidence-based references.',
    nurse: 'The user is a nursing professional; use clinical language but focus on practical care implications.',
    researcher: 'The user is a medical researcher; include methodology details and cite relevant concepts.',
    student: 'The user is a health sciences student; explain concepts educationally and define key terms.',
    caregiver: 'The user is a caregiver or family member; balance clarity with enough detail to support informed care decisions.',
    general: 'The user is a non-medical person; explain in accessible, everyday terms.',
  };

  const parts = [
    'You are a knowledgeable medical assistant. Analyze health data, explain medical test results, and provide clear, helpful interpretations.',
    'You ONLY discuss health and medical topics. If the user sends content that is not health or medical related, politely decline and remind them that this app is designed for health data analysis only.',
    'When the user sends attachments (marked with [Attachment:...]), evaluate whether the content is medical or health-related (e.g., lab results, prescriptions, clinical notes, imaging reports). If the attachment content is not health-related, politely let the user know you can only analyze health-related documents and ask them to upload a relevant medical document instead.',
    toneMap[tone] || toneMap.professional,
    detailMap[detailLevel] || detailMap.standard,
  ];

  if (profile?.nickname) {
    parts.push(`Address the user as "${profile.nickname}".`);
  }
  if (profile?.background && backgroundMap[profile.background]) {
    parts.push(backgroundMap[profile.background]);
  }
  if (profile?.interests && profile.interests.length > 0) {
    parts.push(`The user has particular interest in: ${profile.interests.join(', ')}.`);
  }

  parts.push('Always remind users that your analysis is not a substitute for professional medical advice.');
  return parts.join(' ');
}

interface Props {
  conversationId: string | null;
  providerId: string;
  modelId: string;
  maskingLevel: string;
  reviewBeforeSend: boolean;
  tone: string;
  detailLevel: string;
  temporary?: boolean;
  userProfile?: UserProfile;
  onConversationCreated: (id: string) => void;
}

function notifyIfHidden(title: string, body: string) {
  if (document.visibilityState === 'visible') return;
  if (Notification.permission === 'granted') {
    new Notification(title, { body, icon: '/icons/icon.svg' });
  }
}

const ChatView = ({
  conversationId,
  providerId,
  modelId,
  maskingLevel,
  reviewBeforeSend,
  tone,
  detailLevel,
  temporary,
  userProfile,
  onConversationCreated,
}: Props) => {
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [sending, setSending] = useState(false);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const sessionRef = useRef<SessionHandle | null>(null);

  const [statsKey, setStatsKey] = useState(0);
  const [workflowOpen, setWorkflowOpen] = useState(false);

  // Review modal state (session id remounts ReviewModal so draft resets each open)
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewSessionId, setReviewSessionId] = useState(0);
  const [pendingOriginal, setPendingOriginal] = useState('');
  const [pendingMasked, setPendingMasked] = useState('');

  const [modelUsed, setModelUsed] = useState<Record<string, string>>({});

  const isAgentic = modelId === 'auto';
  const fallbackModel = getModelByTier(providerId, 'standard') || getModelByTier(providerId, 'fast') || '';

  const resolveModel = async (
    provider: ReturnType<typeof getProvider>,
    text: string,
  ): Promise<string> => {
    if (!isAgentic || !provider) return modelId;

    const hasAttachments = text.includes('[Attachment:');
    if (text.length < 30 && !hasAttachments) {
      return getModelByTier(providerId, 'fast') || fallbackModel;
    }

    const fastModel = getModelByTier(providerId, 'fast');
    if (!fastModel) return fallbackModel;

    try {
      const result = await provider.createSession(
        fastModel,
        `Classify this health question as SIMPLE, MODERATE, or COMPLEX. Reply with one word only.\n\n${text.slice(0, 500)}`,
        'You are a query complexity classifier. Respond with exactly one word: SIMPLE, MODERATE, or COMPLEX.',
      );
      if (provider.endSession) await provider.endSession(result.session);

      const classification = result.reply.trim().toUpperCase();
      if (classification.includes('COMPLEX')) {
        return getModelByTier(providerId, 'reasoning') || getModelByTier(providerId, 'standard') || fallbackModel;
      }
      if (classification.includes('MODERATE')) {
        return getModelByTier(providerId, 'standard') || fallbackModel;
      }
      return fastModel;
    } catch {
      return fallbackModel;
    }
  };

  const isEmpty = messages.length === 0 && !sending;

  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      setConversation(null);
      sessionRef.current = null;
      return;
    }
    getConversation(conversationId).then((conv) => {
      if (conv) {
        setConversation(conv);
        getMessages(conv.id).then(setMessages);
      }
    });
  }, [conversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Request notification permission once
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const generateTitle = async (convId: string, userPrompt: string) => {
    const provider = getProvider(providerId);
    if (!provider?.isConfigured()) return;

    try {
      // Strip [Attachment: ...] blocks — send only the user's actual prompt for titling
      const cleaned = userPrompt.replace(/\[Attachment:[^\]]*\]\n[\s\S]*?(?=\[Attachment:|$)/g, '').trim();
      const snippet = cleaned.length > 300 ? cleaned.substring(0, 300) : cleaned;

      const result = await provider.createSession(
        modelId,
        `Generate a concise 3-5 word title for this health-related conversation. Respond with only the title, no quotes or extra punctuation.\n\nUser message:\n${snippet}`,
        'You are a title generator. Output only the title.',
      );

      const title = result.reply.replace(/^["']|["']$/g, '').trim();
      if (title) {
        await updateConversation(convId, { title });
        onConversationCreated(convId); // bumps refreshKey → sidebar re-renders
      }
      // Clean up the throwaway session
      if (provider.endSession) await provider.endSession(result.session);
    } catch {
      // Title generation is best-effort — silently swallow failures
    }
  };

  const appendDeltaToPlaceholder = (placeholderId: string, chunk: string) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === placeholderId ? { ...m, text: m.text + chunk } : m))
    );
  };

  const startSessionAndSend = async (maskedText: string) => {
    const provider = getProvider(providerId);
    if (!provider) {
      message.error(`Provider "${providerId}" not found.`);
      return;
    }
    if (!provider.isConfigured()) {
      message.error(`${provider.name} is not configured. Add your API key in Settings.`);
      return;
    }

    setSending(true);
    const placeholderId = crypto.randomUUID();
    try {
      const resolvedModel = await resolveModel(provider, maskedText);

      const title = maskedText.length > 60 ? maskedText.substring(0, 60) + '...' : maskedText;
      const conv = await createConversation({ title, assistantId: `${providerId}/${resolvedModel}`, temporary });
      setConversation(conv);
      onConversationCreated(conv.id);

      const userMsg = await addMessage(conv.id, 'user', maskedText);
      const placeholder: ChatMessageType = {
        id: placeholderId,
        conversationId: conv.id,
        author: 'assistant',
        text: '',
        createdAt: Date.now(),
      };
      setMessages([userMsg, placeholder]);

      const start = performance.now();
      const systemPrompt = buildSystemPrompt(tone, detailLevel, userProfile);
      const result = await provider.createSessionStream(resolvedModel, maskedText, systemPrompt, {
        onDelta: (chunk) => appendDeltaToPlaceholder(placeholderId, chunk),
      });
      const latencyMs = Math.round(performance.now() - start);

      sessionRef.current = result.session;
      await updateConversation(conv.id, { threadId: result.session.id });

      await addLog({
        conversationId: conv.id,
        timestamp: Date.now(),
        provider: providerId,
        model: resolvedModel,
        requestTokens: result.usage.requestTokens,
        responseTokens: result.usage.responseTokens,
        latencyMs,
        status: 'success',
      });
      setStatsKey((k) => k + 1);

      const assistantMsg = await addMessage(conv.id, 'assistant', result.reply);
      setMessages((prev) => prev.map((m) => (m.id === placeholderId ? assistantMsg : m)));
      if (isAgentic) {
        setModelUsed((prev) => ({ ...prev, [assistantMsg.id]: resolvedModel }));
      }
      notifyIfHidden('Vitalytics', 'Your analysis is ready.');

      // Fire-and-forget: ask AI for a better title
      generateTitle(conv.id, maskedText);
    } catch (err) {
      // Drop the placeholder if we bailed before it was populated
      setMessages((prev) => prev.filter((m) => m.id !== placeholderId));
      message.error(`Failed to start chat: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setSending(false);
    }
  };

  const sendFollowUp = async (maskedText: string) => {
    if (!conversation || !sessionRef.current) return;
    const provider = getProvider(providerId);
    if (!provider || !provider.isConfigured()) {
      message.error('Provider not configured. Check Settings.');
      return;
    }

    const userMsg = await addMessage(conversation.id, 'user', maskedText);
    const placeholderId = crypto.randomUUID();
    const placeholder: ChatMessageType = {
      id: placeholderId,
      conversationId: conversation.id,
      author: 'assistant',
      text: '',
      createdAt: Date.now(),
    };
    setMessages((prev) => [...prev, userMsg, placeholder]);

    setSending(true);
    try {
      const resolvedModel = await resolveModel(provider, maskedText);
      const start = performance.now();
      const result = await provider.sendMessageStream(sessionRef.current, maskedText, {
        onDelta: (chunk) => appendDeltaToPlaceholder(placeholderId, chunk),
      });
      const latencyMs = Math.round(performance.now() - start);

      await addLog({
        conversationId: conversation.id,
        timestamp: Date.now(),
        provider: providerId,
        model: resolvedModel,
        requestTokens: result.usage.requestTokens,
        responseTokens: result.usage.responseTokens,
        latencyMs,
        status: 'success',
      });
      setStatsKey((k) => k + 1);

      const assistantMsg = await addMessage(conversation.id, 'assistant', result.reply);
      setMessages((prev) => prev.map((m) => (m.id === placeholderId ? assistantMsg : m)));
      if (isAgentic) {
        setModelUsed((prev) => ({ ...prev, [assistantMsg.id]: resolvedModel }));
      }
      notifyIfHidden('Vitalytics', 'New response received.');
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== placeholderId));
      message.error('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const processAndSend = (maskedText: string) => {
    if (!conversation) {
      startSessionAndSend(maskedText);
    } else {
      sendFollowUp(maskedText);
    }
  };

  const handleSend = (text: string, attachmentTexts: string[]) => {
    const parts = [text, ...attachmentTexts].filter(Boolean);
    let combined = parts.join('\n\n');
    if (!combined) return;

    if (attachmentTexts.length > 0) {
      combined =
        'The following includes text extracted from an uploaded document/image. ' +
        'Analyze it ONLY if it is health or medical related. Otherwise, politely decline.\n\n' +
        combined;
    }

    const masked = applyMasking(combined, maskingLevel);

    if (reviewBeforeSend) {
      setPendingOriginal(combined);
      setPendingMasked(masked);
      setReviewSessionId((n) => n + 1);
      setReviewOpen(true);
    } else {
      processAndSend(masked);
    }
  };

  const handleReviewConfirm = (edited: string) => {
    const trimmed = edited.trim();
    if (!trimmed) return;
    setReviewOpen(false);
    processAndSend(applyMasking(trimmed, maskingLevel));
  };

  const currentProvider = getProvider(providerId);

  // ── Welcome / empty state: centered input ──
  if (isEmpty) {
    return (
      <Container>
        <CenteredLayout>
          <WelcomeContent>
            <WelcomeLogo src="/icons/icon.svg" alt="Vitalytics" />
            <WelcomeTitle>Vitalytics</WelcomeTitle>
            <WelcomeSubtitle>
              {userProfile?.nickname
                ? `Hi ${userProfile.nickname}, how can I help you today?`
                : 'A smarter second look at your lab results'}
            </WelcomeSubtitle>
            {currentProvider && !currentProvider.isConfigured() && (
              <ConfigHint>Configure your {currentProvider.name} API key in Settings to begin.</ConfigHint>
            )}
          </WelcomeContent>
          <ChatInput
            onSend={handleSend}
            disabled={sending}
            placeholder="Ask away..."
            presets={PRESETS}
          />
        </CenteredLayout>
        <ReviewModal
          key={reviewSessionId}
          open={reviewOpen}
          originalText={pendingOriginal}
          maskedText={pendingMasked}
          maskingLevel={maskingLevel}
          provider={currentProvider?.name || providerId}
          model={modelId}
          onConfirm={handleReviewConfirm}
          onCancel={() => setReviewOpen(false)}
        />
      </Container>
    );
  }

  // ── Conversation state: messages + bottom input ──
  return (
    <Container>
      {conversation && messages.length > 0 && (
        <ChatToolbar>
          <ConversationStats conversationId={conversation.id} refreshKey={statsKey} />
          <ToolbarSpacer />
          <WorkflowButton type="text" size="small" onClick={() => setWorkflowOpen(true)}>
            <NodeIndexOutlined /> Workflow
          </WorkflowButton>
          <ExportMenu conversation={conversation} messages={messages} />
        </ChatToolbar>
      )}
      {conversation?.temporary && (
        <TempBanner>
          <ThunderboltOutlined /> Temporary chat — will be deleted when you close the app
        </TempBanner>
      )}
      <MessageArea>
        {messages
          .filter((msg) => msg.text !== '')
          .map((msg) => (
            <ChatMessage key={msg.id} message={msg} nickname={userProfile?.nickname} modelBadge={modelUsed[msg.id]} />
          ))}
        {sending && messages[messages.length - 1]?.text === '' && (
          <LoadingIndicator>
            <Spin size="small" /> Thinking...
          </LoadingIndicator>
        )}
        <div ref={messagesEndRef} />
      </MessageArea>
      <BottomInputArea>
        <ChatInput onSend={handleSend} disabled={sending} placeholder="Ask a follow-up question..." />
      </BottomInputArea>
      <ReviewModal
        key={reviewSessionId}
        open={reviewOpen}
        originalText={pendingOriginal}
        maskedText={pendingMasked}
        maskingLevel={maskingLevel}
        provider={currentProvider?.name || providerId}
        model={modelId}
        onConfirm={handleReviewConfirm}
        onCancel={() => setReviewOpen(false)}
      />
      {conversation && (
        <Suspense fallback={null}>
          <WorkflowDrawer
            open={workflowOpen}
            onClose={() => setWorkflowOpen(false)}
            conversationId={conversation.id}
          />
        </Suspense>
      )}
    </Container>
  );
};

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
`;

const TempBanner = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 16px;
  font-size: 12px;
  font-weight: 500;
  color: var(--color-accent);
  background: rgba(245, 158, 11, 0.08);
  border-bottom: 1px solid rgba(245, 158, 11, 0.15);
  flex-shrink: 0;

  .anticon {
    font-size: 13px;
  }
`;

const CenteredLayout = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px 24px 80px;
  gap: 32px;
`;

const WelcomeContent = styled.div`
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const WelcomeLogo = styled.img`
  width: 64px;
  height: 64px;
  margin-bottom: 16px;
`;

const WelcomeTitle = styled.h2`
  color: var(--color-primary);
  font-size: 24px;
  font-weight: 600;
  margin: 0 0 6px;

  @media (max-width: 480px) {
    font-size: 20px;
  }
`;

const WelcomeSubtitle = styled.p`
  color: var(--color-text-secondary);
  font-size: 15px;
  margin: 0;

  @media (max-width: 480px) {
    font-size: 14px;
  }
`;

const ConfigHint = styled.p`
  color: var(--color-accent);
  font-weight: 500;
  margin-top: 12px;
  font-size: 14px;
`;

const ChatToolbar = styled.div`
  display: flex;
  align-items: center;
  padding: 4px 16px;
  border-bottom: 1px solid var(--color-border-light);
  flex-shrink: 0;
`;

const ToolbarSpacer = styled.div`
  flex: 1;
`;

const WorkflowButton = styled(Button)`
  font-size: 12px;
  color: var(--color-text-muted);
  display: flex;
  align-items: center;
  gap: 4px;
`;

const MessageArea = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 24px 16px;
  display: flex;
  flex-direction: column;
  max-width: 720px;
  width: 100%;
  margin: 0 auto;

  @media (min-width: 1200px) {
    max-width: 840px;
  }

  @media (min-width: 1600px) {
    max-width: 960px;
  }

  @media (max-width: 480px) {
    padding: 16px 12px;
  }
`;

const BottomInputArea = styled.div`
  padding: 12px 16px 4px;
  background: var(--color-bg);
  flex-shrink: 0;

  @media (max-width: 480px) {
    padding: 8px 10px 4px;
  }
`;

const LoadingIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--color-text-secondary);
  font-size: 14px;
  padding: 8px 0;
  align-self: flex-start;
`;

export default ChatView;
