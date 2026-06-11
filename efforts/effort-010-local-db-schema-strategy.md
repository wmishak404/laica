# EFF-010 — Local database schema strategy

**Former ID:** EPIC-010
**Status:** Open
**Owner:** Wilson / Codex / Claude
**Created:** 2026-04-27
**Updated:** 2026-05-29

## One-line summary

Define and implement a reliable local database workflow so macOS agent worktrees can validate service-backed features without stale Neon schema drift getting mixed up with product bugs.

## Context — why this exists

Local Slop Bowl validation surfaced an old local Neon schema:

- `cooking_sessions.recipe_snapshot` was missing, which broke profile load and Slop Bowl recent-history reads.
- `ai_interactions` was missing, which made eval logging fail after successful recipe generation.

These were not Slop Bowl product bugs. They were local-environment drift: the code expected the current schema, while the local database was behind. PD-008 now defines how optional context can degrade gracefully, but graceful degradation is not a full local database strategy.

This local DB issue has been referenced before:

- `docs/handoffs/2026-04-10-claude-slop-bowl-replit-merge.md`
- `product-decisions/features/slop-bowl/pd-phase-04-implementation-polish.md`
- `product-decisions/pd-008-optional-context-and-local-validation-boundaries.md`

Until this is resolved, local agents can waste time debugging environment drift instead of feature behavior.

## Scope

### In scope

- Decide the canonical local database model for Codex/Claude worktrees.
- Decide when agents may run `npm run db:push`, and against which database.
- Decide whether each worktree gets its own Neon branch/database, or whether all local work shares one dev database.
- Define how local `.env.keys` / `DATABASE_URL` should be copied or symlinked into Codex worktrees without committing secrets.
- Define a quick schema-health check for local validation before testing DB-backed features.
- Document how local validation differs from Replit validation.

### Out of scope

- Replacing Replit as the primary deployment and validation environment.
- Designing a full migration platform beyond the current Drizzle/Neon workflow.
- Automatically mutating production or shared Replit databases from local agents.
- Changing feature behavior solely to hide required database failures.

## Decisions made so far

- **Replit remains authoritative for deployment-bound validation.** Local DB work should support faster iteration, not replace the Replit validation gate.
- **Local schema drift is an environment problem.** Feature code can gracefully degrade around optional context, but required persistence and schema correctness still need a reliable local workflow.
- **Agents should not run `db:push` casually against an unknown shared DB.** The workflow needs ownership boundaries before schema mutation becomes routine.
- **Mobile refresh interim policy:** Phase 5 schema changes are documented, but local agents should not run `npm run db:push` against shared dev or Replit databases. Schema pushes for this feature happen through the Replit-authoritative path until this Effort resolves.

## Open questions

- Should each feature branch/worktree use a dedicated Neon branch/database, or should there be one shared local dev database?
- Should `npm run db:push` be allowed by agents when `DATABASE_URL` points to an explicitly named local/dev database?
- What command should agents run to verify schema health before local service-backed testing?
- Should schema drift warnings become part of app startup in local development?
- How should `.env.keys` be provisioned for new Codex worktrees so dotenvx local dev starts without manual repair?

## Agent checklist — when to read this Effort

Read EFF-010 before starting any of the following:

- [ ] Running or recommending `npm run db:push`
- [ ] Changing Drizzle schemas or DB-backed persistence paths
- [ ] Setting up full local dev with `DATABASE_URL`
- [ ] Debugging local-only DB failures
- [ ] Changing `AGENTS.md`, ADRs, handoffs, or product decisions about local-vs-Replit validation
- [ ] Adding schema-health checks or local setup scripts

When this applies, also cite the [Testing and Acceptance Workflow](../docs/workflows/testing-and-acceptance.md) if the work changes validation expectations, and cite PD-008 if the work distinguishes required data from optional context.

## Resolution criteria — what "done" looks like

This Effort is `Resolved` when all of the following are true:

