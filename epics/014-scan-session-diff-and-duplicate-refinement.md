# EPIC-014 — Scan session diff and duplicate refinement

**Status:** Open
**Owner:** Wilson / Codex / Claude
**Created:** 2026-04-30
**Updated:** 2026-04-30

## One-line summary

Make Pantry/Kitchen scan results easier to review by showing what was new in the latest scan, what overlapped with saved inventory, and how users can clean up duplicate-like entries.

## Linked Initiatives

- [INIT-001 — Mobile Refresh](../initiatives/INIT-001-mobile-refresh.md)

## Context

During Phase 2.1 mobile validation, Wilson confirmed that upload smoke tests from different sources passed and that the current duplicate mitigation skips some already-saved scan labels. However, duplicate-like entries can still appear because vision labels may vary across repeated captures of the same physical items.

Wilson chose not to keep refining this inside Phase 2.1. Instead, the deeper UX should become a future epic: after a scan, Laica should visually label what came from the latest scan session so users can understand what overlapped, what was newly added, and which entries they may want to remove or merge.

This is bigger than exact dedupe. It touches inventory review UX, scan-session memory, chip styling, and likely future cleanup/rescan flows.

## Scope

### In scope

- Pantry and Kitchen scan result review surfaces:
  - Phase 2 setup Pantry/Kitchen lists
  - Settings Pantry/Kitchen scan/edit lists
  - Future post-cook cleanup or rescan surfaces
- Visual indicators for latest-scan additions, already-saved/overlap labels, and user-reviewed existing items.
- Lightweight duplicate cleanup affordances after a scan, such as marking likely duplicates, removing a duplicate chip, or reviewing "found again" items.
- A clear UX rule for how long "new from latest scan" state lasts: current scan session, current page session, or until the user reviews/continues.
- Tests for scan-session labeling, overlap messaging, and duplicate-like review behavior.

### Out of scope

- Blocking Phase 2.1 setup merge on perfect duplicate removal.
- Full pantry/equipment ontology or semantic canonicalization.
- Model-side inventory memory beyond the current user's saved list unless a later design explicitly chooses it.
- Automatic spell correction for pantry manual entry; that is tracked in [EPIC-013](013-pantry-manual-entry-spell-correction.md).
- DB schema changes unless a future implementation proves scan-session state must persist beyond the current UI session.

## Decisions made so far

- Phase 2.1 ships a pragmatic exact/near-exact duplicate mitigation, but not ultra-refined semantic duplicate handling.
- Some duplicate-like labels may still pass through because the model can describe the same object with different but plausible labels.
- Future work should make the latest scan's contribution visible instead of only trying to hide all duplicate risk.
- A promising direction is chip color/state:
  - a distinct hue for newly added items from the latest scan
  - a quieter overlap state for items already saved/found again
  - normal chips for older saved inventory
- The UX should invite users to resolve duplicates without forcing a complex review workflow during first-time setup.

## Open questions

1. Should latest-scan indicators clear when the user leaves the step, taps Next, saves profile, or manually dismisses them?
2. Should "already saved" overlap items appear in the list, in a separate scan summary, or only in toast copy?
3. Should likely duplicates be suggested visually, or should Laica avoid guessing until a stronger canonicalization model exists?
4. Is duplicate cleanup needed during first-time setup, Settings, post-cook cleanup, or all three at once?
5. Should scan-session state be purely client-side, or should any part of it persist for later review?
6. What chip color/state works best with the Phase 2.1 Pantry/Kitchen visual system without overloading users?

## Agent checklist — when to read this epic

Read EPIC-014 before starting any of the following:

- [ ] Changing Pantry/Kitchen scan result chip states or list review UX
- [ ] Adding "new", "found again", "already saved", or "latest scan" visual indicators
- [ ] Changing duplicate detection beyond exact/near-exact entry normalization
- [ ] Adding merge/remove suggestions for duplicate-like pantry or equipment entries
- [ ] Implementing post-cook cleanup/rescan inventory review
- [ ] Changing how setup or Settings communicate what a scan added versus skipped

When this epic applies, also cite:

- [EPIC-005](005-testing-strategy-and-acceptance-criteria.md) for validation and acceptance criteria
- [EPIC-007](007-vision-scan-no-detection-feedback.md) for scan outcome messaging
- [EPIC-009](009-consistent-comma-separated-ingredient-entry.md) when manual entry normalization intersects with duplicates
- [EPIC-012](012-laica-design-language.md) for chip color/state design language
- [EPIC-013](013-pantry-manual-entry-spell-correction.md) if pantry correction and duplicate behavior interact

## Resolution criteria — what "done" looks like

This epic is `Resolved` when all of the following are true:

1. Pantry and Kitchen scan review surfaces clearly distinguish latest-scan new items from already-saved/found-again items.
2. Users have an obvious way to remove or resolve duplicate-like entries discovered after a scan.
3. The chosen chip/state design is documented in the mobile-refresh design language or a product decision.
4. Duplicate refinement does not collapse legitimately distinct tools or ingredients without user control.
5. Tests cover new/latest-scan indicators, overlap messaging, and at least one duplicate-like cleanup path.
6. A Replit validation note or handoff records the accepted behavior on mobile.

## Linked artifacts

- [Phase 2.1 setup polish](../product-decisions/features/mobile-refresh/phase-02-1-setup-polish.md)
- [INIT-001 — Mobile Refresh](../initiatives/INIT-001-mobile-refresh.md)
- [EPIC-005 — App-wide testing strategy and acceptance criteria workflow](005-testing-strategy-and-acceptance-criteria.md)
- [EPIC-007 — Vision scan should explicitly say when nothing was detected](007-vision-scan-no-detection-feedback.md)
- [EPIC-012 — LAICA Design Language & Visual Identity](012-laica-design-language.md)

## Chronology

### 2026-04-30 — Filed from Phase 2.1 mobile validation

Wilson's mobile smoke confirmed that uploads from different sources passed and that the current duplicate mitigation skipped some items, but duplicate-like entries still appeared. Wilson deferred ultra-refinement out of Phase 2.1 and proposed a future UX direction: visually label what is new from the latest scan so users can tell what overlapped and clean up duplicates based on the most recent scan context.
