# EFF-017 Cooking Session Coverage

**Agent:** codex
**Branch:** codex/eff-017-cooking-session-coverage
**Date:** 2026-07-01
**Initiative:** none — standalone EFF-017 slice; INIT-001 / INIT-003 / INIT-004 were read for routing context
**INIT updated:** no
**Resolves blocked handoff:** none

## Summary

Daily Efforts hygiene found the active Effort pool still correctly limited to EFF-017 and EFF-022. EFF-022 has an accepted transparent pantry-fallback direction, but the remaining runtime threshold/copy work is intentionally deferred after higher-priority INIT-001 work and is adjacent to open INIT-004 PR #246. EFF-017 remains the highest-leverage standalone implementation lane because auth-scoped cooking-session confidence affects INIT-001 cooking persistence, INIT-003 linked/guest boundaries, and release validation.

This branch adds test-only coverage for `useCookingSession` and cleans up a few resolved Effort chronology notes so old "active" wording reads as dated history, not current status.

## Changes

- `tests/unit/use-cooking-session.test.tsx`
  - Adds hook-level coverage that guest users do not fetch linked-only durable cooking-session queries.
  - Asserts linked active/history query keys include the auth user id.
  - Asserts cooking completion refreshes cooking/profile caches without invalidating `/api/auth/session`.
- `efforts/effort-017-environment-parity-and-ci-confidence.md`
  - Adds the 2026-07-01 implementation signal and keeps EFF-017 `In Progress`.
- `efforts/registry.md`
  - Refreshes the EFF-017 last-signal summary.
- `efforts/effort-007-*`, `effort-013-*`, `effort-014-*`, `effort-018-*`, `effort-025-*`
  - Time-qualifies old resolved-Effort chronology wording that previously read like current active-state instructions.

## Impact on other agents

Use `efforts/README.md` as the active Effort list. The active pool remains EFF-017 and EFF-022. No Effort was closed, deferred, reopened, or moved into an INIT.

Open PR #246 owns current INIT-004 eval-report-export work and touches EFF-022/INIT-004 docs, so avoid starting overlapping cuisine/eval reporting changes until that branch lands or is superseded.

## Open items

- EFF-017 still needs separate decisions or slices for provider canaries, automated Replit-environment checks, coverage ratcheting, and broader live-surface coverage.
- EFF-022 remains open for the transparent pantry-fallback activation threshold and user-facing copy, but runtime implementation remains deferred.
- Replit validation is not required before merge for this branch because it is test-only coverage plus docs hygiene with no runtime behavior change.

## Verification

Local validation passed:

- `npx vitest run tests/unit/use-cooking-session.test.tsx` — 1 file / 3 tests passed.
- `npm run test:unit` — 46 files / 340 tests passed.
- `npm run check` passed.
- `npm run build` passed with existing Browserslist/Firebase dynamic-import/chunk-size warnings.
- `git diff --check` passed before this handoff was added.

Value claim: EFF-017 now has direct deterministic coverage that durable cooking-session hooks respect guest-vs-linked boundaries and auth-scoped query keys.

Evidence limits: This does not run the GitHub E2E gate yet, does not validate Replit, does not change runtime behavior, does not exercise live OpenAI/ElevenLabs/Firebase Google popup behavior, and does not resolve provider canary or validation-authority policy work.

## Stack / base status

- Base refreshed: yes
- Current base: `origin/main` at `460860984779c855e9fca302a1f01acca81d2355`
- Last Replit-validated at: not applicable for a test-only/docs hygiene branch
- Notes: started from fresh `origin/main`; open PR #246 is adjacent INIT-004 work and not a base dependency.
