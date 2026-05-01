# Mobile Refresh Phase 2.1 Upload Limit Fail-Closed

**Agent:** codex
**Branch:** codex/mobile-refresh-phase-2-1-setup-polish
**Date:** 2026-04-30
**Initiative:** INIT-001
**INIT updated:** yes

## Summary

Changed setup photo upload limit behavior from partial processing to fail-closed cancellation.

Wilson's Replit functionality test surfaced the trust issue: if the user selects more than the allowed photo count, processing only the first allowed photos makes it unclear which pantry or kitchen angles were scanned. The accepted behavior is now to cancel the entire oversized batch and ask the user to reselect a smaller set.

## Changes

- `client/src/components/cooking/user-profiling.tsx`
  - Preserves the pantry cap of 8 photos and kitchen cap of 6 photos.
  - Cancels the whole upload batch when the user selects more than the cap.
  - Shows the existing limit-style destructive toast.
  - Does not call image compression or `analyzeImage` for oversized batches.
- `client/src/components/cooking/user-settings.tsx`
  - Applies the same fail-closed upload cap behavior in Settings for pantry and kitchen scans.
  - Stops slicing oversized batches before processing.
- `tests/unit/user-profiling.test.tsx`
  - Adds coverage for 9 pantry photos and 7 kitchen photos.
  - Verifies no vision analysis call is made for either oversized selection.
- `product-decisions/features/mobile-refresh/phase-02-setup.md`
  - Records that over-cap setup uploads cancel the whole batch instead of partially processing.
- `product-decisions/features/mobile-refresh/phase-02-1-setup-polish.md`
  - Adds the Phase 2.1 accepted upload-limit behavior.
- `product-decisions/features/mobile-refresh/cross-phase-ai-privacy.md`
  - Records fail-closed setup and Settings upload caps as a client-side privacy/trust behavior.
- `initiatives/INIT-001-mobile-refresh.md`
  - Updates current status, resume point, and chronology.

## Impact on other agents

- EPIC-005: conforms by adding focused unit coverage for the changed setup behavior and documenting the Replit validation item.
- EPIC-007: scan feedback remains explicit; this change happens before vision analysis for over-cap batches and does not change no-detection handling.
- EPIC-009: no change to comma-separated manual entry.
- EPIC-010: no DB/schema changes.
- EPIC-012: no visual redesign; supports setup trust/clarity within the accepted design.

## Open items

- Pull the latest `codex/mobile-refresh-phase-2-1-setup-polish` branch into Replit after this commit is pushed.
- Validate that selecting 9 pantry photos shows the limit message and adds/scans nothing in setup and Settings.
- Validate that selecting 7 kitchen photos shows the limit message and adds/scans nothing in setup and Settings.
- Continue the existing Phase 2.1 Replit checklist, including accepted visual review, text-only scan rejection, physical product/tool photo acceptance, no-detection feedback, Cooking Skill auto-advance, Dietary Restrictions explicit continuation, and final transition to Planning.
- Record `Last Replit-validated at: <commit-sha>` before merge.

## Verification

- `npm run check`
- `npx vitest run tests/unit/user-profiling.test.tsx`
- `npm run build`

Known build warnings: Browserslist data is stale; Vite still reports the existing large bundle warning and Firebase dynamic/static import chunking warning.

## Stack / base status

- Base refreshed: yes
- Current base: origin/main at `4ef300cda6778bbd562e918fc5b835a246b65bd8`
- Last Replit-validated at: not yet validated
- Notes: Replit must fetch the latest pushed Phase 2.1 branch head before upload-limit validation.
