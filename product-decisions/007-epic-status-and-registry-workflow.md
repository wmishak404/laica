# PD-007: Epic status and registry workflow

**Date:** 2026-04-21
**Status:** Accepted
**Decision maker:** Wilson

## Context

The project uses `epics/` as a lightweight agent-coordination backlog for long-lived product, design, architecture, and governance stories. As the number of epics grows, putting every active and resolved epic directly in `epics/README.md` would waste agent context and make new sessions more likely to miss the truly active work.

This came up after EPIC-002 and EPIC-003 were resolved, but a new window did not immediately know they were closed. The first fix made closure more explicit; the scalable follow-up is to separate the operational entrypoint from the full historical index.

## Decision

Use a two-surface epic status workflow:

- `epics/README.md` is the lightweight operational entrypoint. It contains the status model, creation/read rules, the active epic read list, and a link to the full registry.
- `epics/registry.md` is the complete searchable history. It lists every epic, including resolved and deferred epics.
- Agents read active epics by default, not the full historical registry.
- Agents consult `epics/registry.md` only when a task references a resolved/deferred epic or needs historical context.
- `Resolved` is the closed/completed state. Do not introduce a separate `Closed` status.

The approved status vocabulary is:

| Status | Meaning |
|---|---|
| `Open` | Accepted backlog/governance concern, not actively being implemented yet |
| `In Progress` | Work, decisions, or validation are partially complete |
| `Blocked` | Cannot progress without a human decision, external dependency, or environment action |
| `Deferred` | Intentionally parked for later, with no current action expected |
| `Resolved` | Closed/completed; resolution criteria were met or the decision was accepted |

## Rationale

- Keeps new agent windows focused on the current work instead of forcing them through old resolved history.
- Preserves resolved epics as searchable project memory.
- Avoids status vocabulary sprawl by using `Resolved` rather than both `Resolved` and `Closed`.
- Scales better if the project eventually has dozens, hundreds, or thousands of epics.
- Keeps individual epic files stable in place, avoiding link churn.

## Alternatives considered

| Alternative | Why not chosen |
|-------------|----------------|
| Keep every epic in `epics/README.md` | Fine with five epics, but noisy and context-heavy at scale |
| Move resolved epic files into an archive folder immediately | More churn than needed and risks breaking links |
| Add a separate `Closed` status | Duplicates `Resolved` and creates avoidable ambiguity |
| Build a generated JSON/index system now | Premature for the current repo size; markdown is enough |

## Consequences

- `epics/README.md` should stay intentionally short and active-work focused.
- `epics/registry.md` must be updated whenever an epic is created or its status changes.
- Future agents should not read all resolved epics by default.
- If the registry grows too large later, it can be generated or sharded by year/status without changing the agent-facing workflow.
