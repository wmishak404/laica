# Product Decisions

This folder documents key product, technical, process, and governance decisions for the Laica project. Each top-level `PD-xxx` file should let a future contributor understand **what** was decided, **why**, **what alternatives were rejected**, and **when the decision applies**.

## How to Use

- Before making a significant product or architectural decision, check if a similar decision already exists here
- When making a new decision, create a file following the naming convention: `pd-NNN-short-description.md`
- Use top-level `PD-xxx` files only for durable accepted decisions that should outlive a single branch or implementation phase
- Use `product-decisions/features/<feature>/` for phase-by-phase feature decision records, open alignment questions, and evolving implementation notes during active development
- If a product decision materially affects an active initiative, add a `Related Initiatives` section linking the relevant INIT and update that INIT's source docs or chronology

## Top-Level PD Rubric

A new top-level PD should pass all three gates:

1. **Durability:** the decision matters after the branch or phase merges.
2. **Decision leverage:** future agents would make worse choices without the rationale.
3. **Alternatives rejected:** there was a real fork where Wilson or the team chose one path over others.

Top-level PDs are stable records with controlled amendments, not living diaries:

- Add a short dated amendment when the core decision still stands but needs clarification.
- Use `Open follow-ups` for enforcement or implementation work still pending.
- Mark the file `Superseded by PD-XXX` when a later decision replaces it.
- Create a new PD when a materially new durable decision emerges.

Do **not** promote these to top-level PDs:

- Visual tokens, palette, typography, and surface posture rules: update [`../design_guidelines.md`](../design_guidelines.md).
- Phase-specific acceptance criteria: keep them in the feature phase record.
- Implementation logs, validation timelines, branch context, or who-does-what-next notes: write a handoff.
- Deferred work with a linked active Effort: keep it in the phase/feature record and the Effort.
- In-flight standalone enforcement or rollout work: track it in an active Effort until the stable rule itself changes.

Governance PDs define stable rules; active Efforts carry standalone enforcement, rollout, and evidence-gathering work. When a rule is settled, it lives in a PD. When the work belongs to an active initiative or workflow, update that INIT or workflow doc instead of creating an Effort.

README files remain folder indexes. All other markdown files in this tree use a `pd-` filename prefix so they are easy to recognize in diffs, search results, and agent chat windows.

Recommended metadata near the top of each top-level PD:

```markdown
**Type:** Product/UX | Technical/Architecture | Process | Governance
**Scope:** Global | Feature | Initiative | Surface
**Applies when:** <short trigger>
```

## Product / UX

| ID | Title | Date | Status |
|----|-------|------|--------|
| [PD-002](pd-002-slop-bowl.md) | Slop Bowl - Zero-Decision Cooking Path | 2026-04-09 | Accepted |
| [PD-009](pd-009-mobile-refresh-navigation.md) | Mobile refresh consolidates authenticated entry into Planning | 2026-04-28 | Accepted |
| [PD-011](pd-011-scan-upload-photo-limit-policy.md) | Scan upload photo limit policy | 2026-05-08 | Accepted |

## Technical / Architecture

| ID | Title | Date | Status |
|----|-------|------|--------|
| [PD-001](pd-001-secrets-management.md) | Secrets Management with dotenvx | 2026-04-07 | Accepted |
| [PD-003](pd-003-openai-model-strategy.md) | OpenAI Model Strategy - Tiered Model Selection | 2026-04-09 | Accepted |
| [PD-008](pd-008-optional-context-and-local-validation-boundaries.md) | Optional context and local validation boundaries | 2026-04-27 | Accepted |

## Process / Governance

| ID | Title | Date | Status |
|----|-------|------|--------|
| [PD-004](pd-004-feature-phase-records.md) | Feature Phase Decision Records | 2026-04-09 | Accepted |
| [PD-005](pd-005-ui-governance.md) | UI Governance Operating Model | 2026-05-02 | Accepted |
| [PD-007](pd-007-effort-status-and-registry-workflow.md) | Effort status and registry workflow | 2026-04-21 | Accepted |

## Superseded

| ID | Title | Date | Status |
|----|-------|------|--------|
| [PD-006](pd-006-home-and-cook-remain-separate.md) | Home and Cook remain separate navigation surfaces | 2026-04-17 | Superseded by PD-009 |

## Feature Phase Records

Active feature work often has decisions that evolve across discovery, API design, implementation, and validation. Those do not fit perfectly in a handoff or a single top-level PD.

- Handoffs carry agent-to-agent work state, branch context, and immediate next steps
- Feature phase records carry phase-scoped decisions, specs, accepted outcomes, open questions, and explicit deferrals as one feature moves through delivery
- Top-level PDs capture durable accepted outcomes that should stay easy to find later
- INITs in [`../initiatives/`](../initiatives/README.md) are living hubs that summarize multi-phase initiative state and link back to relevant product decisions
- [`../design_guidelines.md`](../design_guidelines.md) is the living visual standard for palette, typography, mockup conformance, and surface posture; [PD-005](pd-005-ui-governance.md) governs how those standards are implemented without drift

Current feature phase folders:

- [Slop Bowl](features/slop-bowl/README.md)
- [Mobile Refresh](features/mobile-refresh/README.md)
