# Slop It Up Phase 3.1 Scope Capture

**Agent:** codex
**Branch:** codex/phase-3-1-slop-it-up-docs
**Date:** 2026-05-08
**Initiative:** INIT-001
**INIT updated:** yes

## Summary

Captured Wilson's Slop Bowl Planning-card copy decision as Phase 3.1 scope, not Phase 3 implementation. Phase 3 visuals remain frozen for functional closeout; Phase 3.1 now explicitly owns the **Slop It Up** title and supporting-copy treatment as part of the broader Planning facelift and Slop Bowl humor pass.

The key product boundary is: **Slop It Up** is the Planning choice card title, while **Slop Bowl** remains the durable feature name for flows, recipe language, backend/API contracts, sparse-pantry guard copy, and durable product documentation.

## Changes

- `product-decisions/features/mobile-refresh/pd-phase-03-1-recipe-imagery.md`
  - Added `2026-05-08 - Slop It Up Planning-Card Copy Direction`.
  - Recorded the plain-English intent: Chef It Up stays elegant/refined/collaborative; the Slop Bowl path gets a more culturally playful, sloppy, chaotic card voice without making the food sound bad.
  - Added a machine-readable YAML block with the accepted card title, copy-selection behavior, typography rule, approved copy options, and explicit out-of-scope items.
  - Added Phase 3.1 scope and acceptance-criteria bullets for the Slop It Up treatment.
- `initiatives/INIT-001-mobile-refresh.md`
  - Updated Phase 3.1 overview/current-status/progress/resume-point language so future work sees Slop It Up as planned Phase 3.1 scope.
  - Added a dated chronology entry for the May 8 copy decision.
- `docs/handoffs/2026-05-08-codex-slop-it-up-phase-3-1-scope.md`
  - Added this handoff so the docs-only decision capture is visible to the next implementation agent.

## Impact on other agents

Implement the copy change on the Phase 3.1 facelift branch, not on the Phase 3 functional-validation branch unless Wilson explicitly reopens Phase 3 visual changes.

Implementation should follow the machine-readable contract in the Phase 3.1 doc:

```yaml
slopItUpPlanningCard:
  cardTitle: "Slop It Up"
  featureNameRemains: "Slop Bowl"
  copySelection: "random-on-page-load"
  copyStability: "stable-during-mounted-session"
  typography:
    title: "same planning-card title system as Chef It Up"
    supportingCopy: "italic only on Slop It Up card"
```

Use one of the four approved supporting-copy lines exactly as listed in the Phase 3.1 doc. Do not add a timed carousel, new sticker/banner system, backend/API rename, or global Slop Bowl rename.

This conforms to PD-005 and `design_guidelines.md`: the change is tone-forward copy/typography direction for an existing governed Planning surface, not a new styling system.

## Open items

- Code implementation is intentionally deferred to Phase 3.1.
- Phase 3.1 visual review should verify that the italic supporting copy fits the Planning card on mobile and does not make Chef It Up feel visually inconsistent.
- No Replit validation was run for this docs-only scope capture.

## Verification

- Verify the Phase 3.1 doc contains the new dated Slop It Up section and YAML contract.
- Verify INIT-001 points Phase 3.1 implementers at the Slop It Up card-title/copy treatment.
- Run `git diff --check` before committing.

## Stack / base status

- Base refreshed: yes
- Current base: `origin/main` at `1454ba5`
- Last Replit-validated at: n/a - docs-only scope capture
- Notes: implementation is deferred to the future Phase 3.1 branch. Rebased after Phase 3 closeout and generation-lock/cancel docs landed on `main`.
