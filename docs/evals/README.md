# AI Eval Evidence

This directory is the durable home for AI output-quality eval indexes, intake records, fixture candidates, and reporting references.

INIT files are initiative hubs. They can close. Eval evidence that should remain discoverable after an INIT closes belongs here.

## What Lives Here

- `registry.md` - durable index of eval runs, open-coding imports, judge runs, human review batches, and daily reports.
- `intakes/` - normalized records for each eval intake listed in the registry.
- `intakes/TEMPLATE.md` - required structure for future intake records.

## What Does Not Live Here By Default

Do not commit raw trace exports, raw prompts containing user-identifying data, images, audio, secrets, auth data, or full production payloads without a durable privacy/source decision. Prefer summarized, redacted, or synthetic fixtures until that decision exists.

When raw artifacts remain local or external, the registry and intake record should still preserve:

- stable intake id,
- source and source date,
- sample size,
- input/output schema,
- prompt/model/evaluator versions when known,
- metrics and calibration status,
- failure/learning clusters,
- positive examples worth preserving,
- fixture candidates,
- raw artifact handling,
- privacy posture,
- open questions and next actions.

## Routing Rules

- Add every future eval run/import/report as a row in `registry.md`.
- Add or update a matching `intakes/<intake-id>.md` record when the run changes rubric, fixtures, metrics, reporting, or prompt workflow.
- Link active initiative hubs, such as `INIT-004`, back to this registry instead of treating the INIT as the permanent dataset ledger.
- Use PR descriptions and `docs/handoffs/` for point-in-time command output, branch status, local-only file paths, and review context.
- Use feature phase docs, product decisions, or active Efforts when an eval finding changes product behavior, not only measurement.

## Current Related Initiative

- [INIT-004 - AI Output Quality Evals & Prompt Improvement](../../initiatives/INIT-004-ai-output-quality-evals.md)
