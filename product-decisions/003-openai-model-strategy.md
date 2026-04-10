# PD-003: OpenAI Model Strategy — Tiered Model Selection

**Date:** 2026-04-09
**Status:** Accepted
**Decision maker:** Wilson

## Context

All 6 OpenAI API calls in `server/openai.ts` use `gpt-4o`, which is now outdated (released May 2024). OpenAI has since released newer, cheaper, and better-performing models. The current blanket approach wastes money on simple tasks while using an aging model for complex ones.

## Decision

Move from blanket `gpt-4o` to a **tiered model strategy** — match model capability to task complexity.

| Function | Current | New Model | Rationale | Cost Change |
|----------|---------|-----------|-----------|-------------|
| `getSlopBowlRecipe()` (new) | — | `gpt-4.1` | Trust-critical, best culinary creativity | — |
| `getRecipeSuggestions()` | `gpt-4o` | `gpt-4.1` | Complex prompt, quality matters | ~20% cheaper |
| `getCookingSteps()` | `gpt-4o` | `gpt-4.1` | Detailed instructions, quality matters | ~20% cheaper |
| `analyzeIngredientImage()` | `gpt-4o` | `gpt-4.1` | Vision + structured output | ~20% cheaper |
| `getCookingAssistance()` | `gpt-4o` | `gpt-4.1-mini` | Quick Q&A, speed > depth | ~85% cheaper |
| `getGroceryList()` | `gpt-4o` | `gpt-4o-mini` | Simple list extraction | ~94% cheaper |
| `getIngredientAlternatives()` | `gpt-4o` | `gpt-4o-mini` | Simple suggestions | ~94% cheaper |

### Pricing reference (per million tokens)

| Model | Input | Output |
|-------|-------|--------|
| `gpt-4o` (current) | $2.50 | $10.00 |
| `gpt-4.1` | $2.00 | $8.00 |
| `gpt-4.1-mini` | ~$0.40 | ~$1.60 |
| `gpt-4o-mini` | $0.15 | $0.60 |

**Estimated blended cost reduction: ~50-60%** across all endpoints.

All selected models support structured JSON output (`response_format: { type: "json_object" }`).

## Alternatives considered

| Alternative | Why rejected |
|-------------|-------------|
| Stay on `gpt-4o` everywhere | Overpaying for simple tasks, model aging |
| Move everything to `gpt-4.1` | Misses 85-94% savings on simple utility calls |
| Move everything to `gpt-4o-mini` | Too weak for complex recipe/cooking prompts |
| Use `o4-mini` (reasoning model) | Overkill — reasoning overhead not needed for recipe generation |

## Implementation notes

- Bundled with the Slop Bowl feature work (same PR, same `server/openai.ts` file)
- Codex handles all model reference changes
- No prompt changes needed for the existing JSON endpoints
- Feature-specific alignment notes live under `product-decisions/features/slop-bowl/`
