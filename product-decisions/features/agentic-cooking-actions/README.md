# Agentic Cooking Actions

Agentic Cooking Actions is the feature decision area for [INIT-005](../../../initiatives/INIT-005-agentic-cooking-actions.md). It evolves Live Cooking's existing `Ask a question` flow into a guarded action surface for timer control, current-cook facts, pantry/profile corrections, recipe adaptation, restart/replan decisions, future voice access, and explicitly approved integrations.

This work originated as a Mobile Refresh Phase 4 extension but became an independent initiative on 2026-09-11. INIT-001 supplies the shipped Live Cooking baseline; remaining INIT-001 work does not sequence or own INIT-005.

The independent initiative and numbered plan merged through PR #363 as `b208ef28a686ae43045ee83712a7319d43a3e6f2`. Wilson authorized starting INIT-005 on 2026-09-24 after selecting a private production pilot using existing tap-to-talk. PR #367 merged the reviewed specification as `16b47bcc`; Closeout #368 merged as `45bd7e79`; [foundation PR #369](https://github.com/wmishak404/laica/pull/369) merged as `96ec567a` on 2026-10-07 after Wilson approval and exact-head CI/Replit evidence. See INIT-005 for the current resume point.

## Source Plan

- [Agentic Cooking Actions Plan](pd-agentic-cooking-actions-plan.md)

## Phase Index

| Phase | Scope | Status |
|---|---|---|
| 1 | [Action Foundation and Guardrails](pd-phase-01-action-foundation.md) | Complete; PR #369 merged |
| 2 | Timer Action Prototype | Next; ownership/contract audit |
| 3 | Session Facts and Pantry/Profile Corrections | Planned |
| 4 | Localized Recipe Patching and Final History | Planned |
| 5 | Restart/Replan and Safety Escalation | Planned |
| 6 | Voice Agent and Integration Interface | Planned |
| 7 | Controlled Rollout and Expansion | Planned |

Each implementation phase should add or update its own phase record in this folder when the phase needs detailed acceptance criteria, audit findings, product decisions, or validation state beyond the master plan.
