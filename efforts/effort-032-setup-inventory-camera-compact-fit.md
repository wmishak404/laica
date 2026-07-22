# EFF-032: First-time setup inventory camera compact fit

**Status:** Resolved
**Priority:** Historical evidence; superseded by EFF-035, not implemented
**Owner:** Wilson / Codex / Claude
**Created:** 2026-07-20
**Updated:** 2026-07-22
**Linked Initiative:** [INIT-001 - Mobile Refresh](../initiatives/INIT-001-mobile-refresh.md)
**Linked Effort history:** [EFF-029 - Setup/Settings camera height and action clearance](effort-029-settings-camera-action-clearance.md)
**Related docs:** [Phase 2.1 Setup Polish](../product-decisions/features/mobile-refresh/pd-phase-02-1-setup-polish.md), [PD-005 UI Governance](../product-decisions/pd-005-ui-governance.md), [design guidelines](../design_guidelines.md), [production-readiness follow-up](../docs/handoffs/2026-07-20-codex-production-readiness-effort-routing.md)

## One-line summary

Reduce first-time Pantry/Tools camera vertical demand on compact phone viewports while preserving the camera-first design and proving which setup container should scroll on real mobile browsers.

## Context

PR #295 / EFF-029 intentionally made first-time setup and returning Settings Pantry/Tools camera frames strict `4 / 5`. The 2026-07-17 production-readiness pass then found that the taller first-time setup composition could put Back/Next below the initial `390x844` or `412x915` view.

Wilson reviewed that finding on 2026-07-20 and made two corrections:

- This affects a subset of phone/browser viewport combinations and should be treated as an inconvenience, not a large production blocker by itself.
- His device can scroll to the lower controls, so implementation must not assume the page is universally unscrollable or fix the wrong container.

Codex rechecked the intended setup scroller in the controlled Replit preview at app-reported `390x844`. `.setup-scroll-body` reported `clientHeight: 730`, `scrollHeight: 730`, and `scrollTop: 0`; Next measured `845.78px` to `893.78px`; a touch-like scroll left both the setup scroller and window at zero. This is real evidence for that controlled browser, but it conflicts with Wilson's direct-device observation. Treat the discrepancy as browser/visual-viewport-dependent until Safari/Chrome comparison identifies the actual scroll owner and available-height calculation.

![First-time Pantry initial view at 390x844](../docs/assets/mobile-refresh/2026-07-20-codex-setup-pantry-first-view-390x844.jpg)

## Scope

- Target first-time setup Pantry and optional Tools on compact mobile browser viewports.
- Reduce camera/window vertical demand enough that upload/manual actions and the Back/Next rail are easier to discover on first view.
- Preserve camera-off message hierarchy, camera controls, tap targets, camera-first visual intent, and Pantry/Tools parity.
- Inspect the real flex/height/overflow chain before implementation: `.setup-ui`, `.setup-shell`, `.setup-phone-frame`, `.setup-scroll-body`, and `.setup-bottom-bar`.
- Verify touch scrolling on real or representative mobile Safari and mobile Chrome/Replit, including browser-chrome and visual-viewport changes.
- Use viewport-height-responsive sizing only if evidence supports it; do not blindly replace the accepted camera proportion across every phone.
- Capture before/after screenshots at the exact tested viewports and keep them in `docs/assets/mobile-refresh/`.

Out of scope:

- Returning Settings action-dock placement or opacity; [EFF-033](effort-033-returning-settings-inventory-action-dock.md) owns that work.
- Bottom-nav IA, setup step order, scan providers, camera permissions, upload limits, schema, routes, or prompts.
- Reopening the already-resolved PR #291 tap-offset problem without new evidence that hit-test drift has returned.

## Decisions made so far

- Wilson does not classify this compact-phone first-view fit issue as a large production blocker.
- Keep it as a standalone follow-up because first-time setup Phase 2.1 is closed and the remaining fit discrepancy needs cross-browser evidence rather than being forced into active Phase 4.
- Reduce vertical camera demand instead of assuming all phones need the strict current height.
- Resolve the disagreement about scrolling empirically: record the tested browser, app-reported visual viewport, actual scrollable element, scroll range, and screenshots.

## Open questions

- Which real-device/browser combinations reproduce the controlled `390x844` no-scroll state, and which allow `.setup-scroll-body` or another container to scroll?
- Should the camera height use a `clamp()`/viewport-height cap, a short-height breakpoint, or content-aware flex sizing while retaining `4 / 5` on roomier screens?
- What is the smallest first-view content set that must remain visible without scrolling: camera, upload/manual actions, or the Back/Next rail?

## Agent checklist

- [ ] Start from fresh `origin/main` and confirm no open branch owns setup camera sizing.
- [ ] Read EFF-029, INIT-001, Phase 2.1, PD-005, `design_guidelines.md`, and the 2026-07-20 readiness follow-up.
- [ ] Reproduce at `375x667`, `390x744`, `390x844`, and `412x915`, recording browser/device and visual viewport.
- [ ] Identify the actual scroll owner and measure `clientHeight`, `scrollHeight`, `scrollTop`, action bounds, and safe-area/browser-chrome effects.
- [ ] Preserve screenshot evidence before and after the implementation.
- [ ] Add rendered geometry/scroll coverage that fails when the action rail is unreachable and no intended scroller has range.
- [ ] Run focused setup tests, full unit, check, build, exact-head E2E, and mobile Replit validation appropriate to the final change.

## Resolution criteria

1. Pantry and Tools camera layouts use less vertical space on evidence-backed compact-phone conditions without making roomier phone layouts feel squat.
2. Users can reach upload/manual and Back/Next through normal touch interaction on the tested mobile Safari and Chrome/Replit viewports.
3. The implementation and tests identify the intended scroll owner rather than relying only on window scrolling.
4. Camera controls, camera-off copy, upload/manual behavior, setup state, and tap targets do not regress.
5. Before/after screenshots and measured geometry are committed and linked from the implementation handoff.

## 2026-07-20 - Effort filed from production-readiness review

Wilson downgraded the first-time setup finding from a large blocker to a compact-phone inconvenience and requested a linked Effort to reduce the camera's vertical dimensions. The controlled-browser no-scroll evidence is preserved as one reproduction, while Wilson's successful device scrolling is equally preserved so implementation begins by identifying the correct browser-specific scroll behavior.

## 2026-07-22 - Superseded by generalized viewport-resilience scope

The release-candidate rerun and post-publish production regression proved the reachability problem is not a camera-size issue tied to one phone class. At `390x844`, Pantry and Tools actions begin below a locked viewport with no intended scroll range; at `412x915`, the Pantry rail is still clipped; at `375x667`, the bounded body gains real overflow. EFF-035 now owns one generalized overflow, dynamic-viewport, keyboard, and safe-area correction. EFF-032 is resolved as superseded historical evidence, not as shipped behavior.
