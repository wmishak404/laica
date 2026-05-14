# EFF-014 — Scan session diff and duplicate refinement

**Former ID:** EPIC-014
**Status:** In Progress
**Owner:** Wilson / Codex / Claude
**Created:** 2026-04-30
**Updated:** 2026-05-14

## One-line summary

Make Pantry/Kitchen scan results easier to review by showing what was new in the latest scan, what overlapped with saved inventory, and how users can clean up duplicate-like entries.

## Linked Initiatives

- [INIT-001 — Mobile Refresh](../initiatives/INIT-001-mobile-refresh.md)

## Context

During Phase 2.1 mobile validation, Wilson confirmed that upload smoke tests from different sources passed and that the current duplicate mitigation skips some already-saved scan labels. However, duplicate-like entries can still appear because vision labels may vary across repeated captures of the same physical items.

Wilson chose not to keep refining this inside Phase 2.1. Instead, the deeper UX should become a future Effort: after a scan, Laica should visually label what came from the latest scan session so users can understand what overlapped, what was newly added, and which entries they may want to remove or merge.

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
- Automatic spell correction for pantry manual entry; that is tracked in [EFF-013](effort-013-pantry-manual-entry-spell-correction.md).
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
- The 2026-05-14 Phase 3.1 implementation branch accepted the existing Setup/Settings scope:
  - saved Pantry/Kitchen items use green checked chips
  - recently added manual/scan items use coral `+` chips with an `X`
  - found-again scan matches stay in the same list as quiet green checked chips with latest-scan emphasis and toast copy
  - recent/found-again state is client-side only and clears on Settings save or setup Continue
  - duplicate-like cleanup stays conservative: users remove latest-added variants; Laica does not infer semantic duplicates or auto-collapse labels

## Open questions

Resolved for Setup/Settings by the 2026-05-14 Phase 3.1 implementation branch:

1. Latest-scan indicators clear on setup Continue and successful Settings save.
2. Already-saved overlap appears in the same list as a found-again chip state plus toast copy.
3. Laica does not guess semantic duplicates in this slice; cleanup happens by making latest additions easy to remove.
4. First-time setup and returning Settings are covered together for Pantry and Kitchen.
5. Scan-session state is purely client-side.
6. The accepted chip grammar is green checked saved/found-again items and coral `+` recently-added items.

Still deferred outside this Effort's Setup/Settings closeout:

- Phase 5 post-cook rescan labels (`Already saved`, `Found again`, `New`) remain owned by the accepted Phase 5 record and its future implementation branch.

## Agent checklist — when to read this Effort

Read EFF-014 before starting any of the following:

- [ ] Changing Pantry/Kitchen scan result chip states or list review UX
- [ ] Adding "new", "found again", "already saved", or "latest scan" visual indicators
- [ ] Changing duplicate detection beyond exact/near-exact entry normalization
- [ ] Adding merge/remove suggestions for duplicate-like pantry or equipment entries
- [ ] Implementing post-cook cleanup/rescan inventory review
- [ ] Changing how setup or Settings communicate what a scan added versus skipped

When this Effort applies, also cite:

- [Testing and Acceptance Workflow](../docs/workflows/testing-and-acceptance.md) for validation and acceptance criteria
- [EFF-007](effort-007-vision-scan-no-detection-feedback.md) for scan outcome messaging
- [EFF-009](effort-009-consistent-comma-separated-ingredient-entry.md) when manual entry normalization intersects with duplicates
- [Mobile Refresh design language](../product-decisions/features/mobile-refresh/pd-design-language.md) for chip color/state design language
- [EFF-013](effort-013-pantry-manual-entry-spell-correction.md) if pantry correction and duplicate behavior interact

## Resolution criteria — what "done" looks like

This Effort is `Resolved` when all of the following are true:

1. Pantry and Kitchen scan review surfaces clearly distinguish latest-scan new items from already-saved/found-again items.
2. Users have an obvious way to remove or resolve duplicate-like entries discovered after a scan.
3. The chosen chip/state design is documented in the mobile-refresh design language or a product decision.
4. Duplicate refinement does not collapse legitimately distinct tools or ingredients without user control.
5. Tests cover new/latest-scan indicators, overlap messaging, and at least one duplicate-like cleanup path.
6. A Replit validation note or handoff records the accepted behavior on mobile.

## Linked artifacts

- [Phase 2.1 setup polish](../product-decisions/features/mobile-refresh/pd-phase-02-1-setup-polish.md)
- [INIT-001 — Mobile Refresh](../initiatives/INIT-001-mobile-refresh.md)
- [Testing and Acceptance Workflow](../docs/workflows/testing-and-acceptance.md)
- [EFF-007 — Vision scan should explicitly say when nothing was detected](effort-007-vision-scan-no-detection-feedback.md)
- [Mobile Refresh design language](../product-decisions/features/mobile-refresh/pd-design-language.md)

## Chronology

### 2026-04-30 — Filed from Phase 2.1 mobile validation

Wilson's mobile smoke confirmed that uploads from different sources passed and that the current duplicate mitigation skipped some items, but duplicate-like entries still appeared. Wilson deferred ultra-refinement out of Phase 2.1 and proposed a future UX direction: visually label what is new from the latest scan so users can tell what overlapped and clean up duplicates based on the most recent scan context.

### 2026-05-11 — Kept active after INIT ownership review

Wilson clarified the closure rule: an Effort should only close into an INIT when the work is already shipped or when a specific unclosed INIT phase naturally owns the remaining scope. This scan-review/duplicate-refinement work still spans setup, Settings, and later cleanup/rescan surfaces, and no single current unclosed Mobile Refresh phase has been updated to own that whole scope yet.

Keep this as an active Effort. If a future Mobile Refresh phase or slice explicitly takes over latest-scan indicators, found-again/new labeling, or duplicate-review cleanup, reconcile it there and only then consider resolving this Effort into the phase record.

### 2026-05-12 — Weekly hygiene audit

Rechecked against INIT-001, Phase 2.1/2.2 scan deferrals, Phase 3.1 visual alignment scope, Phase 5 post-cook rescan labels, PD-011, and the Mobile Refresh design-language records. The work is still unshipped and cross-surface: Phase 5 owns post-cook rescan labels, but not setup/Settings latest-scan review or duplicate-like cleanup as a whole. Keep this as an active standalone Effort until a specific unclosed phase or implementation slice explicitly accepts that broader ownership.

### 2026-05-14 — Setup/Settings implementation branch

Codex started `codex/mobile-refresh-phase-3-1-inventory-chip-states`, stacked on PR #73 because the Slop Bowl pantry-chip alignment branch is still open. The branch implements the accepted Setup/Settings scope for this Effort: shared green/coral inventory review chips, client-only recent/found-again state, found-again duplicate metadata from normalized scan matches, save/continue clearing, conservative duplicate cleanup through removable latest-added chips, and focused unit coverage. Local validation passed for the focused unit suite, `npm run check`, `npm run build`, `git diff --check`, and a bounded dotenvx dev-server smoke.

Keep the Effort `In Progress` until the stacked branch merges and Wilson completes the printed Replit/mobile validation checklist. After that closeout can flip this file to `Resolved`, remove it from the active read list, and leave Phase 5 post-cook rescan labels in the Phase 5 record rather than keeping EFF-014 open for future Phase 5 work.
