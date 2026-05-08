export interface ProfileReadinessInput {
  cookingSkill?: string | null;
  dietaryRestrictions?: string[] | null;
  pantryIngredients?: string[] | null;
  kitchenEquipment?: string[] | null;
  favoriteChefs?: string[] | null;
}

export const hasCompletedCookingProfile = (profile: ProfileReadinessInput | null | undefined) =>
  Boolean(
    profile?.cookingSkill &&
    (profile.dietaryRestrictions?.length ?? 0) > 0
  );

export const hasAnySavedProfileSignal = (profile: ProfileReadinessInput | null | undefined) =>
  Boolean(
    hasCompletedCookingProfile(profile) ||
    (profile?.pantryIngredients?.length ?? 0) > 0 ||
    (profile?.kitchenEquipment?.length ?? 0) > 0 ||
    (profile?.favoriteChefs?.length ?? 0) > 0
  );
