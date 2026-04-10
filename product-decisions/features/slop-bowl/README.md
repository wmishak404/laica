# Slop Bowl Feature Phases

This folder tracks phase-by-phase decisions for the Slop Bowl feature.

## Phase Index

| Phase | Focus | Status | Primary docs |
|-------|-------|--------|--------------|
| 1 | Product direction and user flow | Accepted | [PD-002](../../002-slop-bowl.md), [phase-01-product-direction.md](phase-01-product-direction.md) |
| 2 | API, model, and implementation alignment | In review | [PD-003](../../003-openai-model-strategy.md), [phase-02-api-alignment.md](phase-02-api-alignment.md) |
| 3 | Implementation coordination | Pending | To be added when API and client contracts stabilize |
| 4 | Validation and rollout | Pending | To be added before Replit end-to-end validation |

## Current state

- Product direction is accepted.
- Model strategy is accepted.
- API and workflow alignment still has open questions around prompt-manager scope, instruction handoff into `LiveCooking`, and fallback handling for sparse cooking history.
- Cross-agent discussion for the current review lives in `docs/handoffs/2026-04-09-claude-slop-bowl-plan.md` and `docs/handoffs/2026-04-09-codex-slop-bowl-doc-review.md`.
