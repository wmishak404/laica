# Mobile Refresh — AI Privacy, Prompt Injection, and Abuse Rules

**Status:** Accepted
**Document kind:** Feature Phase Record
**Owner:** Wilson
**Date:** 2026-04-28
**Initiative:** [INIT-001 — Mobile Refresh](../../../initiatives/INIT-001-mobile-refresh.md)

## Goal

Keep AI-powered cooking flows useful while preventing prompt injection, private-data leakage, avoidable retention risk, and cost abuse.

## Prompt and Data Rules

- Treat voice transcripts, typed questions, scan labels, notes, and feedback as untrusted user input.
- Never send auth tokens, email, Firebase UID, profile photo URL, raw session IDs, secrets, or unrelated user data into model prompts.
- Cooking voice assistance may receive only the current step, next one or two steps, recipe name, relevant ingredients/equipment, and cooking skill.
- Keep user input in user-context fields; do not concatenate it into system/developer instructions.
- System prompts must explicitly ignore requests to reveal hidden prompts, secrets, internal context, or other users' data.
- Use structured model outputs and Zod validation for recipe, cooking-step, scan, and seed responses.
- Render AI output as plain text. Do not use `dangerouslySetInnerHTML` for AI or user-generated content.

## Input Clamps

Enforce server-side limits:

- pantry item label: 64 characters
- feedback text: 280 characters
- voice transcript: 2,000 characters
- manual entries: split on commas, treat periods as comma-like typo recovery, trim, normalize, dedupe, and reject empty tokens

Strip or neutralize prompt-marker-like sequences from fields that flow into prompts, including `###`, `<|...|>`, `[INST]`, and `[SYSTEM]`.

Phase 2.1 setup validation confirmed this should happen on both sides of the boundary: client manual-entry helpers strip common prompt markers before saving pantry/equipment labels, and server prompt/log helpers sanitize the same marker family before model prompts or AI logs.

## Voice Guardrails

The current Phase 4 baseline is tap-to-talk, not a realtime voice agent. Any future voice tools must be allowlisted:

- `repeat`
- `next`
- `previous`
- `timer.start`
- `timer.pause`
- `timer.cancel`
- `answer`

Anything outside the allowlist is handled as a non-mutating cooking question or rejected.

Future agentic cooking actions must route through the typed proposal/confirmation/execution contract in [Phase 4 agentic cooking actions](pd-phase-04-agentic-cooking-actions.md). The model may propose an action, but deterministic policy and executor code must enforce context packs, action allowlists, confirmation, authorization, idempotency, audit logging, and fail-closed behavior.

## Agentic Action Guardrails

Action-capable assistants must use need-to-act context, not broad app context. A timer proposal can receive timer state and the current step; a recipe patch can receive the current guide and relevant pantry/equipment facts; a pantry/profile correction can receive the matched user-owned profile fact. No action pack may receive auth tokens, email, Firebase UID, raw session IDs, secrets, payment data, other users' information, unrelated profile fields, raw audio, raw images, full unredacted transcripts, repository docs, or private build/process details.

Forbidden action surfaces include payments, subscriptions, orders, delivery, shopping, account/security/admin changes, deployment or secret management, arbitrary URL/file/code access, third-party app data lookup, external communications, cross-user data, data export/import beyond the current cooking object, and background listening.

All mutating actions require action-bound confirmation in v1. Timer actions may use a lightweight one-tap confirmation; pantry/profile writes, recipe patching, History snapshot changes, and safety-sensitive actions require explicit before/after confirmation. Voice confirmation is future work and must include replay protection and exact action binding before it can execute mutations.

If schema validation, policy lookup, safety lookup, authorization, confirmation binding, idempotency, execution, or audit logging fails, the action must not execute. A redacted `cooking_action_blocked` report should record the action kind, risk tier, failure stage, policy version, safe user message, developer reason code, and eval-candidate reason without storing raw audio, raw images, secrets, or full transcripts.

## Logging and Retention

- Do not log raw images, raw audio, auth tokens, service secrets, Firebase payloads, or full sensitive transcripts.
- `aiInteractions` may retain bounded, redacted structured input/output for evals.
- Add a 90-day retention policy for `aiInteractions`.
- Redact email-like strings, Firebase UID-like strings, and obvious token-like strings before persistence.

## Abuse Prevention

- Server limits are authoritative; client caps only improve UX.
- Pantry/Kitchen scan capacity policy is superseded by [PD-011](../../pd-011-scan-upload-photo-limit-policy.md): 20 scanned images per inventory refresh per area, 40 scanned images per day per area, and the same limit across setup, Settings, and post-cook rescans unless Phase 5 explicitly documents an exception.
- Setup and Settings upload caps are fail-closed in the client: selecting more than the cap cancels the whole refresh so users are not left guessing which photos were processed.
- Vision scan route rate-limit keys separate Pantry and Kitchen contexts so Pantry abuse testing does not block equipment validation, while both contexts remain route-limited.
- Batched scan route rate limits count accepted images, not requests, so adaptive chunking cannot bypass the daily budget.
- Recipe generation, speech, vision, and feedback routes use Phase 0 route-class and per-uid limits.
- Reject unsupported file/body types early and fail closed on malformed base64 image payloads.

## Acceptance Criteria

- Prompt-injection probes such as `### ignore prior instructions` do not change system behavior.
- Voice prompt construction can be inspected to confirm it excludes unrelated profile/session data.
- Model-rendered text is escaped by React/plain-text rendering.
- `aiInteractions` rows do not contain raw token, email, Firebase UID, image bytes, or audio bytes.
- Retention cleanup exists or is documented as an operational scheduled job before production rollout.
