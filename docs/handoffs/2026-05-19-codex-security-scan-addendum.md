# Security scan addendum pushed into PR #97

**Agent:** codex
**PR:** #97
**Branch:** `claude/eloquent-mestorf-953e69`
**Date:** 2026-05-19
**Initiative:** scheduled weekly security scan

## Summary

Claude’s weekly security scan PR #97 correctly identified the `X-Forwarded-For` spoofing issue in `server/rate-limit.ts` and the missing baseline HTTP security headers (`helmet`).

I reviewed the same public repo surface and added a codex addendum document to consolidate additional open risks that weren’t explicitly captured in the Claude report:

- the in-memory rate limit bucket `Map` is unbounded (memory/availability DoS risk), especially when combined with spoofable IP keys
- a historical plaintext `ADMIN_SECRET` existed in `.replit` in older git history (must remain rotated; optional history rewrite decision)
- `server/index.ts` returns `err.message` for 500s (info leak risk)
- `server/vite.ts` sets `allowedHosts: true` (dev-time DNS rebinding risk)

## Changes

- `docs/security/security-scan-2026-05-19-codex-addendum.md` — consolidated addendum (no duplicate of Claude’s findings)
- `docs/handoffs/2026-05-19-codex-security-scan-addendum.md` — this handoff

## Next actions

This PR remains docs-only. The next step is to choose whether to open a remediation PR that:

1) fixes `getClientIp` + adds eviction/cap for the in-memory rate-limit buckets, and
2) optionally tightens the 500 error response message behavior and Vite dev host allowlist.

Replit validation is required only once runtime behavior changes land.
