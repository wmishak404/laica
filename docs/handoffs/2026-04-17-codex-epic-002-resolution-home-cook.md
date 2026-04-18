# EPIC-002 Resolution — Home and Cook Stay Separate

**Agent:** codex
**Branch:** codex/epic-002-003-flow-fixes
**Date:** 2026-04-17

## Summary
Recorded Wilson's final product decision for the remaining EPIC-002 question: Home and Cook should stay separate.

The deciding rationale is that Cook is already disabled during the first-time-user experience until profile setup is complete, so the overlap concern does not justify navigation consolidation. With that decision captured in a durable product-decision doc and the Home Dashboard spec marked aspirational/deferred, EPIC-002 can now be resolved.

## Changes
- `product-decisions/006-home-and-cook-remain-separate.md`
  - New accepted product decision documenting that Home and Cook remain separate surfaces.
- `product-decisions/README.md`
  - Added PD-006 to the index.
- `design_guidelines.md`
  - Marked the Home Dashboard section as deferred / aspirational under the accepted current IA.
- `epics/002-home-getstarted-routing.md`
  - Marked the epic `Resolved`.
  - Added the final product decision, linked PD-006, and recorded the resolution note.
- `epics/README.md`, `AGENTS.md`, `CLAUDE.md`
  - Removed EPIC-002 from the open-epic lists because it is no longer an active required-read item.

## Impact on other agents
- EPIC-002 is no longer open. Future work should not reopen the Home-vs-Cook consolidation question by default.
- If richer Home dashboard work becomes active later, it should be tracked as new work rather than assuming EPIC-002 is still pending.
- The current accepted IA is:
  - Home remains the landing/welcome surface
  - Cook remains the planning entry
  - Cook stays disabled until the profile is set up

## Open items
- No new code changes were made in this pass.
- The broader UI-governance and testing-strategy epics remain open separately.

## Verification
- No runtime verification was run in this pass.
- This pass records Wilson's accepted product direction and reconciles the planning docs around it.
