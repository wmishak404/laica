# PR #344 and PR #345 Merge Closeout

**Agent:** Codex
**Branch:** `codex/viewport-gates-closeout-20260728`
**Date:** 2026-07-28
**Initiative:** [INIT-001 — Mobile Refresh](../../initiatives/INIT-001-mobile-refresh.md)
**Merged PRs:** [#345](https://github.com/wmishak404/laica/pull/345), [#344](https://github.com/wmishak404/laica/pull/344)
**INIT updated:** yes
**Resolves blocked handoff:** none

## Overall view

The audit blocker and the E2E provisioning flake were repaired before the viewport-priority decision merged. EFF-035 is now durably deferred, daily INIT triage is directed to non-viewport work, and the required exact-head gates remain intact. This closeout records only merged facts and current resume state; it adds no product, runtime, workflow, dependency, or priority decision.

## Merge Facts

### PR #345 — gate remediation

- Squash-merged as `6272b5d68de9269bf9f2fe85e6f90160ce595df4`.
- Final head: `b2f9e2b7a45109ac89313bd7663175f522099985`.
- Original base: `616f4c65b7caf1a9f33c6ef58fa2252c6f63c077`.
- Updated only the transitive lockfile resolution, EFF/handoff evidence, and bounded CI retries around disposable Neon branch creation.
- GitHub CI run `30389777931` passed unit/typecheck/build, `db:health`, all nine Playwright tests in `52.7s`, and cleanup. The first Neon call hit the action's 10-second timeout; the second attempt recovered the same run-specific branch.
- Dependency-audit run `30389781094` and secret-scan run `30389777774` passed.

### PR #344 — viewport prioritization

- Rebased onto PR #345's merge commit before final validation.
- Squash-merged as `31a4806bf8ce04942f99b402fa4745dfda0be14b`.
- Final head: `1938f44c62084abc79486a8c312f35e69c900d22`.
- Final base: `6272b5d68de9269bf9f2fe85e6f90160ce595df4`.
- GitHub CI run `30390167135` passed unit/typecheck/build, `db:health`, all nine Playwright tests in `52.1s`, and cleanup.
- Dependency-audit run `30390167279` and secret-scan run `30390167153` passed.
- No review comments or merge conflicts remained.

## Durable State

- EFF-035 is `Deferred`, not resolved. Reopen only from Wilson-supplied user feedback that the current viewport experience is unsatisfactory or materially changed production evidence that Wilson accepts as a priority change.
- INIT-001's current resume point directs agents to non-viewport work while preserving mobile-first validation for unrelated UI changes.
- EFF-017 records the bounded Neon retry as a reliability improvement; its remaining confidence work is unchanged.
- EFF-023 records the concrete audit-triggered remediation while broad dependency modernization remains deferred.
- The active INIT triage automation carries the non-viewport skip rule.
- The matching Efforts-hygiene automation update remains a protected-setting suggestion for Wilson to review; repository docs remain authoritative either way.

## Negative Scope

- no application code, product behavior, CSS, viewport implementation, schema, provider, auth, navigation, deployment, or production state changed in PR #344 or this closeout
- no direct dependency declaration changed in PR #345
- no test assertion, secret, permission, or exact-head gate was removed or weakened
- no EFF-034 PR or other dependency-update PR was selected, merged, closed, or rewritten
- no Replit validation was required for this fact-only closeout

## Current Resume Point

Start the next assignment from fresh `origin/main` at or after `31a4806bf8ce04942f99b402fa4745dfda0be14b`. Choose non-viewport work using live PR ownership plus the current INIT and Effort decision gates. Do not recreate EFF-035 work unless its documented Wilson-controlled reopen condition is met.

## Closeout Verification

- Fresh closeout base: `origin/main` at `31a4806bf8ce04942f99b402fa4745dfda0be14b`.
- Required local checks: `git diff --check`, targeted status/reference searches, and a documentation-only changed-file audit.
- Before closeout merge: refresh `origin/main`, confirm the branch is current/conflict-free, inspect the base-to-head diff, and require exact-head GitHub checks plus comment/review inspection.
