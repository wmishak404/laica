# Mobile Refresh Phase 2 — Setup: Pantry, Kitchen, and Profile

**Status:** Accepted
**Phase owner:** Wilson
**Date:** 2026-04-28
**Mockup:** [phase-02-setup.png](../../../docs/assets/mobile-refresh/phase-02-setup.png)

## Goal

Reduce setup effort by making camera scan the focal value moment, then let users review/edit results with mobile-native controls.

## Decisions

### Pantry scan

- Pantry scan is camera-first with embedded camera preview.
- Upload from library remains available as a secondary option.
- Manual entry remains available as a small bottom action.
- Scanning tips live in a small informative pop-up, not as a blocking step.
- Multi-scan is supported and merged into one canonical pantry inventory.
- The goal is accurate pantry inventory, not one-to-one adherence to each individual photo.
- Duplicate detections from different angles are normalized and merged.
- Pantry chips use the warm/coral design direction, not teal.

### Kitchen scan

- Kitchen scan uses the same camera-first pattern as Pantry.
- Visual treatment should signal a different setup phase while preserving the same interaction model.
- Kitchen results should honor EPIC-006 equipment exclusions.

### Profile selections

- Cooking Skill Level is its own page.
- Dietary Restrictions is its own page.
- Dietary Restrictions supports multiple full-row toggle selections.
- Weekly Cooking Time is removed completely from setup and profile-completion gates.

### Manual ingredient entry

- Manual entry accepts comma-separated items, trims whitespace, normalizes labels, rejects empty entries, and dedupes.
- This behavior should be shared with Slop Bowl quick-add instead of reimplemented separately.

## Scan Merge Behavior

- Each scan produces candidate normalized labels.
- Candidates are merged into the existing setup inventory by canonical label.
- Review UI shows a deduped ingredient list, not photo-specific rows.
- If a scan detects nothing, show explicit no-detection feedback and preserve existing inventory.

## Acceptance Criteria

- Embedded camera preview loads on supported browsers.
- Camera permission denial leaves users on the setup page with upload/manual alternatives.
- Upload from library still works.
- Pantry accepts up to 8 photos per batch client-side; Kitchen accepts up to 6.
- Repeated scans of the same pantry/fridge from different angles do not create overlapping duplicates.
- Empty scan produces clear no-detection feedback.
- Pantry chips are readable and token-driven.
- Skill and dietary choices are full-row tap targets.
- Weekly Cooking Time no longer appears in setup, settings, onboarding completion, or server readiness gates.
- Manual entry `"buns, mayo"` creates two ingredient chips.

## Epic Interactions

- EPIC-001: Applies the mobile-refresh design principles and tokenized warm palette.
- EPIC-004: Skill and dietary rows must be full-row tap targets.
- EPIC-006: Kitchen/equipment scan excludes non-kitchen items.
- EPIC-007: Empty scan feedback applies to Pantry and Kitchen.
- EPIC-009: Comma-separated manual ingredient entry expands beyond Slop Bowl into Setup.
- EPIC-010: No local DB pushes for schema changes; Replit remains the DB authority.

## Backend Notes

- Vision route must be authenticated and rate-limited before this phase ships.
- Server must enforce decoded image limits and reject oversize payloads early.
- Ingredient labels from model output should be clamped and normalized before persistence.
