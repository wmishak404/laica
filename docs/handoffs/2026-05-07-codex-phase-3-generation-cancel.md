# Phase 3 recipe generation lock and Back cancel

**Agent:** codex
**Branch:** `codex/phase-3-generation-cancel`
**Date:** 2026-05-07
**Initiative:** INIT-001
**INIT updated:** yes

## Summary

Fixed the Phase 3 Chef It Up async bug Wilson found in Replit: after tapping `View recipe suggestions`, cuisine/staple inputs now freeze, the visible staple rows no longer reshuffle when confirmed staples save to pantry, and Back cancels the in-flight recipe request so late responses cannot auto-advance to Ticket Pass.

## Changes

- `client/src/components/cooking/meal-planning.tsx` snapshots the generation request context, locks the displayed staple candidates while loading, disables cuisine / `No preference` / staple row buttons during generation, and uses an `AbortController` plus run-id guard to ignore stale results.
- `client/src/lib/openai.ts` passes an optional `AbortSignal` through `fetchPantryRecipes` into the existing `apiRequest` path.
- `client/src/index.css` adds disabled hover/opacity treatment for the Phase 3 full-row selection controls.
- `tests/unit/meal-planning.test.tsx` covers frozen staple rows during pantry save, disabled cuisine/staple inputs during loading, Back aborting generation, late canceled responses not navigating, and a normal successful three-suggestion reveal.
- Docs updated: INIT-001, Phase 3 planning record, and EFF-004.

## Impact on other agents

- This branch is rebased onto `origin/main` at PR #44 (`24decb2ee5ee4d0aa8221324bde52eb1823061cc`) and intentionally does not carry the older open PR #41 docs commits.
- The fix uses the resolved EFF-018 `withAiErrorHandling` path, so aborts/cancellations stay toast-silent while real 400/429/5xx errors use authenticated-app copy.
- Confirmed staples still save to pantry even if the user backs out during generation. Back cancels only the recipe-generation request.
- EFF-004 interaction: conforms. Full-row multi-select rows remain explicit-submit controls, then become read-only during the in-flight submit; Back is the cancellation path.
- EFF-005 interaction: conforms. Added focused unit coverage and records the Replit validation scenario that remains required before merge.

## Open items

- Replit validation is still required for the authenticated Chef It Up path:
  - Select Mediterranean + Mexican.
  - Select two staple rows.
  - Tap `View recipe suggestions`.
  - Verify no staple row replacement and no additional input while `Finding recipes...` is shown.
  - Press Back and verify the request does not auto-advance after completion.
  - Repeat and let suggestions finish; verify Ticket Pass appears normally and confirmed staples remain in pantry.
- Broader Phase 3 Replit validation from INIT-001 still applies.

## Verification

- `npm ci`
- `npx vitest run tests/unit/meal-planning.test.tsx tests/unit/planning-staples.test.ts`
- `npm run check`
- `npm run build`
- `git diff --check`

## Stack / base status

- Base refreshed: yes
- Current base: `origin/main` at `24decb2ee5ee4d0aa8221324bde52eb1823061cc` (PR #44)
- Last Replit-validated at: not yet validated for this branch
- Notes: Rebased after PR #44 merged; skipped stale PR #41 docs commits so this branch is based on the latest merged main.
