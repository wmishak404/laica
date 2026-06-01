# CI harness post-merge docs closeout

**Agent:** codex
**Branch:** codex/ci-harness-postmerge-docs
**Date:** 2026-06-01
**Initiative:** none
**INIT updated:** n/a

## Summary

PR #109 merged the additive CI automation harness, so the automation plan is no longer just chat or a deferred idea. The durable home is the existing `EFF-017` environment-parity and CI-confidence Effort, not a new INIT: the work is active, concrete follow-through on validation automation, while the larger policy shift from Replit-primary to CI-primary still requires a separate ADR/PD.

## Changes

- `efforts/effort-017-environment-parity-and-ci-confidence.md`
  - Reopened EFF-017 from `Deferred` to `In Progress`.
  - Recorded PR #109 merge as `3720c26`.
  - Captured the next immediate follow-up: configure `NEON_PROJECT_ID` plus Neon/Firebase/ElevenLabs GitHub Actions secrets so `e2e_guest_smoke` actually runs.
  - Reaffirmed that PR #109 does not replace the Replit validation gate.
- `efforts/effort-010-local-db-schema-strategy.md`
  - Added the PR #109 schema-health signal.
  - Clarified that `npm run db:health` plus schema-only Neon CI branches partially addresses drift detection but does not resolve local DB ownership or agent `db:push` permissions.
- `efforts/README.md`
  - Moved EFF-017 into the active Effort read list.
- `efforts/registry.md`
  - Updated EFF-017 status and last signal.

## Impact on other agents

Agents planning automation, CI confidence, local/Replit parity, auth harnesses, or validation policy should read `EFF-017` first. Agents changing local DB setup, schema health, `DATABASE_URL`, or `db:push` boundaries should still read `EFF-010`.

Do not create a new INIT for the immediate PR #109 follow-up. Use separate PRs from `main` for harness improvements such as stubbed AI mode, selector hardening, canary workflows, OAuth-domain preflight, or a stronger dev-auth lane.

## Open items

- Configure GitHub repo variable `NEON_PROJECT_ID`.
- Configure required GitHub Actions secrets for Neon, Firebase, and ElevenLabs.
- Re-run CI and confirm `e2e_guest_smoke` stops being skipped and runs through guest-lane setup plus `db:health`.
- File a separate ADR/PD only if Wilson decides CI should become primary validation instead of Replit-primary validation.

## Verification

- Documentation-only closeout.
- `git diff --check`

## Stack / base status

- Base refreshed: yes
- Current base: `origin/main` at `3720c26`
- Last Replit-validated at: not applicable; docs-only closeout
- Notes: PR #109 was already merged before this closeout branch. The closeout records durable status and next actions only.
