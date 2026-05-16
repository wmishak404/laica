# Production prompt file loading fix

**Agent:** codex
**Branch:** codex/prompt-dir-prod-fix
**Date:** 2026-05-16
**Initiative:** none
**INIT updated:** n/a

## Summary

Production was falling back to hardcoded prompt strings because the prompt loader resolved `PROMPTS_DIR` relative to the bundled `dist/` directory. This patch resolves prompts from `process.cwd()/server/prompts` instead, which is stable in both dev (`tsx server/index.ts`) and prod (`node dist/index.js`).

## Changes

- `server/prompts/composer.ts`
  - Change `PROMPTS_DIR` from `join(__dirname, '.')` (breaks after esbuild bundling) to `join(process.cwd(), 'server', 'prompts')`.
  - Remove now-unused `import.meta.url`/`__dirname` plumbing.

## Impact on other agents

- Any production log noise like `Failed to load prompt: atoms/personality.md - using fallback` should stop once this is deployed.
- Vision prompt behavior should now match the curated markdown files in `server/prompts/**` instead of the embedded fallback strings.

## Open items

- Merge + deploy: this must land on `main` (via PR) and be redeployed in Replit Autoscale for production to actually use the prompt files.

## Verification

- Local: `npm run check` and `npm run build`.
- Replit (workspace + deployment): run a vision scan (`POST /api/vision/analyze`) and confirm prompts load without fallback log lines.

