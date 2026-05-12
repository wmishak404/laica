# Feature Phase Records

This subtree tracks feature decisions by delivery phase. It is the working layer between `docs/handoffs/` and top-level product decisions.

Feature phase records are not top-level PDs. They may evolve while a feature is active, then should close with the accepted outcome, validation facts, and explicit deferrals once the phase merges.

## When to Use

- Use a feature phase folder when a feature has more than one implementation phase or more than one agent contributing
- Record decisions that are stable enough to matter beyond a single handoff, but not yet final enough to deserve a top-level `PD-NNN`
- Capture open questions, assumptions, and cross-agent alignment notes in the phase where they belong
- Link the relevant INIT when the feature belongs to an active multi-phase initiative
- Put branch diary material in `docs/handoffs/` unless it distills into an accepted rule or final phase outcome
- Use [`../../docs/workflows/documentation-routing.md`](../../docs/workflows/documentation-routing.md) when a phase lesson might need to graduate into a PD, INIT update, Effort, workflow doc, or handoff
- Do not add a new minor phase under an already closed phase after the initiative has advanced; use the current/future phase, INIT current state, a top-level PD, or an Effort only after consulting the full routing workflow

## Convention

- One folder per feature: `product-decisions/features/<feature>/`
- Include a `README.md` with a phase index and current status
- Prefer phase files named `pd-phase-0N-short-name.md`
- Non-phase feature records should also use a `pd-` prefix, for example `pd-design-language.md`
- Closed phase records may keep historical notes, but they should not become active work queues once later phases are underway

Suggested phases:

1. Product direction
2. API and architecture alignment
3. Implementation coordination
4. Validation and rollout

## Promotion Rule

- If a decision becomes durable and should stay easy to discover later, promote it to a top-level `PD-NNN` file
- If a note is just about branch context or who should do what next, put it in a handoff instead
- If a phase-level lesson becomes cross-phase or cross-feature policy, promote the distilled rule rather than copying the whole phase history
- After merge/validation, prefer final outcome and deferral summaries at the top of the phase record; historical detail can remain in handoffs

## Current Feature Folders

- [Slop Bowl](slop-bowl/README.md)
- [Mobile Refresh](mobile-refresh/README.md)
