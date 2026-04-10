# PD-004: Feature Phase Decision Records

**Date:** 2026-04-09
**Status:** Accepted
**Decision maker:** Wilson

## Context

The current documentation split has two strong tools with a gap between them:

- `docs/handoffs/` captures agent-to-agent work state, branch context, and immediate next actions.
- Top-level product decisions capture durable accepted outcomes.

Active feature work still needs a middle layer. Features like Slop Bowl accumulate evolving decisions across discovery, API design, implementation alignment, and rollout. Those details are too durable for a handoff but too fluid for a single top-level product decision.

## Decision

Add a **feature phase record** layer under `product-decisions/features/<feature>/`.

Each active feature folder should track decisions by phase:

1. Product direction
2. API and architecture alignment
3. Implementation coordination
4. Validation and rollout

### Documentation roles

| Artifact | Purpose |
|----------|---------|
| `docs/handoffs/` | Branch-specific conversation, ownership, review notes, and next steps between agents |
| `product-decisions/features/<feature>/` | Evolving feature decisions, open questions, and phase-by-phase alignment during delivery |
| Top-level `PD-xxx` files | Durable accepted product or technical decisions that should remain easy to find later |

### Working rules

- Agents may update feature phase records as part of normal implementation and review work.
- When a phase doc contains an unresolved question, link the relevant handoff so the discussion remains easy to follow.
- When a decision becomes durable beyond one phase or feature, promote it to a top-level `PD-xxx` file.
- If a change would alter product direction, require human judgment, or affect security/secrets, stop the automatic update flow and ask Wilson to review.

## Alternatives considered

| Alternative | Why rejected |
|-------------|-------------|
| Use handoffs only | Handoffs are great for discussion but too branch-specific for long-lived feature context |
| Put everything in top-level PDs | Makes durable decisions harder to find and mixes accepted outcomes with in-progress alignment |
| Keep one giant feature spec doc | Becomes noisy over time and makes phase boundaries unclear |

## Implementation notes

- Initial rollout starts with `product-decisions/features/slop-bowl/`
- Top-level PDs remain the source of truth for accepted feature-wide and cross-cutting decisions
