# GitHub Security Settings Evidence - 2026-05-18

**Repo:** `wmishak404/laica`  
**Visibility:** Public  
**Default branch:** `main`  
**Evidence sources:** Wilson GitHub UI screenshot and `gh api` read-only inspection on 2026-05-18

## Why this report exists

This records the GitHub-side guardrails added after the public-repo security remediation work. These settings are not fully represented by code in the repository, so this note preserves the current operating record for future audits and agent handoffs.

## Security and analysis settings

Observed repository settings:

- Secret scanning: **enabled**
- Secret scanning push protection: **enabled**
- Dependabot security updates: **enabled**
- Secret scanning non-provider patterns: disabled
- Secret scanning validity checks: disabled

## Branch ruleset

Observed active ruleset:

- Ruleset: `Core Ruleset 1`
- Enforcement: active
- Target: default branch (`main`)
- Bypass actors: none

Enabled branch rules:

- Restrict deletions
- Block force pushes
- Require pull request before merging
- Require conversation resolution before merging
- Require status checks to pass
- Require branches to be up to date before merging

Required status checks:

- `npm-audit`
- `trufflehog_pr`

Pull request review settings:

- Required approving reviews: `0`
- Dismiss stale approvals on push: disabled
- Require Code Owners review: disabled
- Require approval of most recent reviewable push: disabled
- Allowed merge methods: merge, squash, rebase

## Intentional exclusions

- Required approving reviews remain at `0`. Raise this to `1` later if mandatory human review becomes part of the merge policy.
- CodeQL default setup is the selected CodeQL configuration. The repository workflow file is intentionally removed to avoid duplicate advanced/default setup failures.
- CodeQL default setup is kept as an alerting layer rather than a required merge gate because the code scanning results rule blocked docs-only/process PRs when no CodeQL PR result was produced.

## Coverage against remediation plan

- Critical secret exposure response: full-history TruffleHog evidence is recorded in `docs/security/secret-scan-2026-05-18.md`; GitHub secret scanning and push protection are enabled.
- High dependency guardrail: high/critical dependency audit is required on `main` through the `npm-audit` check.
- High secret-regression guardrail: PR secret scanning is required on `main` through the `trufflehog_pr` check.
- High static-analysis guardrail: CodeQL default setup remains enabled for code scanning alerts, but is not a hard merge gate.
- Merge guardrail: `main` requires PRs, up-to-date checks, resolved conversations, no force pushes, and no branch deletions.
