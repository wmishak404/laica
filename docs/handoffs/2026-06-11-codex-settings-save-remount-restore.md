# Settings Save Remount Mitigation

**Agent:** codex
**Branch:** codex/settings-save-remount-restore
**Date:** 2026-06-11
**Initiative:** INIT-001 mobile refresh / EFF-025 settings inventory save UX
**INIT updated:** no

## Summary

Wilson reproduced a release-smoke blocker in signed-in Google state: saving Tools in Settings appeared to refresh/remount the app, then the profile bootstrap routed the complete profile back to the planning-choice screen. This branch does not identify or eliminate the intermittent refresh/remount trigger. It adds an app-shell restore contract for active Settings sections so a remount after a linked save returns to the active Settings subsection, especially Tools, instead of treating the load like a normal complete-profile startup.

## Changes

- `client/src/pages/app.tsx`: adds a scoped `laica_active_settings_section:<scope>` localStorage marker with a four-hour freshness window; complete-profile bootstrap now restores fresh Settings state before falling back to active cooking-plan or planning routing.
- `client/src/pages/app.tsx`: records Settings entries/subsection changes and clears the marker on explicit exits to Cook, History, profile completion, logout/start-over, meal selection, or Back.
- `client/src/components/cooking/user-settings.tsx`: adds optional `onSectionChange` so internal Pantry/Tools/Profile navigation is visible to the app shell.
- `tests/unit/planning-choice.test.tsx`: adds a linked Tools remount regression covering Settings > Tools persistence across component cleanup/remount.
- `efforts/effort-025-settings-unsaved-inventory-reminder.md`: records the release-smoke finding as EFF-025-adjacent evidence without closing the broader dirty-state reminder effort.

## Impact on other agents

Settings now has a narrow active-surface restore mitigation independent of cooking-plan restore. If future Settings work changes section names, inventory tabs, or save navigation, update the `SettingsSection` values and keep the marker cleared on intentional exits from Settings.

This conforms with EFF-025 by preserving explicit save behavior; it does not implement dirty-state reminders or leave warnings.

## Open items

- The root cause of the intermittent browser/app refresh remains unconfirmed. If the refresh itself needs to be eliminated later, open a separate investigation around Replit preview reloads, auth/profile cache invalidation, and browser/session lifecycle.
- Broader EFF-025 dirty-state reminder work remains open.

## Verification

- `npm ci`
- `npx vitest run tests/unit/planning-choice.test.tsx` -> 21 tests passed, including linked Tools remount restore.
- `npx vitest run tests/unit/user-settings-scan-policy.test.tsx` -> 12 tests passed.
- `npm run check` -> TypeScript and UI lint passed.
- `npm run build` -> production build passed; existing Vite warnings about stale Browserslist data, Firebase dynamic/static import, and chunk size remain.

Post-rebase local sanity on 2026-06-13 after PR #176 merged:

- `npm audit --audit-level=high` -> found 0 vulnerabilities.
- `npx vitest run tests/unit/planning-choice.test.tsx` -> 21 tests passed.
- `npm run check` -> passed.
- `npm run build` -> passed; existing Browserslist age, Firebase mixed dynamic/static import, and chunk-size warnings remain.
- `npm run test:unit` -> 39 files, 254 tests passed.

## Wilson Human Replit Smoke Carry-Forward

**Source provenance:** Wilson reported in Codex chat on 2026-06-11 that the release-smoke list below was successful on the PR #172 / `main` Replit build under test, before PR #173 was merged. Codex did not independently rerun these human checks in this docs update.

**Claim:** These successful human checks can be carried forward for PR #173 where the surface was not touched by the Settings active-section restore fix, so post-fix validation can stay targeted instead of repeating the full release smoke list.

**Observed successful checks:**

