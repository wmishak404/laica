# EPIC-002 and EPIC-003 Flow Fixes

**Agent:** codex
**Branch:** codex/epic-002-003-flow-fixes
**Date:** 2026-04-17

## Summary
Implemented the shippable portions of EPIC-002 and EPIC-003 together.

For EPIC-002, the welcome-screen CTA no longer forces returning users back through profiling. Users with enough saved setup to plan a meal now jump straight to the Planning choice screen from Home, while the broader Home-vs-Cook IA question remains open.

For EPIC-003, the Slop Bowl pantry-check screen now supports inline remove/add actions using ephemeral local state only. The edited list is sent through `pantryOverride` for bowl generation and regeneration, while permanent pantry changes still live in profile settings.

## Changes
- `client/src/pages/app.tsx`
  - Added a shared `hasPlanningProfile` helper for both initial routing and the welcome CTA.
  - Updated the welcome card copy/button for returning users.
  - Routing now treats `cookingSkill + weeklyTime + (pantry OR kitchen equipment)` as planning-ready.
- `client/src/components/cooking/slop-bowl.tsx`
  - Added ephemeral pantry item state, inline remove buttons, and a manual add input.
  - Prevents duplicate manual entries case-insensitively.
  - Sends the edited pantry list through `pantryOverride` on initial generation and regenerate-with-feedback.
  - Keeps `Edit pantry in profile` as the permanent-edit escape hatch.
- `epics/002-home-getstarted-routing.md`
  - Marked the epic `In Progress` and recorded the 2026-04-17 routing fix.
- `epics/003-slop-bowl-pantry-quick-actions.md`
  - Marked the epic `Resolved` and linked the implementation outcome.
- `epics/README.md` and `AGENTS.md`
  - Updated the repo-level open-epic indexes so EPIC-003 is no longer advertised as an open required-read item.
- `product-decisions/features/slop-bowl/phase-04-implementation-polish.md`
  - Added a dated revision note explaining how EPIC-003 narrowed and superseded the original read-only pantry-check decision.

## Impact on other agents
- EPIC-002 is only partially closed. The user-facing bug is fixed, but the Home vs Cook information architecture decision is still open and should not be silently collapsed without Wilson's call.
- EPIC-003 is implemented in a client-only way and does not require server changes. The existing `pantryOverride` contract is now actively exercised.
- EPIC-001 was intentionally deferred per product direction. While touching these flows, no new governance system work was introduced.

## Open items
- Replit validation is still needed before any deployment-bound merge:
  - Firebase sign-in
  - Home -> Start Planning returning-user flow
  - Slop Bowl pantry-check remove/add behavior
  - Slop Bowl generate + regenerate paths
  - cooking-session persistence
  - feedback writes
  - ElevenLabs-backed speech routes
- Wilson still needs to decide the long-term Home/Cook direction before EPIC-002 can be resolved.

## Verification
- `npm ci`
- `npm run check`
- `npm run build`

Local result:
- `npm ci` completed successfully in this worktree
- Typecheck passed
- Production build passed
- Existing Vite warnings about dynamic imports / chunk size remain unchanged
