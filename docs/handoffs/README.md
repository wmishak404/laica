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

## Verification
How to confirm the changes work — local checks, Replit validation steps, or manual tests.
```

## Stacked PR note

If the task is stacked on another branch or follows a recently merged lower phase, include this block in the handoff and PR description. A branch is stacked when it logically depends on a lower PR through shared files, feature behavior, or polish/docs that need to be present in the preview; independent parallel PRs do not need this block.

```markdown
## Stack / base status

- Base refreshed: yes/no
- Current base: origin/main at <sha>
- Last Replit-validated at: <sha> / not yet validated
- Notes: rebased after PR #<number> merged, or explain why not
```

Before Replit validation, stacked branches should be rebased onto current `origin/main` and pushed with `--force-with-lease`. Replit should fetch that updated branch so preview and smoke testing reflect the actual post-merge state.

If any commit lands after the `Last Replit-validated at` SHA, validation is stale and must be re-run before merge. Use `origin/main...HEAD` when listing PR scope.

## PR descriptions

When opening a PR, include a structured summary covering the same information. The PR description is the short-lived version; the handoff file is the durable record.
