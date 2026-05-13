# EFF-013 — Pantry manual-entry spell correction

**Former ID:** EPIC-013
**Status:** Open
**Owner:** Wilson / Codex / Claude
**Created:** 2026-04-30
**Updated:** 2026-05-13

## One-line summary

Add conservative ingredient spelling correction for saved pantry manual entry, while preserving intentional, brand, cultural, and stylized ingredient names.

## Linked Initiatives

- [INIT-001 — Mobile Refresh](../initiatives/INIT-001-mobile-refresh.md)

## Context

During Phase 2.1 setup validation, Wilson asked to file a later Effort for pantry manual entry autocorrection: if a user manually types an ingredient with a common spelling mistake, Laica should correct what is clearly best before adding it to the pantry list.

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
- Preserving comma/period-separated manual-entry behavior from EFF-009.
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
- The best UX direction is a soft correction with visibility: add the corrected chip, briefly highlight the changed chip, and keep immediate edit/remove/Undo available. Silent correction is riskier and should be avoided unless the correction is extremely obvious.
- Equipment entries should not be corrected as part of this Effort.
- V0 mechanism accepted on 2026-05-13: use a tiny curated exact-match dictionary for high-confidence pantry misspellings, apply it only to saved pantry manual entry in setup and Settings, show a `Corrected some entries` toast, briefly flash the corrected chips for provenance, and include Undo to restore the original just-added batch.
- V0 intentionally does **not** try to recognize every valid ingredient. Unknown, niche, cultural, brand-like, stylized, or all-caps entries such as `doubanjiang`, `nalewka`, `sushiritto`, and `WTR MLN WTR` pass through unchanged unless a future branch explicitly adds a safe exact correction.

## Open questions

1. Should correction use a local dictionary/allowlist first, a model-assisted classifier, or a hybrid?
   - V0 answer: local curated exact-match dictionary only.
2. What confidence threshold is high enough to auto-apply a correction rather than suggest it?
   - V0 answer: exact entries in the curated dictionary are the confidence boundary.
3. Should users see a `Corrected from ...` note, an undo action, or only rely on editable chips?
   - V0 answer: generic correction toast, temporary corrected-chip highlight, and Undo; existing chip remove remains available.
4. Should pantry correction happen before duplicate detection, after duplicate detection, or both?
   - V0 answer: correction happens after parsing and before existing merge/dedupe logic.
5. Should corrected pantry labels preserve user casing or use pantry-list title/lowercase normalization?
6. Do we need locale/language support before this ships, or is English pantry spelling enough for v1?

## Agent checklist — when to read this Effort

Read EFF-013 before starting any of the following:

- [ ] Changing saved pantry manual-entry parsing or normalization
- [ ] Adding ingredient spellcheck/autocorrect/suggestion behavior
- [ ] Adding an ingredient dictionary, ingredient ontology, or ingredient canonicalization helper
- [ ] Changing duplicate detection for saved pantry entries
- [ ] Changing setup/settings pantry manual-entry UX after Phase 2.1

When this Effort applies, also cite:

- [EFF-009](effort-009-consistent-comma-separated-ingredient-entry.md) for delimiter/parser behavior
- [Testing and Acceptance Workflow](../docs/workflows/testing-and-acceptance.md) if defining acceptance criteria or validation coverage

## Resolution criteria — what "done" looks like

This Effort is `Resolved` when all of the following are true:

1. Saved pantry manual entry corrects a small set of high-confidence common misspellings before adding items to the pantry list.
2. Valid uncommon/stylized examples such as `sushiritto` and `WTR MLN WTR` remain unchanged.
3. Equipment manual entry remains unaffected.
4. Users can clearly edit, remove, or undo an applied correction.
5. Tests cover corrected examples, preserved stylized/brand-like examples, duplicate behavior after correction, and equipment non-correction.
6. A handoff or product note records the accepted correction mechanism and user-facing pattern.

## Linked artifacts

- [EFF-009 — Consistent comma-separated ingredient entry](effort-009-consistent-comma-separated-ingredient-entry.md)
- [Phase 2.1 setup polish](../product-decisions/features/mobile-refresh/pd-phase-02-1-setup-polish.md)
- [INIT-001 — Mobile Refresh](../initiatives/INIT-001-mobile-refresh.md)

## Chronology

### 2026-04-30 — Effort filed from Phase 2.1 validation follow-up

