# EPIC-006 — Tighten equipment vision prompts to exclude non-kitchen items

**Status:** Deferred
**Owner:** Wilson (product direction) / Codex (doc capture) / Claude (future implementation review)
**Created:** 2026-04-22
**Updated:** 2026-04-22

## One-line summary

The kitchen-equipment vision flow is too eager when a photo includes doorway, hallway, or bathroom-adjacent context, and it needs explicit exclusion rules so non-kitchen objects do not get tagged as kitchen equipment.

## Context — why this exists

Source: Custom feedback #5 (`/app-settings`, 2026-04-23 01:07):

> "some entries like 'umbrella stand or freestanding coat (by front door, metal or black)' and 'soap dispenser' are not kitchen equipment and shouldn't be there."

The current equipment-scanning prompt stack asks the model to identify kitchen equipment broadly, but never tells it what to exclude. When a user photo accidentally includes the front door area, hallway, or bathroom edge, the model can still identify visible objects faithfully, then misclassify them as kitchen equipment because the prompt offers no negative constraints.

### Current implementation (evidence)

- `server/prompts/molecules/vision-base.md` defines the base vision behavior and explicitly asks for cookware, appliances, and kitchen tools, but gives no exclusion rule for non-kitchen context.
- `server/prompts/organisms/equipment-analysis.md` asks the model to identify "ALL kitchen equipment, cookware, appliances, and food ingredients" and likewise provides no negative examples or confidence gate.
- `server/prompts/composer.ts` contains fallback copies of both prompts, so any future prompt tightening must be mirrored there to keep file-backed and fallback behavior aligned.
- `server/routes.ts` serves `/api/vision/analyze`, which calls `analyzeIngredientImage(...)`.
- `server/openai.ts` sends `compositions.equipmentAnalysis.system()` and `compositions.equipmentAnalysis.user()` directly to the OpenAI vision call, so prompt wording is the main behavior lever in the current implementation.

### Logging caveat discovered during filing

The screenshot suggested confirming that entries continue landing in the `ai_interactions` table with the new prompt version, but current exploration showed that `analyzeIngredientImage(...)` does not call the existing `logInteraction(...)` helper today. That means vision-route logging is a separate scope decision, not a simple regression check for this epic.

## Scope

### In scope

- Tightening the equipment-analysis prompt instructions so non-kitchen items are excluded from the returned equipment list
- Adding explicit negative examples for bathroom items, decor/furniture, doorway/hallway objects, and other obvious non-kitchen context
- Adding a general confidence rule such as: if an item is not clearly used for cooking, food prep, food storage, or food serving, omit it
- Keeping `server/prompts/molecules/vision-base.md`, `server/prompts/organisms/equipment-analysis.md`, and the fallback strings in `server/prompts/composer.ts` in sync
- Defining later validation scenarios for known-bad and known-good kitchen photos

### Out of scope

- Implementing the prompt rewrite in this filing pass
- Adding route-level post-processing filters for equipment output
- Changing the ingredient-vision path unless it is proven to share the same failure mode
- UI changes to the equipment tab or settings flow
- Adding `ai_interactions` logging for the vision route unless that is scoped as follow-up work

## Decisions made so far

- This should be tracked as a separate epic rather than folded into a larger prompt or UI cleanup item.
- The later fix should start with prompt tightening, because the current route behavior is driven directly by prompt wording.
- Negative constraints need to cover both concrete examples (soap dispenser, umbrella stand, coat rack) and a general "omit uncertain non-cooking items" rule.
- Runtime prompt files and fallback prompt strings must stay aligned so the behavior does not drift when file loads fail.
- Vision logging is important context, but it is not part of this epic's initial acceptance bar.

## Open questions

### 1. How much of the fix should remain prompt-only?

Default lean: start with prompt edits only. If false positives remain after validation, consider a follow-up rule-based filter or a second-pass classifier rather than bundling that complexity into the first implementation.

### 2. Where should the confidence gate live?

Candidate options:

- only in `vision-base.md`
- only in `equipment-analysis.md`
- in both prompts, with the system prompt setting the durable rule and the user prompt reinforcing it per call

Default lean: place the durable rule in the system prompt and reinforce it in the per-call prompt.

### 3. Should the vision route start logging to `ai_interactions`?

Current state suggests "not yet." If prompt-version tracking or eval workflows need vision visibility, that should be decided explicitly during implementation rather than assumed here.

### 4. What validation assets should we standardize on?

The screenshot references:

- one known bad photo that produced umbrella-stand / soap-dispenser false positives
- several known-good kitchen photos
- one mixed kitchen-plus-doorway photo

Implementation should identify or capture durable fixtures for those cases before this epic is resolved.

## Agent checklist — when to read or reopen this epic

Read EPIC-006 before starting any of the following:

- [ ] Editing `server/prompts/molecules/vision-base.md`
- [ ] Editing `server/prompts/organisms/equipment-analysis.md`
- [ ] Editing the equipment-analysis fallback strings in `server/prompts/composer.ts`
- [ ] Changing `/api/vision/analyze` behavior in a way intended to reduce non-kitchen equipment false positives
- [ ] Adding evaluation or logging coverage specifically for equipment-vision prompt behavior

When this epic is reactivated, cite it in the handoff and note whether the work conforms to, expands, or supersedes the prompt-first approach captured here.

## Resolution criteria — what "done" looks like

This epic is `Resolved` when all of the following are true:

1. Re-uploading the known bad photo no longer returns umbrella stand, freestanding coat/coat rack, soap dispenser, or similar non-kitchen objects as equipment.
2. Known-good kitchen photos still return real cookware, appliances, and tools without obvious regressions.
3. A deliberately mixed kitchen-plus-doorway photo returns only the kitchen items from the scene.
4. The accepted implementation keeps the prompt files and fallback prompt strings aligned.
5. Vision logging is either explicitly added and documented as follow-up scope, or explicitly ruled unnecessary for resolving this epic.
6. A durable implementation note exists in a handoff, feature note, or product decision, and this epic includes a final dated resolution section pointing to it.

## Linked artifacts

- `server/prompts/molecules/vision-base.md`
- `server/prompts/organisms/equipment-analysis.md`
- `server/prompts/composer.ts`
- `server/openai.ts`
- `server/routes.ts`

## Chronology — how we got here

### 2026-04-22 — Epic filed for later work

This issue was recorded as a deferred backlog item so the false-positive pattern is not lost while other work takes priority. The core observation is narrow and actionable: the equipment-vision prompts need exclusion rules for non-kitchen context, but the implementation should remain separate from this filing pass.
