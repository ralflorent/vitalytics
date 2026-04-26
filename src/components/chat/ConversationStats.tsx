import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { Popover, Button } from 'antd';
import { BarChartOutlined } from '@ant-design/icons';
import { getLogsForConversation, type APILog } from '../../db/logs';
import { estimateCost, formatCost, formatTokens } from '../../utils/pricing';

function estimateTotalCost(logs: APILog[]): number {
  let total = 0;
  for (const log of logs) {
    total += estimateCost(log.model, log.requestTokens, log.responseTokens);
  }
  return total;
}

function formatLatency(ms: number): string {
  if (ms >= 1000) return `${(ms / 1000).toFixed(1)}s`;
  return `${ms}ms`;
}

interface Props {
  conversationId: string;
  refreshKey: number;
}

const ConversationStats = ({ conversationId, refreshKey }: Props) => {
  const [logs, setLogs] = useState<APILog[]>([]);

  useEffect(() => {
    getLogsForConversation(conversationId).then(setLogs);
  }, [conversationId, refreshKey]);

  if (logs.length === 0) return null;

  const totalInput = logs.reduce((s, l) => s + l.requestTokens, 0);
  const totalOutput = logs.reduce((s, l) => s + l.responseTokens, 0);
  const totalTokens = totalInput + totalOutput;
  const avgLatency = Math.round(logs.reduce((s, l) => s + l.latencyMs, 0) / logs.length);
  const cost = estimateTotalCost(logs);
  const provider = logs[0].provider;
  const model = logs[0].model;

  const content = (
    <StatsContent>
      <StatsGrid>
        <StatItem>
          <StatLabel>API Calls</StatLabel>
          <StatValue>{logs.length}</StatValue>
        </StatItem>
        <StatItem>
          <StatLabel>Total Tokens</StatLabel>
          <StatValue>{formatTokens(totalTokens)}</StatValue>
        </StatItem>
        <StatItem>
          <StatLabel>Input Tokens</StatLabel>
          <StatValue>{formatTokens(totalInput)}</StatValue>
        </StatItem>
        <StatItem>
          <StatLabel>Output Tokens</StatLabel>
          <StatValue>{formatTokens(totalOutput)}</StatValue>
        </StatItem>
        <StatItem>
          <StatLabel>Est. Cost</StatLabel>
          <StatValue $highlight>{formatCost(cost)}</StatValue>
        </StatItem>
        <StatItem>
          <StatLabel>Avg Latency</StatLabel>
          <StatValue>{formatLatency(avgLatency)}</StatValue>
        </StatItem>
      </StatsGrid>
      <StatsMeta>
        {provider} / {model}
      </StatsMeta>
    </StatsContent>
  );

  return (
    <Popover content={content} title="Conversation Stats" trigger="click" placement="bottomRight">
      <StatsButton type="text" size="small" icon={<BarChartOutlined />}>
        <StatsLabel>{formatTokens(totalTokens)} · {formatCost(cost)}</StatsLabel>
      </StatsButton>
    </Popover>
  );
};

const StatsContent = styled.div`
  min-width: 240px;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px 24px;
`;

const StatItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const StatLabel = styled.span`
  font-size: 11px;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const StatValue = styled.span<{ $highlight?: boolean }>`
  font-size: 16px;
  font-weight: 600;
  color: ${(p) => (p.$highlight ? 'var(--color-primary)' : 'var(--color-text)')};
`;

const StatsMeta = styled.div`
  margin-top: 12px;
  padding-top: 8px;
  border-top: 1px solid var(--color-border-light);
  font-size: 12px;
  color: var(--color-text-muted);
`;

const StatsButton = styled(Button)`
  font-size: 12px;
  color: var(--color-text-muted);
  display: flex;
  align-items: center;
  gap: 4px;
`;

const StatsLabel = styled.span`
  @media (max-width: 480px) {
    display: none;
  }
`;

export default ConversationStats;
