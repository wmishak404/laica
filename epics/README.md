# Epics

Long-lived design, architecture, and governance concerns tracked as markdown files — **stories** in the Kanban sense. Each epic is an initiative that may span multiple phases, products, or sessions before it closes.

These are **agent-coordination artifacts**, not GitHub Issues and not active bug reports. Claude and Codex must read relevant active epics before starting work in a governed domain.

## When to create an epic

- A cross-cutting concern that spans multiple features (UI governance, local DB strategy, auth model, etc.)
- A debt item that's too big to fix inline but too important to forget
- A governance system that future work must conform to
- Anything that currently needs human judgment to resolve but can progress incrementally in the meantime
- A user-facing workflow or IA question that isn't ready to ship but shouldn't be lost

## When to **read** epics

- **Every time you start a new feature that touches a governed domain** — see each epic's *Agent checklist* section for the exact triggers
- Before writing a handoff that introduces patterns an active epic might constrain
- Before making a decision that might collide with something parked in the backlog

If your work intersects with an active epic, **cite the epic in your handoff** and note how your change interacts with it (conforms / defers / adds new signal).

## Convention

- Filename: `NNN-<kebab-name>.md` — numbered, ordered by creation
- Status: use one of the statuses in the model below. Do not use `Closed`; use `Resolved` for closed/completed epics.
- Required sections: `Context`, `Scope`, `Decisions made so far`, `Open questions`, `Agent checklist`, `Resolution criteria`
- Link to relevant handoffs, product-decisions, and ADRs as they accumulate
- Keep updates chronological — append new notes with a `## YYYY-MM-DD — <event>` header rather than rewriting history
- Keep the full historical list in [`registry.md`](registry.md), not in this README

## Status model

Keep the vocabulary small so agents can scan it quickly:

| Status | Meaning | Agent behavior |
|---|---|---|
| `Open` | Accepted backlog/governance concern, not actively being implemented yet | Read before touching its governed domain |
| `In Progress` | Work, decisions, or validation are partially complete | Read and cite before adjacent work; avoid duplicating active work |
| `Blocked` | Cannot progress without a human decision, external dependency, or environment action | Document new evidence, then ask Wilson before forcing a direction |
| `Deferred` | Intentionally parked for later, with no current action expected | Do not treat as active unless your work directly reopens the area |
| `Resolved` | Closed/completed; resolution criteria were met or the decision was accepted | Use as history; do not include in the active read list unless directly relevant |

Durable workflow decision: see [`product-decisions/007-epic-status-and-registry-workflow.md`](../product-decisions/007-epic-status-and-registry-workflow.md).

## Relationship to other planning docs

| Location | Purpose | Lifespan |
|---|---|---|
| `product-decisions/PD-NNN-*.md` | Crystallized "we chose X because Y" | Durable — rarely changes once accepted |
| `product-decisions/features/<feature>/phase-NN-*.md` | Per-feature phase records | Durable, feature-scoped |
| `docs/handoffs/YYYY-MM-DD-<agent>-*.md` | Point-in-time coordination artifacts | Ephemeral — frozen after write |
| `epics/NNN-*.md` | **Open stories / backlog / governance** | **Evolves** — updated as work progresses |

An epic can **graduate** to a product decision once resolution is clear. At that point, create the `PD-NNN-*.md`, flip the epic to `Resolved`, and add a pointer from the epic to the PD.

## Auto-push permission

Per `CLAUDE.md`, changes to `epics/*.md` follow the planning-doc collaboration rule — Claude and Codex may commit and push updates without asking, as long as the change is a progression of recorded context (new decisions, new evidence, status transitions, linked artifacts). Stop and ask Wilson when a change would:

- Flip an epic to `Resolved` without the resolution criteria being met
- Add new product direction that hasn't been discussed
- Contradict a decision already recorded

## Full registry

Use [`registry.md`](registry.md) when you need searchable historical context or need to verify the status of a resolved/deferred epic. Agents should not load the full registry by default during ordinary feature work.

## Active epic read list

Read these before starting work in their governed domains:

| # | Title | Status | Owner | Created |
|---|---|---|---|---|
| [001](001-ui-governance.md) | UI Consistency & Design Governance | `Open` | Wilson / Codex / Claude | 2026-04-16 |
| [004](004-selection-controls-tap-targets.md) | Selection controls should be full-row tap targets | `Open` | Wilson / Claude / Codex | 2026-04-17 |
| [005](005-testing-strategy-and-acceptance-criteria.md) | App-wide testing strategy and acceptance criteria workflow | `Open` | Wilson / Codex / Claude | 2026-04-17 |
| [006](006-equipment-vision-exclusions.md) | Tighten equipment vision prompts to exclude non-kitchen items | `In Progress` | Wilson / Codex / Claude | 2026-04-22 |
