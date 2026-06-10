# AI Eval System

This directory is the practical home for AI output-quality eval indexes, intake records, fixture candidates, report references, and future harness instructions.

The canonical eval discipline lives in [docs/workflows/evaluations.md](../workflows/evaluations.md). INIT files are initiative hubs and can close; eval evidence that should remain discoverable after an INIT closes belongs here.

## What Lives Here

- `registry.md` - durable index of eval runs, open-coding imports, judge runs, human review batches, and daily reports.
- `intakes/` - normalized records for each eval intake listed in the registry.
- `intakes/TEMPLATE.md` - required structure for future intake records.
- `init-004-phase-2-rubric-dataset-spec.md` - draft INIT-004 Phase 2 taxonomy, privacy, rubric, fixture-format, and Wilson-label target spec.

Future implementation work may add:

- `fixtures/` - redacted or synthetic golden/regression cases used by the harness.
- `reports/` - generated summaries or durable references to generated summaries when committing the report itself is appropriate.
- Harness command notes in this README once INIT-004 adds executable eval tooling.

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

- Use [docs/workflows/evaluations.md](../workflows/evaluations.md) for the repo-wide operating model, merge-gate rules, calibration standard, privacy posture, and prompt-activation discipline.
- Add every future eval run/import/report as a row in `registry.md`.
- Add or update a matching `intakes/<intake-id>.md` record when the run changes rubric, fixtures, metrics, reporting, or prompt workflow.
- Link active initiative hubs, such as `INIT-004`, back to this registry instead of treating the INIT as the permanent dataset ledger.
- Use PR descriptions and `docs/handoffs/` for point-in-time command output, branch status, local-only file paths, and review context.
- Use feature phase docs, product decisions, or active Efforts when an eval finding changes product behavior, not only measurement.

## Practical Eval Loop

See [docs/workflows/evaluations.md](../workflows/evaluations.md) for the full durable process. In this directory:

1. Register the run/import/report in `registry.md`.
2. Normalize the intake under `intakes/` when it changes rubric, fixtures, metrics, reporting, or prompts.
3. Store only redacted, synthetic, or explicitly approved fixture data in repo.
4. Record harness commands, result artifact ids, report ids, and negative scope in the registry or matching intake.
5. Link prompt-candidate comparisons and daily reports back through this directory.
6. When executable tooling lands, document the exact command, required environment, output paths, and artifact-retention policy here.

## Current Related Initiative

- [INIT-004 - AI Output Quality Evals & Prompt Improvement](../../initiatives/INIT-004-ai-output-quality-evals.md)
