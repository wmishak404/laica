# Ticket Pass Illustration Rollback

**Agent:** codex
**Branch:** `codex/mobile-refresh-phase-3-1-ticket-prep-polish`
**Date:** 2026-05-15
**Initiative:** INIT-001
**INIT updated:** yes
**Phase record updated:** yes
**Supersedes / corrects:** `docs/handoffs/2026-05-15-codex-ticket-pass-rework-implementation.md`

## Summary

Wilson rejected the same-day Ticket Pass illustration/layout experiment in Replit. The mock bowl/noodle/skillet placeholders and aggressive compact-strip layout made the screen worse: compact tickets collided, imagery dominated the content, and the formatting regressed below the old stable baseline.

Codex backed those experiments out on the same PR branch. Ticket Pass and Prep Tray now return to the stable old utensil-placeholder slot plus compact-row formatting while preserving the accepted selected-in-place behavior.

## What changed in this correction

- Removed the mock-placeholder illustration system from `client/src/components/cooking/meal-planning.tsx`.
- Restored the simpler image-slot treatment:
  - utensil placeholder when no `imageUrl`
  - normal image slot when `imageUrl` exists
- Restored the previous compact ticket row structure and safer Prep Tray shell in `client/src/index.css`.
- Simplified the focused test additions in `tests/unit/meal-planning.test.tsx`:
  - kept selection-order and display-only title split coverage
  - replaced deterministic placeholder-art assertions with a simple stable-slot assertion

## Validation

Re-run locally after the rollback:

- `npx vitest run tests/unit/meal-planning.test.tsx`
- `npm run check`
- `npm run build`
- `git diff --check`

Still required:

- fresh authenticated Replit/manual review on the corrected head

## Current branch status

- PR: [#78](https://github.com/wmishak404/laica/pull/78)
- Status: Draft only
- Merge readiness: no

## Next step

The next Ticket Pass attempt should be layout-only and much narrower:

- preserve the stable old placeholder slot
- preserve compact-row readability
- preserve selected-in-place ordering
- improve hierarchy/object language without reintroducing fake imagery or broken compact formatting
