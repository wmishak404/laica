interface PlanningProfileFingerprintInput {
  cookingSkill?: string | null;
  dietaryRestrictions?: string[] | null;
  pantryIngredients?: string[] | null;
  kitchenEquipment?: string[] | null;
  favoriteChefs?: string[] | null;
}

export const ACTIVE_COOKING_PLAN_STORAGE_KEY = 'laica_active_cooking_plan';
export const MEAL_PLANNING_STORAGE_KEY = 'laica_meal_planning_session_v2';
export const COOKING_SESSION_STORAGE_KEY = 'laica_cooking_session';

const normalizeFingerprintValue = (value: string) =>
  value.trim().replace(/\s+/g, ' ').toLocaleLowerCase();

const normalizeFingerprintList = (values: string[] | null | undefined) =>
  Array.from(new Set(
    (values || [])
      .map(normalizeFingerprintValue)
      .filter(Boolean)
  )).sort();

export function createPlanningProfileFingerprint(profile: PlanningProfileFingerprintInput): string {
  return JSON.stringify({
    cookingSkill: normalizeFingerprintValue(profile.cookingSkill || ''),
    dietaryRestrictions: normalizeFingerprintList(profile.dietaryRestrictions),
    pantryIngredients: normalizeFingerprintList(profile.pantryIngredients),
    kitchenEquipment: normalizeFingerprintList(profile.kitchenEquipment),
    favoriteChefs: normalizeFingerprintList(profile.favoriteChefs),
  });
}

export function planningProfileFingerprintsMatch(
  left: PlanningProfileFingerprintInput,
  right: PlanningProfileFingerprintInput,
) {
  return createPlanningProfileFingerprint(left) === createPlanningProfileFingerprint(right);
}

export function clearScopedMealPlanningSession(scopeKey: string) {
  if (typeof window === 'undefined') return;

  window.localStorage.removeItem(`${MEAL_PLANNING_STORAGE_KEY}:${scopeKey}`);
}

export function clearScopedCookingSession(scopeKey: string) {
  if (typeof window === 'undefined') return;

  window.localStorage.removeItem(`${COOKING_SESSION_STORAGE_KEY}:${scopeKey}`);
}
