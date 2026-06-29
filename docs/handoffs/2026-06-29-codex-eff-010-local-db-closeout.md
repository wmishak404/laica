# EFF-010 local DB strategy closeout

**Agent:** codex
**Branch:** codex/eff-010-local-db-strategy-closeout
**Date:** 2026-06-29
**Initiative:** none
**INIT updated:** yes
**Resolves blocked handoff:** none

## Summary

EFF-010 is resolved by turning the long-running local DB strategy into explicit policy and a small setup helper. The accepted model is intentionally narrow: agents do not mutate the default decrypted `.env` database; routine DB-backed merge evidence uses GitHub `e2e_guest_smoke`; local schema push is allowed only through the guarded disposable sandbox; and new worktrees use `npm run setup:worktree` for `.env.keys`.

## Changes

- `scripts/setup-worktree.mjs` and `package.json`
  Add `npm run setup:worktree`, which creates or verifies the ignored `.env.keys` symlink without printing secret values.
- `docs/adr/0001-replit-primary-local-agents.md`
  Records the final local DB mutation boundary and worktree-secret setup rule.
- `docs/workflows/testing-and-acceptance.md`, `docs/workflows/local-diagnostics-sandbox.md`, `docs/workflows/environment-map.md`, and `docs/workflows/environment-parity-spec.md`
  Replace manual symlink commands and active EFF-010 ownership language with the accepted GitHub E2E / local sandbox / no-default-db-push policy.
- `AGENTS.md` and `CLAUDE.md`
  Point worktree setup at `npm run setup:worktree`.
- `efforts/effort-010-local-db-schema-strategy.md`, `efforts/README.md`, and `efforts/registry.md`
  Mark EFF-010 resolved, remove it from the active read list, and preserve the final routing rules.
- `initiatives/INIT-001-mobile-refresh.md`, `initiatives/INIT-002-ai-error-telemetry.md`, `initiatives/INIT-003-anonymous-trial-and-account-upgrade.md`, and `initiatives/INIT-004-ai-output-quality-evals.md`
  Update current references so they point to ADR/workflow policy instead of treating EFF-010 as active.

## Impact on other agents

Do not reopen EFF-010 for routine required-table additions. Add those to `scripts/db-schema-health.ts` in the PR that adds required schema.

Use EFF-017 for future automated Replit-environment DB validation. Create a new narrow Effort only if Wilson decides agent-created Neon branches per worktree are an actual implementation priority.

## Open items

- EFF-017 remains active for CI confidence, provider canaries, OAuth preflight, and automated Replit-environment follow-up.
- EFF-022 remains active for cuisine-fit product rules.
- EFF-025 has open PR #237 for Settings unsaved inventory reminders.
- This branch does not run or authorize `db:push` against the default decrypted `.env` database.

## Verification

Local verification:

- `npm run setup:worktree` passed and reported that `.env.keys` already points at the standard dotenvx key source; no secret values were read or printed.
- `npm run check` passed.
- `npm run build` passed with the existing Browserslist age, Firebase dynamic/static import, and chunk-size warnings.
- `git diff --check` passed.
- Targeted stale-reference search found no current-source claims that EFF-010 remains open or still owns the local DB strategy outside the resolved Effort's historical chronology.

Replit validation is not required because this is local tooling and documentation policy; it does not change runtime behavior, schema, secrets, provider calls, deployment, or user-facing UI.
