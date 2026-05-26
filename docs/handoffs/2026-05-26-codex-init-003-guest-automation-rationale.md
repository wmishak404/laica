# INIT-003 guest automation rationale note

**Agent:** codex
**Branch:** codex/init-003-preauth-homepage
**Date:** 2026-05-26
**Initiative:** INIT-003
**INIT updated:** yes

## Summary

Wilson observed during Replit validation that the anonymous guest path makes browser testing smoother: automation can enter the app through a real Firebase anonymous session instead of depending on the Google provider popup. This is now recorded as a product/engineering benefit of the anonymous-entry decision, with the guardrail that linked-account behavior still needs explicit Replit validation.

## Changes

- `product-decisions/pd-012-public-anonymous-trial-and-account-upgrade.md`
  - Added anonymous guest auth as a first-party browser automation path for guest setup, recipe, and cooking-guide smoke tests.
  - Clarified that this benefit does not replace Google sign-in, linked-user upsert, history, cooking persistence, or upgrade-to-save validation.
- `initiatives/INIT-003-anonymous-trial-and-account-upgrade.md`
  - Added the 2026-05-26 decision-history note so future INIT-003 work sees the automation rationale.

## Verification

- Docs-only change; no runtime behavior changed.
- `git diff --check`

## Open items

- PR #102 still needs Replit validation at the final branch head before it can be marked ready or merged.
