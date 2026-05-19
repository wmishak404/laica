# Codex Rate-Limit Hardening Handoff - 2026-05-19

**Agent:** codex
**Branch:** `codex/security-rate-limit-hardening`
**Date:** 2026-05-19
**Initiative:** scheduled security remediation

## Summary

Implemented the first security remediation track from the 2026-05-19 weekly scan: rate-limit keying now uses Express's proxy-aware request IP, the custom in-memory limiter bounds and prunes bucket state, and rate-limit environment overrides have an explicit tested naming contract.

## Changes

- `server/rate-limit.ts`
  - Removed raw forwarded-header parsing from `getClientIp()`.
  - Added expired-bucket pruning and a `10_000` bucket cap for the custom in-memory limiter.
  - Moved active buckets to the newest position on use so cap eviction removes the oldest keys.
  - Repaired rate-limit env override mapping to `RATE_LIMIT_<KEY>_<WINDOW>`.
- `tests/unit/rate-limit.test.ts`
  - Added coverage for proxy-aware IP keying, socket fallback, env override names, override parsing, bucket pruning, bucket cap enforcement, and existing typed `RATE_LIMITED` behavior.
- `docs/workflows/environment-parity-spec.md`
  - Recorded the accepted `RATE_LIMIT_*` override contract.

## Validation

- `npm ci`: passed, 0 vulnerabilities.
- `npx vitest run tests/unit/rate-limit.test.ts`: passed.
- `npm run check`: passed.
- `npm run build`: passed.
- `npm audit --audit-level=high`: passed, 0 vulnerabilities.
- `git diff --check`: passed.

## Replit Validation

Validated in Replit by Wilson on 2026-05-19:

- App started successfully in Replit preview.
- Firebase sign-in worked.
- Recipe/AI flow worked without unexpected rate-limit behavior.
- Normal app validation errors still surfaced correctly, including the more-than-20-photo upload case.
- `curl -I http://127.0.0.1:5000` returned `HTTP/1.1 200 OK` with normal app-level `RateLimit` headers.
- Replit Debug with Agent cleared a stale port process; Wilson indicated no code changes were expected from that action.

Last Replit-validated at: `6a25e70`.

## Follow-up

The second remediation track is being implemented separately as response/header/dev-host hardening, rather than being filed as a placeholder Effort.
