@AGENTS.md

# Laica — Claude Code Project Memory

## What is Laica?

Laica is a full-stack cooking assistant app built with React + Express + PostgreSQL, deployed on Replit. It uses Firebase for auth, OpenAI for recipe suggestions/evaluation, and ElevenLabs for text-to-speech cooking guidance.

## Architecture

- **Client:** React 18, Vite, Tailwind CSS, shadcn/ui (Radix), wouter for routing, TanStack Query
- **Server:** Express on Node 20, TypeScript, Drizzle ORM, PostgreSQL (Neon serverless driver)
- **Auth:** Firebase (Google sign-in) on client, token verification on server; legacy Replit Auth also present
- **Deploy:** Replit autoscale deployment; build = `vite build` + `esbuild` server bundle

## Workflow — READ FIRST

See [docs/adr/0001-replit-primary-local-agents.md](docs/adr/0001-replit-primary-local-agents.md) for the full workflow contract. Key rules:

1. **Replit is primary** — runtime, database, secrets, and deployment live there.
2. **GitHub is the sync layer** — `main` is the deployable branch.
3. **Feature branches only** — use `claude/<task-name>` naming.
4. **One agent per branch** — never share a branch with Codex or a human session.
5. **Local checks OK** — `npm run check`, `npm run build` work on macOS.
6. **Local dev OK** — full app runs locally via dotenvx (see Secrets below).
7. **Service validation requires Replit** — deployment-bound changes must be tested there.

## Commands

```bash
npm ci          # install deps
npm run dev     # start dev server (Replit — secrets injected by platform)
npm run check   # TypeScript type-check (works locally)
npm run build   # production build (works locally)
npm run db:push # push Drizzle schema to database (needs DATABASE_URL)

# Local macOS (port 5000 is taken by AirPlay)
PORT=3000 npx @dotenvx/dotenvx run -- npm run dev
```

## Project structure

```
client/          # React frontend (Vite)
server/          # Express backend
  admin-routes.ts  # admin endpoints (ADMIN_SECRET protected)
  routes.ts        # main API routes
  db.ts            # Drizzle + Neon pool
  elevenlabs.ts    # TTS integration
  openai.ts        # OpenAI client
  storage.ts       # data access layer
shared/          # shared types/schemas (Drizzle + Zod)
tests/           # Playwright + Vitest tests
docs/adr/        # Architecture decision records
docs/handoffs/   # Agent coordination handoff files
product-decisions/ # Documented product and architecture decisions
```

## Secrets

Secrets are managed with **dotenvx** (AES-256-GCM encrypted `.env` committed to the repo). Decision documented in `product-decisions/001-secrets-management.md`.

- `.env` — encrypted, safe in git. Decrypted at runtime.
- `.env.keys` — private decryption key, **never commit this**
- `.env.example` — lists all required vars (no values)
- To decrypt and run: `npx @dotenvx/dotenvx run -- <command>`
- To edit secrets: `npx @dotenvx/dotenvx decrypt`, edit, then `npx @dotenvx/dotenvx encrypt`
- **On Replit:** secrets are injected via the Replit Secrets tab. No dotenvx needed.

### Required env vars
- `DATABASE_URL` — Neon PostgreSQL connection string (crashes on startup if missing)
- `ELEVENLABS_API_KEY` — text-to-speech (crashes on startup if missing)
- `OPENAI_API_KEY` — AI features (graceful fallback if missing)
- `ADMIN_SECRET` — admin endpoint auth (only needed for eval routes)
- `SESSION_SECRET` — express session signing
- `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_APP_ID` — Firebase client config

### Security notes
- The historical `ADMIN_SECRET` exposure has been rotated in Replit. Treat old Git history as sensitive.
- Never hardcode secret values. The encrypted `.env` and Replit Secrets are the only approved stores.

## When blocked — human handoff protocol

If you hit a blocker you truly cannot resolve (permissions, secrets rotation, Replit-side action, etc.):

1. **Stop working** — do not retry or work around blindly.
2. **Write a step-by-step guide** for the human explaining exactly what needs to be done to unblock you, with commands or UI steps where applicable.
3. **Include a context checkpoint** so work can resume seamlessly:
   - Current branch and last commit
   - What was completed so far
   - What remains on the plan
   - Any decisions made or assumptions in flight
   - Exact next step to pick up after unblock

The goal is zero lost context — the human (or a fresh agent session) should be able to read the checkpoint and continue without re-deriving anything.

## Agent coordination — handoffs

When completing a task, write a handoff file in `docs/handoffs/` so the other agent (Codex) can pick up context. When starting new work, read recent handoffs to understand what's changed. See [docs/handoffs/README.md](docs/handoffs/README.md) for the naming convention and required sections. PR descriptions should include the same structured summary.

## Auto-push permissions for planning documents

Claude may **commit and push without asking** when the changes are limited to planning and coordination documents:
- `docs/handoffs/*.md` — agent handoff files
- `product-decisions/*.md` and `product-decisions/README.md` — product decision records
- `AGENTS.md` — workflow/process updates

This keeps a continuous conversation flow between Claude and Codex. The other agent can't see anything until it's on `origin`.

**Stop and ask the human when:**
- The change touches source code (`client/`, `server/`, `shared/`, `tests/`)
- There is a question, ambiguity, or decision that needs human input
- The handoff proposes something that hasn't been discussed/approved yet
- Any destructive git operation (force push, branch delete, rebase)

## Branch transitions — carrying WIP

When a planning branch (like `claude/funny-boyd`) transitions to an implementation branch (like `claude/slop-bowl-ui`):

1. Wait for the docs PR to merge to `main`.
2. Create the new implementation branch from `main`.
3. Re-apply any uncommitted WIP (e.g., prototype `slop-bowl.tsx`, modified `app.tsx`, `openai.ts`) onto the new branch. Use `git stash` or manual copy — do not assume the old worktree will persist.
4. The new branch should contain only implementation changes. All planning docs are already on `main`.

This prevents orphaned work and ensures clean git history.

## Claude-specific notes

- Auth is Firebase (Google sign-in only), not Replit Auth. `server/replitAuth.ts` is legacy and unused.
- `reusePort` in server listen is Replit-only (guarded by `REPL_ID` env var).
- The server port is configurable via `PORT` env var (defaults to 5000).
- Vite runs as Express middleware in dev mode (single port serves API + client).
- AI prompts are versioned in the database via `prompt_versions` table.
- Run Claude from the repo root or from a dedicated feature checkout for the task you are handling.
- Keep personal overrides in `.claude/settings.local.json` and any user-only memory outside tracked project files.
- Treat Replit as the final verification environment for database-backed, auth-backed, and deployment-bound changes.
