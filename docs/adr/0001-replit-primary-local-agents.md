# ADR 0001: Replit-Primary with Local Agent Workflow

**Status:** Accepted
**Date:** 2026-04-06

## Context

Laica is developed and deployed on Replit, which provides runtime, secrets management, PostgreSQL database, and deployment infrastructure. However, Replit does not natively host AI coding agents (OpenAI Codex, Anthropic Claude Code). We need a workflow that lets these agents contribute locally while keeping Replit as the authoritative environment.

The repository had a security concern: a previous `ADMIN_SECRET` value was committed in Git history. The secret has been rotated in Replit Secrets. The old Git history should be treated as sensitive.

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
6. **Service-backed validation requires Replit.** Any test that needs the database, Firebase auth, ElevenLabs, or other secrets must be validated in Replit before deploy.

## Consequences

- Local dev cannot run the full app (no database, no secrets) — this is accepted by design.
- PRs from agent branches need Replit validation before shipping.
- The `.codex` and `.claude/` directories are checked in for reproducibility across worktrees.
- The historical `ADMIN_SECRET` exposure has been handled operationally with a Replit secret rotation, but the old Git history should still be treated as sensitive.
