# Testing and Acceptance Workflow

## Operating Principles

Follow [operating-principles.md](operating-principles.md): evidence first, no unsupported assumptions, objective detail, visible rationale and provenance, feedback from first principles, no hacks or duplicate paths, deletion of obsolete paths, explicit decisions, and blocking reports with exact missing inputs and smallest next actions.

This workflow defines how agents decide whether a Laica change is ready to merge, where acceptance criteria live, and how validation evidence is recorded.

## Plain-English Rule

Every change should say what it was expected to prove, what was actually checked, what remains unvalidated, and whether Replit validation is still required.

## Source of Truth

| Need | Durable home |
|---|---|
| Feature acceptance criteria | Relevant feature phase record in `product-decisions/features/<feature>/` |
| Initiative status, current phase, PR/branch state, and validation state | Relevant `initiatives/INIT-*.md` |
| Stable cross-feature testing rule or workflow | `docs/workflows/` or a top-level PD |
| Point-in-time command output, manual checks, and branch status | PR description and `docs/handoffs/` |
| Replit validation focus by drift vector | [`docs/workflows/replit-validation-focus.md`](replit-validation-focus.md) |
| Local-vs-Replit authority | [`docs/adr/0001-replit-primary-local-agents.md`](../adr/0001-replit-primary-local-agents.md), `AGENTS.md`, and `CLAUDE.md` |
| Cross-doc routing and closeout | [`docs/workflows/documentation-routing.md`](documentation-routing.md) |

Do not use an Effort file as the long-term ledger for every feature's validation history.

## Default Validation Matrix

| Change type | Minimum local checks | Replit validation |
|---|---|---|
| Docs-only | `git diff --check` | Not required |
| Pure frontend copy/layout with no service behavior | `npm run check`, `npm run build` when practical; targeted visual/manual review | Required if deployment-bound visuals or auth-gated flows must be inspected live |
| Client logic or shared user-flow state | `npm run check`, `npm run build`, targeted Vitest/Playwright when existing coverage matches | Required when auth, persistence, AI, speech, or real browser/mobile behavior is part of acceptance |
| Server route, shared schema, auth, DB, AI, speech, or feedback writes | `npm run check`, `npm run build`, targeted tests | Required before merge unless explicitly documented as docs-only or non-deployment-bound |
| DB schema or migration workflow | Local static/build checks plus schema review | Required; coordinate schema push through the Replit-authoritative path |
| Workflow/process docs | `git diff --check` and link/reference search | Not required |

## Feature Impact Review

Before locking direction for a feature enhancement, review the adjacent system surfaces it may affect:

- User-facing copy and error-message taxonomy.
- Parser/body limits, upload limits, request size limits, and rate limits.
- Auth, ownership, persistence, and valid empty states.
- In-flight async work, Back/cancel behavior, stale-result handling, and navigation away from the surface.
- Related INITs, active Efforts, PDs, workflow docs, and phase records.
- Telemetry/privacy rules, especially [`PD-010`](../../product-decisions/pd-010-ai-error-telemetry-allowlist.md) for AI error logging.
- Settings/setup parity, post-cook or future rescan implications, and any sibling surfaces that share the same component or API.

The scan upload policy review that produced [`PD-011`](../../product-decisions/pd-011-scan-upload-photo-limit-policy.md) is the model: it considered scan copy, route limits, image-count rate limits, telemetry allowlists, Settings behavior, empty-Pantry state, active-scan cancellation, and related Efforts before the policy was accepted.

## Required Handoff / PR Verification Notes

Every implementation handoff and PR description should include:

- Commands run and whether they passed.
- Manual checks performed.
- Replit validation status, including `Last Replit-validated at: <sha>` or `not yet validated` for deployment-bound work.
- What was intentionally not tested.
- Any accepted deferrals and where they are tracked.
- Whether docs were updated: INIT, feature phase record, PD, active Effort, workflow doc, and handoff as applicable.

Before closeout, use [`documentation-routing.md`](documentation-routing.md) to choose the smallest durable doc home and update only the indexes/read lists whose source-of-truth status changed.

## Resolved Effort History

This workflow graduates the useful parts of former EFF-005 and EFF-020:

- Former EFF-005 asked for an app-wide testing strategy and acceptance criteria workflow.
- Former EFF-020 asked where workflow documentation, Feature Impact Review, and validation evidence should live.

Both are now resolved as standalone Efforts. Future changes should update this workflow, the Replit validation focus guide, or the relevant INIT/phase record instead of reopening those Efforts.
