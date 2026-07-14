# Docs spring cleaning after viewport merge override

**Agent:** codex
**Branch:** `codex/docs-spring-cleaning`
**Date:** 2026-07-13
**Initiative:** INIT-001
**INIT updated:** yes
**Resolves blocked handoff:** none

## Summary

Wilson explicitly allowed this docs cleanup to proceed before the viewport-fit work merged because that project was taking too long. This branch cleans stale future-facing wording in INIT-001/mobile-refresh docs without adding product direction: old `Coach Feed`, multi-action Ready Check, timer-minimize, broad Ticket Pass imagery, and ingredient-chip-unification references are now marked historical, superseded, or current-state-bounded with PR/date provenance.

## Changes

- `product-decisions/features/mobile-refresh/pd-phase-04-cooking.md`
  - Replaces the old `suggestedTimer` sketch in the current timer section with the merged PR #269 behavior: explicit-start timers from existing `duration` or clear text-derived timing, with richer timer metadata left as future schema work.
  - Narrows the PR #275 assistance-failure acceptance wording to separate voice-help status for Ask-a-question technical/quota failures outside Step guidance.
- `product-decisions/features/mobile-refresh/pd-phase-03-1-recipe-imagery.md`
  - Adds current accepted imagery state after PR #192/#208: Ticket Pass placeholder-only, selected Prep Tray imagery only, broader Ticket Pass imagery unresolved.
- `product-decisions/features/mobile-refresh/README.md`
  - Removes ingredient-chip unification from remaining Phase 3.1 work after PR #234 and states the current imagery boundary.
- `initiatives/INIT-001-mobile-refresh.md`
  - Corrects the Phase 4 table so PR #275 is merged as `148c881`, not in progress.
- Historical handoffs under `docs/handoffs/`
  - Adds superseded-context notes for old `Coach Feed`, `Cook anyway` / `Cook silently`, timer-minimize, viewport-wait, and ingredient-chip-unification next-work wording instead of erasing point-in-time branch facts.

## Impact on other agents

Future agents should use the Phase 4 record and INIT current resume point for current scope. Historical handoffs still preserve what a branch believed at the time, but they now point forward when later PRs superseded those instructions.

Open PR #281 (`codex/init-001-cooking-step-schema`) also edits `product-decisions/features/mobile-refresh/pd-phase-04-cooking.md` and `initiatives/INIT-001-mobile-refresh.md`. This branch starts from `origin/main` `deaf17e` and stays docs/process-only; whichever PR merges second may need a small rebase, but this cleanup does not claim PR #281's schema-boundary behavior.

## Open items

- Open a draft PR for this docs-only cleanup.
- No Replit validation is required for this branch.

## Verification

- `git diff --cached --check` passed.

## Stack / base status

- Base refreshed: yes
- Current base: `origin/main` at `deaf17e7e6ccd9c4bd75239dcadfc586fed65e1b`
- Last Replit-validated at: not applicable; docs-only cleanup
- Notes: independent docs-only branch; Wilson's 2026-07-13 message superseded the original viewport-merge dependency.
