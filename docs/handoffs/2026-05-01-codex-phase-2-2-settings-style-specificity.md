# Phase 2.2 Returning Settings Style Specificity Fix

**Agent:** codex
**Branch:** codex/mobile-refresh-phase-2-2-settings-history
**Date:** 2026-05-01
**Initiative:** INIT-001
**INIT updated:** yes

## Summary

Wilson's Replit screenshot review caught that returning Settings reused first-time setup class names but did not preserve the accepted rendered output. The camera capture/video/help controls appeared as rounded squares, and `Upload photos` / `Enter manually` did not match first-time setup typography.

Root cause: first-time setup's accepted styles rely on `.setup-ui .setup-*` selector specificity to override Tailwind/shadcn Button utility classes. Returning Settings used `returning-setup-anchor`, so the shared class names were present but computed styles drifted.

## Changes

- `client/src/index.css`
  - Added `returning-setup-anchor` specificity to setup primary/secondary/ghost Button styles.
  - Added `returning-setup-anchor` specificity to setup camera round/icon button styles and SVG sizing.
  - Made `setup-action-title` declare the accepted setup `Nunito` / 800 action-label typography directly.
- `product-decisions/features/mobile-refresh/phase-02-2-returning-setup-settings.md`
  - Recorded the visual consistency correction, root cause, implementation direction, and added an acceptance criterion for computed camera/action controls.
- `product-decisions/features/mobile-refresh/design-language.md`
  - Added guidance that setup-derived controls must preserve rendered typography, shape, icon size, and state under new wrappers.
- `product-decisions/features/mobile-refresh/README.md`
  - Added the cross-phase principle that class-name reuse is not enough; computed output must match.
- `epics/001-ui-governance.md`
  - Added scoped visual-utility reuse to the agent checklist and recorded the computed-style drift failure mode.
- `epics/012-laica-design-language.md`
  - Added accepted-pattern reuse to the checklist and recorded the Replit evidence.
- `AGENTS.md` and `CLAUDE.md`
  - Extended the documentation foundation rule to include implementation guardrails for design consistency.
- `initiatives/INIT-001-mobile-refresh.md` and registries
  - Updated Phase 2.2 status/resume context.

## Impact on other agents

Future mobile-refresh work should not treat matching class names as visual conformance. When reusing a phase-scoped design pattern under a different root wrapper, verify computed styles or extract a shared component/style primitive that carries the specificity contract.

For Phase 2.2 Replit validation, specifically compare returning Settings Pantry/Kitchen controls against first-time setup:

- camera on/off and help buttons should be circular translucent controls
- capture should be the circular shutter button
- `Upload photos` and `Enter manually` should use the accepted setup action-label typography
- active/manual-open and disabled states should keep the setup hierarchy

## Open items

- Replit validation still needs to run at the latest branch head.
- Mobile visual review is still required against the Phase 2.2 storyboard and accepted first-time setup surface.

## Verification

- `npm run check`
- `npm run build`
- `git diff --check`

## Stack / base status

- Base refreshed: no
- Current base: origin/main at `6541e91e15b80030655d83ca4e9413fd0d2491e9`
- Last Replit-validated at: not yet validated
- Notes: Phase 2.2 branch remains stacked on the Phase 2.2 work already pushed to origin. Replit should fetch the latest branch head after this fix.
