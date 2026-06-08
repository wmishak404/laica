# EFF-017 OAuth-start preflight

**Agent:** codex
**Branch:** codex/eff-017-oauth-start-preflight
**Date:** 2026-06-04
**Initiative:** INIT-003
**INIT updated:** read, not changed

## Summary

This branch starts the next EFF-017 lane after the provider-boundary and guest quota-copy slices: a deterministic Google OAuth-start/config preflight. The new path uses Identity Toolkit's `accounts:createAuthUri` start step for `providerId: "google.com"` so CI or a scheduled/manual workflow can catch provider-disabled or unauthorized-domain drift without completing a real Google popup login.

PR #132 merged as `26985d3a46a40857525a9ccb6992010d2c6c3b13`.

The branch also records the remaining EFF-017 adjacencies as parallel-safe lanes rather than folding them into this PR.

## Changes

- `scripts/oauth-start-preflight.ts`
  - Parses `OAUTH_PREFLIGHT_CONTINUE_URIS`, `VITE_FIREBASE_API_KEY` or `OAUTH_PREFLIGHT_FIREBASE_API_KEY`, and optional `OAUTH_PREFLIGHT_REQUIRED`.
  - Validates HTTPS continue URIs before network access and rejects fragments or reserved `state` parameters.
  - Calls `https://identitytoolkit.googleapis.com/v1/accounts:createAuthUri` with `providerId: "google.com"` and `prompt=select_account`.
  - Verifies the response contains provider `google.com` and a Google-hosted auth URI.
  - Logs sanitized success/failure output without printing the API key, raw continue URI, or full auth URI.
- `.github/workflows/oauth-start-preflight.yml`
  - Adds a separate `OAuth Start Preflight` workflow with `workflow_dispatch` and scheduled triggers.
  - Uses `OAUTH_PREFLIGHT_CONTINUE_URIS` from manual input or repo vars and `VITE_FIREBASE_API_KEY` from secrets.
  - Does not run on pull requests, preserving the routine PR gate as deterministic/provider-light.
- `tests/unit/oauth-start-preflight.test.ts`
  - Covers optional skip, required config failure, URI normalization, invalid URI rejection, intended provider payload, successful provider response, and sanitized provider error reporting.
- `package.json`
  - Adds `npm run check:oauth`.
- `.env.example`
  - Documents the OAuth preflight env contract.
- `efforts/effort-017-environment-parity-and-ci-confidence.md`
  - Records this branch signal and the parallel-safe lane split.

## Parallel lanes

- **Linked-account dev-auth design:** parallel-safe. It should define how CI obtains deterministic linked-user state without Google popup automation and should read INIT-003 plus the mobile-refresh dev-test-harness note first.
- **Live-provider canaries:** parallel-safe. Keep separate from routine PR CI and record evidence by provider seam, not as a broad "AI works" claim.
- **Coverage reporting/ratcheting:** parallel-safe in concept, but likely touches `package.json` / workflow files, so coordinate while this branch is open.
- **UI/accessibility guardrails:** parallel-safe in concept, but coordinate if editing shared Playwright helpers or screens.

## Security note

An automated security check flagged a logging issue on an early push. The merged version sanitizes logs, labels checked targets without echoing raw input, adds regression assertions that sensitive inputs are not logged, and passed the required check.

## Verification

Automation is evidence for the stated preflight-script claim, not a conclusion about full auth correctness.

**Claim:** The repo now has a deterministic OAuth-start preflight that can verify Google OAuth authorization URI creation for configured production/Replit continue URIs without completing user sign-in.

**Command/check provenance:**

- Local macOS worktree `/Users/wilsonishak-macbookpro/.codex/worktrees/ba8b/laica`, branch `codex/eff-017-oauth-start-preflight`, base `origin/main` at `040df3912d6b8f1463ff48f8bc5fc97c9e76b493`.
- `npx vitest run tests/unit/oauth-start-preflight.test.ts` passed after the logging remediation: 1 file, 7 tests, including no-raw-continue-URI logging assertions.
- `npm run check:oauth` passed outside the sandbox and reported a skip because `OAUTH_PREFLIGHT_CONTINUE_URIS` is not configured locally.
- Local sandboxed `npm run check:oauth` did not produce script behavior evidence because `tsx` could not create its IPC pipe (`EPERM`).
- `npm run check` passed before and after the logging remediation.
- `npm run build` passed, with the known Browserslist age, Firebase dynamic/static import, and chunk-size warnings.
- `npm run test:unit` passed after the logging remediation: 32 files, 211 tests.
- `git diff --check` passed.
- GitHub Actions on the PR head passed:
  - Dependency Audit (High/Critical), job `npm-audit`, run `26969668111`.
  - Secret-scan check passed for the PR event.
  - CI (Typecheck, Unit, E2E), jobs `unit` and `e2e_guest_smoke`, run `26969668164`.
  - Static-analysis checks passed after the logging remediation.

**Source provenance:**

- Google Identity Platform documentation for `accounts:createAuthUri`: provider ID creates an IdP authorization URI and the API key identifies the Google Cloud project: https://docs.cloud.google.com/identity-platform/docs/reference/rest/v1/accounts/createAuthUri
- `scripts/oauth-start-preflight.ts`.
- `tests/unit/oauth-start-preflight.test.ts`.
- `.github/workflows/oauth-start-preflight.yml`.

**Observed result:**

- Focused mocked unit coverage passed, including no-raw-continue-URI/API-key logging assertions.
- The direct local script path runs and skips cleanly without configured target domains.
- Static/type/lint checks, production build, full unit suite, whitespace checks, dependency audit, secret scan, GitHub CI unit/e2e guest smoke, and static-analysis checks passed.
- Live Google OAuth-start behavior is not yet observed because no continue URI/API key pair was configured for this local run.

**Reasoning:**

The mocked unit tests prove the script sends the intended request shape to the Identity Toolkit endpoint and handles the important local error modes before a live network call. The scheduled/manual workflow gives the repo a named lane that can use production/Replit continue URIs once configured, while avoiding brittle full Google popup completion and avoiding live auth checks in routine PR CI.

**Negative scope:**

- Not a full Google linked-account login.
- Not Google popup completion.
- Not existing-Google credential/import consent.
- Not proof until the scheduled/manual workflow runs with the accepted production/Replit continue URI.
- Not live OpenAI quality.
- Not ElevenLabs audio quality.
- Not real storage integration beyond the harness.
- Not full Replit deployment behavior.
- Not Replit-shell Playwright until Chromium dependencies are configured.
- Not exhaustive auth corner cases.

## Replit validation

Last Replit-validated at: not required.

Rationale: this branch adds an opt-in/scheduled OAuth-start automation lane and mocked unit coverage. It does not change runtime app behavior, schema, Firebase client sign-in code, auth policy, provider code, or deployment config. Replit remains primary for deployment-bound runtime validation and full Google linked-login behavior.
