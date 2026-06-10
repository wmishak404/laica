# Nav/Menu Approval Rule

**Agent:** codex
**Branch:** `codex/nav-menu-approval-instructions`
**Date:** 2026-06-09
**Initiative:** none
**INIT updated:** no

## Summary

Wilson clarified that future agents must ask before adding or changing durable cross-functional navigation components such as the nav bar and menu. This docs-only update turns that correction into a shared governance rule so future product, IA, and auth-mode navigation changes are not inferred from adjacent feature work.

## Changes

- `AGENTS.md`
  - Adds a navigation approval rule requiring Wilson approval before adding, removing, reordering, renaming, or changing auth-mode visibility for bottom nav, top nav/header, app menu/account drawer, global menu, tabs, or persistent app-shell actions.
- `CLAUDE.md`
  - Mirrors the same rule for Claude.
- `product-decisions/pd-005-ui-governance.md`
  - Adds durable cross-functional navigation changes as a required UI governance rule and read trigger.
- `design_guidelines.md`
  - Adds the visual-system guardrail near the existing bottom menu/account surface rule.

## Validation

- Docs-only change; no runtime checks required.
- `git diff --check` should be sufficient before commit/PR.

## Deferrals

- No app UI code was changed.
- No existing nav/menu behavior was reverted in this branch.
