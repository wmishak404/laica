# Laica — Agent Instructions (Codex / AI Assistants)

Laica is an AI-powered cooking assistant built with React, Express, PostgreSQL (Neon), and Firebase Authentication.

## Secrets Management

Secrets use **dotenvx** (AES-256-GCM encrypted `.env` committed to the repo).

- `.env` — encrypted values, safe to commit
- `.env.keys` — private decryption key, **never commit**
- Decrypt and run: `npx @dotenvx/dotenvx run -- <command>`
- Re-encrypt after changes: `npx @dotenvx/dotenvx encrypt`
- Full rationale: `product-decisions/001-secrets-management.md`

### Required env vars
| Variable | Purpose | Required at startup? |
|----------|---------|---------------------|
| `DATABASE_URL` | Neon PostgreSQL | Yes (crashes) |
| `ELEVENLABS_API_KEY` | Text-to-speech | Yes (crashes) |
| `OPENAI_API_KEY` | AI features | No (graceful fallback) |
| `ADMIN_SECRET` | Admin route auth | No (on demand) |
| `SESSION_SECRET` | Express sessions | No |
| `VITE_FIREBASE_*` | Firebase client config | Yes (auth won't work) |

## Development

```bash
# Local (macOS — port 5000 is taken by AirPlay)
PORT=3000 npx @dotenvx/dotenvx run -- npm run dev

# Replit (secrets injected by platform)
npm run dev
```

## Project Structure

- `client/` — React frontend (Vite, Tailwind, shadcn/ui, wouter routing)
- `server/` — Express backend (Drizzle ORM, Neon DB, Firebase Auth)
- `shared/` — Shared schema and types (Drizzle + Zod)
- `product-decisions/` — Documented product and architecture decisions
- `tests/` — Vitest unit tests, Playwright e2e

## Important Notes

- Authentication is Firebase (Google sign-in). `server/replitAuth.ts` is legacy and unused.
- The server port is configurable via `PORT` env var (defaults to 5000).
- `reusePort` in the server listen call is Replit-only (gated on `REPL_ID`).
- Vite dev server runs as Express middleware — single port serves both API and client.
- AI prompt versions are stored in the `prompt_versions` DB table with in-memory caching.
