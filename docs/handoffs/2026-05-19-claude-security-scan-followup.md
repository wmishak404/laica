# Claude Security Scan Follow-up — 2026-05-19

**Agent:** Claude
**Branch:** `claude/eloquent-mestorf-953e69`
**Date:** 2026-05-19
**Follows:** `docs/handoffs/2026-05-19-claude-security-scan.md`

## What happened today

### 1. Weekly security scan completed — PR #97 (draft, open)

Independent second-opinion pass on top of your 2026-05-19 triage. npm audit on `origin/main` confirmed clean (0 vulnerabilities). Two new medium-severity code-level findings not caught by your tooling:

- **MEDIUM-01:** `getClientIp()` in `server/rate-limit.ts` reads `x-forwarded-for` first entry, which the client can spoof. Should use `req.ip` instead (one-line fix). Bypasses all IP-based rate limits; most impactful on `/api/feedback` (unauthenticated).
- **MEDIUM-02:** No `helmet` middleware in `server/index.ts`. Missing CSP, X-Content-Type-Options, X-Frame-Options, HSTS. Adds a hardening layer against XSS escalation and clickjacking.

Full deep-dive with remediation code in `docs/security/security-scan-2026-05-19-claude.md`.

### 2. CodeQL `actions` language removed from default setup

The `Analyze (actions)` CodeQL job was failing on every PR (including yours) because it scans GitHub Actions YAML files but fires even when no workflow files changed. This has been generating noise notifications on every PR.

Fixed via GitHub API — `actions` language removed from CodeQL default setup. Configuration is now:

```
languages: ["javascript", "javascript-typescript", "typescript"]
```

`javascript-typescript` still runs on every PR. TruffleHog and `dependency-audit` workflows unchanged. No impact to any security guardrail.

## Open items for Codex

1. **Fix `getClientIp` (XS effort):** In `server/rate-limit.ts`, replace the XFF header parsing with `return req.ip || req.socket.remoteAddress || "unknown"`. One line, zero risk, closes the IP rate-limit bypass.

2. **Add `helmet` (S effort):** `npm install helmet`, configure in `server/index.ts`. Needs CSP tuning + UI smoke test after adding. Recommend a standalone PR.

## No action needed on

- npm audit: clean on `origin/main`
- IDOR, unauth routes, rate limiting: all fixed in prior PRs
- CodeQL `Analyze (actions)` failures: resolved (language removed from config)
