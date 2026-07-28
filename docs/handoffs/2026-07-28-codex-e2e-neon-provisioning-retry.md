# E2E Neon Provisioning Retry

**Agent:** Codex
**Branch:** `codex/audit-remediation-npm10-20260728`
**Date:** 2026-07-28
**Related PR:** [#345](https://github.com/wmishak404/laica/pull/345)
**Effort:** EFF-017
**Resolves blocked handoff:** None

## Overall view

The exact-head E2E gate remains mandatory, but its disposable Neon setup now tolerates a short provider/API delay. The change adds bounded retries only around branch creation; it does not skip or weaken schema, health, browser, secret, dependency, or cleanup checks.

## Observed failure

- PR #345 head `50015c2469b9911367fd26f9883c08b8359d4dd4` passed dependency audit, secret scan, install, typecheck, build, and unit tests.
- Three consecutive `e2e_guest_smoke` attempts failed at `Create Neon Branch (schema-only)`.
- Each attempt reported the action's 10-second HTTP timeout.
- No attempt reached `npm ci`, schema push, `db:health`, browser installation, or Playwright.
- Neon's public status page reported branch operations and the Console API operational during the investigation.

## Change

- `.github/workflows/ci.yml` makes at most three branch-creation attempts.
- All attempts use the same run-specific branch name, so a timed-out request that completed remotely can be recovered by the next action call.
- The DB and cleanup steps select outputs from the first successful attempt.
- The final attempt is not allowed to fail silently.

## Validation

- Workflow diff and expression routing reviewed locally.
- `git diff --check` passed.
- Ruby's YAML parser loaded `.github/workflows/ci.yml` successfully.
- Exact-head GitHub dependency audit, secret scan, unit/typecheck/build, and E2E rerun are required after push.

## Negative scope

- no test assertions or application code changed
- no production/Replit database or deployment configuration changed
- no new secret, permission, or fork access
- no relaxation of the required exact-head E2E policy

## Next

Push the updated PR head, mark the PR ready if needed, and require the full GitHub gate to pass before merge. If all three branch-creation attempts fail, treat E2E as blocked and investigate Neon/API configuration or availability; do not merge around the gate.
