# Planning Toast Cleanup

**Agent:** codex
**Branch:** `codex/init-001-planning-toast-cleanup`
**PR:** [#184](https://github.com/wmishak404/laica/pull/184)
**Date:** 2026-06-15
**Initiative:** INIT-001
**INIT updated:** yes

## Summary

Guest setup now confirms readiness without lingering explanatory copy over the main cooking choices. The guest setup-complete and returning guest profile-complete paths share a concise title-only `Your kitchen is ready` toast that auto-dismisses after 2.5 seconds, so users get confirmation and can immediately focus on Chef It Up or Slop It Up.

This branch is a narrow Phase 3.1 polish slice. It deliberately avoids guest persistence, linked promotion, empty-pantry action toasts, Planning card layout, Ticket Pass, Prep Tray, Slop Bowl, navigation, backend, provider, schema, or prompt changes.

## Triage Context

- INIT-004 has high architectural leverage after PR #181 merged the Phase 2 spec, but open PR #182 owns the required Phase 2 merge closeout and explicitly says Phase 3 should wait until that closeout merges or is deferred.
- INIT-002 remains in Phase 2 Replit observation and is not a local implementation milestone.
- INIT-003 later promotion/History import planning still waits on INIT-001 Phase 5 semantics.
- INIT-001 has documented independent Phase 3.1 slices. Planning toast cleanup was the smallest ready unowned milestone with direct user value and low validation risk.

## Changes

- `client/src/pages/app.tsx`
  - Adds `PLANNING_READY_TOAST_DURATION_MS = 2500`.
  - Centralizes guest Planning-ready toast behavior in `showPlanningReadyToast`.
  - Removes the guest `I'll remember this while you try Laica.` toast description from setup-complete and returning guest profile-complete paths.
- `tests/unit/planning-choice.test.tsx`
  - Extends the setup mock so tests can complete guest setup.
  - Adds coverage that the guest setup-ready toast is title-only, uses the short duration, and does not include `remember` copy.
- `initiatives/INIT-001-mobile-refresh.md`
  - Records PR #184, current Phase 3.1 resume impact, validation, and negative scope.
- `initiatives/registry.md`
  - Updates INIT-001's last signal to this active branch.
- `package-lock.json`
  - Resolves the dependency-audit blocker after Wilson explicitly asked to tackle the audit remediation in this PR: `ws` now resolves to `8.21.0`, with related patched lockfile updates for `vite`, `protobufjs`, `form-data`, and Babel packages from `npm audit fix --package-lock-only`.
- `product-decisions/features/mobile-refresh/pd-phase-03-1-recipe-imagery.md`
  - Marks the Planning toast drift implemented in PR #184 and records the guardrail.

## Impact on other agents

Do not reopen this exact Planning-ready toast copy/duration slice while PR #184 is active. Future Planning-message work can still review empty-pantry or linked-account action toasts, but those should preserve required user actions and should not be mixed into this branch unless review finds a regression.

If PR #183 (Efforts hygiene) merges first, this branch may need a small docs rebase because both touch INIT-001 summary text. Do not take over PR #183 from this branch.

## Open items

- Wilson explicitly approved tackling the dependency-audit remediation in PR #184, so the branch now includes the lockfile-only audit fix.
- Local `npm audit --audit-level=high` passes after the remediation. The PR body records the authoritative exact-head GitHub check result after the final push.
- Human Replit validation is not required before merge by the current risk classification, but a reviewer may still visually confirm the shorter toast in the Planning surface if desired.
- Merge still requires Wilson's explicit instruction because this is a client/runtime UI PR.

## Verification

Local checks on `codex/init-001-planning-toast-cleanup`:

- `npm ci` passed and reported `found 0 vulnerabilities`.
- `npm audit --audit-level=high` passed and reported `found 0 vulnerabilities` after the lockfile remediation.
- `npm ls ws vite protobufjs form-data @babel/core` confirmed patched resolutions including `ws@8.21.0`, `vite@7.3.5`, `protobufjs@7.6.4`, `form-data@4.0.6` / `2.5.6`, and `@babel/core@7.29.7`.
- `npx vitest run tests/unit/planning-choice.test.tsx` passed: 1 file / 22 tests.
- `npm run check` passed (`tsc` and UI lint).
- `npm run build` passed with existing warnings: stale Browserslist data, mixed Firebase dynamic/static import, and bundle chunk size.
- Earlier GitHub checks on `bd3097bdf432bdefb66b85cd10c4482dfe641e18` passed except for `npm-audit`, which failed on `ws` `GHSA-96hv-2xvq-fx4p`; the lockfile remediation addresses that blocker, and the PR body records final exact-head GitHub evidence after the last push.

Coverage reasoning:

- The focused unit test proves the changed guest setup-complete path calls the concise toast contract and rejects the old `remember` copy.
- The static/build checks prove the branch remains type-safe and production-buildable.
- This does not prove rendered mobile visual timing in Replit, linked-user profile toast behavior, empty-pantry action-toast behavior, or broader Planning card layout.

## Stack / base status

- Base refreshed: yes
- Current base: `origin/main` at `5c410e33db4114c07f31a6cec38ddcc92bb71fad`
- PR head before this docs status sync: `80c33c9cdc7cde2cdc6bfac28f5b0e1f463ae63a`
- Last Replit-validated at: not required before merge; no Replit validation has been run for this branch
- Notes: Open PR #182 owns INIT-004 Phase 2 closeout; open PR #183 owns Efforts hygiene review. This branch should not touch either PR.
