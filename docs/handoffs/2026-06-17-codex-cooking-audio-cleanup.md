# INIT-001 Cooking Audio Lifecycle Cleanup

**Agent:** codex
**Branch:** `codex/init-001-cooking-audio-cleanup`
**Date:** 2026-06-17
**Initiative:** INIT-001
**INIT updated:** yes
**PR:** [#191](https://github.com/wmishak404/laica/pull/191)

## Summary

This branch closes the narrow Phase 4 audio lifecycle gap found during earlier Replit validation: leaving Live Cooking should stop Laica's voice instead of allowing delayed or in-flight speech to continue after the cook returns to Planning. The accepted behavior is a quieter, current-surface-owned exit path: Back, Finish, and unmount now share cleanup for speech playback, delayed speech, retry timers, and active recording work.

This is not the full Phase 4 cooking-guidance redesign. Ready Check, compact cockpit/step guidance, timer redesign, inline AI recovery, Finish/history semantics, provider prompt changes, schema work, and Phase 5 cleanup remain future work. 2026-07-13 note: the earlier "Coach Feed" planning name was superseded by PR #260 and is not current product direction.

2026-06-18 follow-up: Wilson clarified that this PR's merge bar is the existing Live Cooking speech-arbitration matrix, not only the Back-to-Planning bug. PR #191 now implements that matrix for current Live Cooking controls: Step 1 speech after setup, Next/Previous interruption, competing speech actions, Ask for Help stop-before-recording, exit cleanup, mute persistence, unmute-no-autoplay, transcript fidelity, rapid actions, and timer interruption are covered by passing deterministic assertions in `tests/unit/live-cooking-guest-session.test.tsx`. This is still bounded to current Live Cooking speech controls and should not widen into Ready Check, compact cockpit/step guidance, prompts, schema, or Phase 5 semantics.

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

- PR #203 (`codex/e2e-release-blockers`) merged to `main` as `b6ba180b0e97300b1d299cb9df1c686a5e5dff7d` and cleared the unrelated landing auth-control contrast blocker that affected the earlier local E2E attempt.
- The default local dotenvx database drift remains an EFF-010 / EFF-017 evidence-environment issue, not a PR #191 product bug. Do not run `npm run db:push` against the decrypted `.env` DB; use GitHub's schema-only `e2e_guest_smoke` lane or a guarded local diagnostics sandbox if local reproduction is needed.
- Mark PR #191 ready after rebasing/pushing so non-draft GitHub unit/E2E/security checks run on the exact head, then update the PR evidence with observed results.
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
- 2026-06-18 rebase after PR #203: fetched `origin`, confirmed `origin/main` includes `b6ba180b0e97300b1d299cb9df1c686a5e5dff7d`, and rebased `codex/init-001-cooking-audio-cleanup` onto that base. The rebase was clean. PR #203's merge resolves the landing contrast blocker for PR #191's downstream validation lane; default local DB drift remains routed to GitHub `e2e_guest_smoke` or guarded local sandbox per EFF-010.
- 2026-06-19 current-main rebase: Wilson reported that Replit build `7274a62e63c933c6f41bdde0035d47cce5e8b7d3` still played audio after Back to Planning. Fresh `origin` showed that SHA is current `main`, does not contain PR #191 head `d3e1a41228b893002c9f73c1de3a6d3a7358107f`, and therefore is not evidence against the PR #191 fix. The branch was rebased onto `origin/main` at `7274a62e63c933c6f41bdde0035d47cce5e8b7d3`; focused `npx vitest run tests/unit/live-cooking-guest-session.test.tsx` passed 1 file / 18 tests before the status-doc refresh.
- 2026-06-19 Replit manual validation: Wilson loaded PR head `1bc9221398883064d9876e690e58f8cf75f1950d` and reported all 12 requested speech cases passed: first cooking step audio, Back to Planning stop, Next/Previous interruption, conflicting speech actions including hard refresh/mute/Ask Question, Ask for Help stop, Mute stop, mute persistence through steps, unmute-no-autoplay, Repeat Step after unmute, rapid action settling, and transcript fidelity.
- 2026-06-19 docs/workflow-only rebase: after manual validation, `origin/main` advanced to `12ce5230be924dd8d6841423f2e1c034cc76e651` through PR #204/#206 docs/workflow changes. PR #191 was rebased again to clear INIT/status conflicts without changing the Live Cooking runtime implementation; exact-head GitHub checks must be rerun after the force-push.

Pending before merge readiness after the 2026-06-17 acceptance expansion:

- Trigger and record exact-head GitHub required checks after marking PR #191 ready for review. If `e2e_guest_smoke` passes, the two known E2E blockers from the earlier local run are cleared for PR #191's merge-evidence lane.

## Stack / base status

- Base refreshed: yes
- Current base: `origin/main` at `12ce5230be924dd8d6841423f2e1c034cc76e651`
- Last Replit-validated at: `1bc9221398883064d9876e690e58f8cf75f1950d`
- Notes: Started after PR #188/#189 landed on `main`; skipped open/owned PR #190 and the checked-out INIT-001 imagery branch. Rebased after PR #203 merged the shared landing contrast release-blocker fix, then again after current `main` reached `7274a62`, then again after docs/workflow-only `main` reached `12ce523`.
