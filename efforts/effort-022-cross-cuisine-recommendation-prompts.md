# EFF-022 - Cross-cuisine recommendation prompts

**Status:** Open
**Owner:** Wilson / Codex / Claude
**Created:** 2026-05-23
**Updated:** 2026-05-27

## One-line summary

Tune recipe recommendation prompts and evals so Laica can suggest pantry-grounded cross-cuisine dishes when selected cuisine preferences imply a useful intersection, without pretending unsupported cuisine picker options exist.

## Context

During INIT-003 pre-auth homepage mockup review, Wilson rejected a weaker breakfast-taco example and preferred a more specific pantry transformation: rice, beef patties, BBQ sauce, and eggs becoming a Loco Moco-style bowl. The caution is that the current product does not appear to expose Hawaiian as a cuisine picker option, so landing examples and prompt behavior should not imply a selectable cuisine that is not actually present.

The useful follow-up is prompt quality, not homepage copy alone. If a user selects preferences such as American and Asian, and their pantry supports rice, beef patties, eggs, and a sauce, Laica should be able to consider a coherent cross-cuisine or inspired recommendation such as a pantry Loco Moco-style bowl. That recommendation should remain pantry-first, culturally careful, and honest about being inspired or adapted when the ingredient set is not classic.

Existing prompt guidance in `server/openai.ts` already says cuisine preference is a flavor direction and exposes `isFusion`. This Effort tracks the later audit and tuning needed to make that behavior intentional, validated, and not dependent on ad hoc examples.

## Scope

### In scope

- Audit the current cuisine picker options and how `client/src/components/cooking/meal-planning.tsx` packages selected cuisines into recipe-generation prompts.
- Audit `DEFAULT_RECIPE_SUGGESTIONS_PROMPT`, any active database-backed recipe prompt versions, and recipe suggestion eval criteria.
- Define prompt language for multi-cuisine selections: when selected cuisines may combine, when adjacent culinary traditions may be suggested, and when the model should stay literal.
- Define recipe naming and labeling guardrails for inspired or adapted dishes, especially when the product does not expose the exact cuisine as a picker option.
- Add prompt fixtures, unit tests, or eval cases for at least one pantry-supported cross-cuisine scenario, including rice + beef patties + eggs + BBQ sauce with American + Asian preferences.
- Preserve the pantry-first boundary: optional extras stay optional, and a recipe must work from available pantry or confirmed-staple ingredients.

### Out of scope

- Adding new cuisine picker options such as Hawaiian without a separate product decision.
- Changing the INIT-003 homepage to advertise unavailable cuisine categories.
- Making recipe suggestions ignore dietary restrictions, user-selected cuisines, pantry evidence, or the three-suggestion planning contract.
- Redesigning the live cooking guide or cooking-history flow.

## Decisions made so far

- Homepage examples may use a Loco Moco-style dish only as a pantry transformation example, not as evidence that Hawaiian is a current cuisine picker option.
- Cross-cuisine recommendations are acceptable future prompt behavior when they emerge from selected preferences plus pantry evidence.
- Adapted or non-classic recommendations should be labeled honestly, for example as `Loco Moco-style` or `pantry-inspired`, rather than overclaiming authenticity.
- This is standalone prompt/recommendation-quality work, not part of the current INIT-003 anonymous-auth gate.

## Open questions

- Which current cuisine combinations should unlock adjacent or cross-cuisine suggestions, and which should remain literal?
- Should the prompt explicitly tell the model that multiple selected cuisines can combine into one coherent dish, or should that live in a server-side normalization layer?
- How should recipe cards display `isFusion` or inspired labels, if at all?
- What eval wording should distinguish a useful inspired recommendation from a culturally sloppy or unsupported one?
- Should public landing examples avoid naming exact cuisine traditions entirely until the recommendation prompt rules are validated?

## Agent checklist

Read EFF-022 before starting any of the following:

- [ ] Changing recipe suggestion prompts or database-backed prompt versions.
- [ ] Changing `MealPlanning` cuisine preference packaging.
- [ ] Changing recipe suggestion eval criteria for cuisine alignment, pantry usage, or fusion behavior.
- [ ] Adding or renaming cuisine picker options.
- [ ] Adding homepage, onboarding, or marketing examples that name a cuisine tradition.
- [ ] Testing pantry-first recommendations involving multiple selected cuisines.

## Resolution criteria

This Effort is `Resolved` when all of the following are true:

1. The current cuisine picker options and prompt payload behavior have been audited.
2. Recipe recommendation prompt guidance explicitly covers multi-cuisine selections and inspired/adapted dishes.
3. At least one test, fixture, or eval case covers a pantry-supported cross-cuisine recommendation such as rice + beef patties + eggs + BBQ sauce with American + Asian preferences.
4. Recipe naming or display guidance avoids implying unavailable cuisine picker options.
5. Validation evidence is recorded in the implementation PR or handoff, including any Replit or eval-run results that matter.

