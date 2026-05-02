import { describe, it, expect } from 'vitest';
import { estimateCost, formatCost, formatTokens, MODEL_PRICING } from './pricing';

describe('estimateCost', () => {
  it('returns 0 for unknown models', () => {
    expect(estimateCost('unknown-model', 1_000_000, 1_000_000)).toBe(0);
  });

  it('computes cost from token counts and MODEL_PRICING', () => {
    const model = 'gpt-4o-mini';
    const rates = MODEL_PRICING[model];
    expect(
      estimateCost(model, 1_000_000, 2_000_000),
    ).toBeCloseTo(rates.input + 2 * rates.output, 10);
  });
});

describe('formatCost', () => {
  it('formats zero', () => {
    expect(formatCost(0)).toBe('$0.00');
  });

  it('shows floor for tiny positive amounts', () => {
    expect(formatCost(0.001)).toBe('<$0.01');
  });

  it('formats dollars with two decimals', () => {
    expect(formatCost(1.5)).toBe('$1.50');
  });
});

describe('formatTokens', () => {
  it('returns plain number below 1K', () => {
    expect(formatTokens(999)).toBe('999');
  });

  it('formats thousands', () => {
    expect(formatTokens(1500)).toBe('1.5K');
  });

  it('formats millions', () => {
    expect(formatTokens(2_200_000)).toBe('2.2M');
  });
});