1. A durable local database workflow is documented in an ADR or product decision.
2. Agents know which database a Codex worktree should use for local service-backed validation.
3. Agents know when `npm run db:push` is allowed and when human/Replit review is required.
4. New Codex worktrees can get dotenvx secrets without manually rediscovering `.env.keys` symlink setup.
5. A lightweight schema-health check exists or is documented before local DB-backed feature testing.
6. Replit remains the final validation gate for deployment-bound auth, DB, AI, and speech flows.

## Linked artifacts

- `product-decisions/pd-008-optional-context-and-local-validation-boundaries.md`
- `product-decisions/features/mobile-refresh/pd-phase-05-post-cook.md`
- `docs/workflows/testing-and-acceptance.md`
- `docs/adr/0001-replit-primary-local-agents.md`
- `docs/handoffs/2026-04-10-claude-slop-bowl-replit-merge.md`
- `docs/handoffs/2026-04-27-codex-slop-bowl-sparse-pantry-guard.md`

## 2026-04-28 — Mobile refresh interim schema ruling

Phase 5 introduces pending-cleanup and taste-signal persistence on cooking sessions. The feature docs preserve the schema requirement but explicitly defer local `db:push` until the local DB strategy is resolved. Implementation branches should coordinate schema pushes through Replit and document the Replit validation result before merge.

## 2026-05-12 — Weekly hygiene audit

Reviewed against `docs/workflows/environment-parity-spec.md`, `efforts/effort-017-environment-parity-and-ci-confidence.md`, `docs/adr/0001-replit-primary-local-agents.md`, PD-008, and INIT-002's future DB phase. Keep this as an active standalone Effort: the parity spec is still draft, EFF-017 is deferred, and no durable ADR/PD has selected the local database model, `db:push` permission boundary, `.env.keys` provisioning path, or schema-health check required by this Effort's resolution criteria.

## 2026-05-26 — INIT-003 local anonymous smoke exposed prompt/eval table drift

Local smoke testing for INIT-003 PR #102 at `c952d13` successfully exercised the anonymous happy path from `Start cooking now` through guest setup, recipe suggestions, prep tray, and live cooking guide. The user-facing AI routes returned `200`, but the local server logged missing-table errors for `prompt_versions` and `ai_interactions` while loading optional active prompts and writing optional eval logs.

This is new evidence for EFF-010, not an INIT-003 blocker:

- The Replit validation gate remained authoritative for merge readiness.
- Local route behavior degraded successfully because prompt lookup and eval logging are optional around the user-facing recipe/cooking responses.
- The warnings still make local validation noisy and can distract agents from the actual feature under test.
- Do not run `npm run db:push` from arbitrary local worktrees to fix this until EFF-010 resolves the local database ownership model.

Follow-up requirements reinforced by this run:

- A schema-health check should cover `prompt_versions` and `ai_interactions` in addition to feature-owned tables.
- The local DB workflow must define whether a Codex worktree points at a dedicated Neon branch/database or a shared dev database before agents mutate schema.
- Optional prompt/eval logging should either keep its current graceful degradation with clearer local-only diagnostics or gain an explicit startup/schema-health warning so stack traces do not look like product regressions.

## 2026-05-27 — INIT-003 production gates add anonymous quota schema

`codex/init-003-production-gates` adds a new Drizzle table, `anonymous_recipe_usage`, for public guest recipe quota accounting. This is feature-required schema, not a local schema-strategy resolution: the branch deliberately did not run `npm run db:push` locally, and Replit remains the authoritative place to apply/validate the schema before merge.

New EFF-010 signal:

- The eventual schema-health check should include `anonymous_recipe_usage` alongside `prompt_versions`, `ai_interactions`, and other feature-owned persistence tables.
- Replit validation for INIT-003 must confirm the table exists before testing anonymous quota exhaustion; a missing table would be environment/schema drift, not evidence that the quota route logic is optional.
- The local DB workflow still needs an ownership model before agents mutate schemas from arbitrary worktrees.

## 2026-05-29 — INIT-003 quota schema validated in Replit before merge

