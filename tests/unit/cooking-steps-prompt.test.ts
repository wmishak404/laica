import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const insertValues = vi.fn(() => ({ catch: vi.fn() }));
  const insert = vi.fn(() => ({ values: insertValues }));
  const deleteWhere = vi.fn(() => ({ catch: vi.fn() }));
  const deleteFn = vi.fn(() => ({ where: deleteWhere }));

  return {
    chatCompletionsCreate: vi.fn(),
    getActivePrompt: vi.fn(),
    insert,
    insertValues,
    deleteFn,
    deleteWhere,
  };
});

vi.mock("openai", () => ({
  default: vi.fn().mockImplementation(function OpenAI() {
    return {
      chat: {
        completions: {
          create: mocks.chatCompletionsCreate,
        },
      },
    };
  }),
}));

vi.mock("../../server/prompt-manager", () => ({
  getActivePrompt: mocks.getActivePrompt,
  getActivePromptVersion: vi.fn(),
}));

vi.mock("../../server/db", () => ({
  db: {
    insert: mocks.insert,
    delete: mocks.deleteFn,
  },
}));

import { getCookingSteps } from "../../server/openai";

describe("cooking steps prompt", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.insertValues.mockReturnValue({ catch: vi.fn() });
    mocks.deleteWhere.mockReturnValue({ catch: vi.fn() });
    mocks.getActivePrompt.mockResolvedValue(null);
    mocks.chatCompletionsCreate.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              recipe: { recipeName: "Leek Fried Rice" },
              steps: [
                {
                  number: 1,
                  actionLabel: "Prep Leeks",
                  instruction: "Trim and slice the leeks.",
                },
              ],
            }),
          },
        },
      ],
    });
  });

  it("teaches plural ingredient labels and final garnish labels for step previews", async () => {
    await getCookingSteps(
      "Leek, Carrot & Beef Fried Rice",
      ["leeks", "carrots", "cooked beef", "green onions"],
      ["skillet"],
      "A fried rice finished with sliced green onions.",
    );

    const request = mocks.chatCompletionsCreate.mock.calls[0]?.[0];
    const userMessage = request?.messages.find((message: { role: string }) => message.role === "user");

    expect(userMessage?.content).toContain("Prep Leeks");
    expect(userMessage?.content).toContain("Do not singularize plural ingredients into labels like Prep Leek");
    expect(userMessage?.content).toContain("If a final step says to turn off heat, stir in green onions or herbs, and serve, use Garnish or Garnish & Serve instead of Cook Vegetables.");
    expect(userMessage?.content).toContain("Garnish, and Serve Fried Rice");
  });

  it("normalizes provider cooking-step output before returning and logging it", async () => {
    mocks.chatCompletionsCreate.mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: JSON.stringify({
              recipe: {
                recipeName: "Rice Bowl",
                ingredients: [{ name: " rice ", quantity: "1 cup", forSteps: [1] }],
              },
              steps: [
                {
                  actionLabel: " Boil Rice ",
                  instruction: " Simmer rice until tender. ",
                  timing: "3 minutes",
                  tips: " Keep the lid on. ",
                  visualCues: " Steam holes form on top. ",
                  commonMistakes: " Do not stir constantly. ",
                  safetyLevel: "important",
                },
                " Rest rice for 5 minutes. ",
                { instruction: "Follow the recipe instructions" },
              ],
              variations: [" Add a fried egg. ", ""],
            }),
          },
        },
      ],
    });

    const result = await getCookingSteps("Rice Bowl", ["rice"], ["pot"]);

    expect(result).toEqual({
      recipe: {
        recipeName: "Rice Bowl",
        ingredients: [{ name: "rice", quantity: "1 cup", forSteps: [1] }],
      },
      steps: [
        {
          actionLabel: "Boil Rice",
          instruction: "Simmer rice until tender.",
          duration: 180,
          tips: "Keep the lid on.",
          visualCues: "Steam holes form on top.",
          commonMistakes: "Do not stir constantly.",
          safetyLevel: "important",
        },
        {
          instruction: "Rest rice for 5 minutes.",
          tips: "",
          visualCues: "",
          commonMistakes: "",
          safetyLevel: "minor",
        },
      ],
      variations: ["Add a fried egg."],
    });
    expect(mocks.insertValues).toHaveBeenCalledWith(expect.objectContaining({
      featureType: "cooking_steps",
      outputData: JSON.stringify(result),
    }));
  });
});
