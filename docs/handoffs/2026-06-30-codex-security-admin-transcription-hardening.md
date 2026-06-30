# Security admin and transcription hardening

**Agent:** codex
**Branch:** codex/security-admin-transcription-hardening
**Date:** 2026-06-30
**Initiative:** none
**INIT updated:** n/a
**Resolves blocked handoff:** none

## Summary

This branch handles the low-risk security hardening follow-up from the 2026-06-30 automation pass while keeping public text at the remediation and validation level. The live triage found no open Dependabot security PRs, no open Dependabot alerts, no open code-scanning alerts, and no open security-labeled remediation PRs. Current `main` branch protection remains strict with the expected required CI/security checks.

The implementation adds a route-specific admin throttle, compares the admin shared secret through fixed-length digests, and moves speech transcription temp-file handling from timestamp-derived paths to randomized exclusive temp directories. No schema, dependency, client contract, or navigation behavior changed.

## Changes

- `server/admin-routes.ts` adds the admin-specific limiter before admin auth and switches secret validation to fixed-length digest comparison.
- `server/rate-limit.ts` adds an `admin` rate-limit key and `adminIpLimit`, configurable with `RATE_LIMIT_ADMIN_HOUR`.
- `server/routes.ts` creates speech transcription temp files in randomized exclusive temp directories and removes the directory after provider handoff.
- `tests/unit/admin-cache-headers.test.ts` covers admin no-cache headers plus repeated invalid-attempt throttling before admin handlers run.
- `tests/unit/provider-boundary-happy-paths.test.ts` covers the transcription provider path using the randomized temp-file prefix rather than the old timestamp form.
- `tests/unit/rate-limit.test.ts` covers the admin rate-limit env key mapping.

## Impact on other agents

Treat this as a small automation-primary security patch. The admin route now has its own IP-hour limiter in addition to the global API limiter; if a future admin workflow legitimately needs more than the default, use the `RATE_LIMIT_ADMIN_HOUR` override rather than removing the route-specific limiter.

The transcription path still writes the uploaded memory buffer to disk because the provider client expects a readable file stream. Future work should preserve randomized/exclusive temp-file allocation and cleanup if this route changes.

## Open items

- No open Dependabot security PR is waiting on this branch.
- No Wilson-only security settings or secret-rotation action was identified in this run.
- Human Replit validation is deferred to the next security/release batch because the changed surfaces are narrow server-boundary hardening with local route coverage.

Deferred release-batch checks:

- Signed-in live cooking transcription still works with the real provider.
- Admin route returns expected `403`, `429`, and valid-secret behavior from Replit without caching sensitive responses.

## Stack / base status

- Base refreshed: yes
- Current base: `origin/main` at `f9909af7cbc7104f9eb4da7b3a8642215fce461e`
- Last Replit-validated at: not yet validated
- Human Replit validation: deferred to release/batch validation

## Verification

Value claim: admin and speech boundary handling is more resistant to abuse/collision risks without changing normal user-facing behavior.

Evidence:

- `npm ci` passed and reported `found 0 vulnerabilities`.
- `npx vitest run tests/unit/admin-cache-headers.test.ts tests/unit/provider-boundary-happy-paths.test.ts tests/unit/phase0-security-routes.test.ts tests/unit/rate-limit.test.ts` passed: 5 files / 40 tests.
- `npm run test:unit` passed: 45 files / 331 tests.
- `npm run check` passed: TypeScript plus UI lint.
- `npm run build` passed with the existing Vite chunk/Browserslist warnings.
- `npm audit --audit-level=high` passed with `found 0 vulnerabilities`.
- `git diff --check origin/main...HEAD` passed.

Evidence limits: local tests mock the speech provider and do not prove live OpenAI transcription, Replit filesystem behavior, or a valid real admin secret in the Replit environment. Those are deferred release-batch checks above.
