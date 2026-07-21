# E2E Vite/App-Asset Limiter Capacity

**Agent:** codex
**Branch:** codex/e2e-rate-limit-capacity
**Date:** 2026-07-21
**Initiative:** none
**INIT updated:** n/a
**Resolves blocked handoff:** none

## Summary

This branch removes a pre-existing capacity ceiling from the Playwright-managed Vite/app-asset lane without changing production rate-limit behavior. It gives required E2E failures immediate `429` provenance instead of letting module-asset throttling surface later as an unrelated auth or visible-UI timeout. The correction is automation-primary CI infrastructure; no human Replit validation is required before merge.

## Causal evidence

- PR #325 added one browser case/fresh context, taking the schema-backed Chromium lane from eight to nine tests.
- Playwright starts the app through Vite dev mode.
- `server/vite.ts` applies `appRequestLimit` ahead of Vite/app assets.
- `appRequestLimit` defaults to 1,000 requests per IP per 15 minutes.
- The EFF-033 branch reproduction measured 112 responses for one cold page load; the eighth cold load began returning `429` for Vite module assets and the ninth navigation itself returned `429`.
- Therefore the linked smoke failure was a harness capacity defect exposed by the additional context, not evidence that EFF-033 changed linked auth or planning behavior.

## Changes

- `server/rate-limit.ts`
  - Adds an explicit E2E-only app/Vite asset limiter bypass used by Playwright-managed dev servers.
  - Rejects the bypass when `NODE_ENV=production`.
  - Keeps the production/default app ceiling at 1,000 and the API ceiling at 300.
  - Exposes focused middleware factories so the real configuration can be exercised without weakening ordinary unit-test behavior.
- `playwright.config.ts`
  - Opts only the Playwright-managed web server into the E2E bypass.
- `tests/unit/rate-limit-capacity.test.ts`
  - Sends 1,001 localhost-shaped requests through the E2E app middleware with no `429`.
  - Proves the production/default app limiter returns `429` on request 1,001.
  - Proves the API limiter still returns `429` on request 301 while the app bypass flag is present.
  - Proves production rejects the E2E bypass and Playwright actually sets the flag.
- `tests/e2e/e2e-test.ts` and the three existing E2E imports
  - Adds a shared unexpected-`429` observer without deleting, adding, skipping, combining, or reordering current-main tests.
  - Logs URL, status, method, resource type, frame, test, project, and retry immediately; attaches JSON diagnostics and fails the affected test.
- `.github/workflows/ci.yml` and `tests/unit/ci-workflow.test.ts`
  - Retain `test-results/` for 14 days when E2E fails and cover that workflow contract.
- `docs/workflows/testing-and-acceptance.md`, `efforts/effort-017-environment-parity-and-ci-confidence.md`, and `efforts/registry.md`
  - Record the durable E2E-only contract, causal learning, validation lane, and remaining EFF-017 scope.

## Impact on other agents

- PR #328's linked Ticket Pass restore implementation is unchanged. This branch starts from its verified merge commit `0dcb9b7208c4c8ad3315444fd80206fdb6feb76c` and only adds the separate harness correction.
- PR #325 / EFF-033 remains owned by task `019f819d-a277-7c32-9b60-f8f767c1ef16`; no EFF-033 product runtime, tests, or durable notes were copied or edited here.
- After this PR merges, PR #325 must rebase onto the merged harness and rerun the full exact-head nine-test schema-backed lane. That combined run is the authoritative EFF-033 proof.
- Guest Finish / PR #324 remains owned by task `019f819d-e182-79e2-96ea-1dbe6b15accd`. EFF-032 and EFF-034 remain deferred.

## Validation evidence

### Value claim

Reviewers and adjacent product branches can trust that adding a fresh Playwright context will not consume the production-sized Vite/app-asset request bucket, and any future unexpected E2E `429` will identify the limiter before a visible UI timeout obscures it.

### Local automation

- `npm ci`: passed; 1,053 packages installed, 1,054 audited.
- `npm run check`: passed.
- Focused limiter/workflow suite: `npx vitest run tests/unit/rate-limit-capacity.test.ts tests/unit/rate-limit.test.ts tests/unit/distributed-rate-limit.test.ts tests/unit/ci-workflow.test.ts` passed, 4 files / 26 tests.
- `npm run test:unit`: passed, 51 files / 396 tests.
- `npm run test:coverage`: passed, 51 files / 396 tests; 54.02% lines overall and 93.29% lines for `server/rate-limit.ts`. Coverage remains measurement-only.
- `npm run build`: passed with existing Browserslist-age, Firebase mixed-import, and large-chunk warnings.
- `npm audit --audit-level=high`: passed; one low `body-parser` and one moderate `protobufjs` advisory remain below the high/critical gate.
- `npx playwright test --project=chromium --list`: passed; exactly the existing eight current-main tests in three files, unchanged in order/count.
- `git diff --check`: passed.

The focused capacity suite initially used a real loopback listener. A full parallel local run exposed the worktree sandbox's `listen EPERM` restriction, so the final regression drives the real Express middleware with `127.0.0.1`-shaped requests directly. The focused and full suites pass with that deterministic form; the failed listener attempt is not merge evidence.

### Exact-head schema-backed E2E

Pending until the branch is pushed and GitHub `e2e_guest_smoke` runs against its disposable schema-only Neon branch. Current `main` contains eight Playwright tests; the ninth EFF-033 case remains intentionally only on PR #325.

### Reasoning

The capacity test connects the Playwright web-server flag to the exact middleware factory and crosses the former 1,000-request boundary. Separate negative tests exercise the unchanged production/default and API ceilings, while the existing focused suite exercises recipe user limits and distributed production limits. The production guard makes accidental enablement a startup error rather than a silent weakening.

### Evidence limits

This branch does not prove PR #325's EFF-033 layout, the later combined nine-test composition, real Google popup auth, live providers, Replit runtime behavior, or production deployment behavior. It does not change API/user/provider limiter values, production app limit defaults, schema, auth/session, product UI, provider calls, or validation authority.

## Risk / production-validation lane

- Risk lane: automation-primary.
- Human Replit validation: not required before merge; this is CI/test infrastructure with production behavior explicitly unchanged.
- Production validation registry: no entry added. The E2E-only flag is rejected in production, so there is no changed-since-last-production user/runtime surface to smoke. The focused release check remains normal startup/config sanity rather than a new product flow.
- Replit Agent: not used.

## Open items

- Commit and push the branch, open a draft PR, and update the PR evidence with the exact head SHA.
- Monitor the exact-head `unit`, `e2e_guest_smoke`, dependency, secret-scan, and CodeQL checks. A missing, skipped, or failed E2E job is a blocker.
- Do not merge without Wilson's explicit approval.

## Stack / base status

- Base refreshed: yes; `git fetch origin` completed before branching.
- Current base: `origin/main` at exactly `0dcb9b7208c4c8ad3315444fd80206fdb6feb76c`, the verified PR #328 merge commit.
- Relationship: independent harness prerequisite for PR #325, not a branch or test copy from PR #325.
- Human Replit validation: not required before merge.
