import { describe, expect, it } from 'vitest';
import {
  TEXT_ONLY_DOCUMENT_REJECTION_CODE,
  normalizeVisionAnalysisResult,
} from '../../server/vision/analysis-result';

describe('vision analysis result normalization', () => {
  it('empties ingredient and equipment arrays for text-only document rejections', () => {
    const result = normalizeVisionAnalysisResult({
      ingredients: ['milk'],
      equipment: ['oven'],
      rejected: true,
      rejectionCode: 'text-only-document',
    });

    expect(result.ingredients).toEqual([]);
    expect(result.equipment).toEqual([]);
    expect(result.rejected).toBe(true);
    expect(result.rejectionCode).toBe(TEXT_ONLY_DOCUMENT_REJECTION_CODE);
    expect(result.rejectionMessage).toContain("screenshots");
  });

  it('preserves normal physical product detections', () => {
    const result = normalizeVisionAnalysisResult({
      ingredients: ['boxed pasta'],
      equipment: [],
      rejected: false,
    });

    expect(result.ingredients).toEqual(['boxed pasta']);
    expect(result.equipment).toEqual([]);
    expect(result.rejected).toBe(false);
  });
});
