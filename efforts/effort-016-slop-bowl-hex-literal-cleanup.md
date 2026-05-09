# EFFORT-016 — Slop Bowl Hex Literal Cleanup

**Former ID:** EPIC-016
**Status:** Resolved
**Owner:** Wilson / Codex / Claude
**Created:** 2026-05-02
**Updated:** 2026-05-09
**Resolved:** 2026-05-09

## One-line summary

Stop tracking Slop Bowl design cleanup separately now that INIT-001 owns the redesign pass.

## Linked artifacts

- [PD-005 — UI Governance Operating Model](../product-decisions/005-ui-governance.md) — rule 1 (no hex literals when a token resolves to the same value)
- [EFFORT-015](effort-015-ui-governance-enforcement.md) — the lint rule that will fail CI on these callsites once it lands
- [EFFORT-001 (resolved)](effort-001-ui-governance.md) — original drift evidence; Slop Bowl was the canonical "tone-forward surface" test case

## Context

Slop Bowl was the original tone-forward pilot for EFFORT-001. Its planning-choice card uses brand coral and accent shades via raw hex literals (`bg-[#FF6B6B]`, `hover:bg-[#FF5252]`, possibly `bg-[#FFB347]` / `bg-[#FFD93D]`) instead of named tokens (`bg-primary`, `hover:bg-primary/90`, `bg-accent`). Both forms render identically — the tokens resolve to the same hex values — but the literal form bypasses the token system PD-005 governs.

This is the highest-volume single-surface drift on `main`. Once EFFORT-015's lint rule lands, these callsites fail CI. EFFORT-016 migrates them ahead of (or alongside) the rule.

## Scope

### In scope

- Replace raw hex literals in the Slop Bowl screen and direct sub-components with named tokens. Likely callsites: the Slop Bowl card variant, hover/active states, tilt/gradient escape-hatch sections.
- Visual regression check (manual or screenshot diff) confirming the screen renders identically before and after — both forms resolve to the same hex, but a typo could regress.
- Where a tone-forward override remains intentional, add the `// design:tone-override — <reason>` comment per PD-005 rule 3.

### Out of scope

- Functional changes to Slop Bowl behavior, recipe generation, or pantry interaction.
- Design refresh of Slop Bowl visuals (current direction stays).
- Hex literals in other surfaces (would become their own Efforts or PD-005 amendments).
- Migrating the 23 custom-`Button` callsites measured in EFFORT-001 (out of scope per EFFORT-001's original deferral).

## Dependencies

EFFORT-015 ideally ships first so the lint rule validates this cleanup. EFFORT-016 *can* ship before EFFORT-015 (cleanup is independently safe), but the recommended sequencing is gate-then-cleanup so the rule proves out on real migration. Either way, both are docs-light, code-light, and should not block other work.

## Agent checklist — when to read this Effort

Read EFFORT-016 before:

- Changing styling on Slop Bowl screens or its direct sub-components
- Migrating any tone-forward surface from hex literals to tokens (Slop Bowl is the pilot pattern)
- Adding new escape-hatch overrides on Slop Bowl that customize coral/accent shades

When the work applies, the handoff and PR description must:

1. Cite this Effort.
2. Confirm visual parity (screenshot or manual comparison).
3. State whether any tone-forward overrides remain intentional with the PD-005 rule 3 comment.

## Resolution criteria

This Effort is `Resolved` when all of the following are true:

1. All Slop Bowl `bg-[#hex]` / `hover:bg-[#hex]` / `text-[#hex]` / `border-[#hex]` callsites migrate to named tokens or carry the PD-005 rule 3 tone-override comment.
2. Visual comparison confirms no rendering regression.
3. EFFORT-015's ESLint rule passes on Slop Bowl files (when EFFORT-015 has shipped).
4. This Effort file has a final dated resolution note pointing at the merged PR.

## 2026-05-05 — Phase 3 planning implementation signal

`codex/mobile-refresh-phase-3-planning` touches Slop Bowl as part of INIT-001 Phase 3. The branch removes direct `bg-[#hex]` / `hover:bg-[#hex]` / `border-[#hex]` callsites from `client/src/components/cooking/slop-bowl.tsx` and the Slop Bowl planning-entry card in `client/src/pages/app.tsx`, moving the refreshed tone-forward styling behind `planning-*` / `slop-check-*` CSS-variable classes and PD-005 tone-override comments.

This does not close EFFORT-016 yet. Resolution still needs visual comparison against the accepted Slop Bowl direction and the future EFFORT-015 lint gate signal once enforcement ships.

## 2026-05-05 — Planning-entry Slop Bowl art restored without hex drift

Wilson's Phase 3 Replit review found the Slop Bowl planning-entry card had become too vanilla and no longer carried the joke/slang identity. The follow-up keeps the styling under tokenized `planning-*` / `slop-*` classes, centers the `MAKE GOOD SLOP` sticker mechanically, adds a scoped handwritten label treatment, and restores a messier ingredient-storm bowl doodle.

This adds design evidence for Slop Bowl tone while preserving the EFFORT-016 cleanup direction: no new raw hex literals were added.

## 2026-05-09 - Effort status audit

Status changed from `Open` to `In Progress`. Slop Bowl's raw hex cleanup has effectively started: `client/src/components/cooking/slop-bowl.tsx` and the Planning entry now use scoped/tokenized styling and a PD-005 tone-override comment instead of the original raw `bg-[#hex]` / `hover:bg-[#hex]` drift. The Effort remains unresolved because visual comparison has not been recorded and EFFORT-015's lint/PR-template enforcement has not shipped.

## 2026-05-09 — Resolved

Wilson closed this standalone Effort because Slop Bowl design cleanup now belongs in INIT-001, especially Phase 3.1's redesign/facelift work. Any remaining token parity, visual comparison, or Slop Bowl copy/styling polish should be recorded in the active Mobile Refresh phase docs.

EFFORT-015 remains open for the separate enforcement layer: lint and PR-template governance for UI drift.
