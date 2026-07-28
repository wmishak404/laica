# EFF-035: Universal mobile viewport resilience for first-time setup

**Status:** Deferred
**Priority:** Deferred — do not assign proactively; reopen only from Wilson-supplied user feedback or new production regression evidence
**Owner:** Wilson / Codex / Claude
**Created:** 2026-07-22
**Updated:** 2026-07-28
**Linked Initiative:** [INIT-001 - Mobile Refresh](../initiatives/INIT-001-mobile-refresh.md)
**Supersedes:** [EFF-032 - First-time setup inventory camera compact fit](effort-032-setup-inventory-camera-compact-fit.md)
**Related docs:** [post-publish production regression](../docs/handoffs/2026-07-22-codex-post-publish-production-regression.md), [Phase 2.1 Setup Polish](../product-decisions/features/mobile-refresh/pd-phase-02-1-setup-polish.md), [PD-005 UI Governance](../product-decisions/pd-005-ui-governance.md), [design guidelines](../design_guidelines.md)

## One-line summary

Make first-time setup actions reachable across supported mobile viewport-height combinations with one generalized overflow and safe-area strategy, while preserving the production UI and avoiding device-specific breakpoints.

## Context

The pre-publish release-candidate rerun and fresh production custom-domain regression reproduced a height-dependent setup trap. At `390x844`, first-time Pantry and optional Tools actions begin outside the viewport and no intended scroll owner has range. At `412x915`, the Pantry rail remains slightly clipped. At `375x667`, `.setup-scroll-body` does have substantial scroll range. Different effective heights can arise from phones, browsers, orientations, keyboards, accessibility settings, and browser chrome; this is not an “older iPhone” defect.

Wilson accepted the current behavior as a bounded release exception so the structural layout change would not be rushed into the publish. After deployment and post-publish testing, Wilson reprioritized EFF-035 on 2026-07-28: preserve the current production viewport behavior and stop assigning proactive viewport work until Wilson supplies user feedback that the experience is unsatisfactory or new production evidence materially changes the risk.

Production evidence: [`Pantry 390x844`](../docs/assets/production-regression/2026-07-22/production-eff035-pantry-unreachable-390x844.jpg), [`Tools 390x844`](../docs/assets/production-regression/2026-07-22/production-eff035-tools-unreachable-390x844.jpg), and [`Pantry 412x915`](../docs/assets/production-regression/2026-07-22/production-eff035-pantry-412x915.jpg).

## Scope

- Cover the first-time setup shell, especially Pantry and optional Tools.
- Establish one deliberate document or bounded-content scroll owner.
- Prefer `min-height`, dynamic viewport units, and evidence-backed flex constraints over fixed-height assumptions.
- Respect safe-area insets, browser-chrome changes, keyboard focus, orientation, and increased text size.
- Reserve content clearance when actions remain sticky or fixed.
- Preserve production typography, camera treatment, action order, tap targets, and visual composition unless a measured constraint requires the smallest adjustment.
- Add rendered geometry and normal-interaction coverage across representative effective heights.

Out of scope:

- Onboarding redesign, step-order changes, durable navigation changes, device-specific CSS, camera/provider behavior, scan policy, returning Settings dock behavior, or EFF-034.

## Decisions made so far

- The production release shipped with this accepted exception.
- Preserve the generalized viewport/overflow/safe-area correction as documented future scope, but do not implement it proactively while the Effort is deferred.
- Test layout constraints and effective viewport heights, not device names.
- Preserve the current UI; this is a reachability patch, not a design refresh.
- EFF-032 remains historical evidence and is resolved as superseded, not implemented.
- The pause affects viewport work selection, not LAICA's mobile-first validation discipline: unrelated UI changes should still use the representative mobile checks required by the testing workflow.

## Open questions

- Should the whole setup document scroll, or should `.setup-scroll-body` remain the only bounded scroll owner?
- Which fixed height, flex minimum, or overflow rule creates the `390x844` zero-range state?
- Which `100vh` fallback plus `100dvh` strategy behaves consistently across supported Safari and Chrome?
- How should keyboard-open and increased-text-size evidence be captured repeatably?

## Agent checklist

- [ ] Start from fresh `origin/main` and confirm no open branch owns setup viewport structure.
- [ ] Read EFF-032 history, EFF-029, INIT-001, Phase 2.1, PD-005, `design_guidelines.md`, and the post-publish regression.
- [ ] Identify the full height/flex/overflow chain before editing.
- [ ] Measure client height, scroll height, scroll position, action bounds, dock clearance, and safe-area contribution.
- [ ] Add normal-interaction reachability coverage at `390x844`, `393x852`, `375x667`, `360x640`, `412x915`, and a short landscape height.
- [ ] Include keyboard, browser-chrome, orientation, and text-scaling checks where tools can represent them faithfully.
- [ ] Run focused setup tests, full unit, check, build, exact-head E2E, and final-head mobile Replit validation.

## Resolution criteria

1. Every setup primary action is reachable through normal touch/scroll interaction across the accepted matrix.
2. Each setup composition has one deliberate scroll owner; no action depends on clipped zero-range overflow.
3. Sticky/fixed actions reserve safe-area-aware content clearance.
4. Production visual design, camera-off behavior, upload/manual flow, action order, state, and tap targets do not regress.
5. No named-device breakpoint is introduced.
6. Exact-head gates and final-head mobile evidence pass with before/after screenshots and measured geometry.

## 2026-07-22 — Fresh production confirmation

The custom-domain regression reproduced the same geometry on the published build. At `390x844`, Pantry and Tools Back/Next rails began at approximately `845.78px`; `documentElement` and `.setup-scroll-body` both had zero range. At `412x915`, Pantry actions ended near `921.28px`, about six pixels beyond the viewport. At `375x667`, expanded manual entry produced real bounded scrolling. The release-exception decision remains accepted, and EFF-035 is now backed by production rather than preview-only evidence.

## 2026-07-28 — Deferred after deployment and testing

Wilson directed agents to stop selecting viewport work for new Effort or INIT assignments and to move to other pipeline work. EFF-035 is therefore `Deferred`, not resolved: the production findings above remain valid historical evidence, but they no longer justify proactive implementation on their own. Reopen only when Wilson supplies user feedback that the current viewport experience is unsatisfactory or new production regression evidence materially changes the accepted risk. Existing mobile-first validation requirements remain in force for unrelated UI work.
