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
  - Adds `og:type`, `og:url`, `og:title`, `og:description`, `og:image`, `og:image:secure_url`, `og:image:type`, `og:image:width`, `og:image:height`, and `og:image:alt`.
  - Adds Twitter `summary_large_image` tags for title, description, image, and image alt text.
  - Uses the absolute image URL `https://cookwithlaica.com/og/laica-preview.png`.
  - Uses cache-busted favicon and manifest URLs so browsers are less likely to retain the previous tab icon.
- `client/src/main.tsx`
  - Aligns the runtime browser title and meta description with the static app-shell metadata.
  - Updates the existing static description tag instead of appending a second conflicting description tag after React starts.
- `server/vite.ts`
  - Rewrites `og:url`, `og:image`, `og:image:secure_url`, and `twitter:image` to the current request origin in development.
  - Keeps production/custom-domain requests canonicalized to `https://cookwithlaica.com`, while allowing Replit dev links to point preview crawlers at the Replit-served PNG before production deploy.
- `client/public/og/laica-preview.png`
  - Adds a 1200x630 RGB PNG for Open Graph consumers.
  - Uses only safe public/repo visual material: the canonical Laica logo and packaged kitchen/meal imagery from `attached_assets`.
  - Avoids the existing recipe-suggestions screenshot because it includes a personal avatar.
  - Does not include launch-state wording in the thumbnail or metadata; that positioning is reserved for external post copy.
  - Uses the app's existing public-surface typography: `Fraunces` for display copy and `Nunito` for UI/body copy. The render step confirmed `Font status: Fraunces=true Nunito=true`.
- `client/public/icon-192x192.png`, `client/public/icon-512x512.png`
  - Replace the dark neon-whisk app icons with square icons based on the spatula mark from the canonical Laica wordmark `i`.
- `client/public/favicon.ico`, `client/public/favicon-16x16.png`, `client/public/favicon-32x32.png`, `client/public/apple-touch-icon.png`
  - Add conventional browser and touch-icon sizes derived from the same spatula mark so Chrome and other consumers do not have to infer a tab favicon from PWA-sized icons.
- `client/public/manifest.json`
  - Aligns the public manifest name/description with the app-shell metadata instead of the older generic AI assistant label.
  - Adds 16px/32px manifest icons and cache-busts the icon source URLs.
- `design_guidelines.md`
  - Records the durable favicon/app-icon rule: use the wordmark `i` spatula mark and do not substitute unrelated cooking-tool or chef-hat marks without a future accepted brand decision.

## Impact on other agents

- No runtime app behavior changed.
- If the OG image is revised later, keep it under `/og/laica-preview.png` unless metadata is updated at the same time.
- If the favicon/PWA icon is revised later, keep it based on the canonical wordmark `i` spatula mark unless the brand mark changes through an accepted design decision.
- Preserve the app typography source of truth when revising the image: `client/src/index.css` imports `Fraunces`, `Merriweather`, `Nunito`, `Patrick Hand`, and `Source Sans Pro`; the landing/setup preview treatment uses `Fraunces` display plus `Nunito` body/UI.

## Open items

- After merge and deployment, verify cache behavior in LinkedIn Post Inspector.
- After merge and deployment, verify WhatsApp and iMessage previews, using a cache-busting URL if either client shows a stale preview. Replit dev URLs now rewrite `og:image` to the Replit origin, but LinkedIn/WhatsApp may still apply their own cache or crawler policy; production remains the final source of truth.
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
- Development preview-origin smoke passed:
  - `PORT=3000 LAICA_DEV_ALLOWED_HOSTS=preview.example.test npx @dotenvx/dotenvx run -- npm run dev` served the app.
  - `curl -H 'Host: preview.example.test' -H 'X-Forwarded-Proto: https' http://127.0.0.1:3000/` returned `og:url`, `og:image`, `og:image:secure_url`, and `twitter:image` with the `https://preview.example.test` origin.
- Built asset inspection passed:
  - `dist/public/og/laica-preview.png: PNG image data, 1200 x 630, 8-bit/color RGB, non-interlaced`.
  - `client/public/favicon.ico: MS Windows icon resource - 2 icons, 16x16 and 32x32 PNG image data`.
  - `client/public/favicon-16x16.png: PNG image data, 16 x 16, 8-bit/color RGBA, non-interlaced`.
  - `client/public/favicon-32x32.png: PNG image data, 32 x 32, 8-bit/color RGBA, non-interlaced`.
  - `client/public/apple-touch-icon.png: PNG image data, 180 x 180, 8-bit/color RGBA, non-interlaced`.
  - `client/public/icon-192x192.png: PNG image data, 192 x 192, 8-bit/color RGBA, non-interlaced`.
  - `client/public/icon-512x512.png: PNG image data, 512 x 512, 8-bit/color RGBA, non-interlaced`.
- Local dev smoke passed after sandbox escalation:
  - `PORT=3000 npx @dotenvx/dotenvx run -- npm run dev` started Express on port 3000.
  - `curl -I http://127.0.0.1:3000` returned `HTTP/1.1 200 OK`.

## Negative scope

- Did not change React routes, API code, auth, database schema, secrets, or deployment config.
- Did not verify live production preview consumers because the branch has not been merged/deployed.
- Did not update Replit because this is static app-shell metadata and public asset work.
