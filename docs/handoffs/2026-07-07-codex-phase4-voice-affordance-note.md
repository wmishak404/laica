# Phase 4 voice affordance design note

**Agent:** codex
**Branch:** codex/init-001-phase4-voice-affordance-note
**Date:** 2026-07-07
**Initiative:** INIT-001
**INIT updated:** yes

## Summary

Wilson's Replit review of the Live Cooking cockpit added a future design direction for the bottom-center `Ask a question` control. The preferred affordance is a Claude-style bottom-up glowing gradient that responds to user or agent voice activity, not a radial orb. This is INIT-001 Phase 4 Live Cooking design scope and should become its own implementation PR after the current cockpit/visual baseline is stable.

## Changes

- `product-decisions/features/mobile-refresh/pd-phase-04-cooking.md`
  - Adds a future voice activity affordance section with the design direction, state/amplitude guardrails, reduced-motion fallback, command-bar layout requirement, and validation expectation.
  - Adds the voice glow to Phase 4 acceptance criteria as future dedicated design PR scope.
- `initiatives/INIT-001-mobile-refresh.md`
  - Adds the direction to the Phase 4 resume point and chronology.
  - Corrects ownership as INIT-001 Phase 4, not INIT-004 eval work.
- `initiatives/registry.md`
  - Updates INIT-001's last signal to include the future `Ask a question` voice-activity glow PR.
- `docs/handoffs/2026-07-07-codex-phase4-voice-affordance-note.md`
  - Records this handoff.

## Impact on other agents

Do not fold this into the warm Live Cooking surface PR or step-preview grammar/runtime work unless Wilson explicitly redirects. A future branch should preserve the compact bottom command layout: Repeat on the left, `Ask a question` centered, and Audio on the right. The animation should be state-driven (`idle`, `listening`, `processing`, `speaking`), use amplitude only as progressive enhancement, and respect `prefers-reduced-motion`.

## Open items

- Build the actual voice affordance in a dedicated Phase 4 design PR.
- Validate it with rendered mobile visual/state evidence, ideally screenshots or short captured frames across idle/listening/speaking states.
- Decide exact color/gradient tokens during implementation against PD-005 and `design_guidelines.md`; this docs note records the direction, not final styling.

## Verification

Docs-only change. Verification performed:

- `git diff --check`

