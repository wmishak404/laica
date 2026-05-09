import { describe, expect, it } from 'vitest';
import { hasAnySavedProfileSignal, hasCompletedCookingProfile } from '../../client/src/lib/profileReadiness';

describe('profile readiness', () => {
  it('treats an empty pantry as valid for a returning user with a completed cooking profile', () => {
    const profile = {
      cookingSkill: 'Intermediate',
      dietaryRestrictions: ['No restrictions'],
      pantryIngredients: [],
      kitchenEquipment: ['skillet'],
      favoriteChefs: [],
    };

    expect(hasCompletedCookingProfile(profile)).toBe(true);
    expect(hasAnySavedProfileSignal(profile)).toBe(true);
  });

  it('keeps a fully blank profile in first-time setup', () => {
    expect(hasCompletedCookingProfile({
      cookingSkill: '',
      dietaryRestrictions: [],
      pantryIngredients: [],
      kitchenEquipment: [],
      favoriteChefs: [],
    })).toBe(false);
    expect(hasAnySavedProfileSignal(null)).toBe(false);
  });
});
