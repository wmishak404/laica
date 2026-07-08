# EFF-018 — Authenticated AI error handling and pantry recipe 400s

**Former ID:** EPIC-018
**Status:** Resolved
**Owner:** Wilson / Codex / Claude
**Created:** 2026-05-06
**Updated:** 2026-05-27

## One-line summary

Replace leftover public-demo error handling with authenticated-app error UX, and reconcile pantry recipe validation so normal recipe requests do not surface misleading "Demo Limit Reached" redirects.

## Context

Filed from INIT-001 Phase 3 Replit validation after a signed-in user tried to generate pantry-based recipes from the meal-planning screen and saw:

> Demo Limit Reached — You've reached the demo usage limit. Redirecting to home page...

The app then forced navigation to `/` after two seconds, interrupting the in-progress planning flow.

Investigation found two stacked problems:

1. `client/src/lib/rateLimitHandler.ts` is still framed as "demo mode". `withDemoErrorHandling` wraps recipe suggestions, cooking steps, grocery generation, ingredient alternatives, and cooking assistance. `handleAPIError` calls `handleDemoLimitReached()` for messages containing rate-limit-like strings (`rate limit`, `quota`, `429`, or `too many requests`), and otherwise shows fallback copy that still says the user may have reached the demo limit.
2. The user-facing toast was a red herring for the first failure. Replit logs showed repeated `POST /api/recipes/pantry` 400s from meal planning before real 429s appeared from retrying enough times to exhaust the bucket. The reported Zod error was `preferences` exceeding a 500-character cap. Current local source has aligned `/api/recipes/suggestions` and `/api/recipes/pantry` to a 1000-character cap, but the Replit symptom must still be reconciled against the exact running commit/build and any stricter sanitizer, prompt-manager schema, active DB prompt path, or stale server instance.

This matters because PR #21 moved Laica into real Firebase-authenticated usage with per-user rate limits. "Demo" framing and redirect-to-home behavior are no longer appropriate for authenticated production flows.

## Scope

In scope:

- Replace `withDemoErrorHandling`, `handleDemoLimitReached`, and associated copy with authenticated-app error handling.
- Remove automatic redirect-to-home behavior for AI/service failures and rate limits.
- Distinguish real 429/rate-limit responses from 400 validation failures and 5xx service failures.
- Ensure meal-planning recipe generation preserves in-progress user state when a request fails.
- Reconcile `/api/recipes/pantry` preference-length validation in Replit against source, running SHA, server restart/build state, and any other validation path.
- Add tests for error classification and pantry/suggestions preference-length acceptance.
- Add 404, 413, 422, auth, network/offline, and unknown-failure classification where those errors intersect AI-adjacent flows.
- Render Feedback as an in-place, underlined action when copy asks the user to send Feedback.

Out of scope:

- Changing rate-limit quotas themselves.
- Replacing Replit validation policy or solving broader environment parity; see EFF-017.
- Redesigning all error UI visuals beyond direct, non-demo copy.
- Designing live-cooking-specific inline retry, persistent Feedback placement, or active-cooking recovery UI; Mobile Refresh Phase 4 owns that surface.
- Persistent AI error/eval telemetry; see [EFF-019](effort-019-ai-error-telemetry-and-eval-monitoring.md).

## Decisions made so far

- Authenticated users should not see "Demo Limit Reached" copy in normal app workflows.
- AI/service/rate-limit errors should not force navigation to `/`.
- The first observed user failure was a 400 validation problem, not a true rate-limit problem; later 429s were caused by repeated retries.
- Preference caps for recipe suggestion routes should remain aligned so stale callers and alternate paths do not fail differently.
- EFF-018 should replace demo-era handling in live-cooking AI calls, but Phase 4 owns inline cooking-step recovery, Coach Feed failure placement, and inline Feedback actions because active cooking needs hands-busy-safe UI.
- Copy should use first person, plain English, no user blame for app-generated request-shape failures, and `Laica` casing when the product name appears.
- 429 copy should not show exact retry seconds; `Retry-After` stays available on the typed error for classification/timing.
- Feedback CTAs belong on errors where retrying may not be enough. Live-cooking callsites may suppress toast Feedback CTA behavior because Phase 4 owns inline Feedback placement.
- Operational AI error/eval logging should proceed as a separate Effort so this branch can ship the user-facing fix cleanly.

## Open questions

None for EFF-018. Follow-up operational telemetry work is tracked separately in [EFF-019](effort-019-ai-error-telemetry-and-eval-monitoring.md), and live-cooking inline recovery remains in Mobile Refresh Phase 4.

Historical answers from resolution:

