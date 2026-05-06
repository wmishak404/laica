export const MAX_STAPLE_CANDIDATES = 4;

export const CUISINE_STAPLE_CANDIDATES: Record<string, string[]> = {
  Italian: ['olive oil', 'parmesan', 'canned tomatoes', 'dried pasta'],
  Mediterranean: ['olive oil', 'lemon', 'feta', 'fresh herbs'],
  Greek: ['olive oil', 'lemon', 'oregano', 'feta'],
  Spanish: ['olive oil', 'paprika', 'canned tomatoes', 'rice'],
  French: ['butter', 'Dijon mustard', 'cream', 'fresh herbs'],
  Mexican: ['tortillas', 'lime', 'cilantro', 'cumin'],
  Korean: ['soy sauce', 'sesame oil', 'gochujang', 'rice vinegar'],
  Japanese: ['soy sauce', 'mirin', 'rice vinegar', 'miso'],
  Chinese: ['soy sauce', 'sesame oil', 'rice vinegar', 'cornstarch'],
  Thai: ['fish sauce', 'lime', 'coconut milk', 'curry paste'],
  Indian: ['garam masala', 'turmeric', 'cumin', 'ginger'],
  Vietnamese: ['fish sauce', 'lime', 'rice vinegar', 'fresh herbs'],
  American: ['butter', 'ketchup', 'mustard', 'hot sauce'],
  'Middle Eastern': ['tahini', 'lemon', 'cumin', 'yogurt'],
};

export function normalizeStapleKey(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\b([a-z0-9]+)['`\u2019]s\b/g, '$1')
    .replace(/['`\u2019]/g, '')
    .replace(/[-\u2010-\u2015_./]+/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function pantryHasStaple(pantryIngredients: string[], staple: string): boolean {
  const stapleKey = normalizeStapleKey(staple);
  if (!stapleKey) return false;

  return pantryIngredients.some((ingredient) => {
    const ingredientKey = normalizeStapleKey(ingredient);
    if (ingredientKey === stapleKey) return true;

    return stapleKey.includes(' ') && new RegExp(`\\b${stapleKey}\\b`).test(ingredientKey);
  });
}

export function getStapleCandidatesForCuisines(
  cuisines: string[],
  pantryIngredients: string[],
): string[] {
  const ranked = new Map<string, { label: string; count: number; firstIndex: number; firstCandidateIndex: number }>();

  cuisines.forEach((cuisine, cuisineIndex) => {
    CUISINE_STAPLE_CANDIDATES[cuisine]?.forEach((candidate, candidateIndex) => {
      const key = normalizeStapleKey(candidate);
      if (!key || pantryHasStaple(pantryIngredients, candidate)) return;

      const existing = ranked.get(key);
      if (existing) {
        existing.count += 1;
        return;
      }

      ranked.set(key, {
        label: candidate,
        count: 1,
        firstIndex: cuisineIndex,
        firstCandidateIndex: candidateIndex,
      });
    });
  });

  return Array.from(ranked.values())
    .sort((left, right) =>
      right.count - left.count ||
      left.firstIndex - right.firstIndex ||
      left.firstCandidateIndex - right.firstCandidateIndex
    )
    .slice(0, MAX_STAPLE_CANDIDATES)
    .map((candidate) => candidate.label);
}
