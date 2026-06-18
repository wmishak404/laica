# INIT-001 Selected Recipe Imagery + Gemini Benchmark

## Summary

PR #192 pivoted the Phase 3.1 recipe imagery UX after Replit testing showed late three-image Ticket Pass hydration felt wrong even when technically all-or-none. Ticket Pass is now a fast, fair text-choice surface with intentional placeholders only. Prep Tray hydrates one selected recipe image as a non-blocking enhancement and shows a subtle spinner in the placeholder while the preview is still being prepared.

The branch also implements Gemini/Nano Banana image generation behind `RECIPE_IMAGE_PROVIDER=gemini` for benchmarking. OpenAI remains the default provider until Replit benchmark evidence supports a change.

## Implementation Notes

- Added `POST /api/recipe-images/selected/resolve` for one structured selected recipe.
- Reused `recipe_image_cache`, strict title/core-ingredient fingerprints, opaque App Storage object keys, image-serving route, terminal failure handling, and generation-start rate-limit semantics.
- MealPlanning strips all recipe `imageUrl`s before Ticket Pass, does not call an image resolver while showing choices, and starts selected-image polling only after `prep-tray`.
- Selected-image polling continues while Prep Tray is visible and the server reports `pending`, then stops on ready, unavailable/rejected responses, back, refresh, unmount, or cooking start.
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
- Wilson's 2026-06-18 Replit smoke at `9e62f0f` passed the selected-image behavior: non-secret Replit Configurations loaded, the selected resolver was enabled, Prep Tray showed the subtle pending spinner while polling, the selected image appeared in Prep Tray, returning to Ticket Pass kept all choices placeholder-only, and resuming Chef It Up after a separate main-menu reset restored the same recipe suggestions without showing the generated image in Ticket Pass.

## Replit Status / Next Steps

The selected-image smoke is complete for PR #192 at `9e62f0f`. Re-run Replit only if runtime files change after that SHA or if the separate reset/remount behavior starts reproducing as an imagery-specific blocker. High-priority EFF-027 now owns the broader active-flow reload resilience follow-up.

Gemini remains a deferred provider benchmark, not a merge blocker while OpenAI remains the runtime default. When resuming provider comparison, run:

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
- A separate Replit/app reset-remount to the main menu was observed during selected-image validation; session restore recovered the same suggestions and imagery behavior. Root-cause analysis and direct active-flow restoration are filed as high-priority EFF-027 unless the behavior becomes image-specific.
