# Mobile Refresh Phase 2.1 Setup Polish

**Agent:** codex
**Branch:** codex/mobile-refresh-phase-2-1-setup-polish
**Date:** 2026-04-30
**Initiative:** INIT-001
**INIT updated:** yes

## Summary

Implemented the Phase 2.1 setup polish scope from INIT-001: first-time welcome/get-started, camera opt-in, peer upload/manual paths, clearer scanning state, softer pantry/kitchen copy, Cooking Skill one-tap auto-advance, and a backward-compatible text-only scan rejection contract.

Follow-up visual conformance pass: Wilson reviewed setup and said it still felt too close to the old UI. Codex updated setup to a mockup-led cream/coral phone-flow treatment with setup-only `Fraunces` display and `Nunito` UI/body typography, designed scan viewfinder, integrated camera toggle, warmer upload/manual/review surfaces, short coral chips, illustrated states, and sticky bottom actions. This typography/look is scoped to setup for now and documented as the Phase 2.1 pilot direction for later mobile-refresh phases.

## Changes

- `client/src/components/cooking/user-profiling.tsx`
  - Adds the welcome screen and Back path from pantry to welcome without allowing incomplete users into Planning.
  - Reworks pantry/kitchen setup surfaces around camera opt-in, upload/manual peer actions, scanning feedback, softer copy, and warm tokenized list chips.
  - Makes Cooking Skill auto-advance after a full-row single-choice selection; Dietary Restrictions still requires explicit continuation.
- `client/src/components/ui/native-camera.tsx`
  - Starts camera off by default and adds an accessible on/off switch that starts/stops media tracks.
  - Allows setup to hide the built-in single-upload fallback so only one `Upload photos` action appears.
  - Adds a setup variant with an integrated toggle, rounded viewfinder, corner brackets, live badge, warmer off/blocked states, and coral capture CTA while leaving settings usage on the default camera treatment.
- `client/src/index.css`
  - Imports `Fraunces` and `Nunito` alongside the existing fonts.
  - Adds setup-scoped visual utilities behind `.setup-ui` / `.setup-display` / `.setup-copy` / related setup classes so global typography remains unchanged.
- `server/openai.ts`, `server/prompts/**`, `server/vision/analysis-result.ts`, `client/src/lib/visionResult.ts`
  - Adds optional `rejected`, `rejectionCode: "TEXT_ONLY_DOCUMENT"`, and `rejectionMessage` metadata while preserving existing `ingredients` / `equipment` arrays.
  - Prompts reject screenshots/documents/lists/receipts/menus/recipes/notes as inventory evidence while preserving physical product/tool labels.
  - Client setup/settings scan handlers avoid adding rejected results and route users to manual-entry guidance.
- `product-decisions/features/mobile-refresh/design-language.md`, `initiatives/INIT-001-mobile-refresh.md`
  - Record the setup-only typography pilot and the visual conformance resume point.
- Tests added/updated for prompt rules, vision result normalization, camera-off default, welcome/back flow, and Cooking Skill auto-advance.

## Impact on other agents

- EPIC-001: conforms by scoping new typography and setup visual utilities behind setup-only classes instead of replacing the global app font stack or shared primitives.
- EPIC-004: conforms by keeping single-choice setup rows full-row and adding auto-advance for Cooking Skill while preserving explicit continuation on multi-select Dietary Restrictions.
- EPIC-005: conforms by recording local checks and keeping Replit validation as the merge gate.
- EPIC-007: conforms by preserving explicit no-detection feedback; rejected text-only scans are treated as a separate clear feedback path.
- EPIC-009: conforms by preserving shared comma-separated manual entry in setup/settings.
- EPIC-010: conforms by avoiding DB/schema changes and not running `db:push`.
- EPIC-012: conforms by applying the Phase 2 setup mockup/design-language trust and control direction, including the setup-only typography pilot and deliberate cream/coral scan-object treatment.

## Open items

- Pull this branch into Replit and run signed-in Phase 2.1 validation.
- Replit validation must include visual review against `docs/assets/mobile-refresh/phase-02-setup.png`, especially setup typography, designed scan object, sticky bottom actions, upload/manual/tips hierarchy, and list chip treatment.
- Open a PR after validation state is recorded.
- Update the PR description and this handoff if any commit lands after Replit validation; validation is stale after any newer commit.

## Verification

- `npm ci`
- `npm run check`
- `npx vitest run tests/unit/equipment-vision-prompts.test.ts tests/unit/vision-analysis-result.test.ts tests/unit/vision-result.test.ts tests/unit/native-camera.test.tsx tests/unit/user-profiling.test.tsx`
- `npm run build`

Known build warnings: Browserslist data is stale; Vite still reports the existing Firebase dynamic/static import chunking warnings and the existing large bundle warning.

## Stack / base status

- Base refreshed: yes
- Current base: origin/main at `4ef300cda6778bbd562e918fc5b835a246b65bd8`
- Last Replit-validated at: not yet validated
- Notes: Phase 2.1 started after PR #23 and PR #26 merged to `main`; branch was created fresh from current `origin/main`.
