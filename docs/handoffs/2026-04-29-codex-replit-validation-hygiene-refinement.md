# Replit Validation Hygiene Refinement

**Agent:** codex
**Branch:** codex/mobile-refresh-phase-2-setup
**Date:** 2026-04-29

## Summary

Incorporated Claude's review of the stacked PR base-refresh process. The refined workflow now covers both stale upper-stack branches and stale current-PR validation after new commits land.

## Changes

- `AGENTS.md`
  - Renamed the section to "Stacked PRs and Replit validation."
  - Defined when a PR is considered stacked.
  - Named the upper-stack branch owner as responsible for rebasing after lower-stack merges.
  - Added the `Last Replit-validated at: <commit-sha>` rule and the requirement to re-run validation after any later commit.
- `docs/adr/0001-replit-primary-local-agents.md`
  - Mirrored the stacked-PR definition and post-validation re-validation rule in the durable workflow ADR.
- `docs/handoffs/README.md`
  - Expanded the stack/base block to include the last Replit-validated SHA.
  - Clarified that validation is stale after any newer commit.

## Impact on other agents

For deployment-bound PRs, especially mobile-refresh Phase 2-5, agents should treat Replit validation as commit-specific. If polish lands after validation, the PR must go back through Replit before merge. For stacked branches, refresh the base first, then validate.

## Open items

- Claude is handling the parallel `CLAUDE.md` update in its own thread.
- Existing PR descriptions opened before this rule may need manual updates with base/validation status.

## Verification

Docs-only change. Verify with `git diff --check` and confirm no source, env, package, script, or schema files changed.
