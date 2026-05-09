# EFFORT-018 authenticated AI error handling

**Agent:** codex
**Branch:** codex/epic-018-auth-ai-errors
**Date:** 2026-05-07
**Initiative:** INIT-001
**INIT updated:** yes

## Summary

Implemented EFFORT-018 so authenticated AI failures no longer use demo-era copy or redirect users to `/`. The branch adds a shared typed request error, authenticated AI error classification, typed server payloads for AI/rate-limit failures, first-person plain-English copy, and tests for the status classes Wilson and Claude reviewed.

The branch was rebased onto `origin/main` after PR #40 merged. PR #40 is `bc242a0` (`Docs: add Replit validation focus guide (#40)`).

## Changes

- `client/src/lib/queryClient.ts`: adds `ApiRequestError` with `status`, `code`, parsed `body`, `retryAfter`, `responseText`, and status-prefixed `message` for compatibility.
- `client/src/lib/rateLimitHandler.ts`: replaces demo helpers with `withAiErrorHandling`, `handleAiRequestError`, `classifyAiRequestError`, `isRateLimitError`, `isAIServiceError`, and `OPEN_FEEDBACK_EVENT`. Removes redirect behavior.
- AI callsites in Planning, recipe suggestions, grocery helpers, live cooking, and Slop Bowl now use the authenticated classifier. Live cooking suppresses Feedback CTA to keep inline recovery deferred to Phase 4.
- `client/src/lib/openai.ts` and Slop Bowl: remove one-off `SlopBowlApiError`; Slop Bowl now branches on shared `ApiRequestError.body?.code`.
- `server/rate-limit.ts`: returns typed `429` body `{ code: "RATE_LIMITED", message }` while preserving `Retry-After`.
- `server/routes.ts`: returns typed `400` payloads for AI route Zod failures, `PREFERENCES_TOO_LONG` for preference length violations, and typed `5xx` AI service payloads.
- Copy pass updates adjacent user-facing errors to first-person/plain-English phrasing and `Laica` casing.
- `product-decisions/features/mobile-refresh/pd-phase-04-cooking.md`: records Phase 4 ownership of live-cooking inline retry/recovery and inline Feedback placement.
- `efforts/effort-018-authenticated-ai-error-handling.md`: updates EFFORT-018 scope, decisions, copy principles, and telemetry deferral.
- `efforts/effort-019-ai-error-telemetry-and-eval-monitoring.md`: new separate epic for redacted operational AI error telemetry/evals.
- `efforts/effort-007-vision-scan-no-detection-feedback.md`, `efforts/README.md`, `efforts/registry.md`, and `initiatives/INIT-001-mobile-refresh.md`: update active epic/initiative context.
- Tests added/updated for AI error classification/copy/no redirect, typed route payloads, rate-limit payloads, Slop Bowl guard, and scan rate-limit copy.

## Impact on other agents

Claude/Replit should validate the branch from GitHub using the exact branch name `codex/epic-018-auth-ai-errors`. The prior docs-only branch `codex/epic-018-ai-error-handling` is not used and was not present on origin when checked locally.

EFFORT-018 intentionally does not implement persistent error logging. Use [EFFORT-019](../../efforts/effort-019-ai-error-telemetry-and-eval-monitoring.md) for that parallel work, especially the allowlist-first redaction policy.

Phase 4 owns live-cooking-specific presentation: inline step retry/recovery, Coach Feed failure placement, and inline Feedback access. EFFORT-018 only removes demo behavior and supplies shared classification/copy.

## Open items

- Replit validation passed at `860bd68` before the final cleanup commit. The final cleanup commit `27c9354` aligned Slop Bowl inline copy to the spec and removed dead `showDemoVideo` / `demoVideoUrl` state. Per the stacked PR validation rule, the current head still needs a quick Replit SHA refresh before merge.
- If Replit still reports a 500-character preference cap, treat it first as stale branch/server state. If the validated SHA is correct, inspect which layer rejects the generated preference string.
- Full repo-wide `npx vitest run` was not run because known harness issues outside this branch still exist in this repo; focused coverage passed.

## Verification

Local validation completed after rebasing onto PR #40:

- `git diff --check`
- `npm run check`
- `npm run build`
- `npx vitest run tests/unit/ai-error-handling.test.tsx tests/unit/phase0-security-routes.test.ts tests/unit/rate-limit.test.ts tests/unit/slop-bowl-route.test.ts tests/unit/user-profiling.test.tsx`

Browser validation was also run locally against `http://127.0.0.1:3000` with a temporary Vite-only harness that mounted the real `handleAiRequestError`, `Toaster`, and `FeedbackModal`. The harness was removed afterward. Browser pass confirmed:

- `400`, `401/403`, `404`, `413`, `422`, `429`, `500`, and network copy rendered.
- No navigation on `400`, `429`, or `500`.
- `429` did not expose exact retry seconds.
- Underlined `Feedback` opened the existing Feedback modal.
- Live-cooking-style `feedbackLink: false` suppressed the Feedback CTA.

Replit validation at `860bd68` passed:

- Signed-in pantry recipe generation: 1000-character cap unified, no demo copy, no redirect.
- Refresh suggestions: errors return `null` and stay in-flow without navigation.
- Forced `5xx` Feedback toast: exact copy matched; underlined Feedback button opened the modal.
- Forced `429`: exact copy matched, no exact seconds, no redirect.
- Slop Bowl sparse pantry guard: functional, with cleanup requested for exact inline copy.
- Live cooking boundary: `feedbackLink: false`, no demo copy, no redirect.
- TypeScript, build, and 41 focused unit tests: pass.

Cleanup after that Replit run:

- `27c9354`: Slop Bowl inline guard copy now exactly matches `Add at least 3 ingredients before generating a Slop Bowl.`
- `27c9354`: removed unused live-cooking `showDemoVideo` / `demoVideoUrl` state.
- Post-cleanup local checks passed: `git diff --check`, `npm run check`, and `npx vitest run tests/unit/ai-error-handling.test.tsx tests/unit/slop-bowl-route.test.ts`.

## Stack / base status

- Base refreshed: yes
- Current base: `origin/main` at `bc242a0`
- Last Replit-validated at: `860bd68` (stale after cleanup commit `27c9354`; quick SHA refresh needed)
- Notes: rebased after PR #40 merged into `origin/main`; cleanup commit addressed Replit's non-blocking notes.

## Suggested Replit validation

Validate branch `codex/epic-018-auth-ai-errors` at the pushed commit:

1. Signed-in Meal Planning recipe generation: no demo copy, no redirect, and normal Phase 3 preference context does not hit a stale 500-character cap.
2. Refresh/regenerate suggestions: failures keep the user in the Planning/Ticket Pass flow.
3. If easy, force `5xx`: copy should say `I couldn't finish that request right now. Try again shortly. Send us Feedback if this issue keeps persisting.` The underlined Feedback link should open the existing Feedback modal.
4. If easy, force `429`: copy should say `I need to pause cooking requests for a bit. Try again in a few minutes.` It should not show exact seconds and should not redirect.
5. Slop Bowl sparse pantry guard: fewer than 3 ingredients should still show `Add at least 3 ingredients before generating a Slop Bowl.`
6. Live cooking failure if easy: no demo copy, no redirect, and no expectation of Phase 4 inline retry UI yet.
