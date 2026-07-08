# Security feedback rate-limit hardening

**Agent:** codex  
**Branch:** codex/security-feedback-rate-limit  
**Date:** 2026-07-07  
**Initiative:** none  
**INIT updated:** n/a  
**Resolves blocked handoff:** none

## Summary

This branch applies the current security automation's low-risk feedback-route hardening recommendation without changing the feedback schema or auth semantics. Anonymous feedback remains supported, authenticated feedback still attaches the Firebase uid when available, and feedback writes now pass through the existing feedback-specific IP limiter before the database write.

## Changes

- `server/routes.ts` wires the existing `feedbackIpLimit` middleware onto `POST /api/feedback`.
- `server/rate-limit.ts` updates the feedback limiter comment so it matches the now-active route behavior.
- `tests/unit/p0-route-contracts.test.ts` resets custom rate-limit buckets around the route-contract suite and asserts feedback responses include the feedback limiter header for anonymous and authenticated writes.

## Impact on other agents

- Feedback remains an anonymous-capable route; do not add auth as a side effect of future feedback hardening unless Wilson explicitly changes that product requirement.
- The limiter default is still controlled through the existing `RATE_LIMIT_FEEDBACK_HOUR` override path.
- This branch is independent of the open Dependabot maintenance PRs.

## Open items

- GitHub CI/security checks must rerun on the 2026-07-08 rebased PR head before merge.
- Human Replit validation is not required before merge for this narrow route-boundary patch under the automation-primary lane. If this joins a release validation batch, the smallest manual smoke is: open the app, submit feedback anonymously, submit feedback while signed in, and confirm no unexpected 429 for normal single submissions.
- Last Replit-validated at: not yet validated; release/batch validation only if Wilson wants a runtime smoke before publish.

## Stack / base status

- Base refreshed: yes
- Current base: `origin/main` at `809aa0ed7a963e401192722ea8382a18c7c24e52`
- Last Replit-validated at: not yet validated
- Notes: fresh branch from current `origin/main`; not stacked on another PR. Rebased cleanly on 2026-07-08 after PR #270 merged.

## Verification

Value claim: feedback writes keep their existing user-facing behavior while adding route-specific abuse resistance before the database write.

Evidence:
- `npm ci` passed and reported `found 0 vulnerabilities`.
- `npx vitest run tests/unit/p0-route-contracts.test.ts tests/unit/rate-limit.test.ts` passed: 3 files / 34 tests.
- `npm run test:unit` passed on the rebased head: 46 files / 349 tests. The first sandboxed attempt hit Vitest temp-file `EPERM`; the rerun outside the sandbox passed.
- `npm run check` passed: TypeScript plus UI lint.
- `npm run build` passed with existing Vite/Browserslist/chunk-size warnings only.
- `npm audit --audit-level=high` passed with `found 0 vulnerabilities`.
- `git diff --check` passed.

Evidence limits:
- Local tests use the mocked route harness and do not prove Replit runtime behavior, live Firebase sign-in, or production proxy/IP behavior.
- GitHub PR checks are pending until the rebased branch is pushed and the required workflows complete.
