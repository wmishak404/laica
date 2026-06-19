# 2026-06-19 — Bug Investigation Evidence Workflow

## Summary

This branch turns a repeated debugging lesson into durable workflow guidance: bug fixes should start from enough evidence to distinguish root causes, not from the first plausible screenshot-level theory. The main workflow now asks agents to collect browser, Replit, server, DB/cache, and masked env-presence evidence before prescribing fixes, and to label evidence vs inference vs missing input.

## Branch

- Branch: `codex/bug-evidence-workflow`
- Base: `origin/main` at `7274a62e63c933c6f41bdde0035d47cce5e8b7d3`
- Scope: docs/process only

## What Changed

- Added a `Bug Investigation Evidence Protocol` to `docs/workflows/testing-and-acceptance.md`.
- Added short discovery pointers in `AGENTS.md` and `CLAUDE.md` so Codex and Claude both see the protocol before debugging from screenshots alone.
- Captured the 2026-06-19 selected-recipe-image Replit smoke and future coverage candidates in `product-decisions/features/mobile-refresh/pd-phase-03-1-recipe-imagery.md`.

## Source Evidence Captured

Recent recipe preview image validation exposed the gap:

- Wilson reported the Prep Tray image spinner appeared for roughly one second and then stopped.
- Browser Network showed `/api/recipe-images/selected/resolve`, but at one point only the request Payload was visible, not the Response body.
- Earlier evidence showed `{ status: "unavailable", reason: "disabled" }`, which matched missing `RECIPE_IMAGE_GENERATION_ENABLED=true`.
- Wilson later found Replit Configurations had disappeared in that context and moved the `RECIPE_IMAGE_*` flags into Replit Secrets.
- After latest main was loaded and secrets were reportedly present, the same one-second spinner symptom remained. At that point, the next evidence needed was the actual Network Response body, masked process env presence for `RECIPE_IMAGE_*`, resolver server logs, and recent `recipe_image_cache` failure rows.
- The client starts the spinner before the first resolver result and stops on terminal `unavailable`; that explains the symptom shape but does not prove why the route returned `unavailable`.

Additional Replit validation later in the source thread confirmed why the protocol must keep collecting evidence after a first plausible theory:

- After Replit was synced to latest main (`7274a62e63c933c6f41bdde0035d47cce5e8b7d3`) and the stale server was fully restarted, the earlier HTML-shell response for `POST /api/recipe-images/selected/resolve` was resolved. An unauthenticated curl returned `401 Unauthorized` JSON, proving the route was registered on the running server.
- With real Replit secrets loaded, the selected Prep Tray resolver returned `pending`, then `ready` with image URL `/api/recipe-images/80670aca7691fcbeb3ec3f79830a8be947d9b521ba2b878c594984bb575dc87b` and matching cache key.
- The generated image appeared and visually matched the title/core ingredients for `Leek, Carrot, and Tofu Stir Fry Over Rice`.
- Leaving Prep Tray before completion and returning later reused the completed server-side cache fill. That was considered acceptable: visible polling changes with navigation, while the background cache fill may complete for a later visit.
- Ticket Pass fairness passed after returning from Prep Tray: the selected/generated image did not appear on the three-choice Ticket Pass surface.
- Refresh Suggestions did not call the image resolver on Ticket Pass. Even after hard refresh with cached/generated images available for all three recipes, Ticket Pass did not trigger three-choice image generation.
- `Cook this` proceeded while image generation was pending, so cooking remained non-blocking.
- Reopening the same selected recipe reused the generated image without another resolver/reload.
- Extensive testing eventually hit the selected resolver rate limit. The Network response was HTTP `429 Too Many Requests` with JSON like `{ "code": "RATE_LIMITED", "message": "Too many requests. Try again..." }`; headers included `X-RateLimit-Limit: 12`, `X-RateLimit-Remaining: 0`, `X-RateLimit-Reset`, and `Retry-After`. The spinner stopped in that terminal state, which Wilson considered acceptable.

Future selected-recipe-image coverage should include these additional cases when the runtime bug work resumes:

- API route returns JSON, not HTML, after current-main restart.
- Selected Prep Tray image transitions from `pending` to `ready`.
- Leaving Prep Tray before completion and returning later can use the completed cached image.
- Ticket Pass never shows selected/generated images after returning, Refresh Suggestions, or hard refresh.
- Refresh Suggestions does not call the image resolver on Ticket Pass.
- `Cook this` remains available and non-blocking while the image is pending.
- Reopening the same selected recipe uses cached/session image without another resolver call.
- Rate-limit response is terminal and does not keep the spinner spinning.

Repeated workstream patterns also shaped the protocol:

- Replit runtime state and git state diverged multiple times, so bug work needs current branch/SHA and remote ref evidence.
- Replit Secrets/Configurations are external runtime state and can drift independently of git.
- A previous full process environment check exposed an OpenAI key, so the rule now reinforces masked presence checks only.
- Local dotenvx/Playwright work should use repo-pinned scripts and avoid ad hoc package fetches while decrypted secrets are in scope.
- Replit Agent remains credit-guarded; prefer direct shell/UI/GitHub evidence first.

## Validation

- `git diff --check` passed.
- `rg` spot-check confirmed the new protocol, agent pointers, and recipe-image handoff evidence are discoverable.
- No runtime checks planned; this is docs-only workflow guidance.

## Negative Scope

- This branch does not fix the Prep Tray spinner/image bug.
- This branch does not decide whether image generation should show pending copy, change spinner behavior, or alter the resolver.
- This branch does not create a new Effort; the durable home is the testing and acceptance workflow.
