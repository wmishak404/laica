# EPIC-006 — Tighten equipment vision prompts to exclude non-kitchen items

**Status:** Resolved
**Owner:** Wilson (product direction) / Codex (doc capture) / Claude (future implementation review)
**Created:** 2026-04-22
**Updated:** 2026-04-27

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

### 2026-04-27 — Prompt-first implementation started

The first implementation pass reactivated this epic and stayed intentionally narrow: tighten the prompt wording in the markdown prompt files and in `server/prompts/composer.ts`, then verify with local compile/build checks plus a small prompt-composition guardrail test. Vision-route logging and prompt-version plumbing remain out of scope for this pass unless the prompt-only fix proves insufficient.

### 2026-04-27 — Validation fixture set captured

Wilson provided a concrete local validation set for future manual testing. Use these as named fixtures in handoffs and verification notes:

- `kitchenfar_beckoit.jpeg` — mixed kitchen plus entryway objects, including soap dispenser risk
- `suitcases.jpeg` — negative control with luggage only
- `63F9B83B-F16E-4951-BFB7-D91F4A216A60_1_105_c.jpeg` — active kitchen with human, dog, and soap dispenser
- `E68A8D93-A4EE-4867-A072-AA4A0A83C539_1_105_c.jpeg` — living room negative control
- `B080ACE5-1701-48FC-91E0-EEC96CACCC51_1_105_c.jpeg` — living room negative control
- `58A18FEE-B3D9-4B66-B02D-6D34F2444676_1_201_a.jpeg` — partial kitchen with stools and lamps that should not count as equipment
- `209E6358-D0C9-42D8-8D6D-4C8D35484115_1_105_c.jpeg` — mixed kitchen with non-kitchen objects
- `living-room-tv-cat-negative-control.png` — renamed screenshot-style living room negative control

These fixtures are for evaluation, not as prompt rules. The prompt should judge object function, not whether the whole room conforms to one kitchen style.

### 2026-04-27 — First live fixture run signal

After restoring `.env.keys` in the worktree and running the local image fixtures against `/api/vision/analyze`, the prompt-first pass showed mixed results:

- Negative controls improved substantially:
  - `suitcases.jpeg` returned an empty equipment list
  - living-room negatives returned empty equipment lists
- Mixed kitchen scenes still over-returned kitchen-adjacent objects:
  - `kitchenfar_beckoit.jpeg` still included dining table and dining chairs
  - `63F9B83B-...jpeg` still included drinkware and water bottles
  - `209E6358-...jpeg` still included sink/faucet/hood, cleaning supplies, and drinkware
  - `58A18FEE-...jpeg` still included shelf/cart-style furniture

This evidence suggests the next prompt iteration should narrow "equipment" toward cooking-relevant inventory and away from furniture, cleaning items, drinkware, and room fixtures, while preserving support for unusual or mixed-use kitchens.

### 2026-04-27 — Kitchen infrastructure vs. equipment decision

Follow-up product review clarified that some remaining false positives are not random mistakes, but taxonomy mistakes. `French press` and `carafe` are acceptable in `equipment` because they are directly used for beverage preparation or serving. `Sink` and `range hood` should not be in `equipment`: they describe fixed kitchen infrastructure or environment context, not tools the user actively cooks with. Future product work may capture ventilation or other kitchen-environment signals in a separate category, but this prompt-first pass should keep `equipment` focused on usable cooking inventory.

### 2026-04-27 — Prompt-plus-filter refinement for infrastructure aliases

Live local fixture retesting showed that prompt tightening alone reduced many false positives, but the vision model still occasionally reintroduced excluded infrastructure under nearby synonyms such as `vent hood`, `farmhouse kitchen sink`, or `kitchen faucet`. The implementation therefore graduated from pure prompt control to a narrow server-side equipment filter for fixed infrastructure and plumbing labels that are out of scope for the current `kitchenEquipment` product surface. This keeps `French press` and `carafe` in-bounds while enforcing the agreed exclusion for sinks and hoods.

### 2026-04-27 — Empty-result UI follow-up split into EPIC-007

Negative-control fixture testing also surfaced a smaller product gap outside the model itself: some scan flows clearly communicate a valid empty result, while others still end silently when nothing is detected. That follow-up now lives in `epics/007-vision-scan-no-detection-feedback.md` so it remains visible during ongoing and future equipment-scan validation without widening EPIC-006 itself.

### 2026-04-27 — Fine-grained taxonomy call for serving/storage vs. drinkware

Follow-up product review narrowed another set of borderline items. `Wine glass`, `wine bottle`, `water filtration dispenser`, and generic `utensil set` labels should be excluded from `equipment`. `Mason jars` and `serving tray` remain in-bounds as acceptable storage or serving equipment. This moved the next refinement from broad room-context cleanup into a more precise taxonomy pass on what should count as usable kitchen equipment.

### 2026-04-27 — Live rerun after drinkware and water-filter exclusions

After applying the finer-grained taxonomy pass and rerunning the noisy kitchen fixtures on a fresh local server, the results improved again:

- `wine bottle` no longer appeared in `equipment`
- water-filter-family labels were removed from `equipment`
- generic `utensil set`, `utensil holder`, and `drinking glass` labels were removed from `equipment`
- earlier infrastructure exclusions (`range hood`, `sink`, `faucet`) continued to hold

Residual edge cases remain in the mixed-kitchen fixture, especially organizer/decor labels such as `magnetic knife rack` and `flower vase`. At this point the work is no longer about broad non-kitchen junk; it is about a narrower taxonomy choice around storage/organizer surfaces versus directly used tools.

### 2026-04-27 — Organizer and decor cleanup pass

Product confirmed that `magnetic knife rack` and `flower vase` should not be returned as equipment because they are not directly usable for cooking. After excluding those labels and rerunning the mixed-kitchen fixture on a fresh local server, both dropped out of `equipment`, leaving a much cleaner result centered on actual kitchen gear such as refrigerator, range, oven, cutting board, knives, wooden spoons, storage jars, and mixing bowl. At this stage the remaining equipment output is close to the intended “usable for cooking” surface.

### 2026-04-27 — Resolved after PR #17 merged

PR #17 merged the equipment-scan tightening work into `main`, satisfying this epic's accepted implementation bar.

- `server/prompts/molecules/vision-base.md`, `server/prompts/organisms/equipment-analysis.md`, and the fallback strings in `server/prompts/composer.ts` were tightened together so file-backed and fallback prompt behavior stay aligned.
- `server/vision/equipment-filter.ts` and its integration in `server/openai.ts` now backstop the agreed exclusions for infrastructure and clutter labels the model still occasionally reintroduced.
- The named local fixture set was used for live manual validation, including negative controls (`suitcases.jpeg`, living-room fixtures) and mixed kitchen images (`kitchenfar_beckoit.jpeg`, `209E6358-...jpeg`).
- Final live results removed the targeted non-kitchen returns from `equipment`, including doorway clutter, soap dispensers, sink/faucet/hood labels, casual drinkware, water-filter labels, organizer surfaces, and decor objects.

The logging caveat was explicitly treated as separate scope: vision-route logging was not added, and it is not required for EPIC-006 resolution. The empty-result UI gap discovered during validation remains tracked separately in `epics/007-vision-scan-no-detection-feedback.md`.

Resolution artifacts:

- `docs/handoffs/2026-04-27-codex-equipment-vision-prompt-filter.md`
- `docs/handoffs/2026-04-27-codex-equipment-vision-taxonomy-pass.md`
- `docs/handoffs/2026-04-27-codex-equipment-vision-cleanup-pass.md`
