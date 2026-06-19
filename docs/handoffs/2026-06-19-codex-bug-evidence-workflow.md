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

## Source Evidence Captured

Recent recipe preview image validation exposed the gap:

- Wilson reported the Prep Tray image spinner appeared for roughly one second and then stopped.
- Browser Network showed `/api/recipe-images/selected/resolve`, but at one point only the request Payload was visible, not the Response body.
- Earlier evidence showed `{ status: "unavailable", reason: "disabled" }`, which matched missing `RECIPE_IMAGE_GENERATION_ENABLED=true`.
- Wilson later found Replit Configurations had disappeared in that context and moved the `RECIPE_IMAGE_*` flags into Replit Secrets.
- After latest main was loaded and secrets were reportedly present, the same one-second spinner symptom remained. At that point, the next evidence needed was the actual Network Response body, masked process env presence for `RECIPE_IMAGE_*`, resolver server logs, and recent `recipe_image_cache` failure rows.
- The client starts the spinner before the first resolver result and stops on terminal `unavailable`; that explains the symptom shape but does not prove why the route returned `unavailable`.

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
