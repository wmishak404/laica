# Live Cooking step validation

**Agent:** codex
**Branch:** `codex/init-001-cooking-step-validation`
**PR:** [#256](https://github.com/wmishak404/laica/pull/256)
**Date:** 2026-07-06
**Initiative:** INIT-001
**INIT updated:** yes
**Resolves blocked handoff:** none

## Summary

Live Cooking now has a stricter guard before it treats generated cooking steps as usable. If provider output contains only blank, whitespace-only, or obvious placeholder instructions, the cook stays in the existing inline recovery state instead of seeing a bogus Step 1 or creating a linked cooking session. This makes the current Phase 4 guide safer and less confusing while preserving the explicit `Use basic steps` backup choice.

## Changes

- `client/src/components/cooking/live-cooking.tsx` adds a shared step sanitizer for fresh generated output and restored browser-local step trays.
- `tests/unit/live-cooking-guest-session.test.tsx` adds focused coverage for placeholder generated output and placeholder local restore state.
- `product-decisions/features/mobile-refresh/pd-phase-04-cooking.md` records this as the generated-step validation slice and keeps broader Phase 4 scope deferred.
- `initiatives/INIT-001-mobile-refresh.md` and `initiatives/registry.md` identify the branch as the active Phase 4 slice.

## Impact on other agents

PR #256 is independent of open PR #246 and draft EFF-017 PR #249. PR #249 touches cooking-session hook coverage and Effort docs, not `live-cooking.tsx` or `tests/unit/live-cooking-guest-session.test.tsx`.

Do not treat this as the full Phase 4 revamp. Ready Check, compact cockpit/step guidance, timer redesign, cooking-step prompt/provider work, schema changes, speech/audio changes, and Phase 5 cleanup remain planned/deferred in the Phase 4 and Phase 5 records. 2026-07-13 note: the earlier "Coach Feed" planning name was superseded by PR #260 and should not be used as current product direction.

## Open items

- Human Replit validation is not required before merge for this narrow automation-primary slice, but release/batch validation should still include normal generated-step load, induced `/api/cooking/steps` failure/retry, invalid/placeholder output recovery if practical, explicit basic-backup labeling, and linked Finish copy.

## Verification

Local evidence on branch `codex/init-001-cooking-step-validation` from base `origin/main` `460860984779c855e9fca302a1f01acca81d2355`:

- `npm ci` passed and reported `found 0 vulnerabilities`.
- `npx vitest run tests/unit/live-cooking-guest-session.test.tsx` passed: 1 file / 25 tests.
- `npm run check` passed.

Full unit/build/audit/CI evidence should be refreshed before the PR is marked ready for merge review.
