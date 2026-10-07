import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { test, expect } from "./e2e-test";
import { db } from "../../server/db";
import { cookingActions, cookingActionEvents, cookingSessions } from "../../shared/schema";
import { createPostgresActionLedger } from "../../server/cooking-actions/postgres-ledger";
import { createCookingActionService } from "../../server/cooking-actions/service";
import { productionActionRegistry } from "../../server/cooking-actions/policy";
import { ACTION_RETENTION_MS, type ActionLedger } from "../../server/cooking-actions/ledger";

// CI supplies a disposable, schema-only Neon branch; never apply schema or synthetic writes to the dotenvx DB.
test.describe("action ledger on disposable PostgreSQL", () => {
  test.skip(!process.env.CI, "Requires the CI disposable schema-only Neon lane.");
  test.describe.configure({ mode: "serial" });
  const sessionIds: number[] = [];
  test.afterEach(async () => {
    for (const id of sessionIds.splice(0)) await db.delete(cookingSessions).where(eq(cookingSessions.id, id));
  });
  async function fixture(wrap: (ledger: ActionLedger) => ActionLedger = value => value) {
    const uid = `synthetic-action-${randomUUID()}`;
    const [session] = await db.insert(cookingSessions).values({ authUserId: uid, recipeName: "Synthetic ledger test", completed: false }).returning();
    sessionIds.push(session.id);
    let time = Date.now();
    const base = createPostgresActionLedger(db, () => time);
    const ledger = wrap(base);
    const caller = { uid, isAnonymous: false, caller: "live_cooking" as const };
    const service = createCookingActionService({ ledger, now: () => time,
      policy: { ...productionActionRegistry, executor: "browser" },
      env: () => ({ COOKING_ACTIONS_ENABLED: "true", COOKING_ACTIONS_PILOT_UIDS: uid, COOKING_ACTION_TIMER_START_ENABLED: "true" }),
      propose: async () => ({ type: "timer_proposal", text: "", timer: { kind: "timer.start", version: 1, parameters: { durationSeconds: 300 } } }),
    });
    const request = { version: 1, idempotencyKey: randomUUID(), requestedAt: time,
      utterance: "Start a timer for 5 minutes", context: { step: "Synthetic simmer step." },
      scope: { sessionId: session.id, cookInstanceId: randomUUID(), browserInstanceId: randomUUID(), stateRevision: "a".repeat(64), stepIndex: 0, timerActive: false },
    };
    return { service, ledger, caller, request, session, advance: (ms: number) => { time += ms; } };
  }
  test("serializes concurrent duplicates, persists only metadata, reconciles receipts and cascades session deletion", async () => {
    const f = await fixture();
    const responses = await Promise.all(Array.from({ length: 6 }, () => f.service.propose(f.caller, f.request)));
    const dispatched = responses.filter(r => r.type === "dispatch");
    expect(dispatched).toHaveLength(1);
    const r = dispatched[0]; if (r.type !== "dispatch") throw new Error("Expected synthetic directive");
    const rows = await db.select().from(cookingActions).where(eq(cookingActions.sessionId, f.session.id));
    expect(rows).toHaveLength(1);
    const serialized = JSON.stringify(rows);
    expect(serialized).not.toContain(f.caller.uid);
    expect(serialized).not.toContain(f.request.utterance);
    expect(serialized).not.toContain(r.receiptToken);
    const events = await db.select().from(cookingActionEvents).where(eq(cookingActionEvents.actionId, r.action.actionId));
    expect(events.filter(e => e.event === "dispatched")).toHaveLength(1);
    await expect(f.service.status({ ...f.caller, uid: "different-synthetic-owner" }, r.action.actionId)).rejects.toMatchObject({ reason: "not_found" });
    f.advance(30001);
    expect(await f.service.status(f.caller, r.action.actionId)).toMatchObject({ action: { status: "outcome_unknown" } });
    const receipt = { version: 1, scope: f.request.scope, parameterDigest: r.action.parameterDigest, token: r.receiptToken, result: "applied" };
    expect(await f.service.receipt(f.caller, r.action.actionId, receipt)).toMatchObject({ action: { status: "succeeded" } });
    await f.service.receipt(f.caller, r.action.actionId, receipt);
    const results = await db.select().from(cookingActionEvents).where(and(eq(cookingActionEvents.actionId, r.action.actionId), eq(cookingActionEvents.event, "result")));
    expect(results).toHaveLength(1);
    await db.delete(cookingSessions).where(eq(cookingSessions.id, f.session.id));
    expect(await db.select().from(cookingActions).where(eq(cookingActions.id, r.action.actionId))).toHaveLength(0);
    expect(await db.select().from(cookingActionEvents).where(eq(cookingActionEvents.actionId, r.action.actionId))).toHaveLength(0);
  });
  test("rolls back proposal, authorization and dispatch events if the transaction fails before commit", async () => {
    const f = await fixture(ledger => ({ ...ledger,
      transaction: (uid, id, work) => ledger.transaction(uid, id, async tx => {
        const result = await work(tx);
        if ((result as any)?.type === "dispatch") throw new Error("synthetic precommit failure");
        return result;
      }),
    }));
    await expect(f.service.propose(f.caller, f.request)).rejects.toThrow("synthetic precommit failure");
    expect(await db.select().from(cookingActions).where(eq(cookingActions.sessionId, f.session.id))).toHaveLength(0);
  });
  test("prunes old unresolved records and their events without allowing stale request replay", async () => {
    const f = await fixture(); const r = await f.service.propose(f.caller, f.request);
    if (r.type !== "dispatch") throw new Error("Expected synthetic directive");
    f.advance(ACTION_RETENTION_MS + 1);
    await f.ledger.prune();
    expect(await db.select().from(cookingActions).where(eq(cookingActions.id, r.action.actionId))).toHaveLength(0);
    expect(await db.select().from(cookingActionEvents).where(eq(cookingActionEvents.actionId, r.action.actionId))).toHaveLength(0);
    await expect(f.service.propose(f.caller, f.request)).rejects.toMatchObject({ reason: "expired" });
  });
});
