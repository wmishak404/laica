# Phase 2.2 Governance Graduation Deferred

**Agent:** codex
**Branch:** codex/phase-2-2-governance-deferral-handoff
**Date:** 2026-05-01
**Initiative:** INIT-001
**INIT updated:** no — Phase 2.2 state is unchanged; this is a coordination handoff only.

## Summary

Wilson asked for Claude to review whether EPIC-001 and EPIC-012 should graduate out of active epics into durable governance. Claude's review recommended **not graduating yet**. Codex and Wilson agree with that sequencing.

Phase 2.2 should land as-is at pushed head:

`24a4be019ebcc86960d32a4d99e5e70e51012178`

Do not include broad UI/design governance graduation in the Phase 2.2 merge path.

## Changes

- No product or app code changes in this handoff branch.
- No governance migration committed.
- Codex removed local governance WIP from the Phase 2.2 worktree after backing it up outside the repo:
  - `/private/tmp/laica-governance-graduation-wip-2026-05-01.patch`
  - `/private/tmp/laica-governance-pd-005-wip-2026-05-01.md`

## Impact on other agents

Claude should own the future governance closeout as a separate planning/docs branch, not as part of Phase 2.2.

Recommended future Claude branch:

`claude/ui-governance-closeout`

Claude should use the current EPIC-001 and EPIC-012 files as active sources for now. The broad governance migration should wait until more evidence lands from mobile-refresh Phase 3-5 or until Wilson explicitly asks for a dedicated governance closeout session.

## Why governance graduation is deferred

- EPIC-001's own resolution criteria are not fully met yet:
  - no accepted `PD-005` exists on `main`
  - no enforcement mechanism has shipped
  - UI governance just gained new specificity/computed-style evidence from Phase 2.2
- The Phase 2.2 evidence is concrete and should inform the later governance closeout:
  - Returning Settings reused first-time setup `setup-*` class names, but the controls still drifted because the accepted setup styles depended on `.setup-ui .setup-*` specificity.
  - The capture shutter, camera/video toggle, and help/tips controls rendered as rounded squares instead of the accepted circular setup camera controls.
  - `Upload photos` and `Enter manually` inherited different Button typography instead of matching first-time setup's `Nunito` / 800 action-label treatment.
  - This means future governance needs to require rendered/computed-style comparison for reused patterns, not only class-name reuse or product-intent documentation.
- EPIC-012 still has open identity questions:
  - typography rollout beyond setup
  - palette refinement
  - canonical motif set
  - imagery/illustration direction
  - later Phase 3-5 proof points
- Phase 2.2 should remain focused on returning Settings, Menu, and History IA.
- A governance closeout PR should be reviewed as its own architectural/documentation change, not bundled into a product-surface PR.

## Phase 2.2 merge guidance

1. Replit should validate `codex/mobile-refresh-phase-2-2-settings-history` at `24a4be019ebcc86960d32a4d99e5e70e51012178`.
2. If validation passes, update only Phase 2.2 validation/closeout docs with the validated SHA.
3. Merge Phase 2.2.
4. Start Phase 3 from fresh `origin/main` after Phase 2.2 merges.
5. Do not commit `product-decisions/005-ui-governance.md`, resolve EPIC-001/012, or rewrite `design_guidelines.md` on the Phase 2.2 branch.

## What to tell Claude

Wilson can send Claude this:

```text
Please own the future governance closeout for EPIC-001 and EPIC-012, but do not block Phase 2.2.

Current decision:
- Phase 2.2 should land as-is at pushed head 24a4be019ebcc86960d32a4d99e5e70e51012178.
- Do not graduate EPIC-001 or EPIC-012 in the Phase 2.2 branch.
- Codex had local uncommitted governance-migration WIP, but it has been excluded from Phase 2.2 and backed up outside the repo.

Please plan a later dedicated governance closeout branch, likely after Phase 3-5 provide more design-system evidence. In that later branch, review whether to create PD-005, promote/rewrite design_guidelines.md, resolve EPIC-001/012, or split remaining unresolved questions into narrower epics.
```

## Open items

- Wilson is running Replit validation for Phase 2.2.
- After Replit validation, Codex should update Phase 2.2 closeout docs with the validated SHA only.
- Claude can start the governance closeout planning later from fresh `main`, not from the Phase 2.2 product branch.

## Verification

- `git status --short --branch` on `codex/mobile-refresh-phase-2-2-settings-history` was clean at `24a4be019ebcc86960d32a4d99e5e70e51012178` before this handoff branch was created.
- No runtime validation required for this handoff-only branch.

## Stack / base status

- Base refreshed: no
- Current base: origin/main at `6541e91e15b80030655d83ca4e9413fd0d2491e9`
- Last Replit-validated at: not yet validated
- Notes: This branch is a coordination branch only. Do not use it as the Replit validation target for Phase 2.2.
