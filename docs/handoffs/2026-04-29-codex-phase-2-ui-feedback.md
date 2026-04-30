# Phase 2 UI Feedback Capture

**Agent:** codex
**Branch:** codex/mobile-refresh-phase-2-setup
**Date:** 2026-04-29
**Initiative:** [INIT-001 — Mobile Refresh](../../initiatives/INIT-001-mobile-refresh.md)
**INIT updated:** yes

## Summary

Captured Wilson's latest PR #23 setup-flow UI feedback as Phase 2 polish guidance and acceptance criteria. This is a docs-only update; no UI code was changed in this pass.

## Feedback Captured

- Combine `Upload one photo` and `Upload photos` into one clear upload action.
- Make camera off by default, with an explicit accessible on/off toggle.
- Show a visible scanning/processing animation after capture/upload while LAICA analyzes results.
- Provide a real Back/escape path from step 1.
- Give manual entry the same visual importance as photo upload for privacy-sensitive users.
- Replace privacy-invasive pantry copy such as "Show me your pantry" with softer language like "Let's take note of what you have."
- Capture a first-time-user welcome/get-started page as Phase 2.1 or follow-up unless explicitly pulled into PR #23.

## Docs Updated

- `product-decisions/features/mobile-refresh/phase-02-setup.md`
- `initiatives/INIT-001-mobile-refresh.md`
- `epics/012-laica-design-language.md`

## PR #23 Impact

Most items are functional trust/privacy/accessibility polish and should be treated as PR #23 blockers if the team wants Phase 2 to close cleanly. The welcome/get-started page is likely a follow-up unless Wilson decides to pull it into the current branch.

## Verification

- `git diff --check`
