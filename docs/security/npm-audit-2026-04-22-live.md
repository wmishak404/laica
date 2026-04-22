# npm Audit Report (Live) - 2026-04-22

**Agent:** replit
**Branch:** codex/security-audit-report
**Date:** 2026-04-22
**Scope:** Live `npm audit` against `package-lock.json` from the Replit environment with full network access to `registry.npmjs.org`.

## Why this report exists

Codex's prior audit (`docs/security/npm-audit-2026-04-22.md`) could only complete in offline mode because the local sandbox had no DNS access to the npm registry. That report explicitly recommended a follow-up live run from a networked environment. This document is that follow-up.

## Executive summary

The live audit found **19 vulnerabilities** across the locked dependency tree. The offline cache result of "0 vulnerabilities" was stale — the cached advisory database in Codex's sandbox did not reflect current advisories.

| Severity | Count |
| --- | ---: |
| Critical | 1 |
| High | 8 |
| Moderate | 9 |
| Low | 1 |
| Info | 0 |
| **Total** | **19** |

Locked dependency tree: 917 packages (643 prod, 154 dev, 194 optional, 8 peer).

## Findings by severity

### 🔴 Critical (1)

| Package | Direct? | Issue | Fix |
| --- | --- | --- | --- |
| `protobufjs` (<7.5.5) | transitive | Arbitrary code execution ([GHSA-xq3m-2v4x-88gg](https://github.com/advisories/GHSA-xq3m-2v4x-88gg)) | `npm audit fix` (non-breaking) |

### 🟠 High (8)

| Package | Direct? | Issue | Fix |
| --- | --- | --- | --- |
| `drizzle-orm` (<0.45.2) | **direct** | SQL injection via improperly escaped SQL identifiers ([GHSA-gpj5-g38j-94v9](https://github.com/advisories/GHSA-gpj5-g38j-94v9)) | `--force` → `drizzle-orm@0.45.2` (**breaking**) |
| `multer` (<=2.1.0) | **direct** | 3 DoS advisories (incomplete cleanup, resource exhaustion, uncontrolled recursion) | `npm audit fix` (non-breaking) |
| `vite` (≤6.4.1, 7.0.0–7.3.1) | **direct** | Path traversal in optimized deps `.map` handling | `--force` → `vite@8.0.9` (**breaking**) |
| `path-to-regexp` (<0.1.13) | transitive (Express) | ReDoS via multiple route parameters | `npm audit fix` (non-breaking) |
| `lodash` | transitive | Prototype pollution + code injection via `_.template` (3 advisories) | `npm audit fix` |
| `minimatch` (9.0.0–9.0.6) | transitive | Multiple ReDoS variants | `npm audit fix` |
| `picomatch` (≤2.3.1, 4.0.0–4.0.3) | transitive | POSIX class method injection + extglob ReDoS | `npm audit fix` |
| `rollup` (4.0.0–4.58.0) | transitive (Vite) | Arbitrary file write via path traversal | `npm audit fix` |

### 🟡 Moderate (9)

| Package | Direct? | Issue | Fix |
| --- | --- | --- | --- |
| `@babel/helpers` (<7.26.10) | transitive | Inefficient regex complexity in transpiled named-capture replacements | `npm audit fix` |
| `brace-expansion` (2.0.0–2.0.2) | transitive | Zero-step sequence hangs the process | `npm audit fix` |
| `esbuild` (<=0.24.2) | transitive (Vite/tsx/drizzle-kit) | Dev server accepts cross-origin requests from any website | `--force` → `vite@8.0.9` (**breaking**) |
| `@esbuild-kit/core-utils` | transitive (drizzle-kit) | Pulls in vulnerable esbuild | `--force` → `drizzle-kit@0.31.10` (**breaking**) |
| `@esbuild-kit/esm-loader` | transitive (drizzle-kit) | Same as above | `--force` → `drizzle-kit@0.31.10` (**breaking**) |
| `drizzle-kit` (0.9.1–0.9.54, 0.12.9–1.0.0-beta.1-fd8bfcc) | **direct** | Inherits esbuild advisories via `@esbuild-kit/*` | `--force` → `drizzle-kit@0.31.10` (**breaking**) |
| `tsx` (3.13.0–4.19.2) | **direct** | Inherits esbuild advisory | `npm audit fix` (non-breaking) |
| `@vitejs/plugin-react` (2.0.0-alpha.0–4.3.3) | **direct** | Inherits vite advisory | `npm audit fix` (non-breaking) |
| `yaml` (2.0.0–2.8.2) | transitive | Stack overflow via deeply nested collections | `npm audit fix` |

### 🟢 Low (1)

| Package | Direct? | Issue | Fix |
| --- | --- | --- | --- |
| `qs` (6.7.0–6.14.1) | transitive (Express) | `arrayLimit` bypass in comma parsing → DoS | `npm audit fix` |

## Production vs development impact

**Runtime / production-facing:**
- `protobufjs` — pulled in via Firebase / GCP SDKs; arbitrary code execution is the highest-priority advisory.
- `drizzle-orm` — used in every server query; SQL injection risk is real for any path that accepts user-controlled identifiers.
- `multer` — used directly for image uploads in Pantry / Equipment scanning; DoS vectors are reachable.
- `path-to-regexp`, `qs`, `lodash` — Express ecosystem; ReDoS and prototype pollution.
- `vite` runtime — only used in dev. Path-traversal advisory matters for the dev server, less for prod build output.

**Build / development-only:**
- `esbuild`, `rollup`, `@esbuild-kit/*`, `drizzle-kit`, `tsx`, `@vitejs/plugin-react`, `picomatch`, `minimatch`, `brace-expansion`, `@babel/helpers`, `yaml` — these run during build, dev server, or migrations. Risk mostly affects the developer / CI environment (which still holds Replit Secrets and the Neon DATABASE_URL), not the deployed app at runtime.

## Recommended fix sequence

The advisories cleanly split into two groups by required disruption:

### Phase A — Safe fixes (single command)

```bash
npm audit fix
```

Resolves: protobufjs, multer, path-to-regexp, lodash, picomatch, minimatch, rollup, qs, yaml, @babel/helpers, brace-expansion, tsx, @vitejs/plugin-react.

This eliminates the critical advisory and 5 of the 8 highs without breaking changes. Validation needed: `npm run check`, `npm run build`, manual smoke test of pantry/equipment image upload (multer path).

### Phase B — Breaking upgrades (separate PR each)

These need their own PRs with focused validation:

1. **`drizzle-orm` 0.45.2** — read the changelog for breaking query-builder changes; smoke-test every server route that reads/writes the DB. This is the most important Phase B item because of the SQL injection severity.
2. **`vite` 8** + **`drizzle-kit` 0.31** — both pull in the fixed esbuild. Bumping `vite` may cascade into `@vitejs/plugin-react`, the dev workflow, and HMR config in `server/vite.ts`. `drizzle-kit` upgrade affects `npm run db:push` behavior.

## Open questions for Codex (alignment)

Before applying any fix, the following decisions benefit from agent-to-agent review:

1. **Phase A vs Phase B sequencing.** Should Phase A go in a single PR (fast, lower risk), or should we split it further (e.g., multer alone because it touches a user-facing upload path)?
2. **Drizzle ORM upgrade scope.** 0.45.x is several minors ahead of what's locked. Do we want a dedicated handoff that lists every drizzle import path before the bump, or do we trust `npm run check` to catch breakage?
3. **Vite 8 timing.** Vite 8 is a large bump. Replit's dev workflow uses the stock vite-plus-Express integration in `server/vite.ts`; the forbidden-changes rule blocks rewriting that file. Confirm whether a vite major bump is even compatible with that setup before scheduling.
4. **drizzle-kit major bump.** Affects `npm run db:push`. We should confirm migrations behave the same against Neon before promoting this to main.
5. **Per-fix validation matrix.** `npm run check` and `npm run build` are the obvious gates; do we also want a Playwright smoke-run or a manual checklist on the live cooking flow before each phase merges?

## Verification

```bash
npm audit         # 19 vulnerabilities (1 low, 9 moderate, 8 high, 1 critical)
npm audit --json  # machine-readable advisories captured for this report
```

Both commands completed against the live `registry.npmjs.org` from the Replit environment.

## Merge recommendation

Merge this report alongside Codex's prior offline report so the security trail shows: (a) what the offline cache claimed, (b) what the live audit actually found, and (c) the staged fix plan.

Do not bundle dependency upgrades into this PR. Apply Phase A in a follow-up implementation PR after Codex acknowledges the sequencing.
