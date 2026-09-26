import { describe, it, expect } from "vitest";
import { loadPublicEvalFixtures, validateEvalFixture } from "../../server/eval-fixtures";
import { bindDirectTimerRequest } from "../../server/cooking-actions/policy";
import { promptFeatureTypeSchema } from "../../server/ai-feature-types";

describe("separate cooking_action_proposal eval lane", () => {
  it("checks eight synthetic cases and reports positive correctness separately from clarification", async () => {
    const fixtures = (await loadPublicEvalFixtures()).filter(f => f.surface === "cooking_action_proposal");
    expect(fixtures).toHaveLength(8);
    const positives = fixtures.filter(f => bindDirectTimerRequest(String(f.request.utterance)));
    expect(positives).toHaveLength(3);
    expect(positives.filter(f => JSON.parse(f.output!).type === "timer_proposal")).toHaveLength(3);
    expect(positives.filter(f => JSON.parse(f.output!).type === "clarification")).toHaveLength(0);
    for (const fixture of fixtures) expect(validateEvalFixture(fixture).checks.every(c => c.status !== "fail")).toBe(true);
    expect(promptFeatureTypeSchema.safeParse("cooking_action_proposal").success).toBe(false);
  });
  it("detects an unauthorized synthetic proposal and a missed clear command", async () => {
    const fixtures = (await loadPublicEvalFixtures()).filter(f => f.surface === "cooking_action_proposal");
    const negative = fixtures.find(f => f.id === "cooking-action-negation")!;
    const positive = fixtures.find(f => f.id === "cooking-action-digits")!;
    expect(validateEvalFixture({ ...negative, output: positive.output }).checks).toContainEqual(expect.objectContaining({ id: "action_direct_request", status: "fail" }));
    expect(validateEvalFixture({ ...positive, output: negative.output }).checks).toContainEqual(expect.objectContaining({ id: "action_positive_command", status: "fail" }));
  });
});
