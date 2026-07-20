# Remove unused resizable panels dependency

**Agent:** codex
**Branch:** `codex/deps-remove-resizable-panels`
**Date:** 2026-07-20
**Initiative:** none
**INIT updated:** n/a
**Resolves blocked handoff:** none

## Summary

This cleanup supersedes Dependabot PR #255 by removing the unused `react-resizable-panels` dependency and its sole wrapper instead of upgrading a dead UI path across a major-version boundary. Repository-wide inspection found no consumer of the wrapper or its exported resizable primitives, so the dependency adds install and maintenance surface without contributing to a rendered application surface.

## Changes

- Deletes `client/src/components/ui/resizable.tsx`, the only repository import of `react-resizable-panels`.
- Removes the direct `react-resizable-panels` dependency from `package.json` and its package-lock entries.
- Adds this handoff with the supersession and validation boundary.

## Impact on other agents

Treat Dependabot PR #255 as superseded once the replacement PR exists. If a future accepted design needs resizable panels, select and add the dependency against that concrete surface and current API rather than restoring the unused wrapper from history.

This conforms to PD-005: it removes an unconsumed file from the governed `client/src/components/ui` primitive boundary without introducing a parallel component path, token/style exception, scoped-class reuse, or primitive override. It does not add, remove, rename, reorder, or change visibility for any durable navigation surface. No visible UI behavior changes because the wrapper had no consumers.

This is a narrow frontend-dependency cleanup consistent with EFF-023's split-by-risk direction. It does not reopen or advance the deferred broad dependency-modernization effort, and it does not remove any unrelated package.

## Open items

- Wait for the same-repository PR's exact-head GitHub `unit`, `e2e_guest_smoke`, dependency-audit, TruffleHog, and CodeQL evidence after it is marked ready for review.
- The dependency-PR coordinator owns closing PR #255 as superseded after the replacement exists.

## Verification

- Repository-wide `rg` found no consumer of `resizable.tsx`, `react-resizable-panels`, or the wrapper's exported primitive names after deletion.
- `npm ci` passed and reported zero vulnerabilities.
- `npm run check` passed.
- `npm run build` passed with the existing Browserslist-age, Firebase dynamic/static import, and large-chunk warnings.
- `npm run test:unit` passed: 50 files / 389 tests.
- `npm audit --audit-level=high` passed with zero vulnerabilities.
- `git diff --check origin/main...HEAD` passed.
- GitHub exact-head checks are pending until the branch is pushed and the draft PR is opened.

## Evidence limits

Static no-consumer evidence plus the full unit/type/build gate supports the claim that this is dead-path removal. It does not prove every deployed interaction through live-provider or Replit execution, and it does not establish a future resizable-panel design or dependency choice.

Human Replit validation is not required because no rendered UI, runtime route, schema, auth/provider contract, deployment startup, or navigation behavior changes. Exact-head same-repository E2E remains the automated merge gate after ready-for-review.

## Stack / base status

- Base refreshed: yes
- Current base: `origin/main` at `92b406d54aa25ba219c13d19daccb230c9c9ce0b`
- Last Replit-validated at: not applicable
- Notes: independent dependency-cleanup replacement rebased after dependency PRs #306, #307, and #309 merged; their current-main dependency updates are preserved, and this branch removes only `react-resizable-panels` plus its unused wrapper.
