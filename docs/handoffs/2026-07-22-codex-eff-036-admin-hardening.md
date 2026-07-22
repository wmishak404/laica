# EFF-036 admin access hardening

**Agent:** codex
**Branch:** `codex/post-publish-production-regression-2026-07-22`
**Date:** 2026-07-22
**Initiative:** none — standalone EFF-036
**INIT updated:** n/a
**Resolves blocked handoff:** none

## Summary

[PR #335](https://github.com/wmishak404/laica/pull/335) now restores the lost admin route hardening without exposing or changing the credential. Runtime commit `763a1eba2e7fe9566e1bf53779235b4a80579611` reinstates timing-safe comparison and mounts the existing dedicated limiter before authentication while keeping no-cache handling and PR #246's eval-report routes intact.

The masked Replit Publishing configuration shows the production credential entry is already synchronized to the workspace value. No secret copy, reveal, edit, unsync, relink, rotation, republish, or production request was performed. Release acceptance remains blocked until a separately authorized publish/restart and custom-domain smoke proves the corrected deployment.

## Changes

- `server/admin-routes.ts`: hashes provided/expected credentials to equal-length digests before `timingSafeEqual`, then mounts the existing dedicated limiter after no-cache handling and before authentication.
- `tests/unit/admin-cache-headers.test.ts`: covers valid success, equivalent missing/invalid denial, cache controls on all outcomes, threshold enforcement before protected handlers, test-only reset, and existing JSON/markdown eval-report behavior.
- `efforts/effort-036-production-admin-access-and-hardening.md`: moves EFF-036 to In Progress and records implementation, autoscale/shared-store reasoning, masked Replit evidence, and remaining production boundary.
- `docs/production-validation-registry.md`: adds the focused changed-since-production smoke and future-bug breadcrumb.
- Production regression docs/assets and PR metadata: remove the Replit workspace screenshot and redact operational request/deployment details; branch history was rewritten before implementation.

## Impact on other agents

- Production `createRateLimit` uses the existing shared database-backed bucket store by default, so the mounted admin limiter is shared across normal autoscale instances. Its existing database-error fallback is in-memory and therefore weaker across instances; do not overclaim unconditional global enforcement during a database limiter failure.
- `resetRateLimitBucketsForTest()` is the deterministic test reset. No production reset endpoint was added because that would expand the protected surface and weaken the design.
- Do not ask Wilson to copy the credential. The masked publishing entry is already synchronized to the workspace value.
- The prior standalone EFF-036 task was paused to preserve single-branch ownership after Wilson redirected implementation into PR #335.

## Open items

- Exact-head GitHub CI/E2E, dependency, secret-scan, and CodeQL evidence must pass after the final docs commit is pushed.
- This is a manual-Replit-before-merge risk lane because it changes protected admin authentication/rate limiting and the production credential mismatch is deployment-specific. Loading the branch into the shared Replit workspace was not performed.
- Wilson's separate explicit authority is required before merge and again before republish/production smoke.
- After authorized republish, a trusted process must verify valid success plus equivalent missing/invalid denial and cache controls. Do not live-flood the route; deterministic automation owns threshold/reset proof.
- The removed screenshot contained no secret value but did contain workspace metadata. The current PR diff/history no longer includes it. GitHub's cached PR references may retain unreachable old objects after a force-push; Wilson can contact GitHub Support if permanent cached-view removal is desired.

## Verification

- Focused: `npx vitest run tests/unit/admin-cache-headers.test.ts tests/unit/rate-limit.test.ts --testTimeout=15000` — 3 files / 22 tests passed.
- Full unit: `npm run test:unit` — 51 files / 401 tests passed.
- Static: `npm run check` — passed.
- Build: `npm run build` — passed with existing Browserslist-age, Firebase mixed-import, and chunk-size warnings.
- Dependency gate: `npm audit --audit-level=high` — passed the high/critical gate; existing one low and one moderate advisory remain.
- `git diff --check` — passed before documentation closeout.

## Stack / base status

- Base refreshed: yes
- Current base: `origin/main` at `742694d9d209dba04674ce7188319d7f449c4a6e`
- Last Replit-validated at: not yet validated; masked configuration inspection only, no branch/runtime load
- Notes: Wilson explicitly directed implementation into the existing evidence PR. Open EFF-034 PRs overlap some durable docs; refresh and re-audit if one merges first.
