# EPIC-016 — Slop Bowl Hex Literal Cleanup

**Status:** Open
**Owner:** Wilson / Codex / Claude
**Created:** 2026-05-02

## One-line summary

Migrate Slop Bowl's six-plus `bg-[#FF6B6B]` / `hover:bg-[#FF5252]` callsites from raw hex literals to named tokens (`bg-primary`, `hover:bg-primary/90`) so [EPIC-015](015-ui-governance-enforcement.md)'s ESLint rule passes on existing code.

## Linked artifacts

- [PD-005 — UI Governance Operating Model](../product-decisions/005-ui-governance.md) — rule 1 (no hex literals when a token resolves to the same value)
- [EPIC-015](015-ui-governance-enforcement.md) — the lint rule that will fail CI on these callsites once it lands
- [EPIC-001 (resolved)](001-ui-governance.md) — original drift evidence; Slop Bowl was the canonical "tone-forward surface" test case

## Context

Slop Bowl was the original tone-forward pilot for EPIC-001. Its planning-choice card uses brand coral and accent shades via raw hex literals (`bg-[#FF6B6B]`, `hover:bg-[#FF5252]`, possibly `bg-[#FFB347]` / `bg-[#FFD93D]`) instead of named tokens (`bg-primary`, `hover:bg-primary/90`, `bg-accent`). Both forms render identically — the tokens resolve to the same hex values — but the literal form bypasses the token system PD-005 governs.

This is the highest-volume single-surface drift on `main`. Once EPIC-015's lint rule lands, these callsites fail CI. EPIC-016 migrates them ahead of (or alongside) the rule.

## Scope

### In scope

- Replace raw hex literals in the Slop Bowl screen and direct sub-components with named tokens. Likely callsites: the Slop Bowl card variant, hover/active states, tilt/gradient escape-hatch sections.
- Visual regression check (manual or screenshot diff) confirming the screen renders identically before and after — both forms resolve to the same hex, but a typo could regress.
- Where a tone-forward override remains intentional, add the `// design:tone-override — <reason>` comment per PD-005 rule 3.

### Out of scope

- Functional changes to Slop Bowl behavior, recipe generation, or pantry interaction.
- Design refresh of Slop Bowl visuals (current direction stays).
- Hex literals in other surfaces (would become their own epics or PD-005 amendments).
- Migrating the 23 custom-`Button` callsites measured in EPIC-001 (out of scope per EPIC-001's original deferral).

## Dependencies

EPIC-015 ideally ships first so the lint rule validates this cleanup. EPIC-016 *can* ship before EPIC-015 (cleanup is independently safe), but the recommended sequencing is gate-then-cleanup so the rule proves out on real migration. Either way, both are docs-light, code-light, and should not block other work.

## Agent checklist — when to read this epic

Read EPIC-016 before:

- Changing styling on Slop Bowl screens or its direct sub-components
- Migrating any tone-forward surface from hex literals to tokens (Slop Bowl is the pilot pattern)
- Adding new escape-hatch overrides on Slop Bowl that customize coral/accent shades

When the work applies, the handoff and PR description must:

1. Cite this epic.
2. Confirm visual parity (screenshot or manual comparison).
3. State whether any tone-forward overrides remain intentional with the PD-005 rule 3 comment.

## Resolution criteria

This epic is `Resolved` when all of the following are true:

1. All Slop Bowl `bg-[#hex]` / `hover:bg-[#hex]` / `text-[#hex]` / `border-[#hex]` callsites migrate to named tokens or carry the PD-005 rule 3 tone-override comment.
2. Visual comparison confirms no rendering regression.
3. EPIC-015's ESLint rule passes on Slop Bowl files (when EPIC-015 has shipped).
4. This epic file has a final dated resolution note pointing at the merged PR.
