# AI Eval System

This directory is the practical home for AI output-quality eval indexes, intake records, fixture candidates, report references, future harness instructions, and narrowly registered interaction-eval seeds when a user-facing behavior needs durable acceptance criteria before an automated harness exists.

The canonical eval discipline lives in [docs/workflows/evaluations.md](../workflows/evaluations.md). INIT files are initiative hubs and can close; eval evidence that should remain discoverable after an INIT closes belongs here.

## What Lives Here

- `registry.md` - durable index of eval runs, open-coding imports, judge runs, human review batches, and daily reports.
- `intakes/` - normalized records for each eval intake listed in the registry.
- `intakes/TEMPLATE.md` - required structure for future intake records.
- `fixtures/` - canonical home for public synthetic or reviewed redacted regression fixtures. Raw private fixtures stay outside git under `LAICA_PRIVATE_EVAL_DIR`.
- `init-004-phase-2-rubric-dataset-spec.md` - INIT-004 Phase 2 taxonomy, privacy, rubric, fixture-format, and Wilson-label target spec revised from Wilson's architecture decisions.
- Non-V1 interaction seeds, such as Live Cooking speech arbitration, may be registered here when they need the same intake/registry discipline. These records do not automatically expand INIT-004's active V1 scope.

Future implementation work may add:

- `reports/` - generated summaries or durable references to generated summaries when committing the report itself is appropriate.
- Additional harness command notes once INIT-004 adds executable eval tooling beyond unit-level fixture checks.

Private raw-real gold fixtures do not live in this repo. INIT-004 Phase 2 reserves `LAICA_PRIVATE_EVAL_DIR` for a gitignored local directory outside worktrees when Wilson-labeled raw or staged outputs need to outlive normal interaction retention for calibration.

Eval artifacts are offline evidence, not runtime memory. The live app must not retrieve from `docs/evals/fixtures/`, private gold fixtures, eval reports, or admin eval rows while generating a user response. Real user examples may inform synthetic fixtures and generalized prompt lessons, but they must not become another user's prompt context or user-facing content.

Eval artifacts should preserve the user's point of view. Each fixture, report, or judge run should say which user expectation it is testing, such as time fit, dietary safety, pantry usefulness, skill fit, equipment fit, cuisine fit, cooking-step clarity, food safety, privacy, or workflow continuity. Contract-only fixtures are useful, but label them as contract guards rather than broad output-quality proof.

Future fixture batches should keep a compact value/evidence/limits note near the fixture or run record. The fixture file can stay focused on structured data; the PR, registry row, intake record, or fixture README should make clear whether the evidence proves a user expectation, operator confidence, future-agent coordination, or only foundation validity.

## What Does Not Live Here By Default

Do not commit raw trace exports, raw prompts containing user-identifying data, images, audio, secrets, auth data, or full production payloads without a durable privacy/source decision. Prefer summarized, redacted, or synthetic fixtures until that decision exists.

Do not copy private eval fixture content into PR comments, handoffs, CI logs, public reports, production prompts, or user-facing tables.

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
- Keep scope labels explicit. A speech or interaction eval seed can inform INIT-001 Phase 4 acceptance without becoming part of the active INIT-004 recipe/cooking-step eval harness.

## Practical Eval Loop

See [docs/workflows/evaluations.md](../workflows/evaluations.md) for the full durable process. In this directory:

1. Register the run/import/report in `registry.md`.
2. Normalize the intake under `intakes/` when it changes rubric, fixtures, metrics, reporting, or prompts.
3. Store only redacted, synthetic, or explicitly approved fixture data in repo.
4. Record harness commands, result artifact ids, report ids, and negative scope in the registry or matching intake.
5. Link prompt-candidate comparisons and daily reports back through this directory.
6. When executable tooling lands, document the exact command, required environment, output paths, and artifact-retention policy here.

Current fixture foundation command:

```bash
npx vitest run tests/unit/eval-fixtures.test.ts
```

This command validates the public fixture schema, deterministic structure/count/max-time checks, expected deterministic failures, public-fixture privacy guards, committed fixture loading, and the source-level guard that live generation modules do not read eval fixture stores.

Current limitation: most committed fixtures are foundation and contract guards. The max-time fixtures directly protect a user time expectation, while the Slop Bowl and cooking-step fixtures primarily protect current response usability. The next fixture batches should add Wilson-labeled user-expectation cases from Arize/EFF-022 seeds, especially food safety, skill fit, equipment fit, dietary compliance, pantry grounding, cuisine fit, and cooking-step sequence.

Future fixture-batch evidence should summarize:

- `Value claim`: the user expectation being protected.
- `Evidence`: the fixture, label, deterministic check, human review, or judge result that proves it.
- `Evidence limits`: what the fixture does not prove, especially live-provider quality or criteria not represented by the batch.

Current committed public fixture set:

- `openai-max-time-25-to-30`
- `synthetic-max-time-30-to-60`
- `slop-bowl-current-shape`
- `cooking-steps-generated-context`

## Current Related Initiative

- [INIT-004 - AI Output Quality Evals & Prompt Improvement](../../initiatives/INIT-004-ai-output-quality-evals.md)
