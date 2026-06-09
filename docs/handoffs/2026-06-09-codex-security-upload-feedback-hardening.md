# Security Upload and Feedback Hardening

**Agent:** codex
**Branch:** codex/security-transcription-feedback-hardening
**Date:** 2026-06-09
**Initiative:** none
**INIT updated:** n/a

## Summary

This branch follows up on the 2026-06-09 security automation pass with narrow server-boundary hardening and no dependency churn. Public details stay at the coordination level; detailed scan evidence remains in private local automation artifacts.

## Changes

- `server/routes.ts`
  - Adds a server-side allowlist for speech upload MIME types before provider handoff.
  - Adds private/no-store response headers when feedback writes include an authenticated caller.
- `tests/unit/phase0-security-routes.test.ts`
  - Covers unsupported speech upload type rejection before provider calls.
- `tests/unit/p0-route-contracts.test.ts`
  - Covers private/no-store headers on authenticated feedback writes.

## Impact on other agents

- No schema, dependency, or client contract change.
- Existing browser-created WAV uploads remain accepted.
- Future speech upload format changes should update the server allowlist and provider-boundary regression tests together.

## Open items

- Wilson has approved the direction and asked to batch this with related security patches so manual Replit testing can happen once.
- Human Replit validation: deferred to release/batch validation.
- Suggested targeted release/batch validation: Firebase sign-in, feedback submission while signed in, and live cooking speech transcription with the configured provider secret.

## Risk annotation

| Field | Note |
|---|---|
| Risk lane | Batched release validation |
| Why this lane | Narrow server route-boundary hardening; no schema, dependency, or client contract change; focused route tests cover accepted/rejected cases |
| Evidence | Local checks and GitHub CI at the PR head; route tests in `tests/unit/phase0-security-routes.test.ts`, `tests/unit/p0-route-contracts.test.ts`, and `tests/unit/provider-boundary-happy-paths.test.ts` |
| Deferred/manual scope | Validate signed-in feedback submission and live cooking transcription in the next Replit security/release batch |
| Future-bug breadcrumb | If signed-in feedback or voice-question transcription regresses, inspect this route-boundary change first |

## Verification

- `npm ci` passed and reported `found 0 vulnerabilities`.
- `npx vitest run tests/unit/phase0-security-routes.test.ts tests/unit/p0-route-contracts.test.ts tests/unit/provider-boundary-happy-paths.test.ts` passed: 3 files / 42 tests.
- `npm run check` passed.
- `npm run build` passed with existing Vite/browserlist/chunk warnings only.
- `npm audit --audit-level=high` passed with `found 0 vulnerabilities`.
- `git diff --check` passed.

## Stack / base status

- Base refreshed: yes
- Current base: `origin/main` at `f24adafd9ee6d5b92d685607dd01e3e06aa3b8cf`
- Human Replit validation: deferred to release/batch validation
- Notes: independent low-risk security hardening branch from current `origin/main`; intended to batch with related security patches before production release.
