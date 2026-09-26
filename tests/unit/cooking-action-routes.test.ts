import { randomUUID } from "node:crypto";
import { createServer } from "node:http";
import express from "express";
import { describe, it, expect, vi } from "vitest";
vi.mock("../../server/db", () => ({ db: {} }));
vi.mock("../../server/openai", () => ({ getCookingAssistance: vi.fn() }));
import { registerCookingActionRoutes } from "../../server/cooking-actions/routes";
import { createCookingActionService } from "../../server/cooking-actions/service";
import { productionActionRegistry } from "../../server/cooking-actions/policy";
import { resetRateLimitBucketsForTest, voiceUserHourLimit } from "../../server/rate-limit";
import { MemoryActionLedger } from "../helpers/action-ledger";
import { requestHttp } from "./http-test-client";

function fixture() {
  resetRateLimitBucketsForTest();
  const ledger = new MemoryActionLedger();
  const service = createCookingActionService({ ledger, propose: async () => ({ type: "timer_proposal", text: "", timer: { kind: "timer.start", version: 1, parameters: { durationSeconds: 300 } } }),
    env: () => ({ COOKING_ACTIONS_ENABLED: "true", COOKING_ACTIONS_PILOT_UIDS: "pilot", COOKING_ACTION_TIMER_START_ENABLED: "true" }),
    policy: { ...productionActionRegistry, executor: "browser" },
  });
  const app = express(); app.use(express.json({ limit: "16kb" }));
  const authenticate = (req: any, res: any, next: any) => {
    if (!req.headers.authorization) return res.status(401).json({ message: "Unauthorized" });
    req.firebaseUser = { uid: req.headers.authorization === "Bearer other" ? "other" : "pilot", isAnonymous: false }; next();
  };
  registerCookingActionRoutes(app, authenticate, service);
  app.post("/consume-proposal-budget", authenticate, voiceUserHourLimit, (_req, res) => res.json({ ok: true }));
  const server = createServer(app);
  const call = (path: string, body?: unknown, authorization: string | null = "Bearer pilot") => requestHttp(server, {
    method: body === undefined ? "GET" : "POST", path,
    headers: { "Content-Type": "application/json", ...(authorization ? { Authorization: authorization } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const request = { version: 1, idempotencyKey: randomUUID(), requestedAt: Date.now(), utterance: "Set a timer for 5 minutes", context: { step: "Simmer." }, scope: { sessionId: 1, cookInstanceId: randomUUID(), browserInstanceId: randomUUID(), stateRevision: "a".repeat(64), stepIndex: 0, timerActive: false } };
  return { ledger, call, request };
}
describe("action HTTP boundary", () => {
  it("requires authentication and never exposes internal registry definitions", async () => {
    const f = fixture();
    expect((await f.call("/api/cooking/actions/capabilities?sessionId=1", undefined, null)).status).toBe(401);
    const response = await f.call("/api/cooking/actions/capabilities?sessionId=1");
    expect(await response.json()).toEqual({ version: 1, capabilities: [{ kind: "timer.start", version: 1 }] });
    expect(response.headers["cache-control"]).toContain("no-store");
    expect(response.headers.vary).toContain("Authorization");
  });
  it("rejects oversized inputs and body-selected caller/authority", async () => {
    const f = fixture();
    for (const body of [{ ...f.request, caller: "admin" }, { ...f.request, utterance: "x".repeat(2001) }]) {
      const response = await f.call("/api/cooking/actions/propose", body);
      expect(response.status).toBe(400); expect(await response.json()).toEqual({ type: "blocked", reason: "invalid_request" });
    }
    expect(f.ledger.records.size).toBe(0);
  });
  it("keeps cross-owner/missing records indistinguishable and sanitizes ledger failure", async () => {
    const f = fixture(); const response = await f.call("/api/cooking/actions/propose", f.request); const body: any = await response.json();
    const other = await f.call(`/api/cooking/actions/${body.action.actionId}`, undefined, "Bearer other");
    const absent = await f.call(`/api/cooking/actions/${randomUUID()}`, undefined, "Bearer other");
    expect(other.status).toBe(404); expect(await other.json()).toEqual(await absent.json());
    f.ledger.failEvent = "proposed";
    const failure = await f.call("/api/cooking/actions/propose", { ...f.request, idempotencyKey: randomUUID() });
    expect(failure.status).toBe(503); expect(await failure.json()).toEqual({ type: "blocked", reason: "ledger_unavailable" });
  });
  it("accepts status and receipt after exhausting the proposal rate limit", async () => {
    const f = fixture(); const dispatch: any = await (await f.call("/api/cooking/actions/propose", f.request)).json();
    let limited = false;
    for (let i = 0; i < 150; i++) if ((await f.call("/consume-proposal-budget", {})).status === 429) { limited = true; break; }
    expect(limited).toBe(true);
    expect((await f.call("/api/cooking/actions/propose", f.request)).status).toBe(429);
    expect((await f.call(`/api/cooking/actions/${dispatch.action.actionId}`)).status).toBe(200);
    const receipt = await f.call(`/api/cooking/actions/${dispatch.action.actionId}/result`, { version: 1, scope: f.request.scope, token: dispatch.receiptToken, parameterDigest: dispatch.action.parameterDigest, result: "applied" });
    expect(await receipt.json()).toMatchObject({ action: { status: "succeeded" } });
  });
});
