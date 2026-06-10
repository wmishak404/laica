# Replit Agent approval guard

**Agent:** codex
**Branch:** `codex/replit-agent-approval-docs`
**Date:** 2026-06-10
**Initiative:** none
**INIT updated:** n/a

## Summary

This docs-only branch captures Wilson's operating constraint that Replit Agent should not be used by default when accessing Replit through Chrome because it spends Replit credits. Future agents should use direct shell/UI paths first and ask Wilson before starting Replit Agent unless the current task already includes that approval.

## Changes

- `AGENTS.md` adds a Replit Agent credit guard under the Human Replit validation policy.
- `CLAUDE.md` mirrors the same rule in the core agent workflow summary.

## Impact on other agents

Agents can still use Chrome for direct Replit shell and workspace UI validation. Replit Agent is approval-required when direct methods are blocked, materially unsafe, or insufficient, and any approved use should be documented in PR/handoff evidence.

## Open items

None.

## Verification

- Docs-only change.
- `git diff --check` should pass.
- Replit validation is not required.
