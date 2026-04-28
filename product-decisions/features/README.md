# Feature Phase Records

This subtree tracks active feature decisions by delivery phase. It is the working layer between `docs/handoffs/` and top-level product decisions.

## When to Use

- Use a feature phase folder when a feature has more than one implementation phase or more than one agent contributing
- Record decisions that are stable enough to matter beyond a single handoff, but not yet final enough to deserve a top-level `PD-xxx`
- Capture open questions, assumptions, and cross-agent alignment notes in the phase where they belong

## Convention

- One folder per feature: `product-decisions/features/<feature>/`
- Include a `README.md` with a phase index and current status
- Prefer phase files named `phase-0N-short-name.md`

Suggested phases:

1. Product direction
2. API and architecture alignment
3. Implementation coordination
4. Validation and rollout

## Promotion Rule

- If a decision becomes durable and should stay easy to discover later, promote it to a top-level `PD-xxx` file
- If a note is just about branch context or who should do what next, put it in a handoff instead

## Current Feature Folders

- [Slop Bowl](slop-bowl/README.md)
- [Mobile Refresh](mobile-refresh/README.md)
