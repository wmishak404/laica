# Ready-for-review automation docs

**Agent:** codex
**Branch:** codex/ready-review-automation-docs
**Date:** 2026-06-04
**Initiative:** none
**INIT updated:** n/a

## Summary

This docs-only follow-up codifies the PR #125 workflow lesson: Wilson should not have to be the bottleneck just to move a complete Codex-owned draft PR into ready-for-review state so GitHub Actions can run. The new rule grants Codex authority to mark its own complete draft PRs ready and monitor CI when clear gates pass, while preserving the existing distinction between starting automation and merging code.

## Changes

- `docs/workflows/agent-merge-authority.md`
  - Adds a `Ready-For-Review And CI Start Authority` section.
  - Requires clean/current branch state, complete non-WIP scope, evidence/negative-scope notes, local checks or justified skips, Replit lane classification, and no unresolved blockers before Codex marks its own draft PR ready.
  - States that ready-for-review automation never bypasses code/deployment merge rules.
- `docs/workflows/testing-and-acceptance.md`
  - Adds a CI note telling agents to use the ready-for-review rule when a complete draft PR needs GitHub Actions evidence.
  - Requires pending CI to be recorded as pending and replaced with observed results after completion.
- `AGENTS.md`
  - Adds a short pointer so fresh agents see the ready-for-review rule during startup.

## Provenance

- Wilson explicitly approved documenting this automation after PR #125 showed the avoidable bottleneck: Codex had enough evidence to mark the PR ready and start CI without waiting, but merge authority still needed a human instruction.
- PR #125 later hit a real gotcha: after PR #128 merged, branch protection reported the PR as behind even though the old head had green checks. The branch had to be rebased, pushed, rechecked, and merged only after current-head CI passed.

## Verification

Automation is evidence for the docs workflow claim, not proof of any product behavior.

**Claim:** The workflow docs now allow Codex to start the CI/review loop for its own complete draft PRs without expanding code merge authority.

**Command/check provenance:**

- Local macOS worktree `/Users/wilsonishak-macbookpro/.codex/worktrees/ba8b/laica`, branch `codex/ready-review-automation-docs`, base `origin/main` at `82f49f782e69b08e57e091a72d3bbba10d7e5c65`.
- `git diff --check` passed for the uncommitted worktree diff.
- `rg -n "Ready-For-Review|ready-for-review|mark its own complete draft PRs ready|agent-merge-authority" AGENTS.md docs/workflows/agent-merge-authority.md docs/workflows/testing-and-acceptance.md docs/handoffs/2026-06-04-codex-ready-review-automation-docs.md` returned the expected policy section, cross-reference, AGENTS pointer, and handoff references.

**Source provenance:** `docs/workflows/agent-merge-authority.md`, `docs/workflows/testing-and-acceptance.md`, and `AGENTS.md`.

**Observed result:** The docs-only diff has no whitespace errors, and the ready-for-review rule is discoverable from `AGENTS.md`, `docs/workflows/agent-merge-authority.md`, `docs/workflows/testing-and-acceptance.md`, and this handoff.

**Reasoning:** The change is docs-only and scoped to workflow authority. It separates ready-for-review authority from merge authority, names the gates that must pass, and explicitly preserves Replit/code merge blockers.

**Negative scope:**

- Does not grant Codex standing auto-merge authority for code, runtime, dependency, schema, product, UI, security/privacy, or deployment-bound PRs.
- Does not reduce Replit validation requirements.
- Does not make pending/skipped CI count as evidence.
- Does not apply to other agents' branches or intentionally draft/WIP PRs.
- Does not change live-provider, Google OAuth, storage, deployment, or Playwright validation lanes.

## Replit validation

Last Replit-validated at: not required.

Rationale: docs-only workflow/process change. No runtime behavior, app UI, schema, auth, secrets, provider code, deployment config, or Replit behavior changed.
