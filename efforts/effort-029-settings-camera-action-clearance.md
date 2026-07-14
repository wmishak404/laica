# EFF-029: Settings camera height and action clearance

**Status:** Open
**Owner:** Wilson / Codex / Claude
**Created:** 2026-07-14
**Linked Initiative:** [INIT-001 - Mobile Refresh](../initiatives/INIT-001-mobile-refresh.md)
**Related docs:** [Phase 2.1 Setup Polish](../product-decisions/features/mobile-refresh/pd-phase-02-1-setup-polish.md), [Phase 2.2 Returning Setup / Settings](../product-decisions/features/mobile-refresh/pd-phase-02-2-returning-setup-settings.md), [PD-005 UI Governance](../product-decisions/pd-005-ui-governance.md), [design guidelines](../design_guidelines.md)

## One-line summary

Fix returning Settings Pantry/Tools scan layout so the camera object feels closer to a 4:5 phone-camera frame and pinned inventory actions sit above the bottom nav instead of under it.

## Context

Wilson's 2026-07-14 mobile Safari/Replit screenshots of the logged-in Settings Kitchen Inventory pages show two related visual/layout regressions on both Pantry and Tools:

1. The camera preview object is too short vertically. Wilson wants it increased toward a 4:5 frame so it feels closer to an iPhone camera app, not a squat embedded panel. The `Camera is off` empty-state text and controls currently look disproportionate inside the shortened camera area.
2. The pinned Pantry/Tools action buttons at the bottom of the Settings page are covered by the main bottom navigation bar with the Cook and Menu icons. The actions should remain pinned within the Settings content but clear the app nav, not hide beneath it.

The screenshots are from returning logged-in Settings, not first-time setup. Returning Settings intentionally reuses setup's camera object and action grammar, so the implementation should inspect the shared setup/returning CSS and components before choosing whether the fix belongs in a shared camera/action primitive or in returning Settings-specific layout.

Sequencing note from Wilson: do not implement this Effort until Codex thread `019f3b47-9d04-7a03-8973-2a9cd1bb19b4` has merged, because that release is large and already creating bugs/design drift.

This is not the production vision-scan 500 blocker recorded in `docs/handoffs/2026-06-21-codex-prod-vision-scan-investigation-blocked.md`; this Effort is a client layout/visual follow-up.

## Scope

- Target returning logged-in Settings Kitchen Inventory -> Pantry and Kitchen Inventory -> Tools.
- Increase the camera preview/object height toward a 4:5 aspect ratio while preserving the accepted setup-derived camera controls: camera-off toggle, blank shutter, tips/help button, and in-frame state messaging.
- Rebalance the `Camera is off` empty-state typography, icon scale, spacing, and controls so the off state feels proportionate in the taller camera frame.
- Fix the pinned Pantry/Tools action area so Save/Reset or equivalent bottom actions are visible, tappable, and positioned above the authenticated bottom nav on mobile Safari/Replit viewports.
- Account for safe-area and browser chrome realities on narrow mobile screens.
- Preserve existing Pantry and Tools behavior: scan, upload, manual entry, remove/reset/save, dirty-state reminders, and leave/switch prompts.
- If the shared `NativeCamera`/setup camera object is changed, verify first-time setup Pantry/Tools camera surfaces do not regress.

Out of scope:

- Implementing before thread `019f3b47-9d04-7a03-8973-2a9cd1bb19b4` merges.
- Changing durable bottom-nav IA, icon set, labels, auth-mode visibility, or navigation behavior.
- Changing scan provider behavior, upload limits, scan rate limits, server routes, schema, or prompt/model logic.
- Reworking Settings IA beyond Pantry/Tools action clearance.
- Solving the production vision-scan 500 investigation.

## Decisions made so far

- Treat the camera-height and bottom-action overlap as one implementation follow-up because both affect the same returning Settings Pantry/Tools scan layout.
- Prioritize returning logged-in Settings Pantry and Tools. Shared setup-derived components may be changed only if that is the cleanest fix and first-time setup visual parity is verified.
- Use a 4:5 camera-object target as the visual direction.
- Keep bottom actions pinned, but above the main bottom nav.
- Sequence implementation after Codex thread `019f3b47-9d04-7a03-8973-2a9cd1bb19b4` merges.

## Open questions

- Should the camera frame use a strict `aspect-ratio: 4 / 5`, a responsive min/max height around that ratio, or a returning-Settings-only variant that approximates 4:5 while preserving upload/manual/action visibility?
- Should the bottom action clearance live in the Settings inventory shell, the shared setup bottom-action pattern, or the authenticated app-shell bottom-nav spacing contract?
- Does the first-time setup camera currently need the same 4:5 adjustment, or should the first implementation keep first-time setup visually unchanged?

## Agent checklist

- [ ] Confirm Codex thread `019f3b47-9d04-7a03-8973-2a9cd1bb19b4` has merged before implementation.
- [ ] Read this Effort, INIT-001, Phase 2.1, Phase 2.2, PD-005, `design_guidelines.md`, and the relevant recent Settings handoffs before implementation.
- [ ] Inspect `client/src/components/cooking/user-settings.tsx`, `client/src/components/ui/native-camera.tsx`, `client/src/index.css`, and current tests before choosing the fix location.
- [ ] Verify Pantry and Tools returning Settings at a narrow mobile viewport with bottom nav visible.
- [ ] If shared camera CSS/components are touched, verify first-time setup Pantry and Tools camera surfaces.
- [ ] Record visual evidence and negative scope in the PR/handoff.

## Resolution criteria

1. Returning Settings Pantry and Tools camera objects render with a taller, phone-camera-like frame close to 4:5, and the camera-off state no longer looks cramped or disproportionate.
2. Returning Settings Pantry and Tools pinned action buttons are fully visible and tappable above the main bottom nav on representative mobile Safari/Replit viewports.
3. Upload/manual actions, scan/camera controls, dirty reminders, save/reset behavior, and Pantry/Tools section switching remain unchanged.
4. No durable bottom-nav IA or auth-mode visibility changes ship.
5. Any shared camera/action-shell change is checked against first-time setup so accepted setup visual parity is preserved or any intentional deviation is documented.
6. The implementation PR records exact visual validation, command/check provenance, source files inspected, and remaining unvalidated scope.

## 2026-07-14 - Effort filed

Codex filed this Effort from Wilson's screenshot-backed request. No runtime implementation has started. Implementation is explicitly gated on thread `019f3b47-9d04-7a03-8973-2a9cd1bb19b4` merging first.
