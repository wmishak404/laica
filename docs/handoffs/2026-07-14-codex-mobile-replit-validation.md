# Mobile-first Replit Chrome validation

**Agent:** codex
**Branch:** codex/mobile-replit-validation-docs
**Date:** 2026-07-14
**Initiative:** none
**INIT updated:** n/a
**Resolves blocked handoff:** none

## Summary

Wilson asked that Replit validation through Chrome reflect LAICA's mobile-first user base. This docs-only update makes Chrome mobile viewport / device toolbar the default for Replit app UI visits, and turns mobile nav, back-button, sticky CTA, scroll-fit, and visual layout checks into explicit evidence requirements instead of ad hoc screenshot review.

## Changes

- `AGENTS.md`
  - Adds the mobile-first Chrome/Replit validation rule to the shared Codex entrypoint.
- `CLAUDE.md`
  - Mirrors the rule in Claude's read-first workflow list.
- `docs/workflows/testing-and-acceptance.md`
  - Adds the evidence standard for mobile-first Replit Chrome validation and requires viewport/device reporting in handoffs and PRs.
- `docs/workflows/replit-validation-focus.md`
  - Adds the concrete mobile Chrome rule, Replit workspace validation step, matrix row, and request-template fields for mobile visual/nav/back-button validation.

## Impact on other agents

Future Replit Chrome UI validation should start from the active Replit URL in mobile view and record the viewport or device preset. Desktop validation remains available, but it should be named as an additional lane or explicitly scoped out when not relevant.

Do not hardcode the current `replit.dev` preview URL into durable docs as a permanent target; use the active Replit validation URL Wilson provides for the task.

## Open items

None.

## Verification

- Docs-only workflow update.
- Replit validation is not required for this branch because it changes testing methodology only.
- `git diff --check -- AGENTS.md CLAUDE.md docs/workflows/testing-and-acceptance.md docs/workflows/replit-validation-focus.md docs/handoffs/2026-07-14-codex-mobile-replit-validation.md` passed.
