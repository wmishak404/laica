# Phase 3.1 kickoff audit

**Agent:** codex
**Branch:** codex/mobile-refresh-phase-3-1-kickoff
**Date:** 2026-05-14
**Initiative:** INIT-001
**INIT updated:** yes

## Summary

Phase 3.1 is now teed up as the next default Mobile Refresh agenda item without turning it into a blocker for Phase 4. This docs-only kickoff corrected the stale EFF-013/EFF-015 active-list assumptions, audited the current Phase 3 surfaces against Phase 3.1, PD-005, and `design_guidelines.md`, and recorded the accepted implementation slices so the first runtime branch can stay small.

## Changes

- `initiatives/INIT-001-mobile-refresh.md`: marks Phase 3.1 as kickoff/audit ready, records that EFF-013 and EFF-015 are resolved, keeps EFF-014 active, keeps EFF-017 deferred until the Phase 4 harness pilot, and updates the resume point so pantry spell correction is no longer treated as an active Effort.
- `initiatives/registry.md`: refreshes INIT-001's last signal around Phase 3.1 kickoff and current Effort status.
- `product-decisions/features/mobile-refresh/README.md`: updates Phase 3.1 status and clarifies that Phase 3.1 before Phase 4 is a soft sequence, not a hard dependency.
- `product-decisions/features/mobile-refresh/pd-phase-03-1-recipe-imagery.md`: adds the 2026-05-14 current-surface audit, accepted implementation slices, and first recommended UI slice.
- `docs/handoffs/2026-05-14-codex-phase-3-1-kickoff-audit.md`: captures this transfer note.

## Impact on other agents

Start Phase 3.1 implementation from fresh `origin/main` after this branch lands. The first recommended UI slice is Planning entry only: change the Slop path front-door title to `Slop It Up`, choose one approved supporting line at mount/page load, keep that line stable while mounted, italicize only that supporting line, and keep the durable `Slop Bowl` feature name everywhere else.

Do not reopen EFF-017 for this slice. EFF-017 stays deferred until a narrow Phase 4 harness pilot explicitly reopens it, and that pilot should not replace the Replit validation gate.

EFF-014 remains the active owner for broader scan-session duplicate/latest-scan refinement. Slop Bowl pantry-check visual alignment belongs to Phase 3.1 only where it overlaps Chef It Up Phase 3.2 chip/row grammar; preserve Slop Bowl's temporary-bowl behavior unless the phase record is explicitly amended.

## Open items

- Open the kickoff/audit PR and merge it only if the docs-only checks and GitHub checks are clean under Wilson's current instruction.
- First runtime follow-up should be the narrow Planning entry Slop It Up title/supporting-copy slice, not recipe imagery or broad UI rewrite.
- Replit validation is not required for this kickoff PR because no runtime behavior changes.

## Stack / base status

- Base refreshed: yes
- Current base: origin/main at `cb0f880fd4ce7d08b0ceb62f55912b9ca5566ebd`
- Last Replit-validated at: n/a - docs-only
- Notes: independent kickoff/audit branch from fresh `origin/main`; not stacked on another open PR.

## Verification

- Read required sources: `AGENTS.md`, INIT-001, Phase 3.1, PD-005, `design_guidelines.md`, Effort read lists/registry, recent handoffs, handoff workflow, documentation routing, and agent merge authority.
- Audited current Phase 3 code surfaces in `client/src/pages/app.tsx`, `client/src/components/cooking/meal-planning.tsx`, `client/src/components/cooking/slop-bowl.tsx`, and `client/src/index.css`.
- Confirmed no current `client/src` `className` token-equivalent `bg-[#...]`, `text-[#...]`, or `border-[#...]` utilities were found.
- Confirmed no `docs/handoffs/*-blocked.md` reports were present.
- `git diff --check` passed.
- Targeted stale-reference search found no current active-list references to resolved EFF-013 or EFF-015.
