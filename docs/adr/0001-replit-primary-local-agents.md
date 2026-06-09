# ADR 0001: Replit-Primary with Local Agent Workflow

**Status:** Accepted
**Date:** 2026-04-06

## Context

Laica is developed and deployed on Replit, which provides runtime, secrets management, PostgreSQL database, and deployment infrastructure. However, Replit does not natively host AI coding agents (OpenAI Codex, Anthropic Claude Code). We need a workflow that lets these agents contribute locally while keeping Replit as the authoritative environment.

`ADMIN_SECRET` has been rotated. Keep the current value in Replit Secrets only.

## Decision

### Replit is primary

Replit remains the single runtime, database, and deployment target. No Replit services are replaced in this phase.

### GitHub is the sync backbone

`wmishak404/laica` on branch `main` is the deployable source of truth. All collaboration between Replit, Codex, and Claude Code flows through GitHub.

### Local agents: Codex and Claude Code

Both agents run on macOS against a local clone of the repo. They are approved specifically because Replit cannot host them.

### Workflow rules

1. **One agent per branch/worktree.** No two agents (or an agent and a human) work on the same branch simultaneously.
2. **Feature branches only.** Agents never commit directly to `main`.
   - Codex branches: `codex/<task-name>`
   - Claude branches: `claude/<task-name>`
3. **Merge to GitHub first.** Feature branches merge to `main` via PR on GitHub.
4. **Then sync Replit.** After merge, pull into Replit, validate with live services, and deploy from Replit.
5. **Local checks are allowed.** `npm ci`, `npm run check`, `npm run build` can run on macOS for fast feedback.
6. **Service-backed release validation requires Replit.** Any test that needs the Replit runtime, deployment secrets, Firebase Google auth, live provider behavior, or production deployment posture must be validated in Replit before production publish. PR-level human Replit validation is targeted by risk, not automatic for every deployment-bound code change. Automated Replit-environment checks can become PR gates once their setup, evidence, and negative scope are documented and accepted.

### Stacked PRs and Replit validation

When a feature is split across stacked PRs, a branch counts as stacked when it logically depends on a lower PR: shared files, builds on the feature, or needs the lower PR's polish/docs to represent the real post-merge product. Parallel independent PRs do not need this treatment.

After a lower-stack PR merges, the owner of the next stacked branch must rebase that branch onto fresh `origin/main`, push with `--force-with-lease`, and tell Replit to fetch the updated branch before preview or smoke testing. This prevents Replit from previewing a stale composition that is missing polish or docs already merged to `main`.

Replit validation is tied to a commit SHA whether it is human/manual or automated. PR descriptions and handoffs for work that claims Replit validation must include `Last Replit-validated at: <commit-sha>` and identify the lane. Low-risk PRs that deliberately defer human Replit validation to a batched release pass must instead state `Human Replit validation: deferred to release/batch validation` and list the exact deferred checks. If any commit lands after a claimed Replit-validated SHA, validation is stale for the affected PR or release batch.

Branch scope and validation reports should use `origin/main...HEAD` as the comparison point after the refresh.

## Consequences

- Local dev can now run the full app using dotenvx for encrypted secrets (see `product-decisions/pd-001-secrets-management.md`). Replit remains the authoritative deployment and validation environment.
- PRs from agent branches need automated merge-gate evidence before merge, and Replit validation before production shipping unless the release owner explicitly accepts a narrower deployment risk.
- The `.codex` and `.claude/` directories are checked in for reproducibility across worktrees.
- `ADMIN_SECRET` has been rotated. Keep the current value in Replit Secrets only.
- Stacked PRs require a small rebase step after lower-stack merges so validation reflects `main + current PR`, not an outdated intermediate branch.
- Replit validation is invalidated by any later branch commit until the branch or release batch is re-validated at the new commit SHA.
