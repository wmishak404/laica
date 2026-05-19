# Security Scan Addendum — 2026-05-19 (Codex consolidation)

**Agent:** codex  
**Date:** 2026-05-19  
**PR:** #97  
**Branch:** `claude/eloquent-mestorf-953e69`  
**Baseline:** `origin/main` @ `af595068358a353ea8ced46c7110105aaff3ff4a`

## Why this file exists

PR #97 already includes Claude’s security scan report (`docs/security/security-scan-2026-05-19-claude.md`).

This addendum consolidates *additional* findings from a second manual review of what’s publicly visible in GitHub (source + git history) and avoids duplicating Claude’s already-documented items.

## Consolidated open findings (2026-05-19)

| ID | Severity | Finding | Status | Notes |
| --- | --- | --- | --- | --- |
| CONSOLIDATED-01 | **High** | Rate limit bypass + potential memory DoS (`X-Forwarded-For` spoofing + unbounded in-memory buckets) | Open | Claude covers spoofing; this adds the memory/DoS dimension. |
| CONSOLIDATED-02 | **Medium** | Historical plaintext `ADMIN_SECRET` committed in `.replit` (public git history) | Mitigated (assumed rotated) | Not detected by verified-only secret scanners; do not reuse value anywhere. |
| CONSOLIDATED-03 | **Medium** | 500 responses echo `err.message` to clients (info leak risk) | Open | Fix is low-risk; production should return generic 500 text. |
| CONSOLIDATED-04 | **Low (dev-time)** | Vite dev server `allowedHosts: true` (DNS rebinding risk) | Open | Dev-only, but dev environments hold secrets. |

Claude’s open findings remain valid and are not duplicated here:

- `MEDIUM-01` — `getClientIp` trusts client-controlled `X-Forwarded-For` first hop.
- `MEDIUM-02` — missing baseline HTTP security headers (`helmet`).

## CONSOLIDATED-01 — Rate limit bypass + memory DoS

### What’s already covered

Claude’s report correctly flags that `server/rate-limit.ts` currently parses `X-Forwarded-For` manually and can be spoofed, bypassing IP-keyed rate limits.

### Additional risk surfaced

The custom rate limiter implementation stores buckets in a process-wide, unbounded `Map`:

- `server/rate-limit.ts`: `const buckets = new Map<string, Bucket>();`

There is no maximum size, no periodic cleanup, and no guardrail on key length.

If an attacker can influence the rate-limit key (today: by spoofing `X-Forwarded-For`), they can generate an effectively unlimited number of unique keys and cause the server process to accumulate bucket entries until memory pressure forces a crash or OOM kill.

This is primarily an **availability** risk (and secondarily a **cost** risk for AI endpoints if other controls are bypassed).

### Why this matters even if `req.ip` is fixed

Even after switching to `req.ip`, the in-memory map is still a single-process store with no explicit eviction. A botnet (real distributed IPs) can still create many buckets over time.

### Suggested remediation

P0 (same PR or next PR):

- Fix `getClientIp` to use Express’s trusted proxy logic (`req.ip`) and ensure `trust proxy` matches the real deployment topology. See Express guidance and warnings about trusting forwarded headers. citeturn1view0
- Add an eviction strategy for `buckets`:
  - periodically delete expired buckets, and
  - enforce a maximum map size (LRU or “drop oldest”) to bound memory.

P1 (later): move to a distributed store (Redis/Upstash/etc.) if multi-instance deployment becomes real.

## CONSOLIDATED-02 — Historical `ADMIN_SECRET` in public git history

### What we saw

A previous commit (`d93af27`) included a plaintext `ADMIN_SECRET` value in `.replit` under `[userenv.shared]`.

That line was removed later, but it remains in the public git history.

### Why this matters

- Custom shared secrets are often **not detected** by provider-verified secret scanners (because they aren’t known provider token formats). This is consistent with verified-only secret scans showing 0 findings.
- If that historical value is still used anywhere (Replit secrets, local env, any other environment), an attacker can authenticate to admin endpoints protected only by `X-Admin-Secret`.

### Suggested remediation

P0:

- Confirm the historical value is not present anywhere in active secrets (Replit + any other environments).

P2 (optional / higher effort):

- Consider a history rewrite to remove the plaintext value from `.replit` in `d93af27`.
  - Only consider after rotations are complete and after acknowledging the operational cost of rewriting a public repo.

## CONSOLIDATED-03 — Error handler returns `err.message` for 500s

### What we saw

`server/index.ts` returns `err.message` for any error response, including `>= 500`.

### Why this matters

Some thrown messages (DB errors, upstream messages) can reveal internal details that make targeted exploitation easier.

### Suggested remediation

P1:

- For `status >= 500`, return a generic message (e.g. `"Internal Server Error"`) and log details server-side.
- Keep `err.message` only for expected `4xx` validation failures.

## CONSOLIDATED-04 — Vite `allowedHosts: true` (dev-time)

### What we saw

`server/vite.ts` sets Vite server options with `allowedHosts: true`.

### Why this matters

Vite documents that setting `server.allowedHosts` to `true` allows DNS rebinding attacks against the dev server, potentially exposing source code/content. citeturn3search1

This is a dev-time risk, but local dev environments can hold secrets (dotenvx-decrypted env, DB URLs).

### Suggested remediation

P2:

- Replace `allowedHosts: true` with an explicit allowlist (or use Vite’s `__VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS` mechanism where needed).

## Remediation plan (next actions)

1. **P0:** Fix IP key spoofing (`getClientIp`) + add `buckets` eviction/cap.
2. **P0:** Confirm historical `ADMIN_SECRET` value is not valid anywhere.
3. **P1:** Stop echoing `err.message` for 500s.
4. **P2:** Restrict Vite `allowedHosts` in dev.

## Notes on scope

This PR remains documentation-only. Recommended fixes should land as separate tested PR(s) (and should be validated in Replit when runtime behavior changes).
