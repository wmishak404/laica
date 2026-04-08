# Laica — Claude Code Instructions

Laica is an AI-powered cooking assistant. React + Express + PostgreSQL (Neon) + Firebase Auth.

## Secrets Management

Secrets are managed with **dotenvx**. The `.env` file is AES-256-GCM encrypted and committed to the repo.

- `.env` — encrypted, safe in git
- `.env.keys` — private decryption key, **never commit this**
- To decrypt and run: `npx @dotenvx/dotenvx run -- <command>`
- To re-encrypt after editing: `npx @dotenvx/dotenvx encrypt`
- Decision documented in `product-decisions/001-secrets-management.md`

### Required env vars
- `DATABASE_URL` — Neon PostgreSQL connection string
- `ELEVENLABS_API_KEY` — text-to-speech (crashes on startup if missing)
- `OPENAI_API_KEY` — AI features (graceful fallback if missing)
- `ADMIN_SECRET` — admin endpoint auth (only needed for eval routes)
- `SESSION_SECRET` — express session signing
- `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_APP_ID` — Firebase client config

## Running Locally

```bash
PORT=3000 npx @dotenvx/dotenvx run -- npm run dev
```

- Port defaults to 5000 (for Replit). Use `PORT=3000` locally since macOS AirPlay occupies 5000.
- Node.js must be on PATH (installed at `/usr/local/bin/node` on this machine).

## Running on Replit

Replit injects secrets via its Secrets tab. No dotenvx needed — just `npm run dev`.

## Project Structure

- `client/` — React frontend (Vite, Tailwind, shadcn/ui, wouter)
- `server/` — Express backend (Drizzle ORM, Neon, Firebase Auth)
- `shared/` — Shared types and schema (Drizzle + Zod)
- `product-decisions/` — Documented product and architecture decisions
- `tests/` — Vitest unit tests and Playwright e2e tests

## Key Conventions

- Auth is Firebase (Google sign-in only), not Replit Auth. `server/replitAuth.ts` is legacy and unused.
- `reusePort` in server listen is Replit-only (guarded by `REPL_ID` env var).
- Vite runs as Express middleware in dev mode (single port serves API + client).
- AI prompts are versioned in the database via `prompt_versions` table.
