# EFF-035: Universal mobile viewport resilience for first-time setup

**Status:** Open
**Priority:** P1 — immediate post-production patch; explicitly accepted as a release exception
**Owner:** Wilson / Codex / Claude
**Created:** 2026-07-22
**Updated:** 2026-07-22
**Linked Initiative:** [INIT-001 - Mobile Refresh](../initiatives/INIT-001-mobile-refresh.md)
**Supersedes:** [EFF-032 - First-time setup inventory camera compact fit](effort-032-setup-inventory-camera-compact-fit.md)
**Related docs:** [2026-07-22 production-readiness rerun](../docs/handoffs/2026-07-22-codex-production-readiness-rerun.md), [Phase 2.1 Setup Polish](../product-decisions/features/mobile-refresh/pd-phase-02-1-setup-polish.md), [PD-005 UI Governance](../product-decisions/pd-005-ui-governance.md), [design guidelines](../design_guidelines.md)

## One-line summary

Make first-time setup actions reachable across supported mobile viewport-height combinations with one generalized overflow and safe-area strategy, while preserving the production UI and avoiding device-specific breakpoints.

## Context

The 2026-07-22 production-readiness rerun reproduced a height-dependent setup trap on the exact release candidate. At app-reported `390x844`, first-time Pantry and optional Tools actions begin outside the viewport and no intended scroll owner has range. At `412x915`, the action rail is slightly clipped and expanded manual entry can move it farther out of reach. At `375x667`, `.setup-scroll-body` does have scroll range and normal interaction scrolls it.

This is therefore not an “older iPhone” defect. It is a general interaction between viewport height, browser chrome, safe-area insets, layout constraints, and the current overflow chain. Similar effective heights can occur on different phones, browsers, orientations, keyboards, and accessibility settings.

Wilson accepted this as a temporary known limitation for the current release. The current candidate is otherwise ready for production, while this correction changes structural layout behavior and could introduce broader setup regressions if rushed into the release. Implementation is intentionally scheduled as an immediate post-production patch.

## Scope

- Cover the first-time setup shell, especially Pantry and optional Tools where camera/import/manual content increases vertical demand.
- Make the layout height-independent through an intentional document or bounded-content scroll owner.
- Prefer `min-height` and dynamic viewport behavior over brittle fixed-height assumptions.
- Respect `env(safe-area-inset-bottom)` and mobile browser chrome changes.
- Reserve sufficient bottom clearance when actions remain sticky or fixed so content cannot hide underneath them.
- Preserve the current production typography, spacing, camera treatment, action order, tap targets, and overall visual composition unless a measured constraint requires the smallest possible adjustment.
- Add rendered geometry and normal-interaction coverage across representative viewport heights, orientation, keyboard, browser-chrome, and text-scaling conditions.

Out of scope:

- Redesigning onboarding, changing setup step order, changing durable navigation, or moving primary actions to new surfaces.
- Device-model-specific CSS or one-off breakpoints for named iPhones or Pixels.
- Camera permissions, capture providers, vision routes, upload policy, or scan-result behavior.
- Returning Settings action-dock behavior, which was resolved by EFF-033.
- EFF-034 timer wording or Settings blank-scroll cleanup.

## Decisions made so far

- Ship the current production candidate without this structural layout change.
- Treat the unreachable-action state as an accepted, bounded release exception rather than a hidden or forgotten defect.
- Implement one generalized viewport/overflow/safe-area correction immediately after production validation.
- Test layout constraints and effective viewport heights, not device names.
- Preserve the current UI; this is a reachability/resilience patch, not a design refresh.
- EFF-035 is the single active implementation home. EFF-032 remains historical evidence and is resolved as superseded, not as shipped.

## Open questions

- Should the whole setup document scroll naturally, or should `.setup-scroll-body` remain the single bounded scroll owner across every setup step?
- Which existing fixed height, flex minimum, or overflow rule creates the `390x844` no-scroll state?
- Which `100vh` fallback plus `100dvh` strategy behaves consistently in the supported Safari/Chrome range?
- How should keyboard-open and increased-text-size evidence be captured repeatably without encoding browser-specific test hacks?

## Agent checklist

- [ ] Start from fresh `origin/main` after production validation and confirm no open branch owns setup viewport structure.
- [ ] Read EFF-032 history, EFF-029, INIT-001, Phase 2.1, PD-005, `design_guidelines.md`, and the 2026-07-22 readiness report.
- [ ] Identify the complete height/flex/overflow chain for `.setup-ui`, `.setup-shell`, `.setup-phone-frame`, `.setup-scroll-body`, and `.setup-bottom-bar` before editing.
- [ ] Establish the intended scroll owner and measure client height, scroll height, scroll position, action bounds, dock clearance, and safe-area contribution.
- [ ] Preserve production before screenshots and capture equivalent after screenshots.
- [ ] Add automated rendered reachability checks that use normal scroll/click behavior rather than forced interaction.
- [ ] Run the matrix at `390x844`, `393x852`, `375x667`, `360x640`, `412x915`, and a short landscape height such as `844x390`.
- [ ] Include keyboard-open, browser-chrome expanded/collapsed, and increased-text-size checks where the validation tools can represent them faithfully.
- [ ] Run focused setup tests, full unit, check, build, exact-head E2E, and final-head mobile Replit validation appropriate to the structural risk.

## Resolution criteria

1. Every first-time setup primary action remains reachable through normal touch/scroll interaction across the accepted viewport matrix.
2. There is one deliberate scroll owner per setup composition; no action depends on overflow that is clipped or has zero range.
3. Sticky/fixed actions reserve content clearance including the safe-area inset and do not cover camera, upload, manual-entry, or list controls.
4. The current production visual design, setup state, camera-off behavior, upload/manual flow, action order, and tap targets do not regress.
5. No device-specific CSS or named-device breakpoint is introduced.
6. Exact-head automated gates and final-head mobile Replit evidence pass, with before/after screenshots and measured geometry linked from the implementation handoff.

## 2026-07-22 — Filed as the immediate post-production viewport patch

Wilson accepted the exact-candidate setup reachability finding as a release exception because the generalized fix changes structural layout behavior and could delay the release while introducing new risk. The candidate may ship first. EFF-035 is prioritized as the immediate post-production correction and replaces EFF-032 as the active implementation home without changing the UI design or targeting specific phone models.
