import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { Modal, Empty, Tooltip } from 'antd';
import { ThunderboltOutlined, DatabaseOutlined } from '@ant-design/icons';
import { getUsageSummary, type UsageSummary } from '../../db/logs';
import { getStorageStats, type StorageStats } from '../../db/conversations';
import { estimateCost, formatCost, formatTokens } from '../../utils/pricing';

interface Props {
  open: boolean;
  onClose: () => void;
}

const PROVIDER_LABELS: Record<string, string> = {
  openai: 'OpenAI',
  anthropic: 'Anthropic',
  gemini: 'Google Gemini',
};

function formatLatency(ms: number): string {
  if (ms >= 1000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.round(ms)}ms`;
}

function formatDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

const STORAGE_CAP = 4 * 1024 * 1024 * 1024; // 4 GB

const UsageDashboard = ({ open, onClose }: Props) => {
  const [summary, setSummary] = useState<UsageSummary | null>(null);
  const [storage, setStorage] = useState<StorageStats | null>(null);

  useEffect(() => {
    if (open) {
      getUsageSummary().then(setSummary);
      getStorageStats().then(setStorage);
    }
  }, [open]);

  if (!summary) return null;

  const totalCostByModel = Object.entries(summary.byModel).reduce(
    (sum, [model, data]) => sum + estimateCost(model, data.requestTokens, data.responseTokens),
    0,
  );

  const avgLatency = summary.totalRequests > 0 ? Math.round(summary.totalLatencyMs / summary.totalRequests) : 0;

  const maxDayTokens =
    summary.byDay.length > 0 ? Math.max(...summary.byDay.map((d) => d.requestTokens + d.responseTokens)) : 0;

  const last14Days = summary.byDay.slice(-14);

  const isEmpty = summary.totalRequests === 0;

  return (
    <Modal
      title={null}
      open={open}
      onCancel={onClose}
      footer={null}
      width={640}
      centered
      styles={{ body: { maxHeight: '80vh', overflowY: 'auto' } }}
    >
      <Header>
        <HeaderIcon>
          <ThunderboltOutlined />
        </HeaderIcon>
        <div>
          <HeaderTitle>Token Usage</HeaderTitle>
          <HeaderSub>Global stats across all conversations</HeaderSub>
        </div>
      </Header>

      {isEmpty ? (
        <Empty description="No API calls recorded yet" style={{ padding: '40px 0' }} />
      ) : (
        <>
          <SummaryCards>
            <SummaryCard>
              <CardValue>{summary.totalRequests}</CardValue>
              <CardLabel>API Calls</CardLabel>
            </SummaryCard>
            <SummaryCard>
              <CardValue>{formatTokens(summary.totalRequestTokens + summary.totalResponseTokens)}</CardValue>
              <CardLabel>Total Tokens</CardLabel>
            </SummaryCard>
            <SummaryCard>
              <CardValue $highlight>{formatCost(totalCostByModel)}</CardValue>
              <CardLabel>Est. Cost</CardLabel>
            </SummaryCard>
            <SummaryCard>
              <CardValue>{formatLatency(avgLatency)}</CardValue>
              <CardLabel>Avg Latency</CardLabel>
            </SummaryCard>
          </SummaryCards>

          {last14Days.length > 1 && (
            <ChartSection>
              <SectionLabel>Daily Usage (last {last14Days.length} days)</SectionLabel>
              <Chart>
                {last14Days.map((day) => {
                  const total = day.requestTokens + day.responseTokens;
                  const pct = maxDayTokens > 0 ? (total / maxDayTokens) * 100 : 0;
                  return (
                    <Tooltip
                      key={day.date}
                      title={`${formatDate(day.date)}: ${formatTokens(total)} tokens, ${day.requests} calls`}
                    >
                      <BarWrapper>
                        <Bar $height={Math.max(pct, 2)} />
                        <BarLabel>{formatDate(day.date)}</BarLabel>
                      </BarWrapper>
                    </Tooltip>
                  );
                })}
              </Chart>
            </ChartSection>
          )}

          <TableSection>
            <SectionLabel>By Provider</SectionLabel>
            <StatsTable>
              <thead>
                <tr>
                  <Th>Provider</Th>
                  <Th $right>Calls</Th>
                  <Th $right>Input</Th>
                  <Th $right>Output</Th>
                  <Th $right>Total</Th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(summary.byProvider).map(([provider, data]) => (
                  <tr key={provider}>
                    <Td>{PROVIDER_LABELS[provider] || provider}</Td>
                    <Td $right>{data.requests}</Td>
                    <Td $right>{formatTokens(data.requestTokens)}</Td>
                    <Td $right>{formatTokens(data.responseTokens)}</Td>
                    <Td $right>{formatTokens(data.requestTokens + data.responseTokens)}</Td>
                  </tr>
                ))}
              </tbody>
            </StatsTable>
          </TableSection>

          <TableSection>
            <SectionLabel>By Model</SectionLabel>
            <StatsTable>
              <thead>
                <tr>
                  <Th>Model</Th>
                  <Th $right>Calls</Th>
                  <Th $right>Tokens</Th>
                  <Th $right>Est. Cost</Th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(summary.byModel)
                  .sort(([, a], [, b]) => b.requestTokens + b.responseTokens - (a.requestTokens + a.responseTokens))
                  .map(([model, data]) => (
                    <tr key={model}>
                      <Td>
                        <ModelName>{model}</ModelName>
                        <ModelProvider>{PROVIDER_LABELS[data.provider] || data.provider}</ModelProvider>
                      </Td>
                      <Td $right>{data.requests}</Td>
                      <Td $right>{formatTokens(data.requestTokens + data.responseTokens)}</Td>
                      <Td $right>{formatCost(estimateCost(model, data.requestTokens, data.responseTokens))}</Td>
                    </tr>
                  ))}
              </tbody>
            </StatsTable>
          </TableSection>

          <TokenBreakdown>
            <SectionLabel>Token Breakdown</SectionLabel>
            <BreakdownBar>
              <BreakdownSegment
                $type="input"
                $pct={(summary.totalRequestTokens / (summary.totalRequestTokens + summary.totalResponseTokens)) * 100}
              />
              <BreakdownSegment
                $type="output"
                $pct={(summary.totalResponseTokens / (summary.totalRequestTokens + summary.totalResponseTokens)) * 100}
              />
            </BreakdownBar>
            <BreakdownLegend>
              <LegendItem>
                <LegendDot $type="input" />
                Input: {formatTokens(summary.totalRequestTokens)}
              </LegendItem>
              <LegendItem>
                <LegendDot $type="output" />
                Output: {formatTokens(summary.totalResponseTokens)}
              </LegendItem>
            </BreakdownLegend>
          </TokenBreakdown>
        </>
      )}

      {storage &&
        (() => {
          const unlimited = localStorage.getItem('storage_unlimited') === 'true';
          const effectiveQuota =
            storage.quotaBytes != null
              ? unlimited
                ? storage.quotaBytes
                : Math.min(storage.quotaBytes, STORAGE_CAP)
              : null;
          const usageBytes = storage.usageBytes;

          return (
            <StorageSection>
              <SectionLabel>
                <DatabaseOutlined /> Local Storage
              </SectionLabel>
              <StorageGrid>
                <StorageStat>
                  <StorageValue>{storage.conversations}</StorageValue>
                  <StorageLabel>Conversations</StorageLabel>
                </StorageStat>
                <StorageStat>
                  <StorageValue>{storage.messages.toLocaleString()}</StorageValue>
                  <StorageLabel>Messages</StorageLabel>
                </StorageStat>
                <StorageStat>
                  <StorageValue>{storage.logs.toLocaleString()}</StorageValue>
                  <StorageLabel>API Logs</StorageLabel>
                </StorageStat>
                <StorageStat>
                  <StorageValue>{usageBytes != null ? formatBytes(usageBytes) : '—'}</StorageValue>
                  <StorageLabel>Used</StorageLabel>
                </StorageStat>
              </StorageGrid>
              {usageBytes != null && effectiveQuota != null && effectiveQuota > 0 && (
                <>
                  <StorageBarOuter>
                    <StorageBarInner $pct={Math.min((usageBytes / effectiveQuota) * 100, 100)} />
                  </StorageBarOuter>
                  <StorageCaption>
                    {formatBytes(usageBytes)} of {formatBytes(effectiveQuota)} used (
                    {((usageBytes / effectiveQuota) * 100).toFixed(1)}%)
                  </StorageCaption>
                </>
              )}
            </StorageSection>
          );
        })()}
    </Modal>
  );
};

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
`;

const HeaderIcon = styled.div`
  font-size: 24px;
  color: var(--color-primary);
`;

const HeaderTitle = styled.h2`
  font-size: 20px;
  font-weight: 700;
  color: var(--color-text);
  margin: 0;
`;

const HeaderSub = styled.p`
  font-size: 13px;
  color: var(--color-text-muted);
  margin: 0;
`;

const SummaryCards = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 24px;

  @media (max-width: 560px) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

const SummaryCard = styled.div`
  text-align: center;
  padding: 12px 8px;
  border-radius: 10px;
  background: var(--color-surface);
  border: 1px solid var(--color-border-light);
`;

const CardValue = styled.div<{ $highlight?: boolean }>`
  font-size: 18px;
  font-weight: 700;
  color: ${(p) => (p.$highlight ? 'var(--color-primary)' : 'var(--color-text)')};
  line-height: 1.2;
`;

const CardLabel = styled.div`
  font-size: 11px;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.4px;
`;

const SectionLabel = styled.h4`
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-secondary);
  margin: 0 0 10px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const ChartSection = styled.div`
  margin-bottom: 24px;
`;

const Chart = styled.div`
  display: flex;
  align-items: flex-end;
  gap: 4px;
  height: 120px;
  padding: 0 4px;
`;

const BarWrapper = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
  justify-content: flex-end;
  cursor: default;
`;

const Bar = styled.div<{ $height: number }>`
  width: 100%;
  max-width: 32px;
  height: ${(p) => p.$height}%;
  background: var(--color-primary);
  border-radius: 4px 4px 0 0;
  opacity: 0.75;
  transition: opacity 150ms;
  min-height: 2px;

  ${BarWrapper}:hover & {
    opacity: 1;
  }
`;

const BarLabel = styled.span`
  font-size: 9px;
  color: var(--color-text-muted);
  margin-top: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
  text-align: center;
`;

const TableSection = styled.div`
  margin-bottom: 20px;
`;

const StatsTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
`;

const Th = styled.th<{ $right?: boolean }>`
  text-align: ${(p) => (p.$right ? 'right' : 'left')};
  font-size: 11px;
  font-weight: 600;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.4px;
  padding: 6px 8px;
  border-bottom: 1px solid var(--color-border-light);
`;

const Td = styled.td<{ $right?: boolean }>`
  text-align: ${(p) => (p.$right ? 'right' : 'left')};
  padding: 8px;
  border-bottom: 1px solid var(--color-border-light);
  color: var(--color-text);
`;

const ModelName = styled.div`
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text);
`;

const ModelProvider = styled.div`
  font-size: 11px;
  color: var(--color-text-muted);
