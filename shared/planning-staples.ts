export const MAX_STAPLE_CANDIDATES = 4;

export const CUISINE_STAPLE_CANDIDATES: Record<string, string[]> = {
  Italian: ['olive oil', 'parmesan', 'canned tomatoes', 'dried pasta'],
  Mediterranean: ['olive oil', 'lemon', 'feta', 'parsley'],
  Greek: ['olive oil', 'lemon', 'oregano', 'feta'],
  Spanish: ['olive oil', 'paprika', 'canned tomatoes', 'rice'],
  French: ['butter', 'Dijon mustard', 'cream', 'parsley'],
  Mexican: ['tortillas', 'lime', 'cilantro', 'cumin'],
  Korean: ['soy sauce', 'sesame oil', 'gochujang', 'rice vinegar'],
  Japanese: ['soy sauce', 'mirin', 'rice vinegar', 'miso'],
  Chinese: ['soy sauce', 'sesame oil', 'rice vinegar', 'cornstarch'],
  Thai: ['fish sauce', 'lime', 'coconut milk', 'curry paste'],
  Indian: ['garam masala', 'turmeric', 'cumin', 'ginger'],
  Vietnamese: ['fish sauce', 'lime', 'rice vinegar', 'cilantro'],
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

type StapleCandidate = {
  key: string;
  label: string;
  count: number;
  firstIndex: number;
  firstCandidateIndex: number;
  cuisineIndices: Set<number>;
};

function pantryHasStaple(pantryIngredients: string[], staple: string): boolean {
  const stapleKey = normalizeStapleKey(staple);
  if (!stapleKey) return false;

  return pantryIngredients.some((ingredient) => {
    const ingredientKey = normalizeStapleKey(ingredient);
    if (ingredientKey === stapleKey) return true;

    return stapleKey.includes(' ') && new RegExp(`\\b${stapleKey}\\b`).test(ingredientKey);
  });
}

function compareStapleCandidates(left: StapleCandidate, right: StapleCandidate): number {
  return right.count - left.count ||
    left.firstIndex - right.firstIndex ||
    left.firstCandidateIndex - right.firstCandidateIndex;
}

function countUncoveredCuisines(candidate: StapleCandidate, coveredCuisineIndices: Set<number>): number {
  return Array.from(candidate.cuisineIndices).filter((cuisineIndex) => !coveredCuisineIndices.has(cuisineIndex)).length;
}

export function getStapleCandidatesForCuisines(
  cuisines: string[],
  pantryIngredients: string[],
): string[] {
  const ranked = new Map<string, StapleCandidate>();

  cuisines.forEach((cuisine, cuisineIndex) => {
    CUISINE_STAPLE_CANDIDATES[cuisine]?.forEach((candidate, candidateIndex) => {
      const key = normalizeStapleKey(candidate);
      if (!key || pantryHasStaple(pantryIngredients, candidate)) return;

      const existing = ranked.get(key);
      if (existing) {
        existing.count += 1;
        existing.cuisineIndices.add(cuisineIndex);
        return;
      }

      ranked.set(key, {
        key,
        label: candidate,
        count: 1,
        firstIndex: cuisineIndex,
        firstCandidateIndex: candidateIndex,
        cuisineIndices: new Set([cuisineIndex]),
      });
    });
  });

  const rankedCandidates = Array.from(ranked.values()).sort(compareStapleCandidates);
  const selectedCandidates: StapleCandidate[] = [];
  const selectedKeys = new Set<string>();
  const coveredCuisineIndices = new Set<number>();

  while (selectedCandidates.length < MAX_STAPLE_CANDIDATES) {
    const nextRepresentative = rankedCandidates
      .filter((candidate) => !selectedKeys.has(candidate.key) && countUncoveredCuisines(candidate, coveredCuisineIndices) > 0)
      .sort((left, right) =>
        countUncoveredCuisines(right, coveredCuisineIndices) - countUncoveredCuisines(left, coveredCuisineIndices) ||
        compareStapleCandidates(left, right)
      )[0];

    if (!nextRepresentative) break;

    selectedCandidates.push(nextRepresentative);
    selectedKeys.add(nextRepresentative.key);
    nextRepresentative.cuisineIndices.forEach((cuisineIndex) => coveredCuisineIndices.add(cuisineIndex));
  }

  rankedCandidates.forEach((candidate) => {
    if (selectedCandidates.length >= MAX_STAPLE_CANDIDATES || selectedKeys.has(candidate.key)) return;

    selectedCandidates.push(candidate);
    selectedKeys.add(candidate.key);
  });

  return selectedCandidates.map((candidate) => candidate.label);
}
