# E2E release blocker triage

**Agent:** codex
**Branch:** codex/e2e-release-blockers
**Date:** 2026-06-18
**Initiative:** INIT-001 release validation, INIT-003 landing surface adjacent
**INIT updated:** no — this branch does not change INIT phase status, resume order, assets, or product direction. Point-in-time evidence is recorded here, with durable validation signals in EFF-010 and EFF-017.

## Summary

PR #191's local E2E blockers were split into their real lanes. The landing auth-control contrast failure was a product/accessibility release blocker on current `main`, so this branch fixes it conservatively. The missing `anonymous_recipe_usage` table is default local dotenvx database drift, so it is routed to the existing CI/sandbox validation lane instead of mutating an unknown local database.

## Changes

- `client/src/components/ui/button.tsx`
  - Adds `landingSecondary` and keeps `landingPrimary` / `landingSecondary` disabled rendering at full opacity so landing auth controls stay high-contrast during auth-loading states.
- `client/src/components/auth/GoogleSignInButton.tsx`
  - Allows the semantic `landingSecondary` Button variant.
- `client/src/pages/landing.tsx`
  - Uses the new landing secondary variant for Google sign-in.
  - Keeps the auth CTA reveal motion full-opacity so the controls do not fail contrast while the page animates in.
- `efforts/effort-010-local-db-schema-strategy.md`
  - Records the 2026-06-18 `db:health` failure and confirms the DB issue is a local evidence-environment blocker unless a prepared sandbox or CI Neon lane is used.
- `efforts/effort-017-environment-parity-and-ci-confidence.md`
  - Records that the landing accessibility guardrail caught a real release blocker and that exact-head full E2E remains required for implementation PRs.
- `docs/handoffs/2026-06-18-codex-e2e-release-blockers.md`
  - Captures this triage and validation handoff.

## Blocker Classification

Landing auth contrast:

- Classification: release blocker / product UI accessibility fix.
- Evidence: fresh `origin/main` `d42e3d1` failed `tests/e2e/accessibility-guardrail.test.ts` with serious axe `color-contrast` violations on `Start cooking now` and `Continue with Google`.
- Root cause: auth controls inherited opacity during the landing reveal animation and disabled/auth-loading state, lowering computed contrast during the axe scan.
- Fix: semantic landing Button variants plus full-opacity auth CTA reveal motion. No navigation, IA, auth behavior, quota copy, or product flow changes.

Default local DB drift:

- Classification: local evidence-environment blocker, not a product fix in this branch.
- Evidence: fresh `origin/main` `d42e3d1` failed `npm run env:run -- npm run db:health` with missing `ai_interactions`, `prompt_versions`, `anonymous_recipe_usage`, and `cooking_sessions.recipe_snapshot`.
- Reasoning: `anonymous_recipe_usage` is required schema for guest auth/session quota metadata; the default decrypted `.env` DB is stale. Per EFF-010 and the Testing and Acceptance Workflow, do not run `npm run db:push` against an unknown/shared local database.
- Smallest safe next action: use GitHub `e2e_guest_smoke` for merge evidence because it creates a schema-only Neon branch, applies Drizzle schema, runs `db:health`, runs Playwright, and deletes the branch. For local-only reproduction, provide a disposable `LAICA_LOCAL_SANDBOX_DATABASE_URL` and set `LAICA_LOCAL_SANDBOX_CONFIRM_SCHEMA_PUSH=true` before using the sandbox scripts.

## Impact on other agents

Do not take over PR #191 from this branch. After this PR lands, PR #191 should rebase onto fresh `origin/main`, mark ready when its owner is ready to start CI, and rely on exact-head GitHub `unit` + `e2e_guest_smoke` evidence rather than the stale default local dotenvx database.

The landing fix is intentionally narrow. Future landing/auth-entry visual work should preserve the full-opacity auth controls or rerun the same a11y guardrail before claiming the public entry surface is release-ready.

## Open items

- Full automated E2E gate for this branch is not yet available locally because the default decrypted `.env` database fails `db:health`.
- GitHub `e2e_guest_smoke` should be triggered on this branch after the PR is opened/ready. A skipped, pending, or failed CI E2E check is not merge evidence.
- PR #191 remains not merge-ready until it is rebased after this fix lands and has exact-head required CI/E2E evidence, or Wilson explicitly approves a different validation lane.
- No Replit validation was performed for this branch. Risk lane is automation-primary for the narrow public landing a11y styling fix; human Replit validation can be deferred to release/batch unless Wilson wants visual sign-off.

## Verification

Base:

- Fresh fetch completed before triage.
- Current base: `origin/main` at `d42e3d115ab2296909d94974b46442013ce483ad`.
- Open PR audit found PR #191 (`codex/init-001-cooking-audio-cleanup`) is draft and owned in another worktree; this branch did not modify it.

Commands:

- `npm ci` passed, 897 packages installed, 0 vulnerabilities.
- `npm run env:run -- npm run db:health` failed on current `main`: missing `ai_interactions`, `prompt_versions`, `anonymous_recipe_usage`, and `cooking_sessions.recipe_snapshot`.
- Before the fix, `CI=true PORT=5020 PLAYWRIGHT_BASE_URL=http://localhost:5020 npm run env:run -- npx playwright test tests/e2e/accessibility-guardrail.test.ts --project=chromium` failed with serious axe `color-contrast` violations on the landing auth controls.
- After the fix, `CI=true PORT=5022 PLAYWRIGHT_BASE_URL=http://localhost:5022 npm run env:run -- npx playwright test tests/e2e/accessibility-guardrail.test.ts --project=chromium` passed: 1 test.
- `npm run check` passed.
- `npm run build` passed with existing Browserslist, Firebase dynamic/static import, and chunk-size warnings.
- `git diff --check origin/main...HEAD` passed before docs were added; rerun after docs before commit.

## Stack / base status

- Base refreshed: yes
- Current base: `origin/main` at `d42e3d115ab2296909d94974b46442013ce483ad`
- Last Replit-validated at: not applicable; no Replit validation performed for this narrow automation-primary branch
- Human Replit validation: deferred to release/batch validation unless Wilson requests landing visual sign-off