`;

const TokenBreakdown = styled.div`
  margin-bottom: 8px;
`;

const BreakdownBar = styled.div`
  display: flex;
  height: 10px;
  border-radius: 5px;
  overflow: hidden;
  background: var(--color-border-light);
`;

const BreakdownSegment = styled.div<{ $type: 'input' | 'output'; $pct: number }>`
  width: ${(p) => p.$pct}%;
  background: ${(p) => (p.$type === 'input' ? 'var(--color-primary)' : '#F59E0B')};
  opacity: ${(p) => (p.$type === 'input' ? 0.7 : 0.85)};
  transition: width 300ms ease;
`;

const BreakdownLegend = styled.div`
  display: flex;
  gap: 16px;
  margin-top: 8px;
`;

const LegendItem = styled.span`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--color-text-secondary);
`;

const LegendDot = styled.span<{ $type: 'input' | 'output' }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${(p) => (p.$type === 'input' ? 'var(--color-primary)' : '#F59E0B')};
  opacity: ${(p) => (p.$type === 'input' ? 0.7 : 0.85)};
`;

const StorageSection = styled.div`
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid var(--color-border-light);
`;

const StorageGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 12px;

  @media (max-width: 560px) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

const StorageStat = styled.div`
  text-align: center;
  padding: 8px;
  border-radius: 8px;
  background: var(--color-surface);
  border: 1px solid var(--color-border-light);
`;

const StorageValue = styled.div`
  font-size: 16px;
  font-weight: 700;
  color: var(--color-text);
`;

const StorageLabel = styled.div`
  font-size: 11px;
  color: var(--color-text-muted);
  margin-top: 2px;
`;

const StorageBarOuter = styled.div`
  height: 8px;
  border-radius: 4px;
  background: var(--color-border-light);
  overflow: hidden;
`;

const StorageBarInner = styled.div<{ $pct: number }>`
  height: 100%;
  border-radius: 4px;
  width: ${(p) => p.$pct}%;
  background: ${(p) => (p.$pct > 80 ? '#EF4444' : p.$pct > 50 ? '#F59E0B' : 'var(--color-primary)')};
  transition: width 300ms ease;
`;

const StorageCaption = styled.div`
  font-size: 12px;
  color: var(--color-text-muted);
  margin-top: 6px;
  text-align: center;
`;

export default UsageDashboard;
