# npm audit security report

**Agent:** codex
**Branch:** codex/security-npm-audit-report
**Date:** 2026-05-07
**Initiative:** none
**INIT updated:** n/a

## Summary

Ran `npm audit --json`, analyzed the dependency tree, and wrote a plain-English security report for Wilson in `docs/security/2026-05-07-npm-audit-report.md`.

The report groups the 13 audit findings into three root-cause buckets: the `drizzle-kit` dev-tooling chain, the `firebase-admin` runtime transitive chain, and the `uuid` production patch gap. It explains what each means, why the production-vs-tooling distinction matters, and what a safe next remediation PR should target.

## Changes

- `docs/security/2026-05-07-npm-audit-report.md`: full audit report, dependency-path breakdown, plain-English explanations, and recommended follow-up actions.
- `docs/handoffs/2026-05-07-codex-security-npm-audit-report.md`: this handoff.

## Impact on other agents

- No app code or dependency versions were changed on this branch.
- If another agent wants to remediate the findings, the clean next step is a separate dependency-update branch that targets `firebase-admin` and the `uuid` lockfile patch first, then re-runs `npm audit`.
- The `drizzle-kit` finding should be treated as tooling-watchlist work, not a blind `npm audit fix --force`.

## Open items

- Draft PR still needs to be opened for this docs-only branch.
- No dependency remediation was attempted here.
- GitHub CLI auth was invalid locally, so PR creation uses the GitHub connector path instead of `gh`.

## Verification

- `npm audit --json`
- `npm ls drizzle-kit @esbuild-kit/esm-loader @esbuild-kit/core-utils esbuild firebase-admin @google-cloud/firestore @google-cloud/storage google-gax retry-request teeny-request http-proxy-agent @tootallnate/once uuid --all`
- `npm audit fix --dry-run --json`

## Stack / base status

- Base refreshed: no
- Current base: worktree HEAD `cb94f28`
- Last Replit-validated at: not applicable (docs-only branch)
- Notes: audit/report branch only; no Replit validation needed
