# Phase 2.1 Test 19 Placeholder Rotation Fix

**Agent:** codex
**Branch:** `codex/mobile-refresh-phase-2-1-setup-polish`
**Date:** 2026-04-30
**Initiative:** INIT-001
**INIT updated:** yes

## Summary

Wilson found that Test 19's Pantry manual placeholder stayed on `parmesan, sumac, chili crisp` across refresh and re-login. The prior implementation used random selection on setup mount, which could repeat and was not a true rotation.

## Changes

- `client/src/components/cooking/user-profiling.tsx`
  - Replaced random Pantry placeholder choice with deterministic cycling through the placeholder list.
  - Stores the last placeholder index in local browser storage.
  - Keeps the placeholder stable during the current setup flow.
  - Falls back to the first placeholder if browser storage is unavailable.
- `tests/unit/user-profiling.test.tsx`
  - Added coverage that the placeholder advances across setup mounts and remains stable while manual entry is toggled in the same mount.
- Docs
  - Updated INIT-001 and the Phase 2.1 setup polish note with Test 19 behavior and reduced retest guidance.

## Impact on other agents

- Re-test Test 19 by refreshing/remounting setup and confirming the Pantry manual placeholder advances to the next example.
- Do not expect the placeholder to change while the user stays in the same setup flow.
- If Replit browser storage already has a previous placeholder index, the first visible value may not be the first list entry; the important behavior is that it advances on the next mount/refresh.

## Open items

- Replit validation remains required at the latest branch head.

## Verification

- `npx vitest run tests/unit/user-profiling.test.tsx` — passed.
- `npm run check` — passed.
- `npm run build` — passed.

## Stack / base status

- Base refreshed: yes
- Current base: `origin/main` at `4ef300cda6778bbd562e918fc5b835a246b65bd8`
- Last Replit-validated at: not yet validated
- Notes: Any commit after Replit validation makes validation stale and requires a fresh pass.
