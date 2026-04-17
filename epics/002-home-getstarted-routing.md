# EPIC-002 — Home / Get Started routing & Home-Cook nav consolidation

**Status:** Open
**Owner:** Wilson (product direction) / Claude (next implementation pass)
**Created:** 2026-04-16
**Updated:** 2026-04-16

## One-line summary

Home → "Get Started" currently re-runs the full first-time-user profile builder even when the user already has a complete profile. Desired behavior: if the profile exists, "Get Started" should land directly on the Planning screen (Slop Bowl vs Chef it up!). Cook nav already routes to Planning, so consider consolidating Home and Cook into a single surface.

## Context — why this exists

Captured from Wilson during Slop Bowl implementation on 2026-04-16:

> When we press Home > Get Started, it restarts the whole profile builder again, where a user already clearly has setup the Kitchen and Pantry. If the user has already set the kitchen and pantry before, it shouldn't go to the first time user experience again but rather go to the pantry. Desired behavior: when clicking Get Started, it should go straight to Planning i.e. in this case its Slop Bowl vs. Chef it Up menu selection. I also noticed Cook goes to this Plan mode directly, so maybe we should think about consolidating Home and Cook somewhere.

### Current implementation (evidence)

In `client/src/pages/app.tsx`:

- **`currentPhase` state** at line 69 — workflow phases: `welcome` / `profiling` / `planning` / `slop-bowl` / `cooking` / `settings` etc.
- **`showPlanningChoice` state** at line 83 — toggles the two-card Slop Bowl vs Chef it up! screen inside the `planning` phase
- **"Get Started" button** at lines 474–479 on the welcome screen:
  ```tsx
  <Button
    onClick={() => setCurrentPhase('profiling')}
    className="w-full bg-[#FF6B6B] hover:bg-[#FF5252] text-white py-3 text-lg"
  >
    Get Started
  </Button>
  ```
  This always routes to `profiling` — no branching on whether the profile is already complete.
- **`hasExistingProfile()` helper** at lines 487–491 already exists and is the right predicate:
  ```tsx
  const hasExistingProfile = () => {
    return userProfile.cookingSkill &&
           userProfile.weeklyTime &&
           userProfile.pantryIngredients.length > 0;
  };
  ```
  It's defined but not used on the Get Started path.
- **Bottom nav at line 437** — Cook tab already highlights when `currentPhase === 'planning' || currentPhase === 'slop-bowl'`, meaning Cook's click handler routes straight to the planning-choice screen. Home's nav highlights on `welcome`.

So two different surfaces (Home "Get Started" and bottom-nav Cook) are solving overlapping intents, and only one of them respects existing profile state.

## Scope

### In scope

- Branch the "Get Started" click handler on `hasExistingProfile()`:
  - If profile is complete → `setCurrentPhase('planning')` + `setShowPlanningChoice(true)`
  - If profile is incomplete → keep current behavior (`setCurrentPhase('profiling')`)
- Consider whether the welcome screen itself should auto-skip for returning users (i.e. land directly on Planning after sign-in rather than show the "Welcome to Laica / Get Started" card at all)
- Evaluate Home vs Cook nav consolidation:
  - Option A: Keep both, but make Home a real dashboard (saved recipes, continue cooking, recommendations per `design_guidelines.md`) — Cook stays as the Planning entry
  - Option B: Merge Home + Cook into one tab. Bottom nav becomes 3-tab instead of 4-tab
  - Option C: Keep Home as the post-signin landing screen but make its primary CTA identical to Cook (both go to Planning) — acceptable short-term but defers the IA question
- Document the decision as either a product-decisions entry or a PD graduation from this epic

### Out of scope

- Redesigning the welcome / first-time experience itself — that's a separate tone/onboarding workstream
- Profile edit flow — "Settings" already covers that, not part of this epic
- Bottom-nav visual redesign — this epic is about IA (information architecture), not styling. If the nav count changes from 4 → 3, the token-level styling change rides on EPIC-001's rubric

## Decisions made so far

- **"Get Started" should not re-run profile builder for users with a complete profile** — Wilson, 2026-04-16
- **Cook nav's existing behavior (→ Planning choice) is the desired target state for returning users** — Wilson, 2026-04-16
- **Home/Cook consolidation is worth considering but not mandated** — Wilson flagged it as an IA question, not a must-do

## Open questions

### 1. How strictly to detect "profile complete"?