PR #107 merged as `a0efc43` after Wilson confirmed `anonymous_recipe_usage` existed in Replit and validated the real anonymous quota path, including the `#11` `LINKED_ACCOUNT_REQUIRED` response. This resolves the INIT-003 merge gate, but it does not resolve EFF-010: the Replit-side helper was a project-authoritative runtime action, not a general local schema workflow for arbitrary Codex/Claude worktrees.

EFF-010 should still include `anonymous_recipe_usage` in the future schema-health check and still define when local agents may mutate a database. Until then, do not use the successful Replit validation from PR #107 as permission to run local `npm run db:push` from unrelated worktrees.

## 2026-05-29 — Remote Neon test DB for automation (no Docker)

To reduce manual Replit validation load without reusing Replit's internal DB, the automation direction is a **dedicated remote Neon test project** that CI and local agents can connect to via `DATABASE_URL`.

This is intentionally **not identical** to Replit's database instance:

- Replit databases are app-scoped and not externally connectable by design (see EFF-017 provenance links).
- The automation DB is a separate instance with **no production data** and **no Replit user data**.

Parity requirement:

- **Schema parity must match** `shared/schema.ts` (same tables/columns/constraints that runtime expects).
- Data parity is not required; test data should be synthetic and disposable.

Operational model (privacy-forward):

- Prefer **schema-only** Neon branches per CI run (clean, isolated, and no data copied).
- Never point automation at Replit DB URLs or production DB URLs.

Checks to cover the drift bases this Effort exists for:

- A preflight check that the DB schema contains the required baseline tables and columns (at minimum `cooking_sessions.recipe_snapshot`, `ai_interactions`, and `prompt_versions` since these have already drifted in local validation).
- A startup failure must remain loud when `DATABASE_URL` is missing (required dependency), but optional-context table misses should remain clearly classified per PD-008 (warn + degrade, not "mystery failures").

## 2026-06-01 — PR #109 merged schema-health tooling for CI

PR #109 merged the first automated DB-drift guardrail: `npm run db:health` plus a GitHub Actions path that creates a schema-only Neon branch, applies `drizzle-kit push`, and runs the health check before the guest E2E smoke.

This partially satisfies the schema-health portion of this Effort, but it does not resolve the local DB strategy:

- The GitHub E2E path still requires repo configuration (`NEON_PROJECT_ID` and required secrets) before it runs.
- The dedicated automation database remains separate from Replit's app-scoped DB and must use synthetic data only.
- Agents still do not have general permission to run `npm run db:push` against arbitrary local/shared databases.
- The broader ownership model for Codex worktree `DATABASE_URL`, `.env.keys` provisioning, and local service-backed validation remains open.

## 2026-06-10 — Local diagnostics sandbox guardrail

Local browser review for the Kitchen Inventory branch hit the known drift class again: `/api/auth/session` failed because the decrypted `.env` database was missing `anonymous_recipe_usage`; `npm run db:health` also reported missing `ai_interactions`, `prompt_versions`, and `cooking_sessions.recipe_snapshot`.

Follow-up added a guarded local helper rather than mutating the drifted `.env` database:

- `scripts/local-sandbox.ts` requires `LAICA_LOCAL_SANDBOX_DATABASE_URL` and refuses to run if it equals `DATABASE_URL`.
- The helper requires `LAICA_LOCAL_SANDBOX_CONFIRM_SCHEMA_PUSH=true` before running `drizzle-kit push --force`.
- `npm run dev:sandbox`, `npm run test:e2e:sandbox`, and `npm run db:sandbox:prepare` provide the local workflow.
- `docs/workflows/local-diagnostics-sandbox.md` documents the visual-review and Playwright commands.
- `docs/workflows/environment-map.md` records the broader human-review map of environments, databases, auth paths, and when local sandbox is worth using versus CI/Replit.

This improves the local diagnostic path but does not resolve this Effort. The unresolved ownership question remains: which database or Neon project/branch agents should use routinely, and when schema mutation is allowed without Wilson intervention.
