# 2026-07-07 - Codex closeout auto-merge policy update

## Summary

Wilson clarified that when he explicitly approves merging a parent PR, Codex should also automatically merge the immediate fact-only closeout PR if it adds no new scope and all checks/review gates pass. This prevents mechanical INIT/Effort closeout PRs from requiring a second approval when they only record already-merged facts.

## Updated Rules

- `AGENTS.md` now summarizes both docs-only workflow PR auto-merge authority and fact-only post-merge closeout auto-merge authority.
- `docs/workflows/agent-merge-authority.md` now states that the parent merge instruction carries to the immediate mechanical closeout PR only when the closeout adds no new scope and only records facts, validation, deferrals, and the next resume point.
- `docs/workflows/documentation-routing.md` now tells agents to merge eligible closeout PRs after checks pass, and to stop for Wilson when the closeout adds scope, changes decisions/status beyond mechanical facts, or has unresolved comments/checks.

## Validation

- `git diff --check`
- PR #267 exact-head GitHub checks passed before merge: `unit`, `e2e_guest_smoke`, `npm-audit`, `trufflehog_pr`, CodeQL, and Analyze jobs.

## Merge Closeout

PR #267 merged on 2026-07-07 as `9cb63fa87d29e4d8e885350f3d8bee9d1f6e4e6a` after Wilson explicitly requested the policy update. This closeout adds only the merge SHA and final check summary.

## Boundaries

This does not grant auto-merge authority for code, UI, product-direction, security/privacy, deployment-bound, dependency, schema, or runtime PRs. It only clarifies fact-only closeout handling after a parent merge was already explicitly approved or merged under an existing auto-merge authority.
