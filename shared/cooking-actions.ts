import { z } from "zod";

export const ACTION_VERSION = 1 as const;
export const ACTION_REGISTRY_VERSION = "foundation-1" as const;
export const ACTION_POLICY_VERSION = "timer-intent-1" as const;
export const actionIdSchema = z.string().uuid();
export const digestSchema = z.string().regex(/^[a-f0-9]{64}$/);
export const timerParametersSchema = z.object({ durationSeconds: z.number().int().min(1).max(86400) }).strict();
export const actionScopeSchema = z.object({
  sessionId: z.number().int().positive(),
  cookInstanceId: actionIdSchema,
  browserInstanceId: actionIdSchema,
  stateRevision: digestSchema,
  stepIndex: z.number().int().min(0).max(200),
  timerActive: z.boolean(),
}).strict();
export const actionProposalRequestSchema = z.object({
  version: z.literal(ACTION_VERSION),
  scope: actionScopeSchema,
  idempotencyKey: actionIdSchema,
  requestedAt: z.number().int().positive(),
  utterance: z.string().trim().min(1).max(2000),
  context: z.object({ step: z.string().trim().min(1).max(4000) }).strict(),
}).strict();
export const actionReferenceSchema = z.object({ actionId: actionIdSchema, scope: actionScopeSchema }).strict();
export const confirmationRequestSchema = actionReferenceSchema.extend({
  idempotencyKey: actionIdSchema,
  token: z.string().regex(/^[a-f0-9]{64}$/),
}).strict();
export const receiptRequestSchema = z.object({
  version: z.literal(ACTION_VERSION),
  scope: actionScopeSchema,
  parameterDigest: digestSchema,
  token: z.string().regex(/^[a-f0-9]{64}$/),
  result: z.enum(["applied", "not_applied"]),
}).strict();
export const actionStatusSchema = z.enum([
  "proposed", "authorized", "executing", "succeeded", "failed", "blocked", "cancelled", "expired", "outcome_unknown",
]);
export const actionReasonSchema = z.enum([
  "none", "unavailable", "invalid_request", "not_found", "inactive_cook", "stale_scope", "idempotency_conflict",
  "not_direct_request", "duration_mismatch", "timer_active", "confirmation_required", "invalid_confirmation",
  "expired", "cancelled", "receipt_missing", "invalid_receipt", "receipt_conflict", "already_dispatched",
  "provider_unavailable", "ledger_unavailable", "not_applied",
]);
export const actionViewSchema = z.object({
  actionId: actionIdSchema,
  kind: z.literal("timer.start"),
  version: z.literal(ACTION_VERSION),
  scope: actionScopeSchema,
  parameters: timerParametersSchema,
  parameterDigest: digestSchema,
  status: actionStatusSchema,
  reason: actionReasonSchema,
  createdAt: z.number().int(),
  expiresAt: z.number().int(),
}).strict();
export const actionResponseSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("advice"), text: z.string().max(2000) }).strict(),
  z.object({ type: z.literal("clarification"), text: z.string().max(2000) }).strict(),
  z.object({ type: z.literal("blocked"), reason: actionReasonSchema, action: actionViewSchema.optional() }).strict(),
  z.object({ type: z.literal("status"), action: actionViewSchema }).strict(),
  z.object({ type: z.literal("proposal"), action: actionViewSchema, confirmationToken: z.string().regex(/^[a-f0-9]{64}$/) }).strict(),
  z.object({ type: z.literal("dispatch"), action: actionViewSchema, receiptToken: z.string().regex(/^[a-f0-9]{64}$/) }).strict(),
]);
// The provider emits a single root object; neither policy nor authority is model input/output.
export const actionModelOutputSchema = z.object({
  type: z.enum(["advice", "clarification", "timer_proposal"]),
  text: z.string().max(2000),
  timer: z.object({ kind: z.literal("timer.start"), version: z.literal(1), parameters: timerParametersSchema }).strict().nullable(),
}).strict().superRefine((value, ctx) => {
  if ((value.type === "timer_proposal") !== (value.timer !== null)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Inconsistent proposal shape" });
  }
});
export type ActionScope = z.infer<typeof actionScopeSchema>;
export type ActionRequest = z.infer<typeof actionProposalRequestSchema>;
export type ActionResponse = z.infer<typeof actionResponseSchema>;
export type ActionView = z.infer<typeof actionViewSchema>;
export type ActionReason = z.infer<typeof actionReasonSchema>;
export type ActionModelOutput = z.infer<typeof actionModelOutputSchema>;
