# PR #192 Merge Closeout - INIT-001 Recipe Preview Imagery

## Summary

PR #192 (`codex/init-001-recipe-preview-images`) squash-merged into `main` as `efd1f887b0b525ae1ea06dfa487999cdb7672023` on 2026-06-18. It closes the v1 INIT-001 Phase 3.1 recipe imagery runtime: Ticket Pass remains fast and placeholder-only, while Prep Tray hydrates one selected recipe image as a non-blocking enhancement.

## Merged Behavior

- Ticket Pass does not call an image resolver and does not reveal generated images while users compare the three recipe choices.
- Prep Tray calls `POST /api/recipe-images/selected/resolve` for the selected recipe only.
- The selected image pending state uses the subtle placeholder spinner; cooking remains available immediately.
- Returning from Prep Tray to Ticket Pass keeps all choices placeholder-only, avoiding visual bias or one-card image bleed-back.
- Server-side image caching, strict recipe fingerprints, App Storage object keys, and image approval metadata are merged.
- Gemini/Nano Banana provider support is available behind `RECIPE_IMAGE_PROVIDER=gemini`; OpenAI remains the default provider.

## Validation Carried Forward

- GitHub CI passed on final PR head `a1a969039c5a6d5b775e890dcac6659b5a0efde5`: unit, `e2e_guest_smoke`, npm audit, TruffleHog PR scan, CodeQL, and analysis checks.
- Replit schema/App Storage/live OpenAI cache validation passed earlier at runtime head `76b998d`.
- Replit selected-image smoke passed at `9e62f0f`: selected image appeared in Prep Tray, Ticket Pass stayed placeholder-only, and returning to Ticket Pass did not surface the generated image.
- Negative scope remains: no production publish validation, no broad recipe-image accuracy evals, and no live Gemini benchmark evidence.

## Follow-Ups

- Continue Gemini/OpenAI provider comparison under INIT-001 Phase 3.1 before any provider-default change. Start from `initiatives/INIT-001-mobile-refresh.md`, `product-decisions/features/mobile-refresh/pd-phase-03-1-recipe-imagery.md`, and `docs/handoffs/2026-06-17-codex-init001-selected-recipe-imagery-gemini.md`.
- EFF-027 owns active workflow reload resilience after unexpected Replit/Vite/app remounts.
- Future Phase 3.1 UX polish may evaluate fuller Prep Tray image-area use and short rotating pending copy, but those were intentionally kept out of PR #192.

## Docs Closeout

This handoff accompanies a docs-only closeout branch after the merge. The closeout updates INIT-001, the Phase 3.1 imagery record, and the INIT registry from open/in-progress PR state to merged-state resume guidance.
