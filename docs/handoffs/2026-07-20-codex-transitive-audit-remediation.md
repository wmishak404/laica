# Transitive dependency audit remediation

**Agent:** codex
**Branch:** codex/deps-audit-brace-expansion
**Date:** 2026-07-20
**Initiative:** none
**INIT updated:** n/a

## Summary

A registry advisory published after the earlier dependency sequence caused the default branch's high/critical audit gate to fail without any repository commit changing. This focused branch applies npm's lockfile-only remediation to the affected transitive tooling entries so new dependency and docs PRs can produce meaningful audit evidence again.

Because the repository is public, advisory identifiers, dependency paths, and scanner details remain in GitHub Security, the package registry audit response, and Actions logs rather than this public handoff.

## Changes

- Updated only `package-lock.json` through `npm audit fix --package-lock-only`.
- Moved four existing transitive lock entries to patched releases within their already-selected major lines.
- Added this handoff with evidence and negative scope.
- No direct dependency declaration, application code, workflow, schema, secret, Replit configuration, or product behavior changed.

## Impact on other agents

- Dependency branches created from `origin/main@4775ce5f` inherit the newly failing audit gate even when their package diff is unrelated.
- After this remediation merges, those branches must rebase onto fresh `origin/main`, preserve this lockfile change, and rerun their exact-head audit and normal CI gates.
- Do not copy advisory or dependency-path details into public PR prose; use the private/security tooling and run logs for those specifics.

## Open items

- Merge requires Wilson's explicit dependency/configuration authorization.
- After merge, rebase the active dependency replacement PRs in their documented lockfile order.
- Human Replit validation is not required for this lockfile-only transitive tooling remediation.

## Verification

Source provenance:

- Base: `origin/main@4775ce5fc8c0a4bd6dd5148c8e329eb5f0211038`
- Remediation source: npm registry audit metadata observed on 2026-07-20.

Observed local results:

- `npm audit fix --package-lock-only` completed and changed only the four affected transitive lock entries.
- `npm ci` passed: 1,053 packages installed, 1,054 audited, zero vulnerabilities.
- `npm run check` passed.
- `npm run build` passed with the existing Browserslist-age, Firebase mixed-import, and large-chunk warnings.
- `npm run test:unit` passed: 50 files / 389 tests.
- `npm audit --audit-level=high` passed with zero vulnerabilities.
- `git diff --check` passed.

Evidence limits:

- The branch proves dependency-graph installation, compilation, build, unit, and audit behavior. Exact-head GitHub E2E, secret scan, and CodeQL remain required before merge.
- It does not make a claim about exploitability, production reachability, or unrelated registry findings.
