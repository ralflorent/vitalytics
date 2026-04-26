export interface ModelPricing {
  input: number;   // USD per 1M tokens
  output: number;  // USD per 1M tokens
}

// Approximate pricing per 1M tokens (USD) — updated 2025-Q2
export const MODEL_PRICING: Record<string, ModelPricing> = {
  // OpenAI
  'gpt-4o-mini':                  { input: 0.15,  output: 0.60  },
  'gpt-4o':                       { input: 2.50,  output: 10.00 },
  'o3-mini':                      { input: 1.10,  output: 4.40  },
  // Anthropic
  'claude-haiku-4-5-20251001':    { input: 0.80,  output: 4.00  },
  'claude-sonnet-4-6-20250514':   { input: 3.00,  output: 15.00 },
  'claude-opus-4-6-20250514':     { input: 15.00, output: 75.00 },
  // Google Gemini
  'gemini-2.5-flash':             { input: 0.15,  output: 0.60  },
  'gemini-2.0-flash':             { input: 0.10,  output: 0.40  },
  'gemini-2.5-pro':               { input: 1.25,  output: 10.00 },
};

export function estimateCost(
  model: string,
  requestTokens: number,
  responseTokens: number,
): number {
  const rates = MODEL_PRICING[model];
  if (!rates) return 0;
  return (requestTokens / 1_000_000) * rates.input +
         (responseTokens / 1_000_000) * rates.output;
}

export function formatCost(cost: number): string {
  if (cost === 0) return '$0.00';
  if (cost < 0.01) return '<$0.01';
  return `$${cost.toFixed(2)}`;
}

export function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}
