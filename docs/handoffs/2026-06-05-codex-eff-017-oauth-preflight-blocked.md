# EFF-017 OAuth Preflight Blocked

**Agent:** codex
**Branch:** codex/eff-017-oauth-preflight-evidence
**Date:** 2026-06-05
**Initiative:** none
**INIT updated:** n/a

## Summary

After PR #139 merged the deterministic wrap-up closeout, Codex tried to advance the remaining EFF-017 OAuth-start lane by running the existing manual workflow against the custom production domain. The lane is not ready to count as production OAuth-start evidence: the scheduled target variable is missing, and the manual run failed because the current GitHub Actions Firebase/API-key configuration did not find a Google identity-provider configuration.

## Changes

- `efforts/effort-017-environment-parity-and-ci-confidence.md`
  Records the workflow dispatch, failed result, inference, and smallest next configuration actions.
- `efforts/registry.md`
  Refreshes EFF-017's searchable last signal to the OAuth preflight blocker.
- `docs/handoffs/2026-06-05-codex-eff-017-oauth-preflight-blocked.md`
  Captures this blocker for Wilson or another agent to resume without replaying chat.

## Evidence

- PR #139 merged as `b040952b2bc9635c99e0bea9889c1c19fede441f`.
- Existing repo variables checked through GitHub API: only `NEON_PROJECT_ID` is configured; `OAUTH_PREFLIGHT_CONTINUE_URIS` is not configured.
- Existing repo secrets checked by name only through GitHub API: `VITE_FIREBASE_API_KEY` exists, along with the existing CI Firebase/Neon/ElevenLabs secrets. Secret values were not inspected.
- Manual workflow dispatch:
  - Workflow: `OAuth Start Preflight`
  - Run: `https://github.com/wmishak404/laica/actions/runs/27040110722`
  - Event: `workflow_dispatch`
  - Ref/SHA: `main` at `b040952b2bc9635c99e0bea9889c1c19fede441f`
  - Input: `continue_uris=https://cookwithlaica.com/`
- Observed result:
  - `npm ci` succeeded and reported `found 0 vulnerabilities`.
  - `npm run check:oauth` failed.
  - Sanitized Google error: `OPERATION_NOT_ALLOWED : The identity provider configuration is not found.`

## Reasoning

Google's Identity Platform `accounts:createAuthUri` documentation says that when a provider ID is specified, the method creates an IdP authorization URI, and the API key identifies the Google Cloud project. The failed run is therefore negative evidence for the current GitHub Actions preflight project/key configuration, not proof that full Replit Google sign-in is broken. Wilson's PR #138 Replit smoke still observed Google sign-in green.

The likely gap is configuration alignment: either the Actions `VITE_FIREBASE_API_KEY` points at a project where Google provider configuration is not found by this REST preflight, or the OAuth preflight lane needs a dedicated `OAUTH_PREFLIGHT_FIREBASE_API_KEY` for the production/Replit Firebase project.

## Impact on other agents

Do not mark the OAuth-start preflight criterion complete yet. PR #132 shipped the lane, but the lane has now produced a blocking configuration signal. Future EFF-017 work should resolve the accepted target URI set and API-key/project alignment before changing validation authority or claiming production OAuth-start coverage.

## Open items

- Decide whether the accepted OAuth preflight targets are `https://cookwithlaica.com/` only or both the custom production domain and the concrete Replit deployment URL.
- Configure `OAUTH_PREFLIGHT_CONTINUE_URIS` as a repo variable once the target set is accepted.
- Ensure the workflow uses an API key for the Firebase project where Google sign-in is enabled, either by correcting the lane's `VITE_FIREBASE_API_KEY` usage or adding a dedicated `OAUTH_PREFLIGHT_FIREBASE_API_KEY` secret.
- Rerun `OAuth Start Preflight` and record pass/fail evidence before treating production OAuth-start state as covered.

## Verification

- `git diff --check` passed on the working-tree diff before staging.

Replit validation is not required for this branch because it records already-observed GitHub Actions evidence and does not change runtime code, repo config, product behavior, security/privacy posture, or validation policy.

## Stack / base status

- Base refreshed: yes
- Current base: `origin/main` at `b040952b2bc9635c99e0bea9889c1c19fede441f`
- Last Replit-validated at: not applicable for this docs-only blocker
- Notes: started after PR #139 merged the PR #138 closeout.
