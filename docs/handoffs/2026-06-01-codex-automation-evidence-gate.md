# 2026-06-01 — Automation evidence gate workflow update

## Summary

Wilson accepted the evidence shape from the PR #118 CI proof as the standard for automation-backed merge gates. Automated checks can support merge readiness only when the PR or handoff presents the evidence, reasoning, and provenance needed to understand what was actually proven.

## Durable Updates

- `docs/workflows/operating-principles.md`
  - Added the principle that automated tests are evidence, not conclusions.
  - Added an Automated Test Evidence Standard covering scope, provenance, observed evidence, reasoning, negative scope, and future eval gates.
- `docs/workflows/testing-and-acceptance.md`
  - Added an Automation Evidence Gate section.
  - Required automation evidence reports in implementation handoffs and PR descriptions when automation is used as a merge gate.
- `.github/PULL_REQUEST_TEMPLATE.md`
  - Added an automation-evidence block under Validation so reviewers see the gate at merge time.
- `docs/workflows/agent-merge-authority.md`
  - Clarified that code and deployment-bound PRs need automation evidence reports when automated checks are used as merge-readiness proof.
- `AGENTS.md` and `CLAUDE.md`
  - Added quick-start reminders that CI/Playwright/`db:health`/future eval merge claims need evidence reports, not just "tests passed."
- `efforts/effort-017-environment-parity-and-ci-confidence.md`
  - Recorded the accepted standard as part of the environment-parity/CI-confidence effort.
- `initiatives/INIT-002-ai-error-telemetry.md`
  - Added the future eval-gate requirement and privacy/redaction provenance expectations.

## Required Evidence Shape

For automated tests used as merge-readiness evidence, the PR or handoff must include:

- claimed behavior
- command/check provenance
- source provenance
- observed result
- reasoning
- negative scope

For eval-backed gates, also include dataset/fixture identity, evaluator/prompt/model version when relevant, metric/threshold, sample size, failure examples or cluster summaries, privacy/redaction posture, and artifact location.

## Validation

- `git diff --check`

Replit validation: not required. This is workflow/documentation governance only.

## Next

Future code PRs that rely on automation should use the new PR-template evidence block before merge. EFF-017 remains the active home for CI-confidence follow-through, and INIT-002 should apply the same evidence standard when eval-backed gates are introduced.
