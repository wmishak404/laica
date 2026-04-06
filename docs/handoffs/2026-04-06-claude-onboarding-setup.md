# Local-Agent Onboarding Setup

**Agent:** claude
**Branch:** claude/objective-zhukovsky
**Date:** 2026-04-06

## Summary

Implemented the Replit-primary local-agent onboarding plan. Created the shared workflow documentation, project contracts for both agents, environment config, and repo hygiene improvements.

## Changes

| File | Action |
|---|---|
| `docs/adr/0001-replit-primary-local-agents.md` | Created — shared workflow contract (Replit-primary, GitHub sync, branch rules) |
| `CLAUDE.md` | Created — Claude Code project memory with architecture, commands, workflow, and blocker protocol |
| `AGENTS.md` | Created — Codex project contract with same workflow rules and code conventions |
| `.env.example` | Created — lists all 7 required env vars (no values) |
| `.nvmrc` | Created — pinned to Node 20 (matches Replit) |
| `.gitignore` | Updated — added `.env`, `.env.*`, `!.env.example`, `.claude/settings.local.json`, `.claude/worktrees/` |
| `.claude/settings.json` | Already existed with correct deny rules; no changes needed |
| `docs/handoffs/README.md` | Created — defines the agent handoff convention |

## Impact on other agents

- **Codex** should read `AGENTS.md` as its project contract — it points to the ADR for workflow rules.
- Both agents must use `docs/handoffs/` to document completed work going forward.
- Branch naming: `codex/<task-name>` for Codex, `claude/<task-name>` for Claude.
- PR descriptions should include structured summaries per the handoff README.

## Open items

- **Rotate `ADMIN_SECRET`** in Replit Secrets — human action required, treat old value as compromised.
- **Codex local-environment config** — Codex has completed this (`.codex/environments/environment.toml`).
