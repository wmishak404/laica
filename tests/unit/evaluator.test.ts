import { describe, expect, it, vi } from "vitest";

vi.mock("../../server/db", () => ({
  db: {},
}));

vi.mock("openai", () => ({
  default: vi.fn().mockImplementation(function OpenAI() {
    return {};
  }),
  toFile: vi.fn(),
}));

import {
  hasEvalCriteria,
  selectEvaluableInteractionsForBatch,
} from "../../server/evaluator";

describe("INIT-004 criteria-aware eval queue selection", () => {
  it("keeps rows with eval criteria and skips unsupported operational feature rows", () => {
    const interactions = [
      { id: 1, featureType: "recipe_suggestions" },
      { id: 2, featureType: "pantry_recipes" },
      { id: 3, featureType: "slop_bowl" },
      { id: 4, featureType: "ingredient_detection" },
      { id: 5, featureType: "future_unreviewed_feature" },
    ];

    expect(hasEvalCriteria("pantry_recipes")).toBe(true);
    expect(hasEvalCriteria("ingredient_detection")).toBe(false);

    const result = selectEvaluableInteractionsForBatch(interactions);

    expect(result.evaluableInteractions.map((interaction) => interaction.id)).toEqual([1, 2, 3]);
    expect(result.skipped).toBe(2);
  });
});
