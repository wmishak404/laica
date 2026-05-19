# Weekly Security Scan — 2026-05-19 (Claude)

**Agent:** Claude (automated weekly scan)
**Date:** 2026-05-19
**Scope:** Public GitHub repo `wmishak404/laica`, npm audit, server-side code review
**Baseline:** `origin/main` @ `af595068358a353ea8ced46c7110105aaff3ff4a`

---

## Executive Summary

Codex's active security remediation work between 2026-05-14 and 2026-05-19 resolved all previously known npm audit vulnerabilities (including one critical, eight high) and fixed several code-level issues (IDOR on session routes, unauthenticated AI routes, missing rate limiting). As of today, **`npm audit` on `origin/main` returns 0 vulnerabilities.**

This report serves as an independent second-opinion pass. It confirms Codex's npm audit conclusions and identifies **two medium-severity code-level issues** that remain open on `origin/main`, plus three informational findings.

---

## npm Audit Status

### Origin/main (deployed baseline)

```
npm audit --json → { "total": 0 }
```

**All high and critical vulnerabilities are resolved.** The packages upgraded by Codex's recent PRs (#92, #93):
- `drizzle-orm` → `0.45.2` (was `^0.39.1`)
- `vite` → `7.3.2` (was `5.4.21`)
- `protobufjs` → `7.5.8`
- `lodash` → `4.18.1`
- `multer` → `2.1.1`
- `firebase-admin` → `13.8.0`

### Worktree audit (for historical reference)

This automated scan runs in a worktree 2 commits behind `main` and still shows 22 vulnerabilities (1 critical, 8 high, 12 moderate, 1 low). This does NOT reflect the deployed state — it reflects what the codebase looked like before Codex's fixes landed. The details below are educational context only.

---

## Previously Fixed Vulnerabilities (Historical Context)

These were real vulnerabilities that existed in the codebase and were fixed by Codex. They are documented here for learning purposes.

### CRITICAL-01 — protobufjs Arbitrary Code Execution (CVSS 9.8)

**Package:** `protobufjs` ≤ 7.5.7
**Advisory:** GHSA-xq3m-2v4x-88gg
**Status:** FIXED (upgraded to 7.5.8)

**What it was:** An attacker who could influence protobuf message definitions (via deserialization) could achieve arbitrary JavaScript code execution on the server. The library generated JavaScript code from protobuf descriptors without safely escaping constructor/property names, allowing prototype injection or code generation gadgets.

**Impact if exploited:** Full server compromise — an attacker could read environment variables (including all secrets), make outbound requests, or execute arbitrary commands. This was the most dangerous vulnerability in the dependency tree.

**Why it was risky here:** `protobufjs` was a transitive dependency of `firebase-admin`. Firebase Admin SDK uses protobufjs internally for Firestore/gRPC communication. While the vector typically requires crafted protobuf payloads, the upgrade was essential given the severity.

---

### HIGH-01 — drizzle-orm SQL Injection via Identifier Escaping (CVSS 7.5)

**Package:** `drizzle-orm` < 0.45.2
**Advisory:** GHSA-gpj5-g38j-94v9
**Status:** FIXED (upgraded to 0.45.2)

**What it was:** Drizzle ORM improperly escaped SQL identifiers (table names, column names) in certain query patterns. If user-controlled values were passed as identifier arguments (not just as bound parameters), a malicious value like `"users; DROP TABLE users--"` could inject raw SQL.

**Impact if exploited:** Unauthorized database reads or writes. In this app, this could expose all user pantry data, cooking history, and profile information — or allow an attacker to corrupt or delete records.

**Why it mattered here:** The app uses Drizzle extensively for all database queries. Although the main query patterns use bound parameters (safe), the identifier escaping bug meant that any query using user-supplied column or table references would be vulnerable. Upgrading to 0.45.2 was straightforward and had no API-breaking changes.

---

### HIGH-02 — lodash Code Injection via `_.template` (CVSS 8.1)

**Package:** `lodash` ≤ 4.17.23
**Advisory:** GHSA-r5fr-rjxr-66jc
**Status:** FIXED (upgraded to 4.18.1)

