# Effort ID shortening

**Branch:** `codex/effort-id-shortening`  
**Base:** `origin/main` at `5d4261b` (`Bump fast-xml-builder from 1.1.5 to 1.2.0 (#51)`)
**Scope:** Docs-only taxonomy cleanup

## Summary

Shortened displayed Effort ticket IDs from the previous long form to `EFF-###` across docs while keeping the system name as **Efforts** and preserving `efforts/effort-###-...md` filenames.

This branch starts after the merged Effort hygiene cleanup stack:

- PR #56 renamed epics to Efforts and moved files under `efforts/`.
- PR #57 tightened the weekly Effort hygiene workflow.
- PR #58 closed out the hygiene merge docs.
- The final branch was rebased after Claude's audit onto the Dependabot `fast-xml-builder` main tip.

## Changes

- Updated the canonical ID convention in `efforts/README.md` and `product-decisions/pd-007-effort-status-and-registry-workflow.md` to `EFF-NNN`.
- Replaced all displayed numeric long-form Effort IDs with `EFF-NNN` across Efforts, product decisions, INITs, workflow docs, design guidelines, and historical handoffs.
- Left filenames, directory names, and `Former ID: EPIC-NNN` metadata unchanged.
- Preserved the hygiene decisions from the cleanup stack: active Efforts remain `010`, `013`, `014`, and `015`; `017` remains deferred; previously closed Efforts remain closed.

## Validation

- Long-form Effort ID searches return no matches.
- Uppercase long-form Effort token searches return no matches.
- `git diff --check` passes.
- Markdown effort-link validation checked 184 markdown files and found all `effort-###` links valid.
- `efforts/README.md`, `AGENTS.md`, and `CLAUDE.md` still list only active Efforts `010`, `013`, `014`, and `015`.

## Notes

No runtime code, schema, tests, GitHub PR naming, or Replit validation surface changed.
