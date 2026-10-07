// Dish-name identity rules: a recipeName promises defining ingredients that must
// appear in pantryIngredientsUsed. Rules are precision-first by design — they only
// flag high-confidence name/pantry contradictions so the deterministic lane never
// fails an honest recipe; broader recall (unusual dishes, quality judgments) stays
// with the human/judge lanes.

export type DishIdentityRule = {
  id: string;
  // Matches a dish claim in recipeName.
  dish: RegExp;
  // Satisfied when any pantryIngredientsUsed entry matches.
  definer: RegExp;
};

// "cauliflower steak", "salmon steak", etc. are honest non-beef steaks; the named
// prefix is covered by the named-ingredient rules instead.
const NON_BEEF_STEAK_PREFIX = /(?<!\b(?:cauliflower|portobello|mushroom|tofu|watermelon|salmon|tuna|swordfish|halibut|ham|pork|chicken|turkey)\s)/i;

export const DISH_IDENTITY_RULES: DishIdentityRule[] = [
  // Dish forms that imply an unnamed defining ingredient.
  { id: "egg-dish-needs-eggs", dish: /\b(frittatas?|omelett?es?|quiches?|shakshuka)\b/i, definer: /\beggs?\b/i },
  { id: "carbonara-needs-eggs", dish: /\bcarbonara\b/i, definer: /\beggs?\b/i },
  { id: "rice-dish-needs-rice", dish: /\b(fried rice|risottos?|paellas?|bibimbap|rice bowls?|rice pilafs?|jambalayas?)\b/i, definer: /\brice\b(?!\s+(?:vinegar|wine|paper|flour))/i },
  { id: "noodle-dish-needs-noodles", dish: /\b(ramen|lo mein|chow mein|pad thai|pho|noodles?)\b/i, definer: /\b(noodles?|ramen|spaghetti|linguine|fettuccine|vermicelli|rice sticks?|pasta|macaroni|penne)\b/i },
  { id: "pasta-dish-needs-pasta", dish: /\b(carbonara|spaghetti|lasagnas?|linguine|fettuccine|penne|macaroni|gnocchi|ravioli)\b/i, definer: /\b(pasta|spaghetti|lasagna|linguine|fettuccine|penne|macaroni|noodles?|gnocchi|ravioli)\b/i },
  { id: "wrapped-dish-needs-tortillas", dish: /\b(tacos?|burritos?|quesadillas?)\b(?!\s*(?:filling|seasoning|spice|salad|bowls?|soup))/i, definer: /\btortillas?\b/i },
  { id: "steak-dish-needs-steak", dish: new RegExp(NON_BEEF_STEAK_PREFIX.source + String.raw`\bsteaks?\b(?!\s*(?:seasoning|sauce))`, "i"), definer: /\b(steaks?|beef|sirloin|ribeye|flank|filet|tenderloin)\b(?!\s*(?:seasoning|sauce|broth|stock|bouillon))/i },
  { id: "poke-bowl-needs-fish", dish: /\bpoke bowls?\b/i, definer: /\b(fish|salmon|tuna|ahi|shrimp|prawns?|octopus|tofu)\b/i },
  { id: "pizza-needs-base", dish: /\bpizzas?\b/i, definer: /\b(dough|flour|crust|flatbread|naan|pita|tortillas?|baguette|bread)\b/i },
  { id: "grilled-cheese-needs-bread", dish: /\bgrilled cheese\b/i, definer: /\b(bread|sourdough|brioche|baguette|loaf|rolls?|toast)\b/i },
  { id: "sandwich-needs-bread", dish: /\b(sandwich(?:es)?|toasts?)\b/i, definer: /\b(bread|sourdough|brioche|baguette|loaf|rolls?|toast|buns?|ciabatta|pita)\b/i },
  // Named ingredients: when the recipeName itself names the ingredient, it must be used.
  { id: "named-chicken", dish: /\bchicken\b/i, definer: /\bchicken\b/i },
  { id: "named-beef", dish: /\bbeef\b/i, definer: /\bbeef\b/i },
  { id: "named-pork", dish: /\bpork\b/i, definer: /\bpork\b/i },
  { id: "named-lamb", dish: /\blamb\b/i, definer: /\blamb\b/i },
  { id: "named-turkey", dish: /\bturkey\b/i, definer: /\bturkey\b/i },
  { id: "named-bacon", dish: /\bbacon\b/i, definer: /\bbacon\b/i },
  { id: "named-sausage", dish: /\bsausages?\b/i, definer: /\bsausages?\b/i },
  { id: "named-salmon", dish: /\bsalmon\b/i, definer: /\bsalmon\b/i },
  { id: "named-tuna", dish: /\btuna\b/i, definer: /\btuna\b/i },
  { id: "named-shrimp", dish: /\b(shrimp|prawns?)\b/i, definer: /\b(shrimp|prawns?)\b/i },
  { id: "named-tofu", dish: /\btofu\b/i, definer: /\btofu\b/i },
  { id: "named-egg", dish: /\beggs?\b/i, definer: /\beggs?\b/i },
  { id: "named-cheese", dish: /\b(cheese|cheddar|mozzarella|parmesan|feta|gruyere)\b/i, definer: /\b(cheese|cheddar|mozzarella|parmesan|feta|gruyere)\b/i },
  { id: "named-rice", dish: /\brice\b(?!\s+(?:vinegar|wine|paper|flour))/i, definer: /\brice\b(?!\s+(?:vinegar|wine|paper|flour))/i },
];

export type DishIdentityRecipe = {
  recipeName?: unknown;
  pantryIngredientsUsed?: unknown;
  additionalIngredientsNeeded?: unknown;
};

export type DishIdentityViolation = {
  recipeName: string;
  ruleId: string;
  definerListedAsOptional: boolean;
};

function toStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

export function checkDishIdentity(recipes: DishIdentityRecipe[]): DishIdentityViolation[] {
  const violations: DishIdentityViolation[] = [];

  for (const recipe of recipes) {
    const recipeName = typeof recipe.recipeName === "string" ? recipe.recipeName : "";
    if (!recipeName) continue;

    const pantryUsed = toStringArray(recipe.pantryIngredientsUsed);
    const optional = toStringArray(recipe.additionalIngredientsNeeded);

    for (const rule of DISH_IDENTITY_RULES) {
      const match = rule.dish.exec(recipeName);
      if (!match) continue;
      // "Ramen-Style Soup" / "Ramen-Inspired Hotpot" / "Shakshuka-ish" are honest
      // adapted names (EFF-022 inspired-dish labeling), not claims to be the dish.
      if (/^[\s-]*(?:style|inspired|ish)\b/i.test(recipeName.slice(match.index + match[0].length))) continue;
      if (pantryUsed.some((ingredient) => rule.definer.test(ingredient))) continue;

      violations.push({
        recipeName,
        ruleId: rule.id,
        definerListedAsOptional: optional.some((ingredient) => rule.definer.test(ingredient)),
      });
    }
  }

  return violations;
}

export function formatDishIdentityViolations(violations: DishIdentityViolation[]): string {
  return violations
    .map((violation) =>
      `"${violation.recipeName}" fails ${violation.ruleId}${violation.definerListedAsOptional ? " (defining ingredient listed as optional)" : ""}`)
    .join("; ");
}
