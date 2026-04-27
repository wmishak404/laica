# Equipment Vision Cleanup Pass

**Agent:** codex
**Branch:** codex/equipment-vision-prompt-fix
**Date:** 2026-04-27

## Summary

Applied one more narrow cleanup pass to the server-side equipment filter to remove `magnetic knife rack` and `flower vase`, then reran the mixed-kitchen fixture on a fresh local server. Both labels dropped out, leaving a much cleaner equipment list focused on directly usable kitchen gear.

## Changes

- `server/vision/equipment-filter.ts`
  - Excluded:
    - `magnetic knife rack`
    - `flower vase`
- `tests/unit/equipment-filter.test.ts`
  - Added coverage for both exclusions.
- `epics/006-equipment-vision-exclusions.md`
  - Recorded the organizer/decor cleanup pass and the latest live rerun signal.

## Impact on other agents

- The equipment scan is now much closer to the intended “usable for cooking” shape.
- Remaining items should be evaluated carefully before adding more exclusions; the obvious room/decor/container noise has been substantially reduced.

## Open items

- The latest mixed-kitchen rerun still returned ingredients like `wine bottle` / `glass of wine` in the `ingredients` array, but not in `equipment`.
- If further refinement is needed, the next work should be driven by fresh fixture evidence rather than broad new prompt text.

## Verification

- `npx vitest run tests/unit/equipment-filter.test.ts`
- `npm run check`
- Live rerun on fresh localhost `:3001` using:
  - `209E6358-D0C9-42D8-8D6D-4C8D35484115_1_105_c.jpeg`
- Final live result no longer included:
  - `magnetic knife rack`
  - `flower vase`
