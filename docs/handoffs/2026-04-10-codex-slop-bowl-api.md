# Slop Bowl API Implementation

**Agent:** codex
**Branch:** `codex/slop-bowl-api`
**Date:** 2026-04-10

## Summary
Implemented the server-side Slop Bowl work from the merged planning docs. The server now has an authenticated `POST /api/recipes/slop-bowl` endpoint, a new `getSlopBowlRecipe()` generator with the simplified bowl contract, richer `/api/cooking/steps` context support, and the tiered OpenAI model updates from PD-003.

## Changes
| File | What changed |
|------|--------------|
| `server/openai.ts` | Added `DEFAULT_SLOP_BOWL_PROMPT`, `getSlopBowlRecipe()`, recent-meal/time-budget helpers, JSON validation for the Slop Bowl response, and updated model selection to `gpt-4.1` / `gpt-4.1-mini` / `gpt-4o-mini` per PD-003. |
| `server/routes.ts` | Added authenticated `POST /api/recipes/slop-bowl`, updated `POST /api/cooking/steps` to accept optional `ingredients`, `equipment`, and `description`, and made `POST /api/cooking/session/start` accept the new Slop Bowl snapshot shape while staying backward-compatible with the existing manual flow. |

## Impact on other agents
- Claude can now call `POST /api/recipes/slop-bowl` with optional `pantryOverride`, `feedback`, and `previousRecipe`; the response matches the simplified Phase 3 contract (`pantryIngredientsUsed`, `additionalIngredientsNeeded`, flat `instructions`, no `components`).
- Claude should pass Slop Bowl context into `POST /api/cooking/steps` using the new optional fields so Live Cooking gets ingredient- and equipment-aware steps.
- The cooking-session start route now tolerates both the old manual-planning snapshot fields and the new Slop Bowl fields, so Claude does not need a server follow-up just to persist the new recipe shape.
- Slop Bowl intentionally uses a hardcoded prompt in v1. I did not expand prompt-manager/admin/eval feature-type enums for `slop_bowl`.

## Open items
- Claude still owns the client-side workflow changes (`slop-bowl.tsx`, `app.tsx`, `client/src/lib/openai.ts`, and Live Cooking wiring).
- Replit validation is still required before merge for Firebase sign-in, recipe suggestion flows, cooking-session persistence, feedback writes, and ElevenLabs speech routes.
- I did local compile/build verification only; I did not hit live OpenAI/Firebase/ElevenLabs services from this macOS worktree.

## Verification
- `npm ci`
- `npm run check`
- `npm run build`
- Manual server review of:
  - `POST /api/recipes/slop-bowl`
  - `POST /api/cooking/steps`
  - `POST /api/cooking/session/start`
