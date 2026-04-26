import OpenAI from 'openai';
import type { AIProvider, AIModel, AIResponse, SessionHandle, StreamCallbacks } from './types';

const SYSTEM_PROMPT =
  'You are a knowledgeable medical assistant. Analyze health data, explain medical test results, and provide clear, ' +
  'helpful interpretations. You ONLY discuss health and medical topics. If the user sends content that is not health ' +
  'or medical related, politely decline and remind them that this app is designed for health data analysis only. ' +
  'When the user sends attachments (marked with [Attachment:...]), evaluate whether the content is medical or ' +
  'health-related. If not, politely let the user know you can only analyze health-related documents. ' +
  'Always remind users that your analysis is not a substitute for professional medical advice.';

const OPENAI_MODELS: AIModel[] = [
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'openai', tier: 'fast' },
  { id: 'gpt-4o', name: 'GPT-4o', provider: 'openai', tier: 'standard' },
  { id: 'gpt-4.1-nano', name: 'GPT-4.1 Nano', provider: 'openai', tier: 'fast' },
  { id: 'gpt-4.1-mini', name: 'GPT-4.1 Mini', provider: 'openai', tier: 'fast' },
  { id: 'gpt-4.1', name: 'GPT-4.1', provider: 'openai', tier: 'standard' },
  { id: 'gpt-4.5-preview', name: 'GPT-4.5 Preview', provider: 'openai', tier: 'standard' },
  { id: 'gpt-5.3', name: 'GPT-5.3', provider: 'openai', tier: 'standard' },
  { id: 'gpt-5.3-codex', name: 'GPT-5.3 Codex', provider: 'openai', tier: 'reasoning' },
  { id: 'gpt-5.4', name: 'GPT-5.4', provider: 'openai', tier: 'standard' },
  { id: 'o3-mini', name: 'o3-mini', provider: 'openai', tier: 'reasoning' },
  { id: 'o3', name: 'o3', provider: 'openai', tier: 'reasoning' },
  { id: 'o4-mini', name: 'o4-mini', provider: 'openai', tier: 'reasoning' },
];

interface SessionData {
  model: string;
  history: { role: 'system' | 'user' | 'assistant'; content: string }[];
}

export class OpenAIProvider implements AIProvider {
  readonly name = 'OpenAI';
  readonly id = 'openai';
  readonly models = OPENAI_MODELS;

  private client: OpenAI | null = null;
  private sessions: Map<string, SessionData> = new Map();

  configure(apiKey: string): void {
    this.client = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });
  }

  isConfigured(): boolean {
    return this.client !== null;
  }

  async createSession(model: string, message: string, systemPrompt?: string): Promise<AIResponse> {
    if (!this.client) throw new Error('OpenAI not configured. Add your API key in Settings.');

    const history: SessionData['history'] = [
      { role: 'system', content: systemPrompt || SYSTEM_PROMPT },
      { role: 'user', content: message },
    ];

    const response = await this.client.chat.completions.create({ model, messages: history });
    const reply = response.choices[0]?.message?.content || '';

    const sessionId = crypto.randomUUID();
    history.push({ role: 'assistant', content: reply });
    this.sessions.set(sessionId, { model, history });

    return {
      session: { id: sessionId, provider: this.id },
      reply,
      usage: {
        requestTokens: response.usage?.prompt_tokens ?? 0,
        responseTokens: response.usage?.completion_tokens ?? 0,
      },
    };
  }

  async sendMessage(session: SessionHandle, message: string): Promise<AIResponse> {
    if (!this.client) throw new Error('OpenAI not configured.');

    const data = this.sessions.get(session.id);
    if (!data) throw new Error('Session not found.');

    data.history.push({ role: 'user', content: message });

    const response = await this.client.chat.completions.create({
      model: data.model,
      messages: data.history,
    });

    const reply = response.choices[0]?.message?.content || '';
    data.history.push({ role: 'assistant', content: reply });

    return {
      session,
      reply,
      usage: {
        requestTokens: response.usage?.prompt_tokens ?? 0,
        responseTokens: response.usage?.completion_tokens ?? 0,
      },
    };
  }

  async createSessionStream(
    model: string,
    message: string,
    systemPrompt: string | undefined,
    callbacks: StreamCallbacks
  ): Promise<AIResponse> {
    if (!this.client) throw new Error('OpenAI not configured. Add your API key in Settings.');

    const history: SessionData['history'] = [
      { role: 'system', content: systemPrompt || SYSTEM_PROMPT },
      { role: 'user', content: message },
    ];

    const stream = await this.client.chat.completions.create({
      model,
      messages: history,
      stream: true,
      stream_options: { include_usage: true },
    });

    let reply = '';
    let requestTokens = 0;
    let responseTokens = 0;

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content;
      if (delta) {
        reply += delta;
        callbacks.onDelta(delta);
      }
      // Usage arrives on the terminal chunk when include_usage is true
      if (chunk.usage) {
        requestTokens = chunk.usage.prompt_tokens ?? 0;
        responseTokens = chunk.usage.completion_tokens ?? 0;
      }
    }

    const sessionId = crypto.randomUUID();
    history.push({ role: 'assistant', content: reply });
    this.sessions.set(sessionId, { model, history });

    return {
      session: { id: sessionId, provider: this.id },
      reply,
      usage: { requestTokens, responseTokens },
    };
  }

  async sendMessageStream(
    session: SessionHandle,
    message: string,
    callbacks: StreamCallbacks
  ): Promise<AIResponse> {
    if (!this.client) throw new Error('OpenAI not configured.');

    const data = this.sessions.get(session.id);
    if (!data) throw new Error('Session not found.');

    data.history.push({ role: 'user', content: message });

    const stream = await this.client.chat.completions.create({
      model: data.model,
      messages: data.history,
      stream: true,
      stream_options: { include_usage: true },
    });

    let reply = '';
    let requestTokens = 0;
    let responseTokens = 0;

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content;
      if (delta) {
        reply += delta;
        callbacks.onDelta(delta);
      }
      if (chunk.usage) {
        requestTokens = chunk.usage.prompt_tokens ?? 0;
        responseTokens = chunk.usage.completion_tokens ?? 0;
      }
    }

    data.history.push({ role: 'assistant', content: reply });

    return {
      session,
      reply,
      usage: { requestTokens, responseTokens },
    };
  }

  async endSession(session: SessionHandle): Promise<void> {
    this.sessions.delete(session.id);
  }
}
