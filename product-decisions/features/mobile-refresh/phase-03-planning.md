# Mobile Refresh Phase 3 — Planning: Chef It Up, Slop Bowl, and Ticket Pass

**Status:** Accepted
**Document kind:** Feature Phase Record
**Phase owner:** Wilson
**Date:** 2026-04-28
**Initiative:** [INIT-001 — Mobile Refresh](../../../initiatives/INIT-001-mobile-refresh.md)
**Mockups:** [phase-03-planning-flow.png](../../../docs/assets/mobile-refresh/phase-03-planning-flow.png), [phase-03-ticket-pass.png](../../../docs/assets/mobile-refresh/phase-03-ticket-pass.png)

## Goal

Make meal planning feel distinctive to LAICA, reduce decision work, and stop presenting recipe suggestions like generic AI match cards.

## 2026-04-29 Visual Scope Note

The current two-card Planning screen is pre-refresh UI and should not be treated as acceptable Phase 3 completion if it remains visually unchanged. Phase 3 owns the Planning entry redesign unless that work is explicitly pulled forward into Phase 2 or a Phase 2.x polish pass.

Implementation should match the planning mockups closely enough that the first post-setup cooking choice feels like the mobile-refresh experience, not the legacy planning choice with updated copy. If the team splits Phase 3 into behavioral and visual slices, that split must be documented before validation so reviewers do not mark deterministic behavior as full phase completion.

## Decisions

### Planning entry

- Chef It Up is the primary planning path.
- Slop Bowl is secondary and lower on the page.
- Slop Bowl keeps its joke/slang identity: a random, authentically scrappy meal when the user wants the app to remove the decision.
- Chef It Up tagline: "We'll shape dinner from what you have."

### Chef It Up flow

- Remove the "Anything to avoid or specify?" step.
- Time selection uses a thumb-zone slider with four stops: `30m`, `1hr`, `1.5hrs`, `Got all the time`.
- Time is a per-planning-session choice and also updates the user's last planning time setting.
- Cuisine uses illustrated chips inspired by food delivery category chips.
- Multiple cuisines can be selected.
- `No preference` is an exclusive anchor option in the lower thumb zone.

### Slop Bowl flow

- Keep the 3+ distinct ingredient requirement.
- Hero line should feel like a quick confirmation, e.g. "One more check to confirm these are around."
- Quick-add accepts comma-separated ingredients.
- "Edit my pantry" routes to the main pantry configuration surface.
- Slop Bowl time bound uses the user's last planning time setting; fallback is 30 minutes.

### Recipe suggestions

- Show exactly three suggestions.
- Use the Ticket Pass visual model.
- Do not show `X% match`.
- Do not show mandatory "You'll need to grab" language.
- Do not show substitution explanations such as "hot sauce covers the sriracha lane."
- The prompt may use substitutions internally to create better pantry-first recipes.
- Suggestions should use pantry ingredients first and include optional enhancements only when useful.
- Existing internal fields like `pantryMatch`, `missingIngredients`, and `additionalIngredientsNeeded` may remain for compatibility/eval, but the new UI must not expose them as generic match or grocery-list affordances.

### Prep Tray

- The selected ticket opens into a prep-tray detail view.
- Detail view shows what LAICA will use, optional ingredients if around, and the primary Cook action.
- Generated recipe imagery is deferred as a separate future feature.

## Acceptance Criteria

- Planning entry visually prioritizes Chef It Up and places Slop Bowl as the scrappy secondary path.
- Legacy Planning cards are redesigned toward the linked Planning mockup; unchanged pre-refresh cards are not Phase 3-ready.
- Chef It Up tagline uses the approved collaborative wording.
- Avoid/specify step is gone.
- Time slider has exactly the four approved positions and sits in an easy thumb zone.
- Cuisine chips support multi-select; `No preference` is exclusive.
- Recipe suggestions render as Ticket Pass tickets only.
- Exactly three suggestions are visible/available.
- No percentage match or mandatory grocery-list copy appears.
- Substitution logic influences recommendations under the covers without user-facing explanation text.
- Slop Bowl still blocks fewer than 3 distinct ingredients.
- Slop Bowl comma input `"rice, eggs, soy sauce"` creates three ingredient entries.
- Cost-bearing planning routes require auth and are rate-limited.

## Epic Interactions

- PD-005 / `design_guidelines.md`: Ticket Pass establishes the distinctive mobile-refresh recipe-suggestion pattern.
- EPIC-004: Cuisine chips and Slop Bowl confirmation controls must have mobile-appropriate tap targets.
- EPIC-009: Slop Bowl quick-add uses the shared comma parser.
- EPIC-010: Last planning time setting must follow the repo's DB-change policy if persisted server-side.

