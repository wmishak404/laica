# Workflow documentation audit epic

**Agent:** codex
**Branch:** codex/mobile-refresh-phase-3-2-progressive-staples
**Date:** 2026-05-08
**Initiative:** none
**INIT updated:** n/a

## Summary

Filed EFF-020 so the broader workflow-documentation audit can move to a separate session after Mobile Refresh Phase 3.2 closes. The immediate trigger was Wilson's question about whether EFF-005 had become redundant now that feature acceptance criteria, validation state, and verification evidence mostly live in phase records, INITs, handoffs, PR descriptions, and workflow docs.

Conclusion captured in the epic: EFF-005 is redundant as a running feature-validation ledger, but it should not be resolved until a central testing/acceptance workflow or process PD exists and active references are repointed.

## Changes

- `efforts/effort-020-workflow-documentation-audit.md`
  - New active process epic.
  - Captures the existing workflow map, likely future workflow-doc candidates, open questions, agent checklist, and resolution criteria.
- `efforts/README.md`
  - Adds EFF-020 to the active read list.
- `efforts/registry.md`
  - Adds EFF-020 to the searchable registry.
- `AGENTS.md` and `CLAUDE.md`
  - Add EFF-020 to the active epic list for workflow-doc changes.

## Impact on other agents

Future workflow-documentation work should happen under EFF-020, not inside Phase 3.2. Read EFF-020 before:

- creating or reorganizing `docs/workflows/`
- resolving or superseding EFF-005
- changing where acceptance criteria, validation state, or verification evidence live
- updating handoff, PR, INIT, epic, or phase-record process rules across multiple docs

Known workflow candidates are listed directly in EFF-020 so the next session can audit from the repo instead of relying on this chat.

## Open items

- Create or promote the central testing/acceptance workflow artifact.
- Decide whether it should be `docs/workflows/testing-and-acceptance.md`, a top-level process PD, or both.
- Repoint active references away from EFF-005 once the new testing workflow exists.
- Resolve EFF-005 after graduation.
- Fix known `initiatives/registry.md` drift found during the Phase 3.2 audit, or explicitly defer it with an owner and reason.

## Verification

- Docs-only change.
- Recommended check before commit/push: `git diff --check`.

## Stack / base status

- Base refreshed: yes
- Current base: same as the Phase 3.2 branch
- Last Replit-validated at: not applicable for this docs-only epic filing; Phase 3.2 runtime validation remains separate and pending
