# Active List Mirror Drift Cleanup

**Agent:** codex
**Branch:** codex/efforts-hygiene-2026-06-23
**Date:** 2026-06-23
**Initiative:** none
**INIT updated:** n/a

## Summary

The Efforts system was already correct in its authoritative files, but the first-contact agent mirrors still listed resolved EFF-027 as active. The first fix removed that stale entry; Wilson then called out the larger issue: active status should not be mirrored in `AGENTS.md` and `CLAUDE.md` at all.

This branch now removes active INIT/Effort ID lists from the agent instruction files and points them to the durable entrypoints instead. `efforts/README.md` owns the active Effort read list, and `initiatives/README.md` owns the active INIT read list and read-before-work triggers.

## Changes

- `AGENTS.md`
  - Replaces active INIT and Effort ID mirrors with links to `initiatives/README.md` and `efforts/README.md`.
- `CLAUDE.md`
  - Replaces active INIT and Effort ID mirrors with the same durable entrypoint pointers.
- `initiatives/README.md`
  - Promotes the current active INIT links into the single first-contact INIT read list, including read-before-work triggers that were previously copied into agent files.
- `efforts/README.md`
  - States that agent instruction files should link to the Efforts entrypoint instead of duplicating active Effort IDs.
- `docs/workflows/effort-system-audit.md`
  - Replaces the old active-list mirror parity requirement with an agent-entrypoint-link check, so future Effort status changes update `efforts/README.md` and `efforts/registry.md` without touching agent files.
- `docs/handoffs/2026-06-23-codex-efforts-hygiene-mirror-drift.md`
  - Records the audit result, anti-mirror correction, implementation deferral, and validation.

## Impact on other agents

Read `efforts/README.md` as the active Effort source of truth. Read `initiatives/README.md` as the first-contact active INIT source of truth. `AGENTS.md` and `CLAUDE.md` should stay as pointers for these lists, not status mirrors.

PR #220 has now merged on `main`, adding the EFF-010 `recipe_image_cache` schema-health check. EFF-010 remains open because local DB ownership and `db:push` permission are still unresolved. This branch intentionally does not create another implementation slice while active-list mirror drift is being corrected.

## Open items

- Take a future EFF-010 slice only after choosing a new non-overlapping next action beyond PR #220's merged schema-health coverage.
- Continue future implementation from a clean hygiene baseline after this anti-mirror fix is merged.
- EFF-022 remains product-rule blocked for selected-cuisine fallback behavior.
- EFF-017's older OAuth preflight blocked handoff remains a configuration/target-set issue, not something this docs-only mirror pass can unblock.

## Verification

- Hygiene audit started from fresh `origin/main` at `89ce14ff169ff9a2a721a615b42cd46c28fc1bf0`, then this branch was rebased after `origin/main` advanced to `cd15c6fade013b7a600b2cdc76094560f75ff800` through PR #220 and dependency PRs #231/#233.
- Reviewed `efforts/README.md`, `efforts/registry.md`, active Effort files, `initiatives/README.md`, active INITs, `product-decisions/README.md`, `docs/workflows/effort-system-audit.md`, `docs/workflows/documentation-routing.md`, `docs/workflows/testing-and-acceptance.md`, `docs/workflows/agent-merge-authority.md`, `docs/handoffs/README.md`, open GitHub PRs, blocked handoffs, and AGENTS/CLAUDE active-list mirrors.
- Confirmed current Efforts-related PR state after rebase: PR #220 is merged for EFF-010 schema-health coverage; no open EFF-027 PR exists.
- Confirmed `AGENTS.md` and `CLAUDE.md` no longer contain concrete active INIT or Effort ID lists.
- `git diff --check` passed.
- `git diff --cached --check` passed.

## Stack / base status

- Base refreshed: yes
- Current base: `origin/main` at `cd15c6fade013b7a600b2cdc76094560f75ff800`
- Last Replit-validated at: not applicable; docs-only mirror hygiene
- Notes: not stacked on another branch. Implementation work was deferred because the Effort audit found active-list mirror drift, then Wilson approved replacing the mirror pattern with source-doc entrypoint links.
