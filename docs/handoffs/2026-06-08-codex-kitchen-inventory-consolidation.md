# Kitchen Inventory consolidation

**Agent:** codex  
**Branch:** codex/setup-tools-privacy-copy  
**Date:** 2026-06-08  
**Initiative:** INIT-001  
**INIT updated:** yes

## Summary

This build turns the Profile/Settings inventory model into Kitchen Inventory with Pantry and Tools inside it, while keeping backend contracts unchanged. Pantry stays the warmer food-inventory label; Tools replaces visible Kitchen/equipment wording; the setup flow no longer opens a second camera immediately after Pantry and instead asks whether the optional Tools pass is useful.

## Changes

- `client/src/components/cooking/user-profiling.tsx` adds an optional Tools intro between Pantry and skill setup, keeps Pantry required, changes visible equipment/Kitchen scanner copy to Tools, and makes the inline Tools draft action `Add tools`.
- `client/src/components/cooking/user-settings.tsx` consolidates the former Pantry/Kitchen settings cards into `Kitchen Inventory`, preserves legacy `initialSection="pantry" | "kitchen"` deep links, adds internal Pantry/Tools switching, and keeps persistent save/reset behavior on existing profile fields.
- `shared/scan-policy.ts`, `client/src/lib/visionResult.ts`, and `client/src/pages/app.tsx` align visible labels and menu copy with Pantry/Tools without renaming backend scan types or profile fields.
- `tests/unit/user-profiling.test.tsx` and `tests/unit/user-settings-scan-policy.test.tsx` cover optional Tools setup, Kitchen Inventory deep links, Tools scan limits, manual entry, chip states, and save behavior.
- `product-decisions/features/mobile-refresh/pd-phase-02-2-returning-setup-settings.md` and `initiatives/INIT-001-mobile-refresh.md` record the accepted Pantry/Tools language direction, separate scans, unchanged backend contract, and copy guidance to avoid tracking-language framing.

## Impact on other agents

- Treat `kitchenEquipment` and scan type `kitchen` as implementation contracts only; user-facing copy should say Tools unless the backend/schema name is being discussed.
- `SettingsSection` now accepts `inventory` plus legacy `pantry`/`kitchen`; new UI should prefer `inventory` when linking to the combined settings surface.
- Do not combine Pantry and Tools scans in this branch. The product decision explicitly keeps them separate.
- Use `Add tools` for manual draft additions and `Save tools` for the persistent Settings save action to avoid duplicate-button ambiguity.

## Open items

- Replit/authenticated visual validation is not yet run for this branch.
- Branch base was refreshed on 2026-06-10 after `git fetch origin`: rebased branch head `d919b71`, local `origin/main` `a11ac14`, merge-base `a11ac14`.
- `npm ci` completed earlier in this worktree and reported the existing npm audit state: 4 vulnerabilities, including 1 critical. This branch did not address dependency security.

## Verification

- `npx vitest run tests/unit/user-profiling.test.tsx tests/unit/user-settings-scan-policy.test.tsx` passed before and after the 2026-06-10 rebase.
- `npm run check` passed before and after the 2026-06-10 rebase.
- `npm run build` passed before and after the 2026-06-10 rebase, with existing Vite warnings about stale Browserslist data, Firebase dynamic/static import chunking, and a large JS chunk.
- `git diff --check` passed.
