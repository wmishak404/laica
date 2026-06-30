# EFF-022 Fallback Decision Record

**Date:** 2026-06-30
**Agent:** Codex
**Branch:** `codex/eff-022-fallback-decision`
**Base:** `origin/main` at `f9909af`
**Effort:** [EFF-022](../../efforts/effort-022-cross-cuisine-recommendation-prompts.md)
**Related initiative:** [INIT-004](../../initiatives/INIT-004-ai-output-quality-evals.md)
**INIT updated:** Yes

## Summary

Wilson accepted transparent pantry fallback as the preferred direction for selected-cuisine requests when the pantry does not strongly support that cuisine. The product should explain the pantry limitation, optionally ask about a few missing staples first, and continue with honest pantry-first suggestions if the user does not add those staples. It should not silently replace the user's selected cuisine, and it should not default the user to `No preference`.

Implementation is intentionally deferred until after higher-priority INIT-001 work. The remaining EFF-022 design task is to define and validate the activation threshold for when transparent fallback mode turns on.

## What changed

- Updated EFF-022 with the accepted fallback direction, bias guardrails, optional staple-helper path, and a first decision framework for future implementation.
- Updated the Efforts registry with the new latest signal.
- Updated INIT-004 so eval work treats the direction as accepted while keeping runtime prompt/UI work deferred.
- Updated the INIT-004 Phase 2 eval spec so `blocked_on_product_rule` now applies to cases that depend on the still-deferred activation threshold or copy, not to the entire fallback direction.

## Decision details

- Stay cuisine-literal when pantry or confirmed staples can support visibly cuisine-aligned suggestions without required missing ingredients.
- Ask for missing staples when a small number of concrete, pantry-saveable staples would materially improve cuisine fit.
- Use transparent pantry fallback when selected-cuisine support remains weak after the staple check, when pantry identity points strongly elsewhere, or when only a weak `-style` / `-ish` option can honor the selected cuisine without inventing required ingredients.
- If another cuisine or dish direction is clearly better supported, offer it as an optional alternate suggestion or a specific change-cuisine path.
- Do not auto-switch the user's cuisine, do not quietly present off-cuisine results, and do not guide users to `No preference` by default.

## Deferred work

- Runtime implementation in `client/src/components/cooking/meal-planning.tsx`, `server/openai.ts`, and any DB-backed active `recipe_suggestions` prompt is deferred until after higher-priority INIT-001 work.
- EFF-022 still needs the exact activation threshold, user-facing fallback copy, tests/fixtures, and validation evidence.
- INIT-004 cuisine-fit fixtures can use the accepted direction, but fixtures whose labels depend on the exact fallback threshold or copy should wait for the EFF-022 implementation milestone.

## Validation

Docs-only decision record. No runtime, schema, prompt, provider, UI, or fixture execution behavior changed.

- `git diff --check` passed on 2026-06-30.
