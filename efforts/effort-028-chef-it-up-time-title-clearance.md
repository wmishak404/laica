# EFF-028: Chef It Up mobile visual clearance

**Status:** In Progress
**Owner:** Wilson / Codex / Claude
**Created:** 2026-07-14
**Linked Initiative:** [INIT-001 - Mobile Refresh](../initiatives/INIT-001-mobile-refresh.md)
**Related docs:** [Phase 3 Planning](../product-decisions/features/mobile-refresh/pd-phase-03-planning.md), [Phase 3.1 Design Facelift](../product-decisions/features/mobile-refresh/pd-phase-03-1-recipe-imagery.md), [PD-005 UI Governance](../product-decisions/pd-005-ui-governance.md), [design guidelines](../design_guidelines.md)

## One-line summary

Clear two Chef It Up mobile visual regressions before Live Cooking: the time-selection title should not sit under the floating Back button, and the Prep Tray selected image should fill its hero area on mobile the way it does on desktop.

## Context

Wilson's 2026-07-14 mobile Safari/Replit screenshots show the Chef It Up time-selection step, `How much time do you have today?`, starting too far left under the floating circular Back button. The title is shorter than some other Chef It Up headings, but its current line break and horizontal position make the first words visually collide with the Back affordance.

The initial desired direction was the layout posture used by adjacent Chef It Up process screens such as `What sounds good?` and `Anything else around?`: keep the title centered in the usable content area with more horizontal page margin. After reviewing the first implementation, Wilson rejected the time-title horizontal inset as visually asymmetrical and revised the accepted direction for this page: keep the time-selection title symmetrical/centered, let this specific time-selection page shift downward, and enlarge the timer/clock so the composition matches Wilson's 2026-07-15 mockup.

Wilson's later 2026-07-14 mobile/desktop comparison adds a related Chef It Up Prep Tray visual regression. On mobile, the selected recipe image appears inside the top preview area but does not zoom/fill out to the whole hero space, leaving visible borders/gutters. On desktop, the same kind of image uses the full area between the card borders. The goal is for the food/prep-tray image to take over the whole top preview area on mobile too, with no visible inner border/gutter around the ready image.

This is a small visual-fit follow-up tied to the Mobile Refresh Phase 3 Planning / Phase 3.1 Prep Tray imagery surface. PR #208 previously established that approved selected recipe images should fill the whole upper Prep Tray hero panel above the recipe details; this Effort captures the new mobile-specific evidence that the accepted behavior appears to have drifted. It does not change Chef It Up behavior, Live Cooking behavior, navigation semantics, prompt/provider behavior, image generation, schema, or rate limits.

Sequencing note from Wilson: do this implementation after Codex thread `019f3b47-9d04-7a03-8973-2a9cd1bb19b4` finishes its current work.

## Scope

- Adjust the Chef It Up time-selection heading/layout so the floating Back button no longer covers the title on narrow mobile widths.
- For this time-selection page only, prefer Wilson's revised 2026-07-15 direction over the first horizontal-inset attempt: keep the heading symmetrical/centered, shift the time-selection composition downward, and enlarge the timer/clock.
- Use the adjacent `What sounds good?` and `Anything else around?` Chef It Up screens as the visual comparison target for centered title posture and horizontal margin.
- Keep the Back button visible and tappable.
- Prefer the existing MealPlanning/page-header patterns, tokens, and scoped CSS over a one-off visual hack.
- Verify on a representative mobile viewport that the heading fits, wraps cleanly, and clears the Back button without shrinking or overlapping the rest of the time-step controls.
- Fix the ready-state Prep Tray selected image on mobile so the image fills the full `.planning-prep-hero` area, matching the accepted desktop/full-bleed behavior and leaving no inner preview border/gutter.
- Preserve placeholder and pending image states as designed; the full-bleed requirement applies when a real selected recipe image is ready.
- Inspect `client/src/components/cooking/meal-planning.tsx`, `.planning-prep-hero`, `.planning-recipe-image-slot-prep`, `.planning-recipe-image`, and the existing selected-recipe preview bounds check in `tests/e2e/cooking-workflow.test.ts`.
- Verify both mobile and desktop viewports because the reported regression is mobile-specific while desktop is currently the comparison target.

Out of scope:

- Redesigning the Chef It Up flow.
- Changing the time-slider options, cuisine choices, staple queue, Ticket Pass generation/refresh behavior, Prep Tray content, Ready Check, or Live Cooking.
- Changing durable navigation surfaces.
- Changing recipe image generation, provider choice, image cache policy, prompt behavior, or selected-image resolver timing.
- Adding new copy or explanatory UI.
- Reworking the whole Phase 3.1 visual facelift.

