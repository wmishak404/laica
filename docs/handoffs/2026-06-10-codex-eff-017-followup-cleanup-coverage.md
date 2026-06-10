# 2026-06-10 — EFF-017 follow-up cleanup and history coverage

**Branch:** `codex/eff-017-followup-coverage`
**Base:** fresh `origin/main` after PR #165 merged as `255e7cc`
**Effort:** [`EFF-017`](../../efforts/effort-017-environment-parity-and-ci-confidence.md)

## Summary

This branch handles the next approved EFF-017 audit follow-up after the CI/ruleset/OAuth work: remove stale root testing artifacts, delete a confirmed-unused local username/password auth helper, and add focused coverage for the first live-but-thin history surface. The goal is to make automated-test evidence easier to trust by shrinking obsolete paths and adding behavior-specific coverage where users actually interact with saved cooking sessions.

## Changes

- Removed obsolete root test artifacts:
  - `test-runner.js`
  - `run-tests.sh`
  - `test-criteria.md`
  - `test-criteria-template.js`
- Removed unused `server/localAuth.ts` after repo search found no active imports or route wiring.
- Removed unused `bcrypt` and `@types/bcrypt` from `package.json` / `package-lock.json`.
- Updated native/runtime parity docs to stop naming removed `bcrypt` as a current repo dependency.
- Added accessible names for Cooking History action controls:
  - `Open history actions`
  - `Delete <recipe> from history`
- Added `tests/unit/cooking-history.test.tsx` covering:
  - loading skeletons and empty state
  - expanding saved session details
  - delayed single-session delete
  - undo before deletion commits
  - confirmed delete-all delay
- Updated EFF-017 with this branch's cleanup/coverage signal.

## Automation Evidence

### Focused history coverage

**Claim:** `CookingHistory` now has deterministic coverage for its main local UI states and destructive-action delay/undo behavior.

**Command/check provenance:** local macOS worktree, branch `codex/eff-017-followup-coverage`, `npx vitest run tests/unit/cooking-history.test.tsx`.

**Source provenance:** `tests/unit/cooking-history.test.tsx`; mocked `useCookingSessions`, `useDeleteCookingSession`, `useDeleteAllCookingSessions`, and `useToast`; real `CookingHistory` render.

**Observed result:** passed, 1 file / 5 tests.

**Reasoning:** the assertions exercise the component's user-visible rendering and the timer-delayed mutation behavior without touching provider services or real storage.

**Negative scope:** this does not prove the server cooking-session routes, real database deletes, Replit runtime behavior, or full linked Google login.

### Local gate

**Claim:** deleting stale files and removing `bcrypt` did not break TypeScript, lint, unit tests, or production build.

**Command/check provenance:** local macOS worktree, branch `codex/eff-017-followup-coverage`.

**Observed results:**

- `npm run check` passed.
- `npm run test:unit` passed: 39 files / 248 tests.
- `npm run build` passed with existing Browserslist age, Firebase dynamic/static import, and chunk-size warnings.
- `npm run test:coverage` passed: 39 files / 248 tests; honest-denominator line coverage 44.36%; `cooking-history.tsx` line coverage 76.08%.
- `git diff --check` passed.
- `npm audit --audit-level=high` passed: `found 0 vulnerabilities`.

**Reasoning:** these checks cover compile/lint safety, the full local unit regression suite, production bundling, non-blocking coverage visibility, whitespace hygiene, and high-severity dependency audit after a package removal.

**Negative scope:** local E2E was not run; GitHub `e2e_guest_smoke` should run on the pushed PR head and remains the accepted automated E2E merge gate.

## Validation Lane

Risk lane: **Automation-primary**, pending GitHub required checks on the pushed PR head.

Why: this branch removes unreferenced/stale paths, updates docs, removes an unused dependency, and adds mocked component coverage. It does not change auth provider behavior, runtime startup, schema, secrets, or live provider calls.

Human Replit validation: **not required before merge** unless GitHub E2E or required checks fail, because no Replit-only behavior is claimed.

## Remaining EFF-017 Follow-Up

- Broader dead-code sweep for product-shaped dormant surfaces still needs separate judgment before deletion.
- Broader `useAuth` and `live-cooking.tsx` coverage remain targeted-test backlog.
- Coverage thresholds/ratchet policy remains a decision after honest-denominator baselines are accepted.
- Provider canary scope, production/deployment proof, and automated Replit-environment gates remain separate EFF-017 lanes.
