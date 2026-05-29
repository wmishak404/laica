# INIT-003 production gates merge closeout

**Agent:** codex
**Date:** 2026-05-29
**Initiative:** [INIT-003 — Anonymous Trial and Account Upgrade](../../initiatives/INIT-003-anonymous-trial-and-account-upgrade.md)
**Merged PR:** [#107](https://github.com/wmishak404/laica/pull/107)
**Merge commit:** `a0efc430450aa4f0e582dd7d96ebcdc187633098`
**Merged head:** `72ef2f7d5a36f297708a2efd785ebed67ab0fb97`
**Closeout branch:** `codex/init-003-production-gates-closeout`
**INIT updated:** yes

## Summary

PR #107 merged the INIT-003 public anonymous guest production gates into `main`. The Plan B guest MVP is now safer to open because quota accounting, an anonymous kill switch, anonymous IP-keyed rate-limit identity, App Check posture, linked-only durable-save boundaries, session-local guest Settings, and guest/linked cache isolation are all merged and Replit-validated.

This closeout also tightens the agent workflow: post-merge docs closeout is now documented as an automatic continuation of merging, not a separate task that should wait for Wilson to remind the agent.

## Merge and Validation

- PR #107 merged with squash commit `a0efc43`.
- Final PR head was `72ef2f7`.
- Wilson reloaded Replit to `72ef2f7`, set `FIREBASE_APP_CHECK_ENFORCED=true`, and passed the final smoke:
  - guest start
  - recipe generation
  - Google sign-in
  - linked profile/settings save
  - vision scan
  - cooking steps
  - speech
- No `APP_CHECK_REQUIRED` or `APP_CHECK_INVALID` was observed.
- Earlier Replit validation also passed guest Settings, provider sanity baseline, `anonymous_recipe_usage` schema availability, `#11` `LINKED_ACCOUNT_REQUIRED`, durable-save boundaries, linked cache isolation, linked History, linked cooking-session persistence, and kill-switch behavior.

## Closeout Updates

- `initiatives/INIT-003-anonymous-trial-and-account-upgrade.md`
  - Marks PR #107 merged.
  - Moves current phase to production gates merged plus Phase 4/5 follow-up planning.
  - Records App Check enforced validation at `72ef2f7`.
  - Updates phase progress, PR table, validation state, current resume point, and chronology.
- `initiatives/registry.md`
  - Removes PR #107 as an active PR and records the merged production-gate state.
- `product-decisions/pd-012-public-anonymous-trial-and-account-upgrade.md`
  - Adds implementation status for PR #102 and PR #107.
  - Updates consequences and open follow-ups so already-landed runtime gates are not listed as future work.
- `efforts/effort-010-local-db-schema-strategy.md` and `efforts/registry.md`
  - Records that `anonymous_recipe_usage` was validated in Replit before merge.
  - Keeps EFF-010 open because this does not resolve local DB ownership or authorize arbitrary local `npm run db:push`.
- `AGENTS.md`, `CLAUDE.md`, and `docs/workflows/documentation-routing.md`
  - Strengthens the post-merge rule: the agent who merges or confirms a merge must automatically start closeout from fresh `origin/main`, push a docs-only closeout PR, or record an explicit deferral.

## Remaining Scope

- Phase 4 still owns fuller Google link/promotion/import behavior.
- Phase 5 still owns linked returning-user memory and any future anonymous Slop Bowl dry-run decision.
- Durable History, cleanup memory, taste memory, next-meal retention, and durable cooking-session memory remain linked-account only.
- [EFF-022](../../efforts/effort-022-cross-cuisine-recommendation-prompts.md) owns cuisine-fit prompt/eval follow-up.
- [EFF-024](../../efforts/effort-024-guest-privacy-trust-messaging.md) owns guest privacy/trust messaging.
- [EFF-025](../../efforts/effort-025-settings-unsaved-inventory-reminder.md) owns unsaved Settings reminders.
- Product analytics remains separate; file a new Effort if guest-to-link measurement becomes urgent.

## Resume Point

Start future INIT-003 work from fresh `origin/main`. Treat PR #107 as merged production-gate baseline, not an active branch. Before enabling or revalidating a public runtime, confirm:

- `VITE_FIREBASE_APP_CHECK_SITE_KEY` is present in the client runtime.
- Firebase Console App Check is registered for the target domain.
- `FIREBASE_APP_CHECK_ENFORCED=true` is set when public anonymous access is enabled.
- `ANONYMOUS_AUTH_DISABLED` is unset unless guest access should be paused.
- `anonymous_recipe_usage` exists in the target database.

## Validation for This Closeout

Docs-only closeout. Run before PR:

- `git diff --check`
- targeted reference searches for stale PR #107/App Check validation wording