## Decisions made so far

- Wilson rejected the first horizontal-inset time-title attempt as unpleasingly asymmetrical. The accepted time-selection exception is now centered/symmetrical title, viewport-relative page placement, and a larger timer/clock.
- Shorten the Ticket Pass heading from `Recipe suggestions from your pantry` to `Recipe suggestions`.
- Treat the comparison screens as `What sounds good?` and `Anything else around?`, not the current covered time-title screenshot.
- Treat the Prep Tray comparison target as the accepted PR #208/desktop behavior where the ready selected image fills the hero image area. Do not treat the mobile inner-border/gutter screenshot as acceptable ready-state behavior.
- Keep this as a standalone implementation follow-up linked to INIT-001. Filing this Effort does not change INIT-001 phase status or current resume point.
- Sequence implementation after Codex thread `019f3b47-9d04-7a03-8973-2a9cd1bb19b4` completes its current work.
- This was kept inside EFF-028 instead of creating a new Effort because both reports are narrow Chef It Up visual-fit issues before Live Cooking and share the same sequencing gate.

## Open questions

- No product or implementation questions remain for the current EFF-028 slice.
- Merge readiness still needs current-head CI after Wilson's revised runtime CSS/copy direction. The first implementation head `8ccd4bd007b7c331b5cbb92d86ad505d50e0b3da` passed exact-head GitHub `unit` and `e2e_guest_smoke`, but that predates the accepted centered/downward/larger-clock time screen and shortened Ticket Pass heading. The local decrypted database failed the read-only schema health check, so local DB-backed E2E is not claimed.

## Agent checklist

- [x] Confirm Codex thread `019f3b47-9d04-7a03-8973-2a9cd1bb19b4` has completed its current work before implementation.
- [x] Read this Effort, INIT-001, Phase 3 Planning, Phase 3.1, PD-005, and `design_guidelines.md` before implementation.
- [x] Inspect the current Chef It Up time, cuisine, and extra-ingredients process-heading markup/CSS before choosing a shared or local fix.
- [x] Inspect the current Prep Tray image markup/CSS and PR #208-era intent before changing image sizing.
- [x] Implement the smallest tokenized/scoped layout change that clears the Back button through the accepted time-page exception: centered title, viewport-relative page placement, and larger timer/clock.
- [x] Implement the smallest tokenized/scoped image-layout change that makes a ready selected Prep Tray image fill the mobile hero area without altering provider/image-generation behavior.
- [x] Verify a narrow mobile viewport visually against the time screen, adjacent Chef It Up screens, and a Prep Tray with a ready selected image.
- [x] Verify desktop Prep Tray remains full-bleed and does not regress while fixing mobile.
- [x] Include screenshot or Playwright/browser evidence in the PR/handoff, plus negative scope for unchanged flow behavior.

## Resolution criteria

1. On the Chef It Up time-selection screen, `How much time do you have today?` is visually centered/symmetrical and no longer sits under or behind the floating Back button on a representative mobile viewport.
2. The time-selection page uses the explicit Wilson-approved exception: the page composition shifts downward and the timer/clock is larger, without applying that vertical exception to adjacent Chef It Up screens.
3. `What sounds good?` and `Anything else around?` remain visually aligned or improve through the same shared heading rule if one is used.
4. On mobile Prep Tray ready-image state, the selected recipe image fills the full top hero image area like the desktop comparison, with no inner border/gutter around the ready image.
5. Placeholder, pending, and unavailable image states remain polished and do not falsely stretch into an image state.
6. Back navigation, time selection, cuisine selection, suggestion generation, Prep Tray content, Ready Check, and Live Cooking behavior remain unchanged.
7. The implementation PR records visual evidence, exact validation commands or browser checks, and remaining unvalidated scope.

## 2026-07-14 - Effort filed

Codex filed this Effort from Wilson's screenshot-backed request. Wilson then clarified that implementation should wait until Codex thread `019f3b47-9d04-7a03-8973-2a9cd1bb19b4` finishes its current work. No runtime implementation has started. Future implementation should happen in a fresh Codex- or Claude-owned branch and cite this Effort plus INIT-001.

## 2026-07-14 - Prep Tray selected-image mobile evidence added

Wilson added mobile and desktop comparison screenshots for the Chef It Up Prep Tray / recipe-detail preview. Mobile shows the ready recipe image present but inset inside the top preview region with visible border/gutter space; desktop shows the image using the whole available image area. Codex updated this Effort rather than creating a new one because the issue is another narrow Chef It Up visual-fit problem before Live Cooking, and it shares the same sequencing gate after thread `019f3b47-9d04-7a03-8973-2a9cd1bb19b4`.

