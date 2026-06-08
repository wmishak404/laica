# npm security scan report and draft PR

**Agent:** codex
**Branch:** codex/npm-security-scan
**Date:** 2026-05-14
**Initiative:** none
**INIT updated:** n/a

## Summary

Ran a fresh live `npm audit --json` from the Codex worktree and documented the current security state in a new dated report for a non-software-engineer reader.

The current live audit succeeded from this environment with no high or critical findings. The main repo-specific takeaway is that the result was dominated by a few transitive dependency roots rather than unrelated application issues.

## Changes

- `docs/security/npm-audit-2026-05-14.md`
  - Adds the 2026-05-14 live audit report with repo-specific usage notes and a plain-English deep dive on practical impact.
- `docs/handoffs/2026-05-14-codex-npm-security-scan.md`
  - Adds this handoff.

## Impact on other agents

This branch is documentation-only. No dependency versions or application code changed.

If another agent picks up remediation work, the most useful next investigation is the newly surfaced moderate transitive finding with a plausible forward-fix path. The remaining development-tooling chain stays a monitored dev-time risk unless upstream removes the flagged transitive path.

## Open items

- Publish this docs-only branch as a draft PR.
- If Wilson wants remediation, open a separate dependency-focused branch/PR rather than extending this reporting branch.
- Any remediation PR should explicitly validate affected auth/tooling flows and avoid casual downgrades.

## Verification

Commands run on 2026-05-14:

```bash
npm audit --json
npm ls <affected-direct-packages> --all
npm ls <affected-development-tool-chain> --all
npm ls <affected-runtime-helper-chain> --all
rg -n "firebase-admin|from 'firebase-admin|from \"firebase-admin" server shared client -g'*.ts' -g'*.tsx'
```

Observed result:

- `npm audit --json` succeeded and reported no high or critical findings.
- `npm ls` confirmed the moderate development-tooling chain remained isolated.
- `npm ls` confirmed the runtime helper chain that needed follow-up.
- local source search found auth admin imports in [`server/firebaseAuth.ts`](/Users/wilsonishak-macbookpro/.codex/worktrees/3006/laica/server/firebaseAuth.ts:2), but no direct local imports of the optional admin APIs involved in the helper chain.
