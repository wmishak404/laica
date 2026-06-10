# Remove legacy Replit auth dependency island

**Agent:** codex
**Branch:** `codex/remove-legacy-replit-auth-deps`
**Date:** 2026-06-10
**Initiative:** none
**INIT updated:** n/a

## Summary

This branch removes the unused legacy Replit OIDC/session path that kept a blocked transitive package in the install graph. The active auth path remains Firebase Auth; the cleanup is dependency and environment-parity hygiene so Replit clean installs can succeed before PR #159 resumes Replit observation.

## Changes

- Deleted `server/replitAuth.ts`, which was not imported anywhere and would throw at module load without legacy Replit OIDC env.
- Removed unused legacy auth/session dependencies and types from `package.json` and `package-lock.json`: `memoizee`, `openid-client`, `passport`, `passport-local`, `express-session`, `connect-pg-simple`, `memorystore`, and related local type packages.
- Updated `CLAUDE.md`, `AGENTS.md`, `replit.md`, and `docs/workflows/environment-parity-spec.md` so `SESSION_SECRET` / `ISSUER_URL` are no longer current app contract variables. `REPLIT_DOMAINS` remains documented for the Vite development-host allowlist.
- Added an EFF-017 note recording the package-firewall blocker and the rule of thumb to delete obsolete dependency islands instead of overriding them when search proves the code path is dead.

## Impact on other agents

PR #159 should rebase after this cleanup merges, then rerun exact-head validation. Do not reintroduce Replit OIDC/session auth without a new accepted auth design. If old `SESSION_SECRET` or `ISSUER_URL` entries remain in local encrypted env or Replit Secrets, they can be retired separately; this branch intentionally does not edit secret values.

## Open items

- GitHub CI/E2E should run on the pushed PR head.
- Replit clean-install validation should run against this branch to prove the package-firewall blocker is gone in the environment that previously failed.
- After merge, rebase `codex/init-002-phase-1-telemetry` / PR #159 onto fresh `origin/main`.

## Verification

Local macOS worktree checks:

- `git diff --check` passed.
- `npm ci` passed: 852 packages installed, 0 vulnerabilities.
- `npx vitest run tests/unit/security-hardening.test.ts tests/unit/firebase-auth.test.ts tests/unit/firebase-auth-client.test.tsx tests/unit/auth-session-route.test.ts tests/unit/dev-auth-route.test.ts` passed: 5 files / 24 tests.
- `npm run check` passed.
- `npm run build` passed with existing Browserslist, Firebase dynamic/static import, and large-bundle warnings.
- `npm run test:unit` passed: 34 files / 230 tests.
- Package-lock scan confirmed `es5-ext`, `memoizee`, `openid-client`, `passport`, `passport-local`, `express-session`, `connect-pg-simple`, and `memorystore` are absent.

Local E2E was not run because this worktree has no `.env.keys`, and local decrypted E2E is diagnostic unless it points at an equivalent prepared non-production database. Use GitHub `e2e_guest_smoke` as the exact-head merge-gate E2E evidence.
