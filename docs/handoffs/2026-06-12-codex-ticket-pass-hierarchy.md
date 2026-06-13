# Ticket Pass Hierarchy Retry

**Agent:** codex
**Branch:** `codex/init-001-ticket-pass-hierarchy`
**Date:** 2026-06-12
**Initiative:** INIT-001
**INIT updated:** yes

## Summary

This branch implements the documented INIT-001 Phase 3.1 Ticket Pass retry as one bounded layout milestone. It follows the PR #81 brief after the abandoned PR #78 attempt: improve the Ticket Pass object language without inventing fake artwork, changing recipe behavior, or starting the later imagery pipeline.

The runtime change is intentionally narrow. The selected recipe now sits inside a more tactile shared pass stack with clearer selected-vs-compact depth, while compact rows remain readable and selection still expands in place without changing generated order. A focused regression test now locks that behavior when switching tickets and opening the Prep Tray.

## Changes

- `client/src/index.css`: updates the existing Ticket Pass CSS only. Adds shared pass backing, selected-ticket depth, compact-row offsets/readability, and hides the unused short-list styling path so future agents do not mistake it for an active alternate layout.
- `tests/unit/meal-planning.test.tsx`: adds a regression for in-place ticket expansion and stable generated order after selecting ticket 2, then confirms the Prep Tray opens for the selected recipe.
- `initiatives/INIT-001-mobile-refresh.md`: records the active branch, validation state, cleared dependency-audit blocker, pending Replit visual acceptance, and current resume point.
- `initiatives/registry.md`: updates INIT-001's active signal.
- `product-decisions/features/mobile-refresh/pd-phase-03-1-recipe-imagery.md`: records the implemented retry slice and changes the Ticket Pass drift row to in-review instead of unresolved.
- `docs/handoffs/2026-06-12-codex-ticket-pass-hierarchy.md`: this coordination handoff.

## Impact on other agents

Do not start another Ticket Pass hierarchy branch while `codex/init-001-ticket-pass-hierarchy` is open. Any next Ticket Pass work should review this branch against `docs/assets/mobile-refresh/phase-03-ticket-pass.png`, current `main`, and the PR #81 negative constraints before changing the surface again.

This branch was parallel-safe with PR #173 while PR #173 owned Settings save/remount restore and EFF-025. PR #173 has since merged, and PR #175 was rebased over the merged Settings work without changing Settings code.

The branch intentionally leaves these later Phase 3.1 items untouched: real recipe imagery generation/hydration, broader Prep Tray redesign, Planning toast cleanup, ingredient-chip unification beyond Ticket Pass, and closeout visual review across all Phase 3.1 drift surfaces.

## Open items

- Draft PR #175 is open for this branch.
- The former dependency-audit blocker is cleared. PR #176 merged the `@grpc/grpc-js` / `esbuild` audit fix, and the 2026-06-13 PR #175 rebase now passes `npm audit --audit-level=high` locally.
- Authenticated Replit/manual visual acceptance is pending. Review should select tickets 1, 2, and 3; compare selected depth, compact readability, image-slot placeholder stability, recipe order orientation, and Prep Tray selection against current `main` and `phase-03-ticket-pass.png`.
- The in-app Browser local fixture path is not accepted evidence. The Browser rejected `data:` and `file:` fixture URLs under its URL policy, and a full local/app visual check would require auth/live recipe generation or an approved fixture lane.

## Verification

- `npm ci` passed after dependencies were absent/stale in this worktree. It reported the existing high-severity audit issue later isolated to `@grpc/grpc-js`.
- `npx vitest run tests/unit/meal-planning.test.tsx` passed: 15 tests.
- `npm run check` passed.
- `npm run build` passed with existing non-blocking warnings: stale Browserslist data, Firebase dynamic/static import chunk warning, and Vite chunk-size warning.
- `git diff --check` passed.
- Initial `npm audit --audit-level=high` failed on existing `@grpc/grpc-js` advisories GHSA-5375-pq7m-f5r2 and GHSA-99f4-grh7-6pcq. This was not introduced by the Ticket Pass branch and was later fixed by PR #176.

2026-06-13 rebase refresh:

- Rebasing onto `origin/main` at `a20406a3be68a6545c0e5a00a68e6f80b2099f08` succeeded after resolving `initiatives/INIT-001-mobile-refresh.md` docs conflicts with the merged PR #173 Settings state.
- `npm ci` passed and reported `found 0 vulnerabilities`.
- `npm audit --audit-level=high` passed and reported `found 0 vulnerabilities`.
- `npx vitest run tests/unit/meal-planning.test.tsx` passed: 1 file / 15 tests.
- `npm run check` passed.
- `npm run build` passed with existing Browserslist age, Firebase mixed dynamic/static import, and chunk-size warnings.
- `git diff --check origin/main...HEAD` passed.

## Stack / base status

- Base refreshed: yes
- Current base: `origin/main` at `a20406a3be68a6545c0e5a00a68e6f80b2099f08`
- Last Replit-validated at: not yet validated
- Notes: independent from closed PR #168. PR #173 and PR #176 are now included through the current base. Rebase again after any overlapping `main` merge before claiming merge readiness.
