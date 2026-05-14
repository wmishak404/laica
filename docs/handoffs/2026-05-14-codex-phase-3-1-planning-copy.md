# Phase 3.1 Planning Copy Slice

**Agent:** codex
**Branch:** codex/mobile-refresh-phase-3-1-planning-copy
**Date:** 2026-05-14
**Initiative:** INIT-001
**INIT updated:** no - the Phase 3.1 feature phase record was updated; INIT status/PR state did not change.

## Summary

Phase 3.1's first runtime slice is intentionally small and now implemented: the Planning entry labels the Slop Bowl path as italicized `Slop It Up`, uses one approved italic supporting-copy line selected once per app mount, and keeps the underlying feature identity as `Slop Bowl`. The branch did not expand into broader Planning facelift, Slop Bowl pantry-check alignment, Ticket Pass / Prep Tray polish, or imagery.

## Changes

- `client/src/pages/app.tsx`: adds the approved Slop It Up supporting-copy list, stable mount-time random selection, italicized `Slop It Up` front-door title, and italic Slop It Up supporting copy while preserving the existing `slop-bowl` flow state and component path.
- `tests/unit/planning-choice.test.tsx`: covers the new card title/copy treatment, approved-copy source, title/copy italic classes, removal of the old fixed copy, and click-through to the existing Slop Bowl flow.
- `product-decisions/features/mobile-refresh/pd-phase-03-1-recipe-imagery.md`: marks the Slop It Up card contract implemented and records that this branch stayed within the first runtime slice.
- `docs/handoffs/2026-05-14-codex-phase-3-1-planning-copy.md`: records this transfer note.

## Impact on other agents

Continue to treat `Slop It Up` as the Planning-card label only. Backend/API contracts, route state, Slop Bowl component naming, guard copy, generated recipe language, and durable product docs still use `Slop Bowl` unless Wilson explicitly approves a wider rename.

The broader Phase 3.1 facelift remains open. Pantry-count status emphasis, pantry-check visual alignment, Ticket Pass / Prep Tray polish, and async imagery were deliberately untouched.

## Open items

- Wilson validated the original 1-7 Replit checklist at `5412c3e3b8bbce3f3b8574be8b7ddc0b2142dc50`, then requested the small title-italic follow-up.
- Wilson confirmed the latest runtime head `39e4a361fb16a22f63638759a801435a5b00715b` looks italicized and good in Replit.
- Deferred Phase 3.1 scope now includes highlighting only the dynamic pantry-count phrase in the Planning status line (`17 pantry items`, `1 pantry item`, or future `pantry ingredients` wording variants) in Planning coral. This branch intentionally does not implement that follow-up.
- A docs-only commit after the Replit-confirmed runtime head records this deferred task; the current branch head is therefore newer than the runtime SHA even though no runtime code changed after `39e4a36`.

## Stack / base status

- Base refreshed: yes
- Current base: origin/main at `59ee34901b93f23872dd822d377ed39f44540f18`
- Last Replit-validated at: `39e4a361fb16a22f63638759a801435a5b00715b` - runtime UI confirmed by Wilson; later docs-only scope note does not add runtime behavior but is newer than the validated SHA.
- Notes: independent Phase 3.1 runtime branch from fresh `origin/main`; not stacked on another open PR.

## Verification

- `npm ci`
- `npx vitest run tests/unit/planning-choice.test.tsx`
- `git diff --check`
- `npm run check`
- `npm run build`
- Local dotenvx dev server booted on port 3000; unauthenticated browser access showed the signed-out Laica landing page, so authenticated Planning visual validation remains deferred to Replit/manual preview.
- Wilson's Replit check of the original 1-7 checklist passed at `5412c3e3b8bbce3f3b8574be8b7ddc0b2142dc50`; Wilson later confirmed `Slop It Up` itself is italicized and good at runtime head `39e4a361fb16a22f63638759a801435a5b00715b`.
