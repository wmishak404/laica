# Dependabot medium/low maintenance

**Agent:** codex  
**Branch:** `codex/dependabot-medium-low-maintenance`  
**Date:** 2026-05-19  
**Initiative:** none  
**INIT updated:** n/a

## Summary

Cleared the remaining medium/low npm audit findings with a narrow dependency-maintenance change instead of reviving broad PR #88 or accepting `npm audit fix --force` downgrades. The branch keeps the existing high/critical CI gate policy unchanged and uses npm overrides only for the vulnerable transitive helper packages that Dependabot/audit identified.

## Changes

- `package.json` — adds an override for `@esbuild-kit/core-utils -> esbuild@^0.25.12`, replacing the vulnerable nested `esbuild@0.18.20` pulled through `drizzle-kit -> @esbuild-kit/esm-loader`.
- `package.json` — adds an override for `@tootallnate/once@^3.0.1`, replacing the vulnerable nested `@tootallnate/once@2.0.0` pulled through `firebase-admin -> @google-cloud/storage -> teeny-request -> http-proxy-agent`.
- `package-lock.json` — refreshes the resolved transitive packages for those two override paths.

## Impact on other agents

`drizzle-kit` is already at the current registry release (`0.31.10`) and still declares `@esbuild-kit/esm-loader`; Firebase Admin's current line still declares optional Google Cloud packages that resolve the low advisory path. The audit tool recommended downgrades (`drizzle-kit@0.18.1`, `firebase-admin@10.3.0`) were rejected as higher-risk than these medium/low advisories.

The overrides should be treated as maintenance guardrails, not permanent product architecture. Remove them once upstream `drizzle-kit`, `firebase-admin`, or the Google Cloud helper packages ship patched dependency ranges that resolve cleanly without overrides.

## Open items

- Replit validation was not run because this is dependency metadata plus local tooling/runtime import smoke coverage, with no product flow or service-backed behavior change.
- Monitor future Dependabot PRs for upstream removal opportunities. If an upstream package release removes `@esbuild-kit/esm-loader` or moves Google Cloud helpers past the vulnerable chain, prefer dropping these overrides over adding more.

## Verification

- `npm ci`
- `npm ls esbuild @esbuild-kit/core-utils @esbuild-kit/esm-loader drizzle-kit --all`
- `npm ls @tootallnate/once http-proxy-agent teeny-request retry-request google-gax @google-cloud/firestore @google-cloud/storage firebase-admin --all`
- `npm run check`
- `npm run build`
- `npm audit --json` (`0` total vulnerabilities)
- `npx drizzle-kit --version`
- `node --input-type=module -e "await import('firebase-admin/app'); await import('firebase-admin/storage'); await import('firebase-admin/firestore'); console.log('firebase-admin optional modules loaded')"`
- `git diff --check`

## Stack / base status

- Base refreshed: yes
- Current base: `origin/main` at `71b7d5cd083e59de599156f262520bb7f8cf281c`
- Last Replit-validated at: not yet validated
- Notes: independent maintenance branch; rebased after PR #82 merged while PR #93 was waiting to merge.
