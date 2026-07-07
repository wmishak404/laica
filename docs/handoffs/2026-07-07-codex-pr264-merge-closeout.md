# 2026-07-07 - Codex PR #264 merge closeout

## Summary

PR #264 merged INIT-001 Phase 4's warm Live Cooking surface polish as `fc07c1bf9f737ed41e6cd03878989f066409c975` from validated PR head `a180b3258a82dd81b912ffb9872eb6bb8aeb2e6b`. The merged slice keeps the PR #260 compact cockpit behavior while replacing the stark active-cooking surface with a scoped warm focus-mode shell and tightening the cooking-step prompt for two Wilson-observed step-preview label failures.

## Product / Behavior

- Ready Check, preparing/recovery, active step card, step-preview rail, cue cards, caption box, and the bottom Repeat / Ask a question / Audio command bar now share the scoped `live-cooking-ui` warm surface.
- The warm classes stay under `.live-cooking-ui .live-cooking-*` so computed styles beat shadcn `Card` defaults; matching class names alone are not sufficient visual evidence.
- The cooking-step prompt now asks providers to preserve plural label grammar such as `Prep Leeks` and to prefer final garnish/serve labels such as `Garnish` or `Garnish & Serve` over stale generic `Cook Vegetables`.
- No route contracts, provider response schema, durable cooking-session schema, Finish/History semantics, assistance failure handling, durable navigation, formal INIT-004 eval work, full timer redesign, or Phase 5 cleanup changed.

## Validation

- Local: `npm ci`.
- Local before prompt tightening: `npx vitest run tests/unit/live-cooking-guest-session.test.tsx` passed with 31 tests, and `npm run test:unit` passed.
- Local after prompt tightening: `npx vitest run tests/unit/cooking-steps-prompt.test.ts tests/unit/live-cooking-guest-session.test.tsx` passed with 32 tests.
- Local after prompt tightening: `npm run check`, `npm run build`, and `git diff --check` passed. Build retained existing stale Browserslist, Firebase dynamic/static import, and chunk-size warnings.
- Local visual/computed-style smoke: provider-light Playwright mobile smoke at `390x844` captured `/tmp/laica-live-cooking-ready-warm-polish-clean.png` and `/tmp/laica-live-cooking-active-warm-polish-clean.png`. `/api/auth/session` was stubbed because the decrypted local DB still lacks `anonymous_recipe_usage`, which remains an EFF-017/local-sandbox gap.
- GitHub exact-head checks at `a180b3258a82dd81b912ffb9872eb6bb8aeb2e6b`: `unit`, `e2e_guest_smoke`, dependency audit, and secret scan passed. CodeQL was not surfaced in the final connector check and is not claimed here.
- Wilson's Replit check was a light skim only, not full human regression. Full human regression is deferred to the next production/release-batch validation.

## Updated Sources

- `initiatives/INIT-001-mobile-refresh.md`
- `initiatives/registry.md`
- `product-decisions/features/mobile-refresh/pd-phase-04-cooking.md`

## Next Resume Point

Continue Phase 4 from the merged PR #264 baseline: Ready Check, compact cockpit, warm focus-mode surface, action-forward preview rail, opt-in captions, bottom command bar, screen wake lock, and prompt guidance for plural/final garnish labels are now on `main`. Recommended next slices remain full timer redesign, assistance failure handling / inline guidance behavior, full provider/schema/prompt shape only if eval feedback requires it, and later Phase 5 cleanup semantics.

The separate INIT-004 eval lane has been notified to incorporate the latest prompt expectations for plural labels and final garnish/serve labels; do not fold offline eval work into INIT-001 runtime unless Wilson asks.
