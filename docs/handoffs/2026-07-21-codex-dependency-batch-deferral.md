# Dependency maintenance batch deferral

**Agent:** codex
**Branch:** codex/deps-batch-defer-closeout
**Date:** 2026-07-21
**Initiative:** none
**INIT updated:** n/a

## Summary

Wilson chose a trigger-driven dependency-maintenance posture: a newer version and passing compatibility checks do not, on their own, justify taking merge risk. The five remaining same-repository dependency replacements were closed unmerged and EFF-023 now records when future maintenance should be reconsidered.

## Changes

- Closed PR #320 (`actions/setup-node` v7) pending a CI compatibility, deprecation, enforcement, or security trigger.
- Closed PR #321 (routine npm patch wave) pending a security, automation, or observed compatibility trigger.
- Closed PR #323 (`express-rate-limit` 8.6) pending an advisory or observed limiter defect.
- Closed PR #326 (unused context-menu cleanup) because its low-risk graph cleanup was not urgent enough to justify standalone churn in this batch.
- Closed PR #327 (Multer runtime/types alignment) because its upload-boundary behavior and deferred live validation outweighed the current maintenance benefit.
- Updated EFF-023 with the trigger rule and the distinction between this batch, merged audit remediation PR #322, and separately deferred Replit Cartographer PR #316.

No dependency, lockfile, application, workflow, schema, secret, deployment, UI, or runtime change is included in this closeout branch.

## Impact on other agents

Do not reopen or merge the closed replacement heads based on their historical green checks. When a security scan, dependency automation result, platform requirement, observed bug, or accepted modernization objective creates a concrete trigger, start from fresh `origin/main`, reassess scope and risk, and generate new exact-head evidence.

EFF-023 remains the durable home for broad dependency-modernization strategy. No INIT state changed.

## Open items

- Continue normal security and dependency automation monitoring.
- Reconsider only the smallest affected dependency slice when a concrete trigger appears.
- PR #316 remains deferred until direct Replit development validation is available.

## Verification

- GitHub reported PRs #320, #321, #323, #326, and #327 closed and unmerged after their deferral comments were added.
- The live open PR queue was checked so unrelated PRs were not changed.
- Documentation-only diff; no code or package validation is claimed or required.
