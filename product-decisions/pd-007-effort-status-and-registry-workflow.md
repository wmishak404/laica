# PD-007: Effort status and registry workflow

**Date:** 2026-04-21
**Status:** Accepted
**Decision maker:** Wilson
**Type:** Process
**Scope:** Global
**Applies when:** Creating, reading, updating, resolving, or indexing Efforts.

## Context

Laica originally used `epics/` as a lightweight agent-coordination backlog for long-lived stories. As the system grew, the Epic label became too broad: some files were real standalone work, some were initiative phases in disguise, and some were governance/workflow records that belonged in durable docs instead of a to-do list.

On 2026-05-09 Wilson renamed the system to **Efforts** to make the purpose narrower and easier to scan. An Effort is now a standalone to-do-style record for follow-up work that should not get lost, but that does not already belong in an active INIT, feature phase record, PD, ADR, or workflow doc.

## Decision

Use a two-surface Effort workflow:

- `efforts/README.md` is the lightweight operational entrypoint. It contains the status model, creation/read rules, active Effort read list, deferred Efforts, and a link to the full registry.
- `efforts/registry.md` is the complete searchable history. It lists active, deferred, and resolved Efforts.
- Numbered Effort files use `efforts/effort-NNN-<kebab-name>.md` so the filename is self-describing in diffs, search results, PR file lists, and chat windows.
- Effort IDs use `EFF-NNN`. Renamed files keep `Former ID: EPIC-NNN` metadata for historical continuity.
- Agents read active Efforts by default, not the full registry.
- Agents consult `efforts/registry.md` only when a task references a resolved/deferred Effort or needs historical context.
- `Resolved` is the closed/completed state. Do not introduce a separate `Closed` status.

## When not to create an Effort

- If the work belongs to an active or planned INIT phase, update that INIT or phase record instead.
- If the work is governance, workflow, or operating procedure, create or update a workflow doc, ADR, or PD instead.
- If the work is just point-in-time branch context, write a handoff.
- If the work changes a durable decision, amend or create the relevant PD instead.

The approved status vocabulary is:

| Status | Meaning |
|---|---|
| `Open` | Accepted standalone follow-up, not actively being implemented yet |
| `In Progress` | Work, decisions, or validation are partially complete |
| `Blocked` | Cannot progress without a human decision, external dependency, or environment action |
| `Deferred` | Intentionally parked for later, with no current action expected |
| `Resolved` | Closed/completed, superseded by a better home, or accepted as no longer needed |

## Rationale

- Keeps new agent windows focused on current standalone work.
- Prevents initiative-sized or governance-shaped work from hiding in a stale backlog list.
- Preserves resolved history as searchable project memory.
- Avoids status vocabulary sprawl by using `Resolved` rather than both `Resolved` and `Closed`.
- Makes filenames readable outside folder context by requiring the `effort-###` prefix.

## Alternatives considered

| Alternative | Why not chosen |
|-------------|----------------|
| Keep the Epic name | The label was too broad and encouraged governance docs, INIT work, and loose to-dos to live in one bucket |
| Keep every Effort in `efforts/README.md` | Fine with five items, but noisy and context-heavy at scale |
| Move resolved files into an archive folder immediately | More churn than needed and risks breaking links |
| Add a separate `Closed` status | Duplicates `Resolved` and creates avoidable ambiguity |
| Build a generated JSON/index system now | Premature for the current repo size; markdown is enough |

## Consequences

- `efforts/README.md` should stay intentionally short and active-work focused.
- `efforts/registry.md` must be updated whenever an Effort is created or its status changes.
- Future agents should not read all resolved Efforts by default.
- When a merged PR satisfies an Effort, agents must run the docs closeout immediately instead of leaving the status stale.
- If the registry grows too large later, it can be generated or sharded by year/status without changing the agent-facing workflow.

## 2026-05-09 Amendment — Epic system cleanup

The former `epics/` system was renamed to `efforts/`. Wilson explicitly closed EFF-004, EFF-007, EFF-009, and EFF-016 because their remaining work is already owned by INIT-001 phases or resolved by Mobile Refresh enhancements. EFF-005, EFF-019, and EFF-020 closed because their durable content now belongs in workflow docs, INIT-002, or PD-010 rather than standalone Efforts.

The inefficiencies that triggered the cleanup are recorded operationally in [`docs/workflows/effort-system-audit.md`](../docs/workflows/effort-system-audit.md) so future agents can audit stale Efforts without reopening this PD as a running work log.
