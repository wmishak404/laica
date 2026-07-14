# EFF-028: Chef It Up mobile visual clearance

**Status:** Open
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

- Should the implementation use a shared Chef It Up process-heading rule for all pre-suggestion screens, or a narrower time-step override if the other screens are already correct?
- What is the smallest mobile breakpoint/inset that clears the current floating Back button while preserving the intended centered headline?
- Is the mobile Prep Tray image gutter caused by responsive CSS around `.planning-prep-hero`, the prep image slot dimensions, inherited ticket image-slot sizing, Safari image rendering, or a later wrapper/layout change from the large release branch?
- Should the mobile ready-image hero height exactly match the desktop ratio, or only preserve the full-bleed/no-inner-border behavior within the current mobile hero height?

## Agent checklist

- [ ] Confirm Codex thread `019f3b47-9d04-7a03-8973-2a9cd1bb19b4` has completed its current work before implementation.
- [ ] Read this Effort, INIT-001, Phase 3 Planning, Phase 3.1, PD-005, and `design_guidelines.md` before implementation.
- [ ] Inspect the current Chef It Up time, cuisine, and extra-ingredients process-heading markup/CSS before choosing a shared or local fix.
- [ ] Inspect the current Prep Tray image markup/CSS and PR #208-era intent before changing image sizing.
- [ ] Implement the smallest tokenized/scoped layout change that clears the Back button without pushing the whole page down.
- [ ] Implement the smallest tokenized/scoped image-layout change that makes a ready selected Prep Tray image fill the mobile hero area without altering provider/image-generation behavior.
- [ ] Verify a narrow mobile viewport visually against the time screen, adjacent Chef It Up screens, and a Prep Tray with a ready selected image.
- [ ] Verify desktop Prep Tray remains full-bleed and does not regress while fixing mobile.
- [ ] Include screenshot or Playwright/browser evidence in the PR/handoff, plus negative scope for unchanged flow behavior.

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
