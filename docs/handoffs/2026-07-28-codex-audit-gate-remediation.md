# Dependency audit gate remediation

**Agent:** codex
**Branch:** codex/audit-remediation-npm10-20260728
**Date:** 2026-07-28
**Initiative:** none
**INIT updated:** n/a
**Resolves blocked handoff:** none

## Summary

A dependency audit metadata update caused the high/critical gate to fail on docs-only PR #344 even though that branch does not change dependencies. Wilson authorized a separate narrow remediation before PR #344 merges. This branch applies npm's current lockfile-only correction and leaves direct dependency declarations, application behavior, and the broad patch-maintenance lane unchanged.

Because the repository is public, advisory identifiers, dependency paths, and scanner details remain in GitHub Security, registry audit output, and Actions logs rather than this public handoff.

## Changes

- `package-lock.json`
  - Applies `npm audit fix --package-lock-only` using npm 10.9.0.
  - Resolves the current audit findings through patched and deduplicated transitive entries.
- `efforts/effort-023-broad-dependency-modernization-strategy.md`
  - Records the security trigger and why the broad patch-update PR #339 is not the remediation unit.
- `docs/handoffs/2026-07-28-codex-audit-gate-remediation.md`
  - Records scope, validation provenance, negative scope, and the PR #344 dependency.

No direct dependency declaration, application code, workflow, schema, secret, Replit configuration, or product behavior changed.

## Impact on other agents

- PR #344 should rebase onto fresh `origin/main` after this remediation merges, then rerun its exact-head audit before merge.
- Other open branches that carry `package-lock.json` should refresh from the remediated `main` instead of recreating the audit fix independently.
- PR #339 remains a separate broad patch-maintenance proposal. Do not merge or copy its 21-package scope merely to clear this gate.
- Continue to keep unresolved advisory and dependency-path details out of public repository prose.

## Open items

- Publish this branch as a focused dependency-remediation PR.
- Require exact-head GitHub CI/E2E, dependency-audit, secret-scan, and CodeQL evidence before merge.
- After merge, refresh and merge PR #344, then perform its INIT/Effort post-merge closeout.
- Human Replit validation is not required because this branch changes only transitive lockfile resolution and documentation.

## Verification

Source provenance:

- Base: `origin/main` at `616f4c65c453ef072d5b9116b6b36f118d6469ee`.
- Remediation source: npm registry audit metadata observed in PR #344 workflow run `30388116899`.
- Local runtime: Node `24.14.1` with npm `10.9.0` invoked explicitly for lockfile generation and installation; exact-head GitHub will cover the repository's CI runner.

Observed local results:

- `npx --yes npm@10.9.0 audit fix --package-lock-only`: completed; zero vulnerabilities reported.
- `npx --yes npm@10.9.0 ci`: passed; 1,017 packages installed and 1,018 audited with zero vulnerabilities.
- `npm run check`: passed.
- `npm run build`: passed with existing Browserslist-age, Firebase mixed-import, and large-chunk warnings.
- `npm run test:unit`: passed, 51 files / 401 tests.
- `npm audit --audit-level=high`: passed with zero vulnerabilities.
- `git diff --check`: passed.

Evidence limits:

- Local evidence proves deterministic install, compilation, build, unit, and current registry audit behavior for the remediated lockfile.
- Exact-head GitHub E2E, security workflows, and CI-runner behavior remain pending until the branch is pushed.
- No claim is made about exploitability, production reachability, or unrelated future registry findings.
