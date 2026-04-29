# Mobile Refresh Phase 1 — Auth and First Authenticated Routing

**Status:** Accepted
**Phase owner:** Wilson
**Date:** 2026-04-28
**Initiative:** [INIT-001 — Mobile Refresh](../../../initiatives/INIT-001-mobile-refresh.md)
**Mockup:** [phase-01-auth.png](../../../docs/assets/mobile-refresh/phase-01-auth.png)

## Goal

Make the first screen feel like a native mobile app instead of a desktop website, and remove redundant routing after login.

## Decisions

- Pre-auth page uses a simple app-start layout with logo/brand, minimal copy, and one primary Google sign-in action.
- Remove website-style header, footer, large marketing sections, and demo-stage language.
- Replace long descriptions with a small bottom link: "What can you help me do?"
- The future info modal can reuse today's three capability labels: Personalized Profiles, Smart Pantry Recognition, Live Cooking Guidance.
- After login, route by user state:
  - incomplete or first-time user -> Setup
  - complete user -> Planning
- Remove the authenticated Home tab as a redundant step.
- This phase implements [PD-009](../../009-mobile-refresh-navigation.md), which supersedes [PD-006](../../006-home-and-cook-remain-separate.md).

## Acceptance Criteria

- Pre-auth screen has no website header/footer chrome on mobile.
- "Demo" or "Try Demo" language no longer appears in the primary auth flow.
- Continue with Google signs in successfully.
- Fresh account lands directly in Setup.
- Returning complete account lands directly in Planning.
- Returning incomplete account lands in Setup and cannot bypass required setup.
- Bottom navigation no longer exposes a redundant Home surface in the refreshed authenticated flow.

## Epic Interactions

- EPIC-001: New auth surface must use existing tokens/icons/type primitives and avoid ad hoc hex literals.
- EPIC-005: Readiness depends on manual Replit smoke for Firebase sign-in and routing states.

## Open Questions

- The "What can you help me do?" animated modal is intentionally parked unless implementation capacity allows it after the core flow ships.