Wilson asked to capture a future pantry manual-entry autocorrect behavior after Phase 2.1 manual-entry validation. Codex filed this as a separate Effort rather than adding it to the Phase 2.1 merge gate because spelling correction has trust, cultural-term, and brand-name risks that need dedicated acceptance criteria.

### 2026-05-11 — Kept active after INIT ownership review

Wilson clarified the closure rule: an Effort should only close into an INIT when the work is already shipped or when a specific unclosed INIT phase naturally owns the remaining scope. Pantry spell correction does not currently meet that bar. It spans setup/settings pantry entry and possible later cleanup/manual-add work, but no open Mobile Refresh phase has been updated to own it directly.

Keep this as an active Effort. If a future Mobile Refresh phase takes pantry spell correction explicitly, reconcile it in that branch and only then consider resolving this Effort into the phase record.

### 2026-05-12 — Weekly hygiene audit

Rechecked against INIT-001, Phase 2.1/2.2 deferrals, and the planned Phase 3.1 / Phase 4 / Phase 5 records. No merged work implements conservative pantry spell correction, and no single unclosed Mobile Refresh phase has been updated to own the full setup/settings/future-manual-add scope. Keep this as an active standalone Effort with an INIT-001 cross-reference.

### 2026-05-13 — V0 product-playground implementation started

Wilson accepted EFF-013 as the first lightweight system-of-work product playground. The implementation direction is deliberately narrow: deterministic client-side pantry correction, setup + Settings only, visible corrected-chip provenance with toast Undo, targeted runtime/client-profile-persistence validation, and no new documentation category. EFF-017 remains a separate system-wide effort; this flow is recorded there as a future authenticated-smoke candidate rather than a dependency for the v0 product slice.

### 2026-05-13 — Replit spot-check refined correction coverage and provenance UI

Wilson's first Replit spot-check showed the initial v0 correction map was too narrow and the toast carried too much per-entry detail. The accepted refinement keeps the lightweight exact-match approach but adds the observed high-confidence variants (`brocoli`, `avcado`, `beens`, `ryce`, `chickin`) and moves provenance closer to the product surface: the toast now says `Corrected some entries`, while the corrected pantry chips briefly flash to show which saved tags changed. Undo still restores the original just-added batch, and kitchen manual entry remains untouched.

### 2026-05-13 — Targeted Replit validation passed

Wilson completed the targeted Replit validation checklist against the pre-rebase runtime SHA that now corresponds to `6f41ea4aa8b892e0697b5f4d5402a35eb76f95bb`. The validated scope was intentionally narrow: branch/SHA confirmation, Firebase sign-in, setup pantry correction + Undo, Settings pantry correction + Undo, duplicate-after-correction behavior, kitchen non-correction, and pantry save/reload persistence. AI routes, ElevenLabs, vision upload, schema pushes, and broad regression passes stayed out of scope.

### 2026-05-13 — Common-staple dictionary expanded after validation

Wilson accepted one more tiny dictionary bump for highly common pantry staples before merge. The exact-match map now also covers `garilic`, `letuce`, `onoin`, `potatos`, `tomatos`, `mushroms`, `strawbery`, and `bluebery`. This is a runtime behavior change after the validated SHA, so the earlier Replit validation is stale for the new branch head until the targeted pantry checklist is rerun.

### 2026-05-13 — Corrected-chip flash made more visible

Replit review showed the first corrected-chip flash was too subtle because it primarily affected the border. The flash now changes the chip fill to a brighter pale-yellow state before settling back to the pantry chip color. The broader UI-governance lesson was recorded in PD-005 and `design_guidelines.md`: provenance/state-change cues that users must notice should be visible on the filled surface, not only on a thin border.

### 2026-05-13 — Common-staple spellcheck validation passed

Wilson reported that Replit spellcheck validation passed for the common-staple dictionary additions. This confirms the new exact-match additions behave as intended, but it is recorded as a scoped spellcheck pass rather than a full current-head runtime validation because the later corrected-chip flash refinement still needs explicit visual confirmation before merge.

### 2026-05-13 — Current-head targeted validation complete

Wilson confirmed the brighter filled-chip flash looks good on corrected pantry tags. Combined with the earlier full targeted Replit checklist and the scoped common-staple spellcheck pass, the EFF-013 targeted runtime content is represented on the rebased branch at `6b093db35074434a914a82f43daa8c680cc091aa`.
