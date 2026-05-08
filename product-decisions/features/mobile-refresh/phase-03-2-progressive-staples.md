# Mobile Refresh Phase 3.2 - Progressive Pantry Staple Check

**Status:** Implemented locally / Replit validation pending
**Document kind:** Feature Phase Record
**Phase owner:** Wilson
**Date:** 2026-05-08
**Initiative:** [INIT-001 - Mobile Refresh](../../../initiatives/INIT-001-mobile-refresh.md)
**Builds on:** [Phase 3 Planning](phase-03-planning.md), PR #45 (`codex/phase-3-generation-cancel`)

## Goal

Make the Chef It Up staple-check step feel progressive instead of capped: users can keep confirming likely missing cuisine staples from a rolling ranked queue, see their choices in an Added shelf, undo before submit, and still save pantry facts only when they request recipe suggestions.

## Filing Decision

Phase 3.2 is a focused behavior/interaction polish slice under INIT-001 Mobile Refresh.

- Not Phase 3: Phase 3 closed functional correctness around recipe-generation lock/cancel first.
- Not Phase 3.1: Phase 3.1 owns the visual facelift and recipe imagery, while this is staple-check behavior.
- Not a new epic: the pattern is Chef It Up-specific and shippable in one focused PR. Create a new epic only if this becomes a reusable progressive-selection pattern across setup, settings, pantry management, or other multi-select flows.

## Sequencing Decision

Phase 3.2 is okay to implement before Phase 3.1. The dependency is PR #45's generation lock/cancel behavior, not the Phase 3.1 facelift. If Phase 3.2 lands first, Phase 3.1 must preserve or intentionally restyle the Added shelf / rolling queue as the current Chef It Up behavior.

## Scope

- Extend the shared staple-ranking helper to expose the full ranked missing-staple list.
- Preserve the existing capped `getStapleCandidatesForCuisines(...)` helper for compatibility.
- In Chef It Up, render up to four unselected staple rows from the full queue.
- Move selected staples into an Added shelf above the queue.
- Let pending Added chips act as undo controls before submit, with a pending-add `+` icon and visible right-side `X` affordance so the removal action is obvious without implying the item is already saved.
- Track seen staple candidates separately from selected staples so only displayed-but-unselected staples are sent as explicit "do not assume" context.
- Save confirmed pantry staples only when `View recipe suggestions` is tapped.
- After the pantry write succeeds, show saved Added chips as inert green-check pantry facts rather than removable pending additions; do not spell out `Saved` inside each chip.
- If the user taps a saved pantry-fact chip, keep it non-destructive and reveal a brief inline note directing removal to Pantry Settings.
- Skip repeat pantry-save calls for selected staples that are already present in the current pantry.
- Preserve submit-time freeze, disabled cuisine/staple inputs, Back abort, and stale-response guard from PR #45.
- Add lightweight CSS row/chip entry animations with a `prefers-reduced-motion` fallback.

Out of scope:

- Server route changes.
- Payload or environment-variable changes.
- Immediate pantry writes on chip tap.
- Showing the user's full pantry list inside this Chef It Up staple-check step.
- A reusable app-wide progressive-selection primitive.
- Phase 3.1 visual facelift or recipe imagery.

## Accepted Mockup Direction

The interaction model is:

```text
Added
[+ butter x] [+ Dijon mustard x]

After submit/pantry-save success:
[checked butter] [checked Dijon mustard]

+ ketchup
+ hot sauce
+ mayonnaise
+ Worcestershire sauce

[View recipe suggestions]
```

Implementation guardrails:

- Added shelf appears above the four suggestion rows.
- Added chips remain tappable undo controls until submit starts.
- Pending Added chips use a `+` icon plus a right-side `X`; the whole chip remains the hit target with `aria-label="Remove <item> from Added"`.
- Saved pantry-fact chips use the green checkmark as the only visible saved-state signal and do not include a visible `Saved` text label.
- Tapping a saved pantry-fact chip does not delete anything; it conditionally reveals `Saved to pantry. Remove it in Pantry Settings.`
- When no more suggestions remain, the row list simply shrinks.
- No done note appears and there is no auto-submit.
- The selected Added shelf and visible rows freeze during `Finding recipes...`.
- Back remains available during loading and cancels the in-flight generation request.
- Helper copy should communicate submit timing: `Tap what you have. We'll save additions when you view suggestions.`
- Successful pantry saves are confirmed inline as soon as the DB save succeeds, which is during the `Finding recipes...` state before recipe suggestions are shown.
- Save failures show a destructive toast: the app still uses those staples for the current recipe request, but tells the user they were not saved and can be added later in Settings.

## Behavior Contract

