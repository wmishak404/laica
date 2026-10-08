# Replit-primary local agent workflow

## Operating Principles

Follow [operating-principles.md](operating-principles.md): evidence first, no unsupported assumptions, objective detail, visible rationale and provenance, feedback from first principles, no hacks or duplicate paths, deletion of obsolete paths, explicit decisions, and blocking reports with exact missing inputs and smallest next actions.

For the detailed “Replit vs local macOS” parity spec (drift vectors, decisions, and enforcement plan), see `docs/workflows/environment-parity-spec.md`.

## Source of truth

- Replit is the primary runtime, secrets, database, and deployment environment.
- GitHub is the synchronization layer between Replit and local macOS tooling.
- The main local checkout for this repo is `/Users/wilsonishak-macbookpro/src/laica`.

## Local workspaces

- Codex-managed worktrees are created under `$CODEX_HOME/worktrees`.
- Manually managed extra worktrees for this repo live under `/Users/wilsonishak-macbookpro/src/laica-worktrees`.
- Git only allows one branch to be checked out in one worktree at a time, so each active agent session should own its own branch or detached worktree.

## Branch policy

- Do not work directly on `main`.
- Use `codex/<task-name>` for Codex branches.
- Use `claude/<task-name>` for Claude branches.
- Merge to GitHub first, then sync the selected merged batch into Replit at full/release regression. Do not sync or validate each individual PR early unless Wilson explicitly requests it.

## Local commands

Node is pinned to major version `20` to match `.replit`.

Use these commands locally when the task does not depend on Replit-only services:

- `npm ci`
- `npm run check`
- `npm run build`
- `npm run dev`

## Codex local environment target

Create the shared Codex local environment from the Codex app settings pane and commit the generated file in `.codex`.

Configure it with:

- Setup script: `npm ci`
- Action: `npm run dev`
- Action: `npm run check`
- Action: `npm run build`

## Claude Code project setup

- Shared project memory lives in `CLAUDE.md`.
- Shared project settings live in `.claude/settings.json`.
- Personal overrides belong in `.claude/settings.local.json` and stay untracked.

## Secrets

- Replit Secrets remains the canonical place for live secret values.
- Use `.env.example` only as a template for local setup.
- Never commit real secret values.
- `ADMIN_SECRET` has been rotated. Keep the current value in Replit Secrets only.

## Replit validation gate

**Wilson's rule update, 2026-10-08:** defer Replit shell/browser validation to full regression or release regression unless Wilson explicitly requests it earlier. The required full automated exact-head CI/E2E gate remains independent and does not itself trigger Replit. Keep Replit-only behavior unvalidated and record its exact deferred checks in the PR/handoff and production registry. Code/dependency merges, production publishing, pilot activation and Replit Agent use retain their explicit approval requirements. See [testing-and-acceptance.md](testing-and-acceptance.md).

At full/release regression, before deployment, validate the selected merged code inside Replit:

- app boot
- Firebase sign-in
- recipe suggestion flows
- cooking-session persistence
- feedback writes
- ElevenLabs speech routes
