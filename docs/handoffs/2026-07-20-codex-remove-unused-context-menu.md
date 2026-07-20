# Remove unused context-menu primitive and dependency

**Agent:** codex
**Branch:** codex/deps-remove-context-menu
**Date:** 2026-07-20
**Initiative:** none
**INIT updated:** n/a

## Summary

This focused cleanup supersedes Dependabot PR #317 by deleting LAICA's unconsumed context-menu wrapper and direct Radix dependency instead of upgrading a dead UI path. Repository-wide inspection found no importer of any exported context-menu primitive, so the change removes inactive governed-primitive and dependency surface without changing rendered behavior.

## Changes

- Deleted `client/src/components/ui/context-menu.tsx`.
- Removed only `@radix-ui/react-context-menu` from `package.json` and its resulting lock entries from `package-lock.json`.
- Added this durable handoff.

## Impact on other agents

- Do not merge or revive Dependabot PR #317; use the same-repository cleanup PR for exact-head evidence.
- If a future accepted surface needs a context menu, choose and add the dependency deliberately against that surface's interaction and accessibility requirements instead of restoring this unused wrapper by default.
- This conforms to PD-005 by deleting an unconsumed file from the governed `client/src/components/ui` boundary without creating a parallel component path, styling exception, or token change.
- No navigation item, order, label, visibility rule, or app-shell action changed.
- EFF-023: conforms to the split-by-risk dependency direction; no Effort status change.

## Open items

- Exact-head GitHub CI/E2E, dependency audit, TruffleHog, and CodeQL must pass before merge readiness.
- Human Replit or visual validation is not required because no application surface consumed the wrapper.
- Dependency/configuration merge requires Wilson's explicit approval.

## Verification

Source provenance:

- Base: `origin/main@04b88c5cd4be383771d690a250cafda5eb031a03`
- Dependabot PR #317 proposed `@radix-ui/react-context-menu` `2.2.7` to `2.3.4`.

Observed local results:

- Repository-wide `rg` found no context-menu reference after deletion.
- `npm ci` passed: 1,051 packages installed / 1,052 audited.
- `npm run check` passed.
- `npm run build` passed with the existing Browserslist-age, Firebase mixed-import, and large-chunk warnings.
- `npm run test:unit` passed: 50 files / 389 tests.
- `npm audit --audit-level=high` passed; the existing moderate default-branch finding remains outside this cleanup.
- `git diff --check` passed.

Evidence limits:

- Static no-consumer inspection plus install/compile/build/unit evidence supports dead-path removal. It does not choose a future context-menu library or validate an interaction that does not currently exist.
- No browser, live provider, Replit, schema, auth, prompt, deployment, or production behavior changed.
