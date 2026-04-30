# Phase 2.1 duplicate scan prevention

**Agent:** codex
**Branch:** codex/mobile-refresh-phase-2-1-setup-polish
**Date:** 2026-04-30
**Initiative:** INIT-001
**INIT updated:** yes

## Summary

Wilson's mobile Phase 2.1 smoke found that setup generally worked and disposable-account profile persistence saved correctly, but repeated Pantry/Kitchen scans of the same angle could add duplicate chips/list rows. This pass keeps duplicate prevention in Phase 2.1 scope without attempting semantic canonicalization.

## Changes

- `client/src/lib/entryParsing.ts` now exposes duplicate-aware merge metadata and a stricter comparison key for case, whitespace, apostrophe/possessive, and punctuation/hyphen variants.
- `client/src/components/cooking/user-profiling.tsx` uses that metadata so setup scans add only genuinely new Pantry/Kitchen labels, show `Already saved` for duplicate-only scans, and mention skipped already-saved items in mixed scans.
- `client/src/components/cooking/user-settings.tsx` uses the same duplicate-aware scan handling so later profile edits do not relearn a different behavior.
- `tests/unit/entry-parsing.test.ts` and `tests/unit/user-profiling.test.tsx` cover duplicate-key normalization plus duplicate-only and mixed duplicate/new setup scan behavior.
- `initiatives/INIT-001-mobile-refresh.md`, `product-decisions/features/mobile-refresh/phase-02-1-setup-polish.md`, `epics/005-testing-strategy-and-acceptance-criteria.md`, and `epics/007-vision-scan-no-detection-feedback.md` record the mobile finding, accepted behavior, and reduced retest focus.

## Impact on other agents

- This conforms to EPIC-005 by narrowing the final Replit retest after a documented partial/mobile pass.
- This conforms to EPIC-007 by making duplicate-only scans an explicit valid scan outcome instead of confusing them with no-detection or service failure.
- This uses the EPIC-009 entry-normalization surface but does not change delimiter behavior beyond the existing Phase 2.1 period/comma parsing.
- This supports EPIC-012/INIT-001 Phase 2.1 without changing the accepted setup visuals, `/api/vision/analyze` body contract, or DB schema.

## Open items

- Replit validation is stale until the duplicate-prevention commit is pulled and retested.
- The old Profile/Settings visual UI remains deferred to a later Mobile Refresh phase; this pass only aligns scan result behavior there.
- Semantic inventory merging remains out of scope, so labels like `knife`, `chef knife`, and `santoku` can remain separate.

## Verification

- `npx vitest run tests/unit/entry-parsing.test.ts tests/unit/user-profiling.test.tsx`
- `npm run check`
- `npm run build`

## Stack / base status

- Base refreshed: yes
- Current base: origin/main at `4ef300c`
- Last Replit-validated at: not yet validated
- Notes: Wilson's mobile smoke at prior branch head `e8c3021` found the duplicate-scan issue; this follow-up commit needs a focused mobile Replit retest before merge.
