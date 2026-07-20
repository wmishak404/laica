# Dependency PR lane alignment

**Agent:** codex
**Branch:** `codex/deps-bot-lane-alignment`
**Date:** 2026-07-20
**Initiative:** none
**INIT updated:** n/a
**Resolves blocked handoff:** none

## Summary

This branch turns the current dependency-PR triage into durable bot boundaries: broad npm minor bundles stop recurring, while Node declaration majors stay coupled to the accepted EFF-017 runtime migration. It supersedes Dependabot PR #305's cross-domain 31-package bundle and PR #253's declarations-only Node 26 change without starting either modernization effort.

## Changes

- `.github/dependabot.yml` removes the catch-all npm minor group, leaving minor updates to open individually under the existing concurrency cap.
- `.github/dependabot.yml` ignores automated semver-major `@types/node` updates so declarations do not move ahead of the deployed runtime.
- `efforts/effort-023-broad-dependency-modernization-strategy.md` records the PR #305 evidence and the smaller future upgrade lanes.
- `efforts/effort-017-environment-parity-and-ci-confidence.md` records why PR #253 is deferred to the Node 22 runtime-alignment slice and corrects the current Node 20 EOL date from the official release table.

## Impact on other agents

- Close PR #305 as superseded after this replacement PR is published; do not salvage its lockfile or bundled dependency set.
- Close PR #253 as superseded by the future EFF-017 Node runtime-alignment slice; do not install Node 26 declarations against the current Node 20 runtime.
- Minor dependency upgrades should be reviewed individually by risk domain. Routine patch updates remain grouped.

## Open items

- The Node 22 runtime-alignment slice remains separate and requires coordinated local, CI, Replit runtime, and startup validation.
- Provider, database, UI-foundation, and toolchain modernization remain deferred under EFF-023 until picked up as focused branches.
- Dependency PR merges still require Wilson's explicit instruction.

## Verification

- Validate `.github/dependabot.yml` syntax and expected grouping/ignore structure.
- Run `git diff --check origin/main...HEAD`.
- GitHub exact-head workflow checks are required after push because this branch changes repository automation configuration.
- Replit validation: not required. This branch does not change the current runtime, package graph, application code, secrets, schema, or deployment startup path.

## Stack / base status

- Base refreshed: yes
- Current base: `origin/main` at `2686117a202607f2e6b25b2f891d717372e0a6c4`
- Last Replit-validated at: not applicable
- Notes: independent repository-configuration replacement for PRs #305 and #253.
