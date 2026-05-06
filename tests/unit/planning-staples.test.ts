import { describe, expect, it } from 'vitest';
import { getStapleCandidatesForCuisines } from '../../shared/planning-staples';

describe('planning staple candidates', () => {
  it('suggests Mediterranean olive oil when it is missing from pantry', () => {
    expect(getStapleCandidatesForCuisines(['Mediterranean'], ['rice', 'eggs', 'spinach'])).toContain('olive oil');
  });

  it('does not suggest olive oil when olive oil is already saved', () => {
    expect(getStapleCandidatesForCuisines(['Mediterranean'], ['extra virgin olive oil', 'eggs'])).not.toContain('olive oil');
  });

  it('does not suggest olive oil for East Asian cuisines', () => {
    const candidates = getStapleCandidatesForCuisines(['Korean', 'Japanese', 'Chinese'], ['rice', 'eggs']);

    expect(candidates).not.toContain('olive oil');
    expect(candidates).toContain('soy sauce');
  });

  it('dedupes multi-cuisine staples and caps the shortlist at four', () => {
    expect(getStapleCandidatesForCuisines(['Mediterranean', 'Greek'], ['rice'])).toEqual([
      'olive oil',
      'lemon',
      'feta',
      'fresh herbs',
    ]);
  });
});
