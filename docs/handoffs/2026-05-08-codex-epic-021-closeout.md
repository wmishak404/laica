# EFF-021 closeout

**Agent:** codex
**Branch:** codex/epic-021-closeout
**Date:** 2026-05-08
**Initiative:** INIT-001
**INIT updated:** yes

## Summary

Closed [EFF-021](../../efforts/effort-021-scan-upload-photo-limit-policy.md) after Wilson confirmed provider-level multi-image batching and final adaptive chunk thresholds are not needed at this point. The validated PR #53 runtime slice is the accepted resolution: shared 20-photo Pantry/Kitchen refresh caps, 40/day per-area limits, bounded 4-at-a-time scan processing, image-count rate limits, scan progress/partial-success copy, active Settings scan cancellation/stale-result protection, and empty-Pantry returning-user guardrails.

## Changes

- `efforts/effort-021-scan-upload-photo-limit-policy.md`: flipped status to `Resolved`, updated decision language from provider-level batching to accepted bounded concurrency, and added a final resolution note.
- `efforts/README.md`: removed EFF-021 from the active read list.
- `efforts/registry.md`: marked EFF-021 resolved on 2026-05-08.
- `product-decisions/pd-011-scan-upload-photo-limit-policy.md`: recorded that provider-level batching/adaptive chunking are no longer active requirements and that PR #53 resolved the runtime policy.
- `AGENTS.md` and `CLAUDE.md`: removed EFF-021 from the current active epic lists.
- `initiatives/INIT-001-mobile-refresh.md` and `initiatives/registry.md`: updated INIT-001 to treat EFF-021 as resolved.
- `docs/handoffs/2026-05-08-codex-epic-021-merge-closeout.md`: removed the now-stale "EPIC stays open" follow-up framing.

## Impact on other agents

EFF-021 is now historical context, not an active gate. Future Pantry/Kitchen scan-cap changes should read [PD-011](../../product-decisions/pd-011-scan-upload-photo-limit-policy.md) and the resolved epic if useful, but agents no longer need to treat EFF-021 as an active required-read item.

Provider-level batching should not be picked up by default. It needs a new explicit product or cost/latency signal.

## Open items

- [EFF-020](../../efforts/effort-020-workflow-documentation-audit.md) still owns the future Feature Impact Review/system-touchpoint checklist, using this scan-capacity work as an example.
- Phase 3.1 still owns any final visual treatment for the Planning choice Pantry status line.

## Verification

- Docs-only closeout.
- Run `git diff --check` before PR/merge.
