# Phase 2.2 Returning Setup, Settings, And History IA

**Agent:** codex
**Branch:** codex/mobile-refresh-phase-2-2-settings-history
**Date:** 2026-05-01
**Initiative:** INIT-001
**INIT updated:** yes

## Summary

Implemented the Phase 2.2 bridge before Phase 3 so returning users can revisit Pantry, Kitchen, and Cooking Profile through a mobile-refresh Settings surface, while History becomes a separate Menu destination instead of a Settings tab.

## Changes

- Added `product-decisions/features/mobile-refresh/phase-02-2-returning-setup-settings.md` with flow diagrams, storyboard reference, design gate, acceptance criteria, epic interactions, and deferrals.
- Added `docs/assets/mobile-refresh/phase-02-2-returning-setup-settings-storyboard.svg` as the visual conformance input for Menu, Settings, Pantry, Kitchen, Profile, History list, and future Phase 5 History detail.
- Updated INIT-001, the mobile-refresh phase index, design-language notes, Phase 5 post-cook docs, and the relevant epic notes/registry entries.
- Updated `/app` navigation so the bottom nav has Cook and Menu; Menu opens Settings, History, Feedback, and Account/Sign out.
- Added Settings deep-link state so `Slop Bowl -> Edit pantry` opens Settings directly to Pantry.
- Refreshed `UserSettings` into a hub plus Pantry/Kitchen/Profile sections, carrying forward the Phase 2.1 scan/manual/profile design language without keeping the old History tab.
- Added standalone `CookingHistory` with the existing list, expand, delete, and undo-delete behavior in a refreshed History shell.

## Impact on other agents

- Phase 3 should start after Phase 2.2 merges, from fresh `origin/main`, so Planning and Slop Bowl do not link into legacy Settings.
- Phase 5 owns richer History behavior: share, cook again, taste memory, cleanup continuity, and retention.
- EPIC-013 pantry spell correction and EPIC-014 scan-session duplicate refinement remain deferred.
- History is no longer part of the active Settings UI; future cleanup can further slim old settings internals if desired.

## Open items

- Replit validation has not been run.
- Visual review should compare Menu, Settings, and History against `phase-02-2-returning-setup-settings-storyboard.svg`.

## Verification

- `npm ci`
- `npm run check`
- `npm run build`
- Local dev server health check: `curl -I http://127.0.0.1:3000` returned `200 OK` in the same startup command. The Codex sandbox did not keep the background server reachable after command exit, so use Replit or a fresh foreground local run for visual review.

## Stack / base status

- Base refreshed: yes
- Current base: origin/main at `6541e91e15b80030655d83ca4e9413fd0d2491e9`
- Last Replit-validated at: not yet validated
- Notes: Branch started from fresh `origin/main` after Phase 2.1 closeout merge.