## Backend Notes

- Remove `weeklyTime` from Slop Bowl inputs, readiness gates, and prompts.
- Do not drop the `weekly_time` DB column in this implementation cycle; leave it nullable/ignored until a later cleanup.
- Prompt inputs should include the current planning time bound when available.

## 2026-05-05 Implementation Pass

**Branch:** `codex/mobile-refresh-phase-3-planning`
**Base:** `origin/main` at `b4c1747bd20b5be469d11b66f74c79a83fbc8887`
**Last Replit-validated at:** not yet validated

Implemented locally:

- Planning entry now prioritizes Chef It Up as the primary route and places Slop Bowl below it as the scrappy secondary route.
- Chef It Up removes the avoid/specify step and uses the approved four-stop planning time control: `30m`, `1hr`, `1.5hrs`, and `Got all the time`.
- Last planning time is stored as a client-side planning preference for this phase, then passed into Slop Bowl generation. This avoids repurposing the legacy `weekly_time` column or adding a schema change before [EPIC-010](../../../epics/010-local-db-schema-strategy.md) resolves the DB workflow.
- Cuisine selection uses full-row illustrated multi-select chips. `No preference` is exclusive.
- Suggestions now render as exactly three Ticket Pass tickets, with no visible percentage match and no mandatory grocery-list copy. Internal `pantryMatch`, `missingIngredients`, and `additionalIngredientsNeeded` fields remain available for compatibility/history/cooking-session paths.
- Selected tickets open a Prep Tray showing ingredients Laica will use, optional enhancements if around, and the primary Cook action.
- Slop Bowl confirmation now uses the approved "one more check" framing, keeps 3+ distinct ingredient gating, keeps shared comma/period parser behavior, and uses the user's last planning time setting with fallback `30m`.
- Slop Bowl direct hex-literal callsites touched by this phase were migrated to token/CSS-variable styling with tone-forward comments, adding implementation signal for [EPIC-016](../../../epics/016-slop-bowl-hex-literal-cleanup.md).

2026-05-05 logo drift follow-up:

- Wilson's Replit screenshot review found that Phase 3 had recreated `Laica` as a CSS text wordmark with a pseudo-mark, while other branded surfaces use the canonical cropped logo asset.
- Planning entry and Ticket Pass now use `@assets/laica_logo_v1_cropped_1763444931884.png`.
- [`design_guidelines.md`](../../../design_guidelines.md) now explicitly requires the canonical logo asset when a surface displays the product mark as a brand object. This closes the docs-system gap that allowed the drift: previous guidance covered casing (`Laica` vs `LAICA`) and mockup conformance, but not product-mark asset reuse.

2026-05-05 time-slider geometry follow-up:

- Wilson's Replit screenshot review found the slider thumb did not land exactly over `30m`, `1hr`, `1.5hrs`, or `Got all the time`.
- Root cause: the Radix slider stops were distributed across the full track (`0%`, `33%`, `67%`, `100%`), while the four labels were visually centered in equal columns (`12.5%`, `37.5%`, `62.5%`, `87.5%`).
- The slider track now uses `12.5%` inline padding and a no-gap four-column label grid so the thumb stop positions align with the label centers.

2026-05-05 cuisine-list/default follow-up:

- Wilson's Replit screenshot review found that the cuisine picker appeared capped at the six visible mockup examples.
- Root cause: implementation overfit the mockup's visible slice instead of treating it as a longer cuisine menu.
- The cuisine menu now restores a broader starter cuisine set and scrolls when options exceed one screen.
- `No preference` is selected by default, remains exclusive, and sits outside the scroll list in the lower thumb zone next to the primary action. Selecting any cuisine clears the default; clearing all cuisines restores it.

Local validation:

- `npm ci`
- `npm run check`
- `npm run build`
- `npx vitest run tests/unit/planning-time.test.ts tests/unit/slop-bowl-route.test.ts`
- `git diff --check`
- Dotenvx dev-server boot smoke returned HTTP 200 on port 3000.

Known validation gap:

- Authenticated Replit validation is still required for recipe generation, Ticket Pass selection, Prep Tray -> Cooking, Slop Bowl generation, Slop Bowl quick-add/remove, Slop Bowl -> Edit pantry, and visual comparison against the Phase 3 mockups.
- Full `npx vitest run` is not a merge signal yet because existing repo-wide harness issues remain: the Playwright E2E file is collected by Vitest, and voice-recording tests expect `MediaStream` in the unit-test environment.
