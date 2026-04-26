import { GoogleGenAI } from '@google/genai';
import type { AIProvider, AIModel, AIResponse, SessionHandle, StreamCallbacks } from './types';

const GEMINI_MODELS: AIModel[] = [
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', provider: 'gemini', tier: 'fast' },
  { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', provider: 'gemini', tier: 'standard' },
  { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', provider: 'gemini', tier: 'reasoning' },
];

const SYSTEM_PROMPT =
  'You are a knowledgeable medical assistant. Analyze health data, explain medical test results, and provide clear, ' +
  'helpful interpretations. You ONLY discuss health and medical topics. If the user sends content that is not health ' +
  'or medical related, politely decline and remind them that this app is designed for health data analysis only. ' +
  'When the user sends attachments (marked with [Attachment:...]), evaluate whether the content is medical or ' +
  'health-related. If not, politely let the user know you can only analyze health-related documents. ' +
  'Always remind users that your analysis is not a substitute for professional medical advice.';

// Gemini content shape — note: role is 'user' | 'model' (not 'assistant')
interface GeminiContent {
  role: 'user' | 'model';
  parts: { text: string }[];
}

interface SessionData {
  model: string;
  systemInstruction: string;
  history: GeminiContent[];
}

function extractText(response: { text?: string | (() => string); candidates?: unknown[] }): string {
  // The SDK exposes `.text` as a getter on both full responses and stream chunks.
  if (typeof response.text === 'string') return response.text;
  if (typeof response.text === 'function') return response.text() || '';
  return '';
}

export class GeminiProvider implements AIProvider {
  readonly name = 'Gemini';
  readonly id = 'gemini';
  readonly models = GEMINI_MODELS;

  private client: GoogleGenAI | null = null;
  private sessions: Map<string, SessionData> = new Map();

  configure(apiKey: string): void {
    this.client = new GoogleGenAI({ apiKey });
  }

  isConfigured(): boolean {
    return this.client !== null;
  }

  async createSession(model: string, message: string, systemPrompt?: string): Promise<AIResponse> {
    if (!this.client) throw new Error('Gemini not configured. Add your API key in Settings.');

    const systemInstruction = systemPrompt || SYSTEM_PROMPT;
    const contents: GeminiContent[] = [{ role: 'user', parts: [{ text: message }] }];

    const response = await this.client.models.generateContent({
      model,
      contents,
      config: { systemInstruction },
    });

    const reply = extractText(response);
    const sessionId = crypto.randomUUID();

    this.sessions.set(sessionId, {
      model,
      systemInstruction,
      history: [...contents, { role: 'model', parts: [{ text: reply }] }],
    });

    return {
      session: { id: sessionId, provider: this.id },
      reply,
      usage: {
        requestTokens: response.usageMetadata?.promptTokenCount ?? 0,
        responseTokens: response.usageMetadata?.candidatesTokenCount ?? 0,
      },
    };
  }

  async sendMessage(session: SessionHandle, message: string): Promise<AIResponse> {
    if (!this.client) throw new Error('Gemini not configured.');

    const data = this.sessions.get(session.id);
    if (!data) throw new Error('Session not found.');

    data.history.push({ role: 'user', parts: [{ text: message }] });

    const response = await this.client.models.generateContent({
      model: data.model,
      contents: data.history,
      config: { systemInstruction: data.systemInstruction },
    });

    const reply = extractText(response);
    data.history.push({ role: 'model', parts: [{ text: reply }] });

    return {
      session,
      reply,
      usage: {
        requestTokens: response.usageMetadata?.promptTokenCount ?? 0,
        responseTokens: response.usageMetadata?.candidatesTokenCount ?? 0,
      },
    };
  }

  async createSessionStream(
    model: string,
    message: string,
    systemPrompt: string | undefined,
    callbacks: StreamCallbacks
  ): Promise<AIResponse> {
    if (!this.client) throw new Error('Gemini not configured. Add your API key in Settings.');

    const systemInstruction = systemPrompt || SYSTEM_PROMPT;
    const contents: GeminiContent[] = [{ role: 'user', parts: [{ text: message }] }];

    const stream = await this.client.models.generateContentStream({
      model,
      contents,
      config: { systemInstruction },
    });

    let reply = '';
    let requestTokens = 0;
    let responseTokens = 0;

    for await (const chunk of stream) {
      const delta = extractText(chunk);
      if (delta) {
        reply += delta;
        callbacks.onDelta(delta);
      }
      // Usage arrives on the terminal chunk
      if (chunk.usageMetadata) {
        requestTokens = chunk.usageMetadata.promptTokenCount ?? requestTokens;
        responseTokens = chunk.usageMetadata.candidatesTokenCount ?? responseTokens;
      }
    }

    const sessionId = crypto.randomUUID();
    this.sessions.set(sessionId, {
      model,
      systemInstruction,
      history: [...contents, { role: 'model', parts: [{ text: reply }] }],
    });

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
    if (!this.client) throw new Error('Gemini not configured.');

    const data = this.sessions.get(session.id);
    if (!data) throw new Error('Session not found.');

    data.history.push({ role: 'user', parts: [{ text: message }] });

    const stream = await this.client.models.generateContentStream({
      model: data.model,
      contents: data.history,
      config: { systemInstruction: data.systemInstruction },
    });

    let reply = '';
    let requestTokens = 0;
    let responseTokens = 0;

    for await (const chunk of stream) {
      const delta = extractText(chunk);
      if (delta) {
        reply += delta;
        callbacks.onDelta(delta);
      }
      if (chunk.usageMetadata) {
        requestTokens = chunk.usageMetadata.promptTokenCount ?? requestTokens;
        responseTokens = chunk.usageMetadata.candidatesTokenCount ?? responseTokens;
      }
    }

    data.history.push({ role: 'model', parts: [{ text: reply }] });

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
