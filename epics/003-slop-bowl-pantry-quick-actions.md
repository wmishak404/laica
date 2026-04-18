# EPIC-003 — Slop Bowl pantry-check quick actions (inline remove / add)

**Status:** Resolved
**Owner:** Wilson (product direction) / Claude (next implementation pass)
**Created:** 2026-04-16
**Updated:** 2026-04-17

## One-line summary

On the Slop Bowl **pantry-check** screen, let users quickly remove an ingredient (X on the tag) and quickly add an ingredient (manual input bar below the tags) without leaving the flow. The full Pantry menu in profile settings stays as the place for camera features, bulk edits, and the canonical pantry.

## Context — why this exists

Captured from Wilson during Slop Bowl implementation on 2026-04-16:

> After selecting slop bowl, make an X beside the ingredient tag to quickly let the user remove the pantry ingredient. Also maybe if they can quickly add ingredients on a bar manually below. Then... if they need to use camera features or redo the pantry again, go to the full Pantry menu.

### Current implementation (evidence)

In `client/src/components/cooking/slop-bowl.tsx`:

- **`renderPantryCheck`** at lines 158–215 — currently renders each pantry ingredient as a read-only `Badge`:
  ```tsx
  <Badge
    key={`${item}-${index}`}
    variant="secondary"
    className="bg-gray-100 text-gray-700 px-3 py-1.5 text-sm"
  >
    {item}
  </Badge>
  ```
  No remove affordance, no add affordance. The only way to change the list is the "Edit pantry in profile" button (line 196) which navigates away to the full Pantry menu.

- **`confirmPantry` → `generateBowl(userProfile.pantryIngredients)`** at line 96 — passes the full profile pantry to the generation call. No override path.

- **`generateBowl`** at line 99 — already accepts `pantryOverride?: string[]`:
  ```tsx
  const generateBowl = useCallback(async (pantryOverride?: string[], feedback?: string, prevRecipe?: string) => {
    ...
    pantryOverride,
    ...
  ```
  This maps to the server's `POST /api/recipes/slop-bowl` body shape documented in `product-decisions/features/slop-bowl/phase-03-simplified-bowl.md:58` (`pantryOverride?: string[]`) and in Codex's API contract. **The override path is already fully wired end-to-end** — it's just never populated today.

### Why this matters

The "edit pantry in profile" button is heavyweight: it navigates the user out of the Slop Bowl flow, loads the full Pantry page, and requires them to navigate back. For the common case of "oh, I actually ate the last of the chicken yesterday" or "forgot to add eggs," that's too much friction for a zero-decision cooking path.

The server contract and client generation function already accept a one-shot override. This epic is just about surfacing UI affordances that write into that override without mutating the canonical pantry.

## Scope

### In scope

- **Inline remove (X on each tag)** — tapping the X removes the ingredient from an *ephemeral* list used for this generation only, not the user's permanent pantry
- **Inline add (manual input bar below the tags)** — a small text input + "Add" button that appends to the ephemeral list
- **Visual distinction** between the canonical pantry items and user-added items (e.g. a subtle border or icon) so the user can tell what came from their profile vs what they just added
- **"Edit pantry in profile" button stays** — reserved for camera scan, bulk edit, and cases where the user wants the change to persist
- **Ephemeral vs permanent write path** — see Open Question #1; default proposal is **ephemeral only for Slop Bowl**, with a "Save to pantry" secondary action if Wilson wants it

### Out of scope

- Changing the camera / scan flow in the full Pantry menu
- Adding a "recently removed" / undo stack — keep the UX simple; user can re-add manually or reload if they change their mind
- Auto-suggesting common ingredients in the add bar — pure free-text input in v1, autocomplete is a follow-up
- Touching the server — the `pantryOverride` API already supports this. No server-side changes required.

## Decisions made so far

- **Default write path is ephemeral** — remove/add on the Slop Bowl pantry-check screen mutates local state only, not the user's canonical `userProfile.pantryIngredients`. Rationale: Slop Bowl is the "zero-decision" path; users may want to exclude a single ingredient for one meal without permanently deleting it from their pantry. (Wilson, 2026-04-16 — pending confirmation.)
- **"Edit pantry in profile" remains the escape hatch** for camera features, bulk edits, and permanent changes — Wilson, 2026-04-16

## Open questions

### 1. Ephemeral vs permanent write

Three viable models:

| Model | Behavior | Pros | Cons |
|---|---|---|---|
| **Ephemeral** (default proposal) | X and Add mutate local state; Slop Bowl passes the modified list as `pantryOverride`; permanent pantry unchanged | Matches Slop Bowl's "one meal, no commitment" feel. Already supported by API. | User has to re-remove/re-add the same ingredient next time they open Slop Bowl |
| **Permanent** | X and Add mutate `userProfile.pantryIngredients` immediately via `useUpdateUserProfile()` | Changes persist. Single source of truth. | Destructive — no way to exclude an ingredient "just for this meal" without losing it |
| **Hybrid** | Ephemeral by default; a small "Save changes to pantry" link appears after the first edit that writes to `userProfile.pantryIngredients` | Best UX but highest complexity | More surface to test and explain |

Claude's lean: **Ephemeral** for v1 because the API is already there and it matches the feature's no-commitment tone. Revisit Hybrid if users ask for persistence.

**Decision needed:** Wilson confirms the write model before implementation starts.

### 2. Does this partially revise Phase-04 Decision #7?

