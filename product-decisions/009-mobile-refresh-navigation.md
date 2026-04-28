# PD-009: Mobile refresh consolidates authenticated entry into Planning

**Date:** 2026-04-28
**Status:** Accepted
**Decision maker:** Wilson
**Supersedes:** [PD-006](006-home-and-cook-remain-separate.md)

## Context

The mobile-refresh planning work revisited the pre-auth and first authenticated surfaces after user feedback that Laica felt like a desktop website wrapped in a mobile viewport. The previous Home/Cook separation was acceptable for the earlier app shape, but the new direction makes the first screen after sign-in action-oriented and setup-aware.

## Decision

Consolidate the authenticated Home/Cook entry so users land directly where their state says they should go:

- Fresh or incomplete users go directly into Setup.
- Returning setup-complete users go directly into Planning.
- The redundant authenticated Home tab is removed from the mobile-refresh implementation.
- Planning becomes the primary authenticated start surface.

## Rationale

- The app should feel like a native mobile tool, not a website with a header, footer, and landing page after login.
- First-time users do not need a separate "Start Planning" step when setup is the obvious next action.
- Returning users should be put back into the meal-planning task quickly.
- This reduces one of the highest-friction steps before users receive value.

## Alternatives considered

| Alternative | Why not chosen |
|-------------|----------------|
| Keep Home and Cook separate | Directly conflicts with the approved mobile-native flow and keeps the redundant post-login step |
| Keep Home as a redirect-only shell | Adds implementation surface without user value |
| Build a richer Home dashboard now | Potentially useful later, but outside the current mobile-refresh goal |

## Consequences

- [PD-006](006-home-and-cook-remain-separate.md) is superseded.
- Phase 1 implementation must update routing, bottom navigation, and onboarding gates together.
- Any future "Home Dashboard" should be scoped as a new feature rather than reviving the old Home/Cook split by default.
