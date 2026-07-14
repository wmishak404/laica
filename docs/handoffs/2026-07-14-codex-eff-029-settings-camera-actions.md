# EFF-029 Settings Camera And Action Clearance

**Agent:** codex
**Branch:** codex/settings-camera-action-effort
**Date:** 2026-07-14
**Initiative:** INIT-001
**INIT updated:** no
**Resolves blocked handoff:** none

## Summary

Wilson reported two related returning Settings layout issues from mobile Safari/Replit screenshots: Pantry/Tools camera frames are too short and make the camera-off state feel disproportionate, and the pinned inventory action buttons are covered by the authenticated bottom nav. This branch files EFF-029 as a new active Effort so implementation can happen later, after thread `019f3b47-9d04-7a03-8973-2a9cd1bb19b4` merges.

## Changes

- `efforts/effort-029-settings-camera-action-clearance.md`: new active Effort with context, scope, non-goals, sequencing gate, checklist, and resolution criteria.
- `efforts/README.md`: adds EFF-029 to the active Effort read list.
- `efforts/registry.md`: adds EFF-029 to the searchable registry.

INIT-001, Phase 2.1, Phase 2.2, PD-005, `design_guidelines.md`, and the production vision blocked handoff were read. INIT-001 was linked but not updated because filing this follow-up does not change initiative phase status, validation state, assets, current resume point, or a major product decision.

## Impact on other agents

Before implementing, confirm thread `019f3b47-9d04-7a03-8973-2a9cd1bb19b4` has merged. Then read EFF-029, INIT-001, Phase 2.1, Phase 2.2, PD-005, and `design_guidelines.md`.

The implementation target is intentionally narrow: returning Settings Pantry and Tools should get a taller, roughly 4:5 camera object and bottom actions pinned above the bottom nav. Preserve scan/upload/manual/save/reset behavior and avoid bottom-nav IA changes.

## Open items

- No implementation has started.
- Future PR should decide whether the camera/action fixes belong in shared setup-derived primitives or returning Settings-specific layout.
- Future validation should include mobile visual evidence for both Pantry and Tools, plus first-time setup checks if shared camera CSS/components are touched.

## Verification

- Documentation-only change.
- Required references read: `docs/workflows/operating-principles.md`, `docs/workflows/documentation-routing.md`, `efforts/README.md`, `efforts/registry.md`, `initiatives/INIT-001-mobile-refresh.md`, `product-decisions/features/mobile-refresh/pd-phase-02-1-setup-polish.md`, `product-decisions/features/mobile-refresh/pd-phase-02-2-returning-setup-settings.md`, `product-decisions/pd-005-ui-governance.md`, `design_guidelines.md`, `docs/handoffs/2026-06-21-codex-prod-vision-scan-investigation-blocked.md`, and `docs/handoffs/README.md`.
- Suggested local checks before PR: `git diff --check` and a targeted reference search for `EFF-029`.
