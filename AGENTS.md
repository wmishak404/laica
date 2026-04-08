# LAICA Agent Workflow

Replit is the primary environment for runtime behavior, secrets, database access, and deployment. GitHub is the shared source of truth between Replit and local agent tooling on macOS.

See the full shared workflow in [docs/adr/0001-replit-primary-local-agents.md](docs/adr/0001-replit-primary-local-agents.md).

## Core rules

- Keep `main` deployable. Codex and Claude should work from feature branches, not directly on `main`.
- Use branch names with clear ownership: `codex/<task-name>` for Codex work and `claude/<task-name>` for Claude work.
- Only one agent/session should actively own a branch or checked-out worktree at a time.
- Prefer Codex app worktrees for parallel Codex tasks. Codex-managed worktrees live under `$CODEX_HOME/worktrees`; manually managed worktrees for this repo live under `/Users/wilsonishak-macbookpro/src/laica-worktrees`.
- Shared Codex local-environment files belong in the repo-root `.codex` folder.
- Local macOS work is for editing, reviews, refactors, and compile-time checks. Full local dev is now possible via dotenvx (see Secrets below). Service-backed validation still happens in Replit before deployment.

## Local checks

Run these locally when the task does not depend on Replit-only services:

- `npm ci`
- `npm run check`
- `npm run build`
- `PORT=3000 npx @dotenvx/dotenvx run -- npm run dev` (full local dev with secrets)

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
product-decisions/ # Documented product and architecture decisions
```

## Secrets

Secrets are managed with **dotenvx** (AES-256-GCM encrypted `.env` committed to the repo). Decision documented in `product-decisions/001-secrets-management.md`.

- `.env` — encrypted, safe in git. Decrypted at runtime via `npx @dotenvx/dotenvx run`.
- `.env.keys` — private decryption key, **never commit this**.
- `.env.example` — lists all required vars (no values).
- **On Replit:** secrets are injected via the Replit Secrets tab. No dotenvx needed.

### Required env vars
| Variable | Purpose | Required at startup? |
|----------|---------|---------------------|
| `DATABASE_URL` | Neon PostgreSQL | Yes (crashes) |
| `ELEVENLABS_API_KEY` | Text-to-speech | Yes (crashes) |
| `OPENAI_API_KEY` | AI features | No (graceful fallback) |
| `ADMIN_SECRET` | Admin route auth | No (on demand) |
| `SESSION_SECRET` | Express sessions | No |
| `VITE_FIREBASE_*` | Firebase client config | Yes (auth won't work) |

### Security notes
- The historical `ADMIN_SECRET` exposure has been rotated in Replit. Keep the new value in Replit Secrets only and continue treating the old Git history as sensitive.
- Never hardcode secret values. The encrypted `.env` and Replit Secrets are the only approved stores.

## Agent coordination — handoffs

When completing a task, write a handoff file in `docs/handoffs/` so the other agent can pick up context. When starting new work, read recent handoffs to understand what's changed. See [docs/handoffs/README.md](docs/handoffs/README.md) for the naming convention and required sections. PR descriptions should include the same structured summary.

## Code conventions

- TypeScript throughout (client and server)
- Drizzle ORM for database access; Zod for validation
- shadcn/ui component library (Radix primitives + Tailwind)
- wouter for client-side routing
- TanStack Query for server state
