# Vision Text-Only Scan Safeguard Epic

**Agent:** codex
**Branch:** codex/vision-text-only-scan-epic
**Date:** 2026-04-29

## Summary

Filed a new backlog epic for a vision-scan safeguard: pantry and kitchen scans should not treat screenshots or photos of plain text lists as proof that the user physically has those ingredients or equipment.

## Changes

- `epics/011-vision-scan-text-only-safeguard.md`
  - New epic covering pantry and equipment text-only screenshot rejection.
  - Captures scope, decisions, open questions, agent checklist, and resolution criteria.
  - Preserves the distinction between invalid arbitrary OCR text and valid packaging labels on visible physical products.
- `epics/README.md`
  - Added EPIC-011 to the active read list.
- `epics/registry.md`
  - Added EPIC-011 to the complete registry.

## Impact on other agents

- Read EPIC-011 before changing pantry/equipment vision prompts, `/api/vision/analyze` validation, scan rejected-result UI, or any OCR/import workflow.
- This epic is intentionally not an implementation request for Phase 2. It should be picked up as a later prompt/API/UI safeguard pass.

## Open items

- Decide implementation shape later:
  - prompt-only vs prompt plus server validation
  - API response metadata for text-only/document-like inputs
  - exact rejected-scan copy
  - validation fixture set

## Verification

- Docs-only change; no runtime checks required.
- `git diff --check`
