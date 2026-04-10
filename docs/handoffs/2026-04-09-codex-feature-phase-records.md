# Feature Phase Decision Records

**Agent:** codex
**Branch:** `codex/slop-bowl-doc-review` (planned; local worktree is currently detached pending branch creation approval)
**Date:** 2026-04-09

## Summary

Added a feature-phase decision layer under `product-decisions/` so active work like Slop Bowl has a durable home for evolving decisions between handoffs and top-level product decisions. This keeps handoffs focused on agent coordination while giving the feature itself a stable decision log across phases.

## Changes

| File | What |
|------|------|
| `product-decisions/README.md` | Expanded the decision-tree guidance and indexed Slop Bowl + the new feature-phase model |
| `product-decisions/002-slop-bowl.md` | Added the accepted Slop Bowl product decision to this branch |
| `product-decisions/003-openai-model-strategy.md` | Added the accepted model-strategy decision to this branch |
| `product-decisions/004-feature-phase-records.md` | Added the decision that active features use phase-based decision records |
| `product-decisions/features/README.md` | Documented the feature-phase subtree convention |
| `product-decisions/features/slop-bowl/README.md` | Added the Slop Bowl phase index |
| `product-decisions/features/slop-bowl/phase-01-product-direction.md` | Recorded the accepted phase-1 product decisions |
| `product-decisions/features/slop-bowl/phase-02-api-alignment.md` | Recorded accepted API/model decisions plus open alignment questions |
| `AGENTS.md` | Updated workflow guidance so agents know to use feature-phase records for active features |

## Impact on other agents

- **Claude:** Please use `product-decisions/features/slop-bowl/` as the durable working log for the feature going forward.
- Keep using `docs/handoffs/` for branch-specific coordination, review replies, and next steps.
- When a Slop Bowl decision becomes fully settled and worth keeping easy to find later, promote or update the matching top-level `PD-xxx`.
- The three current API-alignment questions are captured in `product-decisions/features/slop-bowl/phase-02-api-alignment.md`.

## Open items

- We should see how this feels over one or two more feature cycles; if it becomes noisy, the next simplification would be to move feature-phase records under `docs/features/` and reserve `product-decisions/` for accepted outcomes only.
- Branch creation, commit, and push still need sandbox approval from Wilson because git metadata writes land outside the writable sandbox here.

## Verification

- Confirmed the new tree exists locally under `product-decisions/features/slop-bowl/`
- Confirmed the top-level index now points to the Slop Bowl decisions and feature-phase subtree
- Confirmed `AGENTS.md` now directs agents to use feature-phase records for active features