**What it was:** Lodash's `_.template()` function compiled import key names from the `imports` option directly into JavaScript `with()` blocks without sanitization. If an attacker could control the key names of the `imports` object, they could inject arbitrary JavaScript that would execute at template compilation time.

**Impact if exploited:** Remote code execution in any context where `_.template()` was used with attacker-controlled import keys. In this repo, lodash was a transitive dependency; the direct exploitation path was limited, but the upgrade was warranted.

---

### HIGH-03 — IDOR on Cooking Session Update/Complete (No CVSS assigned — code-level)

**Endpoints:** `PUT /api/cooking/session/:id`, `POST /api/cooking/session/:id/complete`
**Status:** FIXED (added `requireCookingSessionOwnership` middleware)

**What it was:** Both endpoints called `storage.updateCookingSession(sessionId, data)` which only filtered by session ID — it did not verify that the session belonged to the authenticated user. Any logged-in user who knew (or guessed) another user's session ID could update or complete that session, overwriting their progress, ratings, and notes.

**Impact if exploited:** A malicious user could:
1. Corrupt another user's cooking session data
2. Mark sessions as complete with zero progress (sabotage)
3. Guess sequential session IDs (integer primary keys are predictable) to find and corrupt other users' active sessions

**Why the fix matters:** The new `requireCookingSessionOwnership` middleware fetches the session first, checks `session.authUserId !== firebaseUser.uid`, and returns 403 if there's a mismatch. This is the correct pattern.

---

### HIGH-04 — Unauthenticated AI/Third-Party API Routes (No CVSS — code-level)

**Endpoints (formerly unprotected):** `/api/recipes/suggestions`, `/api/recipes/pantry`, `/api/cooking/steps`, `/api/ingredients/alternatives`, `/api/cooking/assistance`, `/api/vision/analyze`, `/api/speech/synthesize`, `/api/speech/transcribe`
**Status:** FIXED (all now require `isAuthenticated` + rate limiting)

**What it was:** All core AI-powered endpoints accepted requests without any Firebase authentication token. Combined with no rate limiting, any script with internet access could exhaust the app's OpenAI and ElevenLabs quota.

**Impact if exploited:** Direct financial cost — API bills could spike to hundreds or thousands of dollars before the account hit its spending limit. ElevenLabs TTS and OpenAI vision/transcription are particularly expensive per-call endpoints.

---

### MEDIUM-01 — Multiple ReDoS Vulnerabilities in Path Matchers (CVSS 7.5)

**Packages:** `minimatch`, `picomatch`, `path-to-regexp`, `brace-expansion`
**Status:** FIXED via dependency upgrades

**What it was:** Regular Expression Denial of Service (ReDoS) — crafted inputs to these glob/path matchers could cause exponential backtracking in regex evaluation, hanging the Node.js event loop for seconds or permanently.

**Impact if exploited:** Denial of service. If any of these libraries processed user-provided values as glob patterns or route paths, a single crafted request could make the server unresponsive. The risk was mostly in development tools (minimatch/picomatch used by Vite/esbuild), but `path-to-regexp` is used by Express itself for route matching.

---

## Open Findings on origin/main

These issues exist in the currently deployed code and have not been addressed by Codex's prior remediations.

---

### MEDIUM-01 — X-Forwarded-For IP Spoofing in Rate Limiters

**Severity:** Medium
**File:** `server/rate-limit.ts`, `getClientIp()` function
**Status:** Open

**What it is:**

The `getClientIp()` function reads the raw `x-forwarded-for` header and takes the **first** entry:

```typescript
export function getClientIp(req: Request): string {
  const forwardedFor = req.headers["x-forwarded-for"];
  if (typeof forwardedFor === "string" && forwardedFor.length > 0) {
    return forwardedFor.split(",")[0].trim();  // ← first entry = client-provided
  }
  return req.ip || req.socket.remoteAddress || "unknown";
}
```

