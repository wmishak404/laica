# Dependabot Risk Split

**Agent:** codex
**Branch:** codex/dependabot-risk-split
**Date:** 2026-06-21
**Initiative:** none
**INIT updated:** n/a

## Summary

This branch supersedes Dependabot PRs #210 and #211 without weakening LAICA's strict CI evidence rule. PR #210's action updates were narrow, but its `e2e_guest_smoke` failed because Dependabot-triggered workflows do not receive the repo's normal E2E secrets. PR #211 was a broad 81-package npm bundle with major runtime/provider/framework upgrades and a broken lockfile, so it should not be repaired as a routine automation PR.

## Changes

- `.github/workflows/ci.yml` updates `actions/checkout` to v7 and skips Neon branch deletion when no branch id exists.
- `.github/workflows/dependency-audit.yml` updates `actions/checkout` to v7.
- `.github/workflows/oauth-start-preflight.yml` updates `actions/checkout` to v7.
- `.github/workflows/secret-scan.yml` updates `actions/checkout` to v7 and TruffleHog to v3.95.6.
- `.github/dependabot.yml` reduces npm version-update PR concurrency, groups patch and minor npm updates separately, and leaves major npm updates as individual PRs; GitHub Actions patch/minor updates are grouped while majors open individually.
- `efforts/effort-017-environment-parity-and-ci-confidence.md` records the Dependabot PR #210/#211 validation signal.
- `efforts/registry.md` refreshes EFF-017's searchable signal.

## Impact on other agents

Do not treat Dependabot's missing-secret `e2e_guest_smoke` failures as passing evidence, and do not give dependency PRs the full Neon/Firebase/ElevenLabs E2E secret set without a separate security decision. Major dependency upgrades should now be reviewed one at a time with targeted validation instead of being hidden in a large weekly bundle.

## Open items

- Close or supersede Dependabot PR #210 after this replacement PR is open.
- Close or supersede Dependabot PR #211 rather than repairing the broad bundle.
- EFF-017 remains in progress; this does not solve provider canaries or automated Replit-environment checks.

## Verification

- `git diff --check origin/main...HEAD` passed.
- `npm ci` passed with 0 vulnerabilities reported by the install audit.
- `npm run check` passed.
- `npm audit --audit-level=high` passed with 0 vulnerabilities.
- `npm run build` passed, with existing Vite warnings about stale Browserslist data, Firebase dynamic/static import chunking, and a chunk larger than 500 kB.
- GitHub Actions on this branch should provide the meaningful exact-head `unit`, `e2e_guest_smoke`, dependency audit, TruffleHog, and CodeQL evidence that Dependabot PR #210 could not provide because of secret isolation.

## Stack / base status

- Base refreshed: yes
- Current base: `origin/main` at `ecf1cdbb6128095e0f5e9812116ea5167f962ab6`
- Last Replit-validated at: not applicable
- Notes: started fresh after Dependabot PRs #210 and #211 were found behind `main`.
