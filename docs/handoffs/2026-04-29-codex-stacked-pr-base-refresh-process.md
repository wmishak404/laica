# Stacked PR Base Refresh Process

**Agent:** codex
**Branch:** codex/mobile-refresh-phase-2-setup
**Date:** 2026-04-29

## Summary

Documented the process learned from PR #23: when stacked phase work depends on lower PRs, the next branch must be rebased onto current `origin/main` after lower-stack merges and before Replit validation.

## Changes

- `AGENTS.md`
  - Added a Stacked PR base refresh section with the fetch/rebase/force-with-lease/Replit-fetch sequence.
  - Requires handoffs and PR descriptions to state whether a stacked branch has been refreshed onto current `origin/main`.
- `docs/adr/0001-replit-primary-local-agents.md`
  - Added the stacked branch refresh rule to the Replit-primary workflow.
  - Notes that validation should reflect `main + current PR`, not an old intermediate branch.
- `docs/handoffs/README.md`
  - Added a required stack/base status block for stacked PR handoffs.
  - Calls out `origin/main...HEAD` as the comparison point for branch scope.

## Impact on other agents

For Phase 3-5 mobile-refresh work, agents should refresh their branch base immediately after prior phases merge. Replit validation should not begin until the branch has been rebased onto the latest `origin/main` and pushed.

## Open items

- Existing PR descriptions may need manual updates if they were opened before this rule.
- Replit-side task plans should also include this base-refresh check before smoke testing stacked branches.

## Verification

Docs-only change. Verify with `git diff --check` and confirm only workflow/handoff docs changed.
