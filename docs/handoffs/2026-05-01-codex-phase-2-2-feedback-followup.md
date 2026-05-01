# Phase 2.2 Feedback Follow-Up

**Agent:** codex
**Branch:** codex/mobile-refresh-phase-2-2-settings-history
**Date:** 2026-05-01
**Initiative:** INIT-001
**INIT updated:** yes

## Summary

Captured and partially implemented Wilson's first Phase 2.2 review feedback before further Replit testing. The IA direction is better, but merge readiness now depends on resolving the Settings/setup consistency question instead of treating returning Settings as a separate visual system.

## Implemented

- Removed visible `Cook` and `Menu` text from the bottom nav; actions are icon-only with accessible labels.
- Changed returning Settings/History back copy from `Back to cook` to `Back`.
- Replaced `Your cooking memory.` with a five-item rotating headline roster for warmer History copy.
- Confirmed Feedback still submits `currentPage`; improved it from broad phase-only values to more precise app context such as `/app-settings-pantry`, `/app-history`, `/app-planning-choice`, and `/app-planning-manual`.
- Replaced the Feedback submit button's hex styling with theme tokens while touching the modal.
- Added the documentation foundation rule to both `AGENTS.md` and `CLAUDE.md`.

## Recommendation / Product Architecture

Keep first-time setup and returning Settings as separate top-level flows because their jobs are different:

- First-time setup is sequential, progress-driven, and completion-gated.
- Returning Settings is a hub/deep-link destination with existing data, independent saves, reset/remove controls, and Slop Bowl entry points.

Do not keep their Pantry/Kitchen/Profile internals separate. Extract or otherwise centralize the shared building blocks so equivalent tasks share behavior and visual language:

- Pantry/Kitchen inventory editor: scan/upload/manual entry, parsing, scanning state, chip list, and scan feedback.
- Cooking Profile choices: full-row skill and dietary controls.
- Flow-specific wrappers: setup progress/auto-advance/completion versus Settings save/reset/deep-link behavior.

Recommended UX for scan cognitive load:

- Do not auto-start camera when a returning user opens Settings.
- Make `Scan` reveal the same designed camera object used in setup, ideally inline or in a clearly connected sheet.
- Keep `Upload photos` as a direct file picker.
- Keep manual entry as a peer privacy-friendly path.

## Docs Updated

- `AGENTS.md`
- `CLAUDE.md`
- `initiatives/INIT-001-mobile-refresh.md`
- `initiatives/registry.md`
- `product-decisions/features/mobile-refresh/phase-02-2-returning-setup-settings.md`
- `product-decisions/features/mobile-refresh/design-language.md`
- `epics/001-ui-governance.md`
- `epics/004-selection-controls-tap-targets.md`
- `epics/005-testing-strategy-and-acceptance-criteria.md`
- `epics/012-laica-design-language.md`
- `epics/registry.md`

## Open Items

- The larger shared-component extraction is not implemented in this follow-up commit.
- Phase 2.2 should not be considered visually accepted until returning Pantry/Kitchen/Profile either share the setup component pattern or a deliberate, reviewed exception is documented.
- Replit validation has not been re-run after these changes.

## Verification

- `npm run check`
- `npm run build`
- `git diff --check`

## Stack / base status

- Base refreshed: yes
- Current base: origin/main at `6541e91e15b80030655d83ca4e9413fd0d2491e9`
- Last Replit-validated at: not yet validated
