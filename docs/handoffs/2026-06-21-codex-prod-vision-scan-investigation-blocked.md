# Production vision scan 500 investigation

**Agent:** codex
**Branch:** codex/prod-vision-scan-investigation
**Date:** 2026-06-21
**Initiative:** none
**INIT updated:** n/a

## Summary

Wilson reported that production failed to recognize an oyster photo and returned `POST https://cookwithlaica.com/api/vision/analyze 500`, while Replit dev recognized the same image as oysters, garlic butter, and herbs. Local/public evidence points away from client-side food recognition and away from access-control denial. The production request reached the server and failed inside or after the vision analysis route, most likely at the OpenAI/provider/config boundary. Wilson then identified the likely operational cause: the OpenAI API key had been rotated after a prior shell exposure during image-generation work, but production Deployment secrets were not updated with the replacement key.

## Changes

- `docs/handoffs/2026-06-21-codex-prod-vision-scan-investigation-blocked.md`
  - Records the production/development discrepancy, public prod artifact evidence, local source analysis, and the smallest Replit-side checks needed to confirm root cause.

No app code was changed in this investigation pass.

## Evidence

Observed from Wilson screenshots:

- Production browser console showed `POST https://cookwithlaica.com/api/vision/analyze 500 (Internal Server Error)` and client `ApiRequestError: 500: Failed to analyze image`.
- Replit dev UI successfully added `oysters`, `garlic butter`, and `herbs` from the same oyster photo.

Public production fetches run locally on 2026-06-21:

- `curl -I https://cookwithlaica.com` returned `200` and served `/assets/index-C-jtX79O.js`.
- The production HTML and JS asset both had `last-modified: Sat, 06 Jun 2026 05:45:45 GMT`.
- The nearest first-parent `origin/main` commit before that timestamp is `ba924d6` (`Allow Google auth helper script in production CSP (#146)`, committed 2026-06-05 22:36 PDT). Current local `origin/main`/HEAD for this investigation was `762488e` from 2026-06-19.
- `curl -i -X POST https://cookwithlaica.com/api/vision/analyze -H 'Content-Type: application/json' --data '{"image":"not-image"}'` without auth returned `401 {"message":"Unauthorized"}`, proving unauthenticated access is rejected as an access-control response, not as the observed `500`.
- The production JS bundle contains the client paths for `X-Firebase-AppCheck`, `X-Laica-Scan-Type`, `TEXT_ONLY_DOCUMENT`, and `/api/vision/analyze`, so the deployed client has the expected request plumbing for this era.

Wilson HAR attachment received after the first pass:

- Entry 0: `POST https://cookwithlaica.com/api/vision/analyze` started `2026-06-21T06:50:40.592Z`, body size `157143`, `x-firebase-appcheck` present, `x-laica-scan-type: pantry`, status `500`, response content length `35`, `x-ratelimit-limit: 40`, `x-ratelimit-remaining: 37`, `x-cloud-trace-context: a5ff347c1d942ac9d975ceca13a915c3;o=1`.
- Entry 1: `POST https://cookwithlaica.com/api/vision/analyze` started `2026-06-21T06:53:57.624Z`, body size `220899`, `x-firebase-appcheck` present, `x-laica-scan-type: pantry`, status `500`, response content length `35`, `x-ratelimit-limit: 40`, `x-ratelimit-remaining: 39`, `x-cloud-trace-context: bcb4366d7854cbc5758f8a0e3dca729a;o=1`.
- The HAR export did not include an `Authorization` request header. Do not treat that absence alone as proof the browser omitted auth: the response was `500`, while a local unauthenticated production probe returned `401`, so Chrome/WebInspector may have omitted or redacted the auth header from the pasted export.
- The two body sizes are far below the route's JSON/parser and decoded-image limits. Rate-limit headers show the vision quota path allowed the requests and left quota remaining.
- Wilson follow-up on 2026-06-21: the OpenAI API key had changed after a key-exposure event during image-generation enhancement work. Future similar events must include an explicit reminder/check to update production environment secrets, not only dev/local/Replit workspace state.

Source evidence at likely production-era `ba924d6`:

- `server/routes.ts` routes `/api/vision/analyze` through `isAuthenticated`, body/base64 validation, image size validation, `consumeVisionImageRateLimits`, optional HEIC conversion, then `analyzeIngredientImage`.
- Access-control failures should return `401`/`403`; rate limits should return `429`; malformed images should return `400`; too-large images should return `413`.
- The generic `500 {"error":"Failed to analyze image"}` is returned only after the route catch receives a non-Zod, non-`AIProviderQuotaError` exception.
- `server/openai.ts` constructs the OpenAI client with `process.env.OPENAI_API_KEY || ""` and vision calls `openai.chat.completions.create(...)` with `MODEL_COMPLEX = "gpt-4.1"`.
- At `ba924d6`, the route logs `Error in image analysis:` and the helper logs `Error analyzing ingredient image:`. The later structured `ingredient_detection` AI error telemetry was not merged until `382ebd0` on 2026-06-09, after the observed production asset timestamp.

## Inference

The production screenshot is not consistent with App Check/auth/access-control blocking, because those paths return typed `401`/`403` JSON before image analysis. The strongest current explanation is a production-only provider/config failure after auth passed: the rotated OpenAI API key was not present/current in the Replit Deployment environment.

Because Replit dev recognized the same image correctly, the image itself and the current vision prompt/model path are not the primary suspects.

## Open items

Blocked on one of these Replit/production-side facts:

- Production deployment logs around the failed `POST /api/vision/analyze`, especially lines beginning `Error analyzing ingredient image:` or `Error in image analysis:`.
- Search by the HAR trace contexts if available: `a5ff347c1d942ac9d975ceca13a915c3` and `bcb4366d7854cbc5758f8a0e3dca729a`. If trace search is unavailable, search the UTC windows around `2026-06-21T06:50:40Z` and `2026-06-21T06:53:57Z`.
- Masked secret presence check in the production Deployment environment: print only whether `OPENAI_API_KEY` is `set` or `MISSING`; never print the value. If possible, compare only a non-secret rotation label/date from private notes, not the key value.
- Confirm the exact production deployment code SHA/release corresponding to the June 6 asset.
- After any secret fix or redeploy, rerun the same oyster scan in production and confirm the endpoint returns `200` with detected ingredients.

Smallest next action: update/confirm `OPENAI_API_KEY` in production Deployment secrets, redeploy current `origin/main`, and rerun the oyster scan in production. If it still fails, inspect the failed request window for the vision route error and classify the provider response.

## Verification

This was an investigation-only branch. Verification was limited to public production HTTP metadata, one unauthenticated route probe, local source inspection, and git history comparison. No authenticated production scan was rerun by Codex, and no Replit Deployment logs or secrets were available locally.

## Stack / base status

- Base refreshed: yes
- Current base: `origin/main` at `762488e`
- Last Replit-validated at: not applicable; investigation blocked on Replit/prod evidence
- Notes: Production public assets appear to be from a June 6 deployment window, while current `origin/main` is June 19.
