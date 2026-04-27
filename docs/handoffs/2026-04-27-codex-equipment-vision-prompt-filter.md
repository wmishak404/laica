# Equipment Vision Prompt And Infrastructure Filter

**Agent:** codex
**Branch:** codex/equipment-vision-prompt-fix
**Date:** 2026-04-27

## Summary

Implemented the first production pass for EPIC-006 by tightening the equipment-vision prompts, documenting the local dotenvx worktree setup, and adding a narrow server-side filter for fixed kitchen infrastructure labels that continued to leak through live vision results.

This pass keeps `French press` and `carafe` in-bounds for `kitchenEquipment`, while excluding fixed infrastructure such as `range hood`, `vent hood`, `sink`, and `faucet`.

## Changes

- `server/prompts/molecules/vision-base.md`
  - Reworked the base vision rules around object function instead of room identity.
  - Added explicit exclusions for non-kitchen context, room infrastructure, plumbing fixtures, cleaning items, and speculative hybrid labels.
  - Explicitly preserved beverage-prep tools such as French presses and carafes.
- `server/prompts/organisms/equipment-analysis.md`
  - Reinforced the same object-function rules in the per-call prompt.
  - Added organizer guidance to prefer visible tools over holders/blocks where possible.
- `server/prompts/composer.ts`
  - Mirrored the markdown prompt changes into fallback strings so runtime and fallback behavior stay aligned.
- `server/vision/equipment-filter.ts`
  - Added a narrow post-response filter for clearly out-of-scope infrastructure labels:
    - sink / faucet / sprayer / garbage disposal
    - range hood / vent hood / exhaust hood
    - soap dispenser / towel bar / towel rack
- `server/openai.ts`
  - Applied the equipment filter to `result.equipment` before returning the vision response.
- `tests/unit/equipment-vision-prompts.test.ts`
  - Added guardrail assertions for the tightened prompt wording.
- `tests/unit/equipment-filter.test.ts`
  - Added direct coverage for the infrastructure filter.
- `epics/006-equipment-vision-exclusions.md`
  - Moved the epic to `In Progress`.
  - Recorded fixture-set provenance, live validation signal, and the product decision separating `equipment` from kitchen infrastructure/context.
- `epics/README.md`
  - Added EPIC-006 to the active read list.
- `epics/registry.md`
  - Updated EPIC-006 from `Deferred` to `In Progress`.
- `AGENTS.md`
  - Documented the required `.env.keys` symlink step for worktrees.
- `CLAUDE.md`
  - Mirrored the same worktree `.env.keys` guidance.

## Impact on other agents

- Read `epics/006-equipment-vision-exclusions.md` before continuing any work on `/api/vision/analyze` or the equipment prompt stack.
- The current product taxonomy is:
  - `kitchenEquipment` = usable cooking / prep / serving gear
  - fixed kitchen infrastructure like `range hood` and `sink` = out of scope for this field
- Future product work may introduce a separate kitchen-context or kitchen-capabilities surface for ventilation and similar environmental signals, but that is not part of this implementation.
- The local worktree now needs `.env.keys` linked from `/Users/wilsonishak-macbookpro/src/laica/.env.keys` for dotenvx-backed local verification.

## Open items

- Live fixture testing still shows some residual category noise in mixed kitchens:
  - `wine glass` / `wine bottle` sometimes land in `equipment`
  - some storage/serving objects such as `mason jars`, `serving tray`, or `serving bowl` may still appear depending on angle
- Decide whether to:
  - keep these as acceptable food-serving/storage equipment,
  - tighten the prompt/filter further for casual drinkware,
  - or split future scan output into a richer taxonomy.
- Replit-side validation is still needed before merge for deployment-bound confidence.

## Verification

- Local checks:
  - `npm ci`
  - `npx vitest run tests/unit/equipment-vision-prompts.test.ts tests/unit/equipment-filter.test.ts`
  - `npm run check`
  - `npm run build`
- Localhost validation:
  - started dev server with `PORT=3000 npx @dotenvx/dotenvx run -- npm run dev`
  - confirmed `http://127.0.0.1:3000` returned `200 OK`
- Live fixture signal after prompt + filter pass:
  - `suitcases.jpeg` -> empty equipment
  - living-room negatives -> empty equipment
  - `209E6358...jpeg` no longer returned `range hood`, `vent hood`, `sink`, or `faucet`
  - `kitchenfar_beckoit.jpeg` no longer returned entryway clutter such as coat/shoe/luggage noise