The Slop Bowl phase-04 implementation-polish doc (`product-decisions/features/slop-bowl/phase-04-implementation-polish.md`) records a decision to keep the pantry-check screen read-only, with a single "Edit pantry in profile" escape hatch. That decision was made in the context of shipping Phase 3 cleanly and avoiding scope creep.

This epic **revises** that decision for the remove/add case specifically: inline edits are now in scope, but with the ephemeral-only semantics above so we don't reopen the question of whether Slop Bowl should also write to the permanent pantry. The "Edit pantry in profile" button stays for camera / bulk / permanent operations.

When implementation lands, update phase-04 with a `## YYYY-MM-DD — Revised by EPIC-003` section pointing here.

### 3. Visual affordance for the X

- Heroicons-style X inside the badge? (consistent with other close affordances)
- Separate icon button to the right of the badge text? (more tap target, less compact)
- Swipe-to-remove? (matches the Pantry screen's swipe pattern per `design_guidelines.md`)

Claude's lean: **inline X inside the badge** for v1 — simplest, most discoverable, fits Slop Bowl's compact layout. Swipe-to-remove on a small horizontal badge is hard to hit.

### 4. Add-bar behavior

- Single ingredient per submit? Or allow comma-separated bulk add?
- Validation — reject duplicates? Lowercase normalization? Trim whitespace?
- Placeholder text — "Add an ingredient" or "e.g. eggs, onions"?

Default proposal: single ingredient per submit, trim whitespace, case-insensitive dedupe against the current list, placeholder `Add an ingredient`. Keep it minimal; expand only if Wilson wants bulk.

## Agent checklist — when to read this epic

Read EPIC-003 before starting any of the following:

- [ ] Modifying `client/src/components/cooking/slop-bowl.tsx` — specifically the `renderPantryCheck` function or anything that touches the ingredient Badge rendering
- [ ] Changing the `generateBowl` signature or the `pantryOverride` pass-through
- [ ] Adding or changing any UI that mutates `userProfile.pantryIngredients`
- [ ] Introducing a new way to edit the pantry outside the full Pantry menu
- [ ] Changing the `POST /api/recipes/slop-bowl` request body contract (would affect `pantryOverride`)

When one of these applies, cite EPIC-003 in your handoff and note how the change interacts. If the UI work introduces new styling patterns, also check EPIC-001 for the rubric.

## Resolution criteria — what "done" looks like

This epic is `Resolved` when all of the following are true:

1. The Slop Bowl `renderPantryCheck` screen renders each ingredient with a remove affordance (X or equivalent)
2. An add affordance (input + submit) appears below the tag list
3. Remove and Add operations mutate ephemeral local state, not `userProfile.pantryIngredients` (unless Open Question #1 resolves differently)
4. `confirmPantry` passes the modified list as `pantryOverride` to `generateBowl`
5. "Edit pantry in profile" button remains for heavy / permanent operations
6. Phase-04 doc is updated with a revision note pointing to this epic's resolution
7. This epic file has a final `## YYYY-MM-DD — Resolved` section with a pointer to the product decision or phase update

## Linked artifacts

- `client/src/components/cooking/slop-bowl.tsx` — `renderPantryCheck` at lines 158–215; `generateBowl` at line 99 with existing `pantryOverride` param
- `client/src/lib/openai.ts:169` — `fetchSlopBowlRecipe` request type already includes `pantryOverride?: string[]`
- `product-decisions/features/slop-bowl/phase-03-simplified-bowl.md:58` — API contract documenting `pantryOverride?: string[]`
- `product-decisions/features/slop-bowl/phase-04-implementation-polish.md` — the read-only-pantry decision that this epic partially revises
- `docs/handoffs/2026-04-10-claude-slop-bowl-ui-ready.md` — confirms client-server contract alignment (no server changes needed)
- `docs/handoffs/2026-04-17-codex-epic-002-003-flow-fixes.md` — implementation handoff for the resolved quick-actions work

## Chronology — how we got here

### 2026-04-16 — Epic created

During the same post-implementation walkthrough that surfaced EPIC-002, Wilson asked for inline quick-actions on the Slop Bowl pantry-check screen. The feature works today (read-only tags + "edit in profile" escape hatch) but the friction of navigating away for a single-ingredient tweak is high enough to flag as a backlog item.

Claude verified while drafting this epic that the server + client already accept `pantryOverride` end-to-end — so implementation is purely a client-side UI addition, no server coordination needed. That's what makes this a tight, self-contained epic rather than a feature requiring Codex involvement.

## 2026-04-17 — Resolved

Codex implemented the pantry-check quick actions in `client/src/components/cooking/slop-bowl.tsx`:

- Ingredient badges now include an inline remove affordance
- A manual add bar now sits below the pantry list with duplicate prevention and per-bowl helper copy
- Quick edits are stored in ephemeral local state only, then passed through `pantryOverride` when generating or regenerating a bowl
- The existing **Edit pantry in profile** button remains for camera features, bulk edits, and permanent pantry changes

Phase 4's accepted Slop Bowl decision record was revised with a `2026-04-17 — Revised by EPIC-003` note in `product-decisions/features/slop-bowl/phase-04-implementation-polish.md`, which now serves as the durable pointer for this resolution.

## Next steps when work resumes

Resolved on 2026-04-17. Future pantry-edit enhancements, if any, should spin out as a new epic or a later Slop Bowl phase note rather than reopening this one.
