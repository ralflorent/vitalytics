import React, { useState, useMemo } from 'react';
import styled from 'styled-components';
import { Tooltip, Modal } from 'antd';
import { CopyOutlined, CheckOutlined, FileTextOutlined, DownOutlined, UpOutlined } from '@ant-design/icons';
import Markdown from 'react-markdown';
import dayjs from 'dayjs';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import type { ChatMessage as ChatMessageType } from '../../db';

dayjs.extend(localizedFormat);

interface ParsedAttachment {
  name: string;
  text: string;
}

interface ParsedContent {
  prompt: string;
  attachments: ParsedAttachment[];
}

/** Split user message text into prompt + attachment blocks */
function parseUserMessage(text: string): ParsedContent {
  const attachmentRegex = /\[Attachment:\s*([^\]]+)\]\n([\s\S]*?)(?=\n\[Attachment:|$)/g;
  const attachments: ParsedAttachment[] = [];
  let match;

  while ((match = attachmentRegex.exec(text)) !== null) {
    attachments.push({ name: match[1].trim(), text: match[2].trim() });
  }

  // Prompt is everything before the first [Attachment:] block
  const firstIdx = text.indexOf('[Attachment:');
  const prompt = firstIdx === -1 ? text : text.substring(0, firstIdx).trim();

  return { prompt, attachments };
}

const COLLAPSE_THRESHOLD = 600; // characters

interface Props {
  message: ChatMessageType;
  nickname?: string;
  modelBadge?: string;
}

const ChatMessage = ({ message, nickname, modelBadge }: Props) => {
  const isUser = message.author === 'user';
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [previewAttachment, setPreviewAttachment] = useState<ParsedAttachment | null>(null);

  const parsed = useMemo(() => (isUser ? parseUserMessage(message.text) : null), [isUser, message.text]);

  const isLong = message.text.length > COLLAPSE_THRESHOLD;
  const showCollapsed = isLong && !expanded;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const renderBody = () => {
    // User message with attachments — show prompt + attachment chips
    if (isUser && parsed && parsed.attachments.length > 0) {
      return (
        <>
          {parsed.prompt && (
            <Markdown>{showCollapsed ? parsed.prompt.slice(0, COLLAPSE_THRESHOLD) + '...' : parsed.prompt}</Markdown>
          )}
          <AttachmentChips>
            {parsed.attachments.map((att, i) => (
              <AttachmentChip key={i} onClick={() => setPreviewAttachment(att)}>
                <FileTextOutlined /> {att.name}
              </AttachmentChip>
            ))}
          </AttachmentChips>
        </>
      );
    }

    // Regular message (user without attachments or assistant)
    const displayText = showCollapsed ? message.text.slice(0, COLLAPSE_THRESHOLD) + '...' : message.text;
    return <Markdown>{displayText}</Markdown>;
  };

  return (
    <Bubble $isUser={isUser}>
      <Header>
        <AuthorRow>
          <Author>{isUser ? (nickname || 'You') : 'Assistant'}</Author>
          {!isUser && modelBadge && <ModelBadge>{modelBadge}</ModelBadge>}
        </AuthorRow>
        <HeaderRight>
          <Tooltip title={copied ? 'Copied!' : 'Copy'}>
            <CopyBtn onClick={handleCopy} $copied={copied}>
              {copied ? <CheckOutlined /> : <CopyOutlined />}
            </CopyBtn>
          </Tooltip>
          <Time>{dayjs(message.createdAt).format('lll')}</Time>
        </HeaderRight>
      </Header>
      <Body>{renderBody()}</Body>
      {isLong && (
        <CollapseToggle onClick={() => setExpanded(!expanded)}>
          {expanded ? <><UpOutlined /> Show less</> : <><DownOutlined /> Show more</>}
        </CollapseToggle>
      )}
      <Modal
        title={previewAttachment?.name || 'Attachment'}
        open={!!previewAttachment}
        onCancel={() => setPreviewAttachment(null)}
        footer={null}
        width={640}
      >
        <PreviewContent>{previewAttachment?.text}</PreviewContent>
      </Modal>
    </Bubble>
  );
};

const Bubble = styled.div<{ $isUser: boolean }>`
  max-width: 85%;
  align-self: ${(p) => (p.$isUser ? 'flex-end' : 'flex-start')};
  background: ${(p) => (p.$isUser ? 'var(--color-bubble-user)' : 'var(--color-bubble-assistant)')};
  border: 1px solid ${(p) => (p.$isUser ? 'var(--color-bubble-user-border)' : 'var(--color-bubble-assistant-border)')};
  border-radius: 12px;
  padding: 12px 16px;
  margin-bottom: 12px;

  @media (max-width: 480px) {
    max-width: 95%;
    padding: 10px 12px;
  }

  @media (min-width: 1200px) {
    max-width: 80%;
  }

  p {
    margin: 0 0 8px;
    &:last-child { margin-bottom: 0; }
  }

  pre {
    background: var(--color-surface-elevated);
    border-radius: 6px;
    padding: 12px;
    overflow-x: auto;
    font-size: 13px;
  }

  code {
    font-family: 'JetBrains Mono', 'Fira Code', monospace;
    font-size: 13px;
  }

  ul, ol {
    padding-left: 20px;
    margin: 8px 0;
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
`;

const AuthorRow = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

const Author = styled.span`
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text);
`;

const ModelBadge = styled.span`
  font-size: 10px;
  font-weight: 500;
  padding: 1px 6px;
  border-radius: 4px;
  background: var(--color-primary-surface);
  color: var(--color-primary);
  white-space: nowrap;
`;

const HeaderRight = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const CopyBtn = styled.button<{ $copied?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: ${(p) => (p.$copied ? 'var(--color-primary)' : 'var(--color-text-muted)')};
  cursor: pointer;
  font-size: 13px;
  opacity: ${(p) => (p.$copied ? 1 : 0)};
  transition: opacity 120ms ease, color 120ms ease;

  ${Bubble}:hover & {
    opacity: 1;
  }

  &:hover {
    background: var(--color-surface-elevated);
    color: var(--color-text);
  }
`;

const Time = styled.span`
  font-size: 11px;
  color: var(--color-text-muted);
`;

const Body = styled.div`
  font-size: 15px;
  line-height: 1.6;
  color: var(--color-text);
`;

const AttachmentChips = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
`;

const AttachmentChip = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 6px;
  border: 1px solid var(--color-border);
  background: var(--color-surface-elevated);
  color: var(--color-primary);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: background 120ms ease;
  max-width: 200px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  &:hover {
    background: var(--color-primary-surface);
  }
`;

const CollapseToggle = styled.button`
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 6px;
  padding: 0;
  border: none;
  background: none;
  color: var(--color-primary);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;

  &:hover {
    text-decoration: underline;
  }
`;

const PreviewContent = styled.pre`
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 60vh;
  overflow-y: auto;
  font-size: 13px;
  line-height: 1.6;
  padding: 8px;
  background: var(--color-surface-elevated);
  border-radius: 6px;
`;

export default ChatMessage;
