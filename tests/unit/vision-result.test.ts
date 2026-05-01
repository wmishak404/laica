import { describe, expect, it } from 'vitest';
import {
  TEXT_ONLY_DOCUMENT_REJECTION_CODE,
  extractVisionLabels,
  getVisionRejectionFeedback,
  isRejectedVisionResult,
} from '../../client/src/lib/visionResult';

describe('client vision result helpers', () => {
  it('does not extract labels from rejected text-only results', () => {
    const result = {
      rejected: true,
      rejectionCode: TEXT_ONLY_DOCUMENT_REJECTION_CODE,
      ingredients: ['milk'],
      equipment: ['knife'],
    };

    expect(isRejectedVisionResult(result)).toBe(true);
    expect(extractVisionLabels(result, 'pantry')).toEqual([]);
    expect(extractVisionLabels(result, 'kitchen')).toEqual([]);
  });

  it('extracts visible physical product labels from normal scan arrays', () => {
    const result = {
      rejected: false,
      ingredients: [{ name: ' Boxed Pasta ' }, ' olive oil '],
      equipment: [{ equipment: 'Chef Knife' }],
    };

    expect(extractVisionLabels(result, 'pantry')).toEqual(['boxed pasta', 'olive oil']);
    expect(extractVisionLabels(result, 'kitchen')).toEqual(['chef knife']);
  });

  it('provides manual-entry guidance for rejected scans', () => {
    const feedback = getVisionRejectionFeedback(
      { rejected: true, rejectionCode: TEXT_ONLY_DOCUMENT_REJECTION_CODE },
      'pantry',
    );

    expect(feedback.title).toBe('Photo needs visible pantry items');
    expect(feedback.description).toContain('enter them manually');
  });
});
