# Agent Handoffs

This directory is the coordination channel between Claude Code and Codex. Each file documents what one agent completed so the other can pick up context without human-routed summaries.

## Convention

- **One file per completed task**, named: `YYYY-MM-DD-<agent>-<short-name>.md`
  - Example: `2026-04-06-claude-onboarding-setup.md`
- **Write a handoff when finishing a task** — before or alongside the PR.
- **Read existing handoffs when starting new work** — check what the other agent has done recently.

## Required sections

```markdown
# <Task title>

**Agent:** claude | codex
**Branch:** <branch name>
**Date:** YYYY-MM-DD

## Summary
What was done and why.

## Changes
List of files created/modified and what each change does.

## Impact on other agents
What the other agent needs to know — dependencies, conventions introduced, files they should read.

## Open items
Anything left unfinished or that requires human/Replit-side action.
```

## PR descriptions

When opening a PR, include a structured summary covering the same information. The PR description is the short-lived version; the handoff file is the durable record.
