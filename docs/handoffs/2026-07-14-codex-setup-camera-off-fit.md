# Setup camera off-state fit

**Agent:** codex
**Branch:** codex/setup-camera-off-fit
**Date:** 2026-07-14
**Initiative:** INIT-001
**INIT updated:** no
**Resolves blocked handoff:** none

## Summary

This branch starts from the Replit-validated `8c48ec4` mobile-browser build because Wilson reported that build did not reproduce the setup navigation bugs. It keeps that baseline and narrowly adjusts setup browser behavior: Pantry and Tools camera-off states now keep a camera-like proportion without decorative corner marks, and first-time setup step transitions reset the owned setup scrollport so a bottom-scrolled Ready screen does not leak its scroll position back into Dietary, Cooking Skill, or earlier pages.

## Changes

- `client/src/components/ui/native-camera.tsx`: adds explicit setup camera state icon/copy hooks while keeping non-setup camera behavior unchanged.
- `client/src/components/cooking/user-profiling.tsx`: resets the setup scrollport and document scroll on setup step/view transitions, including Ready -> Back and tools-capture transitions.
- `client/src/index.css`: changes setup camera viewfinders to a 4:3 proportion, adds base layout rules for setup camera off/error states, keeps a reserved control zone so copy and controls do not overlap on mobile-browser setup pages, and uses the dynamic mobile viewport for the setup shell.
- `tests/unit/user-profiling.test.tsx`: verifies first-run Pantry setup renders the new setup camera state hooks, still has no setup corner ornaments, and resets scroll when backing out of the Ready confirmation.
- `tests/unit/user-settings-scan-policy.test.tsx`: verifies returning Settings Pantry/Tools reuse the same setup camera state hooks and still have no setup corner ornaments.
- `design_guidelines.md`: tightens the setup camera principle to include camera-like preview proportion alongside the existing no-crowded-brackets/control-zone guidance, and records the no-scroll-leak rule for step-based mobile-browser flows.
- `efforts/effort-028-setup-skill-next-action.md`, `efforts/README.md`, `efforts/registry.md`: records Wilson's later-scope request to add an explicit bottom Next action to the cooking-comfort setup page without folding that work into this repair branch.

## Impact on other agents

Do not rebase this branch onto a later `codex/mobile-browser-type-fit` head without checking Wilson's reported setup navigation regressions first. The intended base is the known-good Replit build `8c48ec4`; this is a small visual fix layered on top of that baseline.

## Open items

- Not loaded to Replit yet in this branch.
- No mobile-device manual QA has been claimed for this branch. Wilson should validate Pantry and Tools camera-off setup surfaces plus Ready -> Back scroll behavior in the mobile browser preview before merge decisions.
- EFF-028 is intentionally open for a later UX consistency pass: the cooking-comfort setup page still advances by tapping a skill option and does not yet have a bottom Next action.

## Verification

- `npx vitest run tests/unit/user-profiling.test.tsx tests/unit/user-settings-scan-policy.test.tsx tests/unit/native-camera.test.tsx`
- `npm run check`
- `npm run build`

## Stack / base status

- Base refreshed: no
- Current base: `8c48ec4` (`codex: clean up setup browser scan fit`)
- Last Replit-validated at: `8c48ec4` baseline only; this follow-up branch is not yet Replit-validated.
- Notes: intentionally based on Wilson's known-good navigation build rather than the later divergent branch head.
