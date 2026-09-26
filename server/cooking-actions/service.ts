import { randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import {
  ACTION_POLICY_VERSION, ACTION_REGISTRY_VERSION, actionModelOutputSchema, actionProposalRequestSchema,
  confirmationRequestSchema, receiptRequestSchema, type ActionResponse, type ActionScope, type ActionRequest,
} from "@shared/cooking-actions";
import { ACTION_RETENTION_MS, ActionError, actionView, digest, type ActionLedger, type ActionRecord, type ActionTransaction } from "./ledger";
import { actionEnabled, bindDirectTimerRequest, isActionPilot, productionActionRegistry, type ActionCaller, type ActionPolicy } from "./policy";

interface Dependencies {
  ledger: ActionLedger;
  propose: (input: Pick<ActionRequest, "utterance" | "context">) => Promise<unknown>;
  policy?: Readonly<ActionPolicy>;
  env?: () => NodeJS.ProcessEnv;
  now?: () => number;
}
const sameScope = (a: ActionScope, b: ActionScope) => digest(a) === digest(b);
const tokenMatches = (token: string, hash: string | null) => hash !== null && timingSafeEqual(Buffer.from(digest(token)), Buffer.from(hash));
const newToken = () => randomBytes(32).toString("hex");
const statusResponse = (record: ActionRecord): ActionResponse => ({ type: "status", action: actionView(record) });

export function createCookingActionService(deps: Dependencies) {
  const policy = deps.policy ?? productionActionRegistry;
  const now = deps.now ?? Date.now;
  const env = deps.env ?? (() => process.env);

  async function refresh(tx: ActionTransaction, record: ActionRecord) {
    if (record.createdAt < now() - ACTION_RETENTION_MS) throw new ActionError("not_found", 404);
    if ((record.status === "proposed" || record.status === "authorized") && record.expiresAt <= now()) {
      record.status = "expired"; record.reason = "expired"; record.confirmationHash = null;
      await tx.save(record, "expired");
    } else if (record.status === "executing" && record.dispatchedAt !== null && record.dispatchedAt + policy.receiptTimeoutMs <= now()) {
      record.status = "outcome_unknown"; record.reason = "receipt_missing";
      await tx.save(record, "outcome_unknown");
    }
    return record;
  }
  function executionGate(caller: ActionCaller, tx: ActionTransaction, record: ActionRecord) {
    if (!tx.active) return "inactive_cook" as const;
    if (!actionEnabled(caller, policy, env()) || record.registryVersion !== policy.registryVersion || record.policyVersion !== policy.policyVersion) return "unavailable" as const;
    if (record.scope.timerActive) return "timer_active" as const;
    return null;
  }
  async function dispatch(tx: ActionTransaction, caller: ActionCaller, record: ActionRecord): Promise<ActionResponse> {
    const reason = executionGate(caller, tx, record);
    if (reason) {
      record.status = "blocked"; record.reason = reason; record.confirmationHash = null;
      await tx.save(record, "blocked");
      return { type: "blocked", reason, action: actionView(record) };
    }
    record.status = "authorized"; record.reason = "none"; record.confirmationHash = null;
    await tx.save(record, "authorized");
    const receiptToken = newToken();
    record.receiptHash = digest(receiptToken); record.dispatchedAt = now(); record.status = "executing";
    await tx.save(record, "dispatched");
    const revoked = executionGate(caller, tx, record);
    if (revoked) throw new ActionError(revoked);
    // Returned only after the surrounding transaction commits. Retries/status never release another directive.
    return { type: "dispatch", action: actionView(record), receiptToken };
  }
  async function ownedAction<T>(caller: ActionCaller, id: string, work: (tx: ActionTransaction, record: ActionRecord) => Promise<T>) {
    const sessionId = await deps.ledger.ownerSessionId(caller.uid, id);
    if (!sessionId || caller.isAnonymous) throw new ActionError("not_found", 404);
    return deps.ledger.transaction(caller.uid, sessionId, async tx => {
      const record = await tx.get(id);
      if (!record) throw new ActionError("not_found", 404);
      return work(tx, await refresh(tx, record));
    });
  }
  return {
    async capabilities(caller: ActionCaller, sessionId: number) {
      if (!actionEnabled(caller, policy, env())) return { version: 1, capabilities: [] };
      return deps.ledger.transaction(caller.uid, sessionId, async tx => ({
        version: 1, capabilities: tx.active ? [{ kind: policy.kind, version: policy.version }] : [],
      }));
    },
    async propose(caller: ActionCaller, input: unknown): Promise<ActionResponse> {
      const request = actionProposalRequestSchema.parse(input);
      if (!isActionPilot(caller, env()) || !policy.allowedCallers.includes(caller.caller)) return { type: "blocked", reason: "unavailable" };
      const binding = bindDirectTimerRequest(request.utterance);
      const requestDigest = digest({ scope: request.scope, requestedAt: request.requestedAt, durationSeconds: binding?.durationSeconds ?? null });
      const getExisting = async (tx: ActionTransaction) => {
        const existing = await tx.getByKey(request.idempotencyKey);
        if (existing && existing.requestDigest !== requestDigest) throw new ActionError("idempotency_conflict");
        return existing ? statusResponse(await refresh(tx, existing)) : null;
      };
      const existing = await deps.ledger.transaction(caller.uid, request.scope.sessionId, async tx => {
        const previous = await getExisting(tx);
        if (previous) return previous;
        if (!tx.active) throw new ActionError("inactive_cook");
        if (request.requestedAt > now() + 5000 || request.requestedAt < now() - policy.expiresMs) throw new ActionError("expired");
        return null;
      });
      if (existing) return existing;
      let output;
      try {
        // Deliberately no identities, revisions, idempotency keys or secrets in the model context.
        output = actionModelOutputSchema.parse(await deps.propose({ utterance: request.utterance, context: request.context }));
      } catch { return { type: "blocked", reason: "provider_unavailable" }; }
      if (output.type !== "timer_proposal" || !output.timer) return { type: output.type === "clarification" ? "clarification" : "advice", text: output.text };
      const parameters = output.timer.parameters;
      return deps.ledger.transaction(caller.uid, request.scope.sessionId, async tx => {
        const previous = await getExisting(tx);
        if (previous) return previous;
        // A slow provider cannot extend a request's dispatch window.
        if (request.requestedAt + policy.expiresMs <= now()) throw new ActionError("expired");
        const record: ActionRecord = {
          actionId: randomUUID(), kind: "timer.start", version: 1, scope: request.scope, parameters,
          parameterDigest: digest(parameters), status: "proposed", reason: "none", createdAt: now(),
          expiresAt: request.requestedAt + policy.expiresMs, idempotencyKey: request.idempotencyKey, requestDigest,
          registryVersion: ACTION_REGISTRY_VERSION, policyVersion: ACTION_POLICY_VERSION, caller: caller.caller,
          authMode: "linked", authorization: binding ? "explicit_duration" : "none", confirmationHash: null,
          receiptHash: null, dispatchedAt: null, result: null,
        };
        await tx.save(record, "proposed");
        const reason = executionGate(caller, tx, record) ?? (!binding ? "not_direct_request" : binding.durationSeconds !== parameters.durationSeconds ? "duration_mismatch" : null);
        if (reason) {
          record.status = "blocked"; record.reason = reason;
          await tx.save(record, "blocked");
          return { type: "blocked", reason, action: actionView(record) };
        }
        if (policy.confirmation === "required") {
          const confirmationToken = newToken();
          record.confirmationHash = digest(confirmationToken); record.reason = "confirmation_required";
          await tx.save(record, "proposed");
          return { type: "proposal", action: actionView(record), confirmationToken };
        }
        return dispatch(tx, caller, record);
      });
    },
    async confirm(caller: ActionCaller, input: unknown): Promise<ActionResponse> {
      const request = confirmationRequestSchema.parse(input);
      return ownedAction(caller, request.actionId, async (tx, record) => {
        if (!sameScope(request.scope, record.scope)) throw new ActionError("stale_scope");
        if (record.status !== "proposed" || record.idempotencyKey !== request.idempotencyKey || !tokenMatches(request.token, record.confirmationHash)) throw new ActionError("invalid_confirmation");
        record.authorization = "confirmation";
        return dispatch(tx, caller, record);
      });
    },
    async cancel(caller: ActionCaller, id: string, scope: ActionScope): Promise<ActionResponse> {
      return ownedAction(caller, id, async (tx, record) => {
        if (!sameScope(scope, record.scope)) throw new ActionError("stale_scope");
        if (record.status === "cancelled" || record.status === "expired") return statusResponse(record);
        if (record.status !== "proposed" && record.status !== "authorized") throw new ActionError("already_dispatched");
        record.status = "cancelled"; record.reason = "cancelled"; record.confirmationHash = null;
        await tx.save(record, "cancelled");
        return statusResponse(record);
      });
    },
    async status(caller: ActionCaller, id: string): Promise<ActionResponse> {
      return ownedAction(caller, id, async (_tx, record) => statusResponse(record));
    },
    async receipt(caller: ActionCaller, id: string, input: unknown): Promise<ActionResponse> {
      const request = receiptRequestSchema.parse(input);
      return ownedAction(caller, id, async (tx, record) => {
        if (!sameScope(request.scope, record.scope) || request.parameterDigest !== record.parameterDigest || !tokenMatches(request.token, record.receiptHash) || record.dispatchedAt === null) throw new ActionError("invalid_receipt");
        if (record.result !== null) {
          if (record.result !== request.result) {
            await tx.save(record, "receipt_conflict", "receipt_conflict");
            return { type: "blocked", reason: "receipt_conflict", action: actionView(record) };
          }
          return statusResponse(record);
        }
        if (record.status !== "executing" && record.status !== "outcome_unknown") throw new ActionError("invalid_receipt");
        record.result = request.result; record.status = request.result === "applied" ? "succeeded" : "failed";
        record.reason = request.result === "applied" ? "none" : "not_applied";
        await tx.save(record, "result");
        return statusResponse(record);
      });
    },
  };
}
