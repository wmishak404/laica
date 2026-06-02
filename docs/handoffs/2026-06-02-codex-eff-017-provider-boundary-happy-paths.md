# EFF-017 provider-boundary happy paths

**Agent:** codex
**Branch:** codex/eff-017-provider-boundary-happy-paths
**Date:** 2026-06-02
**Initiative:** none
**INIT updated:** n/a

## Summary

This branch implements the next accepted EFF-017 backlog item from the PR #119 coverage audit: provider-light route-level happy paths at the AI/speech/vision boundary. It adds deterministic unit coverage for the shipped route contracts while preserving the Replit-primary runtime policy and keeping routine automation away from live OpenAI, ElevenLabs, transcription, and vision provider calls.

## Changes

- `tests/unit/provider-boundary-happy-paths.test.ts`
  - Adds mocked happy-path tests for `POST /api/cooking/steps`, `POST /api/speech/synthesize`, `POST /api/speech/transcribe`, and `POST /api/vision/analyze`.
  - Adds invalid-request tests for each route to prove validation stops before provider calls.
  - Mocks `server/openai`, `server/elevenlabs`, and the direct `openai` constructor used by transcription.
  - Asserts response shape plus provider payload/context: trimmed cooking-step inputs, ElevenLabs voice/options payload, Whisper model/language/response format, and normalized image base64.
- `efforts/effort-017-environment-parity-and-ci-confidence.md`
  - Records the branch/base signal, local automation evidence, provider-light scope, and remaining negative scope.

## Impact on other agents

Do not duplicate this provider-boundary happy-path slice as a future EFF-017 item. The remaining accepted backlog items are now coverage reporting/ratcheting and UI/accessibility guardrails. This branch does not establish live provider quality or deployment behavior; it only proves route validation and provider-boundary payload wiring under mocks.

This branch has been rebased after PR #127 and PR #128 merged, so it now includes the anonymous-promotion CI retro, the testing workflow's CI gap-lane rule, and the INIT-003 Phase 5 checkpoint. Future EFF-017 follow-ups should use that lane model instead of widening this provider-boundary PR.

## Open items

- Let GitHub Actions produce CI evidence for the post-PR #128 rebased branch.
- Replit validation is not required for this branch because it is test-only/provider-light coverage plus EFF-017 coordination docs.
- Keep the routine gate provider-light; live provider checks still belong in explicit canary/eval work.
- Still unvalidated: live OpenAI quality, ElevenLabs audio quality, Google linked login, prod OAuth preflight, real storage integration beyond the harness, full Replit deployment behavior, Replit-shell Playwright until Chromium dependencies are configured, and exhaustive corner cases.

## Verification

Automation is evidence for the stated route-boundary claim, not a conclusion about full app correctness.

**Claim:** Provider-boundary route tests prove that the four requested routes validate representative invalid requests, return expected successful response shapes, and call mocked provider dependencies with the intended payload/context while making no live OpenAI, ElevenLabs, transcription, or vision calls.

**Command/check provenance:**

- Local macOS worktree `/Users/wilsonishak-macbookpro/.codex/worktrees/ba8b/laica`, branch `codex/eff-017-provider-boundary-happy-paths`, base `origin/main` at `f46798d82c1b8ede22daab1368168fe5863f3dd4`, rebased after PR #127 and PR #128 merged.
- `npm ci` passed and reported `found 0 vulnerabilities`.
- `npx vitest run tests/unit/provider-boundary-happy-paths.test.ts` passed on the rebased head: 1 file, 8 tests.
- `npm run test:unit` passed on the rebased head: 31 files, 204 tests.
- `npm run check` passed (`tsc` plus `eslint "client/src/**/*.{ts,tsx}"`).
- `npm run build` passed; observed the known Browserslist age, Firebase dynamic/static import, and chunk-size warnings.
- `git diff --check origin/main...HEAD` passed.

**Source provenance:**

- `tests/unit/provider-boundary-happy-paths.test.ts`
  - Mocks Firebase auth for linked-user route access.
  - Mocks `getCookingSteps`, `synthesizeSpeech`, `analyzeIngredientImage`, and the direct OpenAI transcription client.
  - Uses `tests/unit/http-test-client.ts` to exercise Express route handlers without binding a TCP port.
- Shipping route handlers in `server/routes.ts`
  - `POST /api/cooking/steps`
  - `POST /api/speech/synthesize`
  - `POST /api/speech/transcribe`
  - `POST /api/vision/analyze`

**Observed result:**

- Focused route-boundary test passed with all 8 assertions groups green.
- Full unit suite passed after adding the new file on top of the PR #127 base, with 31 files / 204 tests; the later PR #128 rebase was docs-only and requires refreshed CI on the rewritten head before merge.
- Static check and production build passed locally.

**Reasoning:**

- Because provider modules/constructors are mocked and the tests assert the mock calls, the automation proves route-level validation and payload handoff for representative happy paths without depending on provider credentials, network availability, provider quotas, model output quality, or audio/image service behavior.
- The validation tests show malformed route inputs return `400` before the corresponding mocked dependency is called, reducing risk that obvious invalid payloads reach provider boundaries.

**Negative scope:**

- Not live OpenAI quality.
- Not ElevenLabs audio quality.
- Not Google linked login.
- Not prod OAuth preflight.
- Not real storage integration beyond the harness.
- Not full Replit deployment behavior.
- Not Replit-shell Playwright until Chromium dependencies are configured.
- Not exhaustive corner cases.

## Stack / base status

- Base refreshed: yes
- Current base: `origin/main` at `f46798d82c1b8ede22daab1368168fe5863f3dd4`
- Last Replit-validated at: not required
- Notes: branch created after PR #123 (`d0869ca52b30e07017c9325ff9034b842d8a59df`) and PR #124 (`ab6cc77378ddc8e35b50a7423c8266773b772862`) merged, then rebased after PR #126 (`8282d5193f6eeef50eeecdff9f91bd029bbcd561`), PR #127 (`2aebd0f533e79fb8acbda76c7b0c4842512e5b08`), and PR #128 (`f46798d82c1b8ede22daab1368168fe5863f3dd4`) landed on `main`.
