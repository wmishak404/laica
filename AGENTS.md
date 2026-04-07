# LAICA Agent Workflow

Replit is the primary environment for runtime behavior, secrets, database access, and deployment. GitHub is the shared source of truth between Replit and local agent tooling on macOS.

See the full shared workflow in [docs/adr/0001-replit-primary-local-agents.md](docs/adr/0001-replit-primary-local-agents.md).

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

## Project structure

```
client/          # React frontend (Vite, React 18, Tailwind, shadcn/ui)
server/          # Express backend (Node 20, Drizzle ORM, PostgreSQL)
shared/          # Shared types and schemas (Drizzle + Zod)
tests/           # Playwright + Vitest tests
docs/adr/        # Architecture decision records
docs/handoffs/   # Agent coordination handoff files
```

## Secrets

- Keep real secrets in Replit Secrets, not in tracked files.
- The historical `ADMIN_SECRET` exposure has been rotated in Replit. Keep the new value in Replit Secrets only and continue treating the old Git history as sensitive.
- Never commit `.env`, `.env.*`, `.claude/settings.local.json`, or personal Claude memory files.
- See `.env.example` for the full list of required variables.

## Agent coordination — handoffs

When completing a task, write a handoff file in `docs/handoffs/` so the other agent can pick up context. When starting new work, read recent handoffs to understand what's changed. See [docs/handoffs/README.md](docs/handoffs/README.md) for the naming convention and required sections. PR descriptions should include the same structured summary.

## Code conventions

- TypeScript throughout (client and server)
- Drizzle ORM for database access; Zod for validation
- shadcn/ui component library (Radix primitives + Tailwind)
- wouter for client-side routing
- TanStack Query for server state
