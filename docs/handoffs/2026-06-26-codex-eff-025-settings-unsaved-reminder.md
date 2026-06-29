# EFF-025 Settings Unsaved Reminder

**Agent:** codex
**Branch:** codex/eff-025-settings-unsaved-reminder
**Date:** 2026-06-26
**Initiative:** INIT-001
**INIT updated:** yes
**Resolves blocked handoff:** none

## Summary

This branch turns EFF-025 from preserved follow-up into active implementation: Settings Pantry and Tools now make unsaved local inventory edits visible before the explicit Save action, without changing autosave, navigation IA, schema, or backend persistence. The remaining closeout gate is visual validation on Replit/mobile so Wilson can confirm the reminder is noticeable but not noisy.

## Hygiene Result

Daily Efforts hygiene started from fresh `origin/main` at `0c94f76ab69ded678fd4cfff067f97e458bd80ac`.

Active Efforts remain correctly routed:

- EFF-010 remains open for local DB ownership and `db:push` policy after the merged schema-health slice.
- EFF-017 remains `In Progress`, but PR #235 already owns the current auth/session coverage slice.
- EFF-022 remains open, but PR #232 already owns INIT-004 eval-reporting work and the cuisine-fallback product rule remains unresolved.
- EFF-025 was selected because it is unowned, has concrete acceptance criteria, and protects a shared Settings inventory surface used by linked users and anonymous guests.

Open PRs inspected before implementation: #232, #234, #235, and #236. None owns EFF-025 or `client/src/components/cooking/user-settings.tsx`.

## Changes

- `client/src/components/cooking/user-settings.tsx`
  - Adds a saved inventory snapshot for Pantry and Tools.
  - Shows inline `Unsaved pantry changes` / `Unsaved tools changes` reminders when local list edits differ from the saved list.
  - Changes Save copy to `Save pantry changes` / `Save tools changes` while dirty.
  - Prompts before Back from Settings or switching away from a dirty inventory list.
  - Clears dirty state after successful linked or session-local inventory Save.
- `client/src/index.css`
  - Adds tokenized styling for the inline Settings unsaved reminder.
- `tests/unit/user-settings-scan-policy.test.tsx`
  - Covers dirty reminders, dirty Save copy, dirty-state clearing on save, scan-added dirty state, linked/session save behavior, and leave/switch prompts.
- `efforts/effort-025-settings-unsaved-inventory-reminder.md`, `efforts/README.md`, `efforts/registry.md`
  - Marks EFF-025 `In Progress` and records the implementation signal.
- `product-decisions/features/mobile-refresh/pd-phase-02-2-returning-setup-settings.md`
  - Records the explicit-save dirty-reminder branch signal and reset boundary.
- `initiatives/INIT-001-mobile-refresh.md`
  - Adds EFF-025 as an adjacent active Settings follow-up and records the branch signal.

## Impact On Other Agents

Settings inventory edits are still explicit-save. Do not assume Pantry/Tools now autosave. Reset remains an immediate confirmed save/reset action; changing reset into a dirty local edit is a future product pass.

Future Settings work should preserve the dirty reminder until save succeeds and should use the same confirmation path before hiding a dirty Pantry or Tools list.

## Open Items

- Replit/mobile visual validation is still required before closing EFF-025: add an item, remove an item, switch Pantry/Tools, press Back, and confirm the reminder/prompt is visible without feeling noisy.
- This branch does not validate the reminder in a real browser screenshot or Replit preview yet.
- Do not merge without Wilson approval because this is runtime/UI behavior.

## Verification

- `npx vitest run tests/unit/user-settings-scan-policy.test.tsx` passed: 1 file / 13 tests.
- `npm run check` passed.
- `npm run test:unit` passed: 44 files / 316 tests.
- `npm run build` passed with existing Browserslist age, Firebase dynamic/static import, and chunk-size warnings.
- `git diff --check` and `git diff --cached --check` passed.

Exact-head GitHub checks are pending until the PR opens. The branch should be marked ready for review so the required `unit` and `e2e_guest_smoke` lanes run on the pushed head.
