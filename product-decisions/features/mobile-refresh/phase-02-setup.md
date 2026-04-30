# Mobile Refresh Phase 2 — Setup: Pantry, Kitchen, and Profile

**Status:** Accepted
**Phase owner:** Wilson
**Date:** 2026-04-28
**Initiative:** [INIT-001 — Mobile Refresh](../../../initiatives/INIT-001-mobile-refresh.md)
**Mockup:** [phase-02-setup.png](../../../docs/assets/mobile-refresh/phase-02-setup.png)

## Goal

Reduce setup effort by making camera scan the focal value moment, then let users review/edit results with mobile-native controls.

## 2026-04-29 Scope Correction

Phase 2 implementation must include setup visual conformance, not only the functional camera/manual-entry/profile wiring. Wilson's validation of PR #23 surfaced that the new behavior was visible, but the setup surface did not yet feel close enough to the approved mockup and the pantry camera step lacked an obvious Back/escape affordance.

Before Phase 2 is ready to merge:

- Pantry and Kitchen setup screens should visually follow the Phase 2 mockup direction: mobile-native composition, warm/coral LAICA styling, clear primary capture CTA, secondary upload/manual/tips hierarchy, tokenized spacing, and deliberate camera framing.
- The embedded camera step must include a visible Back/escape path. That escape can return to the previous setup surface or signed-in safe landing, but incomplete users must not bypass required setup into cooking.
- Camera previews should feel integrated into LAICA chrome rather than like a raw/native preview with functional buttons attached.
- Any intentional visual deviation from the mockup must be documented in this phase record and handoff before readiness validation.
- The Planning entry screen remains Phase 3 scope unless the team explicitly pulls that visual redesign forward into Phase 2 or a Phase 2.x polish pass.

## 2026-04-29 PR #23 UI Feedback

Wilson's in-flow Phase 2 testing added trust, privacy, and action-hierarchy feedback that should guide the next setup polish pass:

- `Upload one photo` and `Upload photos` should become one clear `Upload photos` action.
- Camera should be off by default. Users should explicitly turn it on with a clear, accessible camera toggle, then be able to turn it off again from the same control.
- Pantry/Kitchen scan analysis should show a visible "Scanning" or processing animation after capture/upload so users know LAICA is working.
- Step 1 needs a real Back/escape path, not a disabled Back button.
- Manual entry should have the same visual importance as photo upload because some users will prefer it for privacy.
- Pantry copy should avoid privacy-invasive language like "Show me your pantry." Candidate direction: "Let's take note of what you have."
- Cooking Skill is a single-choice step, so selecting `Beginner`, `Intermediate`, or `Expert` should accept the input and advance immediately without requiring the `Next` button. Users can still return with Back.
- The auto-advance pattern is for single-input multiple-choice screens only. Multi-select screens, such as future cuisine selection, should keep an explicit `Next` or continue action because users may choose more than one option.
- A first-time-user welcome/get-started page with useful introductory context is desirable, similar in spirit to the pre-auth "What can you help me do?" content. This should be captured as Phase 2.1 or a follow-up unless the team explicitly pulls it into PR #23.

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
- Capture/upload analysis shows an explicit scanning or processing state while results are pending.
- Pantry chips are readable and token-driven.
- Skill and dietary choices are full-row tap targets.
- Cooking Skill auto-advances after one full-row selection; Dietary Restrictions stays on-screen until the user explicitly continues.
- Setup screens visibly conform to the Phase 2 mockup direction; functional parity alone is not sufficient.
- Pantry and Kitchen camera steps have a clear Back/escape affordance that does not let incomplete users bypass required setup.
- Camera starts off by default and can be toggled on/off through an accessible control.
- Upload and manual entry are peer-level alternatives, not a primary/private-secondary hierarchy.
- Weekly Cooking Time no longer appears in setup, settings, onboarding completion, or server readiness gates.
- Manual entry `"buns, mayo"` creates two ingredient chips.

## Epic Interactions

- EPIC-001: Applies the mobile-refresh design principles and tokenized warm palette.
- EPIC-004: Skill and dietary rows must be full-row tap targets.
- EPIC-006: Kitchen/equipment scan excludes non-kitchen items.
- EPIC-007: Empty scan feedback applies to Pantry and Kitchen.
- EPIC-009: Comma-separated manual ingredient entry expands beyond Slop Bowl into Setup.
- EPIC-010: No local DB pushes for schema changes; Replit remains the DB authority.
- EPIC-012: Phase 2 setup is the first active pilot for LAICA's target design language and visual mockup conformance.

## Backend Notes

- Vision route must be authenticated and rate-limited before this phase ships.
- Server must enforce decoded image limits and reject oversize payloads early.
- Ingredient labels from model output should be clamped and normalized before persistence.
