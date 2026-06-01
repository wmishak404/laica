# Testing and Acceptance Workflow

## Operating Principles

Follow [operating-principles.md](operating-principles.md): evidence first, no unsupported assumptions, objective detail, visible rationale and provenance, feedback from first principles, no hacks or duplicate paths, deletion of obsolete paths, explicit decisions, and blocking reports with exact missing inputs and smallest next actions.

This workflow defines how agents decide whether a Laica change is ready to merge, where acceptance criteria live, and how validation evidence is recorded.

## Plain-English Rule

Every change should say what it was expected to prove, what was actually checked, what remains unvalidated, and whether Replit validation is still required.

## Validation Breadth Discipline

For every implementation change, test the happy path and then deliberately look for corner cases across the surfaces touched by the change. Do not stop at "works locally" when the acceptance criteria depend on auth, persistence, AI, speech, uploads, provider secrets, deployment domains, or Replit-only configuration.

Start from documented specs. The acceptance criteria, INIT, PD, feature phase record, route schema, or component contract should tell the agent what "working" means. If the behavior has no durable spec, either update the smallest relevant source of truth first or mark the missing spec as a coverage gap; do not silently invent acceptance criteria from memory.

Before closeout, classify the meaningful test cases:

- **Local automated**: covered by Vitest, Playwright, static checks, or deterministic scripts in the local worktree. Cite the command and the specific test file, assertion, route, component, or schema that proves it.
- **Replit automated**: can be run by a script or Playwright/API smoke against the Replit workspace/deployment using real secrets and services. Cite the script or write the exact command if it exists; otherwise mark the automation as proposed, not completed.
- **Replit human validation**: needs a real Replit workspace/deployment plus a human action or judgment, such as Firebase Console/App Check configuration, Google provider popup completion, Replit Secrets/deployment UI changes, production-domain checks, visual judgement, or product acceptance.
- **Replit confidence gap**: locally covered but not trusted until Replit proves the environment seam, such as DB schema availability, Firebase authorized domains, App Check token behavior, provider network access, ElevenLabs audio, Linux/native upload behavior, or dev-vs-prod database separation.
- **Not covered / deferred**: intentionally out of scope. State why, where the deferral lives, and the smallest future test that would close the gap.

Use visible reasoning and provenance. A good validation note says: "This case is local-only because the provider is mocked in `tests/unit/...`; Replit still needs to prove the real provider call and secret." A weak note says only: "covered by tests."

When asked for an app-wide test pass, separate "all existing automated tests" from "all app functions mapped to documented specs." The first is a command; the second is a coverage audit. A true app-wide coverage audit should enumerate the documented product functions, cite their source docs, map each function to local/Replit/human checks, and identify missing specs or stale tests.

If a case is important enough to list and can be automated safely in the current branch, add the test. If it cannot be automated safely, mark the human/Replit dependency explicitly instead of implying confidence.

## Standard Local Automation Commands

Use the repo scripts instead of ad hoc `npx` commands so validation evidence stays consistent across handoffs and CI:

- `npm run test:unit` — Vitest unit suite.
- `npm run test:e2e` — Playwright E2E (Chromium) against the local dev server.
- `npm run test` — runs unit + E2E.
- `npm run db:health` — database schema preflight check for known drift vectors (required before DB-backed E2E).

CI note (automation harness foundation):
- The GitHub Actions guest-lane E2E job is intentionally gated on repo `vars` / `secrets` for Neon + Firebase + ElevenLabs. Until those are configured, CI will report green for typecheck/build/unit while the guest smoke + `db:health` path is skipped. This is a setup dependency, not a change in the Replit-authoritative validation policy.
- The guest-lane E2E smoke should avoid paid AI/provider calls by default. If the server cannot start because an unused provider client is created at module load, treat that as a startup isolation bug or split it into an explicit live-provider canary; do not silently expand the guest smoke's secret contract.

E2E note: browser automation depends on service-backed env (at minimum a `DATABASE_URL` that points to a non-production test database). Keep E2E flows privacy-forward by using synthetic data and by avoiding production/Replit databases.

## Bug and Regression Closeout

When testing or user validation finds a bug, close the loop before merge readiness:

