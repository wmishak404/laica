# Public Eval Fixtures

This directory is the canonical repo home for public INIT-004 regression fixtures.

Commit only synthetic or reviewed redacted `.json` fixtures that pass the Phase 3 fixture schema and privacy checks. Raw real examples and Wilson private gold fixtures belong outside git under `LAICA_PRIVATE_EVAL_DIR`, not in this directory.

Committed public fixture set:

- `openai-max-time-25-to-30.json` - synthetic current-shape recipe-suggestion boundary pass for the accepted +15 minute max-time band.
- `synthetic-max-time-30-to-60.json` - synthetic pantry-recipes true negative where one 60-minute suggestion exceeds a 30-minute request plus the +15 minute band.
- `slop-bowl-current-shape.json` - synthetic positive guard for the current Slop Bowl `{ recipe }` response contract.
- `cooking-steps-generated-context.json` - synthetic positive guard for cooking steps generated from full recipe context.

Expected deterministic failures are allowed only when the matching resolved criterion label is also `fail`. Fixture schema, privacy class, privacy scan, output-required, and deterministic label expectation failures still make the artifact invalid.

When adding or materially changing fixtures, keep the fixture data readable and put the value framing in the PR, registry/intake record, or this README:

- `Value claim`: the user expectation, operator confidence, or future-agent coordination value protected.
- `Evidence`: the fixture id, label/check, and observed result that support the claim.
- `Evidence limits`: what this fixture does not prove, such as live model quality, taste, food safety, cuisine fit, or private-gold coverage.

Current harness command:

```bash
npx vitest run tests/unit/eval-fixtures.test.ts
```

This command validates the public fixture schema, deterministic structure/count/max-time checks, expected deterministic failures, public-fixture privacy guards, committed fixture loading, and the source-level guard that live generation modules do not read eval fixture stores.

These fixtures are offline regression artifacts only. They do not run provider judges, change prompts, activate prompt versions, ingest private fixtures, write eval rows, or represent production-quality rates.
