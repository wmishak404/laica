# npm security scan report and draft PR

**Agent:** codex
**Branch:** codex/npm-security-scan
**Date:** 2026-05-14
**Initiative:** none
**INIT updated:** n/a

## Summary

Ran a fresh live `npm audit --json` from the Codex worktree and documented the current security state in a new dated report for a non-software-engineer reader.

The current live audit succeeds from this environment and reports 13 advisories total: 5 moderate and 8 low, with no high or critical findings. The main repo-specific takeaway is that the count is dominated by three roots rather than 13 unrelated problems: the already-known `drizzle-kit -> @esbuild-kit/* -> esbuild` dev-tool chain, a low-severity `firebase-admin` Google SDK subtree, and a newer moderate `uuid@11.1.0` finding under `firebase-admin`.

## Changes

- `docs/security/npm-audit-2026-05-14.md`
  - Adds the 2026-05-14 live audit report with exact counts, dependency-path evidence, repo-specific usage notes, and a plain-English deep dive on practical impact.
- `docs/handoffs/2026-05-14-codex-npm-security-scan.md`
  - Adds this handoff.

## Impact on other agents

This branch is documentation-only. No dependency versions or application code changed.

If another agent picks up remediation work, the most useful next investigation is the `firebase-admin -> uuid@11.1.0` path because it is the clearest newly surfaced moderate finding with a plausible forward-fix path. The `drizzle-kit` chain remains a monitored dev-time risk unless upstream removes the abandoned `@esbuild-kit/*` dependency path.

## Open items

- Publish this docs-only branch as a draft PR.
- If Wilson wants remediation, open a separate dependency-focused branch/PR rather than extending this reporting branch.
- Any remediation PR should explicitly validate Firebase auth flows and avoid casual `firebase-admin` or `drizzle-kit` downgrades.

## Verification

Commands run on 2026-05-14:

```bash
npm audit --json
npm ls drizzle-kit firebase-admin uuid --all
npm ls @esbuild-kit/core-utils @esbuild-kit/esm-loader esbuild --all
npm ls @google-cloud/firestore @google-cloud/storage google-gax retry-request teeny-request @tootallnate/once http-proxy-agent --all
rg -n "firebase-admin|from 'firebase-admin|from \"firebase-admin" server shared client -g'*.ts' -g'*.tsx'
```

Observed result:

- `npm audit --json` succeeded and reported 13 advisories total: 5 moderate, 8 low, 0 high, 0 critical.
- `npm ls` confirmed the moderate `drizzle-kit` chain still resolves to nested `esbuild@0.18.20`.
- `npm ls` confirmed `firebase-admin@13.8.0` resolves to `uuid@11.1.0`.
- local source search found `firebase-admin` imports in [`server/firebaseAuth.ts`](/Users/wilsonishak-macbookpro/.codex/worktrees/3006/laica/server/firebaseAuth.ts:2), but no direct local imports of Firestore or Storage admin APIs.
