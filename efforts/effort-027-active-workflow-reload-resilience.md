# EFF-027 - Active workflow reload resilience

**Status:** Open
**Priority:** High
**Owner:** Wilson / Codex / Claude
**Created:** 2026-06-18
**Updated:** 2026-06-18

## One-line summary

Restore users directly back into active Chef It Up / Planning workflow state after an unexpected browser reload, Replit/Vite refresh, or app remount instead of dropping them at the Planning choice screen.

## Context

During PR #192 Replit validation, Wilson observed the app reset to the main Planning choice screen while he was in the middle of the Chef It Up selected-image workflow. The Network tab in the screenshot showed a full dev-server reload pattern rather than an image-resolver failure: a document reload plus Vite/React module requests such as `client`, `@react-refresh`, `main.tsx?t=...`, `App.tsx?t=...`, `cooking-new.tsx?t=...`, and `index.css?t=...`.

The Replit shell in the same screenshot showed branch/head sync commands and a move from the local validation head toward the PR head, including `git fetch`, a failed fast-forward due branch divergence, and a later `git reset --hard origin/codex/init-001-recipe-preview-images`. That makes the immediate trigger most likely a Replit/Vite hot reload or full page reload caused by source-tree changes during validation, not the selected image resolver. The visible `/api/recipe-images/selected/resolve` request returned `200`, and no failed auth/profile API request was visible in the screenshot.

The product problem is still real: after the remount, the app landed on `What are we cooking today?` instead of returning directly to the active Chef It Up surface. Wilson could tap Chef It Up and resume the same saved suggestions, proving MealPlanning session restore existed, but the app shell did not automatically route the user back into the in-progress workflow.

This should not block PR #192 because production builds do not use Vite React Refresh and the image-specific behavior validated correctly. It should be high priority follow-up because users can still experience hard reloads, mobile browser tab eviction, deployment refreshes, or auth/profile churn during longer flows.

## Scope

### In scope

- Detect when a user has an active, valid MealPlanning session for the current profile fingerprint after app bootstrap.
- Restore directly into the active Chef It Up / MealPlanning surface after a hard reload or app remount, instead of requiring the user to tap Chef It Up again.
- Preserve intentional exits to the Planning choice screen; do not trap users inside Chef It Up after Back, Refresh Suggestions reset, cooking start, or explicit flow completion.
- Cover relevant MealPlanning substates such as staple selection, Ticket Pass, and Prep Tray when the saved session is valid.
- Validate guest and linked-user behavior because both use the Planning choice surface and can have local/session-scoped planning state.
- Add tests that simulate reload/remount with saved planning state and verify direct restoration without stale-profile leakage.
- Replit-validate the exact fix by forcing a browser reload while in Ticket Pass or Prep Tray and confirming the same active workflow returns.

### Out of scope

- Preventing Replit, Vite, or browser dev tools from triggering reloads while code changes are being pulled or reset.
- Changing recipe image generation, selected-image polling, App Storage, provider selection, or Gemini benchmark behavior.
- Broad router/app-shell rewrite beyond what is needed for active workflow restoration.
- Changing Settings active-section restore; see EFF-025 for Settings dirty-state/remount work.
- Persisting completed cooking sessions or History behavior; those remain in their owning phases.

## Decisions made so far

- Screenshot evidence points to a dev-environment full reload caused by source/module refresh, not a recipe-image resolver crash.
- The current MealPlanning session cache can restore the recipe suggestions after the user re-enters Chef It Up, so the missing piece is app-shell active-flow restoration.
- This follow-up should be handled after PR #192 rather than widening the recipe imagery PR, unless new evidence shows image code directly triggers the reset.
- Because the observed pain interrupts an active user workflow, this Effort is high priority even though the immediate trigger was likely validation-environment specific.
- Wilson chose a short **15-minute** MealPlanning recovery window for PR #201 because EFF-027 is reload resilience, not a hidden recipe-bookmark feature. Longer-term recipe saving belongs in future Saved/History memory work.

## Open questions

