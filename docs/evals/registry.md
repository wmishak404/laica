# AI Eval Intake Registry

Durable index of AI output-quality eval runs, open-coding imports, judge runs, human review batches, and daily reports.

Use [docs/workflows/evaluations.md](../workflows/evaluations.md) for the canonical eval discipline, evidence standard, calibration rules, privacy posture, and prompt-activation policy.

The registry survives INIT closeout. Active INITs should link here for current work, but this file remains the long-term lookup table.

| Intake id | Source | Source date | Provided / imported | Surface | Sample size | Trend tags | Record | Raw artifact handling | Current status | Next action |
|---|---|---|---|---|---|---|---|---|---|---|
| `openai-platform-evalrun-685361470e9c819195a768074ef126cd` | OpenAI Platform eval export | File timestamp 2026-06-04; user remembered June 4, 2025 | 2026-06-09 | Legacy recipe suggestion eval | 25 items; 150 criterion checks | `structure-contract`, `max-time`, `judge-calibration-gap`, `legacy-contract-drift` | [record](intakes/openai-platform-evalrun-685361470e9c819195a768074ef126cd.md) | Local JSONL only; summarized in registry/record/handoff; not committed | Seed run indexed; 149/150 grader passes; one max-time failure; one invalid JSON case still passed LLM judges | Phase 1 should extract fixture candidates and deterministic contract checks |
| `arize-open-coding-2025-11-07` | Arize open-coding notes | 2025-11-07 note timestamps | 2026-06-09 | Legacy pantry-first recipe suggestions | 18 notes across 16 unique examples | `food-safety`, `proficiency-fit`, `equipment-fit`, `max-time`, `cuisine-pantry-tradeoff`, `structure-contract` | [record](intakes/arize-open-coding-2025-11-07.md) | Raw prompt/table provided in chat; summarized in registry/record/handoff; not committed | Seed intake indexed; clusters identified for food safety, proficiency fit, equipment, time, cuisine/pantry tradeoff, and format fragility | Phase 1 should map clusters into label schema and fixture candidates |
| `public-fixtures-2026-06-16` | Public synthetic fixture set | 2026-06-16 | 2026-06-16 | Recipe suggestions, pantry recipes, Slop Bowl, cooking steps | 4 fixtures | `structure-contract`, `max-time`, `current-shape`, `expected-negative` | [fixtures](fixtures/README.md) | Synthetic only; no raw real rows, private gold fixtures, provider outputs, user ids, or exact private timestamps committed | Merged in PR #190 as `0027908`: first public CI-visible fixture set added, plus expected deterministic failure semantics and value/evidence/limits verification discipline. Dedicated validation script merged in PR [#200](https://github.com/wmishak404/laica/pull/200) as `bb5604f`. | Use `npm run eval:fixtures` as the focused public-fixture validation evidence lane; add the next bounded user-expectation fixture batch before judge/provider work |
| `public-cooking-step-user-expectation-fixtures-2026-06-17` | Public synthetic fixture batch | 2026-06-17 | 2026-06-17 | Cooking steps | 3 fixtures | `food-safety`, `skill-fit`, `equipment-fit`, `cooking-step-sequence` | [fixtures](fixtures/README.md) | Synthetic only; no raw real rows, private gold fixtures, provider outputs, user ids, request ids, or exact private timestamps committed | Merged in PR [#198](https://github.com/wmishak404/laica/pull/198) as `9588459`: user-expectation negative guards for raw beef doneness, chicken doneness, and missing-lid alternatives are on `main` | Use the fixture labels for future Wilson review and judge calibration; do not treat the current structure/privacy Vitest lane as live cooking-safety proof |
| `speech-interaction-acceptance-seed-2026-06-17` | Wilson manual review questions | 2026-06-17 | 2026-06-17 | Live Cooking speech interaction | 12 acceptance scenarios | `speech-arbitration`, `transcript-fidelity`, `mute-persistence`, `hands-busy-guidance`, `goal-value-acceptance` | [record](intakes/speech-interaction-acceptance-seed-2026-06-17.md) | Chat-derived summary only; no raw audio or production traces committed | Implemented on PR #191 branch: 12 scenarios converted into deterministic unit assertions in `tests/unit/live-cooking-guest-session.test.tsx`; focused run passed 18/18 tests locally on 2026-06-18; not part of INIT-004 Phase 3 V1 harness | Use as PR #191 arbitration evidence after exact-head full validation; decide later whether real speech quality needs a live-provider canary or release-batch Replit/mobile smoke |

## Cross-Intake Trend Comparison

| Trend | OpenAI Platform seed | Arize seed | First-rubric implication |
|---|---|---|---|
| Structure/contract fragility | Invalid JSON passed LLM judging | Markdown extraction produced fragile recipe-title values | Deterministic parse/schema checks must run before any judge score |
| Max-time adherence | One 25-minute max returned 30 minutes | One 25-minute max returned 30 minutes | Add deterministic max-time check and clarify rounding cannot exceed max unless Wilson accepts an explicit exception |
| Judge calibration gap | Automated judge pass rates lack human TPR/TNR | Human notes lack automated judge observations | Build Wilson-labeled gold set, then report TPR/TNR before trusting LLM judges |
| Food safety and doneness | Automated food-safety grader passed all items | Human notes found raw beef/chicken safety gaps | Food-safety judge needs human calibration and likely stricter raw-protein criteria |
| Proficiency and equipment fit | Automated required-skill grader passed all items | Human notes found beginner complexity and missing-equipment assumptions | Add criterion-level human labels for skill/equipment fit; deterministic equipment term checks where practical |
| Cuisine/pantry tradeoff | No strong cuisine-failure signal from this run; legacy ingredient relevance passed | Human notes accepted some pantry-first adaptation but flagged authenticity nuance | Rubric should separate pantry-first usefulness from cuisine authenticity rather than treating either as absolute |

## Registry Rules

- Add future eval imports to the table before using them as evidence in an INIT, PR, or handoff.
- Keep raw artifact handling explicit.
- Mark calibration status honestly. Uncalibrated LLM judge results are triage signal, not product-quality truth.
- Use [intakes/TEMPLATE.md](intakes/TEMPLATE.md) for new intake records.
