# Claude Security Scan Handoff — 2026-05-19

**Agent:** Claude (automated weekly security scan)
**Branch:** `claude/eloquent-mestorf-953e69`
**Date:** 2026-05-19
**Initiative:** Scheduled weekly security automation

## Summary

Completed the weekly public GitHub repo + npm audit security scan as a second-opinion pass alongside Codex's 2026-05-19 triage. Codex's recent work cleared the npm audit entirely — confirmed independently. Found two medium-severity code-level issues not caught by Codex's tooling.

## What was done

1. Ran `npm audit` against both the current worktree (stale, 22 vulns) and `origin/main` (0 vulns).
2. Reviewed all public-facing files in the repo for sensitive info exposure.
3. Audited server-side code for IDOR, unauthenticated routes, injection, and missing security controls.
4. Cross-referenced with Codex's security triage PR #96 and remediations #84–#93.

## Changes in this PR

- `docs/security/security-scan-2026-05-19-claude.md` — full scan report with deep-dive explanations
- `docs/handoffs/2026-05-19-claude-security-scan.md` — this file

## New findings (not in Codex's triage)

### MEDIUM-01: X-Forwarded-For IP spoofing in `getClientIp`

**File:** `server/rate-limit.ts`, line ~36

`getClientIp()` reads `req.headers["x-forwarded-for"].split(",")[0]` — the first entry, which the client controls. With Replit's proxy in front, the real IP is appended as the last entry. An attacker can cycle through spoofed first-hop IPs to bypass all IP-based rate limits.

Most impactful on `POST /api/feedback` (unauthenticated, only IP-rate-limited).

**Fix:** Replace with `return req.ip || ...` — Express's `req.ip` respects `trust proxy: 1` and resolves to the correct client IP.

### MEDIUM-02: No HTTP security headers

**File:** `server/index.ts`

No `helmet` middleware. Missing CSP, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, HSTS. Risk is mainly XSS escalation and clickjacking.

**Fix:** `npm install helmet` + `app.use(helmet({ contentSecurityPolicy: { ... } }))`.

## Confirmed clean (no action needed)

- npm audit on `origin/main`: 0 vulnerabilities
- GitHub CodeQL/Dependabot/secret scanning alerts: confirmed 0 by Codex PR #96
- IDOR on session routes: fixed in main with `requireCookingSessionOwnership`
- All AI routes: authenticated + rate-limited
- `dangerouslySetInnerHTML` in chart.tsx: from shadcn/ui, uses component config not user input

## Recommended next steps

1. Fix `getClientIp` → `req.ip` (XS effort, zero risk)
2. Add `helmet` in a separate PR (S effort, needs CSP tuning + UI smoke test)

## Branch status

- Base: `origin/main` at `af595068358a353ea8ced46c7110105aaff3ff4a`
- This branch is docs-only; no runtime changes
- No Replit validation needed
