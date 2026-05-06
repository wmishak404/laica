import { describe, expect, it } from 'vitest';
import {
  normalizeAdditionalIngredientsNeeded,
  normalizeRecipeSuggestionsResponse,
} from '../../server/recipe-suggestion-normalizer';

describe('recipe suggestion optional ingredient cleanup', () => {
  it('removes universal staples from optional ingredients', () => {
    expect(normalizeAdditionalIngredientsNeeded([
      'salt',
      'black pepper',
      'water',
      'neutral cooking oil',
      'lemon',
    ])).toEqual(['lemon']);
  });

  it('keeps cuisine-specific staples when returned', () => {
    expect(normalizeAdditionalIngredientsNeeded([
      'olive oil',
      'soy sauce',
      'sesame oil',
    ])).toEqual(['olive oil', 'soy sauce', 'sesame oil']);
  });

  it('dedupes and caps optional ingredients at three', () => {
    expect(normalizeAdditionalIngredientsNeeded([
      'lemon',
      'Lemon',
      'fresh herbs',
      'feta',
      'yogurt',
    ])).toEqual(['lemon', 'fresh herbs', 'feta']);
  });

  it('normalizes every recipe in a recipe suggestion response', () => {
    expect(normalizeRecipeSuggestionsResponse({
      recipes: [
        { recipeName: 'One', additionalIngredientsNeeded: ['salt', 'lemon'] },
        { recipeName: 'Two', additionalIngredientsNeeded: ['water', 'olive oil'] },
      ],
    })).toEqual({
      recipes: [
        { recipeName: 'One', additionalIngredientsNeeded: ['lemon'] },
        { recipeName: 'Two', additionalIngredientsNeeded: ['olive oil'] },
      ],
    });
  });
});
