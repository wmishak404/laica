# Chef It Up Live Cooking Reliability Fixes

**Agent:** codex
**Branch:** codex/fix-cooking-steps-context-schema
**Date:** 2026-06-05
**Initiative:** none
**INIT updated:** n/a

## Summary

Wilson's Replit light smoke after PR #143 merged reached Live Cooking through Chef It Up but surfaced two separate reliability gaps before this branch was ready for production smoke.

First, Start Cooking showed an error popup while browser console reported `POST /api/cooking/steps 400` with `Invalid cooking steps request`. This branch keeps strict pantry/profile item validation unchanged, but gives the cooking-steps route its own bounded context schema for recipe-derived ingredients/equipment and a longer description.

Second, after the route fix was validated in Replit, a guest Chef It Up smoke entered Live Cooking for about a second and then returned to the "What are we cooking today?" menu with no user-facing error. The browser console showed `[vite] server connection lost` plus `TypeError: Failed to fetch`, not a route `400`. The app now stores the active cooking plan per guest/linked scope and restores it after a remount if the profile is complete and the plan is recent.

Third, Wilson's targeted Replit refresh check showed the active plan restored the recipe screen, but Live Cooking reinitialized the guide instead of restoring the already-generated step tray. Refreshing near the final step could produce controls and assistant copy without the step card because the saved state did not include the generated steps. The branch now persists and restores the generated step tray and clamps restored step indexes to the available steps.

Fourth, Wilson observed an idle-window/auth-resync-looking case where logs showed `POST /api/auth/google`, profile reload, speech synthesis, cooking steps, and `POST /api/cooking/session/start` several minutes after the original Live Cooking start. A focused unit reproduction confirmed the durable-session part of that signal: a linked user restoring a saved Live Cooking tray would still create another `/api/cooking/session/start` because `cookingSessionId` was memory-only. The branch now persists the durable cooking session id/start time when available and treats restored cooking sessions as existing sessions rather than starting a new one.

## Changes

- `server/routes.ts`
  Adds `cookingContextItemSchema` with a 200-character item cap and uses it only for `/api/cooking/steps` `ingredients`/`equipment`; raises cooking-step description cap to 2000.
- `tests/unit/provider-boundary-happy-paths.test.ts`
  Adds a Chef It Up-style descriptive ingredient fixture for `/api/cooking/steps`.
- `client/src/pages/app.tsx`
  Persists the active cooking plan per guest/linked scope when a recipe is selected, restores it on profile load after a remount, and clears it on Back to Planning, logout/start-over, or cooking completion.
- `client/src/components/cooking/live-cooking.tsx`
  Adds an optional completion callback so the parent app can clear active-plan restore state when a cooking attempt finishes. Persists generated steps/ingredients plus durable session id/start time in the scoped cooking-session cache, restores them without re-calling `/api/cooking/steps`, clamps restored step indexes so refresh cannot render controls without a current step, and avoids creating another durable cooking session for a restored linked session.
- `tests/unit/planning-choice.test.tsx`
  Adds a guest remount regression showing a complete guest profile with a recent active cooking plan returns to Live Cooking instead of the planning-choice menu.
- `tests/unit/live-cooking-guest-session.test.tsx`
  Adds guest/linked refresh regressions showing saved generated steps restore without reinitializing the cooking-step provider path, including an out-of-range index clamp and no duplicate durable session start for linked users.
- `efforts/effort-017-environment-parity-and-ci-confidence.md`
  Records the Replit smoke gaps: provider-boundary route tests need realistic upstream model-shaped payloads, app-level tests need to cover remount/reconnect resilience for active guest cooking, and component-level tests need to cover generated-step tray restore.

## Evidence

Observed before fix in Replit/browser smoke:

- Trigger: Chef It Up recipe suggestion, then Start Cooking.
- Browser console: `AI request error in cooking steps: ApiRequestError: 400: Invalid cooking steps request`.
- Network: `POST /api/cooking/steps 400`.
- UI fell back to basic Live Cooking steps, so the visible screen was usable but the real cooking-step provider path failed validation.

Observed after the first route fix, before the active-plan restore guard:

- Trigger: signed in as guest, scanned ingredients, completed profile, chose a Chef It Up recipe, entered Live Cooking.
- Browser console: `[vite] server connection lost. Polling for restart...` and `AI request error in cooking steps: TypeError: Failed to fetch`.
- UI returned to "What are we cooking today?" with no user-facing error because the parent app only held the selected recipe in React memory.

