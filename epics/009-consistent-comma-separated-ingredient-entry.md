# EPIC-009 — Consistent comma-separated ingredient entry

**Status:** Open
**Owner:** Wilson / Codex / Claude
**Created:** 2026-04-27
**Updated:** 2026-04-28

## One-line summary

Make manual ingredient entry consistently handle comma-separated ingredients across Slop Bowl, setup, settings, and post-cook cleanup surfaces.

## Context — why this exists

Wilson found a consistency issue during Slop Bowl localhost testing on 2026-04-27: entering `buns, mayo` in the Slop Bowl pantry-check add field creates one ingredient badge named `buns, mayo`.

That does not match the original pantry entry behavior. The full pantry manual inputs in `client/src/components/cooking/user-settings.tsx` and `client/src/components/cooking/user-profiling.tsx` already split manual input by comma:

```tsx
input.value.split(',').map(i => i.trim()).filter(i => i.length > 0)
```

Slop Bowl quick-add currently treats the entire input as a single temporary ingredient. This makes the quick-add surface feel similar visually but behave differently, and it can also distort sparse-pantry counting and recipe generation inputs.

## Scope

### In scope

- Update Slop Bowl pantry-check quick-add so comma-separated input creates separate temporary ingredient badges.
- Keep the existing single-ingredient submit path working exactly as expected.
- Reuse the same trim/filter behavior as the full pantry manual input.
- Preserve case-insensitive duplicate prevention against existing profile and temporary ingredients.
- Make sparse-pantry counting reflect the split ingredients, not the raw typed string.
- Adjust helper copy if needed so users know they can enter one ingredient or multiple comma-separated ingredients.

### Out of scope

- Changing saved pantry semantics from EPIC-003; Slop Bowl quick-add remains ephemeral for the current bowl only.
- Changing camera/image pantry detection.
- Adding autocomplete, suggestions, or recent ingredient chips.
- Changing equipment entry behavior, unless the implementation extracts a shared parser that can safely be reused later.

## Decisions made so far

- **Behavior should match the original pantry input.** Commas separate multiple ingredients in Slop Bowl quick-add.
- **Temporary additions stay temporary.** Splitting `buns, mayo` should create two Added badges and should not write either item to the saved pantry.
- **Duplicate handling stays case-insensitive.** If `mayo` already exists, submitting `buns, mayo` should add only `buns` and surface a clear duplicate/no-op state if nothing new remains.

## Open questions

- Should the parser be extracted into a shared utility used by onboarding, settings, and Slop Bowl, or should Slop Bowl initially match the current split/trim/filter behavior locally?
- Should duplicate partial submissions show a message like `Added buns; skipped mayo because it is already in this bowl`, or is silently skipping duplicates acceptable?
- Should semicolons or newlines eventually count as separators too, or should v1 stay comma-only for consistency with current pantry copy?

## Agent checklist — when to read this epic

Read EPIC-009 before starting any of the following:

- [ ] Modifying Slop Bowl pantry-check quick-add behavior in `client/src/components/cooking/slop-bowl.tsx`
- [ ] Changing manual pantry input parsing in `client/src/components/cooking/user-settings.tsx` or `client/src/components/cooking/user-profiling.tsx`
- [ ] Adding shared ingredient-entry parsing utilities
- [ ] Changing sparse-pantry readiness counting from EPIC-008

When this applies, also cite EPIC-003 because the quick-add surface came from that resolved epic, and cite EPIC-005 if the work defines or changes acceptance criteria.

## Resolution criteria — what "done" looks like

This epic is `Resolved` when all of the following are true:

1. Typing `buns, mayo` into Slop Bowl quick-add creates separate `buns` and `mayo` temporary badges.
2. Typing a single ingredient still creates one temporary badge.
3. Empty comma segments are ignored.
4. Existing case-insensitive duplicate prevention still works for profile and temporary ingredients.
5. The distinct-ingredient count from EPIC-008 treats split ingredients separately.
6. Local validation and a handoff record the behavior checked.

## Linked artifacts

- `client/src/components/cooking/slop-bowl.tsx`
- `client/src/components/cooking/user-settings.tsx`
- `client/src/components/cooking/user-profiling.tsx`
- `product-decisions/features/mobile-refresh/phase-02-setup.md`
- `product-decisions/features/mobile-refresh/phase-03-planning.md`
- `product-decisions/features/mobile-refresh/phase-05-post-cook.md`
- `epics/003-slop-bowl-pantry-quick-actions.md`
- `epics/008-slop-bowl-sparse-pantry-guard.md`
- `epics/005-testing-strategy-and-acceptance-criteria.md`

## 2026-04-28 — Mobile refresh broadens scope beyond Slop Bowl

Wilson approved comma-separated manual entry for Phase 2 setup and Phase 3 Slop Bowl, with the implementation preference to extract shared parsing rather than duplicating split/trim/filter logic. Phase 5 cleanup should reuse the same parser for any quick-add surface. This broadens the epic from a Slop Bowl-only fix into a shared ingredient-entry consistency rule.

## 2026-04-29 — Shared parser added in Phase 2 branch

The Phase 2 setup branch (`codex/mobile-refresh-phase-2-setup`) adds `client/src/lib/entryParsing.ts` and uses it for setup pantry entry, settings pantry/equipment entry, and Slop Bowl quick-add. `buns, mayo` now parses as separate entries and duplicate prevention is case-insensitive through the shared normalization helper. Remaining validation before closing this epic: browser-level check of the Slop Bowl quick-add surface and any future Phase 5 cleanup quick-add reuse.

## 2026-04-30 — Phase 2.1 accepts periods as typo recovery

Wilson's Phase 2.1 setup validation found that `ground beef. mayo. rice` was treated as one pantry item. The shared parser now keeps comma behavior, handles missing spaces after commas, and also treats periods as comma-like separators for manual-entry typo recovery. Other punctuation/operators remain non-separators so the behavior does not broaden into arbitrary parsing. Phase 2.1 setup also shows a visible Pantry note telling users to separate items with commas.