1. Chef It Up derives a full ranked missing-staple queue from selected cuisines and the current pantry.
2. The visible queue shows the first four unselected staples.
3. Tapping a visible staple moves it to Added and reveals the next ranked eligible staple, if one exists.
4. Tapping an Added chip removes it from Added and returns it to the ranked queue if it is still eligible.
5. `selectedStaples` may contain more than four values and restored local planning state must not cap it.
6. `seenStapleCandidates` records rows the user actually saw, including rows revealed after earlier selections.
7. Recipe generation receives all selected staples as confirmed pantry facts.
8. Recipe generation receives only seen-but-unselected staples as explicitly unconfirmed.
9. Pantry persistence happens only on `View recipe suggestions`.
10. Selected staples remain pantry facts once submitted, even if Back cancels the recipe-generation request afterward.
11. Back before `View recipe suggestions` discards pending Added staples without saving them.
12. Once a selected staple is present in the pantry, it renders as a green-check chip without an `X` or visible `Saved` label; it is no longer presented as something being added again.
13. Re-submitting from the staple step should not call pantry persistence for already-saved selected staples, even though those staples may remain in the confirmed recipe context.
14. If pantry persistence fails, recipe generation can continue with the selected staples for the current request and the user receives an explicit save-failure toast.
15. Tapping an already-saved chip does not remove it; it shows a brief inline direction to remove saved pantry facts in Pantry Settings.

## Epic Interactions

- [EPIC-004](../../../epics/004-selection-controls-tap-targets.md): conforms. The rolling queue keeps full-row multi-select buttons, and Added chips use full chip targets for undo instead of tiny checkboxes.
- [EPIC-005](../../../epics/005-testing-strategy-and-acceptance-criteria.md): conforms. The implementation adds focused helper and component tests, and still requires authenticated Replit validation for the real Chef It Up pantry-save/generation path.

## Validation Criteria

Local checks:

- `npx vitest run tests/unit/meal-planning.test.tsx tests/unit/planning-staples.test.ts`
- `npm run check`
- `npm run build`
- `git diff --check`

Required focused coverage:

- Selecting two visible staples moves them to Added and reveals the next two ranked staples.
- Tapping an Added chip undoes the selection and restores queue order.
- Pending Added chips visibly expose a `+` pending icon and the `X` remove affordance while keeping the full-chip tap target.
- Back before `View recipe suggestions` does not call pantry persistence and returns to the staple queue without pending Added chips.
- Saved Added chips show a green-check-only treatment after the pantry write succeeds and no longer expose the remove action.
- Tapping a saved chip shows the inline Pantry Settings direction without changing pantry state.
- Returning to the staple step and submitting again does not call pantry persistence for staples already in pantry.
- Pantry save failure shows an explicit destructive toast while recipes still use those staples for the current request.
- Submitted recipes include all selected staples and mark only seen unselected staples as unconfirmed.
- Loading freezes the Added shelf and visible queue, disables rows/chips, and Back still cancels.
- Successful generation still shows exactly three recipe suggestions.

Replit/browser validation:

- Authenticated Chef It Up flow with cuisines that produce more than four missing staples.
- Select two visible staples and verify two new options appear.
- Undo one Added chip and verify it returns to the queue.
- Verify the Added chip `X` makes the undo action visually discoverable.
- Verify pending Added chips do not use the same checkmark as saved pantry facts.
- Press Back before submit and verify the pending additions are not saved.
- Let the pantry save complete and verify the shelf changes to green check-only, non-removable chips before or while recipe suggestions load.
- Tap a saved chip and verify the inline Pantry Settings removal direction appears without deleting it.
- Return from Ticket Pass to the staple step and verify saved staples are not presented as newly addable or removable additions.
- Submit again and verify already-saved staples do not create duplicate pantry rows.
- Simulate/observe pantry-save failure if possible and verify the user sees the failure message while recipe generation can continue.
- Submit and verify there is no reshuffle or extra tapping during `Finding recipes...`.
- Press Back during loading and verify there is no late auto-advance.
- Repeat and let suggestions complete; verify Ticket Pass appears normally and confirmed staples remain in pantry.

## Current Status

Implemented on `codex/mobile-refresh-phase-3-2-progressive-staples` from `origin/main` at `7b0e22b1898d7dd91b99d33f90d512b9404afda2` after PR #48 merged the Phase 3.1 Slop It Up scope docs.

Wilson's Replit check of head `968d39a` confirmed the rolling queue, exhaustion behavior, submit-time pantry persistence, and saved staples after returning from recipe suggestions. The follow-up on top of that head keeps the same persistence timing, keeps the Added-only shelf, adds the visible `X` chip affordance, differentiates pending chips (`+` + `X`) from saved pantry facts (green check only), lets taps on saved chips reveal an inline Pantry Settings removal note, marks already-saved selected staples as inert pantry facts, skips repeat save calls for already-saved staples, and records Slop Bowl pantry-check visual alignment as Phase 3.1 scope rather than implementing it here.

Local validation passed:

- `npx vitest run tests/unit/meal-planning.test.tsx tests/unit/planning-staples.test.ts`
- `npm run check`
- `npm run build`
- `git diff --check`

Last Replit-validated at: not yet validated for the updated Phase 3.2 follow-up head.
