# Dependency Risk Triage Kickoff

**Agent:** codex
**Branch:** codex/dependency-risk-triage
**Date:** 2026-06-08
**Initiative:** none
**INIT updated:** n/a

## Summary

Repo-risk cleanup around open dependency PRs is now set up as a dedicated workstream instead of staying buried in the standup. The durable dependency strategy record now reflects the current open PR numbers, and this handoff maps the two open dependency PRs to the next actions a follow-up window should take.

## Changes

- `efforts/effort-023-broad-dependency-modernization-strategy.md`
  Refreshed the broad dependency modernization Effort from the old PR `#104` reference to the current broad batch PR `#134`, added the new small workflow-only PR `#147`, and recorded the recommended split path.
- `docs/handoffs/2026-06-08-codex-dependency-risk-triage.md`
  Captures the kickoff state and the exact next slices for follow-up execution.
- `.github/workflows/ci.yml`
  Bumps `actions/upload-artifact` from `v6` to `v7` for the unit coverage summary artifact.
- `.github/workflows/secret-scan.yml`
  Bumps TruffleHog from `v3.95.3` to `v3.95.5` in both the action reference and the explicit `version` input. Dependabot PR `#147` only changed the action reference, so this branch keeps the wrapper and scanner version aligned.

## Impact on other agents

Use this branch or handoff as the starting point for the follow-up dependency-risk window.

Current recommended path:

- Use this branch as the replacement for PR `#147` if CI passes. The Dependabot PR is low risk, but its CI is blocked by missing secrets in the Dependabot context and its TruffleHog bump leaves the explicit scanner `version` input behind.
- Do not merge PR `#134` as-is. It is still a monolithic `85`-package batch with multi-major changes across React, Express, Tailwind, TypeScript, Vite, OpenAI, ElevenLabs, and related tooling.
- Replacement work for PR `#134` should be split into explicit upgrade slices from fresh `origin/main`, likely:
  - GitHub Actions / CI tooling
  - build and test toolchain
  - provider SDKs
  - server/runtime middleware
  - frontend/UI foundation
- Keep validation sized to the risk domain. Provider, auth, DB, speech, or middleware changes still need the stricter runtime evidence path; small workflow-only changes do not.

## Open items

- Open this branch as a replacement PR for `#147`, verify normal same-repo CI, then close PR `#147` as superseded.
- Decide whether to close PR `#134` immediately or leave it open until replacement slices exist.
- If replacement slices begin, keep EFF-023 as the umbrella record until the broad batch is fully superseded.

## Verification

- `git status --short --branch`
- Reviewed `efforts/effort-023-broad-dependency-modernization-strategy.md`
- Reviewed `docs/handoffs/2026-05-19-codex-dependabot-medium-low-maintenance.md`
