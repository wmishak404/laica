# Security Scan Report - 2026-05-19

**Repo:** `wmishak404/laica` (public)  
**Base:** `origin/main` at `af595068358a353ea8ced46c7110105aaff3ff4a`  
**Branch:** `codex/security-scan-2026-05-19`  
**Agent:** codex  
**Run date:** 2026-05-19

## Executive summary

Automated guardrails recorded on 2026-05-19 show **no open high/critical dependency vulnerabilities** and **no open GitHub security alerts** (CodeQL, Dependabot, secret scanning). See `docs/security/security-triage-2026-05-19.md` for the full evidence log.

A manual review of the **public repo code + git history** surfaces a small set of security risks that are *not* reliably caught by provider-verified secret scanners or dependency audit gates:

| Severity | Finding | Status |
| --- | --- | --- |
| **High** | IP spoofing / rate-limit bypass + potential memory DoS via untrusted `X-Forwarded-For` + unbounded in-memory buckets | **Open** |
| **Medium (mitigated, but still public history)** | Plaintext `ADMIN_SECRET` value committed in `.replit` in past commit history | **Mitigated operationally** (rotation claimed), **not removed from history** |
| **Medium** | Global error handler returns `err.message` for 500s (info leak risk) | **Open** |
| **Low** | Missing baseline HTTP security headers (`helmet`) and Express `X-Powered-By` disclosure | **Open** |
| **Low (dev-time)** | Vite dev server `allowedHosts: true` (DNS rebinding risk) | **Open** |

## Methodology and environment constraints

This report intentionally separates **(A) automated scan evidence** from **(B) manual review findings**.

- **Automated evidence** is recorded in `docs/security/security-triage-2026-05-19.md`.
- **This Codex automation environment** cannot reach external services like `registry.npmjs.org` or `api.github.com` (DNS resolution blocked). As a result:
  - `npm audit` cannot be executed from this sandbox (`getaddrinfo ENOTFOUND registry.npmjs.org`).
  - `gh api` checks cannot be re-run from this sandbox.

Manual review was performed entirely from the public Git tree and source.

## Findings (deep dive)

### 1) High — Rate limit bypass + memory DoS risk via `X-Forwarded-For`

**What we saw (code):**

- `server/rate-limit.ts` uses `req.headers["x-forwarded-for"]` directly and trusts the *left-most* value as the client IP:
  - `getClientIp()` returns `forwardedFor.split(",")[0].trim()`.
- Custom rate limits store per-key state in an **unbounded** in-memory `Map` (`const buckets = new Map<string, Bucket>()`).

**Why this is risky:**

If the app ever receives untrusted `X-Forwarded-For` headers (for example, if the reverse proxy *appends* instead of *overwrites/clears* the header, or if the app is reachable without the expected proxy), an attacker can:

1. **Bypass per-IP limits** by sending a different `X-Forwarded-For` on each request.
2. **Force unbounded growth** of the `buckets` map by generating many unique spoofed IP values (or even long strings), causing a **memory exhaustion / availability** failure.

This matters for LAICA because many endpoints are cost-bearing (AI calls) and/or can be spammed (feedback). Rate limiting is one of the primary abuse controls.

**Evidence pointers:**

- `server/rate-limit.ts` defines:
  - `const buckets = new Map<string, Bucket>();`
  - `getClientIp()` trusting `x-forwarded-for`.

**Suggested fix (summary):**

- Stop parsing `x-forwarded-for` manually.
- Prefer `req.ip`/`req.ips` and configure `trust proxy` only when behind a trusted proxy that overwrites forwarding headers.
- Add a hard cap / TTL cleanup for custom rate-limit storage (or use a store that enforces eviction, e.g. LRU).

---

### 2) Medium (mitigated, still in history) — Plaintext `ADMIN_SECRET` committed in `.replit`

**What we saw (git history):**

- Commit `d93af27` contains a plaintext `ADMIN_SECRET` entry in `.replit` under `[userenv.shared]`.
- Later commits removed the value, but it **still exists in the public git history**.

**Why this is risky:**

