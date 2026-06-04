# Anonymous Google promotion merge closeout

**Agent:** codex
**Branch:** `codex/anonymous-promotion-closeout`
**Date:** 2026-06-04
**Initiative:** INIT-003
**INIT updated:** yes

## Summary

PR #126 merged the first INIT-003 Phase 4 Google promotion slice. The merged product behavior keeps the guest mental model browser-local, preserves Pantry, Kitchen, Cooking Profile, and favorite chefs through Google conversion, asks before importing setup into an existing Google credential path, and keeps completed guest cooks out of durable History.

This closeout updates the durable docs from fresh merged `main`: INIT-003 now points to PR #126 as the completed first Phase 4 slice, PD-012 records the merged implementation status, and EFF-024 is resolved because its restrained guest trust-copy pass shipped and was Replit-accepted.

## Changes

- `initiatives/INIT-003-anonymous-trial-and-account-upgrade.md` records PR #126 as merged, updates Phase 4 and PR tables, adds CI/Replit merge evidence, and moves the resume point to Phase 5/later explicit promotion follow-up.
- `initiatives/registry.md` updates INIT-003's current phase and last signal after the PR #126 merge.
- `product-decisions/pd-012-public-anonymous-trial-and-account-upgrade.md` records the 2026-06-04 Phase 4 first-slice merge and replaces the old "implement Phase 4" follow-up with explicit future promotion expansion.
- `efforts/effort-024-guest-privacy-trust-messaging.md` is marked `Resolved` with the PR #126 merge rationale.
- `efforts/README.md` removes EFF-024 from the active read list.
- `efforts/registry.md` records EFF-024's resolved date and final signal.

## Impact on other agents

Use PR #126 / merge commit `8282d5193f6eeef50eeecdff9f91bd029bbcd561` as the source of truth for the first anonymous-to-Google promotion slice. Future work should not re-open the question of automatic bulk guest History import; PD-012 and INIT-003 keep that explicitly deferred unless Wilson asks for a user-consented current-cook or selected-cook import path.

EFF-024 is no longer in the active read list. Future guest privacy/legal copy or landing-page expansion should route through PD-012 or a new scoped follow-up rather than treating EFF-024 as open.

## Open items

- Optional only: manually recheck the exact guest recipe `#11` toast body in Replit (`Sign up before making more recipes.`). Guest blocking was manually confirmed shortly before the final copy-only fix, and unit tests guard the copy override.
- Phase 5 remains linked-account memory scope unless a later decision changes it. Anonymous Slop Bowl dry-run and any guest cook/History import path are separate follow-up work.
- Popup cancellation can still take about three seconds because Firebase reports popup closure asynchronously; the merged UI uses calm cancel copy and does not remain stuck.

## Verification

- PR #126 merged: [#126](https://github.com/wmishak404/laica/pull/126)
- Merge commit: `8282d5193f6eeef50eeecdff9f91bd029bbcd561`
- Last runtime Replit-validated at: `2a4ae75`
- Latest merged PR head before squash: `f2eb44d` (`docs-only` after runtime validation)
- GitHub Actions at PR head `f2eb44d`: Dependency Audit passed, Secret Scan passed, CI typecheck/build/unit passed, guest E2E smoke passed.
- This closeout branch is docs-only; run `git diff --check` before opening its PR.
