# LAICA Design Language Epic

**Agent:** codex
**Branch:** codex/mobile-refresh-phase-2-setup
**Date:** 2026-04-29

## Summary

Created a new active epic for LAICA's target design language and visual identity. This captures Wilson's clarification that design principles are not only UX mechanics or UI consistency rules; LAICA needs durable guidance for look, feel, colors, personality, imagery, typography, and mockup conformance.

## Changes

- `epics/012-laica-design-language.md`
  - New `In Progress` epic for LAICA Design Language & Visual Identity.
  - Distinguishes EPIC-012 from EPIC-001: EPIC-012 defines the target identity, EPIC-001 governs consistent implementation.
  - Marks Phase 2 setup as the first active pilot/correction point.
- `epics/README.md` and `epics/registry.md`
  - Added EPIC-012 to the active list and registry.
- `product-decisions/features/mobile-refresh/README.md`
  - Linked EPIC-012 from the mobile-refresh design principles.
- `product-decisions/features/mobile-refresh/phase-02-setup.md`
  - Added EPIC-012 as an explicit Phase 2 interaction.
- `AGENTS.md` and `CLAUDE.md`
  - Added EPIC-012 to the current active epic read list for future agent work.

## Impact on other agents

Before implementing or polishing Phase 2-5 mobile-refresh screens, agents should read EPIC-012 in addition to EPIC-001. PR #23's Phase 2 polish should now treat the setup screens as the first active pilot for LAICA's target design language.

## Open items

- Decide the final form of the durable design-language artifact: new product decision, revised `design_guidelines.md`, or both.
- Use Phase 2 setup polish to gather concrete decisions about typography, palette, camera framing, chip treatment, and branded setup chrome.

## Verification

Docs-only change. Verify with `git diff --check` and confirm no source, env, package, script, or schema files changed.
