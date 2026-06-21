# EFF-017 PR #212 Signal

**Agent:** codex
**Branch:** codex/eff-017-pr212-signal
**Date:** 2026-06-21
**Initiative:** none
**INIT updated:** n/a

## Summary

PR #212 merged the production vision incident docs, production publish validation routine, and targeted E2E harness hardening. This follow-up records the EFF-017 lesson that emerged during merge: exact-head CI evidence became stale when PR #213 moved `origin/main`, and rebasing plus rerunning the full gate was required before merge.

## Changes

- `efforts/effort-017-environment-parity-and-ci-confidence.md` records the PR #212 release-gate signal, including the stale `aed34eb` evidence, the fresh `d83068e` pass, and why the harness fix belonged with the release validation PR.
- `docs/handoffs/2026-06-21-codex-eff-017-pr212-signal.md` documents this follow-up for agent coordination.

## Impact on other agents

Future release or CI-confidence work should treat PR #212 as a concrete example of the exact-head rule. Passing CI on a branch head is not enough once `origin/main` moves; rebase, push, and wait for the new head's required checks before merge.

## Open items

- EFF-017 remains `In Progress`.
- Production release readiness for the main build remains in the separate production-validation thread and still requires Wilson's explicit production publish action.

## Verification

- PR #212 merged as `103f26cfd6087631d0591fe191739c6c8b3c8af9`.
- Current follow-up branch started from fresh `origin/main` after that merge.
- Docs-only change; validation for this branch is `git diff --check` plus PR review/CI if opened.
