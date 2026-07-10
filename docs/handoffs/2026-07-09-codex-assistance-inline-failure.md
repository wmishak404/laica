# Live Cooking assistance failure inline recovery

**Agent:** codex
**Branch:** `codex/init-001-assistance-inline-failure`
**Date:** 2026-07-09
**Initiative:** INIT-001
**INIT updated:** yes
**PR:** https://github.com/wmishak404/laica/pull/275
**Resolves blocked handoff:** none

## Summary

This branch makes Live Cooking safer during hands-busy help failures: if `Ask a question` cannot capture, transcribe, or answer the cook's question, the current step stays visible and a separate voice-help status panel appears outside the step guidance with a retry path. The cook no longer has to notice a transient toast, and operational errors stay isolated from step cues and captions.

For this branch, "help failure" means a non-recipe-changing technical failure state: microphone capture is unavailable or denied, recording times out, local voice usage limits are exceeded, transcription upload/service fails or returns no transcript, `/api/cooking/assistance` returns rate-limit/service/network/unknown failure, or the assistance route returns no usable answer. It does not mean a successful Ask-a-question answer, user correction, preference change, or future intentional recipe/step adaptation.

Architecture triage skipped owned or gated work: INIT-004 has open owned work in PR #272/#274, INIT-002 remains in Replit observation before schema work, INIT-003 waits on INIT-001 Phase 5 semantics, and INIT-001 PR #265 owns only a future voice-affordance docs note. The documented next independent Phase 4 slice after PR #269 was assistance failure handling / inline guidance recovery, so no Wilson product decision was needed.

## Changes

- `client/src/components/cooking/live-cooking.tsx`
  - Adds `assistanceIssue` state and a warm voice-help status panel separate from the Step guidance area.
  - Reuses `classifyAiRequestError` for `/api/cooking/assistance` failures.
  - Shows isolated recovery for microphone support/permission failures, recording timeout, voice usage limits, transcription/processing failures, empty assistance answers, and assistance-route failures.
  - Clears the issue when the cook retries or receives a normal assistant response.
  - Keeps operational failure copy out of speech playback and the captions transcript.
  - Leaves future successful Ask-a-question step adaptation out of scope.
- `client/src/index.css`
  - Adds `.live-cooking-ui .live-cooking-assistance-status` using existing warm cooking tokens and scoped specificity.
- `client/src/lib/voiceRecording.ts`
  - Expands operational-message filtering so inline failure copy is not spoken as assistant guidance.
- `tests/unit/live-cooking-guest-session.test.tsx`
  - Adds focused coverage for microphone-denial and assistance-route failure/retry behavior.
- `tests/e2e/cooking-workflow.test.ts`
  - Updates the guest smoke to assert the separate assistance status panel and verify step guidance does not contain the error.
- `product-decisions/features/mobile-refresh/pd-phase-04-cooking.md`
  - Records the branch as the implementation of the inline assistance-failure criterion.
- `initiatives/INIT-001-mobile-refresh.md` and `initiatives/registry.md`
  - Update current Phase 4 status/resume signal.

## Impact on other agents

Treat PR #191, #236, #256, #258, #260, #264, #269, and this branch together as the current Phase 4 Live Cooking baseline if this PR merges. This branch does not touch PR #265's future voice-activity affordance direction and does not change the prompt, provider contract, route schema, durable session schema, navigation, Finish/History semantics, or Phase 5 cleanup.

It also does not close the future R&D path where a successful `Ask a question` interaction could intentionally revise, branch, or adapt live cooking steps. This branch only prevents technical/quota failure states from changing or contaminating the current guide.

The visual addition conforms to PD-005 and `design_guidelines.md`: it stays inside the existing `live-cooking-ui` focus-mode surface, uses existing CSS variables, and keeps scoped computed-style specificity instead of adding raw hex or a new primitive.

## Open items

- Human Replit validation is deferred to release/batch validation unless Wilson asks for PR-level device microphone/provider smoke. Suggested release-batch check: deny microphone or force an assistance-route failure while in Live Cooking and verify the current step remains visible, the separate voice-help status appears outside step guidance, retry clears the panel, and captions/speech behavior remain sane.
- Full provider schema shape and Phase 5 cleanup remain later INIT-001 work.

## Verification

Focused local evidence so far:

- `npm ci` passed after dependencies were missing in this worktree.
- `npx vitest run tests/unit/live-cooking-guest-session.test.tsx --testTimeout=15000` passed: 43 tests.
- `npm run check` passed before PR open and again after the E2E assertion follow-up.
- `npm run build` passed with existing Browserslist/Firebase dynamic-import/chunk-size warnings.
- `npm run test:unit` passed: 48 files, 375 tests.
- `npm audit --audit-level=high` passed with 0 vulnerabilities.
- `git diff --check` passed.
- Local targeted Playwright did not reach the changed assertion because the local dotenvx database is missing `anonymous_recipe_usage`, so guest setup timed out before the Live Cooking path.
- GitHub exact-head checks passed for PR #275: `unit`, `e2e_guest_smoke`, `npm-audit`, `trufflehog_pr`, CodeQL, and Analyze checks.

Value claim: cooks are less likely to get stranded when voice help fails during a step. Evidence: focused Vitest proves microphone-denial and assistance-route failures render `assistance-status-issue`, keep the current step visible, avoid toast-only presentation, keep step guidance/captions clean, and clear on retry. Evidence limits: provider/network behavior is mocked; no live microphone, Replit device permission, real transcription, or real assistance provider call has been manually smoked yet.

## Stack / base status

- Base refreshed: yes
- Current base: `origin/main` at `9618a15`
- Current PR head: see PR #275 for the live exact-head check rollup.
- Last Replit-validated at: not yet validated / deferred to release-batch validation
- Notes: independent branch from current `origin/main`; not stacked on PR #265, #272, or #274.
