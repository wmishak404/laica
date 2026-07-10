# EFF-017 Linked Settings Coverage

**Agent:** codex
**Branch:** `codex/eff-017-linked-settings-coverage`
**Date:** 2026-07-10
**Initiative:** none
**INIT updated:** n/a
**Resolves blocked handoff:** none

## Summary

This branch adds linked Settings persistence to the deterministic dev-auth E2E lane. The linked browser smoke signs into the real app through Firebase custom-token dev auth, plans with saved pantry, then saves pantry and tools from Settings in the same linked session and verifies the profile through the normal authenticated API.

Hygiene found no active Effort status/routing changes. EFF-017 remains the highest-leverage active implementation lane; EFF-022 remains standalone and active, with only its stale `Updated` header refreshed to match the already-merged 2026-07-08 report-export signal.

## Changes

- `tests/e2e/linked-dev-auth.test.ts`
  - Extends the existing linked browser smoke to open Settings after Chef It Up planning, save pantry/tools changes, and verify authenticated profile persistence.
  - Mints separate Firebase custom tokens for API profile seeding and browser sign-in.
- `efforts/effort-017-environment-parity-and-ci-confidence.md`
  - Records the EFF-017 implementation signal and negative scope.
- `efforts/effort-022-cross-cuisine-recommendation-prompts.md`
  - Refreshes the header `Updated` date to match the existing July 8 merged signal.
- `efforts/registry.md`
  - Updates the searchable EFF-017 last signal.
- `product-decisions/features/mobile-refresh/pd-dev-test-harness.md`
  - Records the linked Settings browser-smoke coverage as a dev-test harness increment.

## Impact on other agents

Future EFF-017 work should treat linked Settings browser persistence as covered by the CI E2E lane once this branch lands and the exact-head GitHub `e2e_guest_smoke` passes. The Settings assertions intentionally ride on the already-proven `dev-test-linked-browser-ci` session instead of introducing a second browser sign-in path.

The known EFF-017 OAuth preflight blocker remains unresolved. This branch does not change OAuth target configuration, provider canaries, Replit automation, production Google popup validation, schema, prompts, or validation authority.

## Open items

- Re-run exact-head GitHub CI after the token-reuse fix; the local environment cannot prove the Firebase/Neon-backed E2E lane without the configured CI secrets and disposable schema branch.
- EFF-017 remains `In Progress`: provider canary decisions, automated Replit-environment work, coverage ratcheting, OAuth preflight configuration, and broader live-surface coverage remain separate lanes.
- EFF-022 remains active for transparent pantry-fallback threshold/copy/runtime implementation.

## Verification

Local validation passed:

- `npm run check`
- `npm run test:unit` — 48 files / 373 tests
- `npm run build` — passed with existing Browserslist, Firebase dynamic-import, and chunk-size warnings
- `git diff --check`

GitHub `e2e_guest_smoke` initially failed on `b8cc855aba7afbb68545e1e5de25ba44b73d09f2` in the new Settings browser smoke before the app reached the signed-in planning screen. The follow-up fix avoids reusing the API-exchanged custom token for browser sign-in and corrects the helper's pantry-count expectation for the two-item Settings fixture.

GitHub `e2e_guest_smoke` then failed again on `30709d511f7fac589565550d08425d2a870c695a` and `d5f264f6faca1b6bb937aff7ac454c68a09b9e94` at the same signed-in planning assertion for the second browser test. The Settings assertions now run inside the existing linked browser smoke after its proven sign-in and planning path, instead of starting a second linked browser session.

GitHub `e2e_guest_smoke` reached the consolidated Settings save path on `3c590c3982349321c115a75f1c6a75c9e3b4e85a` and failed only because the `Pantry saved!` toast text matched both the toast title and aria-live wrapper. The toast assertions now use exact text matches.

The focused E2E evidence must come from GitHub `e2e_guest_smoke` on the final pushed head because that lane prepares the disposable Neon branch, maps CI Firebase custom-token secrets, runs `db:health`, and then runs Playwright. Local dotenvx E2E against the default decrypted database is diagnostic only under the testing workflow.

## Stack / base status

- Base refreshed: yes
- Current base: `origin/main` at `9618a15cce82e6b8444e1f471a2b55905c07e633`
- Last Replit-validated at: not required before merge; automation-primary pending exact-head GitHub E2E
- Notes: independent branch from current `origin/main`; not stacked on PR #275 or PR #274.
