# EFF-035: Universal setup viewport resilience

**Status:** In Progress
**Priority:** P1 — reopened by Wilson-supplied production feedback
**Owner:** Wilson / Codex / Claude
**Created:** 2026-07-22
**Updated:** 2026-07-29
**Linked Initiative:** [INIT-001 - Mobile Refresh](../initiatives/INIT-001-mobile-refresh.md)
**Supersedes:** [EFF-032 - First-time setup inventory camera compact fit](effort-032-setup-inventory-camera-compact-fit.md)
**Related docs:** [post-publish production regression](../docs/handoffs/2026-07-22-codex-post-publish-production-regression.md), [Phase 2.1 Setup Polish](../product-decisions/features/mobile-refresh/pd-phase-02-1-setup-polish.md), [PD-005 UI Governance](../product-decisions/pd-005-ui-governance.md), [design guidelines](../design_guidelines.md)

## One-line summary

Make first-time setup actions reachable across supported viewport widths and heights with one generalized overflow and safe-area strategy, while preserving the production UI and avoiding device-specific breakpoints.

## Context

The pre-publish release-candidate rerun and fresh production custom-domain regression reproduced a height-dependent setup trap. At `390x844`, first-time Pantry and optional Tools actions begin outside the viewport and no intended scroll owner has range. At `412x915`, the Pantry rail remains slightly clipped. At `375x667`, `.setup-scroll-body` does have substantial scroll range. Different effective heights can arise from phones, browsers, orientations, keyboards, accessibility settings, and browser chrome; this is not an “older iPhone” defect.

Wilson accepted the current behavior as a bounded release exception so the structural layout change would not be rushed into the publish. After deployment and post-publish testing, Wilson reprioritized EFF-035 on 2026-07-28: preserve the current production viewport behavior and stop assigning proactive viewport work until Wilson supplies user feedback that the experience is unsatisfactory or new production evidence materially changes the risk.

Production evidence: [`Pantry 390x844`](../docs/assets/production-regression/2026-07-22/production-eff035-pantry-unreachable-390x844.jpg), [`Tools 390x844`](../docs/assets/production-regression/2026-07-22/production-eff035-tools-unreachable-390x844.jpg), and [`Pantry 412x915`](../docs/assets/production-regression/2026-07-22/production-eff035-pantry-412x915.jpg).

Wilson supplied the documented reopen trigger on 2026-07-29: production desktop screenshots showed first-time Pantry content extending below the visible window with no scroll response, requiring the browser window to be expanded to reach the lower controls. This is the same setup-shell defect at a wider breakpoint, not a separate desktop-only bug.

## Scope

- Cover the first-time setup shell, especially Pantry and optional Tools.
- Cover constrained desktop heights as well as representative mobile portrait, mobile landscape, browser-chrome, and keyboard-open heights.
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
- Keep `.setup-scroll-body` as the one bounded setup content scroll owner at every viewport width while the outer document/root remains locked. The fixed-height frame contract must not live only inside a narrow-device media query.

## Open questions

- Does the `100vh` fallback plus `100dvh` strategy behave consistently across supported physical Safari and Chrome after the structural fix?
- How should keyboard-open and increased-text-size evidence be captured repeatably?

## Agent checklist

- [x] Start from fresh `origin/main` and confirm no open branch owns setup viewport structure.
- [x] Read EFF-032 history, EFF-029, INIT-001, Phase 2.1, PD-005, `design_guidelines.md`, and the post-publish regression.
- [x] Identify the full height/flex/overflow chain before editing.
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

## 2026-07-28 — Deprioritization merged

PR #344 merged as `31a4806bf8ce04942f99b402fa4745dfda0be14b` from final head `1938f44c62084abc79486a8c312f35e69c900d22`, based on the merged gate remediation at `6272b5d68de9269bf9f2fe85e6f90160ce595df4`. Exact-head dependency audit, secret scan, unit/typecheck/build, `db:health`, all nine Playwright tests, and disposable-branch cleanup passed before merge.

EFF-035 remains `Deferred`. The active INIT triage automation carries the non-viewport selection rule; the matching Efforts-hygiene automation change remains a protected-setting suggestion for Wilson to review. Neither automation is authoritative over this Effort header and INIT-001.

## 2026-07-29 — Reopened by desktop production feedback

Wilson reported that the deployed first-time Pantry setup screen could not scroll at desktop width and required expanding the browser window to reach the lower content. The supplied screenshots show the tall `4 / 5` camera and subsequent actions extending below the visible viewport while Back/Next remain outside the reachable region.

Investigation on production and current `origin/main` separated the paths:

- Production Planning used normal document sizing and fit the constrained desktop viewport.
- Production Settings hub used working document scrolling.
- Production Kitchen Inventory used a working `.returning-inventory-scroll` inner scrollport; a wheel interaction moved it from `0` to approximately `491px`.
- First-time setup uniquely locked `html`, `body`, and `#root`, but its fixed-height `.setup-ui` / `.setup-shell` / `.setup-phone-frame` contract existed only under `@media (max-width: 480px) and (max-height: 790px)`. At wider widths, or mobile heights above `790px`, `.setup-scroll-body` expanded to content height and had no scroll range while the outer page remained locked.

Branch `codex/desktop-setup-scroll` moves the frame-height/flex/overflow contract into the base setup rules and leaves only compact visual adjustments in the narrow/short media query. It adds a CSS structural guard and a Playwright regression case at `1024x600`. A rendered local fixture at `1024x600` visibly exposed the setup scrollbar, accepted normal wheel scrolling from the camera to Upload/Manual/entry controls, and kept Back/Next fixed within the viewport.

Validation completed so far: focused setup Vitest (22 tests), `npm run check`, `npm run build`, and `git diff --check` passed. The build retained existing stale Browserslist, Firebase mixed-import, and bundle-size warnings. The configured disposable local E2E database variables were missing, and the default local database returned an auth-session 500, so local end-to-end execution is not claimed. Exact-head GitHub E2E plus focused final-head mobile/desktop browser validation remain required before merge.
