# Mobile Refresh Dev-Test Harness Plan

**Agent:** codex
**Branch:** codex/mobile-refresh-phase-2-setup
**Date:** 2026-04-29

## Summary

Recorded Wilson's requested dev-testable harness direction as a documentation-only follow-up to Phase 2 validation. This preserves PR #23's manual signed-in smoke gate while giving Phases 3-5 a planned path toward agent-driven authenticated validation.

## Changes

- `product-decisions/features/mobile-refresh/dev-test-harness.md` documents the planned harness: Firebase custom-token dev auth, strict dev-only gating, deterministic test users, hybrid fixture/live smoke, and no backend auth bypass.
- `product-decisions/features/mobile-refresh/README.md` now links the harness as a cross-phase validation follow-up that should not block PR #23.
- `product-decisions/features/mobile-refresh/phase-00-cross-phase-security.md` clarifies that future dev-test auth must preserve Firebase Admin token verification and stay unavailable in production.
- `epics/005-testing-strategy-and-acceptance-criteria.md` records the Phase 2 authenticated-smoke automation gap as new evidence for the broader testing strategy.

## Impact on other agents

- Do not implement the harness on PR #23 unless Wilson explicitly opens a separate implementation task.
- If Phase 3-5 validation keeps running into Google popup blockers, use the new planning doc as the starting point.
- Backend auth bypass remains rejected as the default validation path.

## Open items

- Future implementation branch should decide exact env var names, route/command shape, seed/reset behavior, and package scripts.
- PR #23 still needs manual signed-in Replit smoke before merge.

## Verification

- Documentation-only change; verify with `git diff --check`.
