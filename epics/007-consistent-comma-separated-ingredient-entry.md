# EPIC-007 — Consistent comma-separated ingredient entry

**Status:** Open
**Owner:** Wilson / Codex / Claude
**Created:** 2026-04-27
**Updated:** 2026-04-27

## One-line summary

Make Slop Bowl quick-add ingredient entry handle comma-separated ingredients the same way the profile/onboarding pantry input does.

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

Read EPIC-007 before starting any of the following:

- [ ] Modifying Slop Bowl pantry-check quick-add behavior in `client/src/components/cooking/slop-bowl.tsx`
- [ ] Changing manual pantry input parsing in `client/src/components/cooking/user-settings.tsx` or `client/src/components/cooking/user-profiling.tsx`
- [ ] Adding shared ingredient-entry parsing utilities
- [ ] Changing sparse-pantry readiness counting from EPIC-006

When this applies, also cite EPIC-003 because the quick-add surface came from that resolved epic, and cite EPIC-005 if the work defines or changes acceptance criteria.

## Resolution criteria — what "done" looks like

This epic is `Resolved` when all of the following are true:

1. Typing `buns, mayo` into Slop Bowl quick-add creates separate `buns` and `mayo` temporary badges.
2. Typing a single ingredient still creates one temporary badge.
3. Empty comma segments are ignored.
4. Existing case-insensitive duplicate prevention still works for profile and temporary ingredients.
5. The distinct-ingredient count from EPIC-006 treats split ingredients separately.
6. Local validation and a handoff record the behavior checked.

## Linked artifacts

- `client/src/components/cooking/slop-bowl.tsx`
- `client/src/components/cooking/user-settings.tsx`
- `client/src/components/cooking/user-profiling.tsx`
- `epics/003-slop-bowl-pantry-quick-actions.md`
- `epics/006-slop-bowl-sparse-pantry-guard.md`
- `epics/005-testing-strategy-and-acceptance-criteria.md`
