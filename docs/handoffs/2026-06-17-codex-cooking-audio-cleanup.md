# INIT-001 Cooking Audio Lifecycle Cleanup

**Agent:** codex
**Branch:** `codex/init-001-cooking-audio-cleanup`
**Date:** 2026-06-17
**Initiative:** INIT-001
**INIT updated:** yes
**PR:** pending

## Summary

This branch closes the narrow Phase 4 audio lifecycle gap found during earlier Replit validation: leaving Live Cooking should stop Laica's voice instead of allowing delayed or in-flight speech to continue after the cook returns to Planning. The user value is a calmer, safer cooking exit path: Back, Finish, and unmount now share cleanup for speech playback, delayed speech, retry timers, and active recording work.

This is not the full Phase 4 cooking-guidance redesign. Ready Check, Coach Feed, timer redesign, inline AI recovery, Finish/history semantics, provider prompt changes, schema work, and Phase 5 cleanup remain future work.

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
- `tests/unit/live-cooking-guest-session.test.tsx`
  - Adds a regression where speech synthesis is already in flight, Back is pressed, the provider response resolves late, and no audio playback is started.
- `product-decisions/features/mobile-refresh/pd-phase-04-cooking.md`
  - Records the audio lifecycle cleanup slice and keeps broader Phase 4 scope out of this branch.
- `initiatives/INIT-001-mobile-refresh.md` and `initiatives/registry.md`
  - Mark the active branch and current INIT-001 resume state.

## Impact on other agents

Do not build broader Phase 4 UI or prompt work on this branch. Future Phase 4 branches should keep using the shared cleanup path for any new speech, recording, timer, or hands-busy audio feature so exit behavior stays centralized.

The active `codex/init-001-recipe-preview-images` branch remains untouched and likely owns async imagery/schema/cache work. PR #190 remains the active INIT-004 public fixture work and was not touched.

## Open items

- Open a PR and update this handoff/INIT PR fields with the PR number.
- Run exact-head local validation and GitHub `unit`, `e2e_guest_smoke`, `npm-audit`, `trufflehog_pr`, and CodeQL after the PR is ready for review.
- Human Replit validation is not required before merge for this narrow local lifecycle fix if CI/E2E passes, but a later Phase 4 closeout should still include Replit/mobile speech smoke for the full cooking-guide experience.

## Verification

Completed before this handoff:

- `npm ci` passed and installed this worktree's dependencies with 0 vulnerabilities.
- `npx vitest run tests/unit/live-cooking-guest-session.test.tsx` passed: 1 file / 6 tests.
- `npm run check` passed: TypeScript and UI ESLint.

Pending before merge readiness:

- `npm run test:unit`
- `npm audit --audit-level=high`
- `npm run build`
- `git diff --check origin/main...HEAD`
- GitHub exact-head required checks after PR creation.

## Stack / base status

- Base refreshed: yes
- Current base: `origin/main` at `34f361342d7793e21a187290b7df575bc6f5a1b8`
- Last Replit-validated at: not required before merge for this narrow lifecycle slice
- Notes: Started after PR #188/#189 landed on `main`; skipped open/owned PR #190 and the checked-out INIT-001 imagery branch.
