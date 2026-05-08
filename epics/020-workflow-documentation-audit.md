# EPIC-020 - Workflow documentation audit and graduation

**Status:** Open
**Owner:** Wilson / Codex / Claude
**Created:** 2026-05-08

## One-line summary

Audit Laica's agent and product workflow documentation, decide which workflows deserve central durable docs, and graduate EPIC-005's testing/acceptance work without losing historical context.

## Context

During Mobile Refresh Phase 3.2 closeout, Wilson asked whether [EPIC-005](005-testing-strategy-and-acceptance-criteria.md) had become redundant because acceptance criteria and validation state now mostly live in more durable homes:

- Feature acceptance criteria live in feature phase records under `product-decisions/features/<feature>/`.
- Initiative validation state lives in `initiatives/INIT-*.md`.
- Point-in-time verification lives in PR descriptions and `docs/handoffs/`.
- Replit validation focus lives in `docs/workflows/replit-validation-focus.md`.
- Local-vs-Replit authority lives in `AGENTS.md` and `docs/adr/0001-replit-primary-local-agents.md`.

The audit found that EPIC-005 should stop collecting detailed feature-by-feature validation history, but should not be resolved until a central testing/acceptance workflow exists and the active references are repointed. Wilson also asked whether other repeatable workflows deserve the same treatment before the project keeps adding narrow process notes ad hoc.

This epic captures that broader workflow-documentation cleanup so Phase 3.2 can close without becoming the place where the whole documentation system is redesigned.

## Scope

### In scope

- Audit existing workflow/process docs and decide which are canonical, overlapping, stale, or missing.
- Create or update a central testing and acceptance workflow, likely `docs/workflows/testing-and-acceptance.md` or a top-level process PD.
- Graduate [EPIC-005](005-testing-strategy-and-acceptance-criteria.md) once the testing workflow has a durable home.
- Decide whether additional workflow docs are needed for:
  - branch ownership, stacking, rebasing, and PR validation SHA hygiene
  - Replit validation request construction and service-backed smoke testing
  - feature phase records, product decisions, and promotion from phase docs to top-level PDs
  - INIT lifecycle, registry upkeep, and post-merge closeout
  - epic lifecycle, registry upkeep, and epic-to-PD graduation
  - handoff writing, PR description structure, and cross-agent transfer
  - UI governance and visual acceptance routing between `design_guidelines.md`, PD-005, and phase records
  - local dev, dotenvx secrets, and environment parity boundaries
  - database schema change workflow and local DB drift handling
  - release/deployment sync from GitHub to Replit
- Fix known workflow-index drift discovered during the Phase 3.2 audit, including stale initiative registry entries when confirmed.
- Update `AGENTS.md`, `CLAUDE.md`, `epics/README.md`, `epics/registry.md`, and cross-links after decisions are made.

### Out of scope

- Blocking Mobile Refresh Phase 3.2 validation or merge.
- Implementing new test harnesses, CI pipelines, schema tooling, or deployment automation as part of the audit itself.
- Replacing Replit as the authoritative service-backed validation environment.
- Rewriting every historical handoff or phase record.
- Closing active domain epics whose product or technical scope remains unresolved.

## Existing workflow map

Use this map as the starting point for the future audit. It records what we already know so another session does not need to rediscover it from chat.

| Workflow area | Current durable homes | Current issue |
|---|---|---|
| Testing and acceptance | [EPIC-005](005-testing-strategy-and-acceptance-criteria.md), `docs/workflows/replit-validation-focus.md`, feature phase records, `AGENTS.md`, ADR-0001 | EPIC-005 still asks where criteria belong even though newer docs mostly answered it. Needs graduation to a central workflow doc or PD. |
| Replit/local authority | `AGENTS.md`, `CLAUDE.md`, `docs/adr/0001-replit-primary-local-agents.md`, `docs/workflows/replit-validation-focus.md`, `docs/workflows/environment-parity-spec.md` | Multiple docs are valid but overlapping. Audit should clarify entrypoint vs reference docs. |
| Branch stacking and validation SHA hygiene | `AGENTS.md`, `CLAUDE.md`, `docs/handoffs/README.md`, ADR-0001 | Rules exist and are working. Future workflow doc may just point to them rather than duplicate. |
| Handoffs and PR descriptions | `docs/handoffs/README.md`, `AGENTS.md`, `CLAUDE.md` | Durable enough, but may need template alignment after testing workflow graduation. |
| Product decisions and feature phase records | [PD-004](../product-decisions/004-feature-phase-records.md), `product-decisions/README.md`, `product-decisions/features/README.md` | Roles are mostly clear. Audit should ensure agents know phase docs own acceptance criteria. |
| INIT lifecycle | `initiatives/README.md`, `initiatives/registry.md`, `AGENTS.md`, `CLAUDE.md` | Rules are clear, but registry drift was found during Phase 3.2. Audit should add a drift check habit. |
| Epic lifecycle | [PD-007](../product-decisions/007-epic-status-and-registry-workflow.md), `epics/README.md`, `epics/registry.md` | Rules are clear. This epic should use the existing closeout process when it resolves EPIC-005. |
| UI governance and visual acceptance | [PD-005](../product-decisions/005-ui-governance.md), `design_guidelines.md`, feature phase records | This was already graduated out of active epics; do not re-open as an active epic unless enforcement work changes. |
| Secrets and local dev | [PD-001](../product-decisions/001-secrets-management.md), `AGENTS.md`, `CLAUDE.md`, ADR-0001 | Mostly documented. Environment parity work may still need sharper workflow entrypoints. |
| Database schema workflow | [EPIC-010](010-local-db-schema-strategy.md), `docs/workflows/environment-parity-spec.md`, [PD-008](../product-decisions/008-optional-context-and-local-validation-boundaries.md) | Still active/open; keep schema workflow work with EPIC-010 unless the audit only links to it. |
| Environment parity and CI confidence | [EPIC-017](017-environment-parity-and-ci-confidence.md), `docs/workflows/environment-parity-spec.md` | Deferred until after INIT-001; audit should not accidentally reactivate implementation scope. |

