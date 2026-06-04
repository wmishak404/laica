# EFF-017 guest quota-copy smoke

**Agent:** codex
**Branch:** codex/eff-017-guest-quota-copy-smoke
**Date:** 2026-06-04
**Initiative:** INIT-003
**INIT updated:** read, not changed

## Summary

This branch implements the first near-term EFF-017 follow-up from the anonymous-promotion CI retro: prove the guest recipe-cap copy with a deterministic forced response instead of spending ten real recipe generations to reach guest attempt `#11`. The test keeps the routine browser gate provider-light and checks the actual user-facing title/body that should appear when `POST /api/recipes/pantry` returns `403 LINKED_ACCOUNT_REQUIRED`.

PR #130 merged as `fc75ae0c50ab95b7de72195d4e146981055b81af`.

## Changes

- `tests/e2e/cooking-workflow.test.ts`
  - Adds `stubPantryRecipeQuotaRequired`, which fulfills `POST /api/recipes/pantry` with `403 LINKED_ACCOUNT_REQUIRED` and `linkedAccountReason: recipe_quota`.
  - Splits the existing Chef It Up helper so tests can stop at the staple-selection/request boundary without requiring successful recipe cards.
  - Adds a focused Playwright test that drives the guest setup and Chef It Up planning path, triggers the forced `403`, and asserts `Sign up to unlock more recipes` plus `Sign up before making more recipes.`
- `efforts/effort-017-environment-parity-and-ci-confidence.md`
  - Records the PR #125 and PR #129 merge signals and the new forced-response branch signal.

## INIT-003 interaction

INIT-003 was read because this covers guest quota/promotion behavior. The branch does not change the accepted guest model, quota policy, linked-account boundary, or Phase 5 durable-memory scope. It only adds deterministic browser coverage for copy that was previously treated as an optional guest `#11` recheck after PR #126.

## Verification

Automation is evidence for the stated forced-response UI claim, not a conclusion about full app correctness.

**Claim:** When a guest reaches the recipe-cap boundary represented by `403 LINKED_ACCOUNT_REQUIRED` from `POST /api/recipes/pantry`, the browser flow shows the accepted recipe-cap copy without needing real provider calls or ten successful generations.

**Command/check provenance:**

- Local macOS worktree `/Users/wilsonishak-macbookpro/.codex/worktrees/ba8b/laica`, branch `codex/eff-017-guest-quota-copy-smoke`, base `origin/main` at `9adc6d93c8445b4770713972607631a196b1d4c2`.
- `npm run check` passed.
- `npm run build` passed, with the known Browserslist age, Firebase dynamic/static import, and chunk-size warnings.
- `git diff --check` passed.
- `CI=1 npx playwright test tests/e2e/cooking-workflow.test.ts --project=chromium -g "Guest recipe quota block" --list` passed and discovered the new Chromium test.
- GitHub Actions on head `de4e03e030a36d4fd6760a1f37516db7d817e1e1` passed:
  - Dependency Audit (High/Critical) run #190, job `npm-audit`.
  - Secret Scan (TruffleHog) run #190, job `trufflehog_pr`; `trufflehog_push` skipped because this was a PR event.
  - CI (Typecheck, Unit, E2E) run #52, jobs `unit` and `e2e_guest_smoke`.
  - CodeQL completed successfully.
- Focused local Playwright execution did not produce app-behavior evidence:
  - `CI=1 npx @dotenvx/dotenvx run -- npx playwright ...` failed before startup because sandboxed DNS blocked fetching `@dotenvx/dotenvx`; escalation was rejected because downloading npm code while decrypting secrets is a secret-exfiltration risk.
  - `CI=1 npx playwright test ...` failed before startup in the sandbox because `tsx` could not create its IPC pipe (`EPERM`).
  - Unsandboxed `CI=1 npx playwright test ...` reached Playwright but found port `5000` already in use.
  - Unsandboxed isolated-port retry reached server startup but failed with `DATABASE_URL must be set`; local decrypted env was therefore not available through a safe path.

**Source provenance:**

- `tests/e2e/cooking-workflow.test.ts`
  - Forced `POST /api/recipes/pantry` response.
  - Assertion for the title `Sign up to unlock more recipes`.
  - Assertion for the body `Sign up before making more recipes.`
- `client/src/lib/rateLimitHandler.ts`
  - Classifies `LINKED_ACCOUNT_REQUIRED` with non-`durable_save` reason as the recipe-cap copy.

**Observed result:**

- Static/type/lint checks passed.
- Production build passed.
- Playwright discovered the new Chromium test without running it locally.
- GitHub dependency audit, TruffleHog PR scan, typecheck/lint/build/unit, CodeQL, and guest E2E smoke passed on the PR head.
- GitHub `e2e_guest_smoke` created and deleted its schema-only Neon branch successfully; `DB Schema Health` and `E2E (guest smoke)` both passed.
- Local browser execution remains unvalidated because of local env/tooling constraints listed above.

**Reasoning:**

The test forces the same typed server response that represents the guest recipe-cap boundary and verifies the user-facing copy from the real browser UI. Because the route is stubbed, the test reaches the copy boundary directly and avoids paid provider calls, real quota consumption, and slow attempt counting. GitHub Actions provided the browser execution proof through the guest E2E lane with disposable Neon schema-health setup and Chromium dependencies.

**Negative scope:**

- Not live OpenAI quality.
- Not ElevenLabs audio quality.
- Not Google linked login.
- Not prod OAuth preflight.
- Not real storage integration beyond the GitHub/Replit harness.
- Not full Replit deployment behavior.
- Not Replit-shell Playwright until Chromium dependencies are configured.
- Not exhaustive quota/accounting corner cases.
- Not proof that ten real successful recipe generations increment quota correctly; that remains covered by prior runtime validation and server-route tests, not this forced-response UI check.

## Replit validation

Last Replit-validated at: not required.

Rationale: test-only forced-response coverage. No runtime app behavior, UI copy source, schema, auth policy, secrets, provider code, deployment config, or live-provider behavior changed. Replit remains primary for deployment-bound runtime validation.
