# Mobile Refresh Phase 2.1 Replit Visual Feedback

**Agent:** codex
**Branch:** codex/mobile-refresh-phase-2-1-setup-polish
**Date:** 2026-04-30
**Initiative:** INIT-001
**INIT updated:** yes

## Summary

Captured Wilson's Replit visual review feedback for Phase 2.1 setup as product/design documentation. This is a docs-only pass; implementation is still pending.

The feedback accepts the broad setup visual direction but requests one more polish iteration before merge: remove app headers, simplify setup chrome, move camera controls into the viewfinder, update setup copy, increase action-label readability, add kitchen-specific utilitarian accents, use illustration-style icons, isolate `No restrictions`, and preserve the liked confirmation page.

## Changes

- `product-decisions/009-mobile-refresh-navigation.md`
  - Adds a 2026-04-30 amendment: authenticated app pages should not show a persistent top header; account/profile/sign-out access belongs in the bottom-menu/account surface.
- `product-decisions/features/mobile-refresh/design-language.md`
  - Records `Laica` casing for user-facing copy.
  - Adds durable design guidance for no app header, one setup progress treatment, in-frame camera controls, readable setup action labels, multicolor setup illustrations, Kitchen accent direction, and the isolated `No restrictions` control.
- `product-decisions/features/mobile-refresh/README.md`
  - Carries the `Laica` casing convention into the mobile-refresh phase index.
- `product-decisions/features/mobile-refresh/phase-02-1-setup-polish.md`
  - Adds Wilson's exact Replit feedback as Phase 2.1 acceptance criteria and a dated feedback section.
- `initiatives/INIT-001-mobile-refresh.md`
  - Updates current status, required-before-merge items, and resume point to make this Replit feedback the next implementation focus.
- `epics/001-ui-governance.md`
  - Adds app-shell/control-pattern governance signal: no authenticated app header by default, one setup progress treatment, readable secondary actions, and in-camera controls.
- `epics/004-selection-controls-tap-targets.md`
  - Adds the dietary default selection note: `No restrictions` should be isolated and visually distinguished.
- `epics/012-laica-design-language.md`
  - Adds durable design-language signals for `Laica` casing, no persistent app header, in-frame camera controls, multicolor setup illustrations, Kitchen accent treatment, and the isolated dietary default.

## Impact on other agents

- EPIC-001: adds app-shell and reusable setup-control governance. Future mobile-refresh surfaces should not reintroduce a website-style top header by default.
- EPIC-004: adds a concrete multi-select default-choice pattern for Dietary Restrictions.
- EPIC-005: reinforces that Replit visual review can produce merge-blocking acceptance criteria, not only functional smoke results.
- EPIC-012: adds durable design-language direction from the Replit visual review.
- PD-009: now owns the no-authenticated-header decision for future app-shell work.

## Open items

- Implement Wilson's 2026-04-30 Replit feedback on `codex/mobile-refresh-phase-2-1-setup-polish`.
- Re-run local checks after implementation.
- Pull the updated branch into Replit and re-run Phase 2.1 validation, including visual review against `docs/assets/mobile-refresh/phase-02-setup.png`.
- Record the final Replit-validated commit SHA before merge. The branch is not yet validated.

## Verification

- Docs-only change; no runtime checks were needed for this capture pass.
- To verify the documentation capture, review:
  - `product-decisions/features/mobile-refresh/phase-02-1-setup-polish.md`
  - `product-decisions/features/mobile-refresh/design-language.md`
  - `product-decisions/009-mobile-refresh-navigation.md`
  - `initiatives/INIT-001-mobile-refresh.md`

## Stack / base status

- Base refreshed: yes
- Current base: origin/main at `4ef300cda6778bbd562e918fc5b835a246b65bd8`
- Last Replit-validated at: not yet validated
- Notes: The feedback was observed in Replit from the Phase 2.1 branch after commit `c5f36d4`, but this is visual feedback, not validation approval.
