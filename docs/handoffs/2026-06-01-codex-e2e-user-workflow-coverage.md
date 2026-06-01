# Guest Planning E2E Coverage

**Agent:** codex
**Branch:** codex/e2e-user-workflow-coverage
**Date:** 2026-06-01
**Initiative:** none
**INIT updated:** n/a

## Summary

PR #118 merged and proved the CI harness can run from `main`; this branch starts the next EFF-017 step by expanding the provider-light guest E2E from setup-only coverage into the visible Chef It Up planning journey. The new test deliberately stubs the browser request to `/api/recipes/pantry` so routine CI can verify UI state transitions and request payload shape without requiring OpenAI in the basic merge gate.

## Changes

- `tests/e2e/cooking-workflow.test.ts`
  - Extracts the existing guest setup path into `completeGuestSetupToPlanning`.
  - Keeps the original smoke that proves guest setup reaches the planning-choice surface.
  - Adds a second Playwright smoke covering Chef It Up planning time, Mexican cuisine selection, staple confirmation, `/api/recipes/pantry` request payload assertions, three recipe tickets, and prep-tray rendering.
- `efforts/effort-017-environment-parity-and-ci-confidence.md`
  - Records the PR #118 post-merge `main` CI proof and the coverage intent for this branch.
- `efforts/registry.md`
  - Updates EFF-017's latest signal to point at PR #118's proof and this follow-up branch.

## Impact on other agents

The guest E2E lane is still intentionally provider-light. The new test does not claim OpenAI recipe quality, live provider availability, model output shape, or cooking-step generation. It claims that the UI now sends the right planning state into the pantry recipe route and can render deterministic recipe tickets/prep-tray output from a valid response.

This branch conforms to EFF-017 and does not change the current Replit-primary validation policy.

## Open Items

- Push the branch and let GitHub Actions run the expanded E2E against the Neon/Firebase/ElevenLabs CI environment.
- If the CI E2E exposes selector or timing drift, fix that in this branch before calling it merge-ready.
- Future separate EFF-017 slices still need linked-user/dev-auth coverage, live-provider canaries or evals, prod OAuth-domain preflight, and an explicit ADR/PD before CI becomes the primary validation authority.

## Verification

Local checks completed before handoff:

- `npm run check` passed.
- `npm run build` passed.
- `npx playwright test tests/e2e/cooking-workflow.test.ts --project=chromium --list` discovered both Chromium E2E tests.
- `git diff --check` passed.

Local E2E execution was not attempted in this Codex sandbox because the local Node runtime cannot bind listening sockets here. GitHub Actions is the required E2E proof for this branch.

## Stack / base status

- Base refreshed: yes
- Current base: `origin/main` at `154198809e24aa4f50ab9650d8289faf0cb86a8f`
- Last Replit-validated at: not yet validated
- Notes: branch started after PR #118 merged to `main`; post-merge `main` CI passed on the same merge commit.
