# INIT-001 Recipe Imagery Replit Validation

**Date:** 2026-06-17  
**Branch:** `codex/init-001-recipe-preview-images`  
**PR:** [#192](https://github.com/wmishak404/laica/pull/192)  
**Initiative:** INIT-001 Phase 3.1  
**Last Replit-validated runtime SHA:** `76b998d`

## Summary

Replit validation for PR #192 is no longer blocked on schema, storage, or provider setup. The branch generated one real three-image recipe set through OpenAI, stored approved objects in Replit App Storage, and confirmed cached all-or-none image loading in Ticket Pass plus selected-image carry-through into Prep Tray.

The live smoke also found a real client timing gap: the original sequential PNG path took about 80 seconds for the slowest approved image, and Wilson's later Refresh Suggestions check showed that late image pop-in feels wrong even when the resolver is technically working. The branch now parallelizes the three image jobs, defaults runtime output to compressed JPEG, keeps restored/fresh background hydration bounded, gates Refresh replacement so the old image-backed tickets remain visible while the new set is prepared, and charges the small recipe-image abuse budget only when generation is about to start or restart rather than on every pending poll.

2026-06-18 update: the product direction has since pivoted again for the user-visible runtime. Ticket Pass is placeholder-only and no longer hydrates generated images, while Prep Tray resolves one selected recipe image. Wilson's Replit smoke at PR head `9e62f0f` confirmed that selected-image behavior: the selected resolver was enabled, Prep Tray showed the pending spinner and then the selected image, returning to Ticket Pass kept all choices placeholder-only, and session restore recovered the same suggestions after a separate main-menu reset/remount. The three-image validation below should be treated as historical schema/storage/provider/cache evidence, not the current Ticket Pass UX. EFF-027 owns the separate high-priority active-flow reload resilience follow-up.

## What Changed After Validation

- `client/src/components/cooking/meal-planning.tsx`
  - Keeps `RECIPE_IMAGE_POLL_ATTEMPTS` at `6`.
  - Uses a `10_000ms` background poll delay for restored/fresh batches, preserving the six-request cap while checking sooner.
  - Gates Refresh Suggestions replacement: current image-backed tickets stay visible under the existing loading state until the replacement set has all three approved images, or the refresh deliberately falls back without late pop-in.
  - Moves image hydration to an effect for active `tickets` / `prep-tray` batches so restored cached recommendations can hydrate after reload/back-forward.
- `server/recipe-images.ts`
  - Generates and judges the three independent recipe-image descriptors in parallel instead of sequentially.
  - Defaults runtime output to `jpeg` with compression `70`; cache keys include output format/compression so old PNG rows do not collide.
  - Distinguishes status polls from generation starts so repeated `pending` resolver calls do not burn the same hourly user generation limit.
- `server/routes.ts` and `server/rate-limit.ts`
  - Move recipe-image IP/user hour limit consumption from route middleware to the resolver's generation-start point. Global API limits still cover request spam.
- `tests/unit/meal-planning.test.tsx`
  - Adds coverage for delayed pending-to-ready polling without partial reveal.
  - Adds coverage for restored Ticket Pass recipes hydrating from a ready cache set.
  - Adds coverage that Refresh keeps the previous image-backed tickets visible until the new image set is ready.
- `tests/unit/recipe-image-route.test.ts`
  - Adds coverage that pending polls are not charged against the generation limit, while repeated generation starts still rate-limit per user.
- `initiatives/INIT-001-mobile-refresh.md` and `product-decisions/features/mobile-refresh/pd-phase-03-1-recipe-imagery.md`
  - Record the Replit evidence, timing lesson, refresh-latency follow-up, and remaining PR-head CI/Replit smoke requirement.

## Replit Evidence

- Replit DB schema:
  - `npm run db:push -- --force` applied `recipe_image_cache`.
  - `npm run db:health` passed.
- Replit App Storage:
  - Upload/download/delete smoke passed using the configured bucket.
- Runtime flags:
  - Added non-secret Replit Configurations for `RECIPE_IMAGE_GENERATION_ENABLED`, provider, model, quality, output size, and style version.
  - Validation used a manually launched flagged server because the default Replit workflow did not include the image flags.
- Live image set:
  - Provider/model: OpenAI `gpt-image-2`
  - Quality/size/style: `low`, `1024x1024`, `phase-3-1-v1`
  - Recipes: `Hearty Leek, Beef & Spinach Rice Bowl`, `Curry Braised Tofu & Vegetables`, `Kimchi & Dashi Hotpot / Kimchi Nabe`
  - Cache rows: all `ready`, all had image URLs/object keys, no failure reasons.
  - Judge scores: `0.9`, `0.85`, `0.9`.
  - Timing from row creation to generated timestamps: about 27s, 52s, and 80s on the original sequential PNG path.
- UI:
  - At runtime SHA `76b998d`, cached Ticket Pass showed all three images together.
  - Prep Tray loaded the selected recipe image from the same cache URL.
  - Visual accuracy looked acceptable for the smoke: beef/spinach/rice bowl, tofu/vegetable curry-style bowl, and kimchi/dashi hotpot-style bowl.

## Validation Commands

Local after the polling/restored-cache fix:

```bash
npx vitest run tests/unit/meal-planning.test.tsx
npm run check
npm run build
```

All passed.

Local after the refresh-latency follow-up:

```bash
npx vitest run tests/unit/meal-planning.test.tsx tests/unit/recipe-images.test.ts
npx vitest run tests/unit/recipe-image-route.test.ts tests/unit/recipe-images.test.ts tests/unit/meal-planning.test.tsx
npm run check
npm run build
npm run test:unit
```

Passed. The full unit suite covered 42 files / 280 tests.

## Negative Scope

- A second paid live three-image generation has not been rerun after changing generation to parallel compressed JPEG output and adding Refresh gating because the user-visible runtime no longer uses three-image Ticket Pass hydration. Keep the old three-image resolver for cache seeding and benchmark comparison, not the PR #192 decision moment.
- Replit Preview showed its own artifact-crashed wrapper because validation used a manually launched flagged server; the direct `.replit.dev` app was the validated surface.
- Production publish, broad image-accuracy evals, and Gemini/Nano Banana comparison are not covered by this validation.
- Final PR-head CI still needs to pass after the latest pushes before merge readiness.
- The separate reset/remount to the main menu observed during the 2026-06-18 selected-image smoke remains outside this handoff's image-pipeline scope unless it becomes imagery-specific; active-flow restoration is filed as high-priority EFF-027.

## Next Steps

1. Push the latest head and let PR #192 CI finish.
2. Update the PR description with the 2026-06-18 selected-image evidence at `9e62f0f`, while keeping the original `76b998d` schema/storage/provider smoke as historical evidence.
3. Decide whether to keep the non-secret Replit image-generation configurations enabled before merging, or turn off `RECIPE_IMAGE_GENERATION_ENABLED` after validation and re-enable deliberately for rollout.
