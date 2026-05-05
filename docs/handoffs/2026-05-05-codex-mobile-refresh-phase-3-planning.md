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

- Wilson/Replit visual review against `phase-03-planning-flow.png` and `phase-03-ticket-pass.png`.
- Replit validation for authenticated Planning entry, Chef It Up time/cuisine flow, recipe generation, exactly-three Ticket Pass results, Prep Tray -> Cooking, Refresh suggestions, Slop Bowl quick-add/remove, Slop Bowl sparse-pantry guard, Slop Bowl generation, and Slop Bowl -> Edit pantry.
- Refresh `Last Replit-validated at` in the PR/handoff after Replit passes.
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

## Verification

Passed:

- `npm ci`
- `npm run check`
- `npm run build`
- `npx vitest run tests/unit/planning-time.test.ts tests/unit/slop-bowl-route.test.ts`
- `git diff --check`
- Dotenvx dev-server boot smoke: `PORT=3000 npx @dotenvx/dotenvx run -- npm run dev` returned HTTP 200 on port 3000.

Not green / not authoritative:

- `npx vitest run` still fails on existing repo-wide harness issues outside this branch: `tests/e2e/cooking-workflow.test.ts` is a Playwright file collected by Vitest, and `tests/unit/voice-recording.test.ts` expects `MediaStream` in the test environment.
- Local authenticated visual smoke was not completed. The worktree can boot locally after linking `.env.keys`, but authenticated Planning requires real sign-in/profile state; Replit remains the validation gate for this deployment-bound phase.

## Stack / base status

- Base refreshed: yes
- Current base: `origin/main` at `b4c1747bd20b5be469d11b66f74c79a83fbc8887`
- Last Replit-validated at: not yet validated
- Notes: Branch started from fresh `origin/main` after PR #34 and the later EPIC-017 merge. EPIC-017 is deferred until INIT-001 completes and does not change the current Replit validation gate.
