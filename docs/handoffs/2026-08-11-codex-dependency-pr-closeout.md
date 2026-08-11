# Dependency PR queue closeout

**Agent:** codex
**Branch:** `codex/dependency-pr-closeout-2026-08-11`
**Date:** 2026-08-11
**Initiative:** none
**INIT updated:** n/a
**Resolves blocked handoff:** none

## Summary

The open Dependabot queue is resolved without changing LAICA's package graph. Six PRs were closed unmerged after distinguishing compatible-but-untriggered maintenance from deterministic migration failures and the known Dependabot protected-secret E2E boundary. EFF-023 now preserves the exact decision evidence so future dependency work can start from fresh `main` with the smallest justified upgrade slice.

## Changes

- Closed PR #338: TruffleHog wrapper `3.96.0` was paired with stale explicit scanner inputs at `3.95.9`, so its passing scan did not validate the proposed scanner.
- Closed PR #352: the 19-package patch wave passed its non-E2E compatibility and security lanes, but had no current security, defect, platform, or accepted modernization trigger.
- Closed PRs #340 and #341: focused Radix Avatar and Checkbox updates passed their non-E2E lanes but were conflicted with current `main` and untriggered.
- Closed PR #342: `npm ci` failed on the OpenAI SDK's Zod 3 peer boundary after the package-only Zod 4 bump.
- Closed PR #343: typecheck failed because the existing calendar wrapper uses react-day-picker v8 API keys that v10 removed.
- Added an evidence chronology entry to `efforts/effort-023-broad-dependency-modernization-strategy.md`.
- Added this handoff. No dependency, lockfile, runtime, application, workflow, schema, secret, deployment, or UI file changed.

## Impact on other agents

- Do not reopen or merge PRs #338, #340, #341, #342, #343, or #352 based on their historical heads.
- A future TruffleHog update must align the action reference and both explicit `version` inputs.
- Zod 4 requires a coordinated provider/schema migration; do not force or bypass peer resolution.
- react-day-picker 10 requires a focused migration of `client/src/components/ui/calendar.tsx` plus rendering and interaction evidence.
- Radix UI maintenance should remain scoped to the affected live surfaces and begin only from a concrete trigger under EFF-023.

## Open items

- Broad dependency modernization remains deferred under EFF-023.
- Future security findings, observed defects, platform enforcement, or accepted modernization objectives should open a new focused branch from fresh `origin/main`; the closed bot heads and their evidence will be stale.
- Local `gh` authentication was expired during this review. GitHub PR metadata, patches, workflow runs/jobs/logs, comments, close actions, and the final open-queue query were completed through the connected GitHub app.

## Verification

Source state:

- Base: `origin/main@2ef2b62163c0fada0fc858fdd10442e3a573cda4`.
- Exact PR heads reviewed: #338 `26f0a16a3bc3e693cc46ff750735e5cd2eac5c21`; #340 `4a7afd081d4435e9025c35ad5fce4cca325b5683`; #341 `60327fb21a0603c268f603d79c623a63046a460f`; #342 `120ffb61087cf7d14f7e0345e16ec5354eaa6cd0`; #343 `6ad2d3b9c82ace2cf6116a401a5ed35cf71831f7`; #352 `bb94f9e632f65ed01b23da315a5be8c698934817`.
- GitHub returned each PR as `closed` and `merged: false` after the mutations.
- A final GitHub search for open PRs by `app/dependabot` returned zero results.

Automated evidence and limits:

- PRs #338, #340, #341, and #352: GitHub `unit` jobs passed install, typecheck/lint, build, unit tests, and coverage; dependency audit and secret scan passed. Their `e2e_guest_smoke` jobs failed at `Preflight Secrets`, so DB setup and Playwright were skipped.
- PR #342: GitHub `unit` and dependency-audit jobs failed during `npm ci` with the OpenAI/Zod peer conflict; E2E separately stopped at protected-secret preflight.
- PR #343: GitHub install reported zero vulnerabilities, then typecheck failed on the calendar wrapper's removed API keys; E2E separately stopped at protected-secret preflight.
- No local package commands were used as merge evidence. A local `npm audit` attempt could not reach the registry inside the sandbox; exact-head GitHub audit evidence is the authoritative observed result for this review.
- `git diff --check origin/main...HEAD` is required before publishing this docs-only closeout.
- Replit validation: not required. This task closed unmerged PRs and changes only EFF-023 chronology plus coordination evidence; it does not change runtime behavior or the dependency graph.
