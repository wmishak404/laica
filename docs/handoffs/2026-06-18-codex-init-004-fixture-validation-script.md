# INIT-004 fixture validation script

**Agent:** codex
**Branch:** `codex/init-004-fixture-validation-script`
**Date:** 2026-06-18
**Initiative:** INIT-004
**INIT updated:** yes
**PR:** [#200](https://github.com/wmishak404/laica/pull/200) (ready for review)

## Summary

This branch continues INIT-004 Phase 3 with one bounded harness-usability milestone: public eval fixtures now have a dedicated validation command, `npm run eval:fixtures`. The user/operator value is clearer eval evidence: future agents can verify that the committed public fixture corpus is schema-valid, privacy-checked, surface-valid, and label-consistent before using it as regression or judge-calibration input.

The branch does not add fixtures, change prompts, call providers, ingest private fixtures, write eval data, change schema, expose runtime behavior, activate daily reports, or resolve EFF-022 cuisine fallback behavior.

## Changes

- `scripts/validate-eval-fixtures.ts`: adds a focused public fixture corpus validator that loads committed fixtures and prints fixture count, surface counts, resolved-fail-label count, and fixture ids.
- `package.json`: adds `npm run eval:fixtures`.
- `docs/evals/fixtures/README.md`: documents the new focused fixture validation lane and keeps focused Vitest as validator behavior coverage.
- `docs/evals/registry.md`: records that fixture-validation scripting is now active on this branch.
- `initiatives/INIT-004-ai-output-quality-evals.md` and `initiatives/registry.md`: mark the active branch and update the Phase 3 resume point.

## Value / Evidence / Limits

Value claim: Public eval fixtures should be quick to validate and easy to cite, so future prompt/eval work does not confuse fixture artifact validity with broader model-quality proof.

Evidence: Intended validation is `npm run eval:fixtures`, `npx vitest run tests/unit/eval-fixtures.test.ts`, full unit suite, `npm run check`, `npm audit --audit-level=high`, `npm run build`, and whitespace checks on this branch.

Evidence limits: The new command proves committed public fixture artifacts load and pass existing deterministic artifact rules. It does not prove live model quality, judge calibration, production cooking safety, taste, cuisine fit, provider behavior, private-gold coverage, or prompt correctness.

## Impact on other agents

Use `npm run eval:fixtures` as the focused artifact-validity command when adding or reviewing public fixture changes. Keep `npx vitest run tests/unit/eval-fixtures.test.ts` when changing validator behavior, deterministic checks, privacy scanning, or runtime-source guards.

EFF-022 remains open. This branch does not change cuisine prompt behavior, cuisine-fit criteria, cuisine picker options, or pantry-constrained fallback rules.

## Open items

- Wilson explicit merge decision is required; this is a code/infrastructure PR.
- Future INIT-004 work still needs the next small user-expectation fixture batch, `pantry_recipes` provenance work, private fixture workflow, Wilson review/judge calibration, daily reports, and prompt-candidate comparison before prompt activation.

## Verification

- `npm ci` passed with 0 vulnerabilities.
- First `npm run eval:fixtures` attempt failed inside the sandbox because `tsx` could not create its local IPC pipe. Rerunning the same command with the narrow approved escalation passed and validated 7 public fixtures.
- `npx vitest run tests/unit/eval-fixtures.test.ts` passed: 1 file / 11 tests.
- `npm run test:unit` passed: 42 files / 292 tests.
- `npm run check` passed.
- `npm audit --audit-level=high` passed with 0 vulnerabilities.
- `npm run build` passed with existing Browserslist age, Firebase dynamic-import, and chunk-size warnings.
- `git diff --check` and `git diff --cached --check` passed.
- GitHub exact-head checks are tracked in PR #200's body so the branch handoff does not require a new commit every time CI re-runs.

## Stack / Base Status

- Base refreshed: yes
- Current base: `origin/main` at `0462db2b061ab9d8ecc942eaf284090b1b26b87d`
- Last Replit-validated at: not required; offline eval tooling/docs only
- Notes: PR #191 is open but checked out in another Codex worktree and was not touched. PR #196 is awaiting Claude review and was not touched. Dependabot PR #195 is separate dependency work and was not touched.
