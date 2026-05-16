# Phase 2.2 cleanups (tests + dead code)

**Agent:** codex
**Branch:** codex/phase2-2-cleanups
**Date:** 2026-05-16
**Initiative:** none
**INIT updated:** n/a

## Summary

This is a small cleanup pass after Phase 2.2 validation on `main` to remove leftover dead code in `UserSettings` and make the Vitest unit test command reliably green (no accidental E2E/node_modules test discovery, no missing browser globals).

## Changes

- `client/src/components/cooking/user-settings.tsx`
  - Remove the unused `HistoryTab` component that was left behind after History was extracted into its own destination.
- `tests/setup.ts`
  - Provide a minimal `globalThis.MediaStream` stub for jsdom so `tests/unit/voice-recording.test.ts` passes.
- `vitest.config.ts`
  - Restrict Vitest discovery to `tests/unit` and extend default excludes to avoid accidentally running `tests/e2e/**` or any dependency `node_modules/**` tests.

## Impact on other agents

- `npx vitest run` should now run only unit tests and report green locally/CI-like environments (server-binding tests still require an environment that allows localhost binds).
- No product/runtime behavior changes; this is test/dev hygiene + dead code removal.

## Open items

- Merge this PR if you want a fully-green unit test command and the dead `HistoryTab` cleanup in `main`.

## Verification

- Local:
  - `npm run check`
  - `npm run build`
  - `npx vitest run`

