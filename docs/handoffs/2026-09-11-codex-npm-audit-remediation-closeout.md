# npm audit remediation merge closeout

**Agent:** codex
**Branch:** `codex/npm-audit-2026-09-11-closeout`
**Date:** 2026-09-11
**Initiative:** none
**INIT updated:** n/a
**Resolves blocked handoff:** none

## Summary

Wilson explicitly approved the prepared merge sequence, and dependency/security PR #364 merged into `main` as `008d2e32bd9ae8fb4feac05bc65ec22f40c0b3f4`. Its exact-head automation passed, restoring the repository-wide high/critical dependency gate without expanding into broad modernization or mixing lockfile work into INIT-005.

This fact-only closeout updates the durable evidence and hands PR #363 back to its docs-only readiness sequence.

## Merge evidence

- PR: #364, `Build: refresh audited dependency resolutions`.
- Exact validated head: `9923564dde4f9f2a009d87db321a802ead5d8a17`.
- Squash merge on `main`: `008d2e32bd9ae8fb4feac05bc65ec22f40c0b3f4`.
- GitHub run `34672455896`: unit/typecheck/build/coverage passed; schema-backed guest + linked E2E passed; disposable Neon creation, schema apply/health, and deletion succeeded.
- Dependency audit, TruffleHog PR scan, CodeQL Actions, CodeQL JavaScript/TypeScript, and standalone CodeQL passed on the same head.
- No human Replit validation was claimed or required before merge. Replit Agent was not used.

## Changes in this closeout

- EFF-017 records the successful exact-head security-gate and E2E evidence while remaining `In Progress`.
- EFF-023 records completion of this concrete trigger while broad modernization remains `Deferred`.
- The production validation registry identifies the merge as the current runtime candidate and retains one bounded audio-question upload/transcription check for the next selected release.
- The original remediation handoff links to this final outcome.

No lockfile, package manifest, application source, test, workflow, secret, schema, product decision, deployment configuration, or INIT state changes in this closeout.

## Resume point

1. Merge this fact-only closeout under the docs/evidence closeout authority after its exact-head checks pass.
2. Refresh PR #363 from fresh `origin/main` after the closeout merges.
3. Rerun every required check on PR #363's rebased exact head.
4. Update PR #363's evidence and confirm its docs-only merge readiness. Do not recreate the dependency patch on that branch.

The production audio-question check remains deferred to the next selected release containing PR #364. No production publish or runtime smoke occurred in this closeout.
