# PD-006: Home and Cook remain separate navigation surfaces

**Date:** 2026-04-17
**Status:** Superseded by [PD-009](009-mobile-refresh-navigation.md)
**Decision maker:** Wilson

> Superseded on 2026-04-28 by the mobile-refresh navigation direction. The earlier decision remains as historical context for EPIC-002, but implementation should follow [PD-009](009-mobile-refresh-navigation.md).

## Context

EPIC-002 captured two related issues:

1. Returning users should not be forced back through the first-time profile builder from Home
2. Home and Cook appeared to overlap conceptually, raising the question of whether they should be consolidated

The first issue was implemented separately by routing returning users from Home directly into the planning-choice screen. The remaining product question was whether the bottom navigation should still keep Home and Cook as separate entries.

During follow-up review, Wilson checked the first-time-user experience and confirmed that **Cook is already grayed out / disabled until the profile is set up**. That means users who have not completed setup are not able to bypass onboarding via Cook, which removes the main concern behind consolidation.

## Decision

Keep **Home** and **Cook** as separate navigation surfaces.

- **Home** remains the landing / welcome surface
- **Cook** remains the action-oriented planning entry point
- **Cook stays disabled** during the first-time-user experience until the profile is sufficiently set up
- No bottom-nav consolidation is required at this time

## Rationale

- The core confusion case is already mitigated because incomplete-profile users cannot use Cook yet
- This preserves the current mental model without introducing avoidable navigation churn
- The returning-user routing fix already solves the practical usability bug that triggered EPIC-002
- It avoids forcing a larger IA change when the current separation is acceptable in practice

## Alternatives considered

| Alternative | Why not chosen |
|-------------|----------------|
| Merge Home and Cook into one tab | Unnecessary churn now that Cook is already gated during first-time setup |
| Make Home a redirect-only shell and push everyone to Cook | Solves overlap by collapsing roles too aggressively; not needed for current behavior |
| Build the full richer Home dashboard immediately | Still possible later, but not required to resolve the current routing/navigation question |

## Consequences

- EPIC-002 can resolve once the accepted direction is recorded and linked
- The current bottom-nav structure stays in place
- The richer "Home Dashboard" concept in `design_guidelines.md` is a future / aspirational direction, not a currently required implementation target
- If Home later grows into a richer dashboard experience, that should be tracked as a new work item rather than reopening the resolved Home-vs-Cook consolidation question by default

## 2026-04-28 Supersession

The mobile-refresh planning work changed the app's authenticated information architecture. Wilson approved removing the redundant authenticated Home step so first-time users route directly to Setup and returning complete users route directly to Planning. See [PD-009](009-mobile-refresh-navigation.md) and [Mobile Refresh Phase 1](features/mobile-refresh/phase-01-auth.md).
