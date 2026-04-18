# EPIC-005 Testing Strategy and Acceptance Criteria

**Agent:** codex
**Branch:** codex/epic-002-003-flow-fixes
**Date:** 2026-04-17

## Summary
Created a new cross-cutting epic for app-wide testing strategy and acceptance-criteria workflow. This came from Wilson's request to stop treating "push it and see" as the primary validation loop and instead define a clearer bar for what should be tested, where acceptance criteria live, and how verification is recorded before merge.

The epic documents the current state accurately: local compile/build checks exist, Replit validation is required for service-backed work, a small `tests/` surface exists, but there is no unified validation matrix or standard test-script contract in `package.json`.

## Changes
- `epics/005-testing-strategy-and-acceptance-criteria.md`
  - New epic covering current evidence, scope, open questions, checklist, and resolution criteria for a repo-wide testing workflow.
- `epics/README.md`
  - Added EPIC-005 to the open-epic index.
- `AGENTS.md`
  - Added EPIC-005 to the repo-level open-epics rule so future work on merge readiness, acceptance criteria, or verification workflow reads it first.

## Impact on other agents
- EPIC-005 is now the planning artifact to read before reshaping how testing/verification should work across the app.
- This does not yet change the current validation rules; it only records the gap and frames the planning work.
- The upcoming dedicated planning thread can start from this epic instead of rebuilding the problem statement from scratch.

## Open items
- The actual test strategy remains to be decided.
- No new scripts, CI checks, or acceptance-criteria templates were implemented in this pass.
- If a future planning pass settles the workflow, this epic should graduate to a durable product/workflow decision and then be resolved.

## Verification
- Verified current references for the epic against:
  - `AGENTS.md`
  - `docs/adr/0001-replit-primary-local-agents.md`
  - `package.json`
  - `tests/e2e/cooking-workflow.test.ts`
  - `tests/unit/voice-recording.test.ts`
  - `tests/setup.ts`
- No runtime verification required; this pass only adds planning artifacts.
