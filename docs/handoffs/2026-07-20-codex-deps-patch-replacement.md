# Dependabot npm patch replacement

**Agent:** codex
**Branch:** `codex/deps-patch-2026-07-20`
**Date:** 2026-07-20
**Initiative:** none
**INIT updated:** n/a
**Resolves blocked handoff:** none

## Summary

This branch carries Dependabot PR #297's audited patch bundle unchanged onto a same-repository branch based on current `origin/main`. It preserves the exact `package.json` and `package-lock.json` dependency result from Dependabot head `2f760229ef52b40559981a61ea3d48a2aa9079ce`, while allowing LAICA's required exact-head E2E job to run with the repository CI configuration. The replacement does not include PR #305's minor updates or any major dependency upgrade.

## Changes

- `package.json` and `package-lock.json`
  - Update the Radix UI patch family from PR #297, including aligned lockfile-only Radix resolutions.
  - Update `vitest` and the aligned `@vitest/coverage-v8` lockfile resolution.
  - Update `ws` with `@types/ws`.
  - Update `postcss`.
- `docs/handoffs/2026-07-20-codex-deps-patch-replacement.md`
  - Record scope, evidence, and the replacement relationship to PR #297.

## Effort interaction and risk

- **EFF-023:** conforms by keeping this replacement limited to the already-audited patch-only bundle. The package domains are explicit—Radix UI primitives, test/coverage tooling, WebSocket runtime/types, and PostCSS—and the branch does not absorb the broader failing minor bundle from PR #305.
- **EFF-017:** the Dependabot head passed its unit/check/build lane but could not supply the repository secrets required by `e2e_guest_smoke`. This same-repository replacement must use exact-head GitHub CI for the full automated gate; a missing or failed E2E job is not merge-ready evidence.
- **INIT:** no initiative status, phase, product direction, or resume point changes, so no INIT was updated.

## Impact on other agents

After the draft replacement PR exists and its exact-head CI is available, PR #297 can be closed as superseded. Do not merge PR #297 in addition to this branch, and do not combine PR #305's minor updates into this replacement.

## Verification

Local checks on Node `v24.14.1` with npm `11.11.0`:

- `npm ci` — passed; installed 1,106 packages and reported 0 vulnerabilities.
- `npm run check` — passed TypeScript and UI lint.
- `npm run build` — passed; retained the existing Browserslist-age, Firebase mixed-import, and large-chunk warnings.
- `npm run test:unit` — passed: 50 files, 389 tests.
- `npm run test:coverage` — passed: 50 files, 389 tests; 53.90% line coverage. Coverage remains informational, not a merge threshold.
- `npm audit --audit-level=high` — passed with 0 vulnerabilities.
- `git diff --check` — passed before commit.

## Evidence limits and Replit lane

- Exact-head `e2e_guest_smoke` is deferred to GitHub Actions on the pushed same-repository branch; local checks do not substitute for that gate.
- No browser, mobile visual, live OpenAI, ElevenLabs, Firebase/Google sign-in, DB-backed, or production deployment behavior was exercised locally.
- Human Replit validation is deferred to release/batch validation. This patch-only dependency maintenance does not change schema, secrets, auth contracts, provider code, runtime startup, or deployment configuration; a fresh risk signal from exact-head CI would reopen that lane.

## Stack / base status

- Base refreshed: yes
- Current base: `origin/main` at `53826d940d05004c7ec72561b7853ced59dcb870`
- Last Replit-validated at: human Replit validation deferred to release/batch validation
- Notes: independent replacement branch; rebased conflict-free after PR #306 and PR #307 merged. The audited package blobs remained identical to Dependabot head `2f760229ef52b40559981a61ea3d48a2aa9079ce`, so no lockfile regeneration was required.
