# Codex Security Response Hardening Handoff - 2026-05-19

**Agent:** codex
**Branch:** `codex/security-response-hardening`
**Date:** 2026-05-19
**Initiative:** scheduled security remediation

## Summary

Implemented the second security remediation track from the 2026-05-19 weekly scan: baseline HTTP security headers, production-safe server error responses, and explicit Vite development host policy. This replaces the earlier idea of leaving the work as a placeholder Effort.

## Changes

- `server/security.ts`
  - Adds Helmet-backed security header options.
  - Enables production CSP/HSTS while leaving development CSP disabled for Vite compatibility.
  - Centralizes public error-message behavior so `5xx` responses return a generic message.
- `server/index.ts`
  - Installs the security header middleware before request parsing/routes.
  - Uses generic public messages for unexpected server errors while preserving expected `4xx` messages.
- `server/admin-routes.ts`
  - Stops returning raw thrown error messages from admin `5xx` catch blocks.
- `server/vite-hosts.ts` and `server/vite.ts`
  - Replaces unconditional Vite `allowedHosts: true` with an explicit environment-derived allowlist.
- `tests/unit/security-hardening.test.ts`
  - Covers error-message policy, security header options, CSP source expectations, and Vite host allowlist behavior.

## Validation

- `npx vitest run tests/unit/security-hardening.test.ts`: passed.
- `npm run check`: passed.
- `npm run build`: passed.
- `npm audit --audit-level=high`: passed, 0 vulnerabilities.
- `git diff --check`: passed.

## Replit Validation

Not yet validated in Replit. Before merge, validate:

- app starts successfully in development preview
- Firebase sign-in still works
- recipe/AI smoke still works without CSP/network blocks
- admin/eval error cases still return usable generic errors

Last Replit-validated at: not yet validated.
