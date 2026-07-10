# EFF-017 Linked Settings Coverage

**Agent:** codex
**Branch:** `codex/eff-017-linked-settings-coverage`
**Date:** 2026-07-10
**Initiative:** none
**INIT updated:** n/a
**Resolves blocked handoff:** none

## Summary

This branch adds linked Settings persistence to the deterministic dev-auth E2E lane. The new smoke uses a separate `dev-test-linked-settings-ci` user, signs into the real browser app through Firebase custom-token dev auth, saves pantry and tools from Settings, and verifies the linked profile through the normal authenticated API.

Hygiene found no active Effort status/routing changes. EFF-017 remains the highest-leverage active implementation lane; EFF-022 remains standalone and active, with only its stale `Updated` header refreshed to match the already-merged 2026-07-08 report-export signal.

## Changes

- `.github/workflows/ci.yml`
  - Adds `dev-test-linked-settings-ci` to the E2E linked dev-auth allowlist.
- `tests/e2e/linked-dev-auth.test.ts`
  - Generalizes linked profile seeding for multiple deterministic users.
  - Adds a browser smoke for linked Settings pantry/tools save and authenticated profile verification.
- `efforts/effort-017-environment-parity-and-ci-confidence.md`
  - Records the EFF-017 implementation signal and negative scope.
- `efforts/effort-022-cross-cuisine-recommendation-prompts.md`
  - Refreshes the header `Updated` date to match the existing July 8 merged signal.
- `efforts/registry.md`
  - Updates the searchable EFF-017 last signal.
- `product-decisions/features/mobile-refresh/pd-dev-test-harness.md`
  - Records the linked Settings browser-smoke coverage as a dev-test harness increment.

## Impact on other agents

Future EFF-017 work should treat linked Settings browser persistence as covered by the CI E2E lane once this branch lands and the exact-head GitHub `e2e_guest_smoke` passes. Do not reuse `dev-test-linked-settings-ci` for another parallel E2E path unless the test data is reset or isolated.

The known EFF-017 OAuth preflight blocker remains unresolved. This branch does not change OAuth target configuration, provider canaries, Replit automation, production Google popup validation, schema, prompts, or validation authority.

## Open items

- Run exact-head GitHub CI after pushing; the local environment cannot prove the Firebase/Neon-backed E2E lane without the configured CI secrets and disposable schema branch.
- EFF-017 remains `In Progress`: provider canary decisions, automated Replit-environment work, coverage ratcheting, OAuth preflight configuration, and broader live-surface coverage remain separate lanes.
- EFF-022 remains active for transparent pantry-fallback threshold/copy/runtime implementation.

## Verification

Local validation passed:

- `npm run check`
- `npm run test:unit` — 48 files / 373 tests
- `npm run build` — passed with existing Browserslist, Firebase dynamic-import, and chunk-size warnings
- `git diff --check`

The focused E2E evidence must come from GitHub `e2e_guest_smoke` on the pushed head because that lane prepares the disposable Neon branch, maps CI Firebase custom-token secrets, runs `db:health`, and then runs Playwright. Local dotenvx E2E against the default decrypted database is diagnostic only under the testing workflow.

## Stack / base status

- Base refreshed: yes
- Current base: `origin/main` at `9618a15cce82e6b8444e1f471a2b55905c07e633`
- Last Replit-validated at: not required before merge; automation-primary pending exact-head GitHub E2E
- Notes: independent branch from current `origin/main`; not stacked on PR #275 or PR #274.
