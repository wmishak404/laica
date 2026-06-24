import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const insertValues = vi.fn(() => ({ catch: vi.fn() }));
  const insert = vi.fn(() => ({ values: insertValues }));
  const deleteWhere = vi.fn(() => ({ catch: vi.fn() }));
  const deleteFn = vi.fn(() => ({ where: deleteWhere }));

  return {
    chatCompletionsCreate: vi.fn(),
    getActivePromptVersion: vi.fn(),
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
  getActivePromptVersion: mocks.getActivePromptVersion,
  getActivePrompt: mocks.getActivePrompt,
}));

vi.mock("../../server/db", () => ({
  db: {
    insert: mocks.insert,
    delete: mocks.deleteFn,
  },
}));

import { getRecipeSuggestions } from "../../server/openai";

function recipe(name: string) {
  return {
    recipeName: name,
    description: `${name} description`,
    difficulty: "Easy",
    cookTime: 30,
    pantryIngredientsUsed: ["rice"],
    additionalIngredientsNeeded: [],
    overview: `${name} overview`,
    instructions: ["Cook rice until tender."],
    cuisine: "Pantry",
    isFusion: false,
  };
}

describe("INIT-004 recipe eval logging provenance", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.insertValues.mockReturnValue({ catch: vi.fn() });
    mocks.deleteWhere.mockReturnValue({ catch: vi.fn() });
    mocks.getActivePromptVersion.mockResolvedValue({
      id: 42,
      systemPrompt: "Use pantry ingredients first.",
    });
    mocks.chatCompletionsCreate.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              recipes: [recipe("One"), recipe("Two"), recipe("Three")],
            }),
          },
        },
      ],
    });
  });

  it("logs pantry recipe outputs under the chef_it_up_suggestions eval surface with recipe prompt provenance", async () => {
    await getRecipeSuggestions("quick dinner", ["rice", "eggs"], {
      evalFeatureType: "chef_it_up_suggestions",
    });

    expect(mocks.getActivePromptVersion).toHaveBeenCalledWith("recipe_suggestions");
    expect(mocks.chatCompletionsCreate).toHaveBeenCalledWith(expect.objectContaining({
      messages: expect.arrayContaining([
        expect.objectContaining({
          role: "system",
          content: "Use pantry ingredients first.",
        }),
      ]),
    }));
    expect(mocks.insertValues).toHaveBeenCalledWith(expect.objectContaining({
      featureType: "chef_it_up_suggestions",
      inputData: {
        preferences: "quick dinner",
        ingredients: ["rice", "eggs"],
      },
      promptVersionId: 42,
      evalStatus: "pending",
    }));
  });
});
