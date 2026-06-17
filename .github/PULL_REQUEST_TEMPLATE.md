## Summary

<!-- What changed, why it matters, and any broader coordination/workflow signal. -->

## Changes

- <!-- item -->

## UI governance

<!-- Read PD-005 and design_guidelines.md before UI work: product-decisions/pd-005-ui-governance.md and design_guidelines.md -->

- [ ] No new token-equivalent hex color utilities in `className` such as `bg-[#...]`, `text-[#...]`, or `border-[#...]`.
- [ ] Tone-forward primitive/custom styling has a nearby `// design:tone-override — <reason>` comment, or this PR does not customize tone-forward primitives.
- [ ] Reused phase-scoped classes were checked by rendered/computed style on the destination surface, or this PR does not reuse phase-scoped classes.
- [ ] Mobile-refresh/mockup-governed surfaces were compared against the linked exemplar, with intentional deviations noted below.
- [ ] Provenance or state-change cues that users must notice were verified on the affected rendered surface, or this PR does not add those cues.

Intentional UI deviations / notes:

- <!-- note -->

## Validation

Automation evidence used as a merge gate:

- Value claim:
- Evidence:
  - Command/check provenance:
  - Source provenance:
  - Observed result:
- Evidence limits:

Local checks:

- [ ] `npm ci`
- [ ] `npm run check`
- [ ] `npm run build`
- [ ] Targeted tests:

Manual/browser checks:

- <!-- check -->

Replit validation:

- Last Replit-validated at: `not yet validated`
- Runtime content SHA if branch head has docs-only commits after validation:
- Validation scope: `docs-only` / `scoped runtime pass` / `full targeted branch pass`
- Intentionally not tested / negative scope:

## Docs and handoff

- [ ] Updated the relevant INIT, feature phase record, PD, Effort, workflow doc, and/or handoff, or noted why docs were not needed.
- [ ] For deployment-bound work, handoff/PR notes separate local checks, scoped Replit checks, full Replit validation, and unvalidated scope.
