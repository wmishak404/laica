# EFF-015 — UI Governance Enforcement (Lint + PR Template)

**Former ID:** EPIC-015
**Status:** Open
**Owner:** Wilson / Codex / Claude
**Created:** 2026-05-02

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

## Scope

### In scope

- **ESLint rule** rejecting `className` strings matching `/bg-\[#|text-\[#|border-\[#/`. Implemented via `eslint-plugin-tailwindcss` configuration or a small custom rule. Fails CI on offending callsites.
- **PR template** at `.github/PULL_REQUEST_TEMPLATE.md` citing PD-005 + design_guidelines.md, with checkboxes for:
  - PD-005 rule 3 — tone-override comment present where customizing primitives
  - PD-005 rule 5 — scoped-class reuse verified by rendered/computed-style comparison
  - Mockup conformance — for mobile-refresh phases per design_guidelines.md
- **PD-005 annotation** confirming enforcement is shipping (replacing the generic "file a narrow active Effort" follow-up note).

### Out of scope

- ESLint rules for PD-005 rules 2 (Button `className` overrides) and 4 (`rounded-[N]` arbitrary radii). Could become PD-005 amendments or follow-up Efforts if hex-literal enforcement reveals they remain a high-volume drift class.
- Slop Bowl hex-literal cleanup — tracked separately as [EFF-016](effort-016-slop-bowl-hex-literal-cleanup.md).
- Storybook, visual regression infrastructure.
- Mass codemod for the 23 custom-`Button` callsites (small enough to migrate by hand once a future rule breaks CI on them).
- Manual reviewer-only gate (paired with the lint rule, redundant).

## Agent checklist — when to read this Effort

Read EFF-015 before:

- Adding or modifying ESLint configuration in `eslint.config.*` / `.eslintrc.*`
- Adding or modifying `.github/PULL_REQUEST_TEMPLATE.md`
- Expanding UI governance enforcement to additional rules from PD-005
- Asking whether enforcement is "shipped" for PD-005 conformance purposes

When the work applies, the handoff and PR description must:

1. Cite this Effort.
2. State whether the change ships enforcement, expands it, or amends it.
3. Document any false-positive patterns observed and how they were handled (config exception, code change, or rule refinement).

## Resolution criteria

This Effort is `Resolved` when all of the following are true:

1. ESLint rule lands on `main` and fails CI on a deliberate `bg-[#hex]` test commit (verified before resolution).
2. `.github/PULL_REQUEST_TEMPLATE.md` cites PD-005 + design_guidelines.md and includes the rule-3 / rule-5 / mockup-conformance checkboxes.
3. PD-005 is annotated to confirm enforcement is shipping.
4. This Effort file has a final dated resolution note pointing at the merged PR(s).
