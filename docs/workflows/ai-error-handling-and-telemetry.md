# AI Error Handling and Telemetry Workflow

This workflow tells agents where AI error UX, logging, privacy, and eval-monitoring work lives after the former telemetry Effort was closed.

## Plain-English Rule

User-facing AI error handling belongs with the feature or route being changed. Operational AI error logging belongs to INIT-002 and must follow the PD-010 allowlist before any data is stored.

## Source of Truth

| Need | Durable home |
|---|---|
| Active telemetry implementation phases | [`INIT-002`](../../initiatives/INIT-002-ai-error-telemetry.md) |
| Redaction allowlist and forbidden fields | [`PD-010`](../../product-decisions/pd-010-ai-error-telemetry-allowlist.md) |
| Resolved authenticated-app error UX history | [`EFF-018`](../../efforts/effort-018-authenticated-ai-error-handling.md) |
| Local DB/schema push boundaries | [`EFF-010`](../../efforts/effort-010-local-db-schema-strategy.md) |
| Replit validation focus | [`replit-validation-focus.md`](replit-validation-focus.md) |
| Mobile Refresh AI privacy baseline | [`pd-cross-phase-ai-privacy.md`](../../product-decisions/features/mobile-refresh/pd-cross-phase-ai-privacy.md) |

## Agent Workflow

Before adding AI error logging, admin APIs, eval-cluster handling, or Feedback correlation:

1. Read INIT-002 for the current phase and resume point.
2. Read PD-010 and confirm the intended fields are allowlisted.
3. Confirm no raw prompts, preferences, model messages, headers, images, audio, cookies, tokens, stack traces with bodies, or arbitrary JSON blobs will be logged or persisted.
4. If schema work is involved, read EFF-010 and coordinate Replit-authoritative `db:push` instead of pushing casually from a local worktree.
5. Record local checks, Replit validation focus, and redaction evidence in the handoff and PR description.

## Taxonomy Boundary

- User-facing copy should stay plain-English, first-person, and authenticated-app appropriate.
- Classifiers should preserve enough route/status/error-class signal to debug recurring failures.
- Logs and DB rows should store derived metrics and allowlisted classifications, not user free text.
- Eval cases should be recreated from safe cluster signals, not by recovering private user inputs.

## Resolved Effort History

Former EFF-019 is resolved as a standalone Effort. The work is not cancelled; it now lives in INIT-002, PD-010, and this workflow so agents do not split telemetry governance between a backlog file and the active initiative.
