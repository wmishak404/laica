# EFF-013 pantry correction provenance

**Agent:** codex
**Branch:** codex/eff-013-pantry-correction
**Date:** 2026-05-13
**Initiative:** INIT-001
**INIT updated:** no — EFF-013 remains the primary durable home; no Mobile Refresh phase status or resume point changed.

## Summary

EFF-013 now has a narrow product implementation that exercises provenance without adding a new process layer: saved pantry manual entry in setup and Settings corrects only curated high-confidence misspellings, shows a reversible `Cleaned up spelling` toast with `original -> corrected` provenance, and leaves kitchen equipment, scans, Slop Bowl temporary entries, and unknown/niche/stylized pantry labels unchanged.

## Changes

- `client/src/lib/entryParsing.ts` adds `correctPantryManualEntries`, a tiny exact-match correction map, protected all-caps/digit-containing entry behavior, and correction metadata.
- `client/src/components/cooking/user-profiling.tsx` applies correction only to setup pantry manual entry and adds toast Undo to restore the original just-added batch.
- `client/src/components/cooking/user-settings.tsx` applies the same pantry-only correction and Undo behavior in returning Settings.
- `tests/unit/entry-parsing.test.ts`, `tests/unit/user-profiling.test.tsx`, and `tests/unit/user-settings-scan-policy.test.tsx` cover curated corrections, preserved niche/stylized labels, duplicate-after-correction behavior, setup/settings toast Undo, and kitchen non-correction.
- `efforts/effort-013-pantry-manual-entry-spell-correction.md` records the accepted v0 mechanism, targeted validation class, and product-playground provenance intent.
- `efforts/effort-017-environment-parity-and-ci-confidence.md` records this flow as a future authenticated-smoke candidate without reactivating EFF-017 or weakening Replit validation.

## Impact on other agents

Primary durable home is EFF-013. Future work should keep the correction map deliberately small unless Wilson accepts broader ingredient-correction behavior. If this branch merges, EFF-013 can be resolved only after the post-merge closeout confirms all resolution criteria, Replit validation status, and handoff/PR references from fresh `main`.

EFF-017 should treat this as a later harness candidate: deterministic auth, setup pantry correction, Settings pantry correction, Undo, kitchen non-correction, save/reload persistence.

## Open items

- Replit validation is not yet run. This runtime/client-profile-persistence change should use targeted Replit validation only: Firebase sign-in/authenticated API access and pantry profile DB write/read persistence.
- Replit validation should not include AI routes, ElevenLabs, vision upload, schema pushes, or broad regression passes.
- `Last Replit-validated at: not yet validated`.

## Verification

- `npm ci` passed.
- `npx vitest run tests/unit/entry-parsing.test.ts tests/unit/user-profiling.test.tsx tests/unit/user-settings-scan-policy.test.tsx` passed: 3 files, 27 tests.
- `npm run check` passed.
- `npm run build` passed with existing Vite warnings about stale Browserslist data, Firebase dynamic/static import chunking, and large chunk size.
- `git diff --check` passed.
