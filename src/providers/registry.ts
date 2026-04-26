import type { AIProvider } from './types';
import { OpenAIProvider } from './openai.provider';
import { AnthropicProvider } from './anthropic.provider';
import { GeminiProvider } from './gemini.provider';

const providers: Map<string, AIProvider> = new Map();

// Register built-in providers
const openai = new OpenAIProvider();
const anthropic = new AnthropicProvider();
const gemini = new GeminiProvider();
providers.set(openai.id, openai);
providers.set(anthropic.id, anthropic);
providers.set(gemini.id, gemini);

export function getProvider(id: string): AIProvider | undefined {
  return providers.get(id);
}

export function getAllProviders(): AIProvider[] {
  return Array.from(providers.values());
}

export function getConfiguredProviders(): AIProvider[] {
  return getAllProviders().filter((p) => p.isConfigured());
}

export function getModelByTier(
  providerId: string,
  tier: 'fast' | 'standard' | 'reasoning',
): string | undefined {
  const provider = getProvider(providerId);
  if (!provider) return undefined;
  return provider.models.find((m) => m.tier === tier)?.id;
}

/** Load saved API keys from localStorage and configure providers. */
export function initializeProviders(): void {
  for (const provider of getAllProviders()) {
    const key = localStorage.getItem(`provider_key_${provider.id}`);
    if (key) {
      provider.configure(key);
    }
  }

  // Also check env vars as fallbacks
  const openaiKey = import.meta.env.VITE_OPENAI_API_KEY;
  if (openaiKey && !openai.isConfigured()) {
    openai.configure(openaiKey);
  }

  const anthropicKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
  if (anthropicKey && !anthropic.isConfigured()) {
    anthropic.configure(anthropicKey);
  }

  const geminiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (geminiKey && !gemini.isConfigured()) {
    gemini.configure(geminiKey);
  }
}

/** Save an API key for a provider and configure it. */
export function setProviderKey(providerId: string, apiKey: string): void {
  localStorage.setItem(`provider_key_${providerId}`, apiKey);
  const provider = getProvider(providerId);
  if (provider) {
    provider.configure(apiKey);
  }
}

/** Remove an API key for a provider. */
export function removeProviderKey(providerId: string): void {
  localStorage.removeItem(`provider_key_${providerId}`);
  // Provider stays in memory until page reload — acceptable for BYOK
}

export { type AIProvider } from './types';
export type { AIModel, AIResponse, SessionHandle } from './types';
