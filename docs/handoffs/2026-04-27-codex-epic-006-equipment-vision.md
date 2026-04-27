# EPIC-006 equipment vision filing

**Agent:** codex
**Branch:** codex/equipment-vision-exclusions
**Date:** 2026-04-27

## Summary

Filed EPIC-006 as a deferred backlog item for the equipment-vision false-positive issue reported from `/app-settings`. The epic records the current prompt evidence, the planned prompt-first fix shape, and the discovery that vision analysis does not currently log into `ai_interactions`, so logging should be treated as follow-up scope rather than hidden acceptance criteria.

## Changes

- Added `epics/006-equipment-vision-exclusions.md` with required epic sections, deferred status, source feedback quote, implementation direction, and behavior-focused resolution criteria.
- Updated `epics/registry.md` to index EPIC-006 as `Deferred` with the repo-local filing date `2026-04-22`.
- Left `epics/README.md` unchanged so the active epic read list stays limited to currently active governance work.

## Impact on other agents

Agents do not need to read EPIC-006 during ordinary work because it is deferred. Read it before reopening equipment-vision prompt work, changing `/api/vision/analyze` to reduce non-kitchen false positives, or deciding whether to add evaluation/logging coverage for this path.

The most important caveat from filing: `server/openai.ts` sends the equipment-analysis prompts directly, but the vision analysis path does not currently call the shared `logInteraction(...)` helper. Do not assume `ai_interactions` coverage already exists for this route.

## Open items

- Future implementation should tighten `vision-base.md`, `equipment-analysis.md`, and the fallback prompt strings in `server/prompts/composer.ts` together.
- The team still needs to decide whether vision-route logging belongs in the eventual fix or should remain outside this epic.
- The eventual implementation pass should identify durable known-bad and known-good image fixtures for validation.

## Verification

Documentation-only change. Verified the new epic includes the required sections, `epics/registry.md` now indexes EPIC-006 as `Deferred`, and `epics/README.md` remains untouched. Planned command check: `git diff --check`.
