import { ACTION_POLICY_VERSION, ACTION_REGISTRY_VERSION, timerParametersSchema } from "@shared/cooking-actions";

export interface ActionCaller { uid: string; isAnonymous: boolean; caller: "live_cooking" }
export interface ActionPolicy {
  kind: "timer.start";
  version: 1;
  registryVersion: typeof ACTION_REGISTRY_VERSION;
  policyVersion: typeof ACTION_POLICY_VERSION;
  allowedCallers: readonly ["live_cooking"];
  contextPack: "current_step";
  risk: "reversible_local";
  confirmation: "direct_request" | "required";
  expiresMs: number;
  receiptTimeoutMs: number;
  idempotency: "owned_session";
  executor?: "browser";
}
// Deliberately no production executor. Environment configuration alone cannot activate one.
export const productionActionRegistry: Readonly<ActionPolicy> = Object.freeze({
  kind: "timer.start", version: 1, registryVersion: ACTION_REGISTRY_VERSION, policyVersion: ACTION_POLICY_VERSION,
  allowedCallers: ["live_cooking"] as const, contextPack: "current_step", risk: "reversible_local",
  confirmation: "direct_request", expiresMs: 120000, receiptTimeoutMs: 30000, idempotency: "owned_session",
});
export function isActionPilot(caller: ActionCaller, env: NodeJS.ProcessEnv = process.env): boolean {
  return env.COOKING_ACTIONS_ENABLED === "true" && !caller.isAnonymous &&
    (env.COOKING_ACTIONS_PILOT_UIDS ?? "").split(/[\s,]+/).filter(Boolean).includes(caller.uid);
}
export function actionEnabled(caller: ActionCaller, policy: ActionPolicy, env: NodeJS.ProcessEnv = process.env): boolean {
  return isActionPilot(caller, env) && env.COOKING_ACTION_TIMER_START_ENABLED === "true" &&
    policy.executor === "browser" && policy.allowedCallers.includes(caller.caller);
}

const smallNumbers: Record<string, number> = {
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17,
  eighteen: 18, nineteen: 19, twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60,
};
function parseNumber(value: string): number {
  if (/^\d+$/.test(value)) return Number(value);
  if (smallNumbers[value]) return smallNumbers[value];
  const [tens, ones, extra] = value.split(/[ -]/);
  return !extra && smallNumbers[tens] >= 20 && smallNumbers[ones] < 10 ? smallNumbers[tens] + smallNumbers[ones] : NaN;
}
export function bindDirectTimerRequest(utterance: string): { durationSeconds: number; source: "explicit_duration" } | null {
  // Whole-utterance grammar excludes negation, quoted instructions, suggestions, ranges, and bundled requests.
  // Step-derived duration is intentionally unavailable until Phase 2 validates the step/controller contract.
  const text = utterance.trim().toLowerCase();
  const match = /^(?:please |(?:can|could) you )?(?:start|set) (?:a |the )?timer (?:for )?([a-z -]+|\d+) (seconds?|minutes?|hours?)(?: please)?[.!?]?$/.exec(text);
  if (!match) return null;
  const durationSeconds = parseNumber(match[1]) * (match[2].startsWith("hour") ? 3600 : match[2].startsWith("minute") ? 60 : 1);
  return timerParametersSchema.safeParse({ durationSeconds }).success ? { durationSeconds, source: "explicit_duration" } : null;
}
