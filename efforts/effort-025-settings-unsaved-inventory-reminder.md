# EFF-025 - Settings unsaved inventory reminder

**Status:** In Progress
**Owner:** Wilson / Codex / Claude
**Created:** 2026-05-27
**Updated:** 2026-06-26

## One-line summary

Add a clear unsaved-changes reminder for Settings inventory edits so users know Pantry/Kitchen additions or deletions still need the explicit Save action.

## Context

During INIT-003 anonymous production-gates Replit validation, Wilson noticed a broader Settings UX issue: after adding or deleting Pantry items, the screen does not clearly remind the user to save the changed list. The same risk likely applies to Kitchen edits because both surfaces use the same Settings inventory save pattern.

This is larger than the current INIT-003 production-gates scope. It should be tackled later as a focused Settings UX improvement instead of widening the anonymous launch gate.

## Scope

### In scope

- Add a visible dirty-state reminder after Pantry items are added, removed, reset, scanned, or manually edited before save.
- Apply the same pattern to Kitchen if the shared inventory editor makes that natural.
- Consider making the Save button state clearer after unsaved changes, such as copy, emphasis, disabled/enabled contrast, or a small inline status.
- Warn or prompt before leaving Settings with unsaved inventory edits when appropriate.
- Preserve the explicit save model unless a later product decision intentionally changes Settings to autosave.
- Cover both linked-account persistence and anonymous session-local persistence.
- Add focused tests for dirty-state rendering, save clearing the dirty state, and navigation/leave behavior where practical.
- Validate on Replit/mobile because the issue is about whether the reminder is actually noticeable in the real UI.

### Out of scope

- Changing pantry/kitchen persistence architecture.
- Changing recipe generation, quota, App Check, or linked-account gates.
- Implementing broad Settings redesign or a new global form framework.
- Adding analytics for unsaved-change loss unless a separate analytics effort is created.
- Changing Phase 5 post-cook cleanup/rescan labels.

## Decisions made so far

- The current explicit Save model can be confusing after chip add/delete actions because the list updates visually before it is committed.
- This is not a blocker for INIT-003 production gates, but it is important enough to preserve as a follow-up.
- The eventual fix should work for anonymous guests and linked users because both can now edit Settings inventory.
- The 2026-06-26 implementation keeps the explicit Save model rather than introducing autosave. Pantry/Tools edits show an inline dirty-state reminder, Save copy changes while dirty, and leaving or switching away from a dirty inventory list asks for confirmation.

## Open questions

- Should Settings inventory remain explicit-save with a dirty-state warning, or should specific chip add/delete actions autosave?
- Does the inline reminder feel visible but not noisy on Replit/mobile?
- Should reset remain an immediate saved destructive action, or should a future product pass make reset a dirty local edit?
- Should recent unsaved chips visually differ from saved chips until Save succeeds?

## Agent checklist

Read EFF-025 before starting any of the following:

- [ ] Changing Settings Pantry/Kitchen add, delete, scan, reset, or save behavior.
- [ ] Changing Settings dirty-state, Save button, Back button, or section navigation behavior.
- [ ] Changing anonymous guest Settings persistence UX.
- [ ] Changing linked-account Settings inventory persistence UX.
- [ ] Adding autosave or leave-warning behavior to Settings.

## Resolution criteria

This Effort is `Resolved` when all of the following are true:

1. Pantry add/delete/edit actions make unsaved state clear before Save.
2. Kitchen receives the same treatment or a documented reason for a different treatment.
3. Save success clears the reminder and preserves the existing saved/recent chip-state grammar.
4. Leaving with unsaved changes is handled intentionally, with tests for the chosen behavior where practical.
5. Linked-user and anonymous guest session-local Settings paths are both covered.
6. Replit/mobile validation confirms the reminder is visible and not overly noisy.

## Linked artifacts

