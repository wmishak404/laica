# Security private-response hardening

**Agent:** codex
**Branch:** `codex/security-private-response-hardening`
**Date:** 2026-06-02
**Initiative:** none
**INIT updated:** n/a

## Summary

The 2026-06-02 security automation scan found no current npm advisories, and GitHub check-runs for current `main` show the dependency audit, CodeQL analyses, TruffleHog push scan, unit, and guest smoke checks passing. This branch applies the low-churn app-hardening follow-up from the private scan record.

This branch fixes those gaps with a shared private-response header path for authenticated API routes and focused route tests. It does not merge dependency updates and does not change public scan detail.

Security disclosure note: detailed scan evidence stayed in the local/private automation report. Future security PRs and handoffs should follow [`docs/workflows/security-due-diligence.md`](../workflows/security-due-diligence.md): keep raw scanner output, vulnerable-route evidence, exploit notes, and package-path detail out of public GitHub text, while preserving that detail in private/local working artifacts.

## Changes

- `server/routes.ts`
  - Adds shared private-response headers for authenticated API responses: `Cache-Control: private, no-store, max-age=0`, `Pragma: no-cache`, and `Vary: Authorization`.
  - Applies the shared header path through the common `isAuthenticated` middleware.
  - Applies the same header middleware to `/api/auth/session` and `/api/auth/google`, which call Firebase verification directly.
  - Removes raw speech transcription configuration/provider details from client-facing `503` and `500` responses while preserving server logging.
- `tests/unit/phase0-security-routes.test.ts`
  - Adds representative anti-cache assertions for settings, profile, and cooking-session history responses.
  - Updates speech transcription missing-key expectations.
  - Adds a regression test that a provider-side transcription error returns only the stable public error shape.
- `tests/unit/auth-session-route.test.ts`
  - Adds anti-cache assertions for `/api/auth/session`.

## Impact on other agents

- Authenticated route handlers that use `isAuthenticated` now inherit private/no-store headers automatically.
- New authenticated routes should continue to use `isAuthenticated` unless they intentionally need a different auth bootstrap path. Routes that call `verifyFirebaseToken` directly should add `privateResponseHeaders` when they return user-specific data.
- Open Dependabot PR `#116` is a broad version-update batch, not a focused security PR. It has failing `unit` and `e2e_guest_smoke` checks and should not be treated as the next security merge candidate.

## Open items

- Replit validation was not run in this local automation pass.
- Last Replit-validated at: `not yet validated`
- Wilson must explicitly approve any merge; this is runtime code.
- Targeted Replit validation before merge:
  - Load `codex/security-private-response-hardening` in Replit.
  - Start the app and confirm Preview loads.
  - Firebase sign-in.
  - Open Settings/Profile data surfaces and confirm they load normally.
  - Exercise cooking-session history/active-session reads through the app if available.
  - Exercise speech transcription once with a normal authenticated upload if provider secrets are available.
  - Confirm no unexpected browser auth/cache regressions while navigating authenticated pages.

## Verification

Automation evidence used as merge-readiness support:

- Claim: authenticated user-specific API responses now send explicit private/no-store headers, and speech transcription failures no longer expose raw internal details in JSON responses.
- Command/check provenance: Local macOS/Codex worktree on `codex/security-private-response-hardening` at base `origin/main` `979254935344309d80604701bc6554e557ca995b`; commands run on 2026-06-02 PDT.
- Source provenance: `server/routes.ts`, `tests/unit/phase0-security-routes.test.ts`, `tests/unit/auth-session-route.test.ts`.
- Observed result:
  - `npm ci` passed and reported `found 0 vulnerabilities`.
  - `npx vitest run tests/unit/phase0-security-routes.test.ts tests/unit/auth-session-route.test.ts` passed: 2 files / 17 tests.
  - `npm run test:unit` passed: 29 files / 172 tests.
  - `npm run check` passed.
  - `npm run build` passed.
  - `npm audit --audit-level=high` passed with `found 0 vulnerabilities`.
  - `git diff --check` passed.
  - GitHub check-run lookup for current `main` `979254935344309d80604701bc6554e557ca995b` showed `npm-audit`, CodeQL analyses, `trufflehog_push`, `unit`, and `e2e_guest_smoke` successful; `trufflehog_pr` skipped for the push context.
- Reasoning: The change is centralized at the auth middleware boundary and directly tested through the real Express route registration, so representative authenticated JSON routes now prove the intended headers at response time. The transcription regression test simulates a provider failure and confirms the public response stays stable and sanitized.
- Negative scope: Replit runtime behavior, real Firebase browser sign-in, real database-backed profile/settings/session reads, and live speech transcription provider behavior were not validated locally.

## Stack / base status

- Base refreshed: yes
- Current base: `origin/main` at `979254935344309d80604701bc6554e557ca995b`
- Last Replit-validated at: not yet validated
- Notes: independent security hardening branch started from current `origin/main`; not stacked on PR `#120`.
