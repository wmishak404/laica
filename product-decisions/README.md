# Product Decisions

This folder documents key product and technical decisions for the Laica project. Each decision is recorded so that any contributor can understand **what** was decided, **why**, and **what alternatives** were considered.

## How to Use

- Before making a significant product or architectural decision, check if a similar decision already exists here
- When making a new decision, create a file following the naming convention: `NNN-short-description.md`
- Use the existing documents as a template for structure and level of detail
- Use top-level `PD-xxx` files for durable accepted decisions that should outlive a single branch or implementation phase
- Use `product-decisions/features/<feature>/` for phase-by-phase feature decision records, open alignment questions, and evolving implementation notes during active development

## Index

| ID | Title | Date | Status |
|----|-------|------|--------|
| [PD-001](001-secrets-management.md) | Secrets Management with dotenvx | 2026-04-07 | Accepted |
| [PD-002](002-slop-bowl.md) | Slop Bowl — Zero-Decision Cooking Path | 2026-04-09 | Accepted |
| [PD-003](003-openai-model-strategy.md) | OpenAI Model Strategy — Tiered Model Selection | 2026-04-09 | Accepted |
| [PD-004](004-feature-phase-records.md) | Feature Phase Decision Records | 2026-04-09 | Accepted |
| [PD-006](006-home-and-cook-remain-separate.md) | Home and Cook remain separate navigation surfaces | 2026-04-17 | Superseded by PD-009 |
| [PD-007](007-epic-status-and-registry-workflow.md) | Epic status and registry workflow | 2026-04-21 | Accepted |
| [PD-008](008-optional-context-and-local-validation-boundaries.md) | Optional context and local validation boundaries | 2026-04-27 | Accepted |
| [PD-009](009-mobile-refresh-navigation.md) | Mobile refresh consolidates authenticated entry into Planning | 2026-04-28 | Accepted |

## Feature Phase Records

Active feature work often has decisions that evolve across discovery, API design, implementation, and validation. Those do not fit perfectly in a handoff or a single top-level PD.

- Handoffs carry agent-to-agent work state, branch context, and immediate next steps
- Feature phase records carry the current decision log for one feature as it moves through delivery
- Top-level PDs capture durable accepted outcomes that should stay easy to find later

Current feature phase folders:

- [Slop Bowl](features/slop-bowl/README.md)
- [Mobile Refresh](features/mobile-refresh/README.md)
