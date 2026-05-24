# Anonymous trial 10-generation cap

**Agent:** codex
**Branch:** codex/anonymous-trial-10-cap
**Date:** 2026-05-24
**Initiative:** INIT-003
**INIT updated:** yes

## Summary

Wilson revised the INIT-003 guest policy from 5 to 10 successful anonymous recipe generations. This keeps the user-facing model simple: guests can start cooking immediately, while Google is required when Laica needs to remember pantry, settings, history, cook-again context, or when the guest reaches generation `#11+`. The important rationale is that 10 gives early users room to regenerate and iterate when Laica's early recipe quality, pantry fit, or taste alignment misses; those misses are partly on the product, so the guest flow should be forgiving before asking for account commitment.

## Changes

- `product-decisions/pd-012-public-anonymous-trial-and-account-upgrade.md`
  - Raised the accepted v1 guest quota from 5 to 10 successful recipe generations.
  - Moved the hard Google generation boundary from `#6+` to `#11+`.
  - Added the 2026-05-24 cap-revision rationale and clarified that user-facing copy should lead with immediate use, not "trial" accounting.
- `initiatives/INIT-003-anonymous-trial-and-account-upgrade.md`
  - Updated current accepted direction, Phase 2 scope, change history, and chronology to use 10 generations and `#11+`.
- `initiatives/registry.md`
  - Refreshed the INIT-003 index signal with the 2026-05-24 cap revision.
- `product-decisions/features/mobile-refresh/pd-phase-01-auth.md`
  - Updated the Phase 1 amendment to point at the 10-generation guest quota.

## Impact on other agents

Runtime implementation for INIT-003 Phase 2 should use 10 successful recipe generations as the quota and block new anonymous generation attempts starting at recipe `#11`. Do not present the first screen as "Try 10 free recipes" by default; the durable docs now prefer a calmer first-use story: start cooking now, then sign in when Laica should remember the kitchen or continue beyond the guest cap.

Historical handoffs from 2026-05-15 still mention 5 because they recorded the earlier accepted baseline. Treat this handoff plus PD-012/INIT-003 as the current source of truth.

## Open items

- Runtime implementation has not started.
- App Check, anonymous abuse controls, quota accounting, and upgrade-to-save behavior remain future INIT-003 phases.
- No analytics work was added; measurement remains intentionally separate from INIT-003 runtime scope.

## Verification

- Docs-only change.
- Run `rg -n "5 successful|5-generation|#6\\+|Try 5" product-decisions initiatives` to confirm current source docs use 5 only as a rejected/historical alternative, not as the runtime quota.
- Run `git diff --check` before opening a PR.

## Stack / base status

- Base refreshed: yes
- Current base: origin/main at `3394057`
- Last Replit-validated at: not yet validated
- Notes: docs-only product decision revision from fresh `origin/main`; no Replit runtime validation required for the docs edit itself.