- [`INIT-003: Anonymous Trial and Account Upgrade`](../initiatives/INIT-003-anonymous-trial-and-account-upgrade.md)
- [`PD-012: Public anonymous trial and account upgrade`](../product-decisions/pd-012-public-anonymous-trial-and-account-upgrade.md)
- [`INIT-001: Mobile Refresh`](../initiatives/INIT-001-mobile-refresh.md)
- `client/src/components/cooking/user-settings.tsx`
- PR #107, INIT-003 production gates

## 2026-05-27 - Created from Settings save-reminder observation

Wilson observed during anonymous guest validation that after Pantry additions/deletions, the UI does not clearly remind the user to save before leaving or continuing. Created this Effort so the broader Settings dirty-state/save-reminder fix can be handled later without expanding INIT-003 production-gates scope.

## 2026-06-11 - Linked Tools save remount regression found during release smoke

During pre-production Replit smoke, Wilson reproduced a linked Google-account Settings issue: saving Tools appeared to refresh/remount the app and the startup load routed the complete profile back to the planning-choice screen instead of preserving the active Settings/Tools surface. The inferred root cause was app-level profile bootstrap behavior, not the explicit-save model itself: complete linked profiles restored to planning unless an active cooking plan existed, and Settings had no active-section restore contract across remounts.

Branch `codex/settings-save-remount-restore` adds a scoped, fresh active Settings section marker and has `UserSettings` report Pantry/Tools/Profile navigation back to the app shell. A remount after a signed-in Tools save should now restore `Settings > Tools` instead of planning. This adds evidence for EFF-025's leave/save UX surface but does not resolve the broader dirty-state reminder, save affordance, or unsaved-leave warning criteria.

## 2026-06-12 - Reframed as remount mitigation, not refresh root-cause resolution

Wilson clarified that the broad successful release smoke happened on PR #172 / `main`, while PR #173 was still being fixed. Focused PR #173 Replit dev validation then confirmed the mitigation behavior: signed-in Tools save did not route back to planning, hard refresh while on `Settings > Tools` restored to Tools, and navigating to Cook cleared the restore marker so a later refresh returned to the normal planning screen.

This should be treated as a user-experience remedy for route loss after an intermittent remount, not a proven fix for the underlying refresh trigger. The trigger itself remains unidentified and may recur. The implementation is not Tools-only: the marker supports Settings hub, Pantry, Tools, and Cooking Profile, but only Tools was manually validated because that was the observed failing surface.

## 2026-06-13 - PR #173 merged Settings remount mitigation

PR #173 merged as `4ee5c27df2ec9dc9ed127d18c3e3a02c81995b3a` after PR #176 cleared the shared dependency audit blocker and PR #173 was rebased onto `origin/main` at `e1c4d4ab5f147ef556d6200e09b4972e5b417fc6`. GitHub CI passed on exact head `b81a0c78d2c711e0263396e6db77dd983100db39`, and Wilson's focused Replit smoke on that head confirmed refresh restored to the previously active page/section. The original unexpected refresh could not be reproduced during final smoke.

EFF-025 remains open. PR #173 landed an active-section restore mitigation for route loss after remount; it did not add dirty-state reminders, save affordance changes, or unsaved-leave warnings.

## 2026-06-26 - Dirty-state reminder implementation branch started

Branch `codex/eff-025-settings-unsaved-reminder` adds the first direct EFF-025 implementation slice for Settings inventory edits. The branch keeps the existing explicit Save model and avoids autosave or persistence architecture changes.

Implemented behavior:

- Pantry and Tools compare the current local list against the last saved list.
- Manual add, chip remove, and scan-added items surface an inline `Unsaved pantry changes` or `Unsaved tools changes` reminder before Save.
- Save button copy changes to `Save pantry changes` / `Save tools changes` while dirty, then returns to the normal saved state after a successful linked or session-local save.
- Back from Settings and switching away from a dirty Pantry/Tools list ask for confirmation before discarding unsaved local edits.
- Existing saved/recent/found-again chip grammar remains unchanged and still clears to saved on successful Save.

Validation so far: focused local `npx vitest run tests/unit/user-settings-scan-policy.test.tsx` passed with linked and guest/session assertions. Remaining before closing EFF-025: Replit/mobile visual validation that the reminder is noticeable without being noisy.