- Reproduce or document the exact evidence: observed behavior, expected behavior, environment, branch/SHA, and affected user flow.
- Classify the bug as product behavior, implementation defect, environment/schema drift, stale test coverage, missing acceptance criteria, or workflow/process gap.
- Add a regression test when the bug is locally deterministic. If it depends on Replit-only services, secrets, provider state, Firebase Console settings, speech/audio, or human judgement, record the exact Replit re-test instead.
- Mark stale validation explicitly. If the bug was found after a previous Replit pass, the old pass is no longer merge evidence for the affected surface until the fixed SHA is re-tested.
- Update the smallest durable doc that future agents need: PD or phase record for product/security policy, INIT for initiative status and validation state, workflow doc for repeatable testing discipline, Effort only for standalone follow-up, and handoff/PR for point-in-time evidence.

A bug fix is not done when only the code changes. It is done when the fix, coverage or validation gap, stale-validation status, and reusable lesson are discoverable from the repo and PR without replaying chat.

## Auth-Scoped Client State

When a change touches browser-local state, client caches, or persisted in-progress UI state for an auth-gated flow, treat identity switching as part of the acceptance criteria.

- `localStorage`, `sessionStorage`, IndexedDB, in-memory stores, and TanStack Query keys that can affect profile, pantry, planning, history, cooking, billing, quota, or settings behavior must be scoped by the real auth identity and mode when the same browser can hold guest and linked users.
- A cache key that is only the route path, such as `/api/user/profile`, is not enough when the value is user-specific and the query cache can outlive an auth switch.
- Browser-local guest state may persist across normal reopen, but it must not be restored into a later linked account or another linked account on the same browser.
- Legacy unscoped keys should be removed or explicitly migrated with a documented owner and validation plan; do not silently keep reading old cross-user state.
- Provider auth state alone is not enough when the server owns product gates. If Firebase anonymous auth, App Check, quota, or kill-switch policy is involved, the client must verify the authoritative backend session before routing the user into protected app state.
- Tests should include a same-browser identity switch when practical: guest to linked, linked account A to linked account B, and stale legacy key to current scoped key. If this requires Replit because Firebase/Google is involved, list it as Replit human validation instead of treating local unit coverage as complete.

## Source of Truth

| Need | Durable home |
|---|---|
| Feature acceptance criteria | Relevant feature phase record in `product-decisions/features/<feature>/` |
| Initiative status, current phase, PR/branch state, and validation state | Relevant `initiatives/INIT-*.md` |
| Stable cross-feature testing rule or workflow | `docs/workflows/` or a top-level PD |
| Point-in-time command output, manual checks, and branch status | PR description and `docs/handoffs/` |
| Replit validation focus by drift vector | [`docs/workflows/replit-validation-focus.md`](replit-validation-focus.md) |
| Focused security checks from recent scan learnings | [`docs/workflows/security-due-diligence.md`](security-due-diligence.md) |
| Local-vs-Replit authority | [`docs/adr/0001-replit-primary-local-agents.md`](../adr/0001-replit-primary-local-agents.md), `AGENTS.md`, and `CLAUDE.md` |
| Cross-doc routing and closeout | [`docs/workflows/documentation-routing.md`](documentation-routing.md) |
| Docs-only workflow PR auto-merge authority | [`docs/workflows/agent-merge-authority.md`](agent-merge-authority.md) |

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
- Auth-scoped browser state and client cache isolation across guest, linked, sign-out, and account-switch transitions.
- In-flight async work, Back/cancel behavior, stale-result handling, and navigation away from the surface.
- Related INITs, active Efforts, PDs, workflow docs, and phase records.
- Security due diligence for auth ownership, private caching, admin data, external scripts, provider abuse limits, and prompt-input boundaries; use [`security-due-diligence.md`](security-due-diligence.md) for the focused checklist.
- Telemetry/privacy rules, especially [`PD-010`](../../product-decisions/pd-010-ai-error-telemetry-allowlist.md) for AI error logging.
- Settings/setup parity, post-cook or future rescan implications, and any sibling surfaces that share the same component or API.

The scan upload policy review that produced [`PD-011`](../../product-decisions/pd-011-scan-upload-photo-limit-policy.md) is the model: it considered scan copy, route limits, image-count rate limits, telemetry allowlists, Settings behavior, empty-Pantry state, active-scan cancellation, and related Efforts before the policy was accepted.

## Required Handoff / PR Verification Notes

Every implementation handoff and PR description should include:

- Commands run and whether they passed.
- A coverage classification that separates happy paths, corner cases, local automation, Replit automation, Replit human validation, confidence gaps, and explicitly deferred scope.
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
