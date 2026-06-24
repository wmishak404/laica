# EFF-017 Auth Session Coverage

**Agent:** codex
**Branch:** codex/eff-017-auth-session-coverage
**Date:** 2026-06-24
**Initiative:** none
**INIT updated:** n/a
**Resolves blocked handoff:** none

## Summary

Daily Efforts hygiene found no active-list, registry, INIT-routing, or agent-entrypoint drift to fix. EFF-017 was selected for implementation because auth/session validation confidence is a shared dependency across Mobile Refresh, guest/linked-account flows, linked dev-auth CI, and release validation.

This branch adds focused client hook coverage for the generic `useAuth` session query. It does not change runtime behavior, validation authority, provider canaries, secrets/config, or Replit policy.

## Changes

- `tests/unit/use-auth-session.test.tsx`
  - Adds unit coverage for the `useAuth` session query.
  - Covers no Firebase token, linked session envelope, anonymous/guest session envelope, `401` signed-out handling, and non-OK session failure handling.
  - Asserts the `/api/auth/session` request uses the fresh Firebase bearer token.
- `efforts/effort-017-environment-parity-and-ci-confidence.md`
  - Records the coverage slice and clarifies remaining EFF-017 scope.
- `efforts/registry.md`
  - Refreshes EFF-017's last signal.

## Impact on other agents

EFF-017 remains `In Progress`. This slice closes one live-but-thin client auth coverage gap from the 2026-06-10 audit, but future work still needs separate decisions or slices for provider canaries, automated Replit-environment checks, coverage ratcheting, and broader live-surface coverage.

Do not treat this as proof of real Google popup completion, production identity-provider configuration, linked-account persistence flows, Replit deployment behavior, or provider-backed runtime behavior. Those remain in their named validation lanes.

## Open items

- Open a PR and wait for exact-head GitHub `unit` and `e2e_guest_smoke` checks.
- Merge only after Wilson's explicit approval because this is an implementation/test PR.
- EFF-022 remains avoided in this branch because PR #232 is open in the INIT-004/EFF-022 eval-reporting domain.

## Verification

- `npx vitest run tests/unit/use-auth-session.test.tsx` passed: 1 file / 5 tests.
- First `npm run test:unit` found one existing live-cooking assertion failure in `tests/unit/live-cooking-guest-session.test.tsx`, then the focused file passed immediately: 1 file / 18 tests.
- Second `npm run test:unit` passed: 45 files / 320 tests.
- `npm run check` passed.
- `npm run build` passed with existing Browserslist age, Firebase dynamic/static import, and chunk-size warnings.
- `git diff --check` passed.
- GitHub exact-head checks should be recorded in the PR before review.

## Stack / base status

- Base refreshed: yes
- Current base: `origin/main` at `0c94f76ab69ded678fd4cfff067f97e458bd80ac`
- Last Replit-validated at: not applicable for a unit-test-only auth hook coverage slice
- Notes: not stacked on another branch. Open PR #232 touches INIT-004 eval reporting and EFF-022; this branch intentionally avoids that domain.
