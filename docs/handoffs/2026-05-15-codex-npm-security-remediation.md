# npm security remediation follow-up

**Agent:** codex
**Branch:** codex/npm-security-scan
**Date:** 2026-05-15
**Initiative:** none
**INIT updated:** n/a

## Summary

Applied the safest actionable remediation from the current npm audit: pinned the `firebase-admin` subtree to `uuid@11.1.1` via npm overrides, then revalidated the repo.

This reduced the audit state from 13 findings to 12 and removed the moderate `uuid@11.1.0` advisory. The remaining 4 moderates are still the known `drizzle-kit -> @esbuild-kit/* -> esbuild@0.18.20` chain. I also tested a nested-esbuild override for that chain and removed it after it failed to improve the audit and left the tree logically invalid.

## Changes

- `package.json`
  - Adds an override forcing `firebase-admin` to resolve `uuid` to `^11.1.1`.
- `package-lock.json`
  - Updates the resolved `uuid` package and de-duplicates nested Firebase subtree copies.
- `docs/security/npm-audit-2026-05-15-remediation.md`
  - Records the remediation, the before/after audit counts, what was attempted, and what still remains.
- `docs/handoffs/2026-05-15-codex-npm-security-remediation.md`
  - Adds this handoff.

## Impact on other agents

This branch is no longer docs-only. It now changes dependency resolution through `package.json` and `package-lock.json`.

If another agent continues security cleanup, do not retry the removed nested-`esbuild` override without a more principled upstream strategy. It did not improve the audit and created an invalid dependency tree during testing.

## Open items

- Remaining audit state is 12 findings total: 4 moderate, 8 low.
- The unresolved moderate cluster is still the `drizzle-kit` dev-tool chain.
- The unresolved low cluster is still the `firebase-admin` Firestore/Storage subtree.
- If more remediation is desired, it should be a separate decision about whether to accept the remaining dev-tool and low-severity transitive risk or to change tooling/packages more aggressively.

## Verification

Commands run:

```bash
npm install
npm audit --json
npm ls firebase-admin uuid drizzle-kit @esbuild-kit/core-utils @esbuild-kit/esm-loader esbuild --all
npx drizzle-kit --help
npm run check
npm run build
```

Observed results:

- `npm audit --json` reports 12 findings total: 4 moderate, 8 low, 0 high, 0 critical.
- `npm ls` shows `firebase-admin` resolving to `uuid@11.1.1`.
- `npx drizzle-kit --help` succeeds.
- `npm run build` succeeds.
- `npm run check` succeeds.
