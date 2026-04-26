export interface AIModel {
  id: string;
  name: string;
  provider: string;
  tier: 'fast' | 'standard' | 'reasoning';
}

export interface SessionHandle {
  id: string;
  provider: string;
}

export interface AIMessage {
  role: 'user' | 'assistant';
  text: string;
}

export interface AIResponse {
  session: SessionHandle;
  reply: string;
  usage: { requestTokens: number; responseTokens: number };
}

export interface StreamCallbacks {
  /** Fired for each token/chunk as it arrives from the provider. */
  onDelta: (chunk: string) => void;
  /** Optional abort signal — reserved for future cancel support. */
  signal?: AbortSignal;
}

export interface AIProvider {
  readonly name: string;
  readonly id: string;
  readonly models: AIModel[];

  /** Initialize the provider with an API key. */
  configure(apiKey: string): void;

  /** Returns true if the provider has a valid API key configured. */
  isConfigured(): boolean;

  /** Start a new conversation session and send the first message. */
  createSession(model: string, message: string, systemPrompt?: string): Promise<AIResponse>;

  /** Streaming variant of createSession. Resolves with the final AIResponse once the stream completes. */
  createSessionStream(
    model: string,
    message: string,
    systemPrompt: string | undefined,
    callbacks: StreamCallbacks
  ): Promise<AIResponse>;

  /** Send a follow-up message in an existing session. */
  sendMessage(session: SessionHandle, message: string): Promise<AIResponse>;

  /** Streaming variant of sendMessage. Resolves with the final AIResponse once the stream completes. */
  sendMessageStream(
    session: SessionHandle,
    message: string,
    callbacks: StreamCallbacks
  ): Promise<AIResponse>;

  /** Clean up a session (optional — not all providers need it). */
  endSession?(session: SessionHandle): Promise<void>;
}