- Should a future explicit "Saved recipes" surface let users keep recipe suggestions beyond the short recovery window?
- Which substates should be restored directly, and which should fall back to the Planning choice screen with a visible resume affordance?
- How should the app distinguish an intentional Back-to-Planning action from an unexpected reload while still in the workflow?
- Should Slop Bowl receive the same active-flow restoration treatment, or should this first slice focus only on Chef It Up / MealPlanning?
- Should deployment refreshes preserve active workflow state the same way as local Replit/Vite reloads?

## Agent checklist

Read EFF-027 before starting any of the following:

- [ ] Changing app-shell bootstrap routing for complete guest or linked profiles.
- [ ] Changing MealPlanning session cache keys, validation, freshness, or clear behavior.
- [ ] Changing Chef It Up Back/Refresh/Cook state transitions.
- [ ] Adding reload/remount resilience for Planning, Ticket Pass, Prep Tray, or active cooking entry.
- [ ] Debugging reports of users being returned to the Planning choice screen mid-flow.

## Resolution criteria

This Effort is `Resolved` when all of the following are true:

1. A hard reload/remount during an active Chef It Up flow restores directly to the valid active MealPlanning substate for the same profile.
2. Intentional exits still return to the Planning choice screen and do not auto-reopen stale Chef It Up state.
3. Profile fingerprint changes invalidate stale active workflow state rather than restoring a mismatched session.
4. Guest and linked-user paths are covered by focused tests.
5. Replit validation confirms reload/remount recovery during Ticket Pass or Prep Tray on the exact PR head.
6. Any remaining reload causes that are environment-only are documented as negative scope rather than product blockers.

## Linked artifacts

- [`INIT-001: Mobile Refresh`](../initiatives/INIT-001-mobile-refresh.md)
- [`PD Phase 3.1 Recipe Imagery`](../product-decisions/features/mobile-refresh/pd-phase-03-1-recipe-imagery.md)
- [`EFF-025: Settings unsaved inventory reminder`](effort-025-settings-unsaved-inventory-reminder.md)
- [`client/src/pages/app.tsx`](../client/src/pages/app.tsx)
- [`client/src/components/cooking/meal-planning.tsx`](../client/src/components/cooking/meal-planning.tsx)
- [`client/src/lib/planningCache.ts`](../client/src/lib/planningCache.ts)
- PR #192 validation screenshots and handoff notes

## 2026-06-18 - Created from PR #192 Replit validation

Wilson's PR #192 Replit smoke showed the app return to the Planning choice screen during selected-image validation. The Network tab showed full Vite/React module reload markers (`@react-refresh`, `main.tsx?t=...`, `App.tsx?t=...`, `cooking-new.tsx?t=...`, and related modules), while the terminal showed branch sync/head movement. That evidence points to a validation-environment reload, but the user pain is product-relevant: the app should restore the active Chef It Up workflow directly when a valid session exists.

PR #192 should stay focused on recipe imagery because the selected-image behavior passed: Prep Tray showed the selected image and Ticket Pass stayed placeholder-only. EFF-027 owns the next high-priority reload/remount resilience slice.

## 2026-06-18 - Active MealPlanning restore branch

Branch `codex/eff-027-active-workflow-reload` implements the first reload-resilience slice: app bootstrap now checks the scoped MealPlanning session after the profile loads, validates the profile fingerprint and 15-minute session freshness, and enters Chef It Up directly when the saved session is still active. Active Settings restore and active Live Cooking restore keep precedence, and explicit exits to the Planning choice clear the MealPlanning restore key so users are not trapped back inside Chef It Up after choosing to leave. Recipe suggestions that users want to keep longer should become explicit Saved/History memory work rather than stretching this transient recovery cache.

Local regression coverage now includes linked and guest MealPlanning restore after remount, expired-session cleanup, stale-profile invalidation, and Back-to-Planning cleanup. This does not resolve the Effort yet because exact-head Replit validation still needs to force a browser reload during Ticket Pass or Prep Tray and confirm the same active workflow returns.
