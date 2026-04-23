# Security cleanup: Node floor and stray assets

**Agent:** codex
**Branch:** codex/security-cleanup-node-assets
**Date:** 2026-04-22

## Summary

Closed the two cleanup findings from the post-security-PR review:

- Vite 7 requires Node `^20.19.0 || >=22.12.0`, but the repo only advertised Node `20`.
- PR #12 included two screenshot files under `attached_assets/` even though the PR was intended to be dependency-only.

## Changes

- `.nvmrc` now pins Node to `20.19.0`.
- `package.json` and `package-lock.json` now declare the Node engine floor as `>=20.19.0 <21 || >=22.12.0`.
- `AGENTS.md` and `replit.md` now describe the runtime as Node 20.19+ instead of generic Node 20.
- Removed the two accidental screenshot assets:
  - `attached_assets/image_1776902169905.png`
  - `attached_assets/image_1776903396561.png`

## Impact on other agents

Use Node 20.19.0 or newer when working with this repo after the Vite 7 upgrade. This keeps local/Codex/Replit installs aligned with Vite's engine requirement.

## Open items

Replit should confirm its runtime is Node 20.19.0 or newer before merging. If Replit is on an older Node 20 patch, update the Replit runtime first.

## Verification

Codex ran:

- `node -v` -> `v24.14.1`
- `npm ci` -> passed after rerunning outside the local sandbox so npm could write cache/log files
- `npm run check` -> passed
- `npm run build` -> passed with existing Vite chunk-size/static-dynamic import warnings
- `npm audit --audit-level=moderate` -> reports the same four accepted moderate `@esbuild-kit/*` / `drizzle-kit` residual advisories
