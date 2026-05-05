# Mobile Refresh Phase 3 Planning implementation

**Agent:** codex
**Branch:** codex/mobile-refresh-phase-3-planning
**Date:** 2026-05-05
**Initiative:** INIT-001
**INIT updated:** yes

## Summary

Implemented the first INIT-001 Phase 3 Planning pass: redesigned Planning entry hierarchy, rebuilt Chef It Up around time/cuisine/Ticket Pass/Prep Tray, refreshed Slop Bowl confirmation, and added shared planning-time plumbing through Slop Bowl generation.

Last Replit-validated at: not yet validated.

## Changes

- `shared/planning.ts`: added the approved four-stop planning time values, labels, prompt strings, storage key, and normalization helpers.
- `client/src/pages/app.tsx`: stores the user's last planning time client-side, prioritizes Chef It Up on Planning entry, moves Slop Bowl lower in the hierarchy, passes planning time into Chef It Up and Slop Bowl, and keeps Phase 2.2 bottom Cook/Menu structure.
- `client/src/components/cooking/meal-planning.tsx`: replaces the legacy four-step card flow with Phase 3 Time -> Cuisine -> Ticket Pass -> Prep Tray, removes avoid/specify, supports multi-select cuisines with exclusive `No preference`, and limits suggestions to exactly three.
- `client/src/components/cooking/slop-bowl.tsx`: updates the pantry confirmation copy to the approved "one more check" framing, keeps ephemeral quick-add/remove and 3+ ingredient gating, passes planning time to the API, and removes touched raw-hex button styling.
- `client/src/index.css`: adds the Phase 3 planning/Ticket Pass/Prep Tray/slop confirmation visual system and fixes bottom-nav CSS variables outside returning wrappers.
- `client/src/lib/openai.ts`, `server/routes.ts`, `server/openai.ts`: extend Slop Bowl API input with `planningTimeAvailable`; server validates the four approved values and feeds the time bound into the Slop Bowl prompt. Recipe suggestion prompt now frames `additionalIngredientsNeeded` as optional enhancements, not shopping requirements.
- `client/src/pages/cooking-new.tsx`: keeps the legacy cooking route compatible with the new `MealPlanning` props.
- `tests/unit/planning-time.test.ts`, `tests/unit/slop-bowl-route.test.ts`: cover planning-time normalization and Slop Bowl API time passthrough / validation.
- Docs updated: INIT-001, initiative registry, Phase 3 record, EPIC-004, EPIC-009, and EPIC-016.

## Impact on other agents

- Phase 3 intentionally stores last planning time in client localStorage for now. It does not repurpose `weekly_time` and does not add a DB schema change, in line with EPIC-010.
- Internal fields such as `pantryMatch`, `missingIngredients`, and `additionalIngredientsNeeded` remain in client/server contracts for compatibility, cooking-session history, and evaluation paths; the new Phase 3 UI does not expose them as match scores or mandatory grocery-list copy.
- Slop Bowl quick-add still uses `parseCommaSeparatedEntries`, including period-as-comma typo recovery from Phase 2.1.
- History share/cook-again/taste-memory behavior remains deferred to Phase 5.
- EPIC-016 is not resolved yet. This branch removes touched Slop Bowl raw-hex callsites, but visual comparison and the future EPIC-015 lint gate are still needed before closeout.

## Open items

- Wilson/Replit visual review against `phase-03-planning-flow.png` and `phase-03-ticket-pass.png`.
- Replit validation for authenticated Planning entry, Chef It Up time/cuisine flow, recipe generation, exactly-three Ticket Pass results, Prep Tray -> Cooking, New three, Slop Bowl quick-add/remove, Slop Bowl sparse-pantry guard, Slop Bowl generation, and Slop Bowl -> Edit pantry.
- Refresh `Last Replit-validated at` in the PR/handoff after Replit passes.
- Wilson decision still open if last planning time should become a real server-side profile field in a later pass. Current branch deliberately avoids that schema change.

## Verification

Passed:

- `npm ci`
- `npm run check`
- `npm run build`
- `npx vitest run tests/unit/planning-time.test.ts tests/unit/slop-bowl-route.test.ts`
- `git diff --check`
- Dotenvx dev-server boot smoke: `PORT=3000 npx @dotenvx/dotenvx run -- npm run dev` returned HTTP 200 on port 3000.

Not green / not authoritative:

- `npx vitest run` still fails on existing repo-wide harness issues outside this branch: `tests/e2e/cooking-workflow.test.ts` is a Playwright file collected by Vitest, and `tests/unit/voice-recording.test.ts` expects `MediaStream` in the test environment.
- Local authenticated visual smoke was not completed. The worktree can boot locally after linking `.env.keys`, but authenticated Planning requires real sign-in/profile state; Replit remains the validation gate for this deployment-bound phase.

## Stack / base status

- Base refreshed: yes
- Current base: `origin/main` at `b4c1747bd20b5be469d11b66f74c79a83fbc8887`
- Last Replit-validated at: not yet validated
- Notes: Branch started from fresh `origin/main` after PR #34 and the later EPIC-017 merge. EPIC-017 is deferred until INIT-001 completes and does not change the current Replit validation gate.
