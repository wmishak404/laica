# INIT sequencing semantics

**Agent:** codex
**Branch:** codex/init-sequencing-semantics
**Date:** 2026-05-13
**Initiative:** INIT-001
**INIT updated:** yes — added sequencing semantics so Phase 3.1, Phase 4, Phase 5, and EFF-017 relationships are explicit.

## Summary

This is a slim workflow guardrail so future agents and automations do not mistake phase list order for a hard dependency graph. The docs now tell agents to classify INIT work relationships before recommending out-of-order work, and INIT-001 records that Phase 3.1 is the default next pass but not a blocker for Phase 4.

## Changes

- `AGENTS.md` adds the INIT sequencing rule and the five relationship classifications: hard dependency, soft sequence, parallel-safe, shared-surface conflict, and product priority call.
- `CLAUDE.md` mirrors the same rule for Claude-side handoffs.
- `initiatives/INIT-001-mobile-refresh.md` adds a compact `Sequencing Semantics` table:
  - Phase 3.1 before Phase 4 is a soft sequence.
  - Phase 3.1 alongside Phase 4 is parallel-safe with file/debt guardrails.
  - Phase 4 before Phase 5 is a hard dependency.
  - EFF-017 with Phase 4 is support/pilot, not a replacement for Replit validation.

## Impact on other agents

When asking "what's next?", agents should still read the INIT resume point first, but they should not treat that order as absolute unless the INIT or phase record says a dependency is hard. If recommending work out of order, they must state the relationship classification and the reason.

## Open items

- None. This intentionally avoids adding a new standalone workflow doc.

## Verification

- `git diff --check` passed.
- Targeted reference search passed for the INIT sequencing rule, relationship classifications, INIT-001 sequencing table, and EFF-017/Phase 4 pilot wording.
