# EFF-034 Timer and Settings Hub Cleanup

**Agent:** codex
**Branch:** `codex/eff-034-timer-settings-cleanup`
**Date:** 2026-07-22
**Initiative:** [INIT-001 - Mobile Refresh](../../initiatives/INIT-001-mobile-refresh.md)
**Effort:** [EFF-034 - Production-readiness mobile P2 cleanup](../../efforts/effort-034-production-readiness-mobile-p2-cleanup.md)
**PR:** pending
**Base:** `origin/main` at `742694d9d209dba04674ce7188319d7f449c4a6e`
**INIT updated:** yes
**Resolves blocked handoff:** none

## Summary

This branch implements one non-blocking production-readiness cleanup milestone for Mobile Refresh. Cooks who reset a Live Cooking timer now get the fresh `Start <duration> timer` action instead of a misleading paused `Resume timer` label. The Settings hub gets its own page-fit contract so it stops inheriting extra bottom padding and full-height shell behavior that contributed to a large blank mobile scroll tail.

The slice is intentionally narrow. It does not reopen PR #269's timer duration model, PR #325's returning Pantry/Tools dock contract, first-time setup compact-fit work, navigation, auth, provider/schema behavior, persistence APIs, or Phase 5 semantics.

## Architecture Triage

- INIT-001 ranked first: PR #325 and PR #324 are merged and closed out, and EFF-034 is a documented, unowned, small P2 implementation milestone on the current Mobile Refresh path.
- INIT-004 is not safe to take over because PR #272 and PR #274 are still open/owned.
- INIT-002 remains in its Replit observation lane rather than executable local implementation.
- INIT-003's merged Guest Finish work now feeds future Phase 5 semantics; no independent implementation slice was clearer than EFF-034 for this run.
- EFF-032 remains a subset-phone follow-up that needs real Safari/Chrome scroll-owner evidence before implementation; this branch does not touch it.

No Wilson decision was needed because EFF-034 already documented the scope and severity, no branch owner was active for this slice, and the changes avoid product, security, secrets, Replit, deployment, or validation-lane decisions.

## Changes

- `client/src/components/cooking/live-cooking.tsx`: Reset now clears the active countdown state with `setTimer(0)` while the UI still displays the full step duration through the existing fallback display logic.
- `client/src/components/cooking/user-settings.tsx`: returning Settings now distinguishes `.returning-ui-hub` from `.returning-ui-inventory`; the hub no longer receives `pb-24`.
- `client/src/index.css`: adds hub-specific root/shell fit rules so Settings hub height is governed separately from the fixed inventory page.
- `tests/unit/live-cooking-guest-session.test.tsx`: covers Start -> Pause -> Resume and Start -> Reset -> Start timer behavior.
- `tests/unit/user-settings-scan-policy.test.tsx`: guards the Settings hub root classes and absence of generic bottom padding.
- `tests/unit/setup-button-css.test.ts`: guards the hub CSS rules that prevent the inert blank-tail regression.
- Durable docs updated: INIT-001, initiative registry, EFF-034, Effort read list/registry, Phase 4, Phase 2.2, and the production validation registry.

## Impact on other agents

Treat `codex/eff-034-timer-settings-cleanup` as the active EFF-034 implementation branch. Do not start a parallel timer reset or Settings hub-tail branch unless this PR is abandoned.

Future Settings inventory work should preserve the separation between `.returning-ui-hub` and `.returning-ui-inventory`. The inventory branch still owns fixed-page dock geometry; the hub branch only owns the card-list page fit.

## Stack / Base Status

- Base refreshed: yes
- Current base: `origin/main` at `742694d9d209dba04674ce7188319d7f449c4a6e`
- Last Replit-validated at: not yet validated
- Notes: branch starts after PR #325, PR #324, and their docs closeouts merged. It is not stacked on PR #281, PR #274, PR #272, or PR #265.

## Open Items

- Open the PR and let exact-head GitHub `unit`, `e2e_guest_smoke`, dependency audit, secret scan, and CodeQL run.
- Capture or defer phone-viewport after evidence for Settings hub at `390x844` and `412x915`, and timer Reset before/after evidence, per EFF-034. The existing before screenshot is [`2026-07-20-codex-settings-root-blank-scroll-390x844.jpg`](../assets/mobile-refresh/2026-07-20-codex-settings-root-blank-scroll-390x844.jpg).
- Do not claim local service-backed browser validation from this worktree unless the database endpoint is re-enabled or a disposable local sandbox is prepared.
- Wilson's explicit merge approval is required because this is a runtime UI/product-behavior PR.

## Verification

Checks passed during implementation:

- `npx vitest run tests/unit/live-cooking-guest-session.test.tsx --testTimeout=15000`
- `npx vitest run tests/unit/user-settings-scan-policy.test.tsx tests/unit/setup-button-css.test.ts --testTimeout=15000`
- `npm run test:unit` (51 files / 402 tests)
- `npm run check`
- `npm run build`
- `npm audit --audit-level=high` (passed the high/critical gate; npm still reports one low and one moderate advisory)
- `git diff --check`
- `npm run setup:worktree` linked `.env.keys` without printing secrets.

Local service-backed browser validation is not claimed:

- `npm run env:run -- npm run db:health` failed because the configured database endpoint is disabled.

Exact-head GitHub evidence and phone-viewport after evidence are pending before merge readiness is claimed.
