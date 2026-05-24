# Anonymous trial 10-generation cap

**Agent:** codex
**Branch:** codex/init-003-preauth-homepage
**Date:** 2026-05-24
**Initiative:** INIT-003
**INIT updated:** yes

## Summary

Wilson revised the INIT-003 guest policy from 5 to 10 successful anonymous recipe generations. The change is folded into PR 102's active `codex/init-003-preauth-homepage` branch so the public homepage and guest-MVP docs carry the current quota decision together.

The user-facing model stays simple: guests can start cooking immediately, and Google is required when Laica needs to remember pantry, settings, history, cook-again context, or when the guest reaches generation `#11+`. The important rationale is that 10 gives early users room to regenerate and iterate when Laica's early recipe quality, pantry fit, or taste alignment misses; those misses are partly on the product, so the guest flow should be forgiving before asking for account commitment.

## Changes

- `product-decisions/pd-012-public-anonymous-trial-and-account-upgrade.md`
  - Raised the accepted v1 guest quota from 5 to 10 successful recipe generations.
  - Moved the hard Google generation boundary from `#6+` to `#11+`.
  - Added the 2026-05-24 cap-revision rationale and clarified that user-facing copy should lead with immediate use, not trial accounting.
  - Preserved PR 102's landing-image and no-numeric-quota homepage guardrails. The landing image guardrail later moved from domestic-realistic imagery to slightly-cartoony consumer-packaged imagery so public entry assets avoid raw meat while still showing recognizable grocery ingredients.
- `initiatives/INIT-003-anonymous-trial-and-account-upgrade.md`
  - Updated current accepted direction, Phase 2 scope, change history, and chronology to use 10 generations and `#11+`.
  - Preserved PR 102's Plan B Phase 3 status and public-homepage launch path.
- `initiatives/registry.md`
  - Refreshed the INIT-003 index signal with the 10-generation quota while preserving the active Plan B branch status.
- `product-decisions/features/mobile-refresh/pd-phase-01-auth.md`
  - Updated the Phase 1 amendment to point at the 10-generation guest quota.

## Impact on other agents

Runtime implementation for INIT-003 Phase 2 should use 10 successful recipe generations as the quota and block new anonymous generation attempts starting at recipe `#11`. Do not present the first screen as "Try 10 free recipes" by default; the durable docs now prefer a calmer first-use story: start cooking now, then sign in when Laica should remember the kitchen or continue beyond the guest cap.

Historical handoffs from 2026-05-15 still mention 5 because they recorded the earlier accepted baseline. Treat this handoff plus PD-012/INIT-003 on PR 102 as the current source of truth.

## Open items

- Anonymous quota enforcement has not landed yet.
- App Check, anonymous abuse controls, and upgrade-to-save behavior remain future INIT-003 gates.
- No analytics work was added; measurement remains intentionally separate from INIT-003 runtime scope.

## Verification

- Docs-only merge into PR 102.
- `git diff --check`
- `rg -n "5 successful|5-generation|#6\\+|Try 5" product-decisions initiatives`

## Stack / base status

- Base refreshed: yes
- Current base: origin/main at `3394057`
- Last Replit-validated at: not yet validated for this docs revision
- Notes: folded the 10-generation decision into PR 102's active branch instead of merging a separate docs-only branch to `main`.
