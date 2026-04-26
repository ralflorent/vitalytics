import Anthropic from '@anthropic-ai/sdk';
import type { AIProvider, AIModel, AIResponse, SessionHandle, StreamCallbacks } from './types';

const ANTHROPIC_MODELS: AIModel[] = [
  { id: 'claude-haiku-4-5-20251001', name: 'Claude Haiku 4.5', provider: 'anthropic', tier: 'fast' },
  { id: 'claude-sonnet-4-6-20250514', name: 'Claude Sonnet 4.6', provider: 'anthropic', tier: 'standard' },
  { id: 'claude-opus-4-6-20250514', name: 'Claude Opus 4.6', provider: 'anthropic', tier: 'reasoning' },
];

const SYSTEM_PROMPT =
  'You are a knowledgeable medical assistant. Analyze health data, explain medical test results, and provide clear, ' +
  'helpful interpretations. You ONLY discuss health and medical topics. If the user sends content that is not health ' +
  'or medical related, politely decline and remind them that this app is designed for health data analysis only. ' +
  'When the user sends attachments (marked with [Attachment:...]), evaluate whether the content is medical or ' +
  'health-related. If not, politely let the user know you can only analyze health-related documents. ' +
  'Always remind users that your analysis is not a substitute for professional medical advice.';

interface MessageEntry {
  role: 'user' | 'assistant';
  content: string;
}

export class AnthropicProvider implements AIProvider {
  readonly name = 'Anthropic';
  readonly id = 'anthropic';
  readonly models = ANTHROPIC_MODELS;

  private client: Anthropic | null = null;
  private sessions: Map<string, { model: string; history: MessageEntry[] }> = new Map();

  configure(apiKey: string): void {
    this.client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
  }

  isConfigured(): boolean {
    return this.client !== null;
  }

  async createSession(model: string, message: string, systemPrompt?: string): Promise<AIResponse> {
    if (!this.client) throw new Error('Anthropic not configured. Add your API key in Settings.');

    const response = await this.client.messages.create({
      model,
      max_tokens: 4096,
      system: systemPrompt || SYSTEM_PROMPT,
      messages: [{ role: 'user', content: message }],
    });

    const reply = response.content[0]?.type === 'text' ? response.content[0].text : '';
    const sessionId = crypto.randomUUID();

    this.sessions.set(sessionId, {
      model,
      history: [
        { role: 'user', content: message },
        { role: 'assistant', content: reply },
      ],
    });

    return {
      session: { id: sessionId, provider: this.id },
      reply,
      usage: {
        requestTokens: response.usage?.input_tokens ?? 0,
        responseTokens: response.usage?.output_tokens ?? 0,
      },
    };
  }

  async sendMessage(session: SessionHandle, message: string): Promise<AIResponse> {
    if (!this.client) throw new Error('Anthropic not configured.');

    const data = this.sessions.get(session.id);
    if (!data) throw new Error('Session not found.');

    data.history.push({ role: 'user', content: message });

    const response = await this.client.messages.create({
      model: data.model,
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: data.history,
    });

    const reply = response.content[0]?.type === 'text' ? response.content[0].text : '';
    data.history.push({ role: 'assistant', content: reply });

    return {
      session,
      reply,
      usage: {
        requestTokens: response.usage?.input_tokens ?? 0,
        responseTokens: response.usage?.output_tokens ?? 0,
      },
    };
  }

  async createSessionStream(
    model: string,
    message: string,
    systemPrompt: string | undefined,
    callbacks: StreamCallbacks
  ): Promise<AIResponse> {
    if (!this.client) throw new Error('Anthropic not configured. Add your API key in Settings.');

    const stream = this.client.messages.stream({
      model,
      max_tokens: 4096,
      system: systemPrompt || SYSTEM_PROMPT,
      messages: [{ role: 'user', content: message }],
    });

    stream.on('text', (delta) => {
      if (delta) callbacks.onDelta(delta);
    });

    const final = await stream.finalMessage();
    const reply = final.content[0]?.type === 'text' ? final.content[0].text : '';
    const sessionId = crypto.randomUUID();

    this.sessions.set(sessionId, {
      model,
      history: [
        { role: 'user', content: message },
        { role: 'assistant', content: reply },
      ],
    });

    return {
      session: { id: sessionId, provider: this.id },
      reply,
      usage: {
        requestTokens: final.usage?.input_tokens ?? 0,
        responseTokens: final.usage?.output_tokens ?? 0,
      },
    };
  }

  async sendMessageStream(
    session: SessionHandle,
    message: string,
    callbacks: StreamCallbacks
  ): Promise<AIResponse> {
    if (!this.client) throw new Error('Anthropic not configured.');

    const data = this.sessions.get(session.id);
    if (!data) throw new Error('Session not found.');

    data.history.push({ role: 'user', content: message });

    const stream = this.client.messages.stream({
      model: data.model,
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: data.history,
    });

    stream.on('text', (delta) => {
      if (delta) callbacks.onDelta(delta);
    });

    const final = await stream.finalMessage();
    const reply = final.content[0]?.type === 'text' ? final.content[0].text : '';
    data.history.push({ role: 'assistant', content: reply });

    return {
      session,
      reply,
      usage: {
        requestTokens: final.usage?.input_tokens ?? 0,
        responseTokens: final.usage?.output_tokens ?? 0,
      },
    };
  }

  async endSession(session: SessionHandle): Promise<void> {
    this.sessions.delete(session.id);
  }
}