`hasExistingProfile()` checks `cookingSkill && weeklyTime && pantryIngredients.length > 0`. Is that the right bar? Consider:

- `kitchenEquipment` is also part of the profile but not in the predicate
- `favoriteChefs` is optional and not checked
- Users who sign in with a partially-filled profile (e.g. skipped pantry) should still be able to get to Slop Bowl — Slop Bowl's `pantry-check` state handles empty pantry gracefully

Default proposal: expand the predicate to also accept "any pantry ingredients OR any kitchen equipment" so partial profiles still skip the FTUE but push the user to fill the gap inside Slop Bowl (see EPIC-003 for inline pantry edit).

### 2. Home as dashboard vs Home as redirect

Should Home be:
- **(a) A dashboard** matching the spec in `design_guidelines.md` (featured recipe, continue cooking, recommendations, categories)
- **(b) A lightweight landing that just redirects returning users to Planning** — effectively making Home a sign-in thank-you screen
- **(c) Dropped entirely in favor of Cook** — nav goes from 4 → 3 tabs (Cook / Pantry / Profile)

(a) is the most work but matches the original design intent. (b) is the cheapest fix. (c) is the most opinionated IA move.

**Decision needed:** Wilson to pick direction before implementation.

### 3. Nav consolidation — if yes, how?

If Home and Cook merge:
- Which label wins? "Cook" is more action-oriented; "Home" is more conventional
- Which icon wins? Home icon is more universal; ChefHat matches the product
- Does "Plan a meal" remain as a sub-label, or is it implicit?

Claude's lean: **Cook + ChefHat** if they merge, but Wilson's call.

## Agent checklist — when to read this epic

Read EPIC-002 before starting any of the following:

- [ ] Adding or changing navigation entry points in `client/src/pages/app.tsx` (welcome screen, bottom nav, routing logic)
- [ ] Modifying the `currentPhase` state machine or the phases (`welcome` / `profiling` / `planning` / etc.)
- [ ] Changing `hasExistingProfile()` or any profile-complete predicate
- [ ] Designing a new post-sign-in landing surface
- [ ] Adding a new bottom-nav tab, renaming one, or changing the count
- [ ] Writing a handoff that describes a new "Get Started" / FTUE / returning-user flow

When one of these applies, cite EPIC-002 in your handoff and note how the change interacts (conforms / defers / adds new signal). If you add new routing paths that intersect with the questions above, document them here under a `## YYYY-MM-DD — <summary>` section.

## Resolution criteria — what "done" looks like

This epic is `Resolved` when all of the following are true:

1. "Get Started" on the welcome screen respects `hasExistingProfile()` — returning users land on Planning, not the profile builder
2. A product decision exists for the Home-vs-Cook question (consolidate / keep both with clear separation / other)
3. The bottom nav reflects the accepted IA — if consolidated, the active-state logic and icon are updated consistently
4. `design_guidelines.md`'s "Home Dashboard" section is reconciled to match the accepted direction (either kept as the aspirational target, updated to reflect consolidation, or marked deferred)
5. This epic file has a final `## YYYY-MM-DD — Resolved` section with a pointer to the product decision

## Linked artifacts

- `client/src/pages/app.tsx` — welcome screen, `currentPhase` state machine, bottom nav (Home + Cook tabs)
- `product-decisions/features/slop-bowl/phase-04-implementation-polish.md` — planning-choice screen decisions (the target of the corrected routing)
- `design_guidelines.md` — "Home Dashboard" section (currently aspirational, not implemented)

## Chronology — how we got here

### 2026-04-16 — Epic created

During Slop Bowl implementation, Wilson navigated the app end-to-end and noticed two independent issues in the same message:

1. Home "Get Started" re-runs the profile builder even when the profile is complete
2. Cook nav already goes to Planning directly, which overlaps with Home's role

Wilson asked both items be parked as a backlog epic rather than fixed inline during Slop Bowl. This doc is that record. Implementation is deferred to a future window after Slop Bowl ships.

## Next steps when work resumes

1. Wilson picks a direction on Open Question #2 (Home dashboard / Home redirect / drop Home)
2. Implement the `hasExistingProfile()` branch on the welcome screen's "Get Started" button — lowest-risk fix, can ship standalone
3. If consolidation is chosen, draft the nav change in a separate PR and run it through EPIC-001's rubric (since it touches the bottom-nav primitive)
4. Graduate this epic to a product decision once the IA question is settled
