import { describe, expect, it } from 'vitest';
import {
  AIProviderQuotaError,
  isOpenAIInsufficientQuotaError,
  throwOpenAIProviderError,
} from '../../server/ai-errors';

describe('AI provider error helpers', () => {
  it('detects OpenAI insufficient_quota error shapes', () => {
    expect(isOpenAIInsufficientQuotaError({
      status: 429,
      code: 'insufficient_quota',
      error: {
        type: 'insufficient_quota',
        code: 'insufficient_quota',
      },
    })).toBe(true);
  });

  it('throws a typed provider quota error while preserving generic fallbacks', () => {
    expect(() => throwOpenAIProviderError({
      error: { code: 'insufficient_quota' },
    }, 'fallback')).toThrow(AIProviderQuotaError);

    expect(() => throwOpenAIProviderError(new Error('network down'), 'fallback')).toThrow('fallback');
  });
});