## Linked artifacts

- `server/openai.ts`
- `server/eval-criteria.ts`
- `client/src/components/cooking/meal-planning.tsx`
- `docs/handoffs/2026-05-22-codex-init-003-preauth-homepage.md`
- PR #102, INIT-003 pre-auth homepage and Plan B guest MVP

## 2026-05-23 - Created from INIT-003 homepage mockup review

Wilson asked to preserve the stronger Loco Moco-style pantry example while noting that Hawaiian does not appear to be a current product cuisine option. Created this Effort so future prompt work can support recommendations beyond literal country-cuisine selections without turning the landing page into an unsupported feature promise.

## 2026-05-27 - Bad Chinese-request example from anonymous guest validation

Wilson captured a guest Chef It Up session where the user requested Chinese and had an intermediate / gluten-free profile. The pantry included Korean beef bone soup broth, raw sausages, leeks, fresh sage, Daiya plain yogurt, sesame hummus, prepared soup/stew, fish sauce, hot sauce, mustard, rice vinegar, butter, and ketchup.

The returned suggestions were:

- `Hearty Sausage & Leek Rice Soup`, using Korean beef bone soup broth, raw sausages, leeks, butter, and hot sauce
- `Pan-Seared Sausage Coins with Hummus-Leek Relish`
- `Chinese-Style Sage & Leek Stir Sauté`

This is a useful negative fixture for future prompt/eval work, with one important nuance: the pantry may have been genuinely challenging for a convincing Chinese set. Only one option even labels itself Chinese, and the set does not strongly satisfy the selected cuisine preference. The first option leans Korean/general pantry soup, the second reads hummus/Mediterranean-adjacent, and the third is the only weakly aligned Chinese-style suggestion.

Future work should explore the right product story when pantry constraints fight the selected cuisine:

- Generate all or most options as visibly Chinese when enough pantry anchors exist.
- Ask for or suggest a small number of Chinese pantry staples before generation when the set is too weak.
- Present a transparent fallback such as pantry-flexible options with clear copy that the current pantry does not strongly support Chinese.
- Avoid silently mixing off-cuisine suggestions into a cuisine-requested result set without explaining the constraint.

Future evaluation should check not only pantry fit but also whether returned options visibly honor an explicitly selected cuisine, or clearly explain when pantry constraints force a broader pantry-flexible fallback.

## 2026-05-27 - Repeated cuisine-fit miss with Indian request

Wilson captured another guest Chef It Up session with the same pantry family where the user requested Indian. The returned suggestions were:

- `Sausage & Leek Soup with Beef Bone Broth`, using raw sausages, leeks, fresh sage, Korean beef bone soup broth, and ginger
- `Sheet Pan Roasted Sausages with Leeks, Sage & Mustard Yogurt`
- `Indian-ish Leek & Sausage Yogurt Curry`

This strengthens the EFF-022 signal: under constrained pantry conditions, Chef It Up appears to preserve pantry fit but treats the explicit cuisine preference as optional, with only the third result weakly acknowledging the selected cuisine. The future prompt/eval pass should include multiple requested-cuisine fixtures, not only the Chinese example, and should decide whether the product should:

- require all three suggestions to visibly align with the selected cuisine when a cuisine is chosen,
- ask for missing cuisine anchors or pantry staples before generation,
- return fewer cuisine-specific options plus an explicit pantry-flexible fallback explanation, or
- show a clear "your pantry does not strongly support this cuisine" story before offering broader ideas.

## 2026-05-27 - Thai request shows Korean broth anchoring

Wilson captured the same repeated pattern when selecting Thai. The returned suggestions were:

- `Hearty Korean-Style Sausage & Leek Stew`, using Korean beef bone soup broth, raw sausages, leeks, fresh sage, and butter
- `Herbed Sausage Stir-Fry with Yogurt-Hot Sauce Drizzle`
- `Thai-Style Leek & Sausage Broth Bowl`

This adds a more specific hypothesis for the future prompt/eval pass: the model may be over-anchoring on the strongest pantry identity marker, especially `korean beef bone soup broth`, then allowing the selected cuisine to become a weak style modifier on only one card. The issue is not only "make cuisine preference stronger"; it may also need ranking or prompt guidance for ingredient provenance. A Korean-labeled ingredient should not silently override an explicit Thai, Indian, or Chinese request unless the product clearly presents that as a pantry-constrained fallback.

Future fixtures should include pantry sets with a strongly labeled cross-cuisine ingredient to test whether selected cuisine remains primary, whether the model asks for missing staples, or whether the UI explains why a pantry-flexible fallback is being offered.