1. Replit validation confirmed the 1000-character preference cap path at `860bd68`; Wilson reviewed the post-validation cleanup diff and carried the pass forward to `14ac1c4`.
2. No separate validator needed an EFF-018 code change after the fresh branch/rebase validation.
3. `Retry-After` remains on `ApiRequestError` for classification/timing. The resolved EFF-018 branch intentionally avoided exact retry seconds; INIT-003 later superseded the fixed "a few minutes" copy with rounded `Retry-After`-aware timing so long waits are not mislabeled.

## 2026-05-27 — INIT-003 rate-limit copy amendment

PR #107 Replit validation for the anonymous guest quota showed recipe `429 RATE_LIMITED` copy saying "a few minutes" even when the limiter could require a much longer wait. The INIT-003 production-gates branch keeps the EFF-018 no-redirect/no-exact-seconds behavior, but changes 429 copy to use rounded `Retry-After` timing such as "about 30 minutes" for longer pauses.

The same validation pass later surfaced OpenAI `insufficient_quota` after API prepaid credits ran out. INIT-003 now classifies that path separately as `AI_PROVIDER_QUOTA_EXHAUSTED` so provider-capacity failures are not presented as app rate limits or guest quota exhaustion. The user-facing copy says the issue is on Laica's AI capacity side and not the guest limit.

## Agent checklist

Read this Effort before:

- Changing `client/src/lib/rateLimitHandler.ts` or replacing `withDemoErrorHandling`
- Changing AI route error handling, toast copy, or redirect behavior
- Changing `/api/recipes/pantry` or `/api/recipes/suggestions` request schemas
- Changing recipe-generation preference construction in Meal Planning, Slop Bowl, Cooking Steps, Grocery, or ingredient alternatives
- Defining Phase 3 / Phase 3.1 Replit validation acceptance criteria for AI request failures

Also read:

- [EFF-005](effort-005-testing-strategy-and-acceptance-criteria.md)
- [EFF-017](effort-017-environment-parity-and-ci-confidence.md) if the failure appears to be stale Replit build/cache/runtime drift
- [product-decisions/pd-005-ui-governance.md](../product-decisions/pd-005-ui-governance.md) for safety/error tone

## Resolution criteria

This Effort can be resolved when all of the following are true:

1. No authenticated AI flow shows "Demo Limit Reached" or demo-limit fallback copy.
2. No AI flow automatically redirects to `/` solely because a request failed or rate-limited.
3. 400, 401/403, 404, 413, 422, 429, 5xx, network/offline, and unknown AI-adjacent failures have distinct user-facing behavior and tests where applicable.
4. Pantry recipe generation no longer returns a 400 for the Phase 3 staple-check preference context at the validated Replit commit.
5. Handoff/PR validation records the exact commit SHA and Replit result for the fixed behavior.

## 2026-05-06 — Filed From Phase 3 Replit Validation

Filed after Wilson reported the misleading demo-limit toast and repeated pantry recipe 400s during INIT-001 Phase 3 validation. At filing time, the current branch had already aligned recipe preference caps locally, but the Effort stayed open because the cross-app error handler still carried demo-era behavior and the Replit 500-character symptom needed validation against the running environment.

## 2026-05-07 — Live Cooking Error UX Deferred to Phase 4

Wilson decided that live-cooking-specific error presentation should not be solved through EFF-018 toasts. At that point, EFF-018 remained responsible for typed authenticated AI error classification, non-demo copy, and no redirect behavior across AI calls, including live-cooking callsites. Mobile Refresh Phase 4 took ownership of inline cooking-step retry/recovery, Coach Feed failure placement, and inline Feedback access for persistent mid-cook issues.

## 2026-05-07 — Resolved by PR #43

PR #43 merged EFF-018 into `main` as squash commit `1110b0088211be593d234ea26392b47384d43470`.

Resolution evidence:

- Shared `ApiRequestError` and authenticated AI error helpers replaced demo-era handling.
- AI/rate-limit failures no longer show "Demo Limit Reached" copy or redirect authenticated users to `/`.
- 400, 401/403, 404, 413, 422, 429, 5xx, network/offline, and unknown AI-adjacent errors now have classified plain-English behavior and focused tests where applicable.
- Server route/rate-limit payloads return typed codes where needed for client classification, while Slop Bowl keeps the `SLOP_BOWL_TOO_FEW_INGREDIENTS` precondition contract.
- Replit validation passed at `860bd68`; Wilson reviewed the only post-validation code diff and confirmed the pass carries to current head `14ac1c4`.
- EFF-019 preserves the separate redacted error/eval telemetry track, and Phase 4 preserves live-cooking-specific inline retry/recovery work.
