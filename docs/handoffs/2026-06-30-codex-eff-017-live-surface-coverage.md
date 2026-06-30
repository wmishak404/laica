# EFF-017 Live Surface Coverage

**Agent:** codex
**Branch:** codex/eff-017-live-surface-coverage
**Date:** 2026-06-30
**Initiative:** none
**INIT updated:** n/a
**Resolves blocked handoff:** docs/handoffs/2026-06-05-codex-eff-017-oauth-preflight-blocked.md

## Summary

Daily Efforts hygiene found no active-list, registry, INIT-routing, or agent-entrypoint drift that needed source-of-truth changes. EFF-017 and EFF-022 remain the only active Efforts. EFF-017 was selected because deterministic live-surface coverage is unblocked and supports auth/session confidence, CI evidence, Replit validation discipline, and release readiness across multiple INITs.

This branch hardens the Live Cooking transcript pin preference and adds focused regression coverage. A malformed `laica_transcription_pinned` localStorage value now falls back to the safe default pinned transcript instead of crashing Live Cooking during render.

The old EFF-017 OAuth preflight blocked handoff is made queryable here as resolved-by-later-evidence: PR #165 and the 2026-06-10 EFF-017 test-gate handoff restored the scheduled/manual OAuth start preflight canary after the private key/target alignment passed. This branch does not change OAuth behavior; it only prevents future blocked-handoff scans from treating the 2026-06-05 blocker as current.

## Changes

- `client/src/components/cooking/live-cooking.tsx`
  - Adds a guarded initializer for the transcript pinned preference.
  - Defaults to pinned when the saved preference is missing or malformed.
  - Clears malformed saved state so future renders do not repeat the same crash path.
- `tests/unit/live-cooking-guest-session.test.tsx`
  - Covers default pinned transcript UI, visible toggle labels, localStorage persistence, and malformed preference recovery.
- `efforts/effort-017-environment-parity-and-ci-confidence.md`
  - Records the implementation slice and remaining EFF-017 scope.
- `efforts/registry.md`
  - Refreshes EFF-017's searchable last signal.

## Impact on other agents

EFF-017 remains `In Progress`. This slice closes one small live-cooking coverage gap but does not settle provider canaries, automated Replit-environment checks, coverage ratcheting, validation-authority policy, production deployment proof, or full Google popup/linking automation.

EFF-022 was intentionally not implemented because its next behavior change still needs Wilson's cuisine-fallback product rule: stay literal, ask for staples, or explain a pantry-flexible fallback.

## Open items

- Open a PR and wait for exact-head GitHub `unit` and `e2e_guest_smoke` checks because this branch changes client runtime code and tests.
- Merge only after Wilson's explicit approval.
- Provider canaries, automated Replit-environment lanes, and coverage ratcheting remain separate EFF-017 work.

## Verification

- `npx vitest run tests/unit/live-cooking-guest-session.test.tsx` passed: 1 file / 23 tests.
- `npm run test:unit` passed: 45 files / 332 tests.
- `npm run check` passed.
- `npm run build` passed with existing Browserslist age, Firebase dynamic/static import, and chunk-size warnings.
- `git diff --check` passed.

## Stack / base status

- Base refreshed: yes
- Current base: `origin/main` at `f9909af7cbc7104f9eb4da7b3a8642215fce461e`
- Last Replit-validated at: not applicable; no Replit validation has run for this branch
- Human Replit validation: deferred to release/batch validation because the slice is narrow client-state hardening covered by focused unit tests and does not change provider, auth, schema, deployment, navigation, or user-flow contracts.
- Notes: not stacked on another branch. Open PR #244 owns separate security/admin/transcription hardening; draft PR #242 owns production-validation registry docs. This branch does not touch those surfaces.
