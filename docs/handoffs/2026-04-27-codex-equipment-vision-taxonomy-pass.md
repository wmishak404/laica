# Equipment Vision Taxonomy Pass

**Agent:** codex
**Branch:** codex/equipment-vision-prompt-fix
**Date:** 2026-04-27

## Summary

Applied a finer-grained taxonomy refinement to the equipment scan based on Wilson’s explicit include/exclude rules. This pass focused on removing drinkware/support labels that were still leaking through after the earlier infrastructure cleanup, while preserving accepted storage/serving items.

## Changes

- `server/vision/equipment-filter.ts`
  - Expanded the post-response filter to exclude:
    - `wine glass`
    - `wine bottle`
    - water-filter-family labels (`water filter`, `water filtration dispenser/system`)
    - `utensil set`
    - `utensil holder` / `utensil crock` / `utensil container`
    - `drinking glass`
- `server/prompts/molecules/vision-base.md`
  - Added matching wording that wine bottles, wine glasses, and water-filtration support appliances are out of scope.
  - Clarified that generic utensil-set labels should not be returned.
  - Preserved `mason jars` and `serving trays` as acceptable storage/serving equipment.
- `server/prompts/organisms/equipment-analysis.md`
  - Reinforced the same taxonomy rules in the per-call prompt.
- `server/prompts/composer.ts`
  - Kept the fallback prompt strings aligned with the markdown prompts.
- `tests/unit/equipment-filter.test.ts`
  - Added explicit assertions for the new excluded aliases and preserved allowed labels.
- `tests/unit/equipment-vision-prompts.test.ts`
  - Added prompt assertions for the new drinkware/water-filter/storage wording.
- `epics/006-equipment-vision-exclusions.md`
  - Recorded the product taxonomy decision and the latest live rerun signal.

## Impact on other agents

- Read `epics/006-equipment-vision-exclusions.md` before making further changes to equipment-scan taxonomy.
- The current agreed line is:
  - exclude: `wine glass`, `wine bottle`, water-filter-family labels, generic `utensil set`
  - include: `mason jars`, `serving tray`, `French press`, `carafe`
- The remaining open work is now narrower: organizer/decor edge cases like `magnetic knife rack` and `flower vase`.

## Open items

- Mixed-kitchen live rerun still returned:
  - `magnetic knife rack`
  - `flower vase`
- These are smaller residual taxonomy questions and may justify one more narrow filter pass if product agrees they should be excluded.

## Verification

- `npx vitest run tests/unit/equipment-vision-prompts.test.ts tests/unit/equipment-filter.test.ts`
- `npm run check`
- Live fixture reruns on localhost with dotenvx-backed dev server:
  - `kitchenfar_beckoit.jpeg`
  - `209E6358-D0C9-42D8-8D6D-4C8D35484115_1_105_c.jpeg`
- Verified improvements:
  - `wine bottle` removed from `equipment`
  - water-filter-family labels removed from `equipment`
  - `utensil set`, `utensil holder`, and `drinking glass` removed from `equipment`
