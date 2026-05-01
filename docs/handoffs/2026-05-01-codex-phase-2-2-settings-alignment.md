# Phase 2.2 Returning Settings Alignment

**Agent:** codex
**Branch:** codex/mobile-refresh-phase-2-2-settings-history
**Date:** 2026-05-01
**Initiative:** INIT-001
**INIT updated:** yes

## Summary

Implemented Wilson's accepted Phase 2.2 alignment plan for returning Settings. First-time setup remains the anchor and was not intentionally changed. Returning Pantry, Kitchen, and Cooking Profile now mirror the accepted setup visual/control language while keeping returning-user edit behavior.

## Product Decisions Recorded

- Same database: first-time setup and returning Settings both read/write `/api/user/profile`, backed by `auth_users.pantry_ingredients`, `kitchen_equipment`, `cooking_skill`, `dietary_restrictions`, and `favorite_chefs`.
- Separate pages by intent: first-time setup stays sequential/completion-gated; returning Settings stays a hub/deep-link editor with saved data, independent save, remove, and reset.
- Same look/feel foundation: returning Settings should reuse setup camera, upload/manual, scanning, chip/list, and profile-choice language except where the returning edit context requires a visible saved list or explicit save/reset controls.

## Changes

- Replaced Settings' separate scan card + camera dialogs with the setup `NativeCamera` object rendered inline; camera remains off until the user turns it on.
- Changed returning Pantry/Kitchen upload/manual controls to setup-style peer actions.
- Changed returning scan loading feedback to setup-style scanning state.
- Changed returning saved Pantry/Kitchen lists to setup-style surfaces and chips while preserving remove/reset/save behavior.
- Changed returning Cooking Profile skill and dietary choices to setup-style full-row choices, setup illustration tokens, and isolated `No restrictions`.
- Preserved existing profile persistence hooks and API routes; no schema/API changes.

## Epic Interactions

- EPIC-001: conforms; Settings now mirrors the accepted setup control pattern rather than creating a parallel UI system.
- EPIC-004: conforms; returning profile controls use full-row setup choices.
- EPIC-005: adds a data-consistency validation requirement between setup, Settings, Planning, and Slop Bowl.
- EPIC-007: conforms; no-detection and rejection feedback paths remain explicit.
- EPIC-009: conforms; manual Pantry/Kitchen entry continues using the shared parser.
- EPIC-012: adds accepted signal that returning Settings can be edit-led without becoming visually separate from setup.
- EPIC-014: defers; this pass preserves existing duplicate mitigation and does not add latest-scan chip states.

## Open Items

- Replit/mobile visual validation is still required.
- Confirm first-time setup still looks unchanged in Replit after the Settings-only alignment.
- Confirm Settings edits reflect in Planning/Slop Bowl through the existing profile query/data flow.

## Verification

- `npm run check`
- `npm run build`
- `git diff --check`

## Stack / base status

- Base refreshed: yes
- Current base: origin/main at `6541e91e15b80030655d83ca4e9413fd0d2491e9`
- Last Replit-validated at: not yet validated
