const MAX_OPTIONAL_INGREDIENTS = 3;

const UNIVERSAL_STAPLE_KEYS = new Set([
  'salt',
  'kosher salt',
  'sea salt',
  'black pepper',
  'pepper',
  'water',
  'neutral oil',
  'neutral cooking oil',
  'cooking oil',
  'vegetable oil',
  'canola oil',
]);

export function normalizeIngredientKey(value: string): string {
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

export function normalizeAdditionalIngredientsNeeded(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  const seen = new Set<string>();
  const normalized: string[] = [];

  value.forEach((rawIngredient) => {
    if (typeof rawIngredient !== 'string') return;

    const ingredient = rawIngredient.replace(/\s+/g, ' ').trim();
    const key = normalizeIngredientKey(ingredient);
    if (!ingredient || !key || seen.has(key) || UNIVERSAL_STAPLE_KEYS.has(key)) return;

    seen.add(key);
    normalized.push(ingredient);
  });

  return normalized.slice(0, MAX_OPTIONAL_INGREDIENTS);
}

export function normalizeRecipeSuggestionsResponse<T extends Record<string, unknown>>(response: T): T {
  if (!Array.isArray(response.recipes)) return response;

  return {
    ...response,
    recipes: response.recipes.map((recipe) => {
      if (!recipe || typeof recipe !== 'object') return recipe;

      return {
        ...recipe,
        additionalIngredientsNeeded: normalizeAdditionalIngredientsNeeded(
          (recipe as { additionalIngredientsNeeded?: unknown }).additionalIngredientsNeeded,
        ),
      };
    }),
  };
}
