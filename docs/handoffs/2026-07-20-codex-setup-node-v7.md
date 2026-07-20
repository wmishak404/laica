# Setup Node v7 dependency replacement

**Agent:** codex
**Branch:** `codex/deps-setup-node-v7`
**Date:** 2026-07-20
**Initiative:** none
**INIT updated:** n/a
**Resolves blocked handoff:** none

## Summary

This branch replaces Dependabot PR #311 with the same four `actions/setup-node` v6-to-v7 workflow reference updates on a same-repository branch based on current `origin/main`. The replacement preserves the bot's intended scope while allowing LAICA's protected exact-head E2E and security lanes to run with repository secrets that are intentionally unavailable to Dependabot-authored workflow runs.

Wilson authorized tackling this fresh dependency batch on 2026-07-20. That authorization covers preparing and validating the replacement; this branch and handoff do not claim or perform a merge.

## Source provenance and compatibility

- Dependabot source: PR #311, head `b98ab5f8e5b15451e185272ba1f820e056df54ca`, based on `53826d940d05004c7ec72561b7853ced59dcb870`.
- Replacement base: `origin/main@04b88c5cd4be383771d690a250cafda5eb031a03`.
- Scope copied from the bot patch: two references in `.github/workflows/ci.yml`, one in `.github/workflows/dependency-audit.yml`, and one in `.github/workflows/oauth-start-preflight.yml`.
- Upstream `actions/setup-node` metadata declares `runs.using: node24` for both v6 and v7. This update does not introduce the Node 24 action runtime; the current v6 workflow references already use it.
- All affected jobs use GitHub-hosted `ubuntu-latest` runners. No self-hosted runner compatibility is introduced.
- The v7 release migrates the action implementation to ESM, updates dependencies, adds cache-key outputs, and removes a dummy `NODE_AUTH_TOKEN` export. LAICA does not use the new outputs or the removed dummy export, and the existing `node-version` / `node-version-file` and `cache: npm` inputs remain unchanged.

## Changes

- `.github/workflows/ci.yml`
  - Use `actions/setup-node@v7` in the unit and E2E jobs.
- `.github/workflows/dependency-audit.yml`
  - Use `actions/setup-node@v7` in the audit job.
- `.github/workflows/oauth-start-preflight.yml`
  - Use `actions/setup-node@v7` in the scheduled/manual OAuth preflight job.
- `docs/handoffs/2026-07-20-codex-setup-node-v7.md`
  - Record provenance, compatibility reasoning, validation, and supersession scope.

## Effort and initiative routing

- **EFF-017:** this is a narrow CI-tooling update. It does not change LAICA's `.nvmrc`, Replit runtime, application runtime, or the accepted future Node 22 alignment direction. Exact-head GitHub CI remains the merge-readiness authority; the Effort's status and resume point do not change.
- **EFF-023:** conforms to the split-by-risk strategy by keeping one workflow action upgrade separate from npm runtime, provider, UI, database, and build-tool changes. It does not start or reprioritize deferred broad modernization.
- **INIT:** no initiative behavior, phase, product decision, asset, validation status, or resume point changes; no INIT update is required.

## Evidence and validation lane

Local validation must confirm:

- all four intended workflow references use `actions/setup-node@v7` and no `actions/setup-node@v6` reference remains;
- the three changed workflow files parse as YAML and retain their existing triggers, jobs, runner labels, inputs, and commands;
- the diff against current `origin/main` contains only the three workflow files and this handoff;
- `git diff --check origin/main...HEAD` passes.

After push, the exact replacement head must pass `unit`, `e2e_guest_smoke`, dependency audit, TruffleHog PR scan, and CodeQL/analysis. Dependabot PR #311's E2E failure was limited to the `Preflight Secrets` step, so it is neither regression evidence nor a substitute for the replacement's full E2E run.

The replacement's pre-refresh head `bf4616f6d747f7ff6353def2e17ff8a5dc4dd24c` passed CI, full E2E including Neon cleanup, TruffleHog, CodeQL, and both analyses. Its audit failed against an unchanged current-main lockfile after external advisory data changed. Coordinated remediation PR #322 then passed the full exact-head gate and merged as `b4236b6f88b02c3bc3d2b69191a3a71b48a99675`; head `82999a7aea1e4d1d301f298048f7bae188709c91` passed the complete exact-head gate on that base. This branch was subsequently rebased conflict-free onto current `origin/main@04b88c5cd4be383771d690a250cafda5eb031a03` after docs-only coordination PR #319 merged. The PR description is the authority for the refreshed exact head and its required rerun evidence.

Human Replit validation is not required. The change affects GitHub-hosted workflow action execution only and does not alter Replit startup, secrets, runtime, deployment, or application behavior.

## Negative scope

- No `package.json` or lockfile change.
- No `.nvmrc`, Node engine, Replit module, runtime command, or deployment configuration change.
- No application, server, client, shared-schema, test, or script change.
- No secret value, secret name, permission, workflow trigger, job condition, command, cache input, or artifact path change.
- No database, auth/session, provider, route, prompt, UI, navigation, or product behavior change.
- No claim that the scheduled OAuth provider request itself was exercised by local validation; only its workflow structure and shared setup action are covered here.

## Impact on other agents

Dependabot PR #311 received a supersession comment and was closed unmerged after replacement head `82999a7aea1e4d1d301f298048f7bae188709c91` passed every required gate. PR #320 remains the sole open setup-node v7 candidate and must receive a fresh exact-head gate after this current-main rebase. Do not merge both PRs.

## Open items

- Force-push the prepared current-main rebase only after the shared schema-only Neon E2E lane is clear.
- Wait for all fresh exact-head required checks, then update the PR description with refreshed head and run provenance.
- Merge remains unperformed and requires the authorized coordination thread to decide the final mechanical merge step. This task must not merge PR #320.

## Stack / base status

- Base refreshed: yes
- Current base: `origin/main` at `04b88c5cd4be383771d690a250cafda5eb031a03`
- Last Replit-validated at: not applicable; Replit validation not required for this GitHub-hosted workflow-only change
- Notes: rebased after audit remediation PR #322 and docs-only coordination PR #319 merged. The replacement diff remains workflow-only plus this handoff and inherits the remediated package graph unchanged from current `main`.
