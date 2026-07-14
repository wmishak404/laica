# EFF-028 Chef It Up Title Clearance

**Agent:** codex
**Branch:** codex/chef-it-up-title-effort
**Date:** 2026-07-14
**Initiative:** INIT-001
**INIT updated:** no
**Resolves blocked handoff:** none

## Summary

Wilson reported that the Chef It Up time-selection title is visually covered by the floating Back button on mobile. This branch files the issue as EFF-028 so a future implementation pass can address it without losing the screenshot-backed direction: add horizontal inset/centering like the adjacent Chef It Up process screens, and avoid pushing the whole page downward. Wilson clarified that implementation should wait until Codex thread `019f3b47-9d04-7a03-8973-2a9cd1bb19b4` finishes its current work.

## Changes

- `efforts/effort-028-chef-it-up-time-title-clearance.md`: new active Effort with context, scope, explicit non-goals, checklist, and resolution criteria.
- `efforts/README.md`: adds EFF-028 to the active Effort read list.
- `efforts/registry.md`: adds EFF-028 to the searchable registry.

INIT-001 was read and linked from the Effort, but not updated because filing the follow-up does not change phase status, validation state, current resume point, assets, or a major product decision.

## Impact on other agents

Before touching Chef It Up time-step layout or nearby MealPlanning process-heading CSS, read EFF-028 alongside INIT-001, Phase 3 Planning, Phase 3.1, PD-005, and `design_guidelines.md`.

The implementation target is intentionally narrow: after thread `019f3b47-9d04-7a03-8973-2a9cd1bb19b4` completes, clear the floating Back button through horizontal title inset/centering, compare against `What sounds good?` and `Anything else around?`, and preserve flow behavior.

## Open items

- No implementation has started.
- Implementation should wait until Codex thread `019f3b47-9d04-7a03-8973-2a9cd1bb19b4` finishes its current work.
- Future PR should decide whether the clean fix is a shared Chef It Up process-heading rule or a narrow time-step override.
- Future validation should include mobile visual evidence that the title clears the Back button without reducing vertical real estate.

## Verification

- Documentation-only change.
- Required references read: `docs/workflows/operating-principles.md`, `docs/workflows/documentation-routing.md`, `efforts/README.md`, `efforts/registry.md`, `initiatives/README.md`, `initiatives/INIT-001-mobile-refresh.md`, `product-decisions/features/mobile-refresh/pd-phase-03-planning.md`, `product-decisions/features/mobile-refresh/pd-phase-03-1-recipe-imagery.md`, `product-decisions/pd-005-ui-governance.md`, `design_guidelines.md`, and `docs/handoffs/README.md`.
- Suggested local checks before PR: `git diff --check` and a targeted reference search for `EFF-028`.
