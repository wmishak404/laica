# Mobile Refresh Phase 2.1 Menu And Scan Polish

**Agent:** codex
**Branch:** codex/mobile-refresh-phase-2-1-setup-polish
**Date:** 2026-04-30
**Initiative:** INIT-001
**INIT updated:** yes

## Summary

Implemented Wilson's follow-up Replit polish for Phase 2.1 setup after the visual conformance pass.

This keeps the no-header direction, adds menu access through setup and the post-setup bottom nav, softens the Pantry heading, makes in-camera utility controls visible without opaque CTA styling, avoids a flashlight-like tips icon, removes technical helper labels from upload/manual actions, and pushes Kitchen accents further into gray/silver and light wood while keeping progress coral across setup.

## Changes

- `client/src/pages/app.tsx`
  - Adds a reusable account menu with account label, profile/settings, feedback, and sign-out actions.
  - Shows `Menu` in the post-setup bottom nav.
  - Passes a compact setup menu into `UserProfiling` so first-time setup has account/feedback/sign-out access without restoring the header or unlocking Planning.
- `client/src/components/cooking/user-profiling.tsx`
  - Adds the optional setup menu slot.
  - Removes the `Kitchen warm-up` eyebrow from the Welcome page.
  - Changes the Pantry heading to `Start with pantry staples.`
  - Removes helper sublabels below `Upload photos` and `Enter manually`.
  - Applies Kitchen-specific gray/silver classes to secondary action icons, manual illustration, input, save button, chips, and chip remove controls.
- `client/src/components/ui/native-camera.tsx`
  - Uses smaller translucent setup camera on/off and scanning tips controls with larger icons.
  - Removes the camera glyph from the capture shutter.
  - Switches scan tips from a lightbulb icon to a help-circle icon.
- `client/src/index.css`
  - Adds setup menu styling.
  - Adds translucent setup camera utility-button styling.
  - Keeps setup progress coral across Pantry and Kitchen.
  - Adds Kitchen-specific gray/silver and light-wood accents for actions, manual surfaces, and chips.
- `tests/unit/user-profiling.test.tsx`
  - Updates the setup flow assertion for the new Pantry heading.
- `product-decisions/features/mobile-refresh/design-language.md`
  - Records the setup menu affordance, translucent camera utility controls, simplified secondary action labels, and Kitchen gray/silver equipment accents as Phase 2.1 design-language signal.
- `product-decisions/features/mobile-refresh/phase-02-1-setup-polish.md`
  - Records Wilson's follow-up feedback and the local implementation note.
- `initiatives/INIT-001-mobile-refresh.md`
  - Updates Phase 2.1 status, validation state, chronology, and current resume point.

## Impact on other agents

- EPIC-001: conforms to no persistent authenticated app header while retaining a documented menu/account surface.
- EPIC-004: no behavior change to selection controls; Cooking Skill still auto-advances and Dietary Restrictions still requires explicit continuation.
- EPIC-005: local checks passed, but Replit validation is still the merge gate and must be tied to the latest commit SHA.
- EPIC-007: no scan-result contract change in this pass; existing no-detection and rejection feedback remains in place.
- EPIC-009: comma-separated manual entry behavior is preserved while removing the technical helper label from the UI.
- EPIC-010: no DB/schema changes.
- EPIC-012: adds durable setup design-language signal for menu placement, scan control visual weight, non-flashlight tips iconography, and Kitchen equipment color treatment.

## Open items

- Pull the latest `codex/mobile-refresh-phase-2-1-setup-polish` branch into Replit after this commit is pushed.
- Re-run the Phase 2.1 signed-in validation checklist at the latest branch head.
- Include visual review against `docs/assets/mobile-refresh/phase-02-setup.png`.
- Confirm in Replit: setup menu access, `Start with pantry staples.`, smaller translucent camera/tips controls with larger icons, blank capture shutter, help-circle scan tips icon, coral progress on Pantry and Kitchen, upload/manual labels without helper subcopy, Kitchen gray/silver save button and chips, text-only scan rejection, physical product/tool photo acceptance, Cooking Skill auto-advance, Dietary Restrictions explicit continuation, and final transition to Planning.
- Record `Last Replit-validated at: <commit-sha>` before merge.

## Verification

- `npm run check`
- `npx vitest run tests/unit/equipment-vision-prompts.test.ts tests/unit/vision-analysis-result.test.ts tests/unit/vision-result.test.ts tests/unit/native-camera.test.tsx tests/unit/user-profiling.test.tsx`
- `npm run build`

Known build warnings: Browserslist data is stale; Vite still reports the existing large bundle warning and Firebase dynamic/static import chunking warning.

## Stack / base status

- Base refreshed: yes
- Current base: origin/main at `4ef300cda6778bbd562e918fc5b835a246b65bd8`
- Last Replit-validated at: not yet validated
- Notes: Phase 2.1 remains on the fresh `origin/main` base requested for this setup-polish branch; Replit must fetch this pushed branch before preview/smoke validation.
