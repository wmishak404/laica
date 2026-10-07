import { z } from "zod";
import { createHash } from "node:crypto";
import { ACTION_POLICY_VERSION, ACTION_REGISTRY_VERSION, actionViewSchema, actionIdSchema, digestSchema, type ActionReason } from "@shared/cooking-actions";

export const ACTION_RETENTION_MS = 90 * 24 * 60 * 60 * 1000;
export const actionRecordSchema = actionViewSchema.extend({
  idempotencyKey: actionIdSchema,
  requestDigest: digestSchema,
  registryVersion: z.literal(ACTION_REGISTRY_VERSION),
  policyVersion: z.literal(ACTION_POLICY_VERSION),
  caller: z.literal("live_cooking"),
  authMode: z.literal("linked"),
  authorization: z.enum(["none", "explicit_duration", "confirmation"]),
  confirmationHash: digestSchema.nullable(),
  receiptHash: digestSchema.nullable(),
  dispatchedAt: z.number().int().nullable(),
  result: z.enum(["applied", "not_applied"]).nullable(),
}).strict();
export type ActionRecord = z.infer<typeof actionRecordSchema>;
export const eventTypeSchema = z.enum(["proposed", "authorized", "dispatched", "blocked", "cancelled", "expired", "outcome_unknown", "result", "receipt_conflict"]);
export type EventType = z.infer<typeof eventTypeSchema>;
export interface ActionTransaction {
  active: boolean;
  get(id: string): Promise<ActionRecord | undefined>;
  getByKey(key: string): Promise<ActionRecord | undefined>;
  save(record: ActionRecord, event: EventType, reason?: ActionReason): Promise<void>;
}
export interface ActionLedger {
  transaction<T>(uid: string, sessionId: number, work: (tx: ActionTransaction) => Promise<T>): Promise<T>;
  ownerSessionId(uid: string, actionId: string): Promise<number | undefined>;
  prune(): Promise<void>;
}
export class ActionError extends Error {
  constructor(public readonly reason: ActionReason, public readonly status = 409) { super(reason); }
}
export function digest(value: unknown): string {
  // Inputs are canonical schema-parsed objects assembled by the server; never hash/store the utterance.
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}
export function actionView(record: ActionRecord) {
  const { actionId, kind, version, scope, parameters, parameterDigest, status, reason, createdAt, expiresAt } = record;
  return actionViewSchema.parse({ actionId, kind, version, scope, parameters, parameterDigest, status, reason, createdAt, expiresAt });
}
