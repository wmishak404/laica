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
- Ticket Pass tickets reserve image slots for future generated/illustrated recipe imagery and show designed placeholders in Phase 3.
- Do not show `X% match`.
- Do not show mandatory "You'll need to grab" language.
- Do not show substitution explanations such as "hot sauce covers the sriracha lane."
- The prompt may use substitutions internally to create better pantry-first recipes.
- Suggestions should use pantry ingredients first and include optional enhancements only when useful.
- Existing internal fields like `pantryMatch`, `missingIngredients`, and `additionalIngredientsNeeded` may remain for compatibility/eval, but the new UI must not expose them as generic match or grocery-list affordances.

### Prep Tray

- The selected ticket opens into a prep-tray detail view.
- Detail view shows what LAICA will use, optional ingredients if around, and the primary Cook action.
- Actual recipe imagery is deferred to [Phase 3.1](phase-03-1-recipe-imagery.md); it should not block the recipe-suggestion reveal when introduced later.

## Acceptance Criteria

- Planning entry visually prioritizes Chef It Up and places Slop Bowl as the scrappy secondary path.
- Legacy Planning cards are redesigned toward the linked Planning mockup; unchanged pre-refresh cards are not Phase 3-ready.
- Chef It Up tagline uses the approved collaborative wording.
- Avoid/specify step is gone.
- Time slider has exactly the four approved positions and sits in an easy thumb zone.
- Cuisine chips support multi-select; `No preference` is exclusive.
- Recipe suggestions render as Ticket Pass tickets only.
- Ticket Pass and Prep Tray reserve generated-image slots with polished placeholders, so Phase 3.1 can add imagery without reshaping the UI.
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
- Ticket Pass now uses image-slot placeholders and a featured-ticket/compact-stack structure so suggestions do not read as generic vertical recipe cards and can accept generated imagery in Phase 3.1.
- Selected tickets open a Prep Tray showing ingredients Laica will use, optional enhancements if around, and the primary Cook action.
- Slop Bowl confirmation now uses the approved "one more check" framing, keeps 3+ distinct ingredient gating, keeps shared comma/period parser behavior, and uses the user's last planning time setting with fallback `30m`.
- Slop Bowl direct hex-literal callsites touched by this phase were migrated to token/CSS-variable styling with tone-forward comments, adding implementation signal for [EPIC-016](../../../epics/016-slop-bowl-hex-literal-cleanup.md).

2026-05-05 logo drift follow-up:

- Wilson's Replit screenshot review found that Phase 3 had recreated `Laica` as a CSS text wordmark with a pseudo-mark, while other branded surfaces use the canonical cropped logo asset.
- Initial correction replaced the CSS text wordmark with `@assets/laica_logo_v1_cropped_1763444931884.png`; the later brand-mark restraint follow-up below removes visible logos from Phase 3 process screens.
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

2026-05-05 suggestion-copy follow-up:

- Wilson clarified that the UI should not expose the exact suggestion count as visible copy; that is a generation/validation constraint, not product language.
- Cuisine CTA/loading copy now says `View recipe suggestions` / `Finding recipes...`.
- Ticket Pass copy now says `Recipe suggestions from your pantry`, `Refresh suggestions`, and `Pick` instead of foregrounding "three" or numeric ranks.

2026-05-05 brand-mark restraint follow-up:

- Wilson clarified that Phase 3 should not keep showing the Laica logo inside in-app task flows; most app processes do not need repeated branding once the user is already inside the product.
- Planning entry and Ticket Pass now remove the logo entirely while keeping the canonical logo rule for genuinely branded surfaces.
- [`design_guidelines.md`](../../../design_guidelines.md) now adds the complementary guardrail: ordinary setup, planning, selection, cooking, confirmation, and settings process screens should not repeat the product mark unless explicitly designed as a branded entry/sign-in/landing moment.

2026-05-05 Ticket Pass image-slot/visual-drift follow-up:

- Wilson's Replit screenshot review found that recipe suggestions still looked like generic full-width cards and had no stable place for the agreed future recipe imagery.
- Root cause: the docs said "generated recipe imagery is deferred" but did not require Phase 3 to reserve stable image slots for the later imagery pass. Implementation interpreted the deferral too broadly and shipped generic stacked cards without a real place for generated images to land.
- Ticket Pass and Prep Tray now reserve generated-image slots and render designed placeholders in Phase 3. The recipe object also accepts optional `imageUrl` so Phase 3.1 can hydrate generated/illustrated imagery without reshaping the UI.
- The suggestion layout now uses a featured ticket with compact alternate tickets beneath it, closer to the `phase-03-ticket-pass.png` stack/selected-ticket visual model. Actual recipe imagery is tracked in [Phase 3.1](phase-03-1-recipe-imagery.md) and should be async/cached when introduced.

2026-05-05 bottom-navigation follow-up:

- Wilson's Replit screenshot review found the bottom nav made the chef icon look like a selected Cook status badge during Planning because of the coral active pill.
- Per [PD-009](../../009-mobile-refresh-navigation.md), bottom navigation is now a neutral access surface, not a selected-state tab bar.
- Phase 3 removes the active-state fill from Cook/Menu and increases the icon touch target/visual weight so the menu feels neutral and easier to tap.

2026-05-05 Planning entry handwriting/Slop Bowl art follow-up:

- Wilson's Replit screenshot review found the `MAKE GOOD SLOP` sticker was not centered, the Planning entry lost the handwritten/diary kitchen-note edge from the mockups, and the Slop Bowl art felt too vanilla to carry the joke.
- Planning card titles and the Slop Bowl sticker now use a scoped handwritten `Patrick Hand` label treatment while keeping readable `Fraunces` display headings and `Nunito` body/control copy.
- The Slop Bowl card art now adds a messier ingredient storm, splashes, spoon tilt, and `???` scribble around the bowl. The sticker is mechanically centered with `left: 50%` / translate, not eyeballed from the right edge.
- Styling remains tokenized through planning CSS variables and does not reintroduce Slop Bowl raw hex literals.

2026-05-05 Phase 3.1 drift-scope follow-up:

- Wilson asked that the Phase 3 design-drift review live inside Phase 3.1 rather than a standalone active epic.
- [Phase 3.1](phase-03-1-recipe-imagery.md) now owns the drift inventory, root-cause notes, recommendations, and real imagery follow-up.
- Phase 3 remains responsible for the already-implemented placeholders and process-screen restraint; Phase 3.1 decides whether any remaining visual drift is fixed, accepted, or deferred before closeout.

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
