# EFF-035 desktop setup scroll correction

**Agent:** codex
**Branch:** `codex/desktop-setup-scroll`
**Date:** 2026-07-29
**Initiative:** INIT-001
**INIT updated:** yes
**Resolves blocked handoff:** none

## Summary

Wilson's desktop production report satisfied EFF-035's explicit reopen trigger one day after viewport work was deferred. First-time setup locked the outer document at every width, but the matching fixed-height frame and bounded inner scroll contract existed only at `max-width: 480px` plus `max-height: 790px`. Wider desktop windows and taller mobile viewports could therefore grow `.setup-scroll-body` to its content while `html`, `body`, and `#root` remained locked, leaving no scroll owner.

This branch moves the setup height/flex/overflow contract into the base setup rules, keeps `.setup-scroll-body` as the one content scroller above Back/Next, removes the duplicated structural rules from the compact media query, and adds CSS plus short-desktop Playwright regression coverage. Planning, the Settings hub, and returning Kitchen Inventory were checked at the same constrained desktop height and retained their existing working document or inner-scroll paths.

## Changes

- `client/src/index.css`
  - Applies the fixed `100dvh` setup shell and constrained flex frame at every viewport width.
  - Preserves outer document/root locking and inner `.setup-scroll-body` scrolling.
  - Leaves only compact density/radius/padding adjustments in the narrow-and-short media query.
- `tests/unit/setup-button-css.test.ts`
  - Guards the base setup frame height, flex minimum, and overflow contract.
- `tests/e2e/cooking-workflow.test.ts`
  - Adds a `1024x600` guest setup regression case that requires inner scroll range, reachable Manual entry, locked outer root, and an in-viewport Back/Next rail.
- `efforts/effort-035-universal-setup-viewport-resilience.md`, `efforts/README.md`, and `efforts/registry.md`
  - Reopen EFF-035 as `In Progress` from Wilson-supplied feedback and record the root cause, implementation, evidence, and remaining validation.
- `initiatives/INIT-001-mobile-refresh.md`
  - Updates the current resume point and chronology for the reopened setup viewport work.
- `product-decisions/features/mobile-refresh/pd-phase-02-1-setup-polish.md` and `design_guidelines.md`
  - Make the setup scroll contract explicit at every viewport width so compact media queries cannot own structural scrolling.
- `docs/production-validation-registry.md`
  - Adds the changed-since-production focused mobile/desktop smoke scope and negative scope.

## Impact on other agents

- Read EFF-035 before touching first-time setup height, overflow, safe-area, or sticky-action behavior; its header is authoritative and now `In Progress`.
- Preserve one setup scroll owner: `.setup-scroll-body`. Do not restore document/root scrolling under the setup rail or move the fixed-height frame contract back into a device-specific media query.
- This is not a returning Settings dock change. `.returning-inventory-scroll` already worked in the constrained desktop audit and remains owned by the existing returning Settings layout.
- The working tree contained a pre-existing modified `.env`; it was preserved and is not part of this branch.

## Open items

- Exact-head GitHub `e2e_guest_smoke` is still required for review/merge evidence.
- Final-head browser validation should cover first-time Pantry and optional Tools at a constrained desktop height, `390x844`, `412x915`, and one short mobile or landscape height. Confirm normal wheel/touch reachability to Upload, Manual, list content, and Back/Next.
- Physical Safari/Chrome keyboard-open and increased-text-size behavior remains unvalidated. Keep EFF-035 `In Progress` until its accepted matrix and final-head evidence justify resolution.
- Human Replit validation: required before merge because this fixes a production browser reachability regression across responsive breakpoints.

## Verification

- Focused Vitest: `npx vitest run tests/unit/setup-button-css.test.ts tests/unit/user-profiling.test.tsx --testTimeout=15000` — 2 files / 22 tests passed.
- Full unit: `npm run test:unit` — 51 files / 402 tests passed.
- Static: `npm run check` — TypeScript and UI lint passed.
- Build: `npm run build` — passed; retained existing stale Browserslist, Firebase mixed-import, and bundle-size warnings.
- Formatting: `git diff --check` — passed.
- Rendered local fixture at `1024x600`: setup scrollbar visibly rendered; a normal wheel interaction moved from the camera to Upload/Manual/manual-entry content while Back/Next stayed fixed inside the viewport.
- Production constrained-desktop audit:
  - Planning fit the viewport without a hidden overflow path.
  - Settings hub document scrolling moved from `0` to approximately `176px`.
  - Kitchen Inventory exposed `.returning-inventory-scroll` with `545px` client height and `1036px` scroll height; a wheel interaction moved it to approximately `491px`.
  - History was unavailable in the active guest session and was source-audited only; its `min-h-screen` shell does not mount the setup root lock.
- Local E2E negative scope: `LAICA_LOCAL_SANDBOX_DATABASE_URL` and its confirmation flag were missing. The default local database allowed the app to start but `/api/auth/session` returned 500, so the new Playwright case was added but not executed locally. No default database schema mutation was attempted.
