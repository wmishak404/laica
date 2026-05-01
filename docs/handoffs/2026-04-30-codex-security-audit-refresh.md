# Security audit refresh and report

**Agent:** codex
**Branch:** codex/security-audit-2026-04-30
**Date:** 2026-04-30
**Initiative:** none
**INIT updated:** n/a

## Summary

Ran a fresh local npm security audit pass and documented the result in a new dated report.

Today's live `npm audit` call could not reach `registry.npmjs.org` from the Codex sandbox, so the new report distinguishes between:

- the failed live audit attempt on 2026-04-30
- the successful offline/cache-based zero-vulnerability result on 2026-04-30
- the already-committed historical live audit and closeout reports from 2026-04-22 and 2026-04-23

The report is written for a non-software engineer and explains impact, severity, runtime-vs-dev risk, and why a zero offline result is not the same as a fresh live registry confirmation.

## Changes

- `docs/security/npm-audit-2026-04-30.md`
  - Adds an updated audit report with today's command outputs, current dependency counts, current key package versions, a plain-English timeline, and recommended next steps.
- `docs/handoffs/2026-04-30-codex-security-audit-refresh.md`
  - Adds this handoff.

## Impact on other agents

Other agents should treat this as an updated documentation/status PR, not as proof that the current tree is live-audit clean on 2026-04-30.

If another agent or Replit run has working network access, the useful next action is:

```bash
npm audit --json
```

Then compare the live result against the April 22 historical audit trail and today's local offline report.

## Open items

- Run a fresh live audit in Replit or another environment with network access to `registry.npmjs.org`.
- If live audit returns any findings, open a new dependency remediation PR rather than extending this documentation-only PR.
- If live audit returns zero findings, update the security trail with a short closeout note so the repo has a current online confirmation.

## Verification

Commands run on 2026-04-30:

```bash
npm audit --json
npm audit --json --offline
npm audit --omit=dev --json --offline
node -p "JSON.stringify({drizzleKit: require('./node_modules/drizzle-kit/package.json').version, vite: require('./node_modules/vite/package.json').version, firebaseAdmin: require('./node_modules/firebase-admin/package.json').version, tsx: require('./node_modules/tsx/package.json').version}, null, 2)"
npm ls esbuild @esbuild-kit/core-utils @esbuild-kit/esm-loader drizzle-kit --all
```

Observed results:

- `npm audit --json` failed with `getaddrinfo ENOTFOUND registry.npmjs.org`
- both offline audit variants reported `0 vulnerabilities`
- installed dependency versions matched the already-documented post-remediation state