## Decisions made so far

- Do not treat EPIC-005 as the long-term ledger for every feature's acceptance criteria.
- Do not resolve EPIC-005 until its remaining useful policy has a durable home and references are repointed.
- Prefer central workflow docs for repeatable operating procedures, and use top-level PDs for stable decisions behind those procedures.
- Preserve feature-specific criteria in feature phase records; preserve current validation status in INITs; preserve run evidence in handoffs and PR descriptions.
- Keep this broader workflow audit separate from Phase 3.2 implementation so the feature can finish validation and merge.

## Open questions

1. Should the central testing/acceptance artifact be a workflow doc, a top-level process PD, or both?
2. What is the final validation matrix by change type?
3. Should `package.json` add standard scripts such as `test`, `test:unit`, `test:e2e`, or should targeted `npx vitest` commands remain phase-specific for now?
4. Which workflow docs should be entrypoints versus deep references?
5. How much should `AGENTS.md` and `CLAUDE.md` duplicate versus link to central workflow docs?
6. Should there be a lightweight periodic docs-registry drift check for `initiatives/registry.md` and `epics/registry.md`?
7. Which workflow gaps should become implementation epics instead of remaining documentation cleanup?

## Agent checklist - when to read this epic

Read this epic before:

- Creating or reorganizing files under `docs/workflows/`.
- Resolving, superseding, or substantially rewriting EPIC-005.
- Changing where acceptance criteria, validation state, or verification evidence are supposed to live.
- Updating `AGENTS.md`, `CLAUDE.md`, handoff conventions, PR templates, or workflow references across multiple docs.
- Creating a new process/governance PD for testing, validation, branching, handoffs, INITs, epics, release, or environment parity.
- Auditing stale entries in `initiatives/registry.md` or `epics/registry.md` as part of workflow cleanup.

When this epic applies, cite it in the handoff and describe whether the work conforms to the existing documentation hierarchy, graduates a workflow, or adds a new workflow candidate.

## Resolution criteria

This epic is `Resolved` when all of the following are true:

1. The repo has a central, durable testing/acceptance workflow or process PD that answers EPIC-005's remaining open questions.
2. EPIC-005 is marked `Resolved`, removed from the active read list, and updated with a final resolution note pointing to the new durable artifact.
3. `AGENTS.md`, `CLAUDE.md`, `docs/handoffs/README.md`, `product-decisions/README.md`, `product-decisions/features/README.md`, and relevant workflow docs agree on where acceptance criteria, validation state, and verification evidence live.
4. `epics/README.md` and `epics/registry.md` are updated for EPIC-005 and EPIC-020 status.
5. Known registry drift found during the Phase 3.2 audit is corrected or explicitly deferred with owner and reason.
6. The audit either creates/update central workflow docs for other accepted workflow areas or records why existing docs are sufficient.
7. A handoff records the final workflow map, changed files, remaining deferrals, and verification performed.

## Linked artifacts

- [EPIC-005 - App-wide testing strategy and acceptance criteria workflow](005-testing-strategy-and-acceptance-criteria.md)
- [EPIC-010 - Local database schema strategy](010-local-db-schema-strategy.md)
- [EPIC-017 - Environment parity + CI confidence](017-environment-parity-and-ci-confidence.md)
- [PD-004 - Feature Phase Decision Records](../product-decisions/004-feature-phase-records.md)
- [PD-005 - UI Governance Operating Model](../product-decisions/005-ui-governance.md)
- [PD-007 - Epic status and registry workflow](../product-decisions/007-epic-status-and-registry-workflow.md)
- [PD-008 - Optional context and local validation boundaries](../product-decisions/008-optional-context-and-local-validation-boundaries.md)
- [ADR-0001 - Replit-primary with local agent workflow](../docs/adr/0001-replit-primary-local-agents.md)
- [Replit Validation Focus Guide](../docs/workflows/replit-validation-focus.md)
- [Environment Parity Spec](../docs/workflows/environment-parity-spec.md)
- [Handoff convention](../docs/handoffs/README.md)
- [INIT system](../initiatives/README.md)

## 2026-05-08 - Epic filed from Phase 3.2 closeout

Wilson and Codex audited whether EPIC-005 was redundant while preparing to close Phase 3.2. The answer was: redundant as a feature-validation ledger, not yet redundant as an unresolved testing-governance epic. This epic was filed to carry the broader workflow-documentation audit into a separate session and keep Phase 3.2 focused on product validation.
