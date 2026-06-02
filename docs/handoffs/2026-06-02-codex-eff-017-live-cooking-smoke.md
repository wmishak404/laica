# EFF-017 provider-light live-cooking smoke

**Agent:** codex
**Branch:** codex/eff-017-live-cooking-smoke
**Date:** 2026-06-02
**Initiative:** none
**INIT updated:** n/a

## Summary

This branch implements the next accepted EFF-017 backlog item after PR #120 and the PR #122 closeout: extend the guest Playwright smoke from prep tray into Live Cooking without making OpenAI or ElevenLabs part of the routine merge gate. The smoke remains provider-light by stubbing the browser requests that would otherwise cross provider boundaries, while still exercising visible user-flow state in the app.

Replit remains the deployment-bound authority. This branch adds automation evidence; it does not change validation policy.

## Changes

- `tests/e2e/cooking-workflow.test.ts`
  - Refactors the existing pantry-recipe fixture into shared Playwright route helpers.
  - Adds `/api/cooking/steps` stubbing for a three-step cooking guide.
  - Stubs speech/help provider-adjacent routes so the smoke does not call OpenAI, ElevenLabs, transcription, or cooking assistance providers.
  - Extends the guest flow from setup -> Chef It Up -> prep tray -> Live Cooking.
  - Asserts the cooking-steps request payload, step rendering, `Next`/`Previous`, timer start/pause/resume behavior, and ask-for-help fallback UI when microphone access is unavailable.
- `client/src/components/cooking/live-cooking.tsx`
  - Adds an accessible label to the timer play/pause icon button so Playwright and assistive tech can target the real control.
- `efforts/effort-017-environment-parity-and-ci-confidence.md`
  - Records the small durable signal for this branch and the local DB-backed Playwright limitation.

## Impact on other agents

The new smoke is meant to run in the existing `e2e_guest_smoke` GitHub job, where CI creates a schema-only Neon branch, runs `drizzle-kit push --force`, runs `npm run db:health`, and then runs `npm run test:e2e`. Do not treat the browser route stubs as proof of live provider quality.

Local service-backed E2E remains sensitive to EFF-010. This worktree's decrypted `.env` database is stale, and EFF-010 still says agents should not casually run `npm run db:push` from arbitrary worktrees.

## Open items

- Open the PR and let GitHub Actions run the active `e2e_guest_smoke` job against its disposable Neon branch.
- Replit validation remains not yet validated.
- Remaining unvalidated scope: live OpenAI quality, ElevenLabs audio quality, Google linked login, prod OAuth preflight, real storage integration beyond the harness, full Replit deployment behavior, and exhaustive corner cases.

## Verification

Commands run locally on `codex/eff-017-live-cooking-smoke`:

- `npm ci` passed; npm reported `found 0 vulnerabilities`.
- `npx vitest run tests/unit/live-cooking-guest-session.test.tsx tests/unit/voice-recording.test.ts` passed: 2 files, 7 tests.
- `npm run test:unit` passed: 30 files, 189 tests.
- `npm run check` passed.
- `npm run build` passed. Observed warnings were the existing Browserslist age notice, Firebase dynamic/static import chunk note, and chunk-size warning.
- `git diff --check` passed.
- `npx @dotenvx/dotenvx run -- npm run db:health` failed against the configured local `.env` database with missing tables `ai_interactions`, `prompt_versions`, `anonymous_recipe_usage` and missing column `cooking_sessions.recipe_snapshot`.
- `PORT=5501 PLAYWRIGHT_BASE_URL=http://127.0.0.1:5501 npx @dotenvx/dotenvx run -- npx playwright test tests/e2e/cooking-workflow.test.ts --project=chromium --workers=1` failed locally because guest auth could not complete after the stale local DB rejected `/api/auth/session`. This is environment/schema drift, not a product assertion from this branch.

### Automation evidence reports

**Claim:** The branch adds provider-light Playwright coverage for guest prep tray into Live Cooking.

**Command/check provenance:** Static and unit checks ran locally in the Codex macOS worktree on branch `codex/eff-017-live-cooking-smoke`. The DB-backed browser smoke was attempted locally with dotenvx on port `5501`, then blocked by local schema drift. GitHub `e2e_guest_smoke` is the expected DB-backed evidence path after PR creation because it applies schema to a disposable Neon branch before running Playwright.

**Source provenance:** `tests/e2e/cooking-workflow.test.ts` drives the existing guest setup and Chef It Up path, stubs `/api/recipes/pantry`, `/api/cooking/steps`, `/api/speech/synthesize`, `/api/speech/transcribe`, and `/api/cooking/assistance`, and asserts visible Live Cooking state plus request payloads. `client/src/components/cooking/live-cooking.tsx` exposes the timer play/pause control by accessible label.

**Observed result:** Typecheck/lint, build, focused unit tests, full unit suite, and diff hygiene passed locally. The local DB preflight failed with missing tables/column, and the local Playwright run timed out waiting for setup after `/api/auth/session` failed on the missing `anonymous_recipe_usage` table.

**Reasoning:** The passing static/unit checks prove the new test and timer label compile and do not regress existing unit-covered behavior. The attempted local Playwright run proves the harness starts against the real app on a non-conflicting port, but local DB schema drift prevents it from reaching the new assertions. Because CI creates and migrates a clean schema-only Neon branch before E2E, CI is the correct automation environment for the DB-backed browser claim.

**Negative scope:** This branch does not validate live OpenAI output quality, ElevenLabs audio quality, Google linked login, production OAuth preflight, real storage integration beyond the harness, full Replit deployment behavior, or exhaustive corner cases. It also does not authorize or perform a local `db:push`.

## Stack / base status

- Base refreshed: yes
- Current base: `origin/main` at `b66848881bc0d1c538258af8177892793aec521f`
- Last Replit-validated at: not yet validated
- Notes: branch started after PR #120 merged as `df4e2d563113cdc58c898dd871ccdaaeb0fd5409`, PR #122 merged as `c3e782a63a63304aa45ab62e53842263f5f9aa59`, and current `origin/main` also included PR #121.
