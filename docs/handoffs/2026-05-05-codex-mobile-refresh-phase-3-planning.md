# Mobile Refresh Phase 3 Planning implementation

**Agent:** codex
**Branch:** codex/mobile-refresh-phase-3-planning
**Date:** 2026-05-05
**Initiative:** INIT-001
**INIT updated:** yes

## Summary

Implemented the first INIT-001 Phase 3 Planning pass: redesigned Planning entry hierarchy, rebuilt Chef It Up around time/cuisine/Ticket Pass/Prep Tray, refreshed Slop Bowl confirmation, and added shared planning-time plumbing through Slop Bowl generation.

Last Replit-validated at: not yet validated.

## Changes

- `shared/planning.ts`: added the approved four-stop planning time values, labels, prompt strings, storage key, and normalization helpers.
- `client/src/pages/app.tsx`: stores the user's last planning time client-side, prioritizes Chef It Up on Planning entry, moves Slop Bowl lower in the hierarchy, passes planning time into Chef It Up and Slop Bowl, and keeps Phase 2.2 bottom Cook/Menu structure.
- `client/src/components/cooking/meal-planning.tsx`: replaces the legacy four-step card flow with Phase 3 Time -> Cuisine -> Ticket Pass -> Prep Tray, removes avoid/specify, supports multi-select cuisines with exclusive `No preference`, and limits suggestions to exactly three.
- `client/src/components/cooking/slop-bowl.tsx`: updates the pantry confirmation copy to the approved "one more check" framing, keeps ephemeral quick-add/remove and 3+ ingredient gating, passes planning time to the API, and removes touched raw-hex button styling.
- `client/src/index.css`: adds the Phase 3 planning/Ticket Pass/Prep Tray/slop confirmation visual system and fixes bottom-nav CSS variables outside returning wrappers.
- `client/src/lib/openai.ts`, `server/routes.ts`, `server/openai.ts`: extend Slop Bowl API input with `planningTimeAvailable`; server validates the four approved values and feeds the time bound into the Slop Bowl prompt. Recipe suggestion prompt now frames `additionalIngredientsNeeded` as optional enhancements, not shopping requirements.
- `client/src/pages/cooking-new.tsx`: keeps the legacy cooking route compatible with the new `MealPlanning` props.
- `tests/unit/planning-time.test.ts`, `tests/unit/slop-bowl-route.test.ts`: cover planning-time normalization and Slop Bowl API time passthrough / validation.
- Docs updated: INIT-001, initiative registry, Phase 3 record, EPIC-004, EPIC-009, and EPIC-016.

## Impact on other agents

- Phase 3 intentionally stores last planning time in client localStorage for now. It does not repurpose `weekly_time` and does not add a DB schema change, in line with EPIC-010.
- Internal fields such as `pantryMatch`, `missingIngredients`, and `additionalIngredientsNeeded` remain in client/server contracts for compatibility, cooking-session history, and evaluation paths; the new Phase 3 UI does not expose them as match scores or mandatory grocery-list copy.
- Slop Bowl quick-add still uses `parseCommaSeparatedEntries`, including period-as-comma typo recovery from Phase 2.1.
- History share/cook-again/taste-memory behavior remains deferred to Phase 5.
- EPIC-016 is not resolved yet. This branch removes touched Slop Bowl raw-hex callsites, but visual comparison and the future EPIC-015 lint gate are still needed before closeout.

## Open items

- No more Phase 3 visual iteration unless an issue blocks functional validation or basic usability.
- Replit validation for authenticated Planning entry, Chef It Up time/cuisine flow, recipe generation, exactly-three Ticket Pass results, Prep Tray -> Cooking, Refresh suggestions, Slop Bowl quick-add/remove, Slop Bowl sparse-pantry guard, Slop Bowl generation, and Slop Bowl -> Edit pantry.
- Refresh `Last Replit-validated at` in the PR/handoff after Replit passes.
- Phase 3.1 owns the design facelift: whitespace/card grammar, typography, Slop Bowl humor treatment, Ticket Pass hierarchy, Prep Tray image layout, bottom nav fit, docs updates, and async/cached recipe imagery.
- Wilson decision still open if last planning time should become a real server-side profile field in a later pass. Current branch deliberately avoids that schema change.

## 2026-05-05 logo drift follow-up

Wilson's Replit screenshot review caught a brand-mark drift on the Phase 3 Planning entry: the implementation had recreated `Laica` as CSS text plus a pseudo-mark instead of reusing the canonical cropped logo asset used by the landing/auth surface.

