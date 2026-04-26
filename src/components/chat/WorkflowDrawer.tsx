import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { Drawer, Tag, Empty } from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  SendOutlined,
  RobotOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { getLogsForConversation, type APILog } from '../../db/logs';
import { getMessages } from '../../db/conversations';
import type { ChatMessage } from '../../db';
import { estimateCost, formatCost, formatTokens } from '../../utils/pricing';

interface Props {
  open: boolean;
  onClose: () => void;
  conversationId: string;
}

interface WorkflowStep {
  userMessage: ChatMessage;
  log: APILog | null;
  assistantMessage: ChatMessage | null;
}

function buildSteps(messages: ChatMessage[], logs: APILog[]): WorkflowStep[] {
  const steps: WorkflowStep[] = [];
  const logQueue = [...logs];

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    if (msg.author !== 'user') continue;

    const nextAssistant = messages.slice(i + 1).find((m) => m.author === 'assistant');
    const log = logQueue.shift() ?? null;

    steps.push({
      userMessage: msg,
      log,
      assistantMessage: nextAssistant ?? null,
    });
  }
  return steps;
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function formatDuration(ms: number): string {
  if (ms >= 60_000) return `${(ms / 60_000).toFixed(1)}m`;
  if (ms >= 1000) return `${(ms / 1000).toFixed(1)}s`;
  return `${ms}ms`;
}

function truncate(text: string, max: number): string {
  const cleaned = text.replace(/\[Attachment:[^\]]*\]\n[\s\S]*?(?=\[Attachment:|$)/g, '').trim();
  if (cleaned.length <= max) return cleaned;
  return cleaned.substring(0, max) + '...';
}

const PROVIDER_COLORS: Record<string, string> = {
  openai: '#10A37F',
  anthropic: '#D97706',
  gemini: '#4285F4',
};

const WorkflowDrawer = ({ open, onClose, conversationId }: Props) => {
  const [steps, setSteps] = useState<WorkflowStep[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !conversationId) return;
    let cancelled = false;
    Promise.all([getMessages(conversationId), getLogsForConversation(conversationId)]).then(
      ([msgs, logs]) => {
        if (cancelled) return;
        setSteps(buildSteps(msgs, logs));
        setLoading(false);
      },
    );
    return () => { cancelled = true; };
  }, [open, conversationId]);

  const totalCost = steps.reduce(
    (sum, s) =>
      sum + (s.log ? estimateCost(s.log.model, s.log.requestTokens, s.log.responseTokens) : 0),
    0,
  );
  const totalLatency = steps.reduce((sum, s) => sum + (s.log?.latencyMs ?? 0), 0);
  const totalTokens = steps.reduce(
    (sum, s) => sum + (s.log ? s.log.requestTokens + s.log.responseTokens : 0),
    0,
  );

  return (
    <Drawer
      title="Conversation Workflow"
      placement="right"
      width={420}
      onClose={onClose}
      open={open}
      styles={{ body: { background: 'var(--color-surface-elevated)', padding: '16px' } }}
    >
      {loading ? null : steps.length === 0 ? (
        <Empty description="No API calls in this conversation" />
      ) : (
        <>
          <SummaryBar>
            <SummaryItem>
              <SummaryValue>{steps.length}</SummaryValue>
              <SummaryLabel>Rounds</SummaryLabel>
            </SummaryItem>
            <SummaryDivider />
            <SummaryItem>
              <SummaryValue>{formatTokens(totalTokens)}</SummaryValue>
              <SummaryLabel>Tokens</SummaryLabel>
            </SummaryItem>
            <SummaryDivider />
            <SummaryItem>
              <SummaryValue $highlight>{formatCost(totalCost)}</SummaryValue>
              <SummaryLabel>Cost</SummaryLabel>
            </SummaryItem>
            <SummaryDivider />
            <SummaryItem>
              <SummaryValue>{formatDuration(totalLatency)}</SummaryValue>
              <SummaryLabel>Total Time</SummaryLabel>
            </SummaryItem>
          </SummaryBar>

          <Timeline>
            {steps.map((step, idx) => (
              <TimelineStep key={step.userMessage.id}>
                <StepConnector>
                  <StepNumber>{idx + 1}</StepNumber>
                  {idx < steps.length - 1 && <ConnectorLine />}
                </StepConnector>

                <StepContent>
                  <StepCard>
                    <CardRow>
                      <NodeIcon $type="user"><SendOutlined /></NodeIcon>
                      <NodeLabel>User</NodeLabel>
                      <TimeLabel>{formatTime(step.userMessage.createdAt)}</TimeLabel>
                    </CardRow>
                    <MessagePreview>{truncate(step.userMessage.text, 120)}</MessagePreview>
                  </StepCard>

                  {step.log && (
                    <StepCard $api>
                      <CardRow>
                        <StatusIcon $ok={step.log.status === 'success'}>
                          {step.log.status === 'success' ? (
                            <CheckCircleOutlined />
                          ) : (
                            <CloseCircleOutlined />
                          )}
                        </StatusIcon>
                        <NodeLabel>API Call</NodeLabel>
                        <Tag
                          color={PROVIDER_COLORS[step.log.provider] || undefined}
                          style={{ margin: 0, fontSize: 11, lineHeight: '18px' }}
                        >
                          {step.log.provider}
                        </Tag>
                      </CardRow>
                      <MetaGrid>
                        <MetaItem>
                          <MetaLabel>Model</MetaLabel>
                          <MetaValue>{step.log.model}</MetaValue>
                        </MetaItem>
                        <MetaItem>
                          <MetaLabel>Latency</MetaLabel>
                          <MetaValue>
                            <ClockCircleOutlined style={{ fontSize: 10, marginRight: 3 }} />
                            {formatDuration(step.log.latencyMs)}
                          </MetaValue>
                        </MetaItem>
                        <MetaItem>
                          <MetaLabel>Input</MetaLabel>
                          <MetaValue>{formatTokens(step.log.requestTokens)}</MetaValue>
                        </MetaItem>
                        <MetaItem>
                          <MetaLabel>Output</MetaLabel>
                          <MetaValue>{formatTokens(step.log.responseTokens)}</MetaValue>
                        </MetaItem>
                        <MetaItem>
                          <MetaLabel>Cost</MetaLabel>
                          <MetaValue $highlight>
                            {formatCost(
                              estimateCost(
                                step.log.model,
                                step.log.requestTokens,
                                step.log.responseTokens,
                              ),
                            )}
                          </MetaValue>
                        </MetaItem>
                      </MetaGrid>
                      {step.log.error && <ErrorText>{step.log.error}</ErrorText>}
                    </StepCard>
                  )}

                  {step.assistantMessage && (
                    <StepCard>
                      <CardRow>
                        <NodeIcon $type="assistant"><RobotOutlined /></NodeIcon>
                        <NodeLabel>Assistant</NodeLabel>
                        <TimeLabel>{formatTime(step.assistantMessage.createdAt)}</TimeLabel>
                      </CardRow>
                      <MessagePreview>{truncate(step.assistantMessage.text, 120)}</MessagePreview>
                    </StepCard>
                  )}
                </StepContent>
              </TimelineStep>
            ))}
          </Timeline>
        </>
      )}
    </Drawer>
  );
};

const SummaryBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-around;
  background: var(--color-surface);
  border: 1px solid var(--color-border-light);
  border-radius: 10px;
  padding: 12px 8px;
  margin-bottom: 20px;
`;

const SummaryItem = styled.div`
  text-align: center;
`;

const SummaryValue = styled.div<{ $highlight?: boolean }>`
  font-size: 16px;
  font-weight: 700;
  color: ${(p) => (p.$highlight ? 'var(--color-primary)' : 'var(--color-text)')};
  line-height: 1.2;
`;

const SummaryLabel = styled.div`
  font-size: 10px;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.3px;
  margin-top: 2px;
`;

const SummaryDivider = styled.div`
  width: 1px;
  height: 28px;
  background: var(--color-border-light);
`;

const Timeline = styled.div`
  display: flex;
  flex-direction: column;
`;

const TimelineStep = styled.div`
  display: flex;
  gap: 12px;
`;

const StepConnector = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 28px;
  flex-shrink: 0;
`;

const StepNumber = styled.div`
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--color-primary);
  color: white;
  font-size: 12px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

const ConnectorLine = styled.div`
  width: 2px;
  flex: 1;
  background: var(--color-border);
  min-height: 12px;
`;

const StepContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-bottom: 16px;
  min-width: 0;
`;

const StepCard = styled.div<{ $api?: boolean }>`
  background: var(--color-surface);
  border: 1px solid ${(p) => (p.$api ? 'var(--color-primary)' : 'var(--color-border-light)')};
  border-radius: 8px;
  padding: 10px 12px;
  ${(p) => p.$api && 'border-left: 3px solid var(--color-primary);'}
`;

const CardRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
`;

const NodeIcon = styled.span<{ $type: 'user' | 'assistant' }>`
  font-size: 14px;
  color: ${(p) => (p.$type === 'user' ? 'var(--color-text-secondary)' : 'var(--color-primary)')};
`;

const StatusIcon = styled.span<{ $ok: boolean }>`
  font-size: 14px;
  color: ${(p) => (p.$ok ? '#10B981' : '#EF4444')};
`;

const NodeLabel = styled.span`
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-secondary);
  flex: 1;
`;

const TimeLabel = styled.span`
  font-size: 11px;
  color: var(--color-text-muted);
  font-variant-numeric: tabular-nums;
`;

const MessagePreview = styled.div`
  font-size: 12px;
  color: var(--color-text-muted);
  line-height: 1.4;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
`;

const MetaGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px 12px;
  margin-top: 6px;
`;

const MetaItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const MetaLabel = styled.span`
  font-size: 11px;
  color: var(--color-text-muted);
`;

const MetaValue = styled.span<{ $highlight?: boolean }>`
  font-size: 12px;
  font-weight: 500;
  color: ${(p) => (p.$highlight ? 'var(--color-primary)' : 'var(--color-text)')};
  font-variant-numeric: tabular-nums;
`;

const ErrorText = styled.div`
  margin-top: 6px;
  font-size: 12px;
  color: #EF4444;
  background: rgba(239, 68, 68, 0.06);
  padding: 6px 8px;
  border-radius: 4px;
`;

export default WorkflowDrawer;
