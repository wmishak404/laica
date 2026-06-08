# EFF-017 OAuth Preflight Blocked

**Agent:** codex
**Branch:** codex/eff-017-oauth-preflight-evidence
**Date:** 2026-06-05
**Initiative:** none
**INIT updated:** n/a

## Summary

After PR #139 merged the deterministic wrap-up closeout, Codex tried to advance the remaining EFF-017 identity-provider preflight lane. The lane is not ready to count as production identity evidence: the target configuration is incomplete, and the manual run failed against the currently configured GitHub Actions identity-provider inputs.

This branch also classifies the remaining EFF-017 items so future work does not mix policy decisions, provider canaries, coverage posture, and Replit package-install work into one ambiguous "continue EFF-017" task.

## Changes

- `efforts/effort-017-environment-parity-and-ci-confidence.md`
  Records the failed preflight state, smallest next configuration actions, and remaining-item classification at a public-safe level.
- `efforts/registry.md`
  Refreshes EFF-017's searchable last signal to the identity-provider preflight blocker.
- `docs/handoffs/2026-06-05-codex-eff-017-oauth-preflight-blocked.md`
  Captures this blocker for Wilson or another agent to resume without replaying chat.

## Evidence

- PR #139 merged as `b040952b2bc9635c99e0bea9889c1c19fede441f`.
- Repo configuration was checked through GitHub-owned surfaces; exact variable/secret names and run details are intentionally not repeated in this public handoff.
- Manual workflow dispatch was attempted on `main` after PR #139 merged.
- Observed result:
  - Dependency installation completed.
  - The identity-provider preflight command failed.
  - The sanitized provider error indicated a configuration mismatch.

## Reasoning

Google's identity-provider preflight API creates an authorization URI for a configured provider. The failed run is therefore negative evidence for the current GitHub Actions preflight configuration, not proof that full Replit Google sign-in is broken. Wilson's PR #138 Replit smoke still observed Google sign-in green.

The likely gap is configuration alignment between the GitHub Actions preflight inputs and the Firebase/identity-provider project that backs production sign-in. Keep exact key, variable, and provider error details in GitHub Actions/Security or private maintainer notes.

## Impact on other agents

Do not mark the identity-provider preflight criterion complete yet. PR #132 shipped the lane, but the lane has now produced a blocking configuration signal. Future EFF-017 work should resolve the accepted target set and project/key alignment before changing validation authority or claiming production identity-provider coverage.

For the other remaining items:

- CI-primary merge authority is a human validation-policy decision before `AGENTS.md`, ADR-0001, or `docs/workflows/testing-and-acceptance.md` should change.
- Live-provider canaries need a scoped lane decision and should stay outside default PR CI unless explicitly accepted.
- Coverage thresholds should wait until the non-blocking PR #138 baseline and ratchet rule are accepted.
- Replit shell check/build evidence remains blocked until the package-install blocker is resolved or the install path changes.
- Full Google popup/linking and deployment behavior remain Replit human/ops validation lanes for now.

## Open items

- Decide the accepted production identity-provider preflight target set.
- Configure the corresponding GitHub Actions variable in the private repo settings surface once the target set is accepted.
- Ensure the workflow uses credentials for the Firebase/identity-provider project where Google sign-in is enabled.
- Rerun the preflight and record pass/fail evidence without copying exact security/config artifacts into public markdown.

## Verification

- `git diff --check` passed on the working-tree diff before staging.

Replit validation is not required for this branch because it records already-observed GitHub Actions evidence and does not change runtime code, repo config, product behavior, security/privacy posture, or validation policy.

## Stack / base status

- Base refreshed: yes
- Current base: `origin/main` at `23c1299ba64103f21f4242abe6f0eee1997cb459`
- Last Replit-validated at: not applicable for this docs-only blocker
- Notes: started after PR #139 merged the PR #138 closeout.
