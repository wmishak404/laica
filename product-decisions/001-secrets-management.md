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

**Use dotenvx** for encrypted secrets management.

- The `.env` file is AES-256-GCM encrypted in place and committed to the repo
- The `DOTENV_KEY` / `.env.keys` file is **never committed** (excluded via `.gitignore`)
- Each developer stores the `DOTENV_KEY` on their machine or in a password manager
- The dev server loads secrets via `npx @dotenvx/dotenvx run -- <command>`

## How It Works

```bash
# Encrypt after editing secrets
npx @dotenvx/dotenvx encrypt

# Run the app (decrypts at runtime)
npx @dotenvx/dotenvx run -- npm run dev

# A new contributor needs the DOTENV_PRIVATE_KEY value from .env.keys
# shared securely (password manager, encrypted message — never Slack/email plaintext)
```

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
