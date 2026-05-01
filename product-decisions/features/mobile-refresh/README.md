# Laica Mobile Refresh Feature Phases

**Initiative:** [INIT-001 — Mobile Refresh](../../../initiatives/INIT-001-mobile-refresh.md)

This folder records the approved planning for the Laica mobile-refresh work. It is the source of truth for implementation sequencing after Wilson's phase-by-phase review and Claude's planning review.

## Phase Index

| Phase | Focus | Status | Primary docs | Mockups |
|-------|-------|--------|--------------|---------|
| 0 | Cross-phase security and backend readiness | Accepted | [phase-00-cross-phase-security.md](phase-00-cross-phase-security.md), [cross-phase-ai-privacy.md](cross-phase-ai-privacy.md) | None |
| 1 | Auth and first authenticated routing | Accepted | [phase-01-auth.md](phase-01-auth.md), [PD-009](../../009-mobile-refresh-navigation.md) | [Auth mockup](../../../docs/assets/mobile-refresh/phase-01-auth.png) |
| 2 | Setup: pantry, kitchen, profile | Accepted | [phase-02-setup.md](phase-02-setup.md) | [Setup mockup](../../../docs/assets/mobile-refresh/phase-02-setup.png) |
| 2.1 | Setup polish: trust, privacy, scan safeguards, and visual conformance | Accepted / Merged PR #27 | [phase-02-1-setup-polish.md](phase-02-1-setup-polish.md) | [Setup mockup](../../../docs/assets/mobile-refresh/phase-02-setup.png) |
| 2.2 | Returning setup, Settings, and History IA | Accepted / In Progress | [phase-02-2-returning-setup-settings.md](phase-02-2-returning-setup-settings.md) | [Phase 2.2 storyboard](../../../docs/assets/mobile-refresh/phase-02-2-returning-setup-settings-storyboard.svg) |
| 3 | Planning: Chef It Up, Slop Bowl, Ticket Pass | Accepted | [phase-03-planning.md](phase-03-planning.md) | [Planning flow](../../../docs/assets/mobile-refresh/phase-03-planning-flow.png), [Ticket Pass](../../../docs/assets/mobile-refresh/phase-03-ticket-pass.png) |
| 4 | Cooking guidance | Accepted | [phase-04-cooking.md](phase-04-cooking.md) | [Cooking mockup](../../../docs/assets/mobile-refresh/phase-04-cooking.png) |
| 5 | Post-cook cleanup and retention | Accepted | [phase-05-post-cook.md](phase-05-post-cook.md) | [Post-cook mockup](../../../docs/assets/mobile-refresh/phase-05-post-cook.png) |

## Implementation Sequence

1. Ship Phase 0 security/backend readiness first.
2. Implement Phase 1 and Phase 2 together or in tight sequence because routing depends on setup completion.
3. Phase 2.1 has shipped the setup visual/trust polish after Phase 2 closed functionally.
4. Implement Phase 2.2 from fresh `main` before Phase 3 so returning setup edits, Menu, Settings, and standalone History match the accepted mobile-refresh design direction.
5. Implement Phase 3 after Phase 2.2 so Slop Bowl and Planning links do not route into legacy Settings UI.
6. Implement Phase 4 after authenticated AI routes and session ownership checks are live.
7. Implement Phase 5 only after the pantry-write moments are explicit and Phase 4 completion no longer mutates pantry; Phase 5 owns the richer History share/cook-again/retention behavior.

## Mockup Conformance Gate

For every mobile-refresh phase with linked mockups, the mockups are implementation inputs, not loose inspiration. A phase PR should carry the visible design direction of its primary surfaces: hierarchy, spacing, density, CTA prominence, control shape, motion/illustration where specified, tone, and escape/back affordances.

A phase PR is not ready when the behavior is implemented but the main screens still read as the pre-refresh UI, unless the visual work is explicitly documented as deferred scope in the phase record and handoff before validation starts. Reviewers should compare the implemented primary screens with the linked mockups during smoke testing, not only run deterministic checks.

If a later phase depends on an earlier surface that still has visual drift, record whether the later phase owns that polish or whether a separate Phase 2.x/3.x polish pass owns it. The goal is to avoid repeating the Phase 2 gap where camera-first behavior landed before the setup flow matched the approved visual direction.

## Cross-Phase Validation Follow-Up

Phase 2 validation exposed a recurring gap: agents can run deterministic checks, but authenticated UI smoke still depends on a human completing Google sign-in. The planned [dev-test harness](dev-test-harness.md) records the future direction for real Firebase custom-token dev auth and hybrid service-backed smoke.

This follow-up should not block PR #23. If manual sign-in continues slowing Phase 3-5 validation, prioritize the harness before repeating the same smoke bottleneck across later phases.

## Out of Scope

- Replacing TanStack Query, wouter, Firebase, or the OpenAI prompt-version model.
- Adding non-Google OAuth providers.
- Account deletion, GDPR export, or broader profile administration.
- Realtime voice-agent cooking.
- Quantitative pantry tracking.
- Full Cook Again Hub.
- Dropping the legacy `weekly_time` DB column in the same cycle as the UI removal.

## Design Principles

- Mobile-native first: no website chrome on core app flows.
- Camera-first where scanning is the value moment.
- Thumb-zone actions for primary decisions.
- Warm, coral-led palette with tokenized colors and no ad hoc hex literals.
- Full-row selection controls on mobile choice surfaces.
- Recipe suggestions should feel like Laica, not generic AI cards with percentage matches.
- User-facing brand copy should use `Laica`, not all-caps `LAICA`.
- The app should reduce decision load without hiding safety-critical confirmations.
- Menu is the global destination surface for returning users; Settings and History are separate destinations, not one combined admin tab.

For visual identity beyond these UX principles, read the draft [Mobile Refresh Design Language](design-language.md) and [EPIC-012 — Laica Design Language & Visual Identity](../../../epics/012-laica-design-language.md). Mobile-refresh implementation should use these alongside the linked mockups and EPIC-001: the design-language draft defines the target look and feel, EPIC-001 governs consistent implementation, and the phase records define surface-specific acceptance.
