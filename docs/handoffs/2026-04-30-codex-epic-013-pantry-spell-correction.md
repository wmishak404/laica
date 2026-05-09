# EFFORT-013 Pantry Spell-Correction Filing

**Agent:** codex
**Branch:** `codex/mobile-refresh-phase-2-1-setup-polish`
**Date:** 2026-04-30
**Initiative:** INIT-001
**INIT updated:** yes

## Summary

Filed Wilson's future pantry manual-entry spell-correction idea as EFFORT-013. This is intentionally not a Phase 2.1 merge gate.

## Changes

- Added `efforts/effort-013-pantry-manual-entry-spell-correction.md`.
- Added EFFORT-013 to `efforts/README.md` active read list.
- Added EFFORT-013 to `efforts/registry.md`.
- Added EFFORT-013 to the active epic lists in `AGENTS.md` and `CLAUDE.md`.
- Updated INIT-001 with the new epic link and chronology note.

## Impact on other agents

- Read EFFORT-013 before adding pantry ingredient spellcheck/autocorrect, ingredient dictionaries, or pantry label canonicalization.
- Default direction recorded in the epic: conservative pantry-only correction. Fix high-confidence common ingredient typos, preserve rare/stylized/brand/cultural names such as `sushiritto` and `WTR MLN WTR`, and keep equipment entry out of scope.
- EFFORT-013 should be considered alongside EFFORT-009 for manual-entry parser behavior.

## Open items

- No implementation yet.
- Future work should decide correction mechanism, threshold, and user-facing edit/undo pattern before coding.

## Verification

- Docs-only change; no local build/test run required.

## Stack / base status

- Base refreshed: yes
- Current base: `origin/main` at `4ef300cda6778bbd562e918fc5b835a246b65bd8`
- Last Replit-validated at: not yet validated
- Notes: Planning-doc update on the active Phase 2.1 branch. Replit validation remains tied to the current implementation branch head.
