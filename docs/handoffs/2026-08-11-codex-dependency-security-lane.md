# Dependency security lane hardening

**Agent:** codex
**Branch:** `codex/dependency-security-lane-2026-08-11`
**Date:** 2026-08-11
**Initiative:** none
**INIT updated:** n/a
**Resolves blocked handoff:** none

## Summary

LAICA now has a narrower security-maintenance path: Dependabot keeps npm security updates while routine npm version PRs stop consuming the queue, GitHub Actions maintenance is cooled instead of disabled, the high/critical audit runs daily, and the accepted TruffleHog security release uses an immutable action commit with an aligned scanner image version. Unit guards preserve these invariants so future automation drift fails before review.

## Changes

- `.github/dependabot.yml` disables npm version-update PRs while retaining production and development security groups; it retains GitHub Actions security and patch/minor groups with a 14-day cooldown.
- `.github/workflows/dependency-audit.yml` adds daily and manual triggers to the existing PR/`main` high/critical audit.
- `.github/workflows/secret-scan.yml` pins both TruffleHog action wrappers to the full signed `v3.96.0` commit and aligns both explicit scanner inputs on `3.96.0`.
- `tests/unit/dependency-security-workflow.test.ts` requires identical full-length TruffleHog SHA pins, scanner-version alignment, daily/on-demand audit triggers, security-only npm automation, and cooled Actions maintenance.
- EFF-017 records the new time-based CI signal; EFF-023 records the security-only dependency posture and preserves deferred migration boundaries.

## Impact on other agents

- Do not restore routine npm patch/minor groups without a newly accepted maintenance objective; npm security PRs remain active despite the zero version-PR limit.
- Keep each TruffleHog `uses` SHA's same-line version comment paired with the same explicit `version` input. The unit test rejects movable tags, divergent SHAs, and version drift. Dependabot can update SHA-pinned Actions when the version comment stays on the same line.
- GitHub Actions version updates remain a review source after the 14-day cooldown; security updates are not delayed by that cooldown.
- New high/critical advisories can now fail the scheduled audit without a repository change. Remediate from fresh `main` using the smallest lockfile or dependency slice that clears the current finding.

## Open items

- Broad modernization remains deferred under EFF-023, including Zod 4 and react-day-picker 10 migrations.
- This PR is stacked on dependency-closeout PR #353 because both add chronology to EFF-023. After #353 merges, rebase this branch onto fresh `origin/main`, retarget the PR, and rerun exact-head checks.
- Human merge approval remains required because this changes dependency/security repository configuration.
- GitHub repository settings were verified read-only on 2026-08-12: dependency graph, Dependabot alerts, and Dependabot security updates are enabled. Malware alerts are disabled, and GitHub's preset rule auto-dismisses low-impact development-scoped alerts; changing either setting requires a separate explicit repository-security decision.

## Verification

Local validation on Node `24.14.1` passed:

- `npm ci` — 1,017 packages installed; zero vulnerabilities reported
- focused workflow tests — 3 files / 9 tests passed
- `npm run test:unit` — 53 files / 411 tests passed
- `npm run check` — TypeScript and UI lint passed
- `npm run build` — Vite client and esbuild server builds passed with the existing chunk-size/dynamic-import warnings
- `npm audit --audit-level=high` — zero vulnerabilities reported
- `git diff --check` — passed

The final pushed head still requires the repository's GitHub checks. The PR check records are authoritative for GitHub workflow parsing, the updated TruffleHog scanner, the high/critical audit, and the schema-backed Playwright lane; do not merge if any exact-head check is missing or failing.

Replit validation is not required: this changes repository automation and scanner configuration, not application runtime behavior, deployment startup, secrets, schema, provider calls, auth/session, or UI. No production-validation registry entry is required for the same reason.

## Stack / base status

- Base refreshed: yes
- Current base: `origin/main` at `2ef2b62163c0fada0fc858fdd10442e3a573cda4`, plus lower-stack PR #353 head `5120356bbf60f87378eff9549509bea4100511cc`
- Last Replit-validated at: not applicable; repository automation only
- Notes: intentionally stacked on PR #353 due to the shared EFF-023 chronology; must rebase onto current `origin/main` after #353 merges
