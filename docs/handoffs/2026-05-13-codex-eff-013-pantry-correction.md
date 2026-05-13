# EFF-013 pantry correction provenance

**Agent:** codex
**Branch:** codex/eff-013-pantry-correction
**Date:** 2026-05-13
**Initiative:** INIT-001
**INIT updated:** no — EFF-013 remains the primary durable home; no Mobile Refresh phase status or resume point changed.

## Summary

EFF-013 now has a narrow product implementation that exercises provenance without adding a new process layer: saved pantry manual entry in setup and Settings corrects only curated high-confidence misspellings, shows a reversible `Corrected some entries` toast, briefly highlights the corrected pantry chips, and leaves kitchen equipment, scans, Slop Bowl temporary entries, and unknown/niche/stylized pantry labels unchanged.

## Changes

- `client/src/lib/entryParsing.ts` adds `correctPantryManualEntries`, a tiny exact-match correction map, protected all-caps/digit-containing entry behavior, and correction metadata. Replit and follow-up review expanded the map with observed high-confidence variants such as `brocoli`, `avcado`, `beens`, `ryce`, `chickin`, plus common-staple typos such as `garilic`, `letuce`, `onoin`, `potatos`, `tomatos`, `mushroms`, `strawbery`, and `bluebery`.
- `client/src/components/cooking/user-profiling.tsx` applies correction only to setup pantry manual entry, shows the generic correction toast, flashes the corrected pantry chips, and adds toast Undo to restore the original just-added batch.
- `client/src/components/cooking/user-settings.tsx` applies the same pantry-only correction, chip highlight, and Undo behavior in returning Settings.
- `client/src/index.css` adds the corrected-chip flash animation without layout shift.
- `tests/unit/entry-parsing.test.ts`, `tests/unit/user-profiling.test.tsx`, and `tests/unit/user-settings-scan-policy.test.tsx` cover curated corrections, preserved niche/stylized labels, duplicate-after-correction behavior, setup/settings toast Undo with chip provenance, and kitchen non-correction.
- `efforts/effort-013-pantry-manual-entry-spell-correction.md` records the accepted v0 mechanism, Replit spot-check refinement, targeted validation class, and product-playground provenance intent.
- `efforts/effort-017-environment-parity-and-ci-confidence.md` records this flow as a future authenticated-smoke candidate without reactivating EFF-017 or weakening Replit validation.

## Impact on other agents

Primary durable home is EFF-013. Future work should keep the correction map deliberately small unless Wilson accepts broader ingredient-correction behavior. If this branch merges, EFF-013 can be resolved only after the post-merge closeout confirms all resolution criteria, Replit validation status, and handoff/PR references from fresh `main`.

EFF-017 should treat this as a later harness candidate: deterministic auth, setup pantry correction, corrected-chip highlight, Settings pantry correction, Undo, kitchen non-correction, save/reload persistence.

## Open items

- Wilson completed targeted Replit validation on `e7ebaf22e6c77f7ac4623f16ec684150915c0487`, before the final common-staple dictionary expansion.
- The validation stayed scoped to Firebase sign-in/authenticated app access, setup pantry correction + Undo, Settings pantry correction + Undo, duplicate-after-correction behavior, kitchen non-correction, save/reload persistence, and corrected-chip provenance.
- Replit validation intentionally did not include AI routes, ElevenLabs, vision upload, schema pushes, or broad regression passes.
- `Last Replit-validated at: not yet validated after latest runtime commit`. Prior targeted validation passed at `e7ebaf22e6c77f7ac4623f16ec684150915c0487`, but the dictionary expansion makes it stale for current branch head.

## Verification

- `npm ci` passed.
- After the Replit spot-check refinement, `npx vitest run tests/unit/entry-parsing.test.ts tests/unit/user-profiling.test.tsx tests/unit/user-settings-scan-policy.test.tsx` passed: 3 files, 27 tests.
- After the Replit spot-check refinement, `npm run check` passed.
- After the Replit spot-check refinement, `npm run build` passed with existing Vite warnings about stale Browserslist data, Firebase dynamic/static import chunking, and large chunk size.
- After the Replit spot-check refinement, `git diff --check` passed.
- Wilson manually validated Replit checklist items 1-7 against `e7ebaf22e6c77f7ac4623f16ec684150915c0487`: branch/SHA confirmation, Firebase sign-in, setup pantry correction + Undo, Settings pantry correction + Undo, duplicate-after-correction behavior, kitchen non-correction, and pantry save/reload persistence.
- After the common-staple dictionary expansion, `npx vitest run tests/unit/entry-parsing.test.ts tests/unit/user-profiling.test.tsx tests/unit/user-settings-scan-policy.test.tsx` passed: 3 files, 27 tests.
- After the common-staple dictionary expansion, `npm run check` passed.
- After the common-staple dictionary expansion, `npm run build` passed with existing Vite warnings about stale Browserslist data, Firebase dynamic/static import chunking, and large chunk size.
- After the common-staple dictionary expansion, `git diff --check` passed.
