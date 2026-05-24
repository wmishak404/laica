# INIT-003 homepage carousel polish

**Agent:** codex
**Branch:** codex/init-003-preauth-homepage
**Date:** 2026-05-24
**Initiative:** INIT-003
**INIT updated:** yes

## Summary

Wilson tightened the public pre-auth homepage carousel after seeing the first packaged-cartoon pass in context. The accepted direction is still slightly-cartoony consumer-packaged imagery, but the scan image should show naturally placed ingredients without making the kitchen look chaotic. The carousel should also keep its UI truthful: the recipe slide may use landing-only spacing on top of the production planning-ticket primitive, while the guidance slide should communicate a future cooking-guide shape through app-rendered step, progress, checklist, and tip elements instead of numbered markers on a food image.

## Changes

- `attached_assets/landing-packaged-cartoon-kitchen-scan.jpg`
  - Replaced the too-messy kitchen scan image with a cleaner packaged ingredient cluster where the items are unevenly placed but still homepage-appropriate.
- `client/src/pages/landing.tsx`
  - Removed visible `1/3`, `2/3`, and `3/3` count labels from the slide headers; the progress dots remain.
  - Added a short recipe-slide explainer: `Picked from 17 ingredients in your kitchen. Laica highlights the ones this recipe uses.` The `17 ingredients` phrase is highlighted in coral to match the planning-page emphasis pattern.
  - Replaced the guidance slide's numbered/flame overlay with app-rendered cooking-guide elements: current step, progress bar, checklist, and tip.
  - Fixed dot-click scrolling to compute the target from bounding boxes so smooth scroll lands on the intended slide across mobile and desktop.
- `client/src/index.css`
  - Added landing-specific recipe-ticket spacing so the `30 min` and `Medium` meta chips do not feel jammed in the compressed carousel context.
  - Added responsive guidance-panel styling: stacked on narrow mobile, side-by-side image plus panel on wider viewports.
- `product-decisions/pd-012-public-anonymous-trial-and-account-upgrade.md`
  - Recorded the accepted scan-image guardrail: natural ingredient placement, clean background, app-rendered UI carries the organization story.
  - Recorded the live-guidance proof guardrail: checklist/tip/progress panel beats numbered food-photo overlays until Phase 4 settles the real guide.
- `initiatives/INIT-003-anonymous-trial-and-account-upgrade.md`
  - Updated assets and decision history with the carousel refinement.

## Verification

- `git diff --check`
- `npm run check`
- `npm run build`
- Static visual smoke using `vite preview` plus headless Chrome screenshots at 390x844 and 1365x768. Because the static build needs Vite Firebase client config to render, the visual smoke used harmless dummy `VITE_FIREBASE_*` values only for screenshot generation; runtime/auth validation remains Replit-only.

## Open items

- Replit validation is still required before PR #102 can be marked ready or merged.
- This pass does not validate anonymous auth, Google auth, linked-user cooking/history, quota behavior, or durable save boundaries.
- Full Phase 4 cooking guide UI remains future INIT-001/INIT-003 coordination work; this carousel only previews the intended guidance concept.

## Stack / base status

- Base refreshed: not in this polish pass; branch was continued from the active PR #102 head.
- Last Replit-validated at: not yet validated after these visual changes.
- Notes: any push from this pass makes previous Replit observations stale until Replit fetches the new PR head.
