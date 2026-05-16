# INIT-003 and PD-012 docs baseline

**Agent:** codex
**Branch:** codex/init-003-anonymous-trial-docs
**Date:** 2026-05-15
**Initiative:** INIT-003
**INIT updated:** yes

## Summary

Created the durable docs baseline for public anonymous trial work so future runtime branches can start from repository state instead of chat history. The new source-of-truth split is: [PD-012](../../product-decisions/pd-012-public-anonymous-trial-and-account-upgrade.md) for the accepted guest/upgrade/security policy, and [INIT-003](../../initiatives/INIT-003-anonymous-trial-and-account-upgrade.md) for phased execution, validation, and decision history.

This docs pass also records the important product reversals so they are easy to revisit later: the work started as a dev-only auth-harness discussion, widened into public anonymous entry, temporarily moved to unlimited guest generation, and then settled on 5 successful recipe generations plus a linked-only durable-save boundary.

## Changes

- `product-decisions/pd-012-public-anonymous-trial-and-account-upgrade.md`
  - Added the durable accepted decision for public anonymous entry, 5-generation guest quota, same-browser persistence, Google upgrade boundary, linked-only Phase 5 memory, and required security posture.
- `initiatives/INIT-003-anonymous-trial-and-account-upgrade.md`
  - Created the initiative hub with phases, current status, resume point, and the explicit decision-history section capturing how the direction changed during planning.
- `product-decisions/README.md`
  - Added PD-012 to the top-level decision index.
- `initiatives/README.md`
  - Added INIT-003 to the current initiatives list.
- `initiatives/registry.md`
  - Added INIT-003 to the initiative registry with the current docs-only signal.
- `product-decisions/features/mobile-refresh/pd-phase-01-auth.md`
  - Added an amendment clarifying that the Google-only landing is the historical Phase 1 baseline and that public guest entry is now governed by PD-012 / INIT-003.
- `product-decisions/features/mobile-refresh/pd-phase-05-post-cook.md`
  - Added the guest-trial clarification that v1 anonymous users do not create durable post-cook history, cleanup, or taste memory.
- `initiatives/INIT-001-mobile-refresh.md`
  - Added PD-012 as a source doc, recorded the cross-initiative impact in the change log, and pointed future guest-auth/Phase 5 work to INIT-003.

## Impact on other agents

Future runtime work should start from [INIT-003](../../initiatives/INIT-003-anonymous-trial-and-account-upgrade.md), not from the earlier auth-harness notes or the old Google-only Phase 1 mental model.

The most important locked assumptions are:

- guest mode is public and real, not just a test harness
- guests get 5 successful recipe generations in v1
- same-browser guest persistence is allowed through normal reopen
- Google is required for recipe `#6+` and for durable saves
- Phase 5 durable history/cleanup/taste memory remains linked-only

## Open items

- Runtime implementation has not started.
- Firebase App Check remains a precondition for production anonymous enablement.
- A separate analytics effort is still pending if Wilson wants measurement implementation to start.
- EFF-017 should later absorb the guest-auth implications for browser smoke, but no changes were made to that effort in this docs pass.

## Verification

- Docs-only change.
- Run `git diff --check`.

## Stack / base status

- Base refreshed: yes
- Current base: `origin/main`
- Last Replit-validated at: not applicable; docs-only
