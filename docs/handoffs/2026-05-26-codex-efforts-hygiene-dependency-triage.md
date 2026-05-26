# Efforts Hygiene and Dependency PR Triage

**Agent:** codex
**Branch:** `codex/efforts-hygiene-2026-05-26`
**Date:** 2026-05-26
**Initiative:** n/a
**INIT updated:** no

## Summary

After PR #105 merged, the open-PR queue needed a small source-of-truth repair and dependency triage. This branch replaces the stale PR #101 direction from fresh `origin/main`: agent instruction mirrors now match the current active INIT/Effort lists, and broad Dependabot PR #104 is parked as deferred EFF-023 instead of staying as an implicit merge candidate.

## Changes

- `AGENTS.md` and `CLAUDE.md`
  - Add INIT-003 to the active INIT read list.
  - Remove resolved EFF-014 from the active Effort mirrors.
  - Add active EFF-022 for cross-cuisine recommendation prompt work.
- `efforts/effort-023-broad-dependency-modernization-strategy.md`
  - Creates a deferred parking record for Dependabot PR #104's 85-package version-update batch.
  - Records that PR #103 remains the narrow dependency/security priority.
  - Defines future split-by-risk upgrade domains and validation expectations.
- `efforts/README.md` and `efforts/registry.md`
  - Add EFF-023 to the deferred Effort list/registry.
- This handoff records why #101 should be replaced and why #104 should not merge as a single batch.

## Impact on other agents

Use `efforts/README.md` as the active read list: EFF-010 and EFF-022 are active; EFF-023 is deferred and only relevant when reopening broad dependency modernization or PR #104.

For dependency work, proceed with PR #103 first. Do not merge PR #104 as-is; split or close it when EFF-023 lands on `main`.

## Open items

- Replace or close stale PR #101 after this branch opens its replacement PR.
- Rebase/update PR #103 onto current `main`, then run local dependency checks.
- Decide whether to close PR #104 immediately after EFF-023 lands, or leave it open only until Dependabot grouping can be adjusted.

## Verification

- Branch started from fresh `origin/main` at `6b54fb7` after PR #105 merged.
- Reviewed PR #101, #103, #104 metadata and current active docs after #105.
- Run before PR: `git diff --check`.
