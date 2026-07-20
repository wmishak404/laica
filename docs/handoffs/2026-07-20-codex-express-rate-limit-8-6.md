# Express rate-limit 8.6.0 upgrade

**Agent:** codex
**Branch:** `codex/deps-express-rate-limit-8-6`
**Date:** 2026-07-20
**Initiative:** none
**INIT updated:** n/a
**Resolves blocked handoff:** none

## Summary

This focused server-middleware branch replaces Dependabot PR #315 with the same `express-rate-limit` `8.5.2` to `8.6.0` package result on a same-repository branch, then closes the prior coverage gap around LAICA's two package-backed global request limiters. The added regression tests exercise the exported `appRequestLimit` and `apiRequestLimit` through Node's HTTP request/response lifecycle, rather than relying on their intentional `NODE_ENV=test` passthrough or duplicating production limiter configuration.

The official 8.6.0 changelog reports one fix for negative `used` counts when skip options overlap a window reset, plus debug logging, time constants, and once-per-validation execution. LAICA does not configure either skip option and does not adopt the new constants or debug facility in this slice. The release contains no breaking entry; the real-middleware tests verify the LAICA-used default MemoryStore, draft-8 header, path-scoping, and rejection boundaries.

## Changes

- `package.json` updates `express-rate-limit` from `^8.5.2` to `^8.6.0`.
- `package-lock.json` records `express-rate-limit@8.6.0` and its declared `debug@^4.4.3` dependency. The dependency-specific manifest and lockfile hunks match Dependabot head `0b0af1dc577616d745be5e675d2572f8c6aa2f1d`; the rest of the lockfile preserves the audit remediation merged through PR #322.
- `tests/unit/express-rate-limit-middleware.test.ts` loads the real exported global limiters under the development runtime branch and sends requests through the existing no-TCP Node HTTP harness.
- `server/rate-limit.ts` is intentionally unchanged; production thresholds, standard response payload, middleware placement, custom user/IP limiters, distributed store behavior, and test passthrough stay on the existing path.

## Effort and initiative routing

- **EFF-023:** conforms to the accepted focused server-runtime/middleware upgrade lane. The branch does not absorb another dependency update or reopen the deferred broad modernization bundle, so EFF-023 status does not change.
- **EFF-017:** exact-head same-repository CI remains required because Dependabot PRs cannot supply the repository E2E secret lane. This slice does not change environment authority or EFF-017 status.
- **INIT:** no active initiative owns this package-only middleware compatibility slice, and no phase, product direction, or initiative resume point changes. No INIT was updated.

## Test impact review

### Value claim

LAICA's broad application and `/api` abuse ceilings continue to allow requests below their configured thresholds, emit the configured draft-8 rate-limit metadata, and return the typed `RATE_LIMITED` 429 response with `Retry-After` after exhaustion on `express-rate-limit@8.6.0`.

### Coverage added

- Happy path: requests below both configured limits reach their route and expose decrementing draft-8 `RateLimit` plus `RateLimit-Policy` headers.
- Boundary/non-happy path: the next request returns HTTP 429, a positive `Retry-After`, and LAICA's exact `{ code: "RATE_LIMITED", message: "Too many requests. Try again later." }` JSON body.
- Scoping corner case: mounting `apiRequestLimit` at `/api` leaves `/health` unmetered while `/api/health` is limited.
- Header contract: the test confirms legacy `X-RateLimit-Limit` is absent for the app limiter because production config sets `legacyHeaders: false`.

### Evidence limits

- The test uses the package MemoryStore and deterministic IPv4 HTTP harness. It does not prove multi-instance/distributed database limiting, IPv6 proxy normalization, the package's skip options, Replit proxy headers, or production traffic behavior.
- LAICA's custom user/IP/count-based limiters use the repository implementation rather than `express-rate-limit` and remain covered by `tests/unit/rate-limit.test.ts` and route-contract tests; their behavior is unchanged by this package update.
- No schema, secrets, auth/session, provider, UI, client, navigation, deployment configuration, or rate-limit threshold changes are included.

## Validation lane

- **Risk lane:** automation-primary. This is a narrow compatible middleware dependency update with deterministic real-middleware tests, full local static/build/unit checks, and required exact-head same-repository GitHub unit/E2E/security lanes.
- **Human Replit validation:** deferred to release/batch validation. The existing PR #244 rate-limit entry in `docs/production-validation-registry.md` already calls for ordinary shared-network request and admin-throttle smoke. No new registry entry is needed because this branch changes neither that runtime policy nor its focused production smoke.
- **Future-bug breadcrumb:** if normal shared-network traffic is unexpectedly blocked after release, inspect `appRequestLimit`/`apiRequestLimit` draft-8 headers and the typed 429 payload before investigating route-specific custom buckets.

## Impact on other agents

PR #315 must remain open until the same-repository replacement PR is open and all exact-head gates pass. Close it as superseded only after the replacement is green; do not merge both package graphs.

## Open items

- Exact-head GitHub `unit`, `e2e_guest_smoke`, dependency audit, TruffleHog, and CodeQL evidence is pending until the branch is published and marked ready.

## Verification

- Base provenance: rebased conflict-free onto fresh `origin/main` at `04b88c5cd4be383771d690a250cafda5eb031a03` after audit-remediation PR #322 and docs-only PR #319 merged.
- Source provenance: Dependabot PR #315 head `0b0af1dc577616d745be5e675d2572f8c6aa2f1d`; the replacement's express-rate-limit manifest and lock hunks match that source while the combined lockfile retains PR #322's patched transitive tooling entries.
- Official compatibility source: `https://express-rate-limit.mintlify.app/reference/changelog#860`.
- `npm ci` installed 1,053 packages reproducibly after the PR #322 rebase and reported one moderate advisory, with no high or critical findings.
- `npm run check` passed TypeScript and UI lint.
- `npm run build` passed the Vite client and esbuild server builds; existing Browserslist-age, Firebase mixed-import, and large-chunk warnings remained.
- `npm run test:unit` passed: 51 files / 391 tests.
- `npm run test:unit -- tests/unit/express-rate-limit-middleware.test.ts` passed: 1 file / 2 tests.
- `npm audit --audit-level=high` passed the required gate after the PR #322 rebase; live registry data reported one moderate advisory and no high or critical findings. Exact public advisory details remain in GitHub Security and local audit output.
- Exact-head GitHub validation remains pending.

## Stack / base status

- Base refreshed: yes
- Current base: `origin/main` at `04b88c5cd4be383771d690a250cafda5eb031a03`
- Last Replit-validated at: human Replit validation deferred to release/batch validation
- Notes: independent focused replacement for PR #315, rebased conflict-free after lock-only remediation PR #322 and docs-only coordination PR #319 merged. The branch preserves the merged audit fix and limits its own package diff to express-rate-limit 8.6.0.
