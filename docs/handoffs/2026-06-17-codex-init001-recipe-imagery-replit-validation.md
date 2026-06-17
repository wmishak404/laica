# INIT-001 Recipe Imagery Replit Validation

**Date:** 2026-06-17  
**Branch:** `codex/init-001-recipe-preview-images`  
**PR:** [#192](https://github.com/wmishak404/laica/pull/192)  
**Initiative:** INIT-001 Phase 3.1  
**Last Replit-validated runtime SHA:** `76b998d`

## Summary

Replit validation for PR #192 is no longer blocked on schema, storage, or provider setup. The branch generated one real three-image recipe set through OpenAI, stored approved objects in Replit App Storage, and confirmed cached all-or-none image loading in Ticket Pass plus selected-image carry-through into Prep Tray.

The live smoke also found a real client timing gap: three-image generation and judging took about 80 seconds, while the original client polling stopped after roughly 10 seconds. The branch now keeps the request count low while widening the quiet polling window, and it hydrates restored Ticket Pass/Prep Tray batches from cache.

## What Changed After Validation

- `client/src/components/cooking/meal-planning.tsx`
  - Keeps `RECIPE_IMAGE_POLL_ATTEMPTS` at `6`.
  - Changes the poll delay to `20_000ms`, giving live generation roughly 100 seconds without increasing resolver request count.
  - Moves image hydration to an effect for active `tickets` / `prep-tray` batches so restored cached recommendations can hydrate after reload/back-forward.
- `tests/unit/meal-planning.test.tsx`
  - Adds coverage for delayed pending-to-ready polling without partial reveal.
  - Adds coverage for restored Ticket Pass recipes hydrating from a ready cache set.
- `initiatives/INIT-001-mobile-refresh.md` and `product-decisions/features/mobile-refresh/pd-phase-03-1-recipe-imagery.md`
  - Record the Replit evidence, timing lesson, and remaining PR-head CI requirement.

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
  - Timing from row creation to generated timestamps: about 27s, 52s, and 80s.
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

## Negative Scope

- A second paid live three-image generation was not run after changing the delay from 15s to 20s; the timing adjustment is based on the measured 80s live-generation evidence plus unit coverage.
- Replit Preview showed its own artifact-crashed wrapper because validation used a manually launched flagged server; the direct `.replit.dev` app was the validated surface.
- Production publish, broad image-accuracy evals, and Gemini/Nano Banana comparison are not covered by this validation.
- Final PR-head CI still needs to pass after the latest pushes before merge readiness.

## Next Steps

1. Let PR #192 CI finish on the latest head.
2. Update the PR description with the Replit evidence above if it is not already present.
3. Decide whether to keep the non-secret Replit image-generation configurations enabled before merging, or turn off `RECIPE_IMAGE_GENERATION_ENABLED` after validation and re-enable deliberately for rollout.
