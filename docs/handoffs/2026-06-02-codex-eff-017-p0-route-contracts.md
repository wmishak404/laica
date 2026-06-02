# EFF-017 P0 route-contract coverage

**Agent:** codex
**Branch:** codex/eff-017-route-contract-p0
**Date:** 2026-06-02
**Initiative:** none
**INIT updated:** n/a

## Summary

This branch implements the first phased backlog item accepted after PR #119: route-contract coverage for high-value user-facing/service-writing routes that still lacked direct tests. The coverage is deliberately provider-light and local: OpenAI, ElevenLabs, storage, and DB writes are mocked, so these tests strengthen request/response/auth/ownership contracts without claiming live-provider quality or replacing Replit validation.

## Changes

- `tests/unit/p0-route-contracts.test.ts`
  - Adds mocked HTTP route-contract coverage for feedback writes, cooking assistance, ingredient alternatives, cooking-session start/update/complete/history/active/delete-one/delete-all, pantry reset, and speech voices.
  - Adds an explicit current-contract test for `POST /api/grocery/list`: shipping code still has the handler commented out, so the route returns `404` and does not call `getGroceryList`.
  - Covers linked-account durable-write gating for cooking sessions.
- `client/src/lib/voiceRecording.ts`
  - Extracts shipping operational-message detection, voice-recording silence constants, and time-domain volume calculation.
- `client/src/components/cooking/live-cooking.tsx`
  - Uses the extracted voice-recording helpers instead of private duplicated logic.
- `tests/unit/voice-recording.test.ts`
  - Replaces copied test-only logic with assertions against the real exported helpers.
- `efforts/effort-017-environment-parity-and-ci-confidence.md`
  - Records this branch, evidence, grocery-route caveat, and remaining EFF-017 backlog.
- `efforts/registry.md`
  - Updates EFF-017's latest signal.

## Impact on other agents

The P0 route-contract item is now locally covered for the listed shipped routes. The grocery/list route is not re-enabled here; future work should treat that as a separate product/behavior decision because the server handler is currently commented out even though a client helper exists.

The tests intentionally do not exercise live OpenAI or ElevenLabs calls. Future EFF-017 slices should continue with the accepted order: provider-light live-cooking smoke, mocked provider-boundary happy paths, coverage visibility/ratcheting, then UI/accessibility guardrails.

## Open items

- Push the branch and let GitHub Actions run before calling the PR merge-ready.
- Replit validation remains `not yet validated`; this branch does not change the Replit-primary policy.
- Live OpenAI output quality, ElevenLabs audio quality, Google linked-account login, production OAuth-domain preflight, admin eval/prompt-versioning workflows, `storage.ts` data-access integration, and Replit deployment behavior remain outside this branch.

## Verification

Commands run locally on `codex/eff-017-route-contract-p0` at base/head `979254935344309d80604701bc6554e557ca995b` plus working-tree changes:

- `npm ci` passed; npm reported `found 0 vulnerabilities`.
- `npx vitest run tests/unit/voice-recording.test.ts tests/unit/p0-route-contracts.test.ts` passed: 2 files, 23 tests.
- `npm run test:unit` passed: 30 files, 186 tests.
- `npm run check` passed.
- `npm run build` passed. Observed warnings were the existing Browserslist age notice, Firebase dynamic/static import chunk note, and chunk-size warning.
- `git diff --check` passed.

### Automation evidence reports

**Claim:** P0 user-facing route contracts are locally covered without live OpenAI/ElevenLabs calls.

**Command/check provenance:** `npx vitest run tests/unit/voice-recording.test.ts tests/unit/p0-route-contracts.test.ts` and `npm run test:unit` on local macOS/Codex worktree branch `codex/eff-017-route-contract-p0`.

**Source provenance:** `tests/unit/p0-route-contracts.test.ts` uses the repo's `requestHttp` in-memory server harness and mocks `../../server/openai`, `../../server/elevenlabs`, `../../server/storage`, and `../../server/db`. Assertions cover response status/body plus provider/storage/DB call arguments. `tests/unit/voice-recording.test.ts` imports from `client/src/lib/voiceRecording.ts`.

**Observed result:** Focused route/voice run passed 23 tests; full unit suite passed 186 tests across 30 files.

**Reasoning:** These tests prove the route handlers parse the expected request bodies, enforce linked-account or auth boundaries where asserted, call mocked dependencies with the expected arguments, and return the expected local response shapes. Because the provider modules are mocked, a passing result cannot be caused by or dependent on live OpenAI/ElevenLabs availability.

**Negative scope:** No live OpenAI generation/transcription, ElevenLabs audio quality, real DB/storage integration, Google popup login, Replit deployment behavior, production OAuth-domain preflight, or Playwright browser journey is proven by this branch. `POST /api/grocery/list` is covered only as currently disabled (`404`).

**Claim:** The stale copied voice-recording unit test has been replaced with coverage against shipping logic.

**Command/check provenance:** Same focused Vitest run plus `npm run check` and `npm run build`.

**Source provenance:** `client/src/lib/voiceRecording.ts`, `client/src/components/cooking/live-cooking.tsx`, and `tests/unit/voice-recording.test.ts`.

**Observed result:** Focused voice tests passed; TypeScript and build passed.

**Reasoning:** The component now imports `isOperationalMessage`, `VOICE_RECORDING_SILENCE_CONFIG`, and `calculateTimeDomainVolume` from the same helper module that the unit test imports, so the test no longer re-declares copied behavior that can drift from the component.

**Negative scope:** This does not prove real microphone capture, browser MediaRecorder behavior, audio playback, or mobile permission UX; those remain browser/Replit/provider-facing validation gaps.

## Stack / base status

- Base refreshed: yes
- Current base: `origin/main` at `979254935344309d80604701bc6554e557ca995b`
- Last Replit-validated at: not yet validated
- Notes: branch started from `origin/main` after PR #119 merged as `979254935344309d80604701bc6554e557ca995b`.
