# Mobile Refresh Phase 2.1 Setup Polish

**Agent:** codex
**Branch:** codex/mobile-refresh-phase-2-1-setup-polish
**Date:** 2026-04-30
**Initiative:** INIT-001
**INIT updated:** yes

## Summary

Implemented the Phase 2.1 setup polish scope from INIT-001: first-time welcome/get-started, camera opt-in, peer upload/manual paths, clearer scanning state, softer pantry/kitchen copy, Cooking Skill one-tap auto-advance, and a backward-compatible text-only scan rejection contract.

## Changes

- `client/src/components/cooking/user-profiling.tsx`
  - Adds the welcome screen and Back path from pantry to welcome without allowing incomplete users into Planning.
  - Reworks pantry/kitchen setup surfaces around camera opt-in, upload/manual peer actions, scanning feedback, softer copy, and warm tokenized list chips.
  - Makes Cooking Skill auto-advance after a full-row single-choice selection; Dietary Restrictions still requires explicit continuation.
- `client/src/components/ui/native-camera.tsx`
  - Starts camera off by default and adds an accessible on/off switch that starts/stops media tracks.
  - Allows setup to hide the built-in single-upload fallback so only one `Upload photos` action appears.
- `server/openai.ts`, `server/prompts/**`, `server/vision/analysis-result.ts`, `client/src/lib/visionResult.ts`
  - Adds optional `rejected`, `rejectionCode: "TEXT_ONLY_DOCUMENT"`, and `rejectionMessage` metadata while preserving existing `ingredients` / `equipment` arrays.
  - Prompts reject screenshots/documents/lists/receipts/menus/recipes/notes as inventory evidence while preserving physical product/tool labels.
  - Client setup/settings scan handlers avoid adding rejected results and route users to manual-entry guidance.
- Tests added/updated for prompt rules, vision result normalization, camera-off default, welcome/back flow, and Cooking Skill auto-advance.

## Impact on other agents

- EPIC-004: conforms by keeping single-choice setup rows full-row and adding auto-advance for Cooking Skill while preserving explicit continuation on multi-select Dietary Restrictions.
- EPIC-005: conforms by recording local checks and keeping Replit validation as the merge gate.
- EPIC-007: conforms by preserving explicit no-detection feedback; rejected text-only scans are treated as a separate clear feedback path.
- EPIC-009: conforms by preserving shared comma-separated manual entry in setup/settings.
- EPIC-010: conforms by avoiding DB/schema changes and not running `db:push`.
- EPIC-012: conforms by applying the Phase 2 setup mockup/design-language trust and control direction.

## Open items

- Pull this branch into Replit and run signed-in Phase 2.1 validation.
- Open a PR after validation state is recorded.
- Update the PR description and this handoff if any commit lands after Replit validation; validation is stale after any newer commit.

## Verification

- `npm ci`
- `npm run check`
- `npx vitest run tests/unit/equipment-vision-prompts.test.ts tests/unit/vision-analysis-result.test.ts tests/unit/vision-result.test.ts tests/unit/native-camera.test.tsx tests/unit/user-profiling.test.tsx`
- `npm run build`

## Stack / base status

- Base refreshed: yes
- Current base: origin/main at `4ef300cda6778bbd562e918fc5b835a246b65bd8`
- Last Replit-validated at: not yet validated
- Notes: Phase 2.1 started after PR #23 and PR #26 merged to `main`; branch was created fresh from current `origin/main`.