Root cause in the docs system:

- `design_guidelines.md` preserved the casing rule (`Laica`, not `LAICA`) and the mockup-conformance rule.
- It did not explicitly say that visible product marks should reuse the canonical logo asset.
- The Phase 3 mockup showed a simple mark, so implementation matched the rough shape with CSS instead of checking the existing logo source of truth.

Follow-up patch:

- Initial correction made `client/src/pages/app.tsx` and `client/src/components/cooking/meal-planning.tsx` import `@assets/laica_logo_v1_cropped_1763444931884.png`; the later brand-mark restraint follow-up below removes visible logos from Phase 3 process screens.
- `.planning-brand` text/pseudo-mark CSS was removed and replaced with `.planning-logo`.
- `design_guidelines.md` now includes the canonical-logo guardrail and review checklist item.
- `product-decisions/features/mobile-refresh/phase-03-planning.md` records this as Phase 3 implementation evidence.

## 2026-05-05 time-slider geometry follow-up

Wilson's Replit screenshot review caught that the time-slider thumb was not visually landing on the approved labels.

Root cause:

- Radix placed four discrete slider values across the full physical track at `0%`, `33%`, `67%`, and `100%`.
- The labels were centered in four equal visual columns, so their centers were `12.5%`, `37.5%`, `62.5%`, and `87.5%`.
- The slider thumb was technically correct for the track but visually misaligned with the labels.

Follow-up patch:

- `client/src/components/cooking/meal-planning.tsx` now wraps the slider in `planning-slider-track`.
- `client/src/index.css` gives the track `12.5%` inline padding and uses a no-gap four-column label grid, so each Radix stop aligns with the matching label center.

## 2026-05-05 cuisine-list/default follow-up

Wilson's Replit screenshot review caught that the cuisine picker appeared limited to six cuisines and did not make the default path clear.

Root cause:

- The implementation treated the six visible mockup examples as the complete cuisine set.
- `No preference` was exclusive, but it started unselected, so the user had to make an unnecessary choice before asking Laica to surprise them.

Follow-up patch:

- `client/src/components/cooking/meal-planning.tsx` now exposes a broader starter cuisine set.
- The cuisine options live in a scrollable picker region, so the list can grow beyond one screen without pushing the primary action away.
- `No preference` is selected by default and stays in the lower thumb zone outside the scroll region. Selecting a cuisine clears it; clearing all selected cuisines restores it.
- `client/src/index.css` adds the fixed-height cuisine screen, scroll region, and lower action block styling without raw hex literals.

## 2026-05-05 suggestion-copy follow-up

Wilson clarified that visible Planning copy should not talk about "three" suggestions. The exact count remains a hidden generation and validation constraint, but the UI should read like recipe browsing.

Follow-up patch:

- Cuisine CTA/loading copy now says `View recipe suggestions` / `Finding recipes...`.
- Ticket Pass heading/action copy now says `Recipe suggestions from your pantry` and `Refresh suggestions`.
- Ticket badges now say `Pick` instead of numbering the suggestions.

## 2026-05-05 brand-mark restraint follow-up

Wilson clarified that Phase 3 should remove logos from in-app task flows instead of repeating the product mark on process screens. The earlier canonical-logo patch fixed the drift, but the better product direction is restraint: the app is already inside Laica, so Planning does not need to keep announcing the brand.

Follow-up patch:

- `client/src/pages/app.tsx` removes the logo from the Planning choice screen and drops the unused asset import.
- `client/src/components/cooking/meal-planning.tsx` removes the logo from the Ticket Pass/suggestions screen and drops the unused asset import.
- `client/src/index.css` removes the now-unused `.planning-logo` class.
- `design_guidelines.md` keeps the canonical-logo rule for actual branded surfaces and adds the complementary rule that ordinary setup/planning/selection/cooking/confirmation/settings process screens should not repeat the product mark unless explicitly designed as a branded entry/sign-in/landing moment.

## 2026-05-05 Ticket Pass image-slot/visual-drift follow-up

Wilson's Replit screenshot review caught two linked problems on the suggestion screen: there was no clear place for the agreed future recipe imagery, and the Ticket Pass still read like a generic vertical recipe-card list instead of the `phase-03-ticket-pass.png` mockup.

Root cause in the docs/context system:

- `phase-03-planning.md` said generated recipe imagery was deferred.
- `design_guidelines.md` and `design-language.md` said Ticket Pass should be a distinctive signature object, but they did not explicitly require Phase 3 to reserve stable image slots for a later imagery pass.
- Implementation treated the imagery deferral too broadly, so it avoided AI image generation but also failed to leave a durable place where generated images could hydrate.

