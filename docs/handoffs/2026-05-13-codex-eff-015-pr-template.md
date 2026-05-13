# EFF-015 governance enforcement

**Agent:** codex
**Branch:** codex/eff-015-pr-template
**Date:** 2026-05-13
**Initiative:** INIT-001
**INIT updated:** yes — resume guidance now records Wilson's decision to reopen EFF-017 as a narrow Phase 4 harness pilot later.

## Summary

EFF-015 now has both halves of the enforcement layer in PR #64: a GitHub PR template that makes PD-005, `design_guidelines.md`, visible provenance checks, and validation-scope hygiene part of every review, plus an ESLint gate wired into `npm run check` that rejects token-equivalent `bg-[#...]`, `text-[#...]`, and `border-[#...]` className utilities. The Effort should stay `In Progress` until PR #64 merges, then receive the standard post-merge closeout.

## Changes

- `.github/PULL_REQUEST_TEMPLATE.md` adds summary, UI-governance, validation, Replit-scope, negative-scope, and docs/handoff prompts.
- `eslint.config.js` adds the local `laica-ui/no-token-hex-classname` rule for client `className` expressions.
- `package.json` and `package-lock.json` add ESLint dependencies, `npm run lint:ui`, and wire lint into `npm run check`.
- Existing governed raw-hex className callsites migrate to `primary`, `secondary`, `sidebar`, or `accent` tokens.
- `efforts/effort-015-ui-governance-enforcement.md` moves to `In Progress`, records the PR-template slice, records the lint implementation, and leaves resolution pending merge.
- `product-decisions/pd-005-ui-governance.md` now points at PR #64 as the enforcement PR pending merge/closeout.
- `efforts/README.md` and `efforts/registry.md` reflect EFF-015's `In Progress` status.
- `efforts/effort-017-environment-parity-and-ci-confidence.md`, `efforts/registry.md`, and `initiatives/INIT-001-mobile-refresh.md` record Wilson's separate decision to reopen EFF-017 as a narrow Phase 4 harness pilot later, without changing the current Replit validation gate now.

## Impact on other agents

Future PR descriptions should use the new template rather than free-form validation notes. For UI work, the template explicitly asks for PD-005/design-guidelines checks, rendered/computed-style comparison when reusing scoped classes, visible provenance confirmation, and exact validation-scope language.

New client UI code should use tokens such as `bg-primary`, `text-secondary`, `border-primary`, or CSS classes backed by tokens instead of Tailwind arbitrary hex color utilities in `className`. SVG fills, chart-library attribute selectors, CSS token comments, and non-`className` literals are intentionally outside this first lint gate.

EFF-017 remains `Deferred` for now, but its next implementation branch should reopen it as a Phase 4 harness pilot. That branch should not claim CI replaces Replit validation.

## Open items

- PR #64 needs merge before EFF-015 can be marked `Resolved`.
- After merge, do a fresh-main closeout: mark EFF-015 resolved, remove it from `efforts/README.md`, update `efforts/registry.md`, and push a merge-closeout handoff.
- Replit validation is not required for this static governance/tooling change; no auth, DB, AI, ElevenLabs, vision, or service-backed runtime behavior changed.

## Verification

- `npm run lint:ui` failed as expected with a temporary `client/src/__eff015-lint-probe.tsx` containing `className="bg-[#FF6B6B]"`.
- Removed the temporary probe file.
- `npm run lint:ui` passed after token migrations.
- `npm run check` passed.
- `npm run build` passed with existing Vite warnings about stale Browserslist data, Firebase dynamic/static import chunking, and large chunk size.
- `git diff --check` passed.
- `rg` confirmed no remaining `bg-[#hex]`, `text-[#hex]`, or `border-[#hex]` utilities under `client/src`.
- Targeted reference/status search passed for EFF-015 status, PR-template references, validation labels, and EFF-017 Phase 4 pilot wording.
