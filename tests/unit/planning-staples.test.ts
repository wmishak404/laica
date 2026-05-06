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
      'parsley',
    ]);
  });

  it('represents each selected cuisine before filling remaining staple slots', () => {
    expect(getStapleCandidatesForCuisines(['Mediterranean', 'Thai', 'Indian'], [])).toEqual([
      'olive oil',
      'fish sauce',
      'garam masala',
      'lemon',
    ]);
  });

  it('lets shared staples represent overlapping cuisines before adding another cuisine', () => {
    expect(getStapleCandidatesForCuisines(['Mediterranean', 'Greek', 'Thai'], [])).toEqual([
      'olive oil',
      'fish sauce',
      'lemon',
      'feta',
    ]);
  });

  it('uses concrete herb staples instead of a vague fresh herbs label', () => {
    expect(getStapleCandidatesForCuisines(['Mediterranean'], [])).toContain('parsley');
    expect(getStapleCandidatesForCuisines(['French'], [])).toContain('parsley');
    expect(getStapleCandidatesForCuisines(['Vietnamese'], [])).toContain('cilantro');
    expect(getStapleCandidatesForCuisines(['Mediterranean', 'French', 'Vietnamese'], [])).not.toContain('fresh herbs');
  });

  it('filters concrete herb staples that are already saved', () => {
    expect(getStapleCandidatesForCuisines(['Mediterranean'], ['parsley'])).not.toContain('parsley');
    expect(getStapleCandidatesForCuisines(['Vietnamese'], ['cilantro'])).not.toContain('cilantro');
  });
});
