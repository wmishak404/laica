# Phase 2.1 Setup Polish Deferral

**Agent:** codex
**Branch:** codex/mobile-refresh-phase-2-setup
**Date:** 2026-04-29
**Initiative:** [INIT-001 — Mobile Refresh](../../initiatives/INIT-001-mobile-refresh.md)
**INIT updated:** yes

## Summary

Wilson decided to defer the latest PR #23 UI trust/privacy and visual-flow feedback into a new Phase 2.1 setup-polish scope. PR #23 should close functional Phase 2 because it is already large and has passed Replit functional validation.

## Phase 2.1 Owns

- Camera off by default with accessible on/off toggle.
- One clear upload action instead of separate `Upload one photo` and `Upload photos`.
- Manual entry as a peer-level alternative to upload.
- Scanning/processing animation after capture/upload.
- Real Back/escape from setup step 1.
- Softer pantry language such as `Let's take note of what you have.`
- Cooking Skill one-tap auto-advance.
- Explicit continuation for multi-select screens.
- Optional first-time-user welcome/get-started page.
- Setup visual conformance to the Phase 2 mockup/design-language direction.

## PR #23 Impact

PR #23's merge bar is now functional Phase 2. It should not be blocked by Phase 2.1 visual-flow polish as long as no runtime files change after the validated SHA without a fresh Replit pass.

## Verification

- `git diff --check`
