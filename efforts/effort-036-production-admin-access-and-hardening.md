# EFF-036: Restore production admin access and route hardening

**Status:** In Progress
**Priority:** P0 — production security and operability blocker
**Owner:** Wilson / Codex / Claude
**Created:** 2026-07-22
**Updated:** 2026-07-22
**Related docs:** [post-publish production regression](../docs/handoffs/2026-07-22-codex-post-publish-production-regression.md), [testing and acceptance](../docs/workflows/testing-and-acceptance.md)

## One-line summary

Restore valid production admin access and the lost admin-specific throttling and timing-safe credential comparison without exposing the secret or weakening admin no-cache behavior.

## Context

The mandatory post-publish admin smoke found two independent failures:

1. From the trusted Replit shell, the configured environment credential succeeded against preview but was denied by the custom domain. The secret was referenced only as an environment variable; no value was printed or persisted. The endpoint, preview hostname, command, and exact response mapping are intentionally omitted from this public record.
2. Current `main` mounts cache and authentication middleware on the protected admin surface but does not mount the dedicated limiter. PR #244 had introduced an admin-specific limiter, timing-safe comparison, and focused threshold-boundary coverage, but PR #246's later admin/eval route merge removed the middleware and comparison while leaving the limiter exported and unused. Production exposes only the broad API policy.

Missing and deliberately invalid credentials are still denied with the required no-cache and response-variance behavior. Exact operational headers are intentionally omitted from this public record. Those passing boundaries do not offset valid-credential failure or missing route-specific abuse control.

## Scope

- Reconcile the production deployment credential with the trusted Replit secret store without displaying, copying into docs, or logging its value.
- Restore a constant-time credential comparison.
- Mount a dedicated admin limiter before protected admin routes and define reset/no-cache behavior.
- Restore focused coverage for valid, invalid, missing, threshold, reset, and cache behavior.
- Republish only with Wilson's explicit authority, then rerun the secret-safe custom-domain smoke.

Out of scope:

- Exposing the secret to client JavaScript or browser network tools.
- Broad admin feature redesign, eval schema changes, or provider-batch changes.
- Live request flooding to infer an absent limiter.

## Decisions made so far

- Treat this as a production blocker: authorized admin operations are unavailable from the trusted current secret, and the required dedicated abuse control is absent from source.
- Keep configuration repair and source hardening in one Effort because both block the same mandatory admin production gate.
- Do not use browser-visible headers for a valid secret and do not persist secret material in evidence.
- Source provenance is sufficient to fail the throttle criterion; do not flood the live production route.

## Open questions

- Did the publish snapshot omit the rotated deployment secret, or is production reading a different secret source?
- Should the dedicated limiter remain per-instance memory, or must production autoscaling use a shared store before this gate can be considered durable?
- What authorized reset mechanism should the post-deploy smoke use without weakening the route?

## Agent checklist

- [x] Verify current production secret presence through a masked presence-only check.
- [x] Restore the timing-safe comparison and mount the dedicated limiter while preserving no-cache headers.
- [x] Add regression coverage that preserves PR #246's eval-report routes.
- [ ] Run focused admin/rate-limit tests, full unit, check, build, exact-head E2E, and security checks.
- [ ] Obtain Wilson's publish authority before changing production.
- [ ] Rerun valid, invalid, missing, threshold/reset, and no-cache production checks from a trusted process.

## Resolution criteria

1. The trusted current secret succeeds on the custom domain without its value entering logs, docs, browser state, or shell output.
2. Missing and invalid secrets fail with identical safe public behavior and required no-cache headers.
3. A dedicated admin limiter is mounted and threshold/reset behavior is covered and safely observed.
4. Credential comparison is constant-time for equal-length material and handles length mismatch safely.
5. Admin eval-report functionality remains intact.
6. The corrected exact deployment marker and production smoke are recorded.

## 2026-07-22 — Filed from post-publish blocker evidence

The trusted Replit credential succeeded in preview but was denied by the custom domain. Repository history also identified the hardening regression between PR #244 and PR #246. Exact operational details are intentionally omitted from this public record. No product fix, secret change, republish, or live throttle flood was attempted in the regression task.

## 2026-07-22 — PR #335 implementation and masked configuration check

Wilson explicitly directed EFF-036 implementation into [PR #335](https://github.com/wmishak404/laica/pull/335). Runtime commit `763a1eba2e7fe9566e1bf53779235b4a80579611` restores SHA-256-normalized timing-safe credential comparison and mounts the existing dedicated admin limiter between no-cache handling and authentication. This preserves the eval-report routes added by PR #246.

Production-mode `createRateLimit` already uses the shared database-backed bucket store by default, so the mounted admin limiter is shared across autoscale instances during normal operation. The existing database-error fallback remains in-memory and therefore weaker across multiple instances; that availability fallback is negative scope, not evidence of an unconditionally global limiter. The reset used by regression tests is deliberately test-only. No production reset endpoint was added.

Focused route coverage now proves valid success, equivalent missing/invalid denial, no-cache behavior on success/denial/throttle, rejection before protected handlers, the throttle boundary, deterministic in-process reset, and continued JSON/markdown eval-report behavior. Local focused tests, the full 401-test unit suite, typecheck/lint, build, high/critical audit gate, and diff checks passed. Exact-head GitHub E2E/security evidence remains pending until the final documentation commit is pushed.

The masked Replit Publishing inspection completed without revealing or changing the credential. No edit, sync-state mutation, relink, value entry, or publish action was performed, and Wilson does not need to copy the value into chat. Exact operational configuration details remain outside this public record. The remaining custom-domain mismatch needs a separately authorized runtime validation and, if approved, republish/restart plus secret-safe smoke.

The public PR was also sanitized before implementation: the Replit workspace screenshot was removed, operational request details were redacted, and the branch was rewritten to a sanitized evidence commit. No secret value was ever captured. GitHub may retain unreachable objects or cached PR references after a force-push; permanent cached-reference removal, if Wilson wants it for the non-secret workspace metadata, is a GitHub Support action.
