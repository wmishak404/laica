# npm Audit Remediation Follow-Up - 2026-05-15

**Agent:** codex
**Branch:** codex/npm-security-scan
**Date:** 2026-05-15
**Scope:** Targeted dependency remediation after the 2026-05-14 live audit report

## Executive summary

This follow-up implements the safest fix that was both:

1. real in this dependency graph, and
2. low-risk to apply without destabilizing runtime behavior.

The change:

- adds an npm override so `firebase-admin` resolves `uuid` to `11.1.1`

Result:

- audit count improved from **13** findings to **12**
- moderate findings improved from **5** to **4**
- the `uuid@11.1.0` advisory is gone

The remaining findings are:

- 4 moderate findings in the `drizzle-kit -> @esbuild-kit/* -> esbuild@0.18.20` dev-tool chain
- 8 low findings in the `firebase-admin` Firestore/Storage transitive subtree

## What changed

### `package.json`

Added:

```json
"overrides": {
  "firebase-admin": {
    "uuid": "^11.1.1"
  }
}
```

### `package-lock.json`

The lockfile now resolves the `firebase-admin` subtree to `uuid@11.1.1` instead of `uuid@11.1.0`.

It also de-duplicates several older nested `uuid` copies in that subtree, so the installed graph is cleaner than before.

## Why this fix was safe

`firebase-admin@13.8.0` already declares:

```json
"uuid": "^11.0.2"
```

That means `11.1.1` is inside the dependency range the package author already accepts.

So this is not a forced cross-major hack. It is a patch/minor-level resolution inside the package's own allowed semver range.

## What we tried and rejected

### Attempted `drizzle-kit` remediation via nested `esbuild` override

I tested whether the remaining `drizzle-kit` advisory could be fixed locally by overriding the nested `@esbuild-kit/core-utils -> esbuild` dependency to a patched version.

That did **not** work safely:

- npm kept the old nested `esbuild@0.18.20`
- the tree became logically invalid under `npm ls`
- the audit result did not improve

So that override was removed.

This matters because it confirms the remaining `drizzle-kit` issue is not something we can responsibly "paper over" with a local override. It needs either:

- an upstream dependency change from `drizzle-kit`, or
- a deliberate tool replacement / major workflow change

## Current audit state after remediation

### Severity counts

| Severity | Count |
| --- | ---: |
| Critical | 0 |
| High | 0 |
| Moderate | 4 |
| Low | 8 |
| **Total** | **12** |

### What is now fixed

- `uuid@11.1.0` under `firebase-admin`

### What remains

- `drizzle-kit`
- `@esbuild-kit/esm-loader`
- `@esbuild-kit/core-utils`
- nested `esbuild@0.18.20`
- `firebase-admin` low-severity Firestore/Storage subtree:
  - `@google-cloud/firestore`
  - `@google-cloud/storage`
  - `google-gax`
  - `retry-request`
  - `teeny-request`
  - `http-proxy-agent`
  - `@tootallnate/once`

## Practical interpretation

This branch successfully removed the most actionable moderate issue from the current audit.

It did **not** fully clear the audit, because the remaining items are either:

- tied to an upstream-abandoned `drizzle-kit` path, or
- low-severity transitive packages under `firebase-admin` that npm still claims would only be "fixed" by a downgrade to `firebase-admin@10.3.0`

That suggested downgrade is not a responsible automatic fix for this repo.

## Recommended next step

1. Merge this targeted remediation if you want the immediate `uuid` improvement.
2. Keep the remaining `drizzle-kit` chain in the monitored-risk bucket unless upstream changes.
3. Reassess the low Firebase transitive findings only if:
   - a safe forward `firebase-admin` release changes the subtree, or
   - those low findings get reclassified to higher severity.

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

- `npm audit --json` now reports `12` findings total: `4 moderate`, `8 low`, `0 high`, `0 critical`
- `npm ls` shows the `firebase-admin` subtree resolving to `uuid@11.1.1`
- `npx drizzle-kit --help` still works after the final dependency state
- `npm run check` completed successfully
- `npm run build` completed successfully
