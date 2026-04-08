# dotenvx Secrets Management & Local Dev Support

**Agent:** claude
**Branch:** claude/sweet-curran
**Date:** 2026-04-07

## Summary

Added dotenvx (AES-256-GCM) for encrypted secrets management so the app can run fully on local macOS — not just Replit. Previously, local dev had no access to secrets and couldn't start the server. Now `.env` is encrypted and committed, decrypted at runtime via `npx @dotenvx/dotenvx run`. Also introduced a `product-decisions/` folder to document key technical choices.

## Changes

| File | Action |
|---|---|
| `.env` | Created — all secrets encrypted with dotenvx, safe to commit |
| `.gitignore` | Updated — allows encrypted `.env`, excludes `.env.keys` (private decryption key) |
| `server/index.ts` | Updated — port configurable via `PORT` env var (macOS AirPlay occupies 5000); `reusePort` gated on `REPL_ID` |
| `replit.md` | Updated — added Secrets Management and Product Decisions sections |
| `CLAUDE.md` | Created — Claude Code project instructions with dotenvx workflow and local dev commands |
| `AGENTS.md` | Created — Codex project instructions with same dotenvx and env var details |
| `product-decisions/README.md` | Created — decision log framework with index and template guidance |
| `product-decisions/001-secrets-management.md` | Created — documents dotenvx decision, alternatives considered, and GCP upgrade path |

## Impact on other agents

### Secrets philosophy change
The previous ADR (`docs/adr/0001-replit-primary-local-agents.md`) states: "Local dev cannot run the full app (no database, no secrets) — this is accepted by design." **This is no longer true.** With dotenvx, local dev has full access to secrets and can run the complete app. The ADR should be updated to reflect this.

### .gitignore change
Main's `.gitignore` blocks `.env` and `.env.*`. Our branch changes this:
- `.env` is now **allowed** (encrypted, safe to commit)
- `.env.keys` is **excluded** (contains the private decryption key)
- `.env.local` is **excluded** (for any local-only overrides)
- `.env.example` remains allowed (via main's `!.env.example`)

### CLAUDE.md and AGENTS.md conflicts
Both files were independently created on main (onboarding setup) and on this branch (dotenvx setup). The merge resolution should:
- **Keep main's structure** — workflow rules, ADR references, handoff protocol, blocker protocol, project structure
- **Add this branch's dotenvx sections** — replace the "secrets are in Replit Secrets only" paragraphs with the dotenvx workflow
- **Update local dev commands** — add `PORT=3000 npx @dotenvx/dotenvx run -- npm run dev`

### New env vars added
Three Firebase client vars were added to `.env`: `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_APP_ID`, `VITE_FIREBASE_PROJECT_ID`. These are needed for Google sign-in on the client.

## Open items

- **ADR update needed** — `docs/adr/0001-replit-primary-local-agents.md` should note that local dev now supports full app execution via dotenvx
- **Replit validation** — after merge to main, pull into Replit and confirm the app still boots normally (Replit ignores dotenvx and uses its own Secrets tab)
- **Firebase authorized domains** — `localhost` must be added as an authorized domain in the Firebase console for local Google sign-in to work

## Merge conflict resolution guide

Three files conflict. Recommended resolution:

| File | Strategy |
|---|---|
| `CLAUDE.md` | Keep main's structure. Replace the `## Secrets` section at the bottom with the dotenvx workflow from this branch. Add local dev run command under `## Commands`. |
| `AGENTS.md` | Keep main's structure. Replace the `## Secrets` section with dotenvx details. Update the "never commit .env" bullet to note encrypted `.env` is safe. |
| `.gitignore` | Keep main's entries (`.claude/settings.local.json`, `.codex/` patterns, `!.env.example`). Replace the `.env` / `.env.*` block with: `.env.keys`, `.env.local`. |

## Verification

- `PORT=3000 npx @dotenvx/dotenvx run -- npm run dev` starts the app on localhost:3000
- All 9 env vars injected (confirmed: `⟐ injected env (9) from .env`)
- `git status` clean after merge resolution
- PR shows no conflicts on GitHub
- Replit app boots normally after pulling merged main
