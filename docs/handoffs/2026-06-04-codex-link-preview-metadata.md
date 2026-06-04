# Link preview metadata

**Agent:** codex
**Branch:** codex/link-preview-metadata
**Date:** 2026-06-04
**Initiative:** none
**INIT updated:** n/a

## Summary

Laica's public link preview now presents the product intentionally instead of using a generic AI app shell. The static HTML metadata uses product-focused title/description copy, Open Graph/Twitter tags point to an absolute production image URL, and the public image asset is a dedicated 1200x630 branded preview composed from safe repo assets with Laica's existing landing/setup font pairing.

The favicon/PWA icon family now uses the spatula mark from the `i` in the canonical Laica wordmark so small browser and app surfaces stay brand-specific without introducing a separate icon concept.

## Changes

- `client/index.html`
  - Updates `<title>` and standard meta description.
  - Adds `og:type`, `og:url`, `og:title`, `og:description`, `og:image`, `og:image:width`, `og:image:height`, and `og:image:alt`.
  - Adds Twitter `summary_large_image` tags for title, description, image, and image alt text.
  - Uses the absolute image URL `https://cookwithlaica.com/og/laica-preview.png`.
- `client/public/og/laica-preview.png`
  - Adds a 1200x630 RGB PNG for Open Graph consumers.
  - Uses only safe public/repo visual material: the canonical Laica logo and packaged kitchen/meal imagery from `attached_assets`.
  - Avoids the existing recipe-suggestions screenshot because it includes a personal avatar.
  - Does not include launch-state wording in the thumbnail or metadata; that positioning is reserved for external post copy.
  - Uses the app's existing public-surface typography: `Fraunces` for display copy and `Nunito` for UI/body copy. The render step confirmed `Font status: Fraunces=true Nunito=true`.
- `client/public/icon-192x192.png`, `client/public/icon-512x512.png`
  - Replace the dark neon-whisk app icons with square icons based on the spatula mark from the canonical Laica wordmark `i`.
- `design_guidelines.md`
  - Records the durable favicon/app-icon rule: use the wordmark `i` spatula mark and do not substitute unrelated cooking-tool or chef-hat marks without a future accepted brand decision.

## Impact on other agents

- No runtime app behavior changed.
- If the OG image is revised later, keep it under `/og/laica-preview.png` unless metadata is updated at the same time.
- If the favicon/PWA icon is revised later, keep it based on the canonical wordmark `i` spatula mark unless the brand mark changes through an accepted design decision.
- Preserve the app typography source of truth when revising the image: `client/src/index.css` imports `Fraunces`, `Merriweather`, `Nunito`, `Patrick Hand`, and `Source Sans Pro`; the landing/setup preview treatment uses `Fraunces` display plus `Nunito` body/UI.

## Open items

- After merge and deployment, verify cache behavior in LinkedIn Post Inspector.
- After merge and deployment, verify WhatsApp and iMessage previews, using a cache-busting URL if either client shows a stale preview.
- Replit validation is not required for this static metadata/image-only change.

## Verification

Automation is evidence for the static metadata/image/icon claim, not proof that third-party preview caches have refreshed.

- `npm ci` passed on branch `codex/link-preview-metadata`.
- `git diff --check` passed.
- `npm run check` passed (`tsc` and `eslint "client/src/**/*.{ts,tsx}"`).
- `npm run build` passed. Vite emitted the existing Browserslist age warning, Firebase dynamic/static import chunk warning, and chunk-size warning.
- Built HTML inspection passed:
  - `dist/public/index.html` contains `og:image` and `twitter:image` with `https://cookwithlaica.com/og/laica-preview.png`.
  - `dist/public/index.html` contains the requested title and description.
- Built asset inspection passed:
  - `dist/public/og/laica-preview.png: PNG image data, 1200 x 630, 8-bit/color RGB, non-interlaced`.
  - `client/public/icon-192x192.png: PNG image data, 192 x 192, 8-bit/color RGBA, non-interlaced`.
  - `client/public/icon-512x512.png: PNG image data, 512 x 512, 8-bit/color RGBA, non-interlaced`.
- Local dev smoke passed after sandbox escalation:
  - `PORT=3000 npx @dotenvx/dotenvx run -- npm run dev` started Express on port 3000.
  - `curl -I http://127.0.0.1:3000` returned `HTTP/1.1 200 OK`.

## Negative scope

- Did not change React routes, API code, auth, database schema, secrets, or deployment config.
- Did not verify live production preview consumers because the branch has not been merged/deployed.
- Did not update Replit because this is static app-shell metadata and public asset work.
