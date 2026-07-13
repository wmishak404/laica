# Mobile Browser Viewport Redo Principles

**Agent:** codex
**Branch:** codex/mobile-browser-ux-principles
**Date:** 2026-07-13
**Initiative:** INIT-001
**INIT updated:** yes
**Resolves blocked handoff:** none

## Summary

PR #280 (`codex/mobile-browser-type-fit`) should not merge. It attempted to make short planning/setup flows fit the visible mobile browser viewport, but the branch became too broad and introduced too many irregularities, especially in setup. This docs-only pass preserves the reusable design-language principles and records PR #280 as negative implementation evidence. The redo should start from fresh `origin/main`, not from the abandoned branch.

## Changes

- `design_guidelines.md`
  - Adds mobile browser viewport principles for browser chrome, discoverable primary actions, consistent semantic type, one scroll owner, no inert bottom tails, scoped browser-mode changes, and phone-browser validation.
  - Adds anti-pattern/review-checklist items for broad browser-fit selectors and inert blank scroll endpoints.
- `initiatives/INIT-001-mobile-refresh.md`
  - Records PR #280 as abandoned unmerged and warns future agents not to cherry-pick its code.
  - Adds a 2026-07-13 chronology entry for the mobile browser viewport redo direction.

## Impact on other agents

The next implementation attempt should use `design_guidelines.md` as the brief and treat PR #280 only as historical evidence of what went wrong. Keep the redo small enough to validate: choose a narrow surface group, preserve the existing design proportions, and add scoped wrappers/shared primitives before broad CSS. Phone-browser visual review remains the relevant evidence for browser chrome and scroll-endpoint behavior; desktop Chrome with a mobile viewport is only functional smoke.

## Open items

- Close PR #280 or keep it clearly marked as abandoned, but do not merge it.
- Start the viewport redo on a fresh thread/branch from `origin/main`.
- Recreate only the principles that survive design review; avoid copying PR #280 implementation hooks, broad CSS, or per-screenshot pixel fixes.

## Verification

Docs-only change. Suggested checks:

- `git diff --check`
- Review `design_guidelines.md` for principle-level language rather than implementation-specific instructions.

## Stack / base status

- Base refreshed: yes
- Current base: `origin/main` at branch creation (`deaf17e`)
- Last Replit-validated at: not applicable; docs-only preservation branch
- Notes: created specifically to preserve PR #280 learnings without carrying over its runtime implementation.