Follow-up patch:

- `client/src/components/cooking/meal-planning.tsx` now supports optional `imageUrl` on recipe suggestions and renders designed placeholders when no image is present.
- Ticket Pass featured ticket, compact alternate tickets, and Prep Tray all reserve generated-image slots now.
- `client/src/index.css` reshapes Ticket Pass into a stronger featured-ticket plus compact alternate-ticket stack, with stable image placeholders that can hydrate without layout shift.
- `product-decisions/features/mobile-refresh/phase-03-1-recipe-imagery.md` now owns actual recipe imagery/illustration direction.
- `design_guidelines.md`, `product-decisions/features/mobile-refresh/design-language.md`, and `phase-03-planning.md` now distinguish Phase 3 image placeholders from Phase 3.1 generated/illustrated recipe imagery.

Speed guidance:

- Phase 3 should not generate food images on the critical path. Suggestions should reveal as soon as the recipe response returns.
- Phase 3.1 generated recipe imagery, if accepted, should be async/cached and allowed to hydrate after the Ticket Pass is already usable.

## 2026-05-05 bottom-navigation follow-up

Wilson's Replit screenshot review caught that the bottom nav made the chef icon look like a selected Cook status badge during Planning. The coral active fill was also visually heavier than needed for a utilitarian access surface.

Follow-up patch:

- `client/src/pages/app.tsx` no longer marks Cook/Menu bottom buttons as active based on the current phase.
- `client/src/index.css` makes bottom nav buttons larger and neutral, with no coral selected pill.
- `product-decisions/009-mobile-refresh-navigation.md` records the neutral bottom-nav rule: screen content communicates process status; bottom nav remains neutral access to Cook/Planning and Menu.

## 2026-05-05 Planning entry handwriting/Slop Bowl art follow-up

Wilson's Replit screenshot review caught three planning-entry tone issues: the `MAKE GOOD SLOP` sticker was not centered, the card type lost the handwrite-y kitchen diary edge from the mockups, and the Slop Bowl art had become too clean to carry the humor.

Follow-up patch, later superseded by the typography follow-up below:

- `client/src/index.css` imported `Patrick Hand` and initially scoped it to Planning card titles and Slop Bowl sticker labels.
- `client/src/index.css` centers `.planning-slop-sticker` with `left: 50%` and `translateX(-50%)`.
- `client/src/pages/app.tsx` and `client/src/index.css` rebuild the Slop Bowl art as a messier ingredient-storm doodle with splashes, a tilted spoon, and a `???` scribble.
- `design_guidelines.md` briefly recorded `Patrick Hand` for small tone-forward Planning labels; later review narrowed it to micro-accents only.
- The Slop Bowl sticker itself is later removed in the sticker/banner reset below.
- EPIC-016 remains open; this patch keeps Slop Bowl styling tokenized and does not add raw hex literals.

## 2026-05-05 Planning entry label-legibility follow-up

Wilson's screenshot review caught that the handwritten `Chef It Up` and `Slop Bowl` labels were harder to read and then felt disconnected from the `What are we cooking today?` display heading.

Follow-up patch:

- `client/src/index.css` resets `.planning-display`, `.planning-choice-title`, and `.planning-choice-copy` to the generated mockup's `Nunito`-led grammar.
- Choice-card titles and taglines now differ by size, weight, shade, and layout rather than by font family.
- `design_guidelines.md`, the Phase 3 record, and Phase 3.1 drift inventory now say to preserve mockup typography before layering additional principles.

## 2026-05-05 Slop Bowl sticker-legibility follow-up

Wilson's screenshot review caught that the rotating Slop Bowl sticker copy (`LESS BRAIN POWER`, `NO RULES`, `MAKE GOOD SLOP`) was hard to read and did not pop enough as a label. Later label/banner treatments still felt too separate from the page, revealing that the card had accumulated too many one-off design fixes.

Follow-up patch:

- `client/src/pages/app.tsx` and `client/src/index.css` now remove the rotating sticker markup/styles from the Planning choice card.
- The Slop Bowl card returns to title, support copy, illustration, and arrow.
- Phase 3 and Phase 3.1 docs now track this as a sticker/banner drift reset rather than another label-treatment patch.

## 2026-05-05 Phase 3.1 drift-scope follow-up

Wilson asked that the Phase 3 design-drift review be included in Phase 3.1 work instead of becoming a standalone active epic.

Follow-up docs patch:

