# TruffleHog 3.95.9 dependency replacement

**Agent:** codex
**Branch:** `codex/deps-trufflehog-3-95-9`
**Date:** 2026-07-20
**Initiative:** none
**INIT updated:** n/a
**Resolves blocked handoff:** none

## Summary

This narrow workflow-maintenance branch replaces Dependabot PR #250 with an internally consistent TruffleHog 3.95.9 update. PR #250 changed the action wrapper references but left the explicit scanner-version inputs on 3.95.6, so its successful scan still ran the older scanner. A same-repository replacement also preserves LAICA's exact-head CI evidence path, which the Dependabot branch could not complete because its E2E job did not receive the repository secret set.

## Changes

- `.github/workflows/secret-scan.yml` aligns both pull-request and main-push jobs on `trufflesecurity/trufflehog@v3.95.9` and `version: "3.95.9"`.
- `docs/handoffs/2026-07-20-codex-deps-trufflehog-3-95-9.md` records the replacement scope and evidence boundary.

## Impact on other agents

Treat PR #250 as superseded by this replacement PR once the replacement exists on GitHub. Do not merge the Dependabot branch: its wrapper/scanner versions are split, and its failed secret preflight is missing E2E evidence rather than evidence that the TruffleHog update broke the application.

This conforms to EFF-017's strict exact-head evidence rule and EFF-023's existing requirement to keep paired workflow version fields aligned. It does not reopen EFF-023's deferred broad dependency-modernization scope.

## Open items

- Wait for exact-head GitHub checks on the replacement PR, including `unit`, `e2e_guest_smoke`, dependency audit, TruffleHog, and CodeQL.
- Close Dependabot PR #250 as superseded only after the replacement PR has been created; the dependency-PR coordinator owns that action.

## Verification

- TruffleHog parity search confirmed two `uses` references at `v3.95.9` and two explicit `version` inputs at `3.95.9`, with no remaining 3.95.6 reference in the workflow.
- `git diff --check origin/main...HEAD` passed.
- `npm ci` passed and reported zero vulnerabilities.
- `npm run check` passed.
- `npm run build` passed with the existing Browserslist-age, Firebase dynamic/static import, and large-chunk warnings.
- `npm audit --audit-level=high` passed with zero vulnerabilities.
- GitHub exact-head checks are pending until the branch is pushed and the draft PR is opened.

## Evidence limits

Local validation proves the workflow fields are aligned and the unchanged application remains installable, type-clean, buildable, and free of high/critical npm audit findings. It does not execute the GitHub-hosted TruffleHog action, prove the 3.95.9 container runs successfully, or replace the required exact-head GitHub E2E/security checks.

No Replit validation is required because this branch changes only a GitHub Actions dependency and its coordination handoff; it does not change application runtime, schema, auth, providers, deployment startup, or user-facing behavior.

## Stack / base status

- Base refreshed: yes
- Current base: `origin/main` at `2686117a202607f2e6b25b2f891d717372e0a6c4`
- Last Replit-validated at: not applicable
- Notes: independent replacement branch created from fresh `origin/main`; not stacked on another PR.