- If any environment (Replit, local, staging, etc.) still uses that historical value, an attacker can call the admin endpoints protected only by `X-Admin-Secret`.
- Provider-verified secret scanners (TruffleHog `--only-verified`, GitHub secret scanning) are **unlikely to flag a custom shared secret** like this. This is consistent with `docs/security/secret-scan-2026-05-18.md` showing 0 verified secrets even though this secret existed.

**Current mitigation status:**

Repo documentation states the historical `ADMIN_SECRET` was rotated in Replit Secrets (see `docs/adr/0001-replit-primary-local-agents.md`). That reduces the immediate exploitability, but the value remains discoverable.

**Suggested fix (summary):**

- Confirm the historical value is not valid anywhere (Replit Secrets, any other deployments).
- Optional (higher effort): rewrite git history to remove the plaintext secret from `.replit` in commit `d93af27`.
- Add a periodic *non-verified* secret scan pass (or custom patterns) to detect future “custom secret” leaks.

---

### 3) Medium — Global error handler may leak internal details

**What we saw (code):**

- `server/index.ts` global error handler returns `res.status(status).json({ message })` where `message = err.message || "Internal Server Error"`.

**Why this is risky:**

Some error messages can reveal implementation details (dependency versions, DB errors, schema/table names, upstream errors). This is typically not catastrophic, but it raises the information leak surface and makes targeted exploitation easier.

**Suggested fix (summary):**

- In production, always return a generic message for `>=500` responses.
- Preserve detailed error logs server-side only.

---

### 4) Low — Missing baseline HTTP hardening headers

**What we saw (code):**

- No `helmet()` middleware or explicit security headers.
- Express default `X-Powered-By` header is likely still enabled.

**Why this is risky:**

This leaves some baseline defenses (MIME sniffing protection, clickjacking headers, etc.) up to the hosting layer and increases the attack surface for common web exploitation classes.

**Suggested fix (summary):**

- Add `helmet` with a minimal safe baseline.
- Disable `X-Powered-By`.

---

### 5) Low (dev-time) — Vite `allowedHosts: true`

**What we saw (code):**

- `server/vite.ts` configures Vite middleware server options with `allowedHosts: true`.

**Why this is risky:**

Vite explicitly documents that `allowedHosts: true` can enable DNS rebinding attacks against a developer machine / dev environment, potentially allowing source code/content access.

This is a dev-time concern, but the dev environment can hold secrets (dotenvx decrypted env, Replit credentials, DB URLs).

**Suggested fix (summary):**

- Replace `allowedHosts: true` with an explicit allowlist of hosts used in Replit/local dev.

## Remediation plan (prioritized)

### P0 (this week)

1. **Harden client IP handling + rate-limit keying** (High)
   - Change `getClientIp()` to use `req.ip` (with correct `trust proxy` configuration) instead of trusting `x-forwarded-for` directly.
   - Add eviction/cleanup to `buckets` to prevent unbounded growth.
   - Add a small regression test or a targeted unit check around `getClientIp()` behavior.

2. **Confirm historical `ADMIN_SECRET` invalid everywhere** (Medium)
   - Explicitly verify the old value is not present in Replit Secrets.
   - If any downstream environment exists, rotate there too.

### P1 (next 1–2 weeks)

3. **Stop returning raw `err.message` for 500s** (Medium)
   - Keep detailed logs server-side.
   - Return a stable generic error message in production.

4. **Add baseline headers** (Low)
   - Add `helmet` and disable `X-Powered-By`.
   - Decide whether to manage CSP at Express or at the edge.

### P2 (when time allows)

5. **Reduce dev-time DNS rebinding exposure** (Low)
   - Restrict Vite `allowedHosts`.

6. **History rewrite decision** (Medium)
   - If you want the repo to be “clean” for audits, use `git filter-repo` to remove the `.replit` secret from history.
   - Only do this after confirming all rotations are complete.

## Appendix

### Useful commands (history + code inspection)

- Locate commits that introduced environment variables in `.replit`:
  - `git log -S "ADMIN_SECRET" --oneline -- .replit`
- View the historical `.replit` content (do not paste secrets):
  - `git show d93af27:.replit`
- Review rate-limit IP handling:
  - `sed -n '1,120p' server/rate-limit.ts`