- `product-decisions/features/mobile-refresh/phase-03-1-recipe-imagery.md` now owns the drift inventory, root-cause notes, recommendations, and recipe imagery follow-up.
- `epics/README.md` and `epics/registry.md` do not list a Phase 3 drift epic.
- `initiatives/INIT-001-mobile-refresh.md` and `initiatives/registry.md` now describe Phase 3.1 as the next design-drift plus imagery pass.

Phase 3.1 should review the documented drift rows and mark each one fixed, accepted, or deferred before closeout. Real imagery remains async/cached and must not block the first recipe-suggestion reveal.

## 2026-05-06 Phase 3 visual-freeze / closeout boundary

Wilson decided to stop Phase 3 visual iteration and close this phase on functionality. The current Planning/Ticket/Prep visuals are functional scaffolding, not final design polish.

Follow-up docs patch:

- `product-decisions/features/mobile-refresh/phase-03-planning.md` now states that Phase 3 should not receive more visual changes unless an issue blocks functional validation or basic usability.
- `product-decisions/features/mobile-refresh/phase-03-1-recipe-imagery.md` is reframed as design facelift plus recipe imagery.
- `initiatives/INIT-001-mobile-refresh.md`, `initiatives/registry.md`, and the mobile-refresh phase index now point Phase 3.1 at the design facelift and imagery work.

Phase 3 closeout should focus on authenticated Planning entry, Chef It Up time/cuisine, recipe generation, refresh suggestions, Ticket Pass selection, Prep Tray -> Cooking, Slop Bowl quick-add/remove, sparse-pantry guard, Slop Bowl generation, and Slop Bowl -> Edit pantry. Phase 3.1 should plan and implement whitespace/card grammar, typography, Slop Bowl humor treatment, Ticket Pass hierarchy, Prep Tray image layout, bottom nav fit, docs updates, and async/cached recipe imagery.

## 2026-05-06 Ticket Pass selection-orientation follow-up

Wilson's Replit screenshot review found a basic usability blocker in Ticket Pass selection: selecting recipe 2 or 3 promoted it into the featured slot and moved recipe 1 into the compact stack, making the list feel reordered.

Follow-up patch:

- `client/src/components/cooking/meal-planning.tsx` now renders the three recipe suggestions in generated order and expands the selected ticket in place.
- The selected expanded ticket says `Your pick` instead of moving `Chef pick` to whichever ticket the user last tapped.
- Recipe names are display-split into a main title and smaller supporting detail only when the API returns explicit parenthetical or colon-separated detail. Normal dish names remain a single title, and the underlying `recipeName` remains unchanged.
- `product-decisions/features/mobile-refresh/phase-03-planning.md` and `phase-03-1-recipe-imagery.md` record this as a Phase 3 basic-usability exception to the visual freeze.

Replit validation should explicitly tap recipe 1, 2, and 3 and confirm the order stays stable while the selected ticket expands in its original position.

## Verification

Passed:

- `npm ci`
- `npm run check`
- `npm run build`
- `npx vitest run tests/unit/planning-time.test.ts tests/unit/slop-bowl-route.test.ts`
- `git diff --check`
- Dotenvx dev-server boot smoke: `PORT=3000 npx @dotenvx/dotenvx run -- npm run dev` returned HTTP 200 on port 3000.
- 2026-05-06 visual-freeze closeout docs patch re-ran `git diff --check`, `npm run check`, `npm run build`, and `npx vitest run tests/unit/planning-time.test.ts tests/unit/slop-bowl-route.test.ts`.

Not green / not authoritative:

- `npx vitest run` still fails on existing repo-wide harness issues outside this branch: `tests/e2e/cooking-workflow.test.ts` is a Playwright file collected by Vitest, and `tests/unit/voice-recording.test.ts` expects `MediaStream` in the test environment.
- Local authenticated smoke was not completed. The worktree can boot locally after linking `.env.keys`, but authenticated Planning requires real sign-in/profile state; Replit remains the validation gate for this deployment-bound phase.
- Rich visual facelift review is no longer a Phase 3 merge bar; it is Phase 3.1 scope unless a visual issue blocks functional validation or basic usability.

## Stack / base status

- Base refreshed: yes
- Current base: `origin/main` at `b4c1747bd20b5be469d11b66f74c79a83fbc8887`
- Last Replit-validated at: not yet validated
- Notes: Branch started from fresh `origin/main` after PR #34 and the later EPIC-017 merge. EPIC-017 is deferred until INIT-001 completes and does not change the current Replit validation gate.
