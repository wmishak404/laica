# Request: push hybrid UI consistency plan to origin for Claude review

**Agent:** claude
**Branch:** claude/slop-bowl-ui
**Date:** 2026-04-16

## Summary

Wilson mentioned Codex is drafting a "hybrid UI consistency system" — a concise style rubric + code-level enforcement — and asked Claude to pressure-test the plan. I checked `origin` and every Codex worktree I can see on this machine (`codex/slop-bowl-api`, `codex/slop-bowl-doc-review`, `codex/local-agent-setup`, `codex/default-config`); none of them contain the plan. Per AGENTS.md, "An unpushed handoff is the same as no handoff" — so the plan is effectively invisible to me right now.

**Asking Codex to push a WIP branch (or a draft doc on an existing branch) so I can read and react before `claude/slop-bowl-ui` lands on `main`.** This is time-sensitive because my Slop Bowl UI introduces new component patterns that may need to conform to the new system.

## Changes

None in this handoff — it's a request, not a completion.

## Impact on other agents — what Codex needs to know

**Context on `claude/slop-bowl-ui`** (HEAD `9c92f3e`, ready for integration test against `codex/slop-bowl-api`):

- Planning-choice screen introduces **two new card styles** — one playful (tilted, gradient, falling-ingredient animation, rotating sticker), one standard. Details in `product-decisions/features/slop-bowl/phase-04-implementation-polish.md`.
- Primitives used: shadcn/ui `Card`, `CardContent`, `Button` (variants: default + outline). No custom primitives introduced.
- Custom tokens in use: hardcoded `#FF6B6B` coral accent (appears ~6 times in `app.tsx` + `slop-bowl.tsx`), custom Tailwind gradient classes, custom keyframes in `client/src/index.css` (`slop-ingredient-fall`, `slop-wobble`).
- Typography: `text-lg` / `text-xs` for card titles and taglines. Emoji-as-iconography (`🥣`, `👨‍🍳`, `👩‍🍳`) instead of lucide icons where the tone warranted it.

**If the plan's Phase 1 targets `Button` / `Input` / `Card` / page headers** as the first primitives to lock, my Slop Bowl PR will almost certainly need a reconciliation pass before merge. I'd rather do that once, with the rubric in hand, than refactor twice.

## Pressure-test angles Claude will apply once the plan is visible

Per Codex's own suggested review prompt:

1. Is `hybrid system + pilot then expand` the right level of rigor for a repo this size?
2. Which primitives should be locked **first** — Button, Input, Card, page headers/sections, or something else?
3. What exceptions should the rubric allow so feature teams aren't blocked by edge cases?
4. Should phase 1 include visual regression coverage, or is that too heavy for now?
5. Current typography/token mismatches — fix immediately in the pilot, or separate cleanup track?
6. What should the PR rubric **require** vs merely **recommend**?

Plus Claude's own additions:

7. How does the plan interact with `shadcn/ui` being the current primitive source of truth? Does the rubric re-wrap shadcn components, layer tokens on top, or swap them out?
8. How does the rubric handle intentionally-playful surfaces (e.g. the Slop Bowl card's tilt/gradient/animation)? Is there an explicit "escape hatch" for tone-carrying features, or does everything conform?
9. Enforcement mechanism — lint rules, codemod, CI check, PR checklist, or some combination? Each has a very different cost profile.
10. Rollout: does `main` need to be conformant before feature branches can merge, or can in-flight branches land first and conform during/after?

## Open items

- **Codex**: push the WIP plan to `origin` — any branch name works, even `codex/ui-consistency-draft`. Ideal location for the doc: `product-decisions/PD-005-ui-consistency.md` (following the `PD-xxx` convention established in `product-decisions/README.md`) or `product-decisions/features/ui-system/phase-01-plan.md` if it's multi-phase.
- **Wilson**: once Codex pushes, tag me to review. I'll open a follow-up handoff with concrete edit suggestions rather than general agreement/disagreement.
- **Slop Bowl PR**: holding on final PR-to-`main` until I've at least read the plan — don't want to merge a feature that'll need immediate refactor.

## Verification

N/A — this is a coordination request. Verification happens once the plan is on `origin` and I write the review handoff.
