# INIT-002 Phase 1 Telemetry Pilot

**Agent:** codex
**Branch:** `codex/init-002-phase-1-telemetry`
**Date:** 2026-06-09
**Last updated:** 2026-06-10
**Initiative:** INIT-002
**INIT updated:** yes

## Summary

This is the first live run of the daily INIT continuation automation workflow. The architecture triage selected INIT-002 Phase 1 over INIT-001 and INIT-003 because it had the clearest documented ready point, no active branch/PR ownership, high architectural leverage for later telemetry phases, and no visual/product decision dependency.

The implemented milestone is the non-persistent telemetry foundation only: request IDs, a server-side AI error classifier/logger, and wiring for the 9 documented AI route catch blocks. No DB schema, admin API, Feedback correlation, eval pipeline, provider behavior, or client UX changes landed.

After PR #160 merged INIT-004, this branch was rebased onto fresh `origin/main` and now preserves the clarified INIT boundary: INIT-002 owns operational AI failures, while INIT-004 owns output-quality evals. After PR #163 and PR #162 merged, this branch was rebased again onto `origin/main` at `02c11668b5de9367f79ce4a1f68d7caf5c42ee05`; the legacy Replit auth dependency cleanup is now in the base branch, so the Replit package-firewall blocker on `es5-ext@0.10.64` is no longer part of the PR #159 validation path. The bridge is deliberately narrow: INIT-002 clusters may become INIT-004 fixture candidates only through safe redacted or synthetic reconstruction from operational shape, never by copying raw prompts, preferences, outputs, transcripts, images, audio, stack traces, headers, tokens, user ids, or request payloads.

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

- GitHub CI/E2E is pending on PR #159's final pushed head after the PR #162 rebase.
- Direct Replit shell/browser validation is pending on the final pushed head. Wilson approved using Replit through Chrome for targeted Google sign-in and related merge-readiness checks, but Replit Agent remains approval-required because of credits.
- The Phase 2 Replit observation week remains a future handoff and should still focus on AI provider routes, ElevenLabs speech routes, and secrets/deployment posture.
- The one-run future-phase exception stops after PR #159 evidence/merge approval because INIT-002 Phase 2 is a Replit observation week and requires Wilson/Replit-side observation rather than local implementation.
- Phase 2 observation and all DB/admin/eval phases remain untouched.

## Verification

- Base refreshed: yes.
- Current base: `origin/main` at `02c11668b5de9367f79ce4a1f68d7caf5c42ee05` after PR #163 and PR #162 merged.
- Current runtime-code head before this evidence-doc refresh: `800dced99da2f05a0ad8931013555f2c4e9b4f18`.
- `git diff --check origin/main...HEAD` — passed.
- `npm ci` — passed; 852 packages installed, 0 vulnerabilities.
- `npx vitest run tests/unit/ai-error-classifier.test.ts tests/unit/ai-errors.test.ts tests/unit/phase0-security-routes.test.ts tests/unit/anonymous-production-gates-route.test.ts tests/unit/ai-provider-errors.test.ts` — passed, 5 files / 31 tests.
- `npm run check` — passed.
- `npm run build` — passed with existing Browserslist, Firebase dynamic/static import, and large-bundle warnings.
- `npm run test:unit` — passed, 36 files / 238 tests.
- GitHub CI/E2E: pending on the final pushed head.
- Last Replit-validated at: not yet validated on the final pushed head.
- Human Replit validation: targeted direct Replit shell/browser validation pending for PR #159; the longer Phase 2 observation week remains deferred.
