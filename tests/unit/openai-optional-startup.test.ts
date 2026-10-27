// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";

vi.unmock("openai");
vi.mock("../../server/db", () => ({ db: {} }));
vi.mock("../../server/prompt-manager", () => ({
  getActivePrompt: vi.fn().mockResolvedValue(null),
  getActivePromptVersion: vi.fn().mockResolvedValue(null),
}));

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("optional OpenAI startup with the installed SDK", () => {
  it.each([undefined, ""])("imports provider modules when the optional key is %s", async apiKey => {
    vi.resetModules();
    vi.stubEnv("OPENAI_API_KEY", apiKey);
    vi.stubEnv("OPENAI_ADMIN_KEY", "synthetic-unrelated-admin-key");
    const fetch = vi.fn().mockRejectedValue(new Error("Unexpected network request"));
    vi.stubGlobal("fetch", fetch);
    vi.spyOn(console, "error").mockImplementation(() => {});

    const provider = await import("../../server/openai");
    const evaluator = await import("../../server/evaluator");
    expect(evaluator.hasEvalCriteria("cooking_assistance")).toBe(true);
    await expect(provider.getCookingAssistance("Simmer gently.", "What next?"))
      .rejects.toThrow("Failed to get cooking assistance");
    await expect(provider.getCookingAssistance("Simmer gently.", "What next?", { actionProposal: true }))
      .rejects.toThrow("action_proposal_unavailable");
    await expect(evaluator.checkBatchStatus("batch-synthetic")).rejects.toThrow("Missing credentials");
    expect(fetch).not.toHaveBeenCalled();
  });

  it("uses a key configured after import for provider and evaluator calls", async () => {
    vi.resetModules();
    vi.stubEnv("OPENAI_API_KEY", undefined);
    vi.stubEnv("OPENAI_ADMIN_KEY", undefined);
    vi.stubEnv("OPENAI_BASE_URL", undefined);
    const output = { type: "advice", text: "Stir gently.", timer: null };
    const fetch = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
      const request = new Request(input, init);
      expect(request.headers.get("authorization")).toBe("Bearer synthetic-key");
      if (request.url.endsWith("/chat/completions")) {
        return Response.json({ choices: [{ finish_reason: "stop", message: { content: JSON.stringify(output) } }] });
      }
      expect(request.url).toBe("https://api.openai.com/v1/batches/batch-synthetic");
      return Response.json({ id: "batch-synthetic", status: "completed", request_counts: { total: 1, completed: 1, failed: 0 } });
    });
    vi.stubGlobal("fetch", fetch);
    const provider = await import("../../server/openai");
    const evaluator = await import("../../server/evaluator");
    expect(fetch).not.toHaveBeenCalled();

    vi.stubEnv("OPENAI_API_KEY", "synthetic-key");
    await expect(provider.getCookingAssistance("Simmer gently.", "What next?", { actionProposal: true })).resolves.toEqual(output);
    await expect(evaluator.checkBatchStatus("batch-synthetic")).resolves.toMatchObject({ id: "batch-synthetic", status: "completed" });
    expect(fetch).toHaveBeenCalledTimes(2);
  });
});
