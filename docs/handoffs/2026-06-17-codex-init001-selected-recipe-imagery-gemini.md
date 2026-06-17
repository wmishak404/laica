# INIT-001 Selected Recipe Imagery + Gemini Benchmark

## Summary

PR #192 pivoted the Phase 3.1 recipe imagery UX after Replit testing showed late three-image Ticket Pass hydration felt wrong even when technically all-or-none. Ticket Pass is now a fast, fair text-choice surface with intentional placeholders only. Prep Tray hydrates one selected recipe image as a non-blocking enhancement with a 15-second visible SLA.

The branch also implements Gemini/Nano Banana image generation behind `RECIPE_IMAGE_PROVIDER=gemini` for benchmarking. OpenAI remains the default provider until Replit benchmark evidence supports a change.

## Implementation Notes

- Added `POST /api/recipe-images/selected/resolve` for one structured selected recipe.
- Reused `recipe_image_cache`, strict title/core-ingredient fingerprints, opaque App Storage object keys, image-serving route, terminal failure handling, and generation-start rate-limit semantics.
- MealPlanning strips all recipe `imageUrl`s before Ticket Pass, does not call an image resolver while showing choices, and starts selected-image polling only after `prep-tray`.
- Selected-image polling stops quietly after four attempts spaced five seconds apart, or earlier on unavailable/rejected responses, back, refresh, unmount, or cooking start.
- Gemini provider support uses REST/fetch with `GEMINI_API_KEY`; no SDK dependency was added.
- Gemini defaults are provider-specific: `gemini-3.1-flash-image`, 512 square output, PNG storage. `gemini-2.5-flash-image` is benchmarkable by setting `RECIPE_IMAGE_MODEL`.
- `accuracy_result.timingsMs` now records generation, judge, upload, and total timing for ready/rejected rows.
- Added `npm run benchmark:recipe-images` for Replit benchmark runs.

## Validation So Far

- `npx vitest run tests/unit/recipe-images.test.ts tests/unit/recipe-image-route.test.ts tests/unit/meal-planning.test.tsx` passed locally.
- `npm run test:unit` passed locally.
- `npm run check` passed locally.
- `npm run build` passed locally.
- `git diff --check` passed locally.
- Targeted local Playwright was attempted with `CI=true PORT=5011 PLAYWRIGHT_BASE_URL=http://localhost:5011 npm run env:run -- npx playwright test tests/e2e/cooking-workflow.test.ts --project=chromium`. It failed before the imagery assertions at the shared guest entry/setup gate because the decrypted local DB lacks `anonymous_recipe_usage`; the server repeatedly returned `relation "anonymous_recipe_usage" does not exist`, and the tests timed out waiting for `Start cooking now` / `Get started`. This is not evidence for or against selected-image behavior.

## Replit Next Steps

1. Sync the final PR head into Replit and restart the app.
2. Confirm Ticket Pass shows placeholders only and no `POST /api/recipe-images/selected/resolve` call before opening Prep Tray.
3. Open Prep Tray and confirm one selected image appears if approved within 15 seconds, or the placeholder remains without blocking `Cook this`.
4. Run Gemini benchmark:

```bash
npm run benchmark:recipe-images -- --provider=gemini --model=gemini-3.1-flash-image --output-size=512
```

Optional comparison:

```bash
npm run benchmark:recipe-images -- --provider=gemini --model=gemini-2.5-flash-image --output-size=1024x1024
npm run benchmark:recipe-images -- --provider=openai --model=gpt-image-2 --output-size=1024x1024
```

Record provider, model, output size, selected elapsed time, row `timingsMs`, judge score/reasons, visual accuracy notes, cost estimate, commit SHA, and negative scope in the PR/handoff.

## Negative Scope

- No production provider default switch was made.
- No live Gemini benchmark has been run locally; `GEMINI_API_KEY` is intentionally Replit-only for now.
- The legacy three-image resolver still exists for seeding/benchmark comparison, but the user-visible Ticket Pass no longer uses it.
- Broad image-quality evals remain outside this PR.
