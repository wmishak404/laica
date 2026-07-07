# Live Cooking Step Preview Eval Brief

**Agent:** codex
**Date:** 2026-07-07
**Source initiative:** INIT-001 Phase 4
**Target initiative:** INIT-004
**Source branch:** `codex/init-001-phase4-step-coach`
**Coordination status:** parallel follow-up recommended

## Summary

Wilson's Phase 4 Replit QA surfaced repeated Live Cooking step-preview/action-label failures. These labels are part of the hands-busy cooking experience, but they should not be folded directly into the existing recipe-generation evals or broad `cooking_steps` safety/sequence checks. A future INIT-004 branch should create a distinct, auditable eval lane for the rendered step-preview/headline artifact, then coordinate findings back to the INIT-001 Phase 4 thread or successor PR.

## Provenance

Source examples came from Wilson's 2026-07-07 Live Cooking QA screenshots and comments while reviewing PR #260:

- `Bring 4 Cups` was confusing for a boiling-water step; accepted direction: `Boil Water`.
- `Heat Oil Butter` was misleading when the real step was cooking vegetables; accepted direction: `Cook Leek & Spinach` or another action that names the actual milestone.
- `Push Vegetables Side` was ungrammatical and confusing; accepted direction: `Push Vegetables Aside`.
- `Add Cold Cooked` omitted the noun and did not make plain-English sense; accepted direction: `Add Cold Rice` or `Add Rice`.
- Repeated `Cook Vegetables` labels for different fried-rice steps failed as quick recall cards; later milestones should distinguish the action/result, such as `Mix Fried Rice`, `Season Fried Rice`, or `Serve Fried Rice`.

## Recommended Eval Shape

Create a separate eval surface or fixture family for Live Cooking step previews, tentatively named `live_cooking_step_previews` or `cooking_step_previews`. Keep it separate from:

- recipe suggestion quality,
- Chef It Up / Slop Bowl recommendation quality,
- cooking-step safety/order/equipment evals.

The input should include the accepted recipe context, the generated step instruction, the provider `actionLabel` when present, the client-rendered fallback label when relevant, the step index, and the full sibling label list so duplicate labels can be judged.

## Acceptance Criteria To Encode

- Prefer 2-4 words; allow 5 only when needed to complete meaning.
- Avoid measurements and quantities in the label; focus on the action.
- The label should make sense as a quick recall card for a cook mid-step.
- The words must fit the small step-preview card without truncation.
- Labels should not repeat across different steps in the same recipe unless the repeated action is truly the same milestone.
- Labels must read as plain English and include needed nouns, prepositions, or adverbs.
- Labels should identify the actual cooking milestone, not merely the first phrase of a longer instruction.

## Prompt And Runtime Boundary

PR #260 should remain focused on INIT-001 runtime behavior: prompt guidance, UI fallback, and component coverage for the known examples. The formal fixture corpus, deterministic evaluator, judge rubric, and reporting changes should happen in a separate INIT-004 branch after deciding the surface name and fixture schema.

## Coordination Request

The INIT-004 owner should coordinate back to the INIT-001 Phase 4 thread or successor handoff before changing production prompts beyond the examples already in PR #260. The first report should state whether step-preview quality is treated as:

- a deterministic regression fixture only,
- a human-labeled calibration set,
- a narrow LLM judge criterion,
- or a combination of those lanes.

## Negative Scope

This brief does not implement the eval surface, add public fixtures, change `EVAL_CRITERIA`, alter `docs/evals/registry.md`, or change provider behavior by itself. It preserves the examples and desired separation so INIT-004 can build the audit path without blocking the current Phase 4 cockpit slice.
