# EPIC-013 — Pantry manual-entry spell correction

**Status:** Open
**Owner:** Wilson / Codex / Claude
**Created:** 2026-04-30
**Updated:** 2026-04-30

## One-line summary

Add conservative ingredient spelling correction for saved pantry manual entry, while preserving intentional, brand, cultural, and stylized ingredient names.

## Linked Initiatives

- [INIT-001 — Mobile Refresh](../initiatives/INIT-001-mobile-refresh.md)

## Context

During Phase 2.1 setup validation, Wilson asked to file a later epic for pantry manual entry autocorrection: if a user manually types an ingredient with a common spelling mistake, Laica should correct what is clearly best before adding it to the pantry list.

This should improve pantry quality without turning Laica into an overzealous autocorrect. Ingredients can be brand names, cultural names, product names, portmanteaus, or stylized packaging labels. Examples that should not be "corrected" just because they look unusual:

- `sushiritto`
- `WTR MLN WTR`
- branded/stylized products
- culturally specific ingredients or dishes
- uncommon but valid pantry terms

Equipment should not use this correction pass. Kitchen tools can have model names, brand spellings, or specialized terminology where aggressive correction would be more likely to harm than help.

## Scope

### In scope

- Saved pantry manual-entry surfaces:
  - Phase 2 setup pantry manual entry
  - Settings pantry manual entry
  - Future pantry cleanup/manual-add surfaces that persist to pantry
- Correcting high-confidence common ingredient misspellings before the pantry list is saved or updated.
- Preserving comma/period-separated manual-entry behavior from EPIC-009.
- Giving users a clear edit/undo affordance if a correction is applied.
- Tracking correction behavior in tests with both corrected and preserved examples.

### Out of scope

- Kitchen equipment manual entry.
- Vision scan label correction unless a later product decision explicitly expands scope.
- Slop Bowl temporary ingredient quick-add unless the correction system is later proven safe for ephemeral pantry additions.
- Broad grammar/spellcheck on freeform recipe preferences, feedback, or notes.
- Nutrition, canonical taxonomy, grocery-store matching, or ingredient substitution logic.

## Decisions made so far

- Correction should be **conservative**. Default lean: correct only high-confidence common pantry misspellings such as `brocolli` to `broccoli`, not every unknown token.
- Correction should not silently rewrite suspiciously unique terms. Unknown ingredient names should generally pass through unchanged.
- Pantry correction should preserve user intent for:
  - all-caps or stylized labels
  - brand-like entries
  - entries with numbers or unusual spacing
  - cultural/fusion names
  - words already in a known ingredient allowlist
- The best UX direction is a soft correction with visibility: for example, add the corrected chip but allow immediate edit/remove, or show a small `Corrected to broccoli` note. Silent correction is riskier and should be avoided unless the correction is extremely obvious.
- Equipment entries should not be corrected as part of this epic.

## Open questions

1. Should correction use a local dictionary/allowlist first, a model-assisted classifier, or a hybrid?
2. What confidence threshold is high enough to auto-apply a correction rather than suggest it?
3. Should users see a `Corrected from ...` note, an undo action, or only rely on editable chips?
4. Should pantry correction happen before duplicate detection, after duplicate detection, or both?
5. Should corrected pantry labels preserve user casing or use pantry-list title/lowercase normalization?
6. Do we need locale/language support before this ships, or is English pantry spelling enough for v1?

## Agent checklist — when to read this epic

Read EPIC-013 before starting any of the following:

- [ ] Changing saved pantry manual-entry parsing or normalization
- [ ] Adding ingredient spellcheck/autocorrect/suggestion behavior
- [ ] Adding an ingredient dictionary, ingredient ontology, or ingredient canonicalization helper
- [ ] Changing duplicate detection for saved pantry entries
- [ ] Changing setup/settings pantry manual-entry UX after Phase 2.1

When this epic applies, also cite:

- [EPIC-009](009-consistent-comma-separated-ingredient-entry.md) for delimiter/parser behavior
- [EPIC-005](005-testing-strategy-and-acceptance-criteria.md) if defining acceptance criteria or validation coverage

## Resolution criteria — what "done" looks like

This epic is `Resolved` when all of the following are true:

1. Saved pantry manual entry corrects a small set of high-confidence common misspellings before adding items to the pantry list.
2. Valid uncommon/stylized examples such as `sushiritto` and `WTR MLN WTR` remain unchanged.
3. Equipment manual entry remains unaffected.
4. Users can clearly edit, remove, or undo an applied correction.
5. Tests cover corrected examples, preserved stylized/brand-like examples, duplicate behavior after correction, and equipment non-correction.
6. A handoff or product note records the accepted correction mechanism and user-facing pattern.

## Linked artifacts

- [EPIC-009 — Consistent comma-separated ingredient entry](009-consistent-comma-separated-ingredient-entry.md)
- [Phase 2.1 setup polish](../product-decisions/features/mobile-refresh/phase-02-1-setup-polish.md)
- [INIT-001 — Mobile Refresh](../initiatives/INIT-001-mobile-refresh.md)

## Chronology

### 2026-04-30 — Epic filed from Phase 2.1 validation follow-up

Wilson asked to capture a future pantry manual-entry autocorrect behavior after Phase 2.1 manual-entry validation. Codex filed this as a separate epic rather than adding it to the Phase 2.1 merge gate because spelling correction has trust, cultural-term, and brand-name risks that need dedicated acceptance criteria.
