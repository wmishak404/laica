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

- Human Replit smoke still needs to repeat the exact signed-in Google flow changed by this PR: open Settings > Tools, save a tool change, and confirm the app stays/restores on Tools if the preview remounts.
- Broader EFF-025 dirty-state reminder work remains open.

## Verification

- `npm ci`
- `npx vitest run tests/unit/planning-choice.test.tsx` -> 21 tests passed, including linked Tools remount restore.
- `npx vitest run tests/unit/user-settings-scan-policy.test.tsx` -> 12 tests passed.
- `npm run check` -> TypeScript and UI lint passed.
- `npm run build` -> production build passed; existing Vite warnings about stale Browserslist data, Firebase dynamic/static import, and chunk size remain.

## Wilson Human Replit Smoke Carry-Forward

**Source provenance:** Wilson reported in Codex chat on 2026-06-11 that the release-smoke list below was successful on the Replit build under test. Codex did not independently rerun these human checks in this docs update.

**Claim:** These successful human checks can be carried forward for PR #173 where the surface was not touched by the Settings active-section restore fix, so post-fix validation can stay targeted instead of repeating the full release smoke list.

**Observed successful checks:**

- Clean Google sign-in/sign-out or fresh browser auth check on Replit.
- Signed-in feedback submission.
- Pantry/Tools save or setup-draft refresh write check.
- Real Chef It Up generation, suggested-staple add, Live Cooking start, hard-refresh restore, and completion/history.
- ElevenLabs audio and speech transcription.
- Vision/photo upload.

**Reasoning:** PR #173 changes app-shell restoration of the active Settings subsection and `UserSettings` section reporting. It does not change Google provider configuration, feedback routes, Chef It Up generation, suggested-staple persistence, Live Cooking completion/history writes, ElevenLabs routes, speech transcription, or vision/photo upload. The successful release-smoke evidence above can therefore reduce repeat manual coverage for those unchanged surfaces after this fix.

**Negative scope:** This carry-forward does not validate the new PR #173 behavior at head `890097903d32e5df62d66c8114603e8e8cf290e1`. The changed path still needs the targeted signed-in Replit check for Settings > Tools save/remount restore. If another commit changes auth, feedback, AI generation, live cooking persistence, speech, audio, or vision upload, the relevant carry-forward item becomes stale for that surface.

## Stack / base status

- Base refreshed: yes
- Current base: `origin/main` at `ca03c3ca411296e83a599ef74826056f6f0b631e`
- Last Replit-validated at: release-batch smoke reported successful by Wilson for the Replit build under test on 2026-06-11; PR #173 head `890097903d32e5df62d66c8114603e8e8cf290e1` is not yet targeted Replit-validated for the Settings > Tools remount fix.
- Notes: Branch was created from the release-smoked `origin/main` head after PR #171 merge closeout. Replit should fetch this branch before validating the signed-in Tools save regression; unchanged surfaces listed above do not need full repeat smoke unless their code or environment changes.
