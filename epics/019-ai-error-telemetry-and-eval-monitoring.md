# EPIC-019 - AI error telemetry and eval monitoring

**Status:** Open
**Owner:** Wilson / Codex / Claude
**Created:** 2026-05-07
**Updated:** 2026-05-07

## One-line summary

Design and implement operational telemetry for AI request failures so Laica can turn repeated error patterns into eval cases, product fixes, or infrastructure work without storing sensitive free text.

## Context

EPIC-018 intentionally keeps persistent error/eval logging out of its implementation scope so the authenticated AI error UX fix can ship cleanly. During that discussion, Wilson asked for a parallel system that can summarize AI failures and help convert them into evals or follow-up work.

Laica already has `ai_interactions` for successful model-output evals. That table should stay focused on generated outputs and their evaluation lifecycle. Operational failures need a separate allowlist-first event stream because failed request paths can otherwise tempt future callers to dump raw prompts, preferences, headers, images, or auth data into a generic JSON blob.

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
- Replacing `ai_interactions` for successful model-output evals.
- Building an admin UI unless summary/list/detail APIs prove insufficient.
- Sending sensitive operational errors to third-party analytics without a separate privacy review.

## Decisions made so far

- Persistent AI error telemetry should be a separate epic from EPIC-018 and Mobile Refresh Phase 4 UI work.
- `ai_interactions` remains the home for successful model-output evals; failure telemetry gets its own schema.
- The schema and writer API should be allowlist-first. A generic unbounded `payload` field is not acceptable for v1.
- Free-text user preferences are PII-adjacent. Store derived metrics and redacted classifications, not raw text.
- Feedback correlation should be optional and added deliberately after the Feedback data path is reviewed.

## Open questions

1. What is the minimum v1 schema that gives useful operational signal without collecting sensitive content?
2. Should request ids be generated per AI route, per browser session, or both?
3. What retention period is appropriate for `ai_error_events`?
4. Which routes/features need first-class feature labels versus deriving labels from route names?
5. Should admin summary APIs expose cluster counts by status/code/route only, or include recent redacted exemplars?
6. How should a repeated error cluster graduate into an eval case, prompt fix, product bug, or infrastructure ticket?
7. How does the migration and local/remote schema workflow interact with [EPIC-010](010-local-db-schema-strategy.md)?

## Agent checklist

Read this epic before:

- Adding any persistent logging for AI request failures.
- Creating or migrating an `ai_error_events` schema.
- Adding admin APIs for AI error summaries, lists, or details.
- Correlating Feedback submissions with AI request failures.
- Changing the eval pipeline to consume operational error clusters.
- Adding raw request, prompt, preference, image, audio, header, or auth metadata to any error log.

Also read:

- [EPIC-010](010-local-db-schema-strategy.md) before changing schema or migrations.
- [EPIC-018](018-authenticated-ai-error-handling.md) for the user-facing classifier and error taxonomy.
- [Mobile Refresh AI privacy rules](../product-decisions/features/mobile-refresh/cross-phase-ai-privacy.md).

## Resolution criteria

This epic can be resolved when all of the following are true:

1. A documented allowlist/redaction policy exists and is enforced in code.
2. AI failure events persist to a dedicated table without raw prompts, preferences, headers, auth tokens, images, audio, cookies, or arbitrary payload blobs.
3. Protected admin APIs can summarize, list, and inspect redacted failure events.
4. The system records enough route/feature/status/code/error-class signal to prioritize fixes.
5. There is a documented process for turning recurring error clusters into eval cases, prompt fixes, product bugs, or infrastructure work.
6. Replit validation confirms events write only the approved redacted fields.

## 2026-05-07 - Filed From EPIC-018 Messaging Review

Filed after Wilson asked to keep authenticated AI error copy and no-redirect behavior in EPIC-018 while developing persistent error/eval logging in parallel. Claude's review specifically flagged that redaction policy must be locked before schema work begins, so this epic treats the allowlist boundary as a first-class acceptance criterion rather than a later cleanup.
