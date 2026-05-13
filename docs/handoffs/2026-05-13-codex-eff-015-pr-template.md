# EFF-015 PR-template governance slice

**Agent:** codex
**Branch:** codex/eff-015-pr-template
**Date:** 2026-05-13
**Initiative:** INIT-001
**INIT updated:** yes — resume guidance now records Wilson's decision to reopen EFF-017 as a narrow Phase 4 harness pilot later.

## Summary

EFF-015 is now in progress with the smallest useful governance enforcement slice: a GitHub PR template that makes PD-005, `design_guidelines.md`, visible provenance checks, and validation-scope hygiene part of every review. This is reviewer-side enforcement only; the ESLint hex-literal gate remains the required follow-up before EFF-015 can resolve.

## Changes

- `.github/PULL_REQUEST_TEMPLATE.md` adds summary, UI-governance, validation, Replit-scope, negative-scope, and docs/handoff prompts.
- `efforts/effort-015-ui-governance-enforcement.md` moves to `In Progress`, records the PR-template slice, and clarifies that lint remains pending.
- `product-decisions/pd-005-ui-governance.md` now distinguishes the PR-template reviewer gate from the future ESLint gate.
- `efforts/README.md` and `efforts/registry.md` reflect EFF-015's `In Progress` status.
- `efforts/effort-017-environment-parity-and-ci-confidence.md`, `efforts/registry.md`, and `initiatives/INIT-001-mobile-refresh.md` record Wilson's separate decision to reopen EFF-017 as a narrow Phase 4 harness pilot later, without changing the current Replit validation gate now.

## Impact on other agents

Future PR descriptions should use the new template rather than free-form validation notes. For UI work, the template explicitly asks for PD-005/design-guidelines checks, rendered/computed-style comparison when reusing scoped classes, visible provenance confirmation, and exact validation-scope language.

EFF-017 remains `Deferred` for now, but its next implementation branch should reopen it as a Phase 4 harness pilot. That branch should not claim CI replaces Replit validation.

## Open items

- EFF-015 still needs the ESLint gate for token-equivalent `bg-[#...]`, `text-[#...]`, and `border-[#...]` className utilities.
- No lint false-positive patterns were exercised in this PR-template-only slice.
- Replit validation is not required for this docs/process-only change.

## Verification

- `git diff --check` passed.
- Targeted reference/status search passed for EFF-015 status, PR-template references, validation labels, and EFF-017 Phase 4 pilot wording.
