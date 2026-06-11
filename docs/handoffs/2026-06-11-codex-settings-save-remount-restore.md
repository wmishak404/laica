# Settings Save Remount Restore

**Agent:** codex
**Branch:** codex/settings-save-remount-restore
**Date:** 2026-06-11
**Initiative:** INIT-001 mobile refresh / EFF-025 settings inventory save UX
**INIT updated:** no

## Summary

Wilson reproduced a release-smoke blocker in signed-in Google state: saving Tools in Settings appeared to refresh/remount the app, then the profile bootstrap routed the complete profile back to the planning-choice screen. This branch adds an app-shell restore contract for active Settings sections so a remount after a linked save returns to the active Settings subsection, especially Tools, instead of treating the load like a normal complete-profile startup.

## Changes

- `client/src/pages/app.tsx`: adds a scoped `laica_active_settings_section:<scope>` localStorage marker with a four-hour freshness window; complete-profile bootstrap now restores fresh Settings state before falling back to active cooking-plan or planning routing.
- `client/src/pages/app.tsx`: records Settings entries/subsection changes and clears the marker on explicit exits to Cook, History, profile completion, logout/start-over, meal selection, or Back.
- `client/src/components/cooking/user-settings.tsx`: adds optional `onSectionChange` so internal Pantry/Tools/Profile navigation is visible to the app shell.
- `tests/unit/planning-choice.test.tsx`: adds a linked Tools remount regression covering Settings > Tools persistence across component cleanup/remount.
- `efforts/effort-025-settings-unsaved-inventory-reminder.md`: records the release-smoke finding as EFF-025-adjacent evidence without closing the broader dirty-state reminder effort.

## Impact on other agents

Settings now has a narrow active-surface restore mechanism independent of cooking-plan restore. If future Settings work changes section names, inventory tabs, or save navigation, update the `SettingsSection` values and keep the marker cleared on intentional exits from Settings.

This conforms with EFF-025 by preserving explicit save behavior; it does not implement dirty-state reminders or leave warnings.

## Open items

- Human Replit smoke still needs to repeat the exact signed-in Google flow that failed: open Settings > Tools, save a tool change, and confirm the app stays/restores on Tools if the preview remounts.
- Broader EFF-025 dirty-state reminder work remains open.

## Verification

- `npm ci`
- `npx vitest run tests/unit/planning-choice.test.tsx` -> 21 tests passed, including linked Tools remount restore.
- `npx vitest run tests/unit/user-settings-scan-policy.test.tsx` -> 12 tests passed.
- `npm run check` -> TypeScript and UI lint passed.
- `npm run build` -> production build passed; existing Vite warnings about stale Browserslist data, Firebase dynamic/static import, and chunk size remain.

## Stack / base status

- Base refreshed: yes
- Current base: `origin/main` at `ca03c3ca411296e83a599ef74826056f6f0b631e`
- Last Replit-validated at: not yet validated for this fix branch
- Notes: Branch was created from the release-smoked `origin/main` head after PR #171 merge closeout. Replit should fetch this branch before validating the signed-in Tools save regression.
