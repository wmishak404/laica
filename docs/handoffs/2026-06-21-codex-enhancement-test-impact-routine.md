# Enhancement test-impact routine

**Agent:** codex
**Branch:** codex/enhancement-test-impact-routine
**Date:** 2026-06-21
**Initiative:** none
**INIT updated:** n/a

## Summary

This branch turns the PR #212 stale-validation lesson into a small repeatable enhancement routine: every implementation PR should identify the behavior surface it changes, map that surface to current coverage, update deterministic tests when practical, and keep exact-head CI/E2E evidence current after the final push. It keeps provider, Replit, OAuth, and production-only confidence in named canary/manual/release lanes instead of pretending routine provider-light CI proves those seams.

## Changes

- `docs/workflows/testing-and-acceptance.md`: adds `Enhancement Test Impact Review`, the canonical per-PR routine for mapping changed behavior to current coverage, same-PR test updates, honest unautomated lanes, durable E2E harness practices, and exact-head reruns after base/head movement.
- `.github/PULL_REQUEST_TEMPLATE.md`: adds a short test-impact review prompt under Validation so agents record the mapping in each PR without duplicating workflow policy.
- `efforts/effort-017-environment-parity-and-ci-confidence.md`: records the #212 stale-head signal and why the new routine belongs to EFF-017's ongoing CI-confidence work.
- `docs/handoffs/2026-06-21-codex-enhancement-test-impact-routine.md`: documents this branch for agent coordination.

## Impact on other agents

Future enhancement PRs should complete the PR-template test-impact fields before claiming merge readiness. The routine is proportional: docs-only or non-runtime cleanup can say no behavior surface changed, while runtime/product/auth/provider/persistence changes should map coverage and name any gaps.

This branch does not touch production deployment, Replit publish, production secrets, or provider canary configuration. It also does not change EFF-017 status or validation authority.

## Open items

- EFF-017 remains `In Progress`.
- Provider canary scope, Replit automated gate work, OAuth preflight target/config decisions, coverage ratcheting, and production publish validation remain separate lanes.

## Verification

- Pending: `git diff --check`.
- Replit validation: not required; docs/process-only change with no runtime, provider, deployment, schema, product, or secret changes.

## Stack / base status

- Base refreshed: yes
- Current base: `origin/main` at `87b1e9d60b7399201136fadb4403d880b668a84e`
- Last Replit-validated at: not applicable for docs/process-only change
- Notes: started after PR #212 and PR #214 were merged into `origin/main`; production-publish validation remains outside this thread.