Observed after the active-plan restore guard, before the step-tray restore guard:

- Trigger: hard refresh while in Live Cooking.
- UI restored the recipe screen, but Live Cooking reinitialized as if starting fresh.
- Refreshing near the final step could render the Live Cooking shell and controls without the step card because restored progress existed but generated steps were not restored with it.

Observed after the step-tray restore guard, before the durable-session restore guard:

- Trigger: idle/open app after prior Live Cooking activity, with Replit logs showing auth/profile refresh before Live Cooking activity.
- Replit logs included `POST /api/auth/google`, `GET /api/user/profile`, speech synthesis, cooking steps, and `POST /api/cooking/session/start` several minutes after the original start.
- Focused unit reproduction confirmed a restored linked Live Cooking tray still called the durable start mutation once.

Local validation after latest fix:

- `npx vitest run tests/unit/provider-boundary-happy-paths.test.ts` passed: 1 file, 9 tests.
- `npx vitest run tests/unit/live-cooking-guest-session.test.tsx` passed: 1 file, 4 tests.
- `npx vitest run tests/unit/planning-choice.test.tsx` passed: 1 file, 16 tests.
- `npm run test:unit` passed: 34 files, 224 tests.
- `npm run check` passed.
- `npm run build` passed with existing non-blocking Browserslist age, Firebase dynamic/static import, and chunk-size warnings.

## Reasoning

`/api/cooking/steps` reused the strict `pantryItemSchema`, which caps user pantry entries at 64 characters. That is appropriate for hand-entered inventory, but too narrow for generated recipe context passed from Chef It Up into Live Cooking. The new schema is still bounded and trimmed, but avoids rejecting normal descriptive recipe context before the mocked or live provider boundary can run.

Separately, Live Cooking already persisted step/timer progress, but the parent app did not persist the selected recipe. A Replit dev-server reconnect or equivalent remount could therefore reload a complete guest profile and choose the default planning phase because `selectedMeal` was gone. The active cooking plan is scoped by identity (`guest:<id>` or `linked:<id>`), expires after four hours, validates the saved recipe shape before restore, and clears on explicit navigation/completion.

The follow-up refresh finding showed that preserving only the selected recipe is not enough. Live Cooking has to restore the generated steps themselves to keep refresh/reconnect from replaying the provider setup or showing shell controls with no current step. The scoped cooking-session cache now includes bounded step/ingredient data and clamps stale step indexes on restore.

For linked users, preserving generated steps is also not enough if the durable cooking-session id is lost on remount. Without the id, the component treats restored steps as a fresh linked session and starts another database-backed cooking session. The cache now records the durable session id/start time when the start route succeeds, restores them on mount, and suppresses another start when a saved cooking session is being restored.

## Required Replit Re-test

Before production deploy, re-test on the Replit runtime branch/head:

1. Confirm branch/SHA.
2. Google sign in.
3. Chef It Up to recipe suggestions.
4. Pick a recipe and click Start Cooking / Cook this.
5. Confirm `/api/cooking/steps` returns `200`.
6. Confirm Live Cooking shows generated provider steps rather than only the fallback two-step flow.
7. Confirm no error popup appears.
8. For guest smoke, confirm a transient dev-server reconnect or manual refresh during active Live Cooking restores the same recipe screen rather than silently returning to the planning-choice menu.
9. Confirm refresh during Live Cooking restores the existing generated step tray at the current step without reinitializing the guide.
10. Confirm refresh near the final step still shows a step card and does not render empty Live Cooking controls.
11. For linked users, confirm an auth/profile refresh or hard refresh while Live Cooking is restored does not create an extra cooking-history session.

## Negative Scope

- Does not change recipe prompts or provider output quality.
- Does not change Google auth/linking behavior.
- Does not validate ElevenLabs audio quality beyond any smoke Wilson runs.
- Does not prove production OAuth authorized-domain state.
- Does not resolve EFF-017.
- Does not claim a production server outage/reconnect test; the restore guard is local/client state coverage for the Replit-observed remount symptom.

## Stack / Base Status

- Base refreshed: yes
- Current base: `origin/main` at `ad6840e4db89eb5da0595fd22156ab2b38b64566`
- Last Replit-validated at: not yet validated after latest durable-session restore fix
- Notes: started from main after PR #143 merged.
