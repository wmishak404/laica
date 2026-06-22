# Local diagnostics sandbox

**Agent:** codex  
**Branch:** codex/setup-tools-privacy-copy  
**Date:** 2026-06-10  
**Initiative:** none  
**INIT updated:** n/a

## Summary

Local browser review hit known `.env` database drift: `/api/auth/session` failed before the Kitchen Inventory UI could be reviewed because the configured Neon database was missing current schema objects. This handoff records the new guardrail helper that lets local visual review and local Playwright use a separate prepared sandbox database instead of mutating the drifted/default `.env` DB.

## Changes

- `scripts/local-sandbox.ts` prepares a local diagnostic database by overriding `DATABASE_URL`, running `db:push -- --force`, running `db:health`, and then starting a caller-provided command.
- `package.json` adds `dev:sandbox`, `test:e2e:sandbox`, and `db:sandbox:prepare`.
- `docs/workflows/environment-map.md` documents the current environment inventory, database/auth paths, and when to use local sandbox versus CI/Replit.
- `docs/workflows/local-diagnostics-sandbox.md` documents visual-review, Playwright, and prepare-only commands.
- `docs/workflows/testing-and-acceptance.md` points stale local `.env` DB users to the sandbox helper instead of local `db:push`.
- `efforts/effort-010-local-db-schema-strategy.md` records this as a guardrail signal while keeping EFF-010 open.

## Impact on other agents

- Do not run `npm run db:push` against the decrypted `.env` database to unblock local browser review unless Wilson explicitly approves that specific database mutation.
- Use `LAICA_LOCAL_SANDBOX_DATABASE_URL` for a disposable/non-production database and set `LAICA_LOCAL_SANDBOX_CONFIRM_SCHEMA_PUSH=true` only when the target is safe to mutate.
- Treat local sandbox browser/E2E as diagnostic evidence unless the database is equivalent to the accepted CI non-production lane and the result is recorded with exact provenance.

## Open items

- This does not create Neon branches automatically. Someone still needs to provide a disposable sandbox database URL.
- See [`EFF-010`](../../efforts/effort-010-local-db-schema-strategy.md) for the broader ownership model: which local DB agents should use routinely, how branch cleanup works, and when schema mutation is allowed without Wilson intervention.

## Verification

- Safe-refusal checks passed with escalation for the Codex `tsx` IPC sandbox: missing `LAICA_LOCAL_SANDBOX_DATABASE_URL`, sandbox URL equal to `DATABASE_URL`, and missing `LAICA_LOCAL_SANDBOX_CONFIRM_SCHEMA_PUSH=true` all failed before any DB mutation.
- `npx vitest run tests/unit/user-profiling.test.tsx tests/unit/user-settings-scan-policy.test.tsx` passed.
- `npm run check` passed.
- `npm run build` passed with existing Vite warnings.
- `npm run test:unit` passed after updating two stale Planning Choice menu-copy assertions.
- `git diff --check` passed.
