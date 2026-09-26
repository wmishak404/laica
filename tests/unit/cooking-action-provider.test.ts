import { describe, it, expect, vi, beforeEach } from "vitest";
const mocks = vi.hoisted(() => ({ create: vi.fn(), insert: vi.fn(), active: vi.fn() }));
vi.mock("openai", () => ({ default: vi.fn().mockImplementation(function () { return { chat: { completions: { create: mocks.create } } }; }) }));
vi.mock("../../server/db", () => ({ db: { insert: mocks.insert } }));
vi.mock("../../server/prompt-manager", () => ({ getActivePrompt: mocks.active, getActivePromptVersion: vi.fn() }));
import { getCookingAssistance } from "../../server/openai";

const output = { type: "advice", text: "Check the texture.", timer: null };
beforeEach(() => { mocks.active.mockResolvedValue("Existing advice prompt."); });
describe("transient action proposal provider boundary", () => {
  it("uses the existing assistance service with strict output, one bounded call and no eval logging", async () => {
    mocks.create.mockResolvedValue({ choices: [{ finish_reason: "stop", message: { content: JSON.stringify(output) } }] });
    const log = vi.spyOn(console, "log"); const error = vi.spyOn(console, "error");
    expect(await getCookingAssistance("Simmer gently.", "How should it look?", { actionProposal: true })).toEqual(output);
    expect(mocks.create).toHaveBeenCalledTimes(1);
    const [request, options] = mocks.create.mock.calls[0];
    expect(request.model).toBe("gpt-4.1-mini");
    expect(request.response_format).toMatchObject({ type: "json_schema", json_schema: { strict: true } });
    expect(request.max_tokens).toBe(700);
    expect(options).toEqual({ maxRetries: 0, timeout: 15000 });
    expect(request.messages[0].content).toContain("Existing advice prompt.");
    expect(JSON.parse(request.messages[1].content)).toEqual({ untrustedContext: { step: "Simmer gently.", utterance: "How should it look?" } });
    expect(mocks.insert).not.toHaveBeenCalled(); expect(log).not.toHaveBeenCalled(); expect(error).not.toHaveBeenCalled();
  });
  it.each(["refusal", "truncated", "malformed", "provider_error"])("blocks %s without retaining/logging the payload or retrying", async mode => {
    const error = vi.spyOn(console, "error");
    if (mode === "provider_error") mocks.create.mockRejectedValue(new Error("private provider payload"));
    else mocks.create.mockResolvedValue({ choices: [{ finish_reason: mode === "truncated" ? "length" : "stop", message: { refusal: mode === "refusal" ? "refused" : null, content: mode === "malformed" ? "not json" : JSON.stringify(output) } }] });
    await expect(getCookingAssistance("Simmer.", "Private question", { actionProposal: true })).rejects.toThrow("action_proposal_unavailable");
    expect(mocks.create).toHaveBeenCalledTimes(1); expect(mocks.insert).not.toHaveBeenCalled(); expect(error).not.toHaveBeenCalled();
  });
});
