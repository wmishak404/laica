# 2026-06-01 — CI E2E startup isolation follow-up

## Summary

After PR #109 and the post-merge docs closeout landed, Wilson configured the GitHub Actions Neon/Firebase/ElevenLabs inputs. The first active `e2e_guest_smoke` run on `main` proved the harness is no longer inert, then exposed a narrower app startup isolation bug: the server required `OPENAI_API_KEY` at boot even though the guest-lane smoke does not call OpenAI.

## Evidence

- GitHub Actions `CI (Typecheck, Unit, E2E)` on `main` reached `e2e_guest_smoke` instead of skipping.
- Passed steps:
  - Preflight Secrets
  - Create Neon Branch (schema-only)
  - Install
  - DB Push (apply schema)
  - DB Schema Health (`DB schema health check passed.`)
  - Install Playwright Browsers (Chromium)
  - Delete Neon Branch cleanup
- Failed step:
  - `E2E (guest smoke)` while Playwright waited for the local web server.
  - Root cause evidence: `server/routes.ts` constructed an OpenAI transcription client at module load, so server startup failed when `OPENAI_API_KEY` was absent.

## Change

- Made the `/api/speech/transcribe` OpenAI client lazy so basic server startup and guest-lane E2E do not require OpenAI.
- Preserved route behavior for transcription: if the route is actually called without `OPENAI_API_KEY`, it now returns a service-unavailable JSON response instead of blocking app startup.
- Updated EFF-017 and testing/environment-parity workflow docs to record that the guest smoke should stay provider-light by default. Live OpenAI validation belongs in an explicit live-provider smoke/canary.

## Validation

Passed locally on this branch:

- `npm run check`
- `npm run build`
- `npx vitest run tests/unit/phase0-security-routes.test.ts`

Replit validation: not required for this CI/startup-isolation follow-up unless the branch grows beyond workflow/test-harness behavior.

## Next

After this follow-up merges, re-run GitHub Actions on `main`. Expected next result: `e2e_guest_smoke` should start the app and execute the guest setup smoke using the configured Neon/Firebase/ElevenLabs inputs, without requiring `OPENAI_API_KEY`.

If the smoke then fails deeper in the flow, classify the next failure by whether it is a harness selector issue, Firebase anonymous auth/config issue, DB/state issue, or a genuine app regression. Do not treat later live-provider scope as part of this guest-lane smoke unless EFF-017 explicitly accepts that expansion.
