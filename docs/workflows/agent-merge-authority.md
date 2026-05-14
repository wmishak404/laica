# Agent Merge Authority Workflow

## Operating Principles

Follow [operating-principles.md](operating-principles.md): evidence first, no unsupported assumptions, objective detail, visible rationale and provenance, feedback from first principles, no hacks or duplicate paths, deletion of obsolete paths, explicit decisions, and blocking reports with exact missing inputs and smallest next actions.

This workflow defines when Codex may merge a PR without a fresh Wilson instruction in the current thread, and when it must stop for human, peer, Replit, or security review.

## Plain-English Rule

Codex may auto-merge docs-only workflow PRs after the merge-readiness checklist passes. Code, repo configuration, deployment-bound, product-direction, security/privacy, and unresolved-review PRs still require the stricter gates in [`testing-and-acceptance.md`](testing-and-acceptance.md), Replit validation when applicable, and an explicit human merge instruction.

## Auto-Merge Authority

Codex may merge a PR on its own only when all of these are true:

1. The PR is docs-only and workflow/process-scoped.
2. The changed files are limited to `AGENTS.md`, `CLAUDE.md`, `replit.md`, `docs/workflows/**`, and coordination handoffs in `docs/handoffs/**`.
3. The PR does not change product behavior, UX direction, visual standards, security/privacy policy, secrets handling, dependency posture, deployment behavior, active INIT phase status, active Effort status, or durable product decisions.
4. The branch is current with `origin/main`, has no merge conflicts, and has no unrelated worktree changes.
5. Required checks are passing, or GitHub reports no required checks for the docs-only PR.
6. Review comments and PR comments do not contain unresolved blockers, requested changes, or explicit peer-review-before-merge requests.
7. The PR body and handoff include validation, duplicate/blocker audit where relevant, and `Replit validation: not required` with a docs-only rationale.
8. No human/product/security/Replit-side decision remains open.

If any condition is uncertain, stop and leave a blocking report instead of merging.

## Hard Stops

Do not auto-merge when the PR:

- touches `client/`, `server/`, `shared/`, `tests/`, package/dependency files, `.replit`, environment files, generated assets, migrations, database schema, or runtime config
- changes product direction, UX/IA, design system rules, copy standards, privacy/security posture, AI/model policy, rate limits, auth, secrets, or deployment policy
- updates active INIT or Effort state, closes/supersedes an Effort, changes phase acceptance, or changes current resume point
- changes this merge-authority policy or expands agent permissions, unless Wilson explicitly approved that change in the current thread
- is stacked on another unmerged PR or depends on a lower PR that has not merged
- has stale validation, a stale base, merge conflicts, failing/pending required checks, unresolved requested changes, or an explicit peer-review request
- is marked superseded, not merge-ready, or blocked by a handoff/PR note

## Merge-Readiness Checklist

Run these checks immediately before auto-merging:

1. Fetch fresh refs: `git fetch origin`.
2. Confirm branch/head: `git status --short --branch` and `git rev-parse HEAD`.
3. Confirm base is current: `git merge-base --is-ancestor origin/main HEAD`.
4. Confirm no merge conflicts: `git merge-tree origin/main HEAD` and inspect for conflict markers.
5. Audit scope from the real PR diff: `git diff --name-only origin/main...HEAD`.
6. Run docs formatting check: `git diff --check origin/main...HEAD`.
7. Run workflow-specific searches, such as operating-principles headers for workflow docs or blocked-handoff discovery text when those rules changed.
8. Check GitHub status for the head SHA. Pending, failing, errored, or inaccessible required checks block auto-merge.
9. Read PR comments, review submissions, and review threads. Requested changes, unresolved blockers, or explicit review requests block auto-merge.
10. Confirm the PR body and handoff record validation, remaining unvalidated scope, Replit status, and any explicit deferrals.

## Merge Tooling

Preferred path:

1. Use the GitHub connector to fetch PR status/comments and merge with `expected_head_sha`.
2. If the PR is a draft and all gates pass, mark it ready immediately before merge.
3. Merge with the repo's normal method, defaulting to squash when GitHub allows it unless the PR or repo policy says otherwise.

Fallback path:

1. Use `gh pr checks <number>`, `gh pr view <number>`, and `gh pr merge <number>` only when local `gh auth status` is valid.
2. If `gh` auth is invalid, re-authenticate with `gh auth login -h github.com` or `gh auth refresh -h github.com -s repo`.
3. If neither connector merge nor `gh` merge is available, leave a blocking report with the exact missing tool/auth step.

Always pass an expected head SHA when the tool supports it so a moved branch cannot merge accidentally.

## Code And Deployment-Bound PRs

Codex does not have standing auto-merge authority for code, repo configuration, dependency, security/privacy, schema, product, UI, or deployment-bound PRs.

Those PRs require the relevant local checks from [`testing-and-acceptance.md`](testing-and-acceptance.md), targeted tests, Replit validation when service-backed or deployment-bound, fresh validation at the final head SHA, and an explicit human merge instruction unless Wilson later grants a narrower authority in a workflow doc.

## Provenance From Past Merge Blocks

This policy encodes recurring blockers already documented in handoffs and workflow docs:

- Deployment-bound branches were blocked when Replit validation was missing or stale after newer commits.
- Some PRs were blocked by Wilson product/design decisions, such as unresolved typography/design-system direction.
- Some docs/process branches requested Claude peer review before merge when taxonomy or workflow consequences were non-trivial.
- Superseded PRs were closed instead of merged when a later phase or branch replaced them.
- INIT and Effort work needed post-merge closeout from fresh `main` before the work could be considered fully finished.
- Security/audit findings required alignment before fix branches landed on `main`.
