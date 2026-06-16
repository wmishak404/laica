# Public Eval Fixtures

This directory is the canonical repo home for public INIT-004 regression fixtures.

Commit only synthetic or reviewed redacted `.json` fixtures that pass the Phase 3 fixture schema and privacy checks. Raw real examples and Wilson private gold fixtures belong outside git under `LAICA_PRIVATE_EVAL_DIR`, not in this directory.

Current harness command:

```bash
npx vitest run tests/unit/eval-fixtures.test.ts
```

The first Phase 3 foundation slice intentionally adds schema/loading and deterministic contract checks before committing fixture data or running provider judges.
