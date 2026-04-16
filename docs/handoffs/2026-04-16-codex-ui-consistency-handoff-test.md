# UI Consistency Handoff Test

**Agent:** codex
**Branch:** codex/ui-consistency-handoff-test
**Date:** 2026-04-16

## Summary
Created the smallest meaningful handoff artifact to validate the Codex-to-Claude branch workflow and give Claude a concrete plan to review. This is intentionally a doc-only branch: no product code changes, just a pushed handoff with the current UI consistency proposal and the pressure-test questions we want answered.

## Changes
- Added `docs/handoffs/2026-04-16-codex-ui-consistency-handoff-test.md` with:
  - the current draft plan for a Laica UI consistency system
  - repo-specific evidence from the current frontend implementation
  - explicit review questions for Claude

## Draft Plan Snapshot
- Adopt a hybrid UI consistency system: a concise design playbook plus code-level enforcement on the highest-reuse primitives.
- Use `clarity then warmth` as the product-wide decision rule.
- Make the rubric required for new or changed UI in scoped areas.
- Start with a `pilot then expand` rollout instead of a whole-app refactor.
- Pilot the system in the core app flow:
  - app shell and navigation
  - cooking flow
  - recipes flow
  - grocery flow
- Phase 1 remains additive and non-breaking:
  - preserve the current shadcn and Tailwind foundation
  - add constrained semantic variants and documented usage guidance
  - migrate pilot surfaces onto those variants
  - keep escape hatches, but require explicit rationale in PRs
- Lock a small set of approved semantic patterns first:
  - primary, secondary, quiet, and destructive actions
  - standard field and input treatment
  - standard card and surface treatment
  - standard page-section and header treatment
- Do not introduce Storybook or a large new platform layer in phase 1.
- Use existing Playwright and Vitest coverage where helpful, plus targeted visual and UI-state checks for pilot surfaces.

## Repo Signals This Plan Is Based On
- `design_guidelines.md` already defines a warm cooking-oriented visual direction, but it currently behaves more like a style note than an enforceable rubric.
- The repo already uses shadcn and Tailwind primitives such as `client/src/components/ui/button.tsx`, `card.tsx`, `input.tsx`, and related Radix wrappers.
- `client/src/index.css` does not currently line up cleanly with the written typography guidance in `design_guidelines.md`.
- Roughly 23 of 113 `Button` usages in `client/src` add custom styling directly through `className`, which suggests the shared primitive is not yet the default decision path.
- Roughly 37 hardcoded hex color uses exist in the client, which suggests token drift is already happening.
- Several core surfaces already mix shared components with ad hoc styling, which makes the pilot useful to test on a real in-flight UI rather than a greenfield component gallery.

## Impact on other agents
- Claude can review this branch directly on `origin` once it is pushed.
- This branch is intentionally minimal so the handoff mechanism itself is what gets tested, not a larger documentation rewrite.
- The expected Claude follow-up is a handoff or review note with concrete edits to the plan, especially around enforcement, rollout order, and coexistence with current shadcn usage.
- No implementation work has started from this plan yet.

## Open items
- Claude review is pending.
- We still need concrete edits or decisions on:
  - which primitives are locked first
  - what exceptions the rubric should allow
  - whether phase 1 should include visual regression coverage
  - whether typography and token mismatch should be fixed inside the pilot or split into a separate cleanup track
  - how strict the PR gate should be in practice
  - how this system should coexist with shadcn defaults without creating two parallel systems

## Verification
- Branch created locally: `codex/ui-consistency-handoff-test`
- This handoff is intended to be pushed to `origin` so Claude can read it directly.
- No application runtime or product code changed on this branch.

## Claude Review Request
Please pressure-test this plan and suggest concrete edits. Focus on:

1. Is `hybrid + pilot then expand` the right level of rigor for this repo?
2. Which primitives should be locked first?
3. What exceptions should the rubric allow?
4. Should phase 1 include visual regression coverage, or is that too heavy?
5. Should the typography and token mismatch be fixed inside the pilot or as a separate cleanup track?
6. What should the PR rubric require versus merely recommend?
7. How should this coexist with shadcn defaults without creating two parallel systems?
8. Which surfaces should carry the product tone most strongly versus stay more utilitarian?
9. What enforcement mechanism is realistic for this team right now?
10. Is the rollout order right, or should the pilot start narrower?
