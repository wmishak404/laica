# Slop Bowl Feature Phases

This folder tracks phase-by-phase decisions for the Slop Bowl feature.

## Phase Index

| Phase | Focus | Status | Primary docs |
|-------|-------|--------|--------------|
| 1 | Product direction and user flow | Accepted | [PD-002](../../002-slop-bowl.md), [phase-01-product-direction.md](phase-01-product-direction.md) |
| 2 | API, model, and implementation alignment | Resolved | [PD-003](../../003-openai-model-strategy.md), [phase-02-api-alignment.md](phase-02-api-alignment.md) |
| 3 | Simplified bowl & cooking steps enrichment | Accepted | [phase-03-simplified-bowl.md](phase-03-simplified-bowl.md) |
| 4 | Implementation coordination | In progress | Codex: `codex/slop-bowl-api`, Claude: `claude/slop-bowl-ui` |
| 5 | Validation and rollout | Pending | To be added before Replit end-to-end validation |

## Current state

- Product direction is accepted.
- Model strategy is accepted.
- All three Phase 2 alignment questions resolved by Wilson in Phase 3:
  - No rigid component structure — just make a good bowl from what's available
  - Cooking steps enriched with actual ingredients/equipment (not just recipe name)
  - Prompt-manager deferred to v2; hardcoded prompt for v1
  - Null-safe history fallback defined
- Ready for implementation. Codex owns server, Claude owns client.
