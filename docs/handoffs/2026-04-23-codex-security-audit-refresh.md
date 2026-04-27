# Security Audit Refresh

**Agent:** codex
**Branch:** codex/security-audit-2026-04-23
**Date:** 2026-04-23

## Summary

Re-ran `npm audit` after yesterday's dependency remediation landed. The repo now has no `high` or `critical` npm findings. The remaining result is 4 `moderate` findings, all from the same `drizzle-kit -> @esbuild-kit/* -> esbuild@0.18.20` development-tool chain.

Wrote a fresh dated report for a non-software-engineer reader in `docs/security/npm-audit-2026-04-23.md` explaining what the remaining issue is, why it is less urgent than yesterday's runtime findings, and why `npm audit fix --force` should not be accepted here.

## Changes

- `docs/security/npm-audit-2026-04-23.md` - current-state audit report with a learner-friendly deep dive on direct vs transitive dependencies, runtime vs dev-time exposure, and why the suggested downgrade is unsafe.
- `docs/handoffs/2026-04-23-codex-security-audit-refresh.md` - this handoff.

## Impact on other agents

No application code or dependency versions changed in this pass. This is a docs/reporting-only branch.

If another agent revisits the remaining moderate audit issue, start by checking whether a newer `drizzle-kit` release has removed the `@esbuild-kit/*` chain before attempting any manual package surgery.

## Open items

- Monitor future `drizzle-kit` releases for removal of the `@esbuild-kit/*` dependency chain.
- Re-run `npm audit` on the next dependency maintenance cycle or if a new advisory lands against `drizzle-kit` / `esbuild`.
- If a future audit proposes a real forward upgrade instead of a downgrade, reassess the tradeoff at that time.

## Verification

Commands run:

```bash
npm audit
npm audit --json
npm ls drizzle-kit @esbuild-kit/core-utils @esbuild-kit/esm-loader esbuild
```

Observed result:

- `npm audit` reports 4 moderate vulnerabilities and 0 high / 0 critical.
- `npm ls` confirms the vulnerable nested `esbuild@0.18.20` only appears inside the `drizzle-kit` toolchain.
