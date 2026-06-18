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
export const MEAL_PLANNING_SESSION_MAX_AGE_MS = 24 * 60 * 60 * 1000;

export type MealPlanningStep = 'time' | 'cuisine' | 'staples' | 'tickets' | 'prep-tray';

export interface ActiveMealPlanningSession {
  currentStep: MealPlanningStep;
  savedAt: number;
  profileFingerprint: string;
}

export const isMealPlanningStep = (value: unknown): value is MealPlanningStep =>
  value === 'time' || value === 'cuisine' || value === 'staples' || value === 'tickets' || value === 'prep-tray';

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

export function readActiveMealPlanningSession(
  scopeKey: string,
  profileFingerprint: string,
): ActiveMealPlanningSession | null {
  if (typeof window === 'undefined') return null;

  const storageKey = `${MEAL_PLANNING_STORAGE_KEY}:${scopeKey}`;

  try {
    window.localStorage.removeItem(MEAL_PLANNING_STORAGE_KEY);

    const rawSession = window.localStorage.getItem(storageKey);
    if (!rawSession) return null;

    const parsed = JSON.parse(rawSession) as Partial<{
      currentStep: unknown;
      recommendations: unknown;
      savedAt: unknown;
      profileFingerprint: unknown;
    }>;
    if (!isMealPlanningStep(parsed.currentStep)) {
      window.localStorage.removeItem(storageKey);
      return null;
    }

    const savedAt = typeof parsed.savedAt === 'number' && Number.isFinite(parsed.savedAt)
      ? parsed.savedAt
      : 0;
    const isRecent = Date.now() - savedAt < MEAL_PLANNING_SESSION_MAX_AGE_MS;
    const matchesProfile = parsed.profileFingerprint === profileFingerprint;
    const recommendationCount = Array.isArray(parsed.recommendations) ? parsed.recommendations.length : 0;
    const hasProgress = parsed.currentStep !== 'time' || recommendationCount > 0;

    if (!isRecent || !matchesProfile || !hasProgress) {
      window.localStorage.removeItem(storageKey);
      return null;
    }

    return {
      currentStep: parsed.currentStep,
      savedAt,
      profileFingerprint,
    };
  } catch {
    window.localStorage.removeItem(storageKey);
    return null;
  }
}

export function clearScopedCookingSession(scopeKey: string) {
  if (typeof window === 'undefined') return;

  window.localStorage.removeItem(`${COOKING_SESSION_STORAGE_KEY}:${scopeKey}`);
}
