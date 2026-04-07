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
6. **Service validation requires Replit** — anything needing DB, Firebase, or API keys must be tested there.

## Commands

```bash
npm ci          # install deps
npm run dev     # start dev server (needs DATABASE_URL + secrets)
npm run check   # TypeScript type-check (works locally)
npm run build   # production build (works locally)
npm run db:push # push Drizzle schema to database (needs DATABASE_URL)
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
```

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

## Claude-specific notes

- Run Claude from the repo root or from a dedicated feature checkout for the task you are handling.
- Keep personal overrides in `.claude/settings.local.json` and any user-only memory outside tracked project files.
- Treat Replit as the final verification environment for database-backed, auth-backed, and deployment-bound changes.

## Secrets

All secrets are environment-variable based — see `.env.example` for the full list. Never hardcode secret values. Secrets are managed in Replit Secrets for production.
