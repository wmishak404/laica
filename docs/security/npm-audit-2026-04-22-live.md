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

---

## Closeout — 2026-04-23

The staged fix plan above was executed across one Phase A PR and three Phase B PRs. This section records what actually shipped, the deviations from the original plan, and the current state of `package-lock.json` on `main`.

### Executive result

| Metric | At report (2026-04-22) | After Phase A | After B.1 | After B.2 | **After B.3 (current)** |
| --- | ---: | ---: | ---: | ---: | ---: |
| Critical | 1 | 0 | 0 | 0 | **0** |
| High | 8 | 2 | 1 | 1 | **0** |
| Moderate | 9 | 3 | 4 | 4 | **4** |
| Low | 1 | 0 | 0 | 0 | **0** |
| **Total** | **19** | **5** | **5** | **5** | **4** |

**Net result: Critical eliminated, all 8 HIGHs eliminated, audit total down 79% (19 → 4).** All remaining advisories are moderate severity in the dev-only `@esbuild-kit/*` cluster (see "Risk-accepted residual" below).

### What shipped

| PR | Title | What it did | Cleared |
| --- | --- | --- | --- |
| **#11** (Phase A) | npm audit fix — non-breaking patches | `protobufjs`, `multer`, `path-to-regexp`, `lodash`, `picomatch`, `minimatch`, `rollup`, `qs`, `yaml`, `@babel/helpers`, `brace-expansion`, `tsx`, `@vitejs/plugin-react` | 1 critical + 6 high + 6 moderate + 1 low |
| **#12** (Phase B.1) | drizzle-orm 0.39.3 → 0.45.2 | Direct dependency major bump | 1 high (SQL injection [GHSA-gpj5-g38j-94v9](https://github.com/advisories/GHSA-gpj5-g38j-94v9)) |
| **#13** (Phase B.2) | drizzle-kit 0.30.6 → 0.31.10 | Direct dev dependency major bump; lockfile shrank ~560 lines; direct esbuild 0.19 → 0.25 | (no audit count change — abandoned `@esbuild-kit/*` cluster still pulled transitively) |
| **#14** (Phase B.3) | vite 5.4.21 → 7.3.2 | Direct dev dependency double-major bump; required peer bumps `@types/node` ^20.19.39 and `@tailwindcss/vite` 4.2.4 | 3 high ([GHSA path traversal](https://github.com/advisories/GHSA-jqfw-vq24-v9c3), [fs.deny bypass](https://github.com/advisories/GHSA-g4jq-h2w9-997c), [WebSocket arbitrary file read](https://github.com/advisories/GHSA-vg6x-rcgg-rjx6)) |

All four PRs squash-merged to `main`. Wilson smoke-tested each one before merge.

### Deviations from the original plan

1. **`vite` went to 7.3.2, not 8.** The report recommended `vite@8.0.9`. By the time we reached B.3, the vite 7.x line already shipped fixes for all three HIGH advisories (path traversal, `fs.deny` bypass, WebSocket file read) and was closer to a clean upgrade path with the existing `server/vite.ts` integration (which falls under forbidden-changes). Vite 7 cleared the same HIGHs as vite 8 would have, with smaller blast radius. Vite 8 remains a future option but isn't required for the security goal.
2. **Phase A completed in a single PR rather than splitting `multer` out.** Open question #1 in this report asked whether to isolate `multer`. We chose the single-PR path because the Phase A patches were all non-breaking and Wilson smoke-tested image upload as part of the merge gate. No regressions observed.
3. **B.2 had zero audit-count delta.** The drizzle-kit bump was honest scope — it was needed to unlock B.3 indirectly (smaller lockfile, direct esbuild bump) and to keep `db:push` on a maintained version, but the abandoned `@esbuild-kit/*` cluster still pulled the moderate esbuild advisory transitively. Documented at merge time.
4. **`db:push` migration impact (open question #4).** After B.2 merged, Wilson ran `npm run db:push` and got `No changes detected`. Confirmed safe.

### Risk-accepted residual (4 moderate)

All four remaining advisories are the same root issue propagating up the same chain:

| Package | Direct? | Issue | Why we accept |
| --- | --- | --- | --- |
| `esbuild` (≤0.24.2) | transitive (only via `@esbuild-kit/*`) | Dev server accepts cross-origin requests from any website | Dev-only; not in the runtime bundle |
| `@esbuild-kit/core-utils` | transitive (drizzle-kit) | Pulls vulnerable esbuild | Package is **abandoned and merged into tsx** (per npm warning). Cannot be patched. |
| `@esbuild-kit/esm-loader` | transitive (drizzle-kit) | Same | Same |
| `drizzle-kit` (current 0.31.10) | direct | Inherits via `@esbuild-kit/*` | Drizzle-kit needs an upstream fix to drop the `@esbuild-kit/*` dependency. We are already on the latest release. |

**Risk posture:** The vulnerable esbuild only runs during `npm run db:push` and only if a developer were tricked into visiting a malicious page in the same browser session as the dev server. The Replit and developer environments do hold secrets (Replit Secrets, Neon `DATABASE_URL`), so the risk is not zero, but it is bounded to dev-time, requires a concurrent attack, and the affected versions cannot be replaced without an upstream change in drizzle-kit. **Accepted, will re-check on each drizzle-kit release.**

### Operational lessons captured for future security passes

1. **Lockfile-corruption gotcha when swapping branches across vite/esbuild major versions.** During B.3 smoke-test, switching between PR #13 and PR #14 partially overwrote `node_modules/vite` chunk files, producing `ERR_MODULE_NOT_FOUND` on internal chunks. Fix: `rm -rf node_modules && npm install`. Recommend any future agent doing back-to-back tests across branches that touch vite or esbuild versions do a full `node_modules` wipe.
2. **GitHub auto-merge handled the lockfile cleanly between #13 → #14.** No manual rebase needed. After #13 merged, GitHub's mergeable check returned to `clean` for #14 within ~5 seconds.
3. **Branch hygiene caveat.** During the B.3 cycle, two Replit Agent checkpoint commits on the local branch had locally reverted PR #14's vite bump. We had to `git reset --hard` to the real PR head before reinstalling. Future agents working on a security branch should `git log --oneline` the current branch against the PR head before any reinstall.

### Verification (post-closeout)

```bash
$ git log --oneline -2 main
b290bd0 fix(deps): bump vite to 7.3.2 (#14)
d8379c7 chore(deps): bump drizzle-kit to 0.31.10 (#13)

$ node -p "require('vite/package.json').version"
7.3.2

$ npm audit
4 moderate severity vulnerabilities
0 high, 0 critical
```

### Status

**Phase A + Phase B closed.** No further action required for this audit cycle. Next scheduled audit: per `docs/handoffs/README.md` cadence, or sooner if a HIGH/Critical advisory lands against a direct dependency.
