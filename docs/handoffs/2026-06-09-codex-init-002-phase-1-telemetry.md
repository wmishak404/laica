# INIT-002 Phase 1 Telemetry Pilot

**Agent:** codex
**Branch:** `codex/init-002-phase-1-telemetry`
**Date:** 2026-06-09
**Initiative:** INIT-002
**INIT updated:** yes

## Summary

This is the first live run of the daily INIT continuation automation workflow. The architecture triage selected INIT-002 Phase 1 over INIT-001 and INIT-003 because it had the clearest documented ready point, no active branch/PR ownership, high architectural leverage for later telemetry phases, and no visual/product decision dependency.

The implemented milestone is the non-persistent telemetry foundation only: request IDs, a server-side AI error classifier/logger, and wiring for the 9 documented AI route catch blocks. No DB schema, admin API, Feedback correlation, eval pipeline, provider behavior, or client UX changes landed.

After PR #160 merged INIT-004, this branch was rebased onto fresh `origin/main` and now preserves the clarified INIT boundary: INIT-002 owns operational AI failures, while INIT-004 owns output-quality evals. The bridge is deliberately narrow: INIT-002 clusters may become INIT-004 fixture candidates only through safe redacted or synthetic reconstruction from operational shape, never by copying raw prompts, preferences, outputs, transcripts, images, audio, stack traces, headers, tokens, user ids, or request payloads.

## Changes

- `server/requestId.ts`
  - Adds `/api/*` request ID middleware using server-generated UUID v4 values.
  - Sets `X-Request-Id`, stores `req.requestId`, records request start time, and overwrites client-supplied IDs.
- `server/aiErrorClassifier.ts`
  - Adds pure `classifyAiError(error, ctx)` with derived `errorClass`, safe `errorCode`, `httpStatus`, capped `retryAfterSeconds`, and `vendor`.
  - Mirrors the shipped EFF-018 taxonomy while keeping provider-side 401/403 under `upstream_auth`.
- `server/aiErrors.ts`
  - Adds `logAiError(input)` for one allowlisted JSON line to `console.error`.
  - Logs request/route/feature/vendor/status/class/code/count/hash/latency fields only; it does not log prompts, preference text, ingredient labels, image/audio bytes, filenames, headers, tokens, stack traces, or raw error messages.
- `server/routes.ts`
  - Registers request IDs before the API rate limiter.
  - Replaces raw AI catch-block error logging with `logAiError` for `/api/recipes/suggestions`, `/api/recipes/pantry`, `/api/recipes/slop-bowl`, `/api/cooking/steps`, `/api/cooking/assistance`, `/api/vision/analyze`, `/api/speech/synthesize`, `/api/speech/voices`, and `/api/speech/transcribe`.
- `tests/unit/ai-error-classifier.test.ts`
  - Adds classifier coverage for validation, linked-account preconditions, provider rate limits, provider auth failures, network failures, and provider quota exhaustion.
- `tests/unit/ai-errors.test.ts`
  - Adds logger shape/redaction assertions and request-ID middleware coverage.
- `product-decisions/pd-010-ai-error-telemetry-allowlist.md`
  - Records the Phase 1 `error_class` expansion used by stdout telemetry.
- `initiatives/INIT-002-ai-error-telemetry.md` and `initiatives/registry.md`
  - Move Phase 1 into active branch status and update the current resume point.

## Impact on other agents

INIT-002 Phase 1 is now owned by [PR #159](https://github.com/wmishak404/laica/pull/159) / `codex/init-002-phase-1-telemetry`. Do not start a second Phase 1 branch unless this PR closes or merges.

Phase 2 remains the Replit observation week. Phase 3 remains the first DB persistence phase and must still follow EFF-010 before any `ai_error_events` schema or `db:push` work. The logger's stdout shape is intentionally close to the future PD-010 table shape so Phase 3 can reuse the same allowlist instead of inventing a second telemetry contract.

INIT-004 Phase 1 can later consume safe fixture candidates from repeated INIT-002 `validation`, `unknown`, or response-contract clusters. Provider outage, network, upstream auth, upstream 5xx, secrets, deployment, and auth clusters should stay in INIT-002/infra unless Wilson explicitly reframes them as quality eval cases.

## Open items

- GitHub CI/E2E is pending on PR #159's rebased pushed head.
- Wilson accepted deferring human Replit validation to Phase 2 observation on 2026-06-09. Phase 2 should still focus on AI provider routes, ElevenLabs speech routes, and secrets/deployment posture.
- The one-run future-phase exception stops after PR #159 evidence/merge approval because INIT-002 Phase 2 is a Replit observation week and requires Wilson/Replit-side observation rather than local implementation.
- Phase 2 observation and all DB/admin/eval phases remain untouched.

## Verification

- Base refreshed: yes.
- Current base: `origin/main` at `b156c197020679f48137f70d37077646962b4add` after PR #160 merged INIT-004.
- `npm ci` — passed; 904 packages installed, 0 vulnerabilities.
- `npx vitest run tests/unit/ai-error-classifier.test.ts tests/unit/ai-errors.test.ts` — passed, 2 files / 7 tests.
- Rebased follow-up validation:
  - `git diff --check` — passed.
  - `npx vitest run tests/unit/ai-error-classifier.test.ts tests/unit/ai-errors.test.ts tests/unit/phase0-security-routes.test.ts tests/unit/anonymous-production-gates-route.test.ts tests/unit/ai-provider-errors.test.ts` — passed, 5 files / 31 tests.
  - `npm run check` — passed.
  - `npm run build` — passed with existing Browserslist, Firebase dynamic/static import, and large-bundle warnings.
- Last Replit-validated at: not yet validated.
- Human Replit validation: deferred to INIT-002 Phase 2 observation per Wilson on 2026-06-09.
