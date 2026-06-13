# INIT-004 Phase 2 — Wilson Decisions on the Architecture Review

**Agent:** claude
**Branch:** `codex/init-004-phase-2-spec` (committed onto the branch under review)
**PR:** [#168](https://github.com/wmishak404/laica/pull/168) (draft)
**Date:** 2026-06-13
**Initiative:** INIT-004
**INIT updated:** no — Codex owns Phase 2 spec revisions and INIT bookkeeping for this branch
**Resolves review:** [2026-06-10-claude-init-004-phase-2-review.md](2026-06-10-claude-init-004-phase-2-review.md)
**Base:** `origin/main` at `2abccc7`

## Summary

Wilson reviewed the Phase 2 architecture findings and resolved the five open gates plus the fixture-format and rubric questions. The recommended decisions stand; the changes are to the **fixture format**, the **criterion table**, the **max-time rule**, and a new **two-tier fixture storage** posture. None of this changes the accepted taxonomy (eval/prompt split, first-class `pantry_recipes`/`slop_bowl`, no prompt-activation expansion). With these edits applied, the spec is a sound Phase 3 contract. This handoff is the durable record Codex should revise the spec from — it supersedes the chat discussion.

## Decisions

### A — Max cook time is a ±15-minute band, not a hard ceiling

`max_time_adherence` **passes iff `cookTime ≤ selectedMax + 15` minutes (inclusive)**. "Got all the time" means no bound. With the current planning stops the effective pass ceilings are 30→45, 60→75, 90→105.

- **Why:** humans don't cook linearly and distractions happen; the criterion measures whether a dish is plausibly doable in the time, not stopwatch adherence.
- **Consequences:** both seed max-time misses (25-min max → 30-min recipe) become *boundary-pass* fixtures and stay as guards against a future prompt under-promising. The negative max-time fixture must now be **synthetic** (e.g. a 30-minute selection returning a 60-minute recipe). The existing prompt rule "round up in 15-minute intervals" no longer conflicts with the eval, so no prompt change is forced by this decision.
- Still fully deterministic; the check reads the bound from `constraints` (see Decision B), not the model's self-reported field.

### B — Fixture format: store the output, split request from constraints, add provenance and roles

The draft format could not support human labels or judge calibration (no output to attach a label to) and reintroduced an idealized input schema the Phase 1 audit warned against. Revised shape:

```jsonc
{
  "id": "eff022-thai-korean-broth-anchor",
  "surface": "pantry_recipes",
  "privacyClass": "synthetic",            // synthetic | redacted | raw_private
  "roles": ["regression", "calibration-probe"],  // regression | calibration-probe | positive-guard
  "derivedFrom": "priv-2026-06-XX-001",   // optional id of the private real fixture (Decision D)
  "request": {                             // BYTE-FAITHFUL to what the surface actually receives
    "preferences": "Time available: 30 minutes or less. Cooking skill: intermediate. Preferred cuisines: Thai. Dietary restrictions: gluten-free. ...",
    "ingredients": ["korean beef bone broth", "raw sausages", "leeks", "fish sauce", "butter"]
  },
  "constraints": {                         // STRUCTURED GROUND TRUTH the deterministic checks read
    "maxTimeMinutes": 30,
    "cuisines": ["Thai"],
    "skill": "intermediate",
    "dietaryRestrictions": ["gluten-free"],
    "equipment": []
  },
  "output": "{\"recipes\":[{\"recipeName\":\"Hearty Korean-Style Sausage & Leek Stew\", ...}]}",  // RAW string
  "outputProvenance": { "model": "gpt-4.1", "promptVersion": "default", "capturedAt": "2026-06-13" },
  "labels": {
    "structure_contract": "pass",
    "max_time_adherence": "pass",
    "cuisine_fit": "fail",
    "inspired_or_fusion_labeling": "blocked_on_product_rule"
  },
  "labelProvenance": { "labeledBy": "wilson", "labeledAt": "pending" },
  "notes": "Strong Korean-labeled pantry item overrode the selected Thai preference."
}
```

Required points:

- **`output` is a raw string**, governed by the same `privacyClass`, **required once any label is non-`pending`**. Raw string because the `openai-invalid-json-pass` seed cannot be stored as parsed JSON and the structure checker must see exactly what the model produced.
- **`request` vs `constraints`:** `request` is faithful to the real payload (the pantry surface packs skill/cuisines/staples/dietary into the free-text `preferences` string — see `meal-planning.tsx:553-584` and `routes.ts:458`); `constraints` is the structured truth the deterministic checks consume. Per-surface request schemas differ: pantry/suggestions use packed `preferences` + `ingredients`; Slop Bowl uses `SlopBowlInput`; cooking steps uses `{ recipeName, ingredients?, equipment?, description? }`.
- **Eval seam = the generation-function layer** (`getRecipeSuggestions` / `getSlopBowlRecipe` / `getCookingSteps` inputs), not the HTTP route — deterministic, no auth/profile scaffolding, and EFF-017 already owns route-boundary regression.
- **Provenance** (`outputProvenance`, `labelProvenance`) is required because `evaluations.md` requires prompt/model/evaluator versions in eval evidence and Phase 4 calibration is invalid across unrecorded model changes. Fixture-level provenance is enough for v1 single-session labeling.
- **`roles` tag** replaces `judge_calibration` as a label; calibration reporting stays in `evaluations.md`.
- **Label values:** `pass | fail | not_applicable | pending | blocked_on_product_rule` (renamed from `needs_wilson`, since Wilson does all v1 labeling; the new name keeps the EFF-022 boundary visible in the data).
- **Deterministic checks import shared schemas** rather than re-encoding contracts per fixture: export/move `slopBowlRecipeSchema`, author a cooking-steps response schema (cooking steps has **no** server schema today — `getCookingSteps` returns unvalidated `JSON.parse`; this is a small Phase 3 product-contract decision), and codify the recipes-array contract. `constraints.maxTimeMinutes` is the single source for the band check.

### C — Add `dietary_compliance`; drop nutrition entirely

- **Add `dietary_compliance`** (recipe and cooking-step surfaces with a stated restriction). **Dietary always overrides preferences: a violation fails the fixture regardless of how well every other criterion scores** — matching the current judge, which treats `dietary_violation` (allergies, halal/kosher, celiac) as the most critical trace-level error. Human/judge, plus deterministic flags where a restriction maps to detectable ingredient terms. Add ≥1 dietary seed (the Arize Halal Vietnamese coconut-rice or keto chicken-Parmesan example).
- **Drop nutritional-preference fit from the rubric outright** (not "defer"). Verified: `nutrition` appears in **no** current client UI, route, or `shared/schema.ts` field — the only occurrence is a stale line in `DEFAULT_RECIPE_SUGGESTIONS_PROMPT` claiming the user "will send … Nutritional preference." (The Arize intake lists `Nutritional_Preferences` only as a *legacy* input; historical DB rows may exist but there is no current schema column.)
- That stale prompt line, plus the kitchen-equipment line the prompt promises but the pantry/suggestions surfaces never send (`equipment_fit` is therefore evaluable only on `slop_bowl` + `cooking_steps` in v1), are **legacy prompt cleanup for EFF-022 / Phase 6 — not Phase 3.** Record them as measurement notes, not fixes.

### D — Two-tier fixture storage: public synthetic, private real (gitignored local dir)

Three things, three homes:

| What | Contains | Home | Visibility |
|---|---|---|---|
| Raw real output | Customer recipe + pantry input | Replit `ai_interactions` (identity-redacted at write by `redactForAiLog`, 90-day prune) | Internal — never committed |
| Durable labeled gold fixture | Real output + Wilson labels, kept past 90 days | **Gitignored local dir** | Internal — never committed |
| Public regression fixture | Synthetic/redacted derivative + aggregate metrics | `docs/evals/fixtures/` + reports | Public |

- **Private store = a gitignored local directory referenced by env var `LAICA_PRIVATE_EVAL_DIR`, located outside any git worktree** (home-dir, `.env.keys`-style), because this repo creates/removes many worktrees and an in-worktree dir would not survive cleanup. Same fixture format; `privacyClass: raw_private`.
- **Linking id:** a public synthetic fixture carries `derivedFrom: <private-id>` so it traces to the real failure without exposing it; the public twin and private original share the same `id` stem.
- **Two leak guards (structural, per the PD-010 philosophy):** (1) `.gitignore` the in-repo fallback path name as defense-in-depth; (2) a CI/local fixture-privacy check that **fails** if any committed fixture has `privacyClass: raw_private` or an `output` that flunks a redaction scan.
- **Retention exception:** a durable gold fixture deliberately keeps an (already identity-redacted) real output **past** the mobile-refresh 90-day commitment. This is a narrow, justified exception — small set, identity-redacted, access-controlled, internal-only — and must be written into the privacy posture, not slipped in.
- **Accepted trade-off / breadcrumb:** Wilson's labels live only in the local dir (no history, no backup, CI-invisible). Mitigation Wilson accepted: keep the dir in a backed-up/synced location; outputs are re-pullable from the DB by id within 90 days, after which the local copy is the only copy of both output and label. Calibration/judge runs were always a local/Replit eval-run lane (never PR CI), so CI-invisibility costs nothing there; the public synthetic set still runs in the `unit` lane.

### E — `cooking_assistance` stays infrastructure-only in V1

Keeps its place in the taxonomy, its logging, and its existing `EVAL_CRITERIA`, but is **out of V1 reporting and the Wilson labeling budget**. Rationale: zero assistance failures in the seed data, free-text output with no deterministic contract (judge-only), and the safety-critical content mostly originates in `cooking_steps` (which V1 covers). Pull-in triggers: an INIT-002 cluster, user feedback, or once the recipe-surface judges are calibrated.

## Spec edits for Codex (section by section)

`docs/evals/init-004-phase-2-rubric-dataset-spec.md`:

1. **§Fixture Format** — replace the example with the Decision B shape (add `output`, `request`/`constraints` split, `outputProvenance`, `labelProvenance`, `roles`, `derivedFrom`); state the generation-function eval seam and per-surface request schemas; note deterministic checks import shared response schemas (and that a cooking-steps schema must be authored). Rename `needs_wilson` → `blocked_on_product_rule` in the allowed label values.
2. **§Criterion Labels** — add `dietary_compliance` with the precedence rule; remove `judge_calibration` from the label table (it is run-level, surfaced via `roles`); scope `equipment_fit` to `slop_bowl` + `cooking_steps`; add the EFF-022 placeholder sentence to `cuisine_fit` (pantry-flexible-fallback outputs label `blocked_on_product_rule`, not `pass`, until EFF-022 resolves); note `max_time_adherence` is N/A for cooking steps (no time bound in that contract) and encode the **±15-minute band** as the rule.
3. **§Output-Quality Privacy Posture** — add the two-tier model from Decision D: the `raw_private` class and gitignored-local-dir home, the `derivedFrom` linking id, the two leak guards, the public-repo-visibility framing, judge-run provider transit, and the 90-day-retention exception for the durable gold set.
4. **§Implementation Implications For Phase 3** — add: make eval-queue selection criteria-aware (current `submitEvalBatch` with no ids selects all pending and `buildEvalPrompt` throws on feature types without criteria, so any pending `slop_bowl` row poisons the submit-all-pending path — `evaluator.ts`, `openai.ts:294`); populate `ai_interactions.prompt_version_id` when touching the logging path; note the taxonomy slice needs **no DB migration** (`feature_type` is a free varchar — only the stale `shared/schema.ts:162,179` comments change); derive the three feature-id unions (`AiErrorFeature`, `EvalFeatureType`, `PromptFeatureType`) from one canonical id module so admin Zod enums stop being hand-duplicated literals.
5. **§First Wilson-Label Target Set** — add one dietary-restriction seed; resolve the two "or" surface assignments to a single surface each; flag the three OpenAI Platform seeds as needing current-`recipes[]` re-expression or a legacy-only tag; note the max-time seeds are now boundary-pass guards and that the true negative max-time + negative Slop Bowl fixtures are synthetic/await-capture.
6. **§Review Decisions** — record A–E as accepted; keep the EFF-022 product fallback rule explicitly open.

`initiatives/INIT-004-ai-output-quality-evals.md` — update the Phase 2 gate / current resume point to reflect the accepted decisions (Codex's call on exact wording).

## Phase 3 readiness

Phase 3 may start once the spec is revised per the above, marked ready, and merged (Wilson owns that merge). Recommended Phase 3 validation plan is unchanged from the review handoff: deterministic checks + type/logging/queue changes in Vitest + GitHub `unit`; fixture-format validator in the `unit` lane; app regression via `e2e_guest_smoke` (note it stubs `/api/recipes/pantry`, so the logging proof stays in unit — negative scope); judge/calibration runs as a registered live-provider eval lane (local dotenvx or Replit), never in PR CI; admin-route tests in Vitest; Wilson labeling as its own lane producing a reviewed fixture PR + registry row. No Replit validation required for the eval-only slice (automation-primary, risk note only).

## Verification

Decisions captured from Wilson's 2026-06-13 review of [the architecture-review handoff](2026-06-10-claude-init-004-phase-2-review.md). Code claims re-verified at this head: `nutrition` absent from current client/route/schema (`grep -ril nutrition client/src server shared` → `server/openai.ts` only); `cooking_assistance` wiring (`cooking-assistant.tsx:28`, `live-cooking.tsx:1199`, `routes.ts:646`). Docs-only handoff; `git diff --check` clean. No code, PR state, or GitHub comment changed.

## Stack / base status

- Base: `origin/main` at `2abccc7a88ac4c203b64daa851bc3bde6ee40f45` (this commit adds one handoff file on top of the review handoff `4d3ebdd`)
- Last Replit-validated at: not applicable (docs-only)
- **Codex: pull before your next push** — fast-forward pushed onto `codex/init-004-phase-2-spec` from a detached worktree.
