# EFF-017 Test and CI Audit Reconciliation

**Agent:** codex
**Branch:** `codex/eff-017-test-audit-reconciliation`
**Date:** 2026-06-10
**Initiative:** none
**INIT updated:** n/a

## Summary

This docs pass records the reconciled Codex/Claude audit of Laica's automated test and CI posture after PR #159 merged. The active test suite is current and useful, but EFF-017 remains open because the strongest remaining gaps are enforcement and lane discipline: routine correctness checks should be mechanically required, coverage measurement should include all intended source before thresholds, OAuth preflight still needs configuration, and PR #159's direct Replit shell/browser validation is proven manual evidence rather than an accepted automated Replit-environment gate.

## Changes

- `efforts/effort-017-environment-parity-and-ci-confidence.md`
  - Updated the `Updated` date to 2026-06-10.
  - Added a reconciled audit section covering current suite health, PR #159 evidence, remaining enforcement/measurement gaps, stale root test artifacts, dead-code cleanup candidates, and live-but-thin coverage targets.
  - Recorded that PR #159 proved exact-head Replit shell plus Chrome browser validation without Replit Agent, while keeping it classified as manual PR-level evidence.
- `docs/handoffs/2026-06-10-codex-eff-017-test-ci-audit-reconciliation.md`
  - This handoff.

## Impact on other agents

Future EFF-017 work should treat the next priority order as:

1. Make routine correctness checks mechanically required in GitHub settings.
2. Make coverage include all intended shipped source before setting thresholds.
3. Configure and rerun the OAuth start preflight lane.
4. Remove or rewrite stale root test-runner/test-criteria artifacts.
5. Audit and delete confirmed-dead code before treating broad coverage metrics as meaningful.
6. Add targeted coverage for live-but-thin surfaces such as `cooking-history.tsx`, broader `useAuth`, broader `live-cooking.tsx`, and admin/eval routes when INIT-004 implementation begins.

Do not treat PR #159's direct Replit shell/browser validation as an automated Replit gate. It is stronger PR-level evidence that direct validation is viable without Replit Agent, but an accepted automated Replit-environment lane still needs a reusable workflow/script, setup, evidence format, and negative scope.

## Open items

- GitHub settings/ruleset update is still external to this branch.
- OAuth preflight was blocked on accepted target set and provider-enabled project/key alignment during the audit. PR #165 follow-up evidence later narrowed this to GitHub Firebase API-key drift and restored the scheduled canary after manual dispatch passed.
- Coverage-threshold policy remains intentionally deferred until the denominator is honest.
- Dead-code removal and root test-artifact cleanup are implementation follow-ups, not done here.

## Verification

- Docs-only change.
- `git diff --check` passed.

## Stack / base status

- Base refreshed: yes
- Current base: `origin/main` at `382ebd07f106ac241e2ed1caa69d34c46a66882c`
- Last Replit-validated at: not applicable for docs-only EFF-017 audit note
- Notes: Started from fresh `origin/main` after PR #159 merged.
