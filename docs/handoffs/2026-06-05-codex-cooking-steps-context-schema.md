# Cooking Steps Context Schema Fix

**Agent:** codex
**Branch:** codex/fix-cooking-steps-context-schema
**Date:** 2026-06-05
**Initiative:** none
**INIT updated:** n/a

## Summary

Wilson's Replit light smoke after PR #143 merged reached Live Cooking through Chef It Up but surfaced an error popup at Start Cooking. Browser console reported `POST /api/cooking/steps 400` with `Invalid cooking steps request`.

This branch keeps strict pantry/profile item validation unchanged, but gives the cooking-steps route its own bounded context schema for recipe-derived ingredients/equipment and a longer description. Chef It Up can pass richer generated recipe context into Live Cooking than a user-typed pantry item, and the route should accept that context before calling the provider.

## Changes

- `server/routes.ts`
  Adds `cookingContextItemSchema` with a 200-character item cap and uses it only for `/api/cooking/steps` `ingredients`/`equipment`; raises cooking-step description cap to 2000.
- `tests/unit/provider-boundary-happy-paths.test.ts`
  Adds a Chef It Up-style descriptive ingredient fixture for `/api/cooking/steps`.
- `efforts/effort-017-environment-parity-and-ci-confidence.md`
  Records the Replit smoke gap: provider-boundary route tests need realistic upstream model-shaped payloads, not only short strings.

## Evidence

Observed before fix in Replit/browser smoke:

- Trigger: Chef It Up recipe suggestion, then Start Cooking.
- Browser console: `AI request error in cooking steps: ApiRequestError: 400: Invalid cooking steps request`.
- Network: `POST /api/cooking/steps 400`.
- UI fell back to basic Live Cooking steps, so the visible screen was usable but the real cooking-step provider path failed validation.

Local validation after fix:

- `npx vitest run tests/unit/provider-boundary-happy-paths.test.ts` passed: 1 file, 9 tests.
- `npm run test:unit` passed: 34 files, 221 tests.
- `npm run check` passed.
- `npm run build` passed with existing non-blocking Browserslist age, Firebase dynamic/static import, and chunk-size warnings.

## Reasoning

`/api/cooking/steps` reused the strict `pantryItemSchema`, which caps user pantry entries at 64 characters. That is appropriate for hand-entered inventory, but too narrow for generated recipe context passed from Chef It Up into Live Cooking. The new schema is still bounded and trimmed, but avoids rejecting normal descriptive recipe context before the mocked or live provider boundary can run.

## Required Replit Re-test

Before production deploy, re-test on the Replit runtime branch/head:

1. Confirm branch/SHA.
2. Google sign in.
3. Chef It Up to recipe suggestions.
4. Pick a recipe and click Start Cooking / Cook this.
5. Confirm `/api/cooking/steps` returns `200`.
6. Confirm Live Cooking shows generated provider steps rather than only the fallback two-step flow.
7. Confirm no error popup appears.

## Negative Scope

- Does not change recipe prompts or provider output quality.
- Does not change Google auth/linking behavior.
- Does not validate ElevenLabs audio quality beyond any smoke Wilson runs.
- Does not prove production OAuth authorized-domain state.
- Does not resolve EFF-017.

## Stack / Base Status

- Base refreshed: yes
- Current base: `origin/main` at `ad6840e4db89eb5da0595fd22156ab2b38b64566`
- Last Replit-validated at: not yet validated after fix
- Notes: started from main after PR #143 merged.
