# INIT-004 pantry recipe user-expectation fixtures

**Agent:** codex
**Branch:** `codex/init-004-pantry-expectation-fixtures`
**Date:** 2026-06-19
**Initiative:** INIT-004
**INIT updated:** yes
**PR:** [#205](https://github.com/wmishak404/laica/pull/205)

## Summary

This branch continues INIT-004 Phase 3 with one bounded public fixture-corpus milestone: pantry recipe evals now include synthetic negative probes for halal/no-pork dietary compliance, required shopping-list extras, and beginner skill fit. The user value is safer future recipe-quality evaluation: Laica's eval corpus can now preserve examples where structurally valid recipe suggestions would still fail a cook's dietary restrictions, available pantry, or stated skill level.

This is offline measurement scaffolding only. It does not change recipe prompts, run providers, ingest private fixtures, write eval data, change DB schema, expose runtime behavior, activate daily reports, or decide EFF-022 cuisine fallback behavior.

## Triage rationale

Fresh `origin/main` was `7274a62e63c933c6f41bdde0035d47cce5e8b7d3`. Open PRs at intake were #204 EFF-027 closeout, #195 Dependabot, and #191 Live Cooking speech arbitration. #204 and #191 were treated as active/plausibly owned and were not touched.

Architecture ranking:

- INIT-004 Phase 3 ranked first because its resume point explicitly allowed another small accepted target-set fixture batch, and the work is offline fixture/docs/test scope with no Replit, provider, privacy, schema, prompt, deployment, or product fallback decision.
- INIT-001 ranked lower because #191 is active/conflicting Live Cooking work and remaining Phase 3.1/4 options are UI/provider/runtime validation heavier.
- INIT-002 remains in Phase 2 Replit observation; Phase 3 schema work is blocked until observation signal exists.
- INIT-003 remains waiting on later Phase 5 / promotion semantics after INIT-001 Phase 5.

No Wilson decision was needed because the chosen milestone is documented, unowned, small, and avoids the unresolved EFF-022 cuisine fallback rule.

## Changes

- `docs/evals/fixtures/pantry-recipes-dietary-halal-pork.json`: adds a synthetic `pantry_recipes` negative guard where two suggestions violate halal/no-pork constraints and require pork ingredients.
- `docs/evals/fixtures/pantry-recipes-optional-extras-required.json`: adds a synthetic negative guard where all suggestions depend on unavailable extra ingredients as required components.
- `docs/evals/fixtures/pantry-recipes-beginner-complexity.json`: adds a synthetic negative guard where recipe suggestions are too technique-heavy for a beginner request.
- `tests/unit/eval-fixtures.test.ts`: verifies the committed fixture corpus includes the new ids and preserves key fail labels.
- `docs/evals/fixtures/README.md` and `docs/evals/registry.md`: record the batch, value claim, evidence, evidence limits, and privacy/source posture.
- `initiatives/INIT-004-ai-output-quality-evals.md` and `initiatives/registry.md`: mark this branch as the active Phase 3 slice and update the next resume point.
- `efforts/effort-022-cross-cuisine-recommendation-prompts.md`: records that this adds measurement scaffolding only and leaves the cuisine fallback product decision open.

## Value / Evidence / Limits

Value claim: Pantry recipe evals should protect users from suggestions that ignore dietary restrictions, depend on unavailable shopping-list ingredients, or ask for technique beyond the user's stated skill.

Evidence: `npm run eval:fixtures` validated 10 public fixtures and reported `pantry_recipes=4`; `npx vitest run tests/unit/eval-fixtures.test.ts` passed with 11 tests and verifies fixture ids plus `dietary_compliance`, `optional_ingredient_contract`, and `skill_fit` fail-label preservation.

Evidence limits: Current automation proves artifact validity, privacy posture, response shape, deterministic label consistency, and label preservation. It does not prove live model behavior, Wilson re-labeling of these exact synthetic outputs, LLM judge calibration, taste, cuisine fit, provider behavior, prompt correctness, private-gold coverage, or production recipe quality.

## Impact on other agents

Use these fixtures as calibration probes for future `pantry_recipes` judges or Wilson review batches. Do not treat the current passing fixture validation as proof that Laica generates diet-safe, pantry-grounded, beginner-fit recipes in production.

See [`EFF-022`](../../efforts/effort-022-cross-cuisine-recommendation-prompts.md) for the current cuisine-fallback product-rule status. Cuisine-fit fixtures remain deferred unless they can be labeled without deciding whether Laica should stay literal to selected cuisines, ask for staples, or explain pantry-flexible fallback.

## Open items

- GitHub exact-head checks must run after the branch is pushed and marked ready for review; local checks are not a substitute for the required PR E2E gate.
- Wilson explicit merge instruction is still required because this is code/infrastructure fixture work, even though Replit validation is not required before merge.
- Future INIT-004 work still needs `pantry_recipes` provenance/queue behavior, private fixture workflow, Wilson review/judge calibration, daily reports, and prompt-candidate comparison before prompt activation.

## Verification

- `npm ci` passed with 0 vulnerabilities.
- Initial sandboxed `npm run eval:fixtures` failed before validation because `tsx` could not create its local IPC pipe under the sandbox (`listen EPERM ... tsx-501/...pipe`).
- Rerun `npm run eval:fixtures` with narrow escalation passed and validated 10 public fixtures: `cooking_steps=4`, `pantry_recipes=4`, `recipe_suggestions=1`, `slop_bowl=1`; 7 fixtures have resolved fail labels.
- `npx vitest run tests/unit/eval-fixtures.test.ts` passed: 1 file / 11 tests.
- `npm run check` passed.
- `npm audit --audit-level=high` passed with 0 vulnerabilities.
- `git diff --check` passed.
- `npm run test:unit` passed after the PR #191 rebase: 42 files / 313 tests.
- `npm run build` passed with existing Browserslist age, Firebase dynamic/static import, and chunk-size warnings.

Human Replit validation is not required before merge because this branch changes public offline fixture data, tests, and docs only. It does not change auth, provider calls, DB schema, deployment config, UI, persistence, secrets, prompts, runtime generation behavior, private fixture ingestion, or daily reporting.

## Stack / base status

- Base refreshed: yes
- Current base: `origin/main` at `104ee0cfc2ecb77bc7129cc64c91b1a08e8f06d1`
- Last Replit-validated at: not required before merge
- Notes: PR #204 EFF-027 closeout and PR #191 Live Cooking speech arbitration were open and treated as active owned work at intake. After Wilson requested #191 first, this branch was rebased onto `origin/main` after PR #191 merged; this branch does not touch Live Cooking runtime files.