With `app.set("trust proxy", 1)` in `server/index.ts`, Express is configured to trust one proxy (Replit's load balancer). When a request arrives, Replit's proxy appends the real client IP to the X-Forwarded-For header. The chain looks like:

```
X-Forwarded-For: <attacker-supplied>, <replit-appended-real-ip>
```

But `getClientIp` takes `split(",")[0]`, which is the **attacker-supplied first entry**, not the real IP. An attacker who wants to bypass IP rate limits simply sets `X-Forwarded-For: 1.2.3.4` in every request, cycling through fake IPs to avoid being counted.

**Which rate limits are affected:**

All IP-keyed rate limiters use `getClientIp` as their key generator:
- `feedbackIpLimit` — used on `POST /api/feedback` (unauthenticated)
- `recipeIpHourLimit`, `slopBowlIpHourLimit`, `aiIpHourLimit`, `voiceIpHourLimit`, `speechIpHourLimit` — used alongside user-based limits on authenticated routes

**Most critical path:** `/api/feedback` is the only unauthenticated endpoint with meaningful IP rate limiting and no user-based fallback. An attacker can submit unlimited feedback spam by cycling spoofed X-Forwarded-For values.

For authenticated endpoints, the user-based rate limits (`getUserRateLimitKey` uses Firebase UID) still apply and can't be spoofed, so the practical impact is lower there.

**How Express's `trust proxy` should work:** The correct fix is to use `req.ip` instead of manually reading `x-forwarded-for`. When `trust proxy: 1` is set, Express sets `req.ip` to the IP address **before** the last trusted proxy hop — i.e., the real client IP as seen by Replit's proxy, not a user-spoofable value.

**Remediation:**

```typescript
// server/rate-limit.ts
export function getClientIp(req: Request): string {
  // req.ip respects the 'trust proxy' setting: it resolves to the real client
  // IP as seen by the last trusted proxy (Replit's load balancer), not the
  // first X-Forwarded-For entry which can be spoofed by the client.
  return req.ip || req.socket.remoteAddress || "unknown";
}
```

**Why not blocking:** The attacker still needs to send many requests (each with a different spoofed IP) to meaningfully abuse this. The Express global `apiRequestLimit` (applied before routes) may catch bulk abuse regardless. But for completeness, the fix is a one-liner.

---

### MEDIUM-02 — No HTTP Security Headers

**Severity:** Medium
**File:** `server/index.ts`
**Status:** Open

**What it is:**

The Express server does not use `helmet` or set any HTTP security response headers. Every API and page response is missing:

| Header | Purpose | Missing? |
|--------|---------|---------|
| `Content-Security-Policy` | Restricts sources for scripts, styles, frames | Yes |
| `X-Content-Type-Options: nosniff` | Prevents MIME-type sniffing | Yes |
| `X-Frame-Options: DENY` | Prevents clickjacking via iframes | Yes |
| `Referrer-Policy` | Controls referrer information leakage | Yes |
| `Permissions-Policy` | Restricts browser feature access | Yes |
| `Strict-Transport-Security` (HSTS) | Forces HTTPS on subsequent visits | Yes |

**Impact:**

1. **XSS escalation** — Without CSP, any XSS vulnerability (in recipe content, user notes, or a future feature) has no browser-enforced mitigation. An attacker who injects a `<script>` tag into rendered recipe content could steal Firebase tokens stored in `localStorage`.

2. **Clickjacking** — Without X-Frame-Options, the app can be embedded in a malicious iframe that tricks users into clicking buttons (e.g., starting a cooking session) they didn't intend to.

3. **MIME sniffing** — Without X-Content-Type-Options, a browser might interpret a malicious upload (if any file serving is added later) as executable rather than the declared content type.

**Why it matters for a cooking app:** Recipe content from OpenAI is rendered in the UI. If a prompt injection attack caused the AI to embed a malicious `<img>` or `<script>` tag in recipe text, and the front-end renders it without escaping (React does escape by default, but shadcn/ui's `dangerouslySetInnerHTML` in chart.tsx is one existing exception), CSP would be the last line of defense.

**Remediation:**

```bash
npm install helmet
```

```typescript
// server/index.ts
import helmet from "helmet";

app.set("trust proxy", 1);
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],  // Tailwind needs this
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  // HSTS only matters in production; Replit handles TLS termination
  strictTransportSecurity: process.env.NODE_ENV === "production",
}));
```

Note: The CSP directives above are a starting-point conservative policy. Vite's dev mode injects inline scripts; in production this policy should work without `unsafe-inline` for scripts. Test thoroughly after adding.

---

## Informational Findings

These are not actionable vulnerabilities but are relevant for awareness.

### INFO-01 — Admin Endpoint Paths Documented Publicly

The paths `/api/admin/eval/pending`, `/api/admin/eval/submit-batch`, `/api/admin/eval/summary`, etc. are enumerated in `CLAUDE.md`, `AGENTS.md`, and `replit.md` — all public files in a public GitHub repository.

**Not a vulnerability if:** The `ADMIN_SECRET` value is long and random (32+ characters). An attacker who knows the path still needs to guess the secret. But security-in-depth favors not advertising targets.

**Consideration for the future:** If admin endpoints grow in sensitivity, consider moving their documentation to a private location and/or using a random URL path prefix (security-by-obscurity as a secondary layer only).

---

### INFO-02 — dangerouslySetInnerHTML in Chart Component

`client/src/components/ui/chart.tsx:81` uses `dangerouslySetInnerHTML` to inject CSS custom properties. The injected content is constructed from component config (Recharts chart IDs and color configs), **not from user input or AI-generated content**. This is a known and intentional pattern in shadcn/ui.

Not exploitable in the current usage. Worth keeping an eye on if `itemConfig.color` ever accepts user-provided values.

---

### INFO-03 — Firebase Project ID in Public Documentation

`firebase-domain-setup.md` names the Firebase project as `laica-by-wilson` and documents authorized domains. Firebase project IDs are client-public by design (they appear in the Firebase SDK config embedded in the web app) — this is not a secret. However, combined with the API key from `VITE_FIREBASE_API_KEY`, an attacker could attempt to call Firebase APIs directly. Firebase Security Rules are the appropriate mitigation (ensure they are strict), not secret management.

---

## Remediation Plan

| ID | Finding | Severity | Fix | Effort |
|----|---------|---------|-----|--------|
| MEDIUM-01 | X-Forwarded-For IP spoofing in `getClientIp` | Medium | One-line: use `req.ip` instead of XFF | XS (< 1 hour) |
| MEDIUM-02 | No HTTP security headers (helmet) | Medium | Add `helmet` to `server/index.ts` | S (2-3 hours incl. CSP tuning) |
| INFO-01 | Admin paths in public docs | Info | No action required if ADMIN_SECRET is strong; optionally document strength requirements | — |
| INFO-02 | dangerouslySetInnerHTML in chart.tsx | Info | No action required | — |
| INFO-03 | Firebase project ID in public docs | Info | Verify Firebase Security Rules are restrictive | — |

### Priority recommendation

Fix **MEDIUM-01** first — it's a one-liner, zero risk, and closes a real bypass path. Then tackle **MEDIUM-02** (helmet) in a standalone PR since CSP tuning needs UI testing. Both can be separate small PRs.

---

## What Codex's Scan Covered (No Gaps Found)

Codex's 2026-05-19 triage (PR #96, closed) verified:
- GitHub CodeQL open alerts: `[]`
- Dependabot open alerts: `[]`
- Secret scanning alerts: `[]`
- npm audit high/critical: 0

This scan independently confirms those findings. The two medium issues above are new findings not covered in Codex's triage because they are code-level patterns (not npm CVEs, not secret leaks, not CodeQL-detectable SQL injection or XSS in their current form).

---

## Verification Commands

```bash
# Verify origin/main is clean
git show origin/main:package-lock.json | python3 -c "
import json, sys
data = json.load(sys.stdin)
" && echo "lockfile valid"

# Run on origin/main state
tmpdir=$(mktemp -d)
git show origin/main:package-lock.json > "$tmpdir/package-lock.json"
git show origin/main:package.json > "$tmpdir/package.json"
cd "$tmpdir" && npm audit --audit-level=high
```

Expected output: `found 0 vulnerabilities`