Implementation should start by checking the existing full-hero intent from Phase 3.1 / PR #208 and the current CSS around `.planning-prep-hero`, `.planning-recipe-image-slot-prep`, and `.planning-recipe-image`. No runtime implementation has started in this docs branch.

## 2026-07-14 - Phase 4 routing merged

[PR #287](https://github.com/wmishak404/laica/pull/287) merged as `430a5d8` from final head `9051805`, routing this Effort into INIT-001 / Phase 4 as the next adjacent visual-layout target alongside EFF-029 after thread `019f3b47-9d04-7a03-8973-2a9cd1bb19b4` merges. The Effort remains `Open`; no runtime implementation has started.

## 2026-07-15 - Implementation branch opened

Codex opened `codex/eff-028-time-title-prep-tray` from fresh `origin/main` at `05774085e0bc39c2cebdffd2185ab5a0a86d1e2d` after verifying that PR #291 merged as `766d910b128f84213d2a79a8077100d3df4272d8` and docs closeout PR #292 merged as `05774085e0bc39c2cebdffd2185ab5a0a86d1e2d`.

The branch adds a shared `.planning-process-heading` wrapper to the Chef It Up time/cuisine/staple process headings, then originally applied a narrow mobile horizontal inset to the time screen so `How much time do you have today?` cleared the floating Back button. Wilson rejected that first attempt as visually asymmetrical on 2026-07-15; the branch now keeps the time title centered/symmetrical, applies a time-screen-specific short-mobile top clearance, and enlarges the clock. It also restores the PR #208 ready-image intent on short mobile Prep Tray by removing the ready hero padding and forcing the ready `.planning-recipe-image-slot-prep` to fill the hero box with `height: 100%`, `min-height: 0`, and `object-fit: cover`. Placeholder and pending image states keep their centered slot sizing.

Validation evidence on the implementation branch:

- `npm ci` passed and `npm run setup:worktree` linked `.env.keys`.
- `npx vitest run tests/unit/meal-planning.test.tsx --testTimeout=15000` passed: 27 tests.
- `npm run test:unit` passed: 49 files / 382 tests.
- `npm run check` passed.
- `npm run build` passed, with only existing Browserslist, Firebase mixed dynamic/static import, and chunk-size warnings.
- `git diff --check` passed.
- Current-head built-CSS Chromium geometry at `390x740` showed the time title's two text lines centered at `195px` in a `390px` viewport, first line top `122.390625px` below the Back button bottom `51.1875px`, the enlarged clock at `150.390625 x 150.390625`, and the action dock still visible; screenshot evidence was saved at `/tmp/laica-eff028-time-revised-css.png`. Earlier compiled-CSS Prep Tray geometry, unchanged by the later time-screen/copy revision, showed the mobile Prep Tray ready slot exactly matched the hero (`320 x 132.796875`) and used `object-fit: cover`; screenshot evidence was saved at `/tmp/laica-eff028-compiled-css-mobile.png`.
- A paired compiled-CSS geometry check at `900x800` showed desktop remains full-bleed (`900 x 152` hero and slot, zero geometry delta, `object-fit: cover`).

DB-backed local E2E is not claimed. `npm run env:run -- npm run db:health` failed against the decrypted local database with missing tables `ai_interactions`, `prompt_versions`, `anonymous_recipe_usage`, `recipe_image_cache`, and missing column `cooking_sessions.recipe_snapshot`. Per `docs/workflows/testing-and-acceptance.md`, Codex did not run `db:push` against that database; exact-head GitHub `e2e_guest_smoke` or an equivalent prepared-schema E2E lane remains the merge-readiness gate after push.

Negative scope stayed intact: no provider, schema, prompt, durable navigation, Ticket Pass generation/refresh behavior, Ready Check behavior, Live Cooking behavior, image-generation/cache behavior, or recipe route changes. EFF-029 and EFF-030 were not started in this thread.

## 2026-07-15 - Chrome/Replit mobile validation added

Wilson requested Chrome/Replit validation in mobile mode with an iPhone viewport. Codex used the Chrome extension against the Replit preview and Replit workspace, and did not use Replit Agent. The Replit workspace had been switched to `codex/eff-028-time-title-prep-tray` at implementation head `8ccd4bd007b7c331b5cbb92d86ad505d50e0b3da` before the smoke.

Chrome automation could send the DevTools/device-toolbar keyboard shortcut but could not reliably inspect or select the DevTools device dropdown, so Codex used Chrome's viewport override and recorded the page-reported CSS viewport instead. The app reported `innerWidth: 390`, `innerHeight: 844`, `visualViewport.width: 390`, and `visualViewport.height: 843.75`, matching an iPhone-sized CSS viewport for this validation pass.

Observed Replit flow evidence:

- First-time setup completed in Chrome mobile from the Replit preview: manual Pantry saved five items, Tools skipped, cooking comfort set to Beginner, dietary restrictions set to No restrictions, and setup finished to Planning.
- Chef It Up time selection showed `How much time do you have today?` visibly below and clear of the Back control in the iPhone viewport. Screenshot saved locally for the thread at `/tmp/laica-eff028-replit-time-iphone390.png`.
- Adjacent `What sounds good?` comparison screen kept the same centered heading posture with sticky actions visible. Screenshot: `/tmp/laica-eff028-replit-cuisine-iphone390.png`.
- Provider-backed Replit recipe suggestions returned successfully for the smoke (`Simple Fried Rice`, `Egg and Lime Tortilla Wraps`, `Soy-Lime Rice Quesadillas`). Ticket Pass stayed placeholder-only before Prep Tray: `ticketImages: 0`, all three ticket image slots had `data-has-image="false"`. Screenshot: `/tmp/laica-eff028-replit-ticket-pass-iphone390.png`.
- Prep Tray pending state preserved the intended centered placeholder slot: hero `356.7578125 x 179.98046875`, placeholder slot `207.998046875 x 120`, `imageState: pending`, `imageCount: 0`. Screenshot: `/tmp/laica-eff028-replit-prep-pending-iphone390.png`.
- The selected-image resolver reached `ready` after about five seconds. The ready Prep Tray hero, image slot, and image all measured `356.7578125 x 151.9921875` with zero x/y/width/height geometry delta and `object-fit: cover`; image source was `/api/recipe-images/8319ad288251e797fa7f1d0604203a75cbd6a871cafc90aba57454533e4a17ab`. Screenshot: `/tmp/laica-eff028-replit-prep-ready-iphone390.png`.
- Back from Prep Tray to Ticket Pass preserved the no-bleed behavior: `ticketImages: 0`, all Ticket Pass slots stayed `data-has-image="false"`. Screenshot: `/tmp/laica-eff028-replit-ticket-return-iphone390.png`.
- Chrome tab console errors/warnings for the LAICA app were empty during the smoke.

Negative scope for this Replit smoke: Codex did not click `Cook this`, enter Ready Check, start Live Cooking, test speech/microphone, finish a cooking session, change provider settings, change schema, or use Replit Agent. A setup observation outside EFF-028 remains that after manual pantry save, the first setup page can require inner setup scrolling to bring the bottom rail fully into view; the rail was still reachable and setup could proceed, so this was not treated as EFF-028 scope.

## 2026-07-15 - Wilson revised time-title and Ticket Pass heading direction

Wilson reviewed the first Chrome/Replit screenshots and rejected the time-selection horizontal inset because it looked unpleasingly asymmetrical. Codex updated the branch so the time-selection title is centered/symmetrical again, the time screen uses a page-specific downward offset, and the clock is enlarged in the short-mobile layout. The Ticket Pass heading was also shortened from `Recipe suggestions from your pantry` to `Recipe suggestions`.

Additional local evidence after this revision:

- `npx vitest run tests/unit/meal-planning.test.tsx --testTimeout=15000` passed: 27 tests.
- `npm run test:unit` passed: 49 files / 382 tests.
- `npm run check` passed.
- `npm run build` passed with only the existing Browserslist, Firebase mixed dynamic/static import, and chunk-size warnings.
- `git diff --check` passed.
- Built-CSS Chromium geometry at `390x740` showed the revised time title's two text lines centered at `195px` in a `390px` viewport, with the first line starting at `122.390625px` below the Back button bottom at `51.1875px`. The clock measured `150.390625 x 150.390625`, and the action dock remained in view. Screenshot evidence was saved at `/tmp/laica-eff028-time-revised-css.png`.

This revision still does not change provider, schema, prompt, durable navigation, Ticket Pass behavior beyond the heading copy, Ready Check behavior, Live Cooking behavior, image-generation/cache behavior, or recipe routes. EFF-029 and EFF-030 remain unstarted.

## 2026-07-16 - Revised Replit mobile validation and audit unblocker

Codex reran Chrome/Replit mobile validation after Wilson's revised direction. Replit was fast-forwarded to runtime head `3d70dfb90c51cba51a492216c7f79078386f9188` on `codex/eff-028-time-title-prep-tray`, and Replit Agent was not used. Chrome's controlled viewport reported `devicePixelRatio: 0.8`, so Codex used a compensated outer viewport to make the app report an iPhone-sized CSS viewport: `innerWidth: 390`, `innerHeight: 844`, `visualViewport.width: 390`, and `visualViewport.height: 843.75`.

Observed revised Replit evidence:

- Time selection kept the title centered/symmetrical and below the Back button: heading line centers `194.9951171875` and `195` in the `390px` viewport, first title line top `110.771484375px` below Back bottom `75.986328125px`, clock `175.99609375 x 175.99609375`, and action dock visible. Screenshot: `/tmp/laica-eff028-replit-time-revised-iphone390.png`.
- Adjacent `What sounds good?` still kept the centered heading posture with sticky actions visible. Screenshot: `/tmp/laica-eff028-replit-cuisine-revised-iphone390.png`.
- Ticket Pass heading was exactly `Recipe suggestions`; the old `Recipe suggestions from your pantry` copy was absent. Ticket Pass stayed placeholder-only before Prep Tray with `ticketImages: 0`. Screenshot: `/tmp/laica-eff028-replit-ticket-suggestions-iphone390.png`.
- Prep Tray ready selected image filled the hero: hero, slot, and image all measured `356.7578125 x 151.9921875`; image was complete with `naturalWidth: 1024`, `naturalHeight: 1024`, and `object-fit: cover`. Screenshot: `/tmp/laica-eff028-replit-prep-ready-revised-iphone390.png`.
- Back to Ticket Pass preserved no-bleed behavior: `ticketImages: 0`, and all three Ticket Pass image slots stayed `data-has-image="false"` / `data-image-state="placeholder"`. Screenshot: `/tmp/laica-eff028-replit-ticket-back-revised-iphone390.png`.
- LAICA tab console warnings/errors were empty.

GitHub checks at revised runtime head `3d70dfb90c51cba51a492216c7f79078386f9188` passed `unit`, `e2e_guest_smoke`, `trufflehog_pr`, CodeQL, and both Analyze checks; `trufflehog_push` skipped as expected. `npm-audit` failed because a new critical advisory hit transitive `websocket-driver@0.7.4` through Firebase's `@firebase/database -> faye-websocket` path. Codex ran `npm audit fix --package-lock-only --audit-level=high`, which updated only `package-lock.json` to `websocket-driver@0.7.5`. After the lockfile-only audit remediation, local `npm ci`, `npm audit --audit-level=high`, `npm run test:unit`, `npm run check`, `npm run build`, and `git diff --check` all passed.

Negative scope remains: no provider, schema, prompt, durable navigation, Ticket Pass generation/refresh behavior, Ready Check behavior, Live Cooking behavior, image-generation/cache behavior, recipe route, direct dependency, or package manifest changes. The audit fix is a transitive lockfile-only CI unblocker. EFF-029 and EFF-030 remain unstarted.

## 2026-07-16 - Physical iPhone centering follow-up

Wilson compared a full physical iPhone Safari screenshot against the desktop browser's iPhone-sized Replit view and found the time-selection composition still looked too low on the real phone because Safari browser chrome leaves a shorter app viewport. Codex changed the short-mobile time-page top clearance from a fixed `7.9rem` shove to `clamp(5.35rem, 12svh, 6.35rem)` and made the time-stack gap viewport-relative with `clamp(1rem, 2.45svh, 1.35rem)`. The intent is still the Wilson-approved page-specific time-selection exception, but it now scales with available mobile height instead of preserving one emulator-biased vertical offset.

The E2E time-layout guard now also checks that the title is not too far below the Back button and that the time-content stack is not biased below the available center above the fixed Next dock. Local validation for this follow-up passed `npm run build`, `npm run check`, `npm run test:unit`, and `git diff --check`. A compiled-CSS Chromium geometry probe covered `390x744`, `390x844`, `375x667`, and `430x740`: at `390x744`, the title gap after the Back button was `34.078125px` and the stack center was `45.015625px` above the available center; at `390x844`, the stack center was within `3.9921875px` of the available center. Screenshots were saved at `/tmp/laica-eff028-time-css-390x744-balanced.png` and `/tmp/laica-eff028-time-css-390x844-balanced.png`.

This follow-up still does not change provider, schema, prompt, durable navigation, Ticket Pass generation/refresh behavior, Ready Check behavior, Live Cooking behavior, image-generation/cache behavior, recipe routes, direct dependencies, or package manifest entries. EFF-029 and EFF-030 remain unstarted.
