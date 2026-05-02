# Initiatives

INITs are living hubs for multi-phase projects. They give agents and Wilson one place to regain the full project context without reconstructing it from chat history, PRs, handoffs, epics, and product decisions.

Use INITs for phased work that spans multiple branches, PRs, agents, assets, validation passes, or product/engineering decisions.

## What INITs Are

An INIT is a current-state map for an initiative. It should answer:

- what are we trying to accomplish?
- what phases exist and where are they now?
- what docs, assets, epics, PRs, and branches matter?
- what changed after the initial plan?
- what is validated, stale, blocked, or ready?
- where should the next agent resume?

INITs are living documents. Update them as the initiative changes.

## Relationship to Other Docs

| Artifact | Purpose | INIT relationship |
|---|---|---|
| Product Decisions | Durable accepted decisions | INIT links and summarizes relevant PDs; PDs link back when materially tied to an active INIT |
| Epics | Cross-cutting governance/backlog | INIT summarizes relevance; epics remain source of truth for the governed concern |
| Feature phase docs | Phase-level specs and acceptance criteria | INIT tracks phase progress and links to phase docs |
| Handoffs | Point-in-time agent coordination | Handoffs cite INITs and say whether the INIT was updated |
| ADRs/workflow docs | Durable process/architecture rules | INIT links them when process affects the initiative |
| Assets | Mockups, screenshots, design references | INIT lists asset paths and explains what each asset represents |
| PR descriptions | Review/merge surface | PRs link the INIT and state whether it was updated |

## Convention

- Directory: `initiatives/`
- Registry: `initiatives/registry.md`
- File name: `INIT-NNN-kebab-name.md`
- Numbering is chronological and never reused.
- Keep the full historical list in the registry.

## Status Model

| Status | Meaning |
|---|---|
| `Planning` | Phases and direction are being defined |
| `In Progress` | Active implementation or docs work is underway |
| `Validation` | Main work is implemented, but validation/readiness is still active |
| `Blocked` | Progress needs a decision, environment action, or dependency |
| `Complete` | Initiative has shipped and closeout is done |
| `Archived` | Historical reference only; no active maintenance expected |

## Required Sections

Each INIT should include:

- `Overview`
- `Current Status`
- `Source Docs`
- `Assets`
- `Phase Progress`
- `PRs and Branches`
- `Epics and Governance`
- `Changes Added After Initial Plan`
- `Validation State`
- `Current Resume Point`
- `Chronology`

## Update Protocol

Update the relevant INIT whenever initiative context changes:

- a phase starts, changes scope, validates, merges, blocks, or defers
- a PR opens, rebases, validates, merges, or blocks
- assets, mockups, or design references are added or revised
- a product decision, epic, ADR, handoff, or workflow rule materially changes initiative direction
- Replit validation status changes, including `Last Replit-validated at` SHA
- the current resume point changes

The agent making the change owns the INIT update in the same branch/PR when practical.

## Post-Merge Closeout

When an INIT-bound PR merges, the agent who performed or confirmed the merge owns a short follow-up docs closeout from fresh `origin/main`. This closeout should happen before the agent treats the work as finished.

Required closeout updates:

- INIT status, phase table, PR table, validation state, current resume point, and chronology
- initiative registry
- related feature phase/product-decision docs
- active epic files and `epics/registry.md` when the merge adds governance, design, or validation signal
- a `docs/handoffs/YYYY-MM-DD-<agent>-<phase>-merge-closeout.md` file with merge commit, validation SHA, impact, open items, and verification

If closeout cannot happen immediately, the agent must document the deferral in the final response or handoff with owner, branch/PR, merge commit, validation SHA, and the next exact action.

## Cross-Artifact Linking Rules

- Product decisions that materially affect an active INIT should include `Related Initiatives`.
- Epics created because of initiative work should include `Linked Initiatives`.
- Feature phase docs should include an `Initiative` link near the top.
- Handoffs should include `Initiative` and `INIT updated` fields when relevant.
- PR descriptions should include the INIT link and whether the INIT was updated.
- New or revised initiative assets require an INIT update.

## Current Initiatives

- [INIT-001 — Mobile Refresh](INIT-001-mobile-refresh.md)
