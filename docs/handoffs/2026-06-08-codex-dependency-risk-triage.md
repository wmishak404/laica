# Dependency Risk Triage Kickoff

**Agent:** codex
**Branch:** codex/dependency-risk-triage
**Date:** 2026-06-08
**Initiative:** none
**INIT updated:** n/a

## Summary

Repo-risk cleanup around open dependency PRs is now set up as a dedicated workstream instead of staying buried in the standup. The durable dependency strategy record now reflects the current open PR numbers, and this handoff maps the two open dependency PRs to the next actions a follow-up window should take without publishing scanner internals or advisory-specific details in public docs.

## Changes

- `efforts/effort-023-broad-dependency-modernization-strategy.md`
  Refreshed the broad dependency modernization Effort from the old PR `#104` reference to the current broad batch PR `#134`, added the new small workflow-only PR `#147`, and recorded the recommended split path.
- `docs/handoffs/2026-06-08-codex-dependency-risk-triage.md`
  Captures the kickoff state and the next dependency-risk follow-up path.
- Workflow dependency references
  Prepared a same-repo replacement for the workflow-only dependency bump so the protected CI path could validate it without relying on a Dependabot/fork context.

## Impact on other agents

Use this branch or handoff as the starting point for the follow-up dependency-risk window.

Current recommended path:

- Use the Codex replacement branch for the small workflow-only dependency update if CI passes. Keep scanner/advisory specifics in GitHub Actions, GitHub Security, or Dependabot surfaces rather than copying them into public markdown.
- Do not merge PR `#134` as-is. It is still a monolithic broad package batch across runtime, frontend, testing, build, and provider-sdk domains.
- Replacement work for PR `#134` should be split into explicit upgrade slices from fresh `origin/main`, likely:
  - GitHub Actions / CI tooling
  - build and test toolchain
  - provider SDKs
  - server/runtime middleware
  - frontend/UI foundation
- Keep validation sized to the risk domain. Provider, auth, DB, speech, or middleware changes still need the stricter runtime evidence path; small workflow-only changes do not.

## Open items

- Open the replacement branch as a PR for the small workflow-only update, verify normal same-repo CI, then close PR `#147` as superseded.
- Decide whether to close PR `#134` immediately or leave it open until replacement slices exist.
- If replacement slices begin, keep EFF-023 as the umbrella record until the broad batch is fully superseded.

## Verification

- `git status --short --branch`
- Reviewed `efforts/effort-023-broad-dependency-modernization-strategy.md`
- Reviewed `docs/handoffs/2026-05-19-codex-dependabot-medium-low-maintenance.md`
- `git diff --check`

## Stack / base status

- Base refreshed: yes
- Current base: `origin/main` at `ba924d6ad0f7ef0906d967a25ecb95fd7319da88`
- Last Replit-validated at: not applicable for workflow-only/docs change
- Notes: rebased after PR #146 moved `main` forward.
