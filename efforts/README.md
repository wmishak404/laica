# Efforts

Efforts are lightweight, numbered to-do records for standalone follow-up work that should not get lost, but does not currently belong inside an active initiative, feature phase, product decision, ADR, or workflow doc.

They are **agent-coordination artifacts**, not GitHub Issues and not bug reports. Claude and Codex should read the relevant active Effort before touching its domain, cite it in the handoff, and update it only when the Effort itself gains new signal.

Agent instruction files should link to this file for the current active Effort read list instead of duplicating active Effort IDs.

## When to create an Effort

Before creating one, use [`../docs/workflows/documentation-routing.md`](../docs/workflows/documentation-routing.md) `## Chat Objectives And Promotion`. Most work should stay in the current thread, open PR, or a handoff unless unresolved standalone follow-up must survive beyond the current branch/PR/thread.

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

## Active work loop

`Open` and `In Progress` Efforts are the active work pool for standalone follow-up. A recurring Efforts hygiene or implementation run should first verify that the active list, registry, agent entrypoint links, open PRs, recent handoffs, and blocked handoffs agree about ownership and status. After that hygiene pass is clean, the agent may choose one unblocked active Effort for a PR-sized implementation slice.

Do not treat the active read list as a blind queue. Before implementation, confirm the Effort has a clear next action, no conflicting open owner/branch, and no unresolved product, architecture, security, secrets, or Replit-side decision. If the next move needs Wilson, write the smallest blocking report instead of inventing scope.

If standalone follow-up is genuinely blocked, make that queryable by setting the Effort header `**Status:** Blocked`. Do not leave blocked-ness only in chronology prose or only in a handoff when the Effort itself owns the work.

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
| `Open` | Accepted standalone follow-up with no known active implementation owner | Read before touching its domain; eligible for a PR-sized implementation slice after ownership/blocker checks |
| `In Progress` | One or more decisions, implementation slices, or validation passes have landed or are active, but resolution criteria are not complete | Read, cite, and inspect open PRs/handoffs before adjacent work; continue only with a clear non-conflicting next slice |
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
| [EFF-017](effort-017-environment-parity-and-ci-confidence.md) | Environment parity + CI confidence | `In Progress` | Wilson / Codex / Claude | 2026-05-05 |
| [EFF-022](effort-022-cross-cuisine-recommendation-prompts.md) | Cross-cuisine recommendation prompts | `Open` | Wilson / Codex / Claude | 2026-05-23 |
| [EFF-034](effort-034-production-readiness-mobile-p2-cleanup.md) | Production-readiness mobile P2 cleanup | `Open` | Wilson / Codex / Claude | 2026-07-20 |
| [EFF-035](effort-035-universal-setup-viewport-resilience.md) | Universal mobile viewport resilience for first-time setup | `Open` | Wilson / Codex / Claude | 2026-07-22 |
| [EFF-036](effort-036-production-admin-access-and-hardening.md) | Restore production admin access and route hardening | `Open` | Wilson / Codex / Claude | 2026-07-22 |
| [EFF-037](effort-037-feedback-length-contract.md) | Align feedback length contract and recovery copy | `Open` | Wilson / Codex / Claude | 2026-07-22 |

## Deferred Efforts

Deferred Efforts are intentionally not part of the default active read list:

| ID | Title | Status | Owner | Created |
|---|---|---|---|---|
| [EFF-023](effort-023-broad-dependency-modernization-strategy.md) | Broad dependency modernization strategy | `Deferred` | Wilson / Codex / Claude | 2026-05-26 |

## Resolved History

Use [`registry.md`](registry.md) when you need searchable historical context or need to verify why a former Effort was closed.
