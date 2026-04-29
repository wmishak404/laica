# EPIC-011 — Vision scans should reject text-only ingredient or equipment screenshots

**Status:** Open
**Owner:** Wilson / Codex / Claude
**Created:** 2026-04-29
**Updated:** 2026-04-29

## One-line summary

Prevent pantry and kitchen vision scans from treating screenshots or photos of plain text lists as proof that the user physically has those ingredients or equipment.

## Context — why this exists

Wilson found a product-quality gap during pantry-scan review: if a user uploads a screenshot containing ingredient words in plain text, the vision API can read the words and return them as detected pantry ingredients. That is not the intended scan behavior.

The scan goal is to capture the user's actual pantry and kitchen environment, not to OCR arbitrary text. A typed grocery list, recipe screenshot, note, website screenshot, or plain text image saying `eggs, butter, rice` should not become pantry inventory. The same safeguard applies to equipment: a screenshot listing `oven, blender, pan` should not become kitchen equipment.

This is distinct from legitimate packaging text. If a visible physical product is present, such as a box of pasta or a labeled can on a shelf, the label can help identify the item. The problem is text-only or text-dominant images with no visible physical pantry/kitchen objects.

## Scope

### In scope

- Pantry vision scans that return ingredients from text-only or text-dominant screenshots.
- Kitchen/equipment vision scans that return equipment from text-only or text-dominant screenshots.
- Prompt rules that instruct the model to only extract visible physical items, not arbitrary OCR text.
- Response metadata or validation that can identify `text_only`, `document`, `screenshot`, `receipt`, `menu`, `recipe`, or `list` style inputs.
- UI feedback for rejected text-only scans that routes users to manual entry instead.
- Validation fixtures for:
  - plain text ingredient screenshot
  - plain text equipment screenshot
  - recipe/grocery-list screenshot
  - physical pantry shelf with readable labels
  - physical kitchen scene with readable appliance labels

### Out of scope

- Building OCR import for grocery lists, recipes, receipts, or screenshots.
- Treating screenshots as a supported inventory input.
- Changing manual entry semantics.
- Blocking physical products just because their packaging contains text.
- Replacing the existing vision model or route architecture.

## Decisions made so far

- Text-only or text-dominant screenshots are not valid pantry/kitchen scan evidence.
- The app should preserve manual entry as the supported path when the user wants to provide typed lists.
- Packaging text on visible physical products remains valid supporting evidence.
- The safeguard should apply to both ingredient and equipment detection.
- This should be addressed later as a product-quality guardrail, not squeezed into the current Phase 2 implementation branch.

## Open questions

### 1. Prompt-only or prompt plus server validation?

Default lean: use both. Prompting should tell the model not to infer inventory from plain text, and the server should be able to reject or empty out results when the response classifies the image as text-only or document-like.

### 2. What should the API response shape be?

Possible additions:

- `imageType: "physical_pantry" | "physical_kitchen" | "text_only" | "document" | "unknown"`
- `rejectedReason: "text_only_inventory"` when appropriate
- empty `ingredients` / `equipment` arrays for rejected scans

This should be decided when implementation starts so client feedback can be consistent.

### 3. What should the user-facing message say?

Default lean:

- Pantry: `This looks like a text list, not a pantry photo. Use manual entry for typed ingredients.`
- Kitchen: `This looks like a text list, not a kitchen photo. Use manual entry for typed equipment.`

Exact copy can be tuned during implementation.

### 4. How should we handle receipts or grocery lists?

Default lean: reject them for inventory scans for now. A future grocery-list import feature can handle those intentionally, with a different user promise and confirmation step.

## Agent checklist — when to read this epic

Read EPIC-011 before starting any of the following:

- [ ] Editing pantry or equipment vision prompts.
- [ ] Changing `/api/vision/analyze` result parsing, validation, or response shape.
- [ ] Changing scan UI behavior after empty or rejected vision results.
- [ ] Adding scan fixtures or evals for text-heavy images.
- [ ] Building any feature that imports ingredients/equipment from screenshots, receipts, recipes, grocery lists, or OCR text.

When this applies, cite EPIC-011 in the handoff and note whether the work conforms, defers, or changes the safeguard direction.

## Resolution criteria

This epic is `Resolved` when all of the following are true:

1. Text-only ingredient screenshots do not add pantry ingredients.
2. Text-only equipment screenshots do not add kitchen equipment.
3. Physical pantry photos with readable packaging labels still detect real visible products.
4. Physical kitchen photos with readable appliance labels still detect real visible tools/appliances.
5. The user receives clear feedback and can switch to manual entry when a text-only scan is rejected.
6. A handoff or product note records the accepted prompt/API/UI behavior and validation fixtures used.

## Linked artifacts

- `product-decisions/features/mobile-refresh/phase-02-setup.md`
- `epics/006-equipment-vision-exclusions.md`
- `epics/007-vision-scan-no-detection-feedback.md`
- `server/prompts/molecules/vision-base.md`
- `server/prompts/organisms/equipment-analysis.md`
- `server/prompts/composer.ts`
- `server/openai.ts`
- `server/routes.ts`
- `client/src/components/cooking/user-profiling.tsx`
- `client/src/components/cooking/user-settings.tsx`

## 2026-04-29 — Filed from Phase 2 scan review

Wilson noticed that a screenshot of plain text ingredient words can be interpreted as pantry inventory by the vision flow. The same failure mode can apply to kitchen equipment. This epic preserves the needed future safeguard while Phase 2 continues focusing on the mobile camera-first setup flow.
