# LAICA Agent Workflow

Replit is the primary environment for runtime behavior, secrets, database access, and deployment. GitHub is the shared source of truth between Replit and local agent tooling on macOS.

See the full shared workflow in [docs/workflows/replit-primary-local-agents.md](/Users/wilsonishak-macbookpro/src/laica/docs/workflows/replit-primary-local-agents.md).

## Core rules

- Keep `main` deployable. Codex and Claude should work from feature branches, not directly on `main`.
- Use branch names with clear ownership: `codex/<task-name>` for Codex work and `claude/<task-name>` for Claude work.
- Only one agent/session should actively own a branch or checked-out worktree at a time.
- Prefer Codex app worktrees for parallel Codex tasks. Codex-managed worktrees live under `$CODEX_HOME/worktrees`; manually managed worktrees for this repo live under `/Users/wilsonishak-macbookpro/src/laica-worktrees`.
- Shared Codex local-environment files belong in the repo-root `.codex` folder.
- Local macOS work is for editing, reviews, refactors, and compile-time checks. Service-backed validation still happens in Replit before deployment.

## Local checks

Run these locally when the task does not depend on Replit-only services:

- `npm ci`
- `npm run check`
- `npm run build`
- `npm run dev` after the required secrets are available locally

## Replit validation gate

Before merging deployment-bound changes, sync the branch into Replit and verify:

- Firebase sign-in
- recipe suggestion flows
- cooking-session persistence
- feedback writes
- ElevenLabs-backed speech routes

## Secrets

- Keep real secrets in Replit Secrets, not in tracked files.
- The historical `ADMIN_SECRET` exposure has been rotated in Replit. Keep the new value in Replit Secrets only and continue treating the old Git history as sensitive.
- Never commit `.env`, `.env.*`, `.claude/settings.local.json`, or personal Claude memory files.
