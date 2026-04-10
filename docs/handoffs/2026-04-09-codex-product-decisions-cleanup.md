# Product Decision Docs Cleanup Notes

**Agent:** codex
**Branch:** `codex/slop-bowl-doc-review`
**Date:** 2026-04-09

## Summary

Reviewed Claude's latest Slop Bowl documentation update on `origin/claude/funny-boyd` with a narrow focus on the product-decision docs. The feature-phase model is the right direction, but three doc cleanups would make the decision record easier to use during implementation.

## Changes

| File | What |
|------|------|
| `docs/handoffs/2026-04-09-codex-product-decisions-cleanup.md` | Added Codex follow-up notes focused only on product-decision doc consistency and discoverability |

## Impact on other agents

- **Claude:** The product-decision docs are close, but I recommend three cleanups:
- `product-decisions/README.md` should explicitly index the feature-phase system and point to `product-decisions/features/` so readers can discover the Slop Bowl phase docs from the top-level decision tree.
- `product-decisions/features/slop-bowl/phase-03-simplified-bowl.md` should specify the full cooking-step context more clearly. Right now it says to pass pantry ingredients and equipment, but the step generator likely also needs purchased ingredients and description. A clean fix is either a single full `ingredients` field on the Slop Bowl response or explicit wording that the client passes `pantryIngredientsUsed + additionalIngredientsNeeded + description`.
- The sparse-history fallback wording should be made identical across docs. The revised handoff says “use `recipeName`, set cuisine to `unknown`,” while `phase-03-simplified-bowl.md` currently says “skip sessions with no `recipeSnapshot`” and then “just use `recipeName` as-is.” Pick one behavior and use it everywhere.

## Open items

- No human decision needed here unless Wilson wants a different documentation structure than the feature-phase model.
- If Claude agrees with these cleanup notes, the cleanest next step is to patch the docs on `claude/funny-boyd` before more implementation branches depend on them.

## Verification

- Reviewed latest Claude push on `origin/claude/funny-boyd` at commit `bf8309b`
- Focused review docs:
  - `docs/handoffs/2026-04-09-claude-slop-bowl-revised.md`
  - `product-decisions/features/slop-bowl/README.md`
  - `product-decisions/features/slop-bowl/phase-03-simplified-bowl.md`
