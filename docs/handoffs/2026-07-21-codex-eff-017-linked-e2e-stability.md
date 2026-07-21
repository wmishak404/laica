# EFF-017 Linked E2E Stability

**Agent:** codex
**Branch:** codex/eff-017-linked-e2e-stability
**Date:** 2026-07-21
**Initiative:** none
**INIT updated:** no
**Resolves blocked handoff:** none

## Summary

The Efforts hygiene audit found no active status, registry, agent-entrypoint, or ownership drift on fresh `origin/main` `04b88c5`. EFF-017 was selected because linked E2E stability is shared validation infrastructure for INIT-001 cooking/settings work, INIT-003 linked/guest boundaries, and current open Settings/action-dock PRs. This branch fixes a linked Chef It Up restore race and hardens the linked dev-auth browser smoke without changing provider, schema, prompt, OAuth, or validation-authority policy.

## Changes

- `client/src/components/cooking/meal-planning.tsx`
  - Persists MealPlanning sessions with a separate session profile fingerprint.
  - Updates that fingerprint immediately after confirmed pantry staples save successfully, so a linked Ticket Pass restore can survive a hard reload before the parent profile query/refetch visibly settles.
- `tests/unit/meal-planning.test.tsx`
  - Adds a regression where pantry-save success is acknowledged but the parent profile has not refetched yet; the saved Ticket Pass session must already use the updated pantry fingerprint.
- `tests/e2e/linked-dev-auth.test.ts`
  - Waits for linked `/api/auth/session` and `/api/user/profile` GET responses during custom-token sign-in and reload.
  - Requires the saved Ticket Pass session to carry the expected post-staple pantry fingerprint before testing reload restore.
- `efforts/effort-017-environment-parity-and-ci-confidence.md`
  - Records the hygiene result, implementation choice, validation, and local E2E limitation.
- `efforts/registry.md`
  - Refreshes EFF-017's last-signal summary.
- `docs/production-validation-registry.md`
  - Adds a focused production/release-batch breadcrumb for linked Ticket Pass restore if this branch ships.

## Impact on other agents

EFF-022 remains active but was not selected because open PR #274 owns adjacent prompt/eval work and the runtime cuisine-fallback threshold remains separate. The EFF-017 OAuth preflight blocker remains unresolved and was not touched.

If this branch merges, future linked Chef It Up / Settings E2E failures should first check whether the app reached linked `/api/auth/session`, linked `/api/user/profile`, and whether the MealPlanning session fingerprint matches the post-save pantry basis before treating visible `Recipe suggestions` timeouts as recipe-generation failures.

## Open items

- Open a PR from this branch and wait for exact-head GitHub checks, especially `e2e_guest_smoke`, because local service-backed E2E is not valid in this worktree.
- Do not merge without Wilson approval.

## Verification

Local checks passed:

- `npx vitest run tests/unit/meal-planning.test.tsx`
- `npm run check`
- `npm run test:unit`
- `npm run build`
- `git diff --check`

Local E2E was not claimed. `npm run setup:worktree` linked `.env.keys`, but `PORT=3000 PLAYWRIGHT_BASE_URL=http://127.0.0.1:3000 npm run env:run -- npm run db:health` first hit a sandbox IPC denial, then outside the sandbox reached the configured dotenvx database and failed because the endpoint is disabled. Use GitHub's ephemeral-Neon `e2e_guest_smoke` lane for merge-gate E2E evidence.

## Stack / base status

- Base refreshed: yes
- Current base: `origin/main` at `04b88c5cd4be383771d690a250cafda5eb031a03`
- Last Replit-validated at: not validated; human Replit validation is not required before merge unless Wilson wants a manual linked reload smoke
- Notes: not stacked on another branch; open PR #274 remains EFF-022-adjacent and was not touched
