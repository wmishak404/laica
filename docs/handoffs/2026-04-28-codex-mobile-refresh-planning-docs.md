# LAICA mobile refresh planning docs

**Agent:** codex
**Branch:** codex/mobile-refresh-planning-docs
**Date:** 2026-04-28

## Summary

Captured Wilson's approved Phase 0-5 mobile-refresh plan in repo-visible product-decision docs, moved approved visual mockups into tracked docs assets, and resolved the prior PD-006 contradiction by adding PD-009.

This is documentation/planning only. No runtime implementation has started on this branch.

Claude's external review file was incorporated from:

`/Users/wilsonishak-macbookpro/.claude/plans/claude-review-request-vectorized-squirrel.md`

## Changes

- `product-decisions/009-mobile-refresh-navigation.md`
  - New durable decision: mobile refresh removes the redundant authenticated Home step and routes users directly to Setup or Planning.
- `product-decisions/006-home-and-cook-remain-separate.md`
  - Marked superseded by PD-009 while preserving historical context.
- `product-decisions/README.md`
  - Indexed PD-009 and marked PD-006 as superseded.
- `product-decisions/features/mobile-refresh/`
  - Added README plus Phase 0 through Phase 5 records.
  - Added cross-phase AI privacy, prompt-injection, logging, and abuse-prevention rules.
- `docs/assets/mobile-refresh/`
  - Added approved mockups for Phase 1, Phase 2, Phase 3 planning, Phase 3 Ticket Pass, Phase 4, and Phase 5.
- `epics/`
  - Added dated notes where the mobile-refresh plan touches active governance: UI governance, full-row tap targets, acceptance criteria, zero-result scan feedback, comma-separated ingredient entry, and local DB schema strategy.
  - Updated EPIC-002 and the registry to show PD-006 was superseded by PD-009.
- `product-decisions/features/README.md`
  - Listed the new Mobile Refresh feature folder.

## Impact on other agents

Implementation should start from these docs rather than chat history.

Recommended order:

1. Phase 0: Firebase Admin auth verification, AI route auth, rate limits, session ownership, body limits, logging cleanup, AI privacy clamps.
2. Phase 1-2: auth/login flow and setup flow.
3. Phase 3: Planning, Chef It Up, Slop Bowl updates, Ticket Pass suggestions, weeklyTime removal from code paths.
4. Phase 4: cooking guidance and timer behavior; completion must not mutate pantry.
5. Phase 5: post-cook cleanup, rescan merge, taste signal, lazy next-meal seed.

Important accepted deviations from Claude's recommendations:

- Phase 5 pre-planning cleanup is a skippable soft gate, not a hard blocker.
- Slop Bowl time bound uses the user's last planning time setting, falling back to 30 minutes.
- Phase 5 next-meal seed is lazy on view, not generated at Finish.
- Firebase Admin uses service-account strategy, with secrets in Replit and local dotenvx/mocks for validation.
- Legacy `weekly_time` DB column should not be dropped in the same cycle as UI/reference removal.

## Open items

- No implementation has started.
- Phase 0 is the implementation prerequisite before feature UI work depends on secured backend flows.
- EPIC-010 remains open. Phase 5 schema fields are documented, but local agents should not run `npm run db:push` against shared databases.
- Replit validation remains required before deployment-bound merge.

## Verification

Documentation checks performed:

- Confirmed current branch was detached, then created `codex/mobile-refresh-planning-docs`.
- Verified existing PD and feature-doc conventions before writing.
- Copied approved mockups from `.codex/generated_images/...` into tracked `docs/assets/mobile-refresh/`.
- Indexed the new feature folder and PD.

Runtime checks were not run because this branch is docs/assets only.
