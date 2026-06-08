# Stale Prep Plan Invalidation Effort

**Agent:** codex
**Branch:** codex/deferred-stale-prep-plan-effort
**Date:** 2026-06-08
**Initiative:** none
**INIT updated:** n/a

## Summary

Created a docs-only active Effort for the stale prep tray/active recipe plan invalidation bug observed during prod-push smoke after PR #146. The Effort preserves the product expectation that saved pantry/profile/kitchen changes should not leave a materially stale recipe or generated step tray actionable, while explicitly keeping the current production CSP push unblocked.

## Changes

- `efforts/effort-026-stale-prep-plan-invalidation.md`: new active Effort with observed behavior, expected behavior, suspected impacted state, likely investigation areas, negative scope, future validation, and resolution criteria.
- `efforts/README.md`: adds EFF-026 to the active Effort read list.
- `efforts/registry.md`: adds EFF-026 to the searchable registry.
- `docs/handoffs/2026-06-08-codex-stale-prep-plan-effort.md`: records this docs-only branch handoff.

## Impact on other agents

- Read EFF-026 before changing Settings Pantry/Kitchen save/reset/add/delete behavior, recipe planning/prep tray selection, active cooking plan restore, or Live Cooking generated-step/session cache invalidation.
- EFF-026 intersects EFF-025 but does not replace it: EFF-025 owns unsaved inventory reminder UX before Save; EFF-026 owns stale active plan invalidation after relevant changes are saved.
- This branch intentionally does not implement the fix.

## Open items

- Future implementation should investigate `client/src/pages/app.tsx`, planning/recipe selection state, Settings pantry save flow, and Live Cooking/session cache invalidation.
- Future validation should cover guest and linked users, pantry add/delete/reset/save after viewing a prep tray, hard refresh after pantry changes, and stale-plan versus completed-history behavior.
- PR #146 and the current production CSP push remain unblocked by this deferred bug.

## Verification

- Docs-only review via `git diff --check`.
- No app tests run because this branch does not change runtime code.

## Stack / base status

- Base refreshed: yes
- Current base: `origin/main` at `ba924d6ad0f7ef0906d967a25ecb95fd7319da88`
- Last Replit-validated at: not yet validated
- Notes: branch created from PR #146 merge commit; no Replit validation required for the docs-only Effort branch.
