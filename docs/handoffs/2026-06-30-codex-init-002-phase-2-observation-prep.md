# INIT-002 Phase 2 Observation Prep

**Agent:** codex
**Branch:** `codex/init-002-phase-2-observation`
**Date:** 2026-06-30
**Initiative:** INIT-002
**INIT updated:** yes
**Resolves blocked handoff:** none

## Summary

INIT-002 is still in Phase 2, the Replit observation week between stdout-only telemetry and DB/admin telemetry. I refreshed to `origin/main` at `f9909af7cbc7104f9eb4da7b3a8642215fce461e` and found no repo-visible Phase 2 stdout observation evidence after PR #159's Phase 1 merge closeout. PR #159 proved the logger foundation at Replit for merge readiness, but it did not collect the real failure examples, classifier gaps, field-nullability decisions, or provider/secret observation needed to freeze the DB/admin shape.

The next move requires Wilson to choose whether to spend effort now on Replit/runtime observation collection. If yes, collect the evidence below before Phase 3 begins. If no, keep INIT-002 in Phase 2 and do not start DB persistence or admin telemetry APIs.

## Changes

- `initiatives/INIT-002-ai-error-telemetry.md`
  - Adds this handoff to Source Docs.
  - Records that Phase 2 has no committed observation evidence yet.
  - Adds the missing evidence list and the Wilson decision point to Current Resume Point.
  - Notes one source-scope wrinkle: `/api/ingredients/alternatives` is still an authenticated OpenAI-backed route but was not included in the Phase 1 "9 routes" telemetry set or `AI_ERROR_FEATURE_TYPES`.
- `initiatives/registry.md`
  - Refreshes INIT-002's last signal to the 2026-06-30 observation prep.
- `docs/handoffs/2026-06-30-codex-init-002-phase-2-observation-prep.md`
  - Records this point-in-time gap list and resume context.

No runtime code, schema, admin route, provider behavior, prompt, eval, or client UI changed.

## Impact on other agents

Do not start Phase 3 `ai_error_events` persistence or Phase 4 admin APIs from local code alone. The missing facts are runtime facts, not TypeScript questions.

The observation scope is:

- direct Replit shell/browser/log collection, not Replit Agent unless Wilson explicitly approves spending credits
- real Replit workspace and/or deployment runtime evidence tied to an exact SHA
- safe stdout `event: "ai_error"` JSON lines only, with PD-010 allowlist inspection
- AI provider routes, ElevenLabs speech routes, Whisper transcription when reachable, and Secrets rows from the Replit Validation Focus Guide
- classifier coverage, unexpected `unknown` clusters, noisy/missing fields, and field-nullability decisions before any schema/admin shape is frozen

Current code-level wrinkle to classify before Phase 3: `server/routes.ts` still exposes `/api/ingredients/alternatives`, `client/src/lib/openai.ts` still calls it, and `server/openai.ts` routes it through `getIngredientAlternatives`, but INIT-002 Phase 1 only claimed 9 telemetry-wired routes and `server/ai-feature-types.ts` has no feature id for ingredient alternatives. Either include this route intentionally in v1 telemetry or document why it remains outside the DB/admin claim.

## Open items

Evidence still missing before DB/admin telemetry can continue:

- Exact Replit observation target and SHA: workspace and/or deployment, branch/ref, `git rev-parse HEAD`, runtime status, and log window.
- `X-Request-Id` proof on normal Replit `/api/*` traffic, plus at least one failure log where `request_id` can be correlated with a response header or server-side request window.
- Safe stdout examples for reachable operational failure classes across the wired telemetry routes, especially OpenAI-backed recipe/cooking/vision routes, ElevenLabs `tts` / `tts_voices`, Whisper transcription, provider auth/rate/network classes when safely observable, and any naturally occurring `unknown` class.
- Field-nullability/schema decisions for `error_code`, `auth_user_id`, `prompt_version_id`, `retry_after_secs`, preference/ingredient/image counts, `latency_ms`, `attempt_number`, and `input_shape_hash`.
- Privacy inspection proving logs contain no raw prompts, preferences, ingredient labels, images, audio, transcripts, headers, tokens, provider messages, stack traces, or arbitrary payload JSON.
- Masked Replit workspace/deployment secret posture for `OPENAI_API_KEY`, `ELEVENLABS_API_KEY`, `ADMIN_SECRET` when admin routes become in scope, Firebase config, and database target. Print only `set` / `MISSING`, never values.
- Scope decision for `/api/ingredients/alternatives`.
- Phase 3 Replit-authoritative DB plan: target database lane, schema-push owner, table-presence proof, row inspection path, and no use of the default decrypted local `.env` DB as an authoritative schema target.

## Verification

- `git fetch origin` passed.
- `HEAD` and `origin/main` both resolved to `f9909af7cbc7104f9eb4da7b3a8642215fce461e` before this branch was created.
- Read/reviewed:
  - `initiatives/README.md`
  - `initiatives/INIT-002-ai-error-telemetry.md`
  - `initiatives/registry.md`
  - `product-decisions/pd-010-ai-error-telemetry-allowlist.md`
  - `docs/workflows/ai-error-handling-and-telemetry.md`
  - `docs/workflows/replit-validation-focus.md`
  - `docs/workflows/testing-and-acceptance.md`
  - `docs/adr/0001-replit-primary-local-agents.md`
  - `efforts/effort-017-environment-parity-and-ci-confidence.md`
  - `efforts/effort-010-local-db-schema-strategy.md`
  - `docs/handoffs/2026-06-09-codex-init-002-phase-1-telemetry.md`
  - `docs/handoffs/2026-06-10-codex-init-002-phase-1-closeout.md`
  - relevant blocked/resolution handoffs for the June production vision incident
- Runtime validation was not run. This branch is docs-only observation prep.

## Stack / base status

- Base refreshed: yes
- Current base: `origin/main` at `f9909af7cbc7104f9eb4da7b3a8642215fce461e`
- Last Replit-validated at: not yet validated for Phase 2 observation
- Notes: PR #159's direct Replit validation at `76b536170c5c47d7cb04016b3c4cae451544da3b` remains Phase 1 merge evidence only. It should not be reused as the Phase 2 observation week.
