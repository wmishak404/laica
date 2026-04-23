# Live npm Audit — Findings & Sequencing Request

**Agent:** replit
**Branch:** codex/security-audit-report
**Date:** 2026-04-22
**Reply-to:** codex (security-audit-report author)

## Summary

Ran the live `npm audit` Codex requested as the follow-up to its offline report. The cached "0 vulnerabilities" result was stale — the live registry returned **19 vulnerabilities (1 critical, 8 high, 9 moderate, 1 low)** across the 917-package locked tree.

Full findings, severity breakdown, prod-vs-dev impact, and a phased fix plan are in `docs/security/npm-audit-2026-04-22-live.md`.

## Headline findings

- 🔴 **`protobufjs`** — arbitrary code execution (critical, non-breaking fix)
- 🟠 **`drizzle-orm`** — SQL injection via improperly escaped identifiers (high, **breaking** fix → 0.45.2)
- 🟠 **`multer`** — 3 DoS advisories on our image-upload path (high, non-breaking fix)
- 🟠 **`vite`** — path traversal in optimized deps (high, **breaking** fix → vite@8)
- 🟠 Plus: `path-to-regexp`, `lodash`, `minimatch`, `picomatch`, `rollup` (all non-breaking)

## Changes in this push

- `docs/security/npm-audit-2026-04-22-live.md` — new live audit report.
- `docs/handoffs/2026-04-22-replit-security-audit-live-findings.md` — this handoff.

No code changes. No `npm audit fix` has been run. No `package.json` / `package-lock.json` modifications.

## Why I'm pausing before fixing

The advisories split cleanly into two phases:

- **Phase A:** Single `npm audit fix` clears the critical + most highs without breaking changes (protobufjs, multer, path-to-regexp, lodash, picomatch, minimatch, rollup, qs, yaml, @babel/helpers, brace-expansion, tsx, @vitejs/plugin-react).
- **Phase B:** Three breaking bumps that each deserve their own PR: `drizzle-orm@0.45.2`, `vite@8`, `drizzle-kit@0.31.10`.

Phase B is where I want Codex's review before any change lands on `main`, especially:

1. **`drizzle-orm` 0.45.x** — touches every server route. Want to know if you'd rather pre-audit drizzle import sites before the bump, or trust `npm run check` + a manual cooking-flow smoke test.
2. **`vite` 8** — collides with Replit's "do not modify `server/vite.ts` / `vite.config.ts`" rule. Need confirmation that vite 8 is compatible with the existing Express+Vite middleware integration, or we accept the path-traversal advisory as a dev-only risk and stay on vite 6.
3. **`drizzle-kit` 0.31.x** — affects `npm run db:push` against Neon. Want sign-off on whether to validate by dry-running a push from a feature branch first.

## Proposed plan (pending your input)

1. Codex reviews `npm-audit-2026-04-22-live.md`, especially the "Open questions for Codex (alignment)" section.
2. Codex replies with a handoff stating: (a) ack of Phase A as-is, (b) preferred ordering / scoping for Phase B, (c) any concerns about Vite 8 compatibility with the protected vite/express setup.
3. Replit opens Phase A as a small implementation PR off `main` (not on this branch) once acknowledged.
4. Phase B items go in their own PRs in the order Codex prefers, with the validation gates Codex specifies.

## Open items / blockers

- Awaiting Codex's reply on the sequencing questions in the report.
- No human action needed yet — Wilson asked us to align before applying any fix.

## Verification I ran

```bash
npm audit         # 19 vulnerabilities (1 low, 9 moderate, 8 high, 1 critical)
npm audit --json  # captured for the live report
```

Both succeeded against `registry.npmjs.org` from this Replit environment.
