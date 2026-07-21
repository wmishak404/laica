# EFF-034: Production-readiness mobile P2 cleanup

**Status:** Open
**Priority:** After pre-production blockers; preserve for the next readiness closeout
**Owner:** Wilson / Codex / Claude
**Created:** 2026-07-20
**Updated:** 2026-07-20
**Linked Initiative:** [INIT-001 - Mobile Refresh](../initiatives/INIT-001-mobile-refresh.md)
**Related docs:** [Phase 2.2 Returning Setup / Settings](../product-decisions/features/mobile-refresh/pd-phase-02-2-returning-setup-settings.md), [Phase 4 Cooking](../product-decisions/features/mobile-refresh/pd-phase-04-cooking.md), [production-readiness follow-up](../docs/handoffs/2026-07-20-codex-production-readiness-effort-routing.md)

## One-line summary

Preserve the two lower-severity mobile readiness findings: Reset should return a timer to Start, and the Settings hub should not have a large blank scroll tail.

## Context

The 2026-07-17 production-readiness pass found two P2 issues that do not independently block production but should not disappear after the higher-priority fixes:

1. After starting and resetting a 30-second Live Cooking timer, the full paused timer was labeled `Resume timer` instead of returning to `Start 30 second timer`.
2. At app-reported `390x844`, the Settings hub had `documentElement.scrollHeight: 1020` with only `844px` of visible height, producing a large empty/inert tail below the actual cards.

Wilson asked on 2026-07-20 that both findings be saved in a separate related Effort.

![Settings hub blank mobile tail at 390x844](../docs/assets/mobile-refresh/2026-07-20-codex-settings-root-blank-scroll-390x844.jpg)

## Scope

- Live Cooking timer semantics:
  - Distinguish never-started/reset state from paused state.
  - Make Reset return the primary action to `Start <duration> timer`.
  - Preserve Pause, Resume, Time's up, and Restart behavior.
- Settings hub mobile fit:
  - Remove duplicate/unowned bottom clearance that creates a large blank scroll tail.
  - Preserve necessary Cook/Menu nav and safe-area clearance.
  - Verify Settings hero/cards, Back, and bottom navigation remain usable.
- Capture a timer Reset before/after screenshot during implementation and preserve the current Settings screenshot plus its replacement.

Out of scope:

- Returning inventory action-dock overlap/opacity; [EFF-033](effort-033-returning-settings-inventory-action-dock.md) owns that pre-production work.
- First-time setup camera sizing; [EFF-032](effort-032-setup-inventory-camera-compact-fit.md) owns that follow-up.
- Timer duration extraction, server schema/provider changes, bottom-nav IA, or broader Settings redesign.

## Decisions made so far

- Keep both findings P2; neither is a production blocker by itself.
- Use one Effort because Wilson explicitly requested one related P2 record, the two findings came from the same release pass, and their combined Settings/Live Cooking scope has no single phase owner without splitting the accepted follow-up across closed Phase 2.2 and active Phase 4.
- Do not let Settings action-dock work silently absorb the Settings hub tail. Coordinate shared padding changes with EFF-033, but keep acceptance separate.

## Open questions

- Does timer state need an explicit `hasTimerStarted` flag, or can the existing state machine derive reset-vs-paused without duplicated state?
- Which wrapper currently owns the extra Settings height: `.returning-ui`, the app-shell main padding, or both?
- Should these two corrections ship together or as two small commits/PRs under the same Effort?

## Agent checklist

- [ ] Start from fresh `origin/main` and inspect open PR ownership for Live Cooking and Settings layout.
- [ ] Read PR #269 timer history, Phase 4, Phase 2.2, EFF-033, and the production-readiness follow-up.
- [ ] Add Start -> Pause -> Resume and Start -> Reset -> Start timer assertions.
- [ ] Measure Settings hub document/visual viewport height and necessary bottom-nav/safe-area clearance at `390x844` and `412x915`.
- [ ] Preserve before/after screenshots, including a new timer screenshot during implementation.
- [ ] Run focused timer/Settings tests, full unit, check, build, exact-head E2E, and proportionate mobile validation.

## Resolution criteria

1. Reset returns a fresh full timer to the Start label; Pause still returns Resume; completed timers still offer Restart.
2. The Settings hub has no large empty scroll tail beyond the clearance actually needed for the app nav and safe area.
3. No Live Cooking timer behavior, Settings navigation, or bottom-nav interaction regresses.
4. Before/after screenshots and exact viewport measurements are linked from the implementation handoff.

## 2026-07-20 - Effort filed from production-readiness review

Wilson accepted the P2 severity and asked that both lower-priority findings remain discoverable in a related Effort while pre-production Settings and guest-Finish work proceeds separately.
