# Mobile Refresh Phase 1 Auth

**Agent:** codex
**Branch:** codex/mobile-refresh-phase-1-auth
**Date:** 2026-04-29

## Summary

Implemented the Phase 1 auth/login shell from the mobile-refresh plan. The pre-auth page now behaves like a native app start screen instead of a desktop marketing page, and authenticated users no longer land on the redundant Home welcome step.

This branch is stacked on `codex/mobile-refresh-phase-0-security` / PR #21. Until Phase 0 lands on `main`, open the Phase 1 PR against that branch.

## Changes

- `client/src/pages/landing.tsx`
  - Replaced the website-style header, footer, hero copy, feature cards, and "Try Demo" CTA with a mobile app start screen.
  - Added a single primary `Continue with Google` action.
  - Added the parked `What can you help me do?` link and modal with:
    - Personalized Profiles
    - Smart Pantry Recognition
    - Live Cooking Guidance
  - Uses existing design tokens (`bg-sidebar`, `bg-accent`, `text-sidebar-foreground`, `text-primary`) rather than new hex literals.

- `client/src/pages/app.tsx`
  - Removed the authenticated Home/welcome phase from the workflow.
  - Fresh or incomplete profiles now route straight to setup/profiling.
  - Complete profiles route straight to Planning with the planning choice visible.
  - Bottom nav is hidden during setup and cooking, and now contains only Cook and Settings.

## Impact on other agents

- Phase 1 intentionally does **not** remove `weeklyTime`; that belongs to Phase 2 because it touches setup UI, app completion gates, server prompt inputs, and tests.
- The old authenticated welcome card is gone. Future Phase 2 setup work should treat profiling/setup as the first authenticated screen for incomplete users.
- This implements the PD-009 nav simplification direction. Do not reintroduce the authenticated Home tab unless Wilson reverses that decision.

## Open items

- Replit validation is still required after Phase 0 secrets are configured:
  - Firebase sign-in from the new landing page.
  - Fresh account routes directly to setup/profiling.
  - Returning complete account routes directly to Planning.
  - Returning incomplete account remains gated in setup/profiling.
- Phase 2 still owns the setup redesign, embedded camera-first scan flow, and Weekly Cooking Time removal.

## Verification

- `npm run check`
- `npm run build`
- Local browser smoke at `http://127.0.0.1:3000` with dotenvx secrets:
  - Confirmed `Welcome to Laica`.
  - Confirmed `Your live cooking assistant`.
  - Confirmed `Continue with Google`.
  - Confirmed `What can you help me do?`.
  - Confirmed old `Try Demo` text is absent.
  - Confirmed the help modal renders the three parked capability items.
