# Dependabot Neon Serverless Update

**Agent:** codex
**Branch:** codex/dependabot-neon-serverless-1-1
**Date:** 2026-06-23
**Initiative:** none
**INIT updated:** n/a
**Resolves blocked handoff:** none

## Summary

This branch converts Dependabot PR #223 into a Codex-owned same-repo replacement for the `@neondatabase/serverless` 1.1.0 update. The package change is narrow, but it touches the database client used by server startup and schema-health checks, so merge readiness depends on same-repo CI E2E evidence and a clear note about the local DB health result.

## Changes

- `package.json` updates `@neondatabase/serverless` from `^0.10.4` to `^1.1.0`.
- `package-lock.json` refreshes the resolved Neon package graph, removing no-longer-needed transitive type package entries from the old client version.
- `docs/handoffs/2026-06-23-codex-dependabot-neon-serverless.md` records the replacement-branch context and validation evidence.

## Impact on other agents

Dependabot PR #223 is superseded by Codex replacement PR #233. The npm patch bundle replacement PR #231 merged first, so this branch was rebased onto the updated `origin/main` before final validation.

The updated Neon client still supports the repo's `Pool` plus `neonConfig.webSocketConstructor` usage in `server/db.ts` and `scripts/db-schema-health.ts` at compile/build time.

## Open items

- Confirm same-repo GitHub checks pass on the final pushed head, especially `e2e_guest_smoke` with its schema-created Neon branch.
- Merge only after Wilson's explicit instruction and exact-head check evidence; do not merge the superseded Dependabot branch.

## Verification

- `rg -n "@neondatabase/serverless|neon\\(|Pool|neonConfig" server shared tests scripts .github` confirmed direct usage is limited to `server/db.ts` and `scripts/db-schema-health.ts`.
- `npm ci` passed and reported `found 0 vulnerabilities`.
- `npm run check` passed.
- `npm run build` passed with existing Browserslist/Firebase chunk-size warnings only.
- `npm audit --audit-level=high` passed with `found 0 vulnerabilities`.
- `git diff --check origin/main...HEAD` passed.
- `npm run test:unit` passed: 44 files / 315 tests.
- `npm run env:run -- npm run db:health` reached the database through dotenvx-injected env and the updated client, then failed on existing schema drift: missing expected tables and one expected column. Treat this as non-passing DB schema evidence, not as a Neon client compile failure. CI E2E with a schema-created Neon branch remains required.
- Dependabot PR #223 GitHub checks before replacement: `unit`, `npm-audit`, and `trufflehog_pr` passed; `e2e_guest_smoke` failed at the secrets preflight because Dependabot PRs do not receive the required E2E secrets.

Post-PR #231 rebase validation on 2026-06-23:

- Rebased cleanly onto `origin/main` at `21c30e14fc4936cd6f0be17d1ff45f561410388a`.
- `npm ci` passed and reported `found 0 vulnerabilities`.
- `npm run check` passed.
- `npm run build` passed with existing Browserslist/Firebase chunk-size warnings only.
- `npm audit --audit-level=high` passed with `found 0 vulnerabilities`.
- `git diff --check origin/main...HEAD` passed.
- `npm run test:unit` passed: 44 files / 315 tests.
- `npm run env:run -- npm run db:health` again reached the database through dotenvx-injected env and the updated client, then failed on the same existing schema drift: missing expected tables and one expected column. This remains non-passing DB schema evidence, not a Neon client compile failure.

## Stack / base status

- Base refreshed: yes
- Current base: `origin/main` at `21c30e14fc4936cd6f0be17d1ff45f561410388a`
- Last Replit-validated at: not applicable for routine dependency metadata update
- Notes: branch started from current `origin/main`, cherry-picked Dependabot commit `133d556003d46dc3a1246c39799fd87bd0874bce`, then rebased after PR #231 merged.
