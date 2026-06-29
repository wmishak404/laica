# PR #232 Eval Taxonomy Merge Closeout

**Agent:** codex
**Branch:** `codex/pr232-merge-closeout`
**Date:** 2026-06-29
**Initiative:** INIT-004
**INIT updated:** yes

## Summary

PR #232 is merged, so INIT-004 no longer has an active eval-summary/taxonomy PR. Laica's eval admin/reporting layer can now show which pending rows are eligible for current criteria, summarize completed evals by product surface and prompt version, and use clearer recipe-generation report keys: `chef_it_up_suggestions` and `slop_bowl_suggestions`. Older `pantry_recipes` and `slop_bowl` rows still normalize into the canonical keys, so historical eval data remains readable without a DB migration.

## Changes

- `initiatives/INIT-004-ai-output-quality-evals.md`: marks PR #232 merged as `5b8e7ed`, records final exact-head evidence after the rebase onto `origin/main` `11b1847`, and updates the Phase 3 resume point.
- `initiatives/registry.md`: clears the stale active PR wording and records the merged eval-summary/taxonomy signal.
- `efforts/effort-022-cross-cuisine-recommendation-prompts.md` and `efforts/registry.md`: record that Chef It Up eval reporting now uses `chef_it_up_suggestions` while EFF-022 product decisions remain unresolved.
- `docs/evals/registry.md`: records that PR #232 merged the public fixture id rename and alias compatibility.
- `docs/handoffs/2026-06-29-codex-pr232-merge-closeout.md`: durable closeout handoff for other agents.

## Impact on other agents

Future INIT-004 reporting work should start from fresh `origin/main` after PR #232 and this closeout. Use `featureReports` and `promptVersionReports` from `/api/admin/eval/summary` for product-surface and prompt-version interpretation. Do not read a top-level pass rate as product quality; top-level totals are counts only, while rate/score signals are scoped to feature and prompt-version reports.

EFF-022 is still open. This merge does not audit cuisine picker behavior, change recipe prompts, add multi-cuisine guidance, add cuisine-fit/fusion fixtures, change card display guidance, or decide selected-cuisine fallback behavior.

## Open items

- Open and merge this docs-only closeout PR under documented evidence-closeout authority if checks pass and no human/product/security/Replit decision remains.
- Next INIT-004 candidates remain narrow LLM-judge work after fixture labels/checks, non-duplicative fixtures for accepted label gaps, or a small report artifact/export path using the new summary fields without running live providers or changing prompts.

## Verification

- PR #232 was rebased after `origin/main` moved to `11b1847931f6e2f7ac79e34c5ac97ad736c60b50`.
- PR #232 final head `2c788134bbe3218103b2965adcff515e49ad7846` passed local focused eval Vitest, `npm run eval:fixtures`, full `npm run test:unit`, `npm run check`, `npm audit --audit-level=high`, `npm run build`, and `git diff --check origin/main...HEAD`.
- PR #232 final head passed GitHub `unit`, `e2e_guest_smoke`, `npm-audit`, `trufflehog_pr`, CodeQL action/javascript analyses, and CodeQL summary before Wilson's merge instruction was applied.
- PR #232 merged as `5b8e7ed9156c30dffdbf962d53fd569306f6c241`.
- This closeout branch was rebased onto `origin/main` at `bc9290c2bdfb01a1133fd2d5c5d01665d60b46a8` after PR #234 merged.
- This closeout branch is docs-only; run whitespace checks before merging the closeout PR.

## Stack / base status

- Base refreshed: yes
- Current base: `origin/main` at `bc9290c2bdfb01a1133fd2d5c5d01665d60b46a8`
- Last Replit-validated at: not applicable; PR #232 was local/admin eval reporting plumbing and this closeout is docs-only
- Notes: created immediately after PR #232 merged from fresh `origin/main`, then rebased after PR #236, PR #240, and PR #234 moved `main`; no lower INIT-004 PR is open.
