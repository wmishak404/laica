# INIT-001 Cooking Audio Lifecycle Cleanup

**Agent:** codex
**Branch:** `codex/init-001-cooking-audio-cleanup`
**Date:** 2026-06-17
**Initiative:** INIT-001
**INIT updated:** yes
**PR:** [#191](https://github.com/wmishak404/laica/pull/191)

## Summary

This branch closes the narrow Phase 4 audio lifecycle gap found during earlier Replit validation: leaving Live Cooking should stop Laica's voice instead of allowing delayed or in-flight speech to continue after the cook returns to Planning. The user value is a calmer, safer cooking exit path: Back, Finish, and unmount now share cleanup for speech playback, delayed speech, retry timers, and active recording work.

This is not the full Phase 4 cooking-guidance redesign. Ready Check, Coach Feed, timer redesign, inline AI recovery, Finish/history semantics, provider prompt changes, schema work, and Phase 5 cleanup remain future work.

2026-06-18 follow-up: Wilson clarified that this PR's merge bar is the existing Live Cooking speech-arbitration matrix, not only the Back-to-Planning bug. PR #191 now implements that matrix for current Live Cooking controls: Step 1 speech after setup, Next/Previous interruption, competing speech actions, Ask for Help stop-before-recording, exit cleanup, mute persistence, unmute-no-autoplay, transcript fidelity, rapid actions, and timer interruption are covered by passing deterministic assertions in `tests/unit/live-cooking-guest-session.test.tsx`. This is still bounded to current Live Cooking speech controls and should not widen into Ready Check, Coach Feed, prompts, schema, or Phase 5 semantics.

## Triage

- INIT-004 Phase 3 is active in PR #190 (`codex/init-004-public-fixtures`), so this run treated that phase/branch as owned and did not revise, rebase, comment on, or extend it.
- INIT-001 Phase 3.1 async imagery has an active checked-out branch, `codex/init-001-recipe-preview-images`, so this run did not touch Meal Planning imagery or adjacent Ticket/Prep UI work.
- INIT-002 remains in Phase 2 Replit observation; Phase 3 DB persistence/admin work is still blocked on observation signal and Replit/schema coordination.
- INIT-003 later guest cook/history import work still waits on INIT-001 Phase 5 semantics.
- INIT-001 Phase 4 audio lifecycle was documented, independent of the active imagery branch, and tied to a concrete Replit-observed bug. The sequencing classification is parallel-safe with Phase 3.1 guardrails because this branch touches Live Cooking only.

## Changes

- `client/src/components/cooking/live-cooking.tsx`
  - Adds a shared `stopCookingAudioLifecycle` path used by Back to Planning, Finish, and component unmount.
  - Cancels delayed speech timeouts and mobile AudioContext retry timers.
  - Stops current ElevenLabs browser audio and cancels browser speech synthesis, including queued utterances.
  - Tracks the active cooking-audio lifecycle so late ElevenLabs synthesis responses are ignored before creating an `AudioContext` or starting playback.
  - Cancels active voice recording runs and prevents abandoned chunks from being processed after exit.
  - Adds current-request speech arbitration so new speech-bearing actions stop active/pending speech, stale synthesis promises cannot start playback, Mute is immediate and persistent across step navigation, and Unmute does not auto-play until an explicit Repeat Step or new speech action.
  - Normalizes step transcript assembly to avoid double punctuation while keeping the visible transcript as the exact synthesis payload.
- `tests/unit/live-cooking-guest-session.test.tsx`
  - Adds a regression where speech synthesis is already in flight, Back is pressed, the provider response resolves late, and no audio playback is started.
  - Converts Wilson's speech-arbitration acceptance seed into passing assertions for first-step speech, Next/Previous interruption, competing speech actions, Ask for Help, Mute, muted navigation, Unmute + Repeat Step, transcript fidelity, late synthesis, rapid actions, and timer interruption.
- `product-decisions/features/mobile-refresh/pd-phase-04-cooking.md`
  - Records the audio lifecycle cleanup slice, the speech-arbitration acceptance matrix, and the scope boundary that keeps broader Phase 4 out of this branch.
- `initiatives/INIT-001-mobile-refresh.md` and `initiatives/registry.md`
  - Mark the active branch and current INIT-001 resume state.
- `docs/evals/intakes/speech-interaction-acceptance-seed-2026-06-17.md` and `docs/evals/registry.md`
  - Register the speech-interaction eval seed as INIT-001 Phase 4 acceptance input, not current INIT-004 Phase 3 harness scope.
- `docs/workflows/testing-and-acceptance.md` and `docs/workflows/evaluations.md`
  - Add the goal/value acceptance discipline Wilson requested: start from the user's goal, protected value, bad experience, and observable proof before implementation mechanics.

## Impact on other agents

Do not build broader Phase 4 UI or prompt work on this branch. Future Phase 4 branches should keep using the shared cleanup path for any new speech, recording, timer, or hands-busy audio feature so exit behavior stays centralized.

The active `codex/init-001-recipe-preview-images` branch remains untouched and likely owns async imagery/schema/cache work. PR #190 remains the active INIT-004 public fixture work and was not touched.

## Open items

- Resolve the automated E2E validation lane before marking PR #191 ready. The exact-head local E2E attempt on 2026-06-18 failed outside the Live Cooking patch: local DB schema drift (`anonymous_recipe_usage` missing) blocked guest auth setup, and the existing landing accessibility guardrail reported auth-control color contrast failures.
- After the E2E lane is resolved or Wilson explicitly chooses a different validation lane, mark PR #191 ready and wait for non-draft GitHub unit/E2E/security checks.
- Human Replit validation may remain batched for the deterministic arbitration layer, but a later Phase 4 closeout should include Replit/mobile speech smoke for real device audio, microphone permission, and ElevenLabs/browser playback confidence unless Wilson requires PR-level manual smoke.

## Verification

Completed before this handoff:

- `npm ci` passed and installed this worktree's dependencies with 0 vulnerabilities.
- `npx vitest run tests/unit/live-cooking-guest-session.test.tsx` passed: 1 file / 6 tests.
- `npm run check` passed: TypeScript and UI ESLint.
- Branch base for the 2026-06-18 arbitration implementation: `origin/main` at `d42e3d115ab2296909d94974b46442013ce483ad`; use the pushed PR #191 head for exact-head CI and merge checks.
- 2026-06-18 dependency refresh: `npm ci` passed after the first broad unit attempt showed stale `node_modules` missing `@replit/object-storage`; audit output reported 0 vulnerabilities.
- 2026-06-18 focused arbitration run: `npx vitest run tests/unit/live-cooking-guest-session.test.tsx` passed 1 file / 18 tests after converting the speech matrix to executable assertions.
- 2026-06-18 full unit run: `npm run test:unit` passed 42 files / 305 tests after `npm ci`.
- 2026-06-18 typecheck/lint: `npm run check` passed.
- 2026-06-18 audit: `npm audit --audit-level=high` passed with 0 vulnerabilities.
- 2026-06-18 production build: `npm run build` passed; Vite emitted existing Browserslist/chunk-size warnings.
- 2026-06-18 diff hygiene: `git diff --check origin/main...HEAD` passed.
- 2026-06-18 automated E2E attempt: first `CI=true npm run env:run -- npm run test:e2e` failed before tests due sandbox EPERM on the local `tsx` IPC pipe; escalated rerun on port 5000 failed because the port was occupied; escalated rerun on `PORT=5019 PLAYWRIGHT_BASE_URL=http://localhost:5019` started and completed with 6 failures / 2 skipped. Observed blockers: local decrypted DB is missing `anonymous_recipe_usage`, causing guest auth/session setup failures in `tests/e2e/cooking-workflow.test.ts`, and `tests/e2e/accessibility-guardrail.test.ts` reports existing landing auth-control color contrast failures.

Pending before merge readiness after the 2026-06-17 acceptance expansion:

- Resolve or explicitly defer the E2E validation blockers, then rerun or trigger exact-head automated E2E and GitHub required checks.

## Stack / base status

- Base refreshed: yes
- Current base: `origin/main` at `34f361342d7793e21a187290b7df575bc6f5a1b8`
- Last Replit-validated at: not required before merge for this narrow lifecycle slice
- Notes: Started after PR #188/#189 landed on `main`; skipped open/owned PR #190 and the checked-out INIT-001 imagery branch.
