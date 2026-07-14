# EFF-028: Chef It Up time-step title clearance

**Status:** Open
**Owner:** Wilson / Codex / Claude
**Created:** 2026-07-14
**Linked Initiative:** [INIT-001 - Mobile Refresh](../initiatives/INIT-001-mobile-refresh.md)
**Related docs:** [Phase 3 Planning](../product-decisions/features/mobile-refresh/pd-phase-03-planning.md), [Phase 3.1 Design Facelift](../product-decisions/features/mobile-refresh/pd-phase-03-1-recipe-imagery.md), [PD-005 UI Governance](../product-decisions/pd-005-ui-governance.md), [design guidelines](../design_guidelines.md)

## One-line summary

Give the Chef It Up time-selection title enough horizontal inset that the floating Back button does not cover the headline on narrow mobile viewports.

## Context

Wilson's 2026-07-14 mobile Safari/Replit screenshots show the Chef It Up time-selection step, `How much time do you have today?`, starting too far left under the floating circular Back button. The title is shorter than some other Chef It Up headings, but its current line break and horizontal position make the first words visually collide with the Back affordance.

The desired direction is the layout posture used by adjacent Chef It Up process screens such as `What sounds good?` and `Anything else around?`: keep the title centered in the usable content area with more horizontal page margin. Wilson explicitly prefers horizontal title inset over shifting the whole page downward, because pushing the page down would cost vertical real estate and further compress the flow.

This is a small visual-fit follow-up tied to the Mobile Refresh Phase 3 Planning surface. It does not change Chef It Up behavior, Live Cooking behavior, navigation semantics, prompt/provider behavior, schema, or rate limits.

Sequencing note from Wilson: do this implementation after Codex thread `019f3b47-9d04-7a03-8973-2a9cd1bb19b4` finishes its current work.

## Scope

- Adjust the Chef It Up time-selection heading/layout so the floating Back button no longer covers the title on narrow mobile widths.
- Preserve the existing vertical rhythm as much as possible; do not solve this by moving the whole page lower.
- Use the adjacent `What sounds good?` and `Anything else around?` Chef It Up screens as the visual comparison target for centered title posture and horizontal margin.
- Keep the Back button visible and tappable.
- Prefer the existing MealPlanning/page-header patterns, tokens, and scoped CSS over a one-off visual hack.
- Verify on a representative mobile viewport that the heading fits, wraps cleanly, and clears the Back button without shrinking or overlapping the rest of the time-step controls.

Out of scope:

- Redesigning the Chef It Up flow.
- Changing the time-slider options, cuisine choices, staple queue, Ticket Pass, Prep Tray, Ready Check, or Live Cooking.
- Changing durable navigation surfaces.
- Adding new copy or explanatory UI.
- Reworking the whole Phase 3.1 visual facelift.

## Decisions made so far

- Use horizontal inset/centering for the time-step title rather than vertical displacement.
- Treat the comparison screens as `What sounds good?` and `Anything else around?`, not the current covered time-title screenshot.
- Keep this as a standalone implementation follow-up linked to INIT-001. Filing this Effort does not change INIT-001 phase status or current resume point.
- Sequence implementation after Codex thread `019f3b47-9d04-7a03-8973-2a9cd1bb19b4` completes its current work.

## Open questions

- Should the implementation use a shared Chef It Up process-heading rule for all pre-suggestion screens, or a narrower time-step override if the other screens are already correct?
- What is the smallest mobile breakpoint/inset that clears the current floating Back button while preserving the intended centered headline?

## Agent checklist

- [ ] Confirm Codex thread `019f3b47-9d04-7a03-8973-2a9cd1bb19b4` has completed its current work before implementation.
- [ ] Read this Effort, INIT-001, Phase 3 Planning, Phase 3.1, PD-005, and `design_guidelines.md` before implementation.
- [ ] Inspect the current Chef It Up time, cuisine, and extra-ingredients process-heading markup/CSS before choosing a shared or local fix.
- [ ] Implement the smallest tokenized/scoped layout change that clears the Back button without pushing the whole page down.
- [ ] Verify a narrow mobile viewport visually against the time screen and adjacent Chef It Up screens.
- [ ] Include screenshot or Playwright/browser evidence in the PR/handoff, plus negative scope for unchanged flow behavior.

## Resolution criteria

1. On the Chef It Up time-selection screen, `How much time do you have today?` is visually centered within the usable content area and no longer sits under or behind the floating Back button on a representative mobile viewport.
2. The page does not compensate by shifting the full content column downward in a way that materially reduces vertical real estate.
3. `What sounds good?` and `Anything else around?` remain visually aligned or improve through the same shared heading rule if one is used.
4. Back navigation, time selection, cuisine selection, suggestion generation, Prep Tray, and Live Cooking behavior remain unchanged.
5. The implementation PR records visual evidence, exact validation commands or browser checks, and remaining unvalidated scope.

## 2026-07-14 - Effort filed

Codex filed this Effort from Wilson's screenshot-backed request. Wilson then clarified that implementation should wait until Codex thread `019f3b47-9d04-7a03-8973-2a9cd1bb19b4` finishes its current work. No runtime implementation has started. Future implementation should happen in a fresh Codex- or Claude-owned branch and cite this Effort plus INIT-001.
