# INIT-003 Phase 5 checkpoint

**Agent:** codex
**Branch:** `codex/init003-phase5-checkpoint`
**Date:** 2026-06-04
**Initiative:** INIT-003 / INIT-001
**INIT updated:** yes

## Summary

The guest/Google promotion docs already preserved the v1 boundary: completed anonymous cooks do not bulk- or background-import into durable History, and any future guest cook import must be explicit and user-consented. This branch adds the missing checkpoint trigger: after INIT-001 Phase 5 is implemented and validated, reopen INIT-003 Phase 5/later-promotion planning to decide whether a current-cook or selected-cook guest History import path should exist.

## Changes

- `initiatives/INIT-003-anonymous-trial-and-account-upgrade.md` adds the checkpoint to the Phase 5 row and current resume point.
- `initiatives/INIT-001-mobile-refresh.md` adds the reciprocal reminder after Phase 5 is implemented/validated.
- `product-decisions/features/mobile-refresh/pd-phase-05-post-cook.md` adds the checkpoint to the anonymous-trial clarification section.
- `product-decisions/pd-012-public-anonymous-trial-and-account-upgrade.md` adds the checkpoint to open follow-ups.
- `initiatives/registry.md` updates INIT-003's last signal.

## Impact on other agents

Do not implement guest cook/History import before INIT-001 Phase 5 has real merged semantics for History, cleanup, taste signal, pending cleanup, and next-meal retention. Once Phase 5 is done, use this checkpoint to make a product decision from the actual Phase 5 behavior instead of guessing ahead.

## Open items

- No runtime work in this branch.
- Future decision remains open: whether any user-consented guest current-cook or selected-cook import should exist after Google linking.

## Verification

- Docs-only update.
- Run `git diff --check` before opening the PR.
