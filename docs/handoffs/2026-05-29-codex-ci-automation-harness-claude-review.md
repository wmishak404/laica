# CI Guest-Lane Automation Harness — Claude Review Request

**Agent:** codex  
**Branch:** `codex/ci-automation-harness`  
**PR:** #109  
**Date:** 2026-05-29  
**Scope:** Automation harness + workflow/docs updates (does not change product UX directly)

## Summary

This PR implements the first concrete slice of EFF-017 (environment parity / CI confidence) without claiming to replace the Replit validation gate:

- Adds a **privacy-forward CI harness** that runs outside Replit using a dedicated **remote Neon test project** (schema-only branch per run).
- Adds a **guest-lane Playwright smoke** (Firebase anonymous) to avoid brittle Google OAuth popup automation while still exercising real client auth + backend token verification.
- Adds a **DB schema health preflight** (`npm run db:health`) to catch known drift vectors before tests run, so schema drift is not mistaken for product bugs.
- Refactors several unit tests to use an in-memory HTTP harness (no ephemeral TCP port binding), matching sandbox constraints and reducing flakiness.
- Updates durable docs (Testing/Acceptance workflow + EFF-010/EFF-017) to document the DB parity stance and the automation lane.

Local validation executed before pushing:
- `npm run check`
- `npm run build`
- `npm run test:unit`

## Grounding In Prior Bugs / Drifts (Why This Harness Exists)

This slice is explicitly shaped by past “manual Replit validation” findings and local-vs-Replit drift patterns:

- **DB schema drift** produced misleading failures (ex: missing `cooking_sessions.recipe_snapshot`, `ai_interactions`, `prompt_versions`; and now `anonymous_recipe_usage` exists as required schema for guest quota).
- **Auth-scoped client state/cache isolation** bugs: same-browser guest vs linked vs account-switch can leak planning/profile/history state unless cache keys are scoped by identity and legacy keys are cleared.
- **Server-owned gates** must be enforced client-side (ex: `/api/auth/session` is authoritative for anonymous-kill-switch and quota metadata; Firebase auth alone is not sufficient).
- **Limiter interactions** (rate-limit vs guest quota vs provider quota) can cause the wrong error to surface first and confuse acceptance.
- **Replit-only seams remain real**: authorized domains, App Check enforced mode, provider network access, deployment-domain OAuth posture.

This PR is an attempt to turn “we saw this manually” into **repeatable local/CI evidence** where safe.

## DB Strategy (Replit vs Automation)

Automation DB is **not identical** to Replit’s DB instance.

- Replit DB URLs are app-scoped and not externally connectable.
- CI/local automation uses a separate Neon test project with synthetic/disposable data.
- Parity target is **schema parity + behavioral parity**, not shared data.

Acceptance implication:
- CI must fail fast on schema drift (via `db:health`) instead of silently skipping DB-backed behavior.

## What Claude Should Review

Please review PR #109 with an “overall app surface” mindset, not just the parts we already fixed manually:

1. **Safety/privacy posture**
   - Does the CI workflow avoid production/Replit DB and real user data by construction?
   - Any secrets exposure risk (logs, env var printing, accidental uploads, etc.)?
2. **DB parity checks**
   - Is `scripts/db-schema-health.ts` checking the right baseline tables/columns for known drift?
   - Should requirements come from `shared/schema.ts` more directly, or is a curated allowlist appropriate?
3. **Unit test harness correctness**
   - `tests/unit/http-test-client.ts` emits a synthetic HTTP request into Node’s server “connection/request” lifecycle without binding a port.
   - Is this likely to diverge materially from real runtime semantics in ways that would invalidate tests?
4. **CI workflow gating**
   - E2E job is conditional on repo secrets/vars (and non-fork PRs).
   - Is the condition correct and minimal?
   - Are action versions (`actions/*@v6`, `neondatabase/*`) correct/real?
5. **E2E smoke scope**
   - The smoke is intentionally “guest lane + post-setup stability surface” (reaches the Planning choice).
   - Is this the right “first stable” target? Any obvious missing assertions that are low-flake/high-signal?
6. **Replit relationship**
   - Confirm we are not accidentally weakening Replit as the deployment-bound validation gate in docs/process.

## Notable Implementation Notes / Tradeoffs

- `server/rate-limit.ts` disables the two global `express-rate-limit` middlewares in `NODE_ENV=test` because they depend on real socket behavior.
  - Custom in-process rate limiting remains testable.
- The CI job currently requires `ELEVENLABS_API_KEY` even though the guest smoke does not call speech routes.
  - This may be over-constrained; call out if you think we should decouple it.

## Files

High-signal files to focus on:

- `.github/workflows/ci.yml`
- `scripts/db-schema-health.ts`
- `tests/e2e/cooking-workflow.test.ts`
- `tests/unit/http-test-client.ts`
- `server/rate-limit.ts`
- `docs/workflows/testing-and-acceptance.md`
- `efforts/effort-010-local-db-schema-strategy.md`
- `efforts/effort-017-environment-parity-and-ci-confidence.md`

