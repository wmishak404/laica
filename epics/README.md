# Epics

Long-lived design, architecture, and governance concerns tracked as markdown files — **stories** in the Kanban sense. Each epic is an initiative that may span multiple phases, products, or sessions before it closes.

These are **agent-coordination artifacts**, not GitHub Issues and not active bug reports. Claude and Codex must read relevant open epics before starting work in a governed domain.

## When to create an epic

- A cross-cutting concern that spans multiple features (UI governance, local DB strategy, auth model, etc.)
- A debt item that's too big to fix inline but too important to forget
- A governance system that future work must conform to
- Anything that currently needs human judgment to resolve but can progress incrementally in the meantime
- A user-facing workflow or IA question that isn't ready to ship but shouldn't be lost

## When to **read** epics

- **Every time you start a new feature that touches a governed domain** — see each epic's *Agent checklist* section for the exact triggers
- Before writing a handoff that introduces patterns an open epic might constrain
- Before making a decision that might collide with something parked in the backlog

If your work intersects with an open epic, **cite the epic in your handoff** and note how your change interacts with it (conforms / defers / adds new signal).

## Convention

- Filename: `NNN-<kebab-name>.md` — numbered, ordered by creation
- Status: `Open` / `In Progress` / `Deferred` / `Resolved`
- Required sections: `Context`, `Scope`, `Decisions made so far`, `Open questions`, `Agent checklist`, `Resolution criteria`
- Link to relevant handoffs, product-decisions, and ADRs as they accumulate
- Keep updates chronological — append new notes with a `## YYYY-MM-DD — <event>` header rather than rewriting history

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

## Open epics

| # | Title | Status | Owner | Created |
|---|---|---|---|---|
| 001 | UI Consistency & Design Governance | Open | Wilson / Codex / Claude | 2026-04-16 |
| 002 | Home / Get Started routing & Home-Cook nav consolidation | Open | Wilson / Claude | 2026-04-16 |
| 003 | Slop Bowl pantry-check quick actions (inline remove / add) | Open | Wilson / Claude | 2026-04-16 |
