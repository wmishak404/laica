# Dependency security merge closeout

**Agent:** codex
**Branch:** `codex/dependency-security-merge-closeout-2026-08-12`
**Date:** 2026-08-12
**Initiative:** none
**INIT updated:** n/a
**Resolves blocked handoff:** none

## Summary

The dependency PR queue review and its focused security-automation replacement are merged. PR #353 preserved the one-by-one close/defer rationale, and PR #354 put the accepted security-only maintenance lane on `main` with immutable scanner provenance, deterministic policy tests, daily high/critical auditing, and all required exact-head checks green. Broad dependency modernization remains separately deferred.

## Changes

- PR #353 merged as `d793ae43af295b8bde5a8389b040f1d7077615e8`.
- PR #354 merged as `12840c571a00ba77c2ed4cb8752b7b4ad29c72e8` from exact validated head `c71d6f42a5607b2a70e616657f74d5bb7c163054`.
- EFF-017 records that the time-based dependency-security lane is on `main`; its broader CI-confidence status remains `In Progress`.
- EFF-023 records the security-only posture and keeps broad modernization `Deferred`.
- No INIT or production-validation registry entry changed because the merged work affects repository dependency/security automation, not application runtime behavior.

## Impact on other agents

- Start future dependency work from fresh `origin/main`; do not reopen the closed Dependabot heads or infer current merge readiness from their historical checks.
- Treat a current security finding, observed defect/incompatibility, platform enforcement/deprecation, or accepted modernization objective as the trigger for an npm dependency slice.
- Preserve the full TruffleHog action SHA, same-line `v3.96.0` comment, and explicit scanner version together; the unit guard rejects movable tags and version drift.
- Dependabot's first evaluation from the updated default branch remains the operational confirmation of the new configuration.

## Open items

- GitHub repository malware alerts remain disabled. Wilson approved enabling them on 2026-08-12, but the signed-in browser interaction failed before dispatch and made no setting change. Smallest next action: repository `Settings → Advanced Security → Dependabot malware alerts → Enable`.
- GitHub's preset rule that auto-dismisses low-impact development-scoped Dependabot alerts remains unchanged; no decision was made to alter that separate security-policy setting.
- Monitor the first default-branch Dependabot evaluation and the first scheduled daily audit. Do not publish advisory-specific package paths or scanner details in this public repository.
- Zod 4, react-day-picker 10, Radix maintenance, provider SDK upgrades, and other routine npm modernization remain separate trigger-driven work under EFF-023.

## Verification

Exact PR #354 head `c71d6f42a5607b2a70e616657f74d5bb7c163054` passed all required checks:

- CI run `31655922432`
  - unit job `94310224267`: install, typecheck/lint, build, 411 unit tests, coverage baseline, and coverage upload passed
  - E2E job `94310224493`: protected-secret preflight, disposable Neon creation, schema push/health, Chromium install, guest + linked dev-auth smoke, and Neon cleanup passed
- Dependency audit run `31655922439`: passed
- SHA-pinned TruffleHog secret scan run `31655922433`: passed
- CodeQL run `31655921062`
  - `Analyze (actions)` job `94310222548`: passed
  - `Analyze (javascript-typescript)` job `94310222505`: passed

Local validation on the implementation branch also passed focused workflow tests (3 files / 9 tests), the complete unit suite (53 files / 411 tests), `npm run check`, `npm run build` with existing warnings, `npm audit --audit-level=high` with zero reported vulnerabilities, and `git diff --check`.

Human Replit validation was not required because no application runtime, deployment startup, schema, secret, provider, auth/session, or UI behavior changed.

## Stack / base status

- Base refreshed: yes
- Current base: `origin/main@12840c571a00ba77c2ed4cb8752b7b4ad29c72e8`
- Last Replit-validated at: not applicable; repository automation only
- Notes: fact-only post-merge closeout after PRs #353 and #354; no stacked implementation work remains
