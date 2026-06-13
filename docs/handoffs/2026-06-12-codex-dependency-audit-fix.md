# Dependency Audit Fix

**Agent:** codex
**Branch:** codex/dependency-audit-fix
**Date:** 2026-06-12
**Initiative:** none
**INIT updated:** n/a

## Summary

This branch clears the high-severity dependency audit failure that was blocking PR #173 and release-candidate promotion. The audit failure reproduced on clean `origin/main`, so it was not caused by the Settings remount mitigation; this branch isolates the dependency/security fix so #173 can rebase onto a green base after merge.

## Changes

- `package.json`: raises the direct `esbuild` dev dependency from `^0.26.0` to `^0.28.1`.
- `package.json`: adds an `@grpc/grpc-js` override to `^1.14.4` for Firebase / Google gax transitive paths.
- `package.json`: switches the existing `@esbuild-kit/core-utils` esbuild override to `$esbuild` and adds a top-level `esbuild` override to `$esbuild`, so Vite, tsx, drizzle-kit, and deprecated `@esbuild-kit` tooling resolve to the direct safe esbuild floor.
- `package-lock.json`: refreshes the resolved graph so all affected `@grpc/grpc-js` and `esbuild` paths dedupe to the safe versions. The lockfile diff is large because npm removes duplicated platform-specific esbuild subtrees under transitive packages after the override/dedupe.

## Impact on other agents

PR #173 (`codex/settings-save-remount-restore`) should be rebased onto `origin/main` after this dependency PR merges, then rerun GitHub CI on the rebased #173 head. The Settings mitigation validation remains separate; this branch only addresses the dependency/security gate.

Agents touching DB tooling should note that `drizzle-kit` still depends on deprecated `@esbuild-kit/esm-loader`, but the installed `esbuild` under that path now dedupes to `0.28.1`, and `npm audit --audit-level=high` is clean.

## Open items

- GitHub Actions are pending until this branch is pushed and the PR is opened.
- Human Replit smoke is not required for this dependency-only fix before merge; release smoke should run on the final rebased production candidate as usual.

## Verification

- `npm audit --audit-level=high --json` on clean `origin/main` before the fix reproduced 8 high vulnerabilities across `@grpc/grpc-js` and `esbuild` paths.
- `npm ci` after the fix completed successfully and reported `found 0 vulnerabilities`.
- `npm audit --audit-level=high` after the fix reported `found 0 vulnerabilities`.
- `npm ls esbuild @grpc/grpc-js @esbuild-kit/core-utils @esbuild-kit/esm-loader` showed `esbuild@0.28.1` deduped through drizzle-kit / Vite / tsx / @esbuild-kit and `@grpc/grpc-js@1.14.4` deduped through Firebase / Google gax.
- `npm run check` passed.
- `npm run build` passed; existing Browserslist age, Firebase mixed dynamic/static import, and chunk-size warnings remain.
- `npm run test:unit` passed: 39 files, 253 tests.

## Stack / base status

- Base refreshed: yes
- Current base: `origin/main` at `ca03c3ca411296e83a599ef74826056f6f0b631e`
- Last Replit-validated at: not Replit-validated; dependency-only fix with human Replit validation deferred to the final release candidate.
- Notes: independent security/dependency PR created to unblock #173 without mixing dependency changes into the Settings remount mitigation branch.
