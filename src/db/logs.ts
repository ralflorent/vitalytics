import { db } from './index';

export interface APILog {
  id: string;
  conversationId: string;
  timestamp: number;
  provider: string;
  model: string;
  requestTokens: number;
  responseTokens: number;
  latencyMs: number;
  status: 'success' | 'error';
  error?: string;
}

export async function addLog(log: Omit<APILog, 'id'>): Promise<APILog> {
  const entry: APILog = { ...log, id: crypto.randomUUID() };
  await db.logs.add(entry);
  return entry;
}

export async function getLogsForConversation(conversationId: string): Promise<APILog[]> {
  return db.logs.where('conversationId').equals(conversationId).sortBy('timestamp');
}

export async function getAllLogs(): Promise<APILog[]> {
  return db.logs.orderBy('timestamp').reverse().toArray();
}

export interface UsageBucket {
  requests: number;
  requestTokens: number;
  responseTokens: number;
}

export interface UsageSummary {
  totalRequests: number;
  totalRequestTokens: number;
  totalResponseTokens: number;
  totalLatencyMs: number;
  byProvider: Record<string, UsageBucket>;
  byModel: Record<string, UsageBucket & { provider: string }>;
  byDay: { date: string; requests: number; requestTokens: number; responseTokens: number }[];
}

export async function getUsageSummary(): Promise<UsageSummary> {
  const logs = await getAllLogs();
  const byProvider: Record<string, UsageBucket> = {};
  const byModel: Record<string, UsageBucket & { provider: string }> = {};
  const dayMap: Record<string, { requests: number; requestTokens: number; responseTokens: number }> = {};

  let totalRequests = 0;
  let totalRequestTokens = 0;
  let totalResponseTokens = 0;
  let totalLatencyMs = 0;

  for (const log of logs) {
    totalRequests++;
    totalRequestTokens += log.requestTokens;
    totalResponseTokens += log.responseTokens;
    totalLatencyMs += log.latencyMs;

    if (!byProvider[log.provider]) {
      byProvider[log.provider] = { requests: 0, requestTokens: 0, responseTokens: 0 };
    }
    byProvider[log.provider].requests++;
    byProvider[log.provider].requestTokens += log.requestTokens;
    byProvider[log.provider].responseTokens += log.responseTokens;

    if (!byModel[log.model]) {
      byModel[log.model] = { requests: 0, requestTokens: 0, responseTokens: 0, provider: log.provider };
    }
    byModel[log.model].requests++;
    byModel[log.model].requestTokens += log.requestTokens;
    byModel[log.model].responseTokens += log.responseTokens;

    const day = new Date(log.timestamp).toISOString().slice(0, 10);
    if (!dayMap[day]) {
      dayMap[day] = { requests: 0, requestTokens: 0, responseTokens: 0 };
    }
    dayMap[day].requests++;
    dayMap[day].requestTokens += log.requestTokens;
    dayMap[day].responseTokens += log.responseTokens;
  }

  const byDay = Object.entries(dayMap)
    .map(([date, data]) => ({ date, ...data }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return { totalRequests, totalRequestTokens, totalResponseTokens, totalLatencyMs, byProvider, byModel, byDay };
}
