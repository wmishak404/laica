# EFF-028 Prep Tray Image Evidence

**Date:** 2026-07-14
**Branch:** `codex/chef-preview-image-effort`
**Owner:** Codex
**Status:** Docs-only Effort update; no runtime implementation

## Summary

Wilson added a second Chef It Up pre-Live-Cooking visual issue: on mobile, the Prep Tray / recipe-detail selected image is present but inset inside the preview area, while the desktop comparison fills the whole image area between the borders. The desired implementation target is the desktop/full-bleed behavior on mobile too: the food image should take over that top preview space with no visible inner border/gutter when a ready selected image exists.

I updated EFF-028 instead of creating a new Effort because this is another narrow Chef It Up mobile visual-clearance issue before Live Cooking, not a Settings or provider/image-generation issue. It shares the same sequencing gate as the time-title issue: do not implement until Codex thread `019f3b47-9d04-7a03-8973-2a9cd1bb19b4` has finished/merged its current work.

## Changed

- `efforts/effort-028-chef-it-up-time-title-clearance.md`: broadened the title to `Chef It Up mobile visual clearance`, added the Prep Tray selected-image mobile evidence, expanded scope/checklist/resolution criteria, and recorded the decision to keep this inside EFF-028.
- `efforts/README.md`: updated the active Effort title.
- `efforts/registry.md`: updated the EFF-028 title and last signal.

## Implementation Breadcrumbs

Future implementation should read EFF-028, INIT-001, Phase 3 Planning, Phase 3.1 Recipe Imagery, PD-005, and `design_guidelines.md`.

Relevant code areas from this filing pass:

- `client/src/components/cooking/meal-planning.tsx`: `renderRecipeImageSlot`, `planning-prep-hero`, and the Prep Tray render path.
- `client/src/index.css`: `.planning-prep-hero`, `.planning-recipe-image-slot-prep`, and `.planning-recipe-image`.
- `tests/e2e/cooking-workflow.test.ts`: existing selected recipe preview imagery bounds check against `.planning-prep-hero`.

## Validation

Docs-only validation for this branch:

- `git diff --check`
- Targeted reference search for `EFF-028`, `Chef It Up mobile visual clearance`, `planning-prep-hero`, and the gated thread id.

Negative scope: no client/server code, image resolver, provider, cache, prompt, navigation, Prep Tray content, Ready Check, or Live Cooking implementation changed.
