import { and, eq, gte, lt } from "drizzle-orm";
import { db } from "../db";
import { cookingActions, cookingActionEvents, cookingSessions } from "@shared/schema";
import { ACTION_RETENTION_MS, ActionError, actionRecordSchema, eventTypeSchema, type ActionLedger } from "./ledger";
import { actionReasonSchema } from "@shared/cooking-actions";

export function createPostgresActionLedger(database = db, now = Date.now): ActionLedger {
  const cutoff = () => new Date(now() - ACTION_RETENTION_MS);
  return {
    async transaction(uid, sessionId, work) {
      return database.transaction(async tx => {
        // Session row is the lock/ownership root. This serializes same-session requests across processes.
        const [session] = await tx.select({ completed: cookingSessions.completed }).from(cookingSessions)
          .where(and(eq(cookingSessions.id, sessionId), eq(cookingSessions.authUserId, uid))).for("update");
        if (!session) throw new ActionError("not_found", 404);
        return work({
          active: session.completed !== true,
          async get(id) {
            const [row] = await tx.select().from(cookingActions).where(and(
              eq(cookingActions.sessionId, sessionId), eq(cookingActions.id, id), gte(cookingActions.createdAt, cutoff()),
            ));
            return row ? actionRecordSchema.parse(row.record) : undefined;
          },
          async getByKey(key) {
            const [row] = await tx.select().from(cookingActions).where(and(
              eq(cookingActions.sessionId, sessionId), eq(cookingActions.idempotencyKey, key),
            ));
            // Retained expired keys cannot revive; the API also rejects old actions by age.
            return row ? actionRecordSchema.parse(row.record) : undefined;
          },
          async save(input, event, reason = input.reason) {
            const record = actionRecordSchema.parse(input);
            if (record.scope.sessionId !== sessionId) throw new ActionError("stale_scope");
            await tx.insert(cookingActions).values({
              id: record.actionId, sessionId, idempotencyKey: record.idempotencyKey,
              record, createdAt: new Date(record.createdAt),
            }).onConflictDoUpdate({ target: cookingActions.id, set: { record } });
            // Transaction commit must include the event. No best-effort audit writes.
            await tx.insert(cookingActionEvents).values({
              actionId: record.actionId, event: eventTypeSchema.parse(event),
              status: record.status, reason: actionReasonSchema.parse(reason), createdAt: new Date(now()),
            });
          },
        });
      });
    },
    async ownerSessionId(uid, id) {
      const [row] = await database.select({ id: cookingSessions.id }).from(cookingActions)
        .innerJoin(cookingSessions, eq(cookingActions.sessionId, cookingSessions.id))
        .where(and(eq(cookingActions.id, id), eq(cookingSessions.authUserId, uid), gte(cookingActions.createdAt, cutoff())));
      return row?.id;
    },
    async prune() { await database.delete(cookingActions).where(lt(cookingActions.createdAt, cutoff())); },
  };
}

export function startActionLedgerRetention(ledger: ActionLedger): () => void {
  let running = false;
  const prune = async () => {
    if (running) return;
    running = true;
    try { await ledger.prune(); }
    catch { console.warn("[cooking-actions] retention_unavailable"); }
    finally { running = false; }
  };
  void prune();
  const timer = setInterval(() => void prune(), 60 * 60 * 1000);
  timer.unref();
  return () => clearInterval(timer);
}
