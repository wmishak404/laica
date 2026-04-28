# EPIC-010 — Local database schema strategy

**Status:** Open
**Owner:** Wilson / Codex / Claude
**Created:** 2026-04-27
**Updated:** 2026-04-28

## One-line summary

Define and implement a reliable local database workflow so macOS agent worktrees can validate service-backed features without stale Neon schema drift getting mixed up with product bugs.

## Context — why this exists

Local Slop Bowl validation surfaced an old local Neon schema:

- `cooking_sessions.recipe_snapshot` was missing, which broke profile load and Slop Bowl recent-history reads.
- `ai_interactions` was missing, which made eval logging fail after successful recipe generation.

These were not Slop Bowl product bugs. They were local-environment drift: the code expected the current schema, while the local database was behind. PD-008 now defines how optional context can degrade gracefully, but graceful degradation is not a full local database strategy.

This local DB issue has been referenced before:

- `docs/handoffs/2026-04-10-claude-slop-bowl-replit-merge.md`
- `product-decisions/features/slop-bowl/phase-04-implementation-polish.md`
- `product-decisions/008-optional-context-and-local-validation-boundaries.md`

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
- **Mobile refresh interim policy:** Phase 5 schema changes are documented, but local agents should not run `npm run db:push` against shared dev or Replit databases. Schema pushes for this feature happen through the Replit-authoritative path until this epic resolves.

## Open questions

- Should each feature branch/worktree use a dedicated Neon branch/database, or should there be one shared local dev database?
- Should `npm run db:push` be allowed by agents when `DATABASE_URL` points to an explicitly named local/dev database?
- What command should agents run to verify schema health before local service-backed testing?
- Should schema drift warnings become part of app startup in local development?
- How should `.env.keys` be provisioned for new Codex worktrees so dotenvx local dev starts without manual repair?

## Agent checklist — when to read this epic

Read EPIC-010 before starting any of the following:

- [ ] Running or recommending `npm run db:push`
- [ ] Changing Drizzle schemas or DB-backed persistence paths
- [ ] Setting up full local dev with `DATABASE_URL`
- [ ] Debugging local-only DB failures
- [ ] Changing `AGENTS.md`, ADRs, handoffs, or product decisions about local-vs-Replit validation
- [ ] Adding schema-health checks or local setup scripts

When this applies, also cite EPIC-005 if the work changes validation expectations, and cite PD-008 if the work distinguishes required data from optional context.

## Resolution criteria — what "done" looks like

This epic is `Resolved` when all of the following are true:

1. A durable local database workflow is documented in an ADR or product decision.
2. Agents know which database a Codex worktree should use for local service-backed validation.
3. Agents know when `npm run db:push` is allowed and when human/Replit review is required.
4. New Codex worktrees can get dotenvx secrets without manually rediscovering `.env.keys` symlink setup.
5. A lightweight schema-health check exists or is documented before local DB-backed feature testing.
6. Replit remains the final validation gate for deployment-bound auth, DB, AI, and speech flows.

## Linked artifacts

- `product-decisions/008-optional-context-and-local-validation-boundaries.md`
- `product-decisions/features/mobile-refresh/phase-05-post-cook.md`
- `epics/005-testing-strategy-and-acceptance-criteria.md`
- `docs/adr/0001-replit-primary-local-agents.md`
- `docs/handoffs/2026-04-10-claude-slop-bowl-replit-merge.md`
- `docs/handoffs/2026-04-27-codex-slop-bowl-sparse-pantry-guard.md`

## 2026-04-28 — Mobile refresh interim schema ruling

Phase 5 introduces pending-cleanup and taste-signal persistence on cooking sessions. The feature docs preserve the schema requirement but explicitly defer local `db:push` until the local DB strategy is resolved. Implementation branches should coordinate schema pushes through Replit and document the Replit validation result before merge.
