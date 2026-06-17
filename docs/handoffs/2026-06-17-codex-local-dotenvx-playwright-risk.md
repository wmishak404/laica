# Local dotenvx and Playwright risk cleanup

**Agent:** codex
**Branch:** codex/init-001-recipe-preview-images
**Date:** 2026-06-17
**Initiative:** INIT-001 related
**INIT updated:** no — this changes local validation workflow for the INIT-001 branch, not INIT phase status or product behavior.

## Summary

This follow-up keeps INIT-001 provider-light browser validation from becoming a messy local dependency pile. The local path is now: install from `package-lock.json`, run secret-backed commands through repo scripts, use a disposable diagnostics database when schema needs to be prepared, and otherwise let GitHub CI own routine E2E evidence with Replit reserved for live provider/storage/domain seams.

## Changes

- `package.json` / `package-lock.json`: add `@dotenvx/dotenvx` as a lockfile-installed dev dependency plus `env:run`, `env:decrypt`, and `env:encrypt` scripts.
- `AGENTS.md`, `CLAUDE.md`, and `product-decisions/pd-001-secrets-management.md`: replace one-off `npx @dotenvx/dotenvx` local secret commands with repo-script commands.
- `docs/workflows/testing-and-acceptance.md`, `docs/workflows/local-diagnostics-sandbox.md`, `docs/workflows/environment-map.md`, and `docs/workflows/environment-parity-spec.md`: document the local E2E boundary, including the disposable sandbox path and the reason not to fetch executable code while secrets are decrypted.
- `product-decisions/features/mobile-refresh/pd-phase-03-1-recipe-imagery.md`: update INIT-001 Phase 3.1 validation status now that dotenvx is repo-pinned, while keeping local Playwright deferred without a disposable sandbox DB.
- `efforts/effort-017-environment-parity-and-ci-confidence.md`: record the local dotenvx runner hardening and keep CI as the preferred routine E2E lane.
- `efforts/effort-010-local-db-schema-strategy.md`: record that INIT-001 imagery Playwright should use the sandbox-or-CI path, not an arbitrary local `db:push`.

## Impact on other agents

Use `npm run env:run -- <command>` after `npm ci` for local secret-backed commands. Do not use ad hoc `npx @dotenvx/dotenvx run -- ...` when decrypted secrets are in scope.

For browser review or Playwright that needs current schema, first try `npm run db:health` against the default decrypted `.env` DB. If it fails, use `LAICA_LOCAL_SANDBOX_DATABASE_URL` plus `LAICA_LOCAL_SANDBOX_CONFIRM_SCHEMA_PUSH=true`, or skip local E2E and rely on CI `e2e_guest_smoke`.

## Open items

- Local provider-light Playwright for INIT-001 still needs a disposable/non-production DB URL if we want to run it locally with current schema.
- `.replit` still has its own documented dotenvx ambiguity in `docs/workflows/environment-parity-spec.md`; this cleanup does not change Replit startup behavior.
- Live OpenAI image generation and Replit App Storage persistence remain Replit/provider validation, not local evidence.

## Stack / base status

- Base refreshed: yes
- Current base: origin/main at `34f3613`
- Last Replit-validated at: not yet validated
- Notes: This branch is directly on current `origin/main` as of this handoff. Human Replit validation remains deferred to the INIT-001 risk lane.

## Verification

- `npm run check` passed.
- `npm run test:unit` passed: 42 files, 277 tests.
- `npm run build` passed with existing Vite warnings about stale Browserslist data, Firebase dynamic/static import chunking, and large chunks.
- `npm audit --audit-level=high` passed: 0 vulnerabilities found.
- `npm run env:run -- node -e "console.log('dotenvx-run-ok')"` passed and confirmed the repo script invokes lockfile-installed dotenvx without printing secret values.
- Local provider-light Playwright was not run because this thread does not have a disposable `LAICA_LOCAL_SANDBOX_DATABASE_URL`; CI `e2e_guest_smoke` remains the preferred repeatable E2E lane.
