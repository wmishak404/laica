# Phase 2.1 Test Results Follow-up

**Agent:** codex
**Branch:** `codex/mobile-refresh-phase-2-1-setup-polish`
**Date:** 2026-04-30
**Initiative:** INIT-001
**INIT updated:** yes

## Summary

Wilson reported the latest Phase 2.1 Replit test pass as passing except for untestable 8a/8c, a shared Pantry/Kitchen scan-limit meter blocking equipment validation, period-separated manual entry being treated as one item, missing visible comma guidance on Pantry manual entry, and Test 21 being blocked by the scan limit. This pass implements the gating follow-ups and narrows the next Replit test plan.

## Changes

- `server/rate-limit.ts`
  - Added Pantry/Kitchen-aware vision rate-limit keys using `X-Laica-Scan-Type`.
  - Vision user short/day limits and IP short limits now include the scan context.
- `client/src/lib/openai.ts`
  - Added optional `scanType` to `analyzeImage` options and sends it as `X-Laica-Scan-Type`.
- `client/src/components/cooking/user-profiling.tsx`
  - Sends Pantry/Kitchen scan context for setup captures/uploads.
  - Requires at least 3 pantry ingredients before continuing from Pantry.
  - Shows `There's gotta be more in your pantry! Please have at least 3 ingredients to proceed.` when users attempt to continue with fewer.
  - Adds a visible Pantry manual-entry note: `Separate pantry items with commas.`
  - Rotates Pantry manual placeholders across varied staple examples.
- `client/src/components/cooking/user-settings.tsx`
  - Sends Pantry/Kitchen scan context for Settings scans too, so the rate-limit behavior is consistent after setup.
- `client/src/lib/entryParsing.ts`
  - Treats periods as comma-like separators for manual-entry typo recovery while leaving other punctuation/operators alone.
- Tests
  - Added rate-limit key coverage.
  - Extended manual-entry parser and setup tests for periods, missing comma spaces, scan context, and 3-ingredient Pantry guard.
- Docs
  - Updated INIT-001, Phase 2.1 setup polish, AI privacy/abuse notes, EPIC-005, and EPIC-009.

## Impact on other agents

- Replit should fetch the latest branch head and restart before retesting so old in-memory rate-limit state does not confuse the result.
- Recommended reduced next Replit test plan:
  - Test 16 only around changed manual-entry behavior: comma without spaces, periods as separators, visible comma note, at least-3 pantry guard, and 3+ ingredients proceeding.
  - Test 20: hit the Pantry scan-limit path, then confirm Kitchen/equipment scans are not blocked by the Pantry meter.
  - Test 21: retry the physical equipment-photo acceptance test with `equipment2.png` or another clear tool photo.
  - Light spot-check upload caps and text-only rejection only because they share the scan/upload path.
  - Do not repeat visually accepted setup screens, Cooking Skill auto-advance, Dietary explicit continuation, or header/menu checks unless a regression appears.
- Non-gating follow-up: toast left/up swipe dismissal is deferred as a shared toast primitive follow-up. It should not block Phase 2.1.
- Epic interactions:
  - EPIC-005: adds evidence for reduced retest scope after a documented partial pass.
  - EPIC-009: expands the shared manual-entry parser with period-as-comma typo recovery.
  - EPIC-010: conforms; no DB schema changes.
  - EPIC-012: conforms; no visual direction change beyond setup-scoped manual note/placeholder polish.

## Open items

- Replit validation is still required at the latest branch head.
- Record `Last Replit-validated at: <commit-sha>` after validation passes.
- If the toast swipe-direction request becomes important, handle it in a separate shared UI primitive pass rather than inside Phase 2.1.

## Verification

- `npx vitest run tests/unit/entry-parsing.test.ts tests/unit/rate-limit.test.ts tests/unit/native-camera.test.tsx tests/unit/user-profiling.test.tsx tests/unit/vision-result.test.ts tests/unit/vision-analysis-result.test.ts tests/unit/equipment-vision-prompts.test.ts` — passed.
- `npm run check` — passed.
- `npm run build` — passed.
- Replit validation — not yet validated.

## Stack / base status

- Base refreshed: yes
- Current base: `origin/main` at `4ef300cda6778bbd562e918fc5b835a246b65bd8`
- Last Replit-validated at: not yet validated
- Notes: Phase 2.1 started from fresh `origin/main` after Phase 2 and docs closeout merged. Any commit after Replit validation makes validation stale and requires a fresh pass.
