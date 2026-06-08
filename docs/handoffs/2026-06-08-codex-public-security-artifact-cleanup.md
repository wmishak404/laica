# Public Security Artifact Cleanup

**Agent:** codex
**Branch:** codex/public-security-artifact-cleanup
**Date:** 2026-06-08
**Initiative:** none
**INIT updated:** n/a

## Summary

This branch reduces public markdown detail around security/dependency automation artifacts while preserving the coordination decisions from the dependency-risk work. The public repo should record the outcome and next action, not scanner internals, exact security-advisory details, protected-runner mechanics, or copied scan logs.

## Changes

- Sanitized `docs/handoffs/2026-06-08-codex-dependency-risk-triage.md` to keep dependency-risk coordination while removing scanner/version and protected-CI mechanics from public prose.
- Sanitized `docs/handoffs/2026-06-08-codex-dependency-risk-closeout.md` to record PR outcomes and required-check success without copying security-check names/log details.
- Updated `efforts/effort-023-broad-dependency-modernization-strategy.md` to make the public/private boundary explicit for security advisory and scan artifacts.
- Updated `efforts/registry.md` so the EFF-023 index row does not reintroduce scanner-specific details.
- Sanitized merged PR descriptions for PR #148, PR #150, and PR #151 so public PR bodies retain outcome-level evidence and point exact security details back to GitHub Actions/Security/Dependabot.

## Rationale

Laica is a public repository. Public docs should avoid amplifying security-tool internals or advisory details. Maintainers can still inspect exact checks and logs in GitHub Actions, GitHub Security/Dependabot, and private local scan artifacts when authorized.

## Validation

- GitHub file updates were applied on a docs-only branch from `main` at `b412ad91e03cd3b6c5057f2c8f90f0c1620a553c`.
- No runtime code was changed.
- PR should run normal docs/check gates after opening.

## Remaining Work

- If sensitive details already appeared in immutable commit history or third-party notifications, this branch does not rewrite history. Escalate to Wilson/GitHub support only if an actual secret, exploit recipe, or private advisory detail was committed.
