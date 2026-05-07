# EPIC-019 — AI error telemetry and eval monitoring

**Status:** Open
**Owner:** Wilson / Codex / Claude
**Created:** 2026-05-07
**Updated:** 2026-05-07
**Linked initiative:** [INIT-002 — AI Error Telemetry & Eval Monitoring](../initiatives/INIT-002-ai-error-telemetry.md)

## One-line summary

Design and implement operational telemetry for AI request failures so Laica can turn repeated error patterns into eval cases, product fixes, or infrastructure work without storing sensitive free text.

## Context

[EPIC-018](018-authenticated-ai-error-handling.md) intentionally keeps persistent error/eval logging out of its implementation scope so the authenticated AI error UX fix can ship cleanly. During that discussion, Wilson asked for a parallel system that can summarize AI failures and help convert them into evals or follow-up work.

Laica already has `aiInteractions` for successful model-output evals. That table should stay focused on generated outputs and their evaluation lifecycle. Operational failures need a separate allowlist-first event stream because failed request paths can otherwise tempt future callers to dump raw prompts, preferences, headers, images, or auth data into a generic JSON blob.

This epic is being implemented through [INIT-002](../initiatives/INIT-002-ai-error-telemetry.md), which sequences the work as: allowlist policy → stdout structured logs → real-traffic observation week → DB persistence → admin APIs → cluster→action triage process.

## Scope

In scope:

- Define a redaction policy before the first row writes.
- Add an `ai_error_events` table for operational AI request failures.
- Capture only allowlisted fields such as status, code, route, feature, error class, auth user id when available, timestamp, request id, retry-after bucket, and redacted context metrics such as preference length.
- Add protected admin APIs for summary, list, and detail views.
- Decide how error clusters become eval cases, prompt fixes, product bugs, or infrastructure work.
- Leave room for optional Feedback correlation later without requiring it in v1.

Out of scope:

- Implementing persistent telemetry inside EPIC-018.
- Storing raw recipe preferences, prompts, model messages, Authorization headers, auth tokens, image payloads, audio payloads, cookies, stack traces with request bodies, or arbitrary caller-provided JSON blobs.
- Replacing `aiInteractions` for successful model-output evals.
- Building an admin UI unless summary/list/detail APIs prove insufficient.
- Sending sensitive operational errors to third-party analytics without a separate privacy review.

## Decisions made so far

- Persistent AI error telemetry should be a separate epic from EPIC-018 and Mobile Refresh Phase 4 UI work.
- `aiInteractions` remains the home for successful model-output evals; failure telemetry gets its own schema.
- The schema and writer API should be allowlist-first. A generic unbounded payload field is not acceptable for v1.
- Free-text user preferences are PII-adjacent. Store derived metrics and redacted classifications, not raw text.
- Feedback correlation should be optional and added deliberately after the Feedback data path is reviewed.
- The work is phased and tracked under [INIT-002](../initiatives/INIT-002-ai-error-telemetry.md): docs/policy first, stdout logs next, DB persistence and admin APIs last. Phase 1 is gated on EPIC-018 merging so the typed-error route helper and classifier are stable before INIT-002 wires them in.
- The redaction allowlist is a durable accepted decision recorded at [PD-010](../product-decisions/010-ai-error-telemetry-allowlist.md).

## Open questions

- Should request ids be generated per AI route, per browser session, or both? *(INIT-002 working answer: per-request UUID generated server-side, overwrites any client-supplied value.)*
- What retention period is appropriate for `ai_error_events`? *(INIT-002 working answer: 90 days, matching the mobile-refresh AI privacy commitment for `aiInteractions`.)*
- Which routes/features need first-class feature labels versus deriving labels from route names? *(INIT-002 working answer: explicit `feature` enum with one value per route, plus `vendor` enum for OpenAI / ElevenLabs / Whisper.)*
- Should admin summary APIs expose cluster counts by status/code/route only, or include recent redacted exemplars? *(INIT-002 working answer: include exemplars; the allowlist guarantees they are safe to expose.)*
- How should a repeated error cluster graduate into an eval case, prompt fix, product bug, or infrastructure ticket? *(INIT-002 working answer: PD-010 cluster→action table; engineer reproduces from `input_shape_hash` signal alone, never user data.)*
- How does the migration and local/remote schema workflow interact with EPIC-010? *(INIT-002 working answer: schema PR is merged with the writer self-disabling on missing table; Replit applies `db:push` per [EPIC-010](010-local-db-schema-strategy.md). Local agents do not push.)*

These working answers stay in INIT-002 / PD-010 until validated against real Replit traffic in INIT-002 Phase 2.

## Agent checklist

Read this epic before:

- Adding any persistent logging for AI request failures.
- Creating or migrating an `ai_error_events` schema.
- Adding admin APIs for AI error summaries, lists, or details.
- Correlating Feedback submissions with AI request failures.
- Changing the eval pipeline to consume operational error clusters.
- Adding raw request, prompt, preference, image, audio, header, or auth metadata to any error log.

Also read:

- [INIT-002](../initiatives/INIT-002-ai-error-telemetry.md) for the active phase, validation state, and current resume point.
- [PD-010](../product-decisions/010-ai-error-telemetry-allowlist.md) for the redaction allowlist enforced in code.
- [EPIC-010](010-local-db-schema-strategy.md) before changing schema or migrations.
- [EPIC-018](018-authenticated-ai-error-handling.md) for the user-facing classifier and error taxonomy.
- [Mobile Refresh AI privacy rules](../product-decisions/features/mobile-refresh/cross-phase-ai-privacy.md).

## Resolution criteria

This epic can be resolved when all of the following are true:

1. A documented allowlist/redaction policy exists ([PD-010](../product-decisions/010-ai-error-telemetry-allowlist.md)) and is enforced in code at the writer boundary.
2. AI failure events persist to a dedicated table without raw prompts, preferences, headers, auth tokens, images, audio, cookies, or arbitrary payload blobs.
3. Protected admin APIs can summarize, list, and inspect redacted failure events.
4. The system records enough route/feature/status/code/error-class signal to prioritize fixes.
5. There is a documented process for turning recurring error clusters into eval cases, prompt fixes, product bugs, or infrastructure work, with at least one worked example per cluster type recorded against real Replit data.
6. Replit validation confirms events write only the approved redacted fields.

## 2026-05-07 — Filed from EPIC-018 messaging review

Filed after Wilson asked to keep authenticated AI error copy and no-redirect behavior in EPIC-018 while developing persistent error/eval logging in parallel. Claude's review specifically flagged that redaction policy must be locked before schema work begins, so this epic treats the allowlist boundary as a first-class acceptance criterion rather than a later cleanup.

## 2026-05-07 — Promoted to INIT-002

Wilson confirmed the work is phased (stdout logs → real-traffic observation → DB persistence → admin APIs → cluster→action triage) and asked to file it as [INIT-002](../initiatives/INIT-002-ai-error-telemetry.md). Phase 0 created the INIT hub, [PD-010](../product-decisions/010-ai-error-telemetry-allowlist.md), and active-list updates. Phase 1 (request-id middleware + stdout structured logger + 9 AI routes) is gated on EPIC-018 merging.
