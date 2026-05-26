# Efforts

Efforts are lightweight, numbered to-do records for standalone follow-up work that should not get lost, but does not currently belong inside an active initiative, feature phase, product decision, ADR, or workflow doc.

They are **agent-coordination artifacts**, not GitHub Issues and not bug reports. Claude and Codex should read the relevant active Effort before touching its domain, cite it in the handoff, and update it only when the Effort itself gains new signal.

## When to create an Effort

- Use an Effort for a concrete follow-up that is too important to leave in chat, but not already owned by an active INIT or phase.
- Use an Effort for standalone backlog work that can progress independently from current initiatives.
- Use an Effort for implementation or enforcement follow-through when the durable rule already lives in a PD or workflow doc.
- Do **not** create an Effort for work that belongs in an active initiative or future initiative phase; update the INIT or feature phase record instead.
- Do **not** create an Effort for governance/process that should be a living workflow doc, ADR, or PD.

## When to read Efforts

- Start with the active read list below before changing a governed domain.
- Use [`registry.md`](registry.md) only when you need historical context, a resolved/deferred record, or a task references an older Effort.
- If your work intersects with an active Effort, cite it in your handoff and say whether the work conforms, defers, adds evidence, or resolves it.
- If a merged PR satisfies an Effort, do the docs closeout immediately from fresh `origin/main`: flip status, append the final dated note, remove it from this active list, update the registry, and push a handoff.
- Use [`../docs/workflows/documentation-routing.md`](../docs/workflows/documentation-routing.md) before creating or closing an Effort so standalone follow-up work does not duplicate INIT phases, PDs, workflow docs, or handoffs.

## Convention

- Filename: `effort-NNN-<kebab-name>.md` so the file is self-describing in diffs, search results, and chat windows.
- ID: `EFF-NNN`.
- Historical metadata: keep `Former ID: EPIC-NNN` near the top of each renamed file.
- Status: use one of the statuses below. Do not use `Closed`; use `Resolved`.
- Required sections: `One-line summary`, `Context`, `Scope`, `Decisions made so far`, `Open questions`, `Agent checklist`, `Resolution criteria`.
- Keep updates chronological with `## YYYY-MM-DD — <event>` sections.

## Status model

| Status | Meaning | Agent behavior |
|---|---|---|
| `Open` | Accepted standalone follow-up, not actively being implemented yet | Read before touching its domain |
| `In Progress` | Work, decisions, or validation are partially complete | Read and cite before adjacent work; avoid duplicating active work |
| `Blocked` | Cannot progress without a human decision, external dependency, or environment action | Document new evidence, then ask Wilson before forcing a direction |
| `Deferred` | Intentionally parked for later, with no current action expected | Do not treat as active unless the work directly reopens the area |
| `Resolved` | Closed/completed, superseded by a better home, or accepted as no longer needed | Use as history; do not include in the active read list |

Durable workflow decision: [`PD-007`](../product-decisions/pd-007-effort-status-and-registry-workflow.md).

## Relationship to other planning docs

| Location | Purpose | Lifespan |
|---|---|---|
| `initiatives/INIT-NNN-*.md` | Living hub for multi-phase initiative work, phase state, validation, assets, PRs, and current resume point | Evolves until initiative closeout |
| `product-decisions/pd-NNN-*.md` | Durable accepted decisions and rationale | Stable, amended only when the decision changes |
| `product-decisions/features/<feature>/pd-phase-NN-*.md` | Feature/phase-scoped specs, outcomes, acceptance criteria, and deferrals | Evolves while the feature phase is active |
| `docs/workflows/*.md` | Living operating procedures for agents | Evolves when workflow rules change |
| `docs/handoffs/YYYY-MM-DD-<agent>-*.md` | Point-in-time branch/session transfer notes | Frozen after write |
| `efforts/effort-NNN-*.md` | Standalone to-do-style follow-up not owned by an active INIT/phase/workflow doc | Evolves until resolved |

An Effort can graduate into a PD, workflow doc, INIT phase, or feature phase record once the better home is clear. At that point, mark the Effort `Resolved`, add the final note, and point future work to the new source of truth.

## Active Effort Read List

Read these before starting work in their governed domains:

| ID | Title | Status | Owner | Created |
|---|---|---|---|---|
| [EFF-010](effort-010-local-db-schema-strategy.md) | Local database schema strategy | `Open` | Wilson / Codex / Claude | 2026-04-27 |
| [EFF-022](effort-022-cross-cuisine-recommendation-prompts.md) | Cross-cuisine recommendation prompts | `Open` | Wilson / Codex / Claude | 2026-05-23 |

## Deferred Efforts

Deferred Efforts are intentionally not part of the default active read list:

| ID | Title | Status | Owner | Created |
|---|---|---|---|---|
| [EFF-017](effort-017-environment-parity-and-ci-confidence.md) | Environment parity + CI confidence | `Deferred` | Wilson / Codex / Claude | 2026-05-05 |
| [EFF-023](effort-023-broad-dependency-modernization-strategy.md) | Broad dependency modernization strategy | `Deferred` | Wilson / Codex / Claude | 2026-05-26 |

## Resolved History

Use [`registry.md`](registry.md) when you need searchable historical context or need to verify why a former Effort was closed.