- Clean Google sign-in/sign-out or fresh browser auth check on Replit.
- Signed-in feedback submission.
- Pantry/Tools save or setup-draft refresh write check.
- Real Chef It Up generation, suggested-staple add, Live Cooking start, hard-refresh restore, and completion/history.
- ElevenLabs audio and speech transcription.
- Vision/photo upload.

**Reasoning:** PR #173 changes app-shell restoration of the active Settings subsection and `UserSettings` section reporting. It does not change Google provider configuration, feedback routes, Chef It Up generation, suggested-staple persistence, Live Cooking completion/history writes, ElevenLabs routes, speech transcription, or vision/photo upload. The successful release-smoke evidence above can therefore reduce repeat manual coverage for those unchanged surfaces after this mitigation.

**Negative scope:** This carry-forward does not validate the new PR #173 behavior. The changed path needs the targeted signed-in Replit check for Settings > Tools save/remount restore. If another commit changes auth, feedback, AI generation, live cooking persistence, speech, audio, or vision upload, the relevant carry-forward item becomes stale for that surface.

## PR #173 Replit Validation Status

**Source provenance:** Wilson clarified in Codex chat on 2026-06-12 that the earlier successful broad smoke was on the PR #172 / `main` build while PR #173 was still being fixed. Wilson then ran the focused PR #173 Replit dev validation and reported the results in Codex chat.

**Status:** Focused PR #173 human Replit validation passed for the mitigation behavior. This validates the route-loss remedy, not the unknown refresh trigger.

**Observed successful targeted checks on Replit dev:**

- Signed-in Google account opened `Settings > Tools`.
- Saving a Tools change did not route back to `What are we cooking today?`.
- Hard refresh while still on `Settings > Tools` restored back to Tools.
- Tapping `Cook`, then hard refreshing, returned to `What are we cooking today?`, confirming the Settings restore marker clears on intentional Cook navigation.

**Other Settings pages:** The implementation is not Tools-only. `SettingsSection` supports `hub`, `inventory`, `pantry`, `kitchen`/Tools, and `profile`, and `UserSettings` reports Pantry/Tools/Profile section changes back to the app shell. Only Tools received focused Replit validation because it was the observed failing path.

**Negative scope:** Because the original refresh/remount was intermittent, this does not prove the browser will never remount after Save. It proves the user-visible mitigation: if the app remounts while the Settings marker is active, the app should restore the active Settings section instead of dumping the user to planning. The root cause of the intermittent refresh remains open/unidentified.

## Current CI Status After PR #176 Rebase

PR #176 (`codex/dependency-audit-fix`) merged into `main` at `e1c4d4ab5f147ef556d6200e09b4972e5b417fc6` and cleared the shared dependency audit blocker. This branch was then rebased onto that fresh `origin/main` base.

The previous red `npm-audit` status is obsolete after the rebase. The previous `unit` failure was observed on an older branch head and must be replaced by the post-rebase CI result for the current exact head.

**Current status:** local sanity checks and GitHub Actions are pending for the rebased head. Do not treat the older failed checks or older green checks as current merge evidence.

## Stack / base status

- Base refreshed: yes
- Current base: `origin/main` at `e1c4d4ab5f147ef556d6200e09b4972e5b417fc6` after PR #176 merged.
- Last Replit-validated at: release-batch smoke reported successful by Wilson for PR #172 / `main` build `ca03c3ca411296e83a599ef74826056f6f0b631e`; focused PR #173 Replit dev validation passed for the Settings > Tools mitigation behavior on 2026-06-12 before the PR #176 dependency rebase.
- Notes: The rebase brought in dependency audit fixes only; the Settings runtime mitigation remains the same logical change. Per workflow, the pre-rebase focused Replit validation is stale as exact-head merge evidence, so final release-candidate validation should use the rebased #173 head. Unchanged surfaces listed above do not need full repeat smoke unless their code or environment changes. The intermittent refresh trigger is not resolved; PR #173 mitigates the bad route fallback after remount.
