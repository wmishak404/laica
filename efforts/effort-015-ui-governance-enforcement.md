# EFF-015 — UI Governance Enforcement (Lint + PR Template)

**Former ID:** EPIC-015
**Status:** In Progress
**Owner:** Wilson / Codex / Claude
**Created:** 2026-05-02
**Updated:** 2026-05-13

## One-line summary

Ship the enforcement layer PD-005 still lacks: an ESLint rule rejecting hex color literals in `className`, plus a PR-template gate citing PD-005 and `design_guidelines.md`.

## Linked artifacts

- [PD-005 — UI Governance Operating Model](../product-decisions/pd-005-ui-governance.md) — the rules this Effort enforces
- [`design_guidelines.md`](../design_guidelines.md) — the visual standard the PR template must cite
- [EFF-001 (resolved)](effort-001-ui-governance.md) — historical context; this Effort closes the resolution criterion EFF-001 explicitly deferred ("enforcement mechanism shipped on `main`")
- [EFF-016](effort-016-slop-bowl-hex-literal-cleanup.md) — companion pilot-surface cleanup so the new rule passes on existing code

## Context

PD-005 captures the rubric (5 required + 3 recommended rules, primitive lock order, surface taxonomy, scoped-style reuse contract) but ships without an enforcement mechanism. EFF-001's original resolution criterion 2 — "enforcement mechanism shipped on `main`" — was explicitly deferred from the graduation. This Effort closes that loop.

The highest-volume drift class is hex color literals: `bg-[#FF6B6B]`, `text-[#FF5252]`, `border-[#ccc]` used in place of `bg-primary` / `text-primary-foreground` / `border-border`. The token, primitive, and icon layers exist; nothing today stops a developer from typing the hex code instead of the token name. An ESLint rule catches this statically. PD-005 rules 3 (tone-override comment) and 5 (scoped-style reuse / computed-style comparison) cannot be lint-enforced cleanly — a PR-template gate captures them as a reviewer checklist.

EFF-013 added one more reviewer-enforced governance lesson: provenance/state-change cues are only useful when the rendered product surface makes the changed item perceptible. The PR-template gate should therefore ask reviewers to confirm visible provenance cues on the affected chips/cards/controls, not only that animation or CSS exists.

## Scope

### In scope

- **ESLint rule** rejecting `className` strings matching `/bg-\[#|text-\[#|border-\[#/`. Implemented via `eslint-plugin-tailwindcss` configuration or a small custom rule. Fails CI on offending callsites.
- **PR template** at `.github/PULL_REQUEST_TEMPLATE.md` citing PD-005 + design_guidelines.md, with checkboxes for:
  - PD-005 rule 3 — tone-override comment present where customizing primitives
  - PD-005 rule 5 — scoped-class reuse verified by rendered/computed-style comparison
  - Mockup conformance — for mobile-refresh phases per design_guidelines.md
  - EFF-013 / design-guidelines provenance lesson — user-noticeable state-change cues verified on the rendered surface
  - Validation hygiene — scoped vs full Replit validation, exact runtime-content SHA, and intentionally untested negative scope called out
- **PD-005 annotation** confirming enforcement is shipping (replacing the generic "file a narrow active Effort" follow-up note).

### Out of scope

- ESLint rules for PD-005 rules 2 (Button `className` overrides) and 4 (`rounded-[N]` arbitrary radii). Could become PD-005 amendments or follow-up Efforts if hex-literal enforcement reveals they remain a high-volume drift class.
- Slop Bowl hex-literal cleanup — tracked separately as [EFF-016](effort-016-slop-bowl-hex-literal-cleanup.md).
- Storybook, visual regression infrastructure.
- Mass codemod for the 23 custom-`Button` callsites (small enough to migrate by hand once a future rule breaks CI on them).
- Treating the PR-template gate as a replacement for the ESLint rule. The reviewer gate can ship first, but this Effort is not resolved until the lint gate also lands.
- Reopening EFF-017 or changing the current Replit validation gate. This Effort may improve validation notes, but environment parity and authenticated smoke automation remain separate work.

## Agent checklist — when to read this Effort

Read EFF-015 before:

- Adding or modifying ESLint configuration in `eslint.config.*` / `.eslintrc.*`
- Adding or modifying `.github/PULL_REQUEST_TEMPLATE.md`
- Expanding UI governance enforcement to additional rules from PD-005
- Asking whether enforcement is "shipped" for PD-005 conformance purposes

When the work applies, the handoff and PR description must:

1. Cite this Effort.
2. State whether the change ships enforcement, expands it, or amends it.
3. Document any false-positive patterns observed and how they were handled (config exception, code change, or rule refinement). For PR-template-only slices, say no lint false positives were exercised.

## Resolution criteria

This Effort is `Resolved` when all of the following are true:

1. ESLint rule lands on `main` and fails CI on a deliberate `bg-[#hex]` test commit (verified before resolution).
2. `.github/PULL_REQUEST_TEMPLATE.md` cites PD-005 + design_guidelines.md and includes the rule-3 / rule-5 / mockup-conformance checkboxes, plus the EFF-013 visible-provenance and validation-scope prompts.
3. PD-005 is annotated to confirm enforcement is shipping.
4. This Effort file has a final dated resolution note pointing at the merged PR(s).

## 2026-05-12 — Weekly hygiene audit

Reviewed against PD-005, `design_guidelines.md`, the repo's current lint setup, and PR-template state. Keep this as an active standalone Effort: there is no ESLint config or `.github/PULL_REQUEST_TEMPLATE.md` on `main` yet, and raw hex class literals still exist in client UI files. The durable rule lives in PD-005; this Effort still owns shipping the enforcement layer.

## 2026-05-13 — PR-template enforcement slice started

Status changed from `Open` to `In Progress`. Wilson accepted sequencing EFF-015 before the EFF-017 Phase 4 harness work, starting with the smallest mechanical governance slice: add `.github/PULL_REQUEST_TEMPLATE.md`, carry PD-005 / `design_guidelines.md` checks into every PR, and add the EFF-013 lessons about visible provenance, exact validation scope, and negative scope.

This did not resolve EFF-015 by itself. The ESLint gate for token-equivalent hex color utilities still needed to land and prove that CI fails on a deliberate `bg-[#hex]` test before the Effort could close.

## 2026-05-13 — ESLint enforcement implemented in PR #64

The EFF-015 branch now adds a local ESLint rule, `laica-ui/no-token-hex-classname`, wired into `npm run check` through `npm run lint:ui`. The rule walks `className` strings and common `cn`/array/object expression shapes, then rejects `bg-[#...]`, `text-[#...]`, and `border-[#...]` utilities so token-equivalent brand colors must use existing Tailwind tokens instead.

Existing governed callsites were migrated to tokens: primary coral to `primary`, culinary teal to `secondary`, charcoal to `sidebar`, and the Fusion badge to `accent`. The deliberate failure proof used a temporary `client/src/__eff015-lint-probe.tsx` containing `className="bg-[#FF6B6B]"`; `npm run lint:ui` failed with `laica-ui/no-token-hex-classname`, and the probe file was removed before the clean pass.

This branch is intended to satisfy the implementation side of EFF-015 once PR #64 merges. Keep the Effort `In Progress` until the PR lands on `main`, then perform the normal post-merge closeout: flip this file to `Resolved`, remove EFF-015 from the active read list, refresh the registry, and push a merge-closeout handoff.
