# PD-001: Secrets Management with dotenvx

**Date:** 2026-04-07
**Status:** Accepted
**Decision maker:** Wilson

## Context

Laica is primarily developed on Replit, which manages secrets through its built-in Secrets tab. When running locally, there was no mechanism to share those secrets — requiring manual `.env` file creation and risking accidental commits of plaintext API keys to GitHub.

We needed a solution that:
- Keeps secrets in sync between Replit and local development
- Prevents accidental exposure of plaintext secrets in git history
- Requires minimal infrastructure for a solo/small-team project
- Allows a future upgrade path to a cloud-based secrets manager

## Options Considered

| Option | Pros | Cons |
|--------|------|------|
| **dotenvx (encrypted .env in repo)** | Zero infra, works offline, one key to manage | Manual key rotation; sharing = sharing one key |
| **Doppler / Infisical (SaaS)** | Central dashboard, audit logs, multi-env | Another SaaS dependency; free tier limits |
| **Google Cloud Secret Manager** | Enterprise-grade, IAM, versioning, auto-rotation | Requires GCP project + billing, SDK changes |
| **1Password CLI** | Reuses existing tool; no new accounts | Only works where 1P CLI is installed; no Replit integration |

## Decision

**Use dotenvx** as the single source of truth for secrets across all environments.

- The `.env` file is AES-256-GCM encrypted in place and committed to the repo
- The `DOTENV_KEY` / `.env.keys` file is **never committed** (excluded via `.gitignore`)
- Each developer/environment stores only the `DOTENV_PRIVATE_KEY` — everything else is decrypted from `.env`
- The dev server loads secrets via `npx @dotenvx/dotenvx run -- <command>`

### Unified approach: local + Replit

Rather than maintaining secrets in two places (encrypted `.env` locally, Secrets tab on Replit), **Replit also uses dotenvx**. Replit only needs one secret — `DOTENV_PRIVATE_KEY` — and decrypts the rest from the committed `.env` file at runtime.

This means adding or changing a secret is a single workflow: decrypt, edit, re-encrypt, commit. Every environment picks up the change automatically.

## How It Works

```bash
# Encrypt after editing secrets
npx @dotenvx/dotenvx encrypt

# Run the app (decrypts at runtime) — works on both local and Replit
npx @dotenvx/dotenvx run -- npm run dev

# A new contributor/environment needs only the DOTENV_PRIVATE_KEY value
# shared securely (password manager, encrypted message — never Slack/email plaintext)
```

### Replit setup (one-time)

1. Open the Replit Secrets tab
2. Add one secret: `DOTENV_PRIVATE_KEY` = (value from `.env.keys`)
3. Update the Replit run command to: `npx @dotenvx/dotenvx run -- npm run dev`
4. Remove the individual secrets from the Secrets tab (DATABASE_URL, OPENAI_API_KEY, etc.) — they are now managed via the encrypted `.env`
5. Pull the latest `main` so Replit has the encrypted `.env` file

## Upgrade Path

When the project outgrows dotenvx (multiple environments, team rotation, audit requirements), migrate to **Google Cloud Secret Manager**:

1. Add GCP Secret Manager SDK to server startup
2. Remove dotenvx decrypt step
3. Delete `.env.keys` and encrypted `.env` from repo
4. No app code changes needed — secrets still arrive as `process.env.*`

## Risks and Mitigations

| Risk | Mitigation |
|------|-----------|
| `DOTENV_PRIVATE_KEY` leaked | Rotate: re-run `npx @dotenvx/dotenvx encrypt`, distribute new key |
| Contributor commits `.env.keys` | `.gitignore` excludes it; add a pre-commit hook if team grows |
| Encrypted `.env` brute-forced | AES-256-GCM is computationally infeasible to crack; repo is private |
