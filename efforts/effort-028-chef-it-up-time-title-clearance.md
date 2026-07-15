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

The desired direction is the layout posture used by adjacent Chef It Up process screens such as `What sounds good?` and `Anything else around?`: keep the title centered in the usable content area with more horizontal page margin. Wilson explicitly prefers horizontal title inset over shifting the whole page downward, because pushing the page down would cost vertical real estate and further compress the flow.

Wilson's later 2026-07-14 mobile/desktop comparison adds a related Chef It Up Prep Tray visual regression. On mobile, the selected recipe image appears inside the top preview area but does not zoom/fill out to the whole hero space, leaving visible borders/gutters. On desktop, the same kind of image uses the full area between the card borders. The goal is for the food/prep-tray image to take over the whole top preview area on mobile too, with no visible inner border/gutter around the ready image.

This is a small visual-fit follow-up tied to the Mobile Refresh Phase 3 Planning / Phase 3.1 Prep Tray imagery surface. PR #208 previously established that approved selected recipe images should fill the whole upper Prep Tray hero panel above the recipe details; this Effort captures the new mobile-specific evidence that the accepted behavior appears to have drifted. It does not change Chef It Up behavior, Live Cooking behavior, navigation semantics, prompt/provider behavior, image generation, schema, or rate limits.

Sequencing note from Wilson: do this implementation after Codex thread `019f3b47-9d04-7a03-8973-2a9cd1bb19b4` finishes its current work.

## Scope

- Adjust the Chef It Up time-selection heading/layout so the floating Back button no longer covers the title on narrow mobile widths.
- Preserve the existing vertical rhythm as much as possible; do not solve this by moving the whole page lower.
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
- Changing the time-slider options, cuisine choices, staple queue, Ticket Pass behavior, Prep Tray content, Ready Check, or Live Cooking.
- Changing durable navigation surfaces.
- Changing recipe image generation, provider choice, image cache policy, prompt behavior, or selected-image resolver timing.
- Adding new copy or explanatory UI.
- Reworking the whole Phase 3.1 visual facelift.

## Decisions made so far

- Use horizontal inset/centering for the time-step title rather than vertical displacement.
- Treat the comparison screens as `What sounds good?` and `Anything else around?`, not the current covered time-title screenshot.
- Treat the Prep Tray comparison target as the accepted PR #208/desktop behavior where the ready selected image fills the hero image area. Do not treat the mobile inner-border/gutter screenshot as acceptable ready-state behavior.
- Keep this as a standalone implementation follow-up linked to INIT-001. Filing this Effort does not change INIT-001 phase status or current resume point.
- Sequence implementation after Codex thread `019f3b47-9d04-7a03-8973-2a9cd1bb19b4` completes its current work.
- This was kept inside EFF-028 instead of creating a new Effort because both reports are narrow Chef It Up visual-fit issues before Live Cooking and share the same sequencing gate.

## Open questions

- No product or implementation questions remain for the current EFF-028 slice.
- Merge readiness still needs exact-head GitHub `e2e_guest_smoke` or an equivalent prepared-schema E2E lane after the branch is pushed. The local decrypted database failed the read-only schema health check, so local DB-backed E2E is not claimed.

## Agent checklist

- [x] Confirm Codex thread `019f3b47-9d04-7a03-8973-2a9cd1bb19b4` has completed its current work before implementation.
- [x] Read this Effort, INIT-001, Phase 3 Planning, Phase 3.1, PD-005, and `design_guidelines.md` before implementation.
- [x] Inspect the current Chef It Up time, cuisine, and extra-ingredients process-heading markup/CSS before choosing a shared or local fix.
- [x] Inspect the current Prep Tray image markup/CSS and PR #208-era intent before changing image sizing.
- [x] Implement the smallest tokenized/scoped layout change that clears the Back button without pushing the whole page down.
- [x] Implement the smallest tokenized/scoped image-layout change that makes a ready selected Prep Tray image fill the mobile hero area without altering provider/image-generation behavior.
- [x] Verify a narrow mobile viewport visually against the time screen, adjacent Chef It Up screens, and a Prep Tray with a ready selected image.
- [x] Verify desktop Prep Tray remains full-bleed and does not regress while fixing mobile.
- [x] Include screenshot or Playwright/browser evidence in the PR/handoff, plus negative scope for unchanged flow behavior.

## Resolution criteria

1. On the Chef It Up time-selection screen, `How much time do you have today?` is visually centered within the usable content area and no longer sits under or behind the floating Back button on a representative mobile viewport.
2. The page does not compensate by shifting the full content column downward in a way that materially reduces vertical real estate.
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

The branch adds a shared `.planning-process-heading` wrapper to the Chef It Up time/cuisine/staple process headings, then applies the narrow mobile clearance only to the time screen so `How much time do you have today?` clears the floating Back button through horizontal inset instead of pushing the whole page downward. It also restores the PR #208 ready-image intent on short mobile Prep Tray by removing the ready hero padding and forcing the ready `.planning-recipe-image-slot-prep` to fill the hero box with `height: 100%`, `min-height: 0`, and `object-fit: cover`. Placeholder and pending image states keep their centered slot sizing.

Validation evidence on the implementation branch:

- `npm ci` passed and `npm run setup:worktree` linked `.env.keys`.
- `npx vitest run tests/unit/meal-planning.test.tsx --testTimeout=15000` passed: 27 tests.
- `npm run test:unit` passed: 49 files / 382 tests.
- `npm run check` passed.
- `npm run build` passed, with only existing Browserslist, Firebase mixed dynamic/static import, and chunk-size warnings.
- `git diff --check` passed.
- Headless Chromium compiled-CSS geometry at `320x740` showed the time heading text begins at `54.859375px` while the Back button ends at `44px`, so the title clears the Back button without vertical displacement. The same check showed the mobile Prep Tray ready slot exactly matched the hero (`320 x 132.796875`) and used `object-fit: cover`; screenshot evidence was saved at `/tmp/laica-eff028-compiled-css-mobile.png`.
- A paired compiled-CSS geometry check at `900x800` showed desktop remains full-bleed (`900 x 152` hero and slot, zero geometry delta, `object-fit: cover`).

DB-backed local E2E is not claimed. `npm run env:run -- npm run db:health` failed against the decrypted local database with missing tables `ai_interactions`, `prompt_versions`, `anonymous_recipe_usage`, `recipe_image_cache`, and missing column `cooking_sessions.recipe_snapshot`. Per `docs/workflows/testing-and-acceptance.md`, Codex did not run `db:push` against that database; exact-head GitHub `e2e_guest_smoke` or an equivalent prepared-schema E2E lane remains the merge-readiness gate after push.

Negative scope stayed intact: no provider, schema, prompt, durable navigation, Ticket Pass behavior, Ready Check behavior, Live Cooking behavior, image-generation/cache behavior, or recipe route changes. EFF-029 and EFF-030 were not started in this thread.
