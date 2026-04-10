# Handoff: Branch Transition — Planning to Implementation

**From:** Claude
**To:** Codex
**Date:** 2026-04-09
**Branch:** `claude/funny-boyd` (docs PR #4 → `main`)

## What happened

The planning/docs phase for Slop Bowl is wrapping up. PR #4 merges all product decisions, feature phase records, handoffs, and agent coordination rules to `main`. Once merged, the planning branch (`claude/funny-boyd`) is done.

## What's changing

Implementation starts on **fresh branches from `main`** — not from the planning branch:

| Agent | Implementation branch | Owns |
|-------|----------------------|------|
| Codex | `codex/slop-bowl-api` | `server/openai.ts`, `server/routes.ts` |
| Claude | `claude/slop-bowl-ui` | `client/src/components/cooking/slop-bowl.tsx` (new), `client/src/pages/app.tsx`, `client/src/lib/openai.ts` |

## New process rule (AGENTS.md updated)

A "Branch transitions" section has been added to `AGENTS.md` covering:

1. Merge docs PR to `main` first — both agents branch from the updated `main`
2. Each agent opens a fresh feature branch with clear ownership
3. WIP is carried forward by the owning agent (Claude has local prototype UI code)
4. Shared context comes from merged docs on `main` (`product-decisions/`, `docs/handoffs/`, feature phase records)
5. File ownership is strictly respected — no two agents on the same file
6. Signal readiness via handoff when implementation is done

## What Codex should do

1. **Wait for PR #4 to merge** (Wilson will merge or approve).
2. **Read the merged docs on `main`** — especially:
   - `product-decisions/features/slop-bowl/phase-03-simplified-bowl.md` (final API contract)
   - `docs/handoffs/2026-04-09-claude-slop-bowl-revised.md` (revised spec)
3. **Create `codex/slop-bowl-api` from `main`** and begin server implementation:
   - `POST /api/recipes/slop-bowl` endpoint
   - `getSlopBowlRecipe()` function + prompt
   - Enriched `getCookingSteps()` with optional `ingredients`, `equipment`, `description` params
   - Model upgrades (gpt-4o → tiered gpt-4.1/mini/4o-mini) across all 6 endpoints
4. **Push a handoff** when the API is testable so Claude can integrate.

## What Claude will do

1. Create `claude/slop-bowl-ui` from `main` after PR #4 merges.
2. Re-apply local WIP (slop-bowl.tsx, app.tsx, openai.ts changes) onto the new branch.
3. Build against mock API response until Codex's endpoint is ready.
4. Push handoff when UI is ready for integration.

## Context checkpoint

- All planning decisions are in `product-decisions/` and `product-decisions/features/slop-bowl/`
- API contract (simplified, no rigid components): `phase-03-simplified-bowl.md`
- Model strategy: `product-decisions/003-openai-model-strategy.md`
- No source code has been committed yet — both agents start clean
