# INIT-004 Output-Quality Evals Filing

**Agent:** codex
**Branch:** `codex/init-004-output-evals`
**Date:** 2026-06-09
**Initiative:** INIT-004
**INIT updated:** yes

## Summary

Wilson decided AI output-quality evals should be a standalone initiative rather than being folded into INIT-002. This branch files INIT-004 as the durable source of truth for quantitative recipe/Slop Bowl/cooking-step evals, human review, judge calibration, daily reporting, and prompt-improvement workflow, while leaving INIT-002 focused on operational AI error telemetry.

The work is docs-only. No runtime behavior, schema, prompt, or eval harness changed in this branch.

## Changes

- `initiatives/INIT-004-ai-output-quality-evals.md` - new INIT hub covering scope, INIT-002 boundary, source docs, seed data, Arize open-coding clusters, initial rubric, TPR/TNR measurement policy, human review loop, daily reporting preference, prompt-candidate policy, phases, validation state, and current resume point.
- `initiatives/registry.md` - added INIT-004 to the searchable registry.
- `initiatives/README.md` - added INIT-004 to the current initiatives list.
- `AGENTS.md` and `CLAUDE.md` - added INIT-004 to active INIT read-before lists.
- `initiatives/INIT-002-ai-error-telemetry.md` - added boundary notes that successful/partial output-quality evals now belong to INIT-004 while INIT-002 owns operational failures and safe cluster handoff.
- `efforts/effort-022-cross-cuisine-recommendation-prompts.md` - linked EFF-022's cuisine-fit fixtures to INIT-004 and clarified the Effort/INIT ownership split.
- `docs/handoffs/2026-06-09-codex-init-004-output-evals.md` - this handoff.

## Impact on other agents

Read `initiatives/INIT-004-ai-output-quality-evals.md` before changing recipe, Slop Bowl, or cooking-step eval criteria; human label schemas; LLM-as-judge prompts; daily eval reports; prompt-candidate automation; or prompt examples derived from eval findings.

Read both INIT-004 and EFF-022 before changing cuisine-fit evaluation or prompt language. EFF-022 owns the product decision around cuisine alignment and pantry-constrained fallback behavior. INIT-004 owns the measurement and reporting machinery.

Read INIT-002 only for operational failure telemetry and safe error-cluster handoff. The session grounding from Codex thread `019ead6c-2397-7e92-894d-27b30a119b4c` reinforced that PR #159 / INIT-002 Phase 1 should remain focused and should not absorb this planning INIT.

Local seed artifacts reviewed or referenced but not committed:

- `/Users/wilsonishak-macbookpro/Documents/cowork/llm_eval_course_notes.pdf`
- `/Users/wilsonishak-macbookpro/Downloads/eval_items_OutputDataItemStatusParam.ALL_2026-06-04_17-55-13.jsonl`

Phase 0 takeaways from those artifacts are summarized in the INIT. The OpenAI Platform export had 25 items from `evalrun_685361470e9c819195a768074ef126cd`, generated with `gpt-4.1-2025-04-14`, graded with `o3-mini-2025-01-31`, and showed 149/150 criterion-level passes. One max-time criterion failed, and at least one invalid JSON output still passed all LLM-judge checks, which is why INIT-004 calls for deterministic contract checks alongside LLM judges.

Wilson later provided Arize open-coding data in chat. The raw prompt/table are not committed, but INIT-004 now summarizes the seed signal: 18 notes across 16 unique examples from 2025-11-07, with 9 explicit positive/no-issue notes and issue clusters around food safety/doneness, proficiency fit, equipment availability, cook-time adherence, cuisine/pantry tradeoff, and Markdown extraction/format fragility.

INIT-004 also now includes an `Eval Intake Record Structure`. Future eval imports should use that template so source summaries, input schemas, sample sizes, calibration status, failure clusters, positive examples, fixture candidates, privacy posture, and open deferrals remain readable and durable.

## Open items

- Arize open-coding data has been summarized in INIT-004. Phase 1 should map those clusters into a label schema and fixture candidates, but should not commit the raw chat table without a separate privacy/source decision.
- No raw local exports are committed. Future agents should not commit them without a separate privacy/source decision.
- Future eval intake should use INIT-004's `Eval Intake Record Structure`; do not add ad hoc raw tables to handoffs when a summarized source/rubric/metrics record would be enough.
- Phase 1 still needs a code/data audit of `server/openai.ts`, `server/evaluator.ts`, `server/eval-criteria.ts`, `server/admin-routes.ts`, `shared/schema.ts`, and client cuisine/time/preference packaging.
- The exact daily-report scheduler is still a Phase 4 decision. Wilson prefers daily automation over an admin dashboard for v1.
- Prompt improvements should produce inactive candidates and regression comparisons; no automatic production activation without Wilson approval.

## Verification

Docs-only branch. Verification completed:

- `git diff --check` passed.
- Manual `rg` review confirmed AGENTS.md, CLAUDE.md, `initiatives/README.md`, `initiatives/registry.md`, INIT-002, EFF-022, and this handoff link to INIT-004.
- Manual read-through confirmed INIT-002 boundary language does not assume PR #159 has merged.

No local build, Replit validation, DB migration, or runtime smoke test is required for this filing.

## Stack / base status

- Base refreshed: yes
- Current base: `origin/main` at `180960b`
- Last Replit-validated at: not yet validated
- Notes: branch `codex/init-004-output-evals` was rebased onto current `origin/main` before docs edits. This is independent docs-planning work, not stacked on PR #159.
