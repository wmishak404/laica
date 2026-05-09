# EFFORT-021 scan upload photo limit policy

**Agent:** codex
**Branch:** codex/epic-021-scan-upload-limit
**Date:** 2026-05-08
**Initiative:** INIT-001
**INIT updated:** yes

## Summary

Renumbered the scan upload photo-limit filing to EFFORT-021 because `origin/main` owns EFFORT-020 for the workflow-documentation audit. This branch preserves that workflow EFFORT-020, records Wilson's accepted scan-capacity decisions in PD-011, and updates INIT-001 / epic indexes so future scan-capacity work starts from the same policy.

This is docs-only. Runtime Pantry/Kitchen scan limits remain unchanged until EFFORT-021 implementation work lands.

## Changes

- `efforts/effort-021-scan-upload-photo-limit-policy.md`: active epic for implementing the accepted Pantry/Kitchen scan limit policy.
- `product-decisions/011-scan-upload-photo-limit-policy.md`: durable accepted policy for scan capacity, batching, chunking, rate limits, counting semantics, partial success, progress, and scan-specific messaging.
- `product-decisions/README.md`: added PD-011 to the top-level Product / UX table.
- `efforts/README.md`: active read list keeps EFFORT-020 workflow audit and adds EFFORT-021 scan upload policy.
- `efforts/registry.md`: registry keeps EFFORT-020 workflow audit and adds EFFORT-021 with the accepted-policy signal.
- `efforts/effort-020-workflow-documentation-audit.md`: records that Feature Impact Review/system-touchpoint checklists belong in the future central testing/acceptance workflow and should not become a separate process epic.
- `initiatives/INIT-001-mobile-refresh.md`: links PD-011 and EFFORT-021 as mobile-refresh scan-capacity follow-ups.
- `product-decisions/features/mobile-refresh/cross-phase-ai-privacy.md`: supersedes the historical 8/6/4 scan-cap notes with the PD-011 capacity policy.
- `product-decisions/features/mobile-refresh/phase-05-post-cook.md`: notes that optional post-cook rescans inherit PD-011 unless Phase 5 documents an exception.
- `AGENTS.md` and `CLAUDE.md`: add EFFORT-021 to active epic read triggers for scan-capacity work.

## Accepted policy

- 20 scanned images per Pantry refresh and 20 per Kitchen refresh.
- Same cap for first-time setup, Settings rescans, and future post-cook cleanup unless Phase 5 explicitly documents an exception.
- 40 scanned images per day per area.
- Uploads and camera captures count once accepted for analysis.
- Over-cap selections fail closed.
- Unsupported files do not count.
- Supported accepted images count even if empty, duplicate-only, text-only rejected, failed, or no items are detected.
- Happy path is one batched vision call per refresh.
- Adaptive chunking splits automatically when payload/provider/body/latency limits are at risk.
- Server-side rate limits count images, not requests.
- Partial chunk successes are kept with clear summary copy.
- UI shows progress and protects against stale late results.
- Scan failures keep scan-specific taxonomy and do not fall back to generic cooking/AI copy.
- Product copy should say "per refresh" rather than "per batch."

## Impact on other agents

Read EFFORT-021 and PD-011 before changing Pantry/Kitchen scan caps, scan upload/camera counting, "Too many photos" copy, fail-closed behavior, scan batch endpoints, parser/body limits, image compression/chunking, image-count rate limits, partial-success handling, scan progress states, stale-result protection, or post-cook rescan capacity.

Also read:

- EFFORT-007 before changing no-detection or zero-result scan copy.
- EFFORT-014 before changing latest-scan, duplicate, overlap, found-again, or chip-state behavior.
- PD-010 before adding any scan failure telemetry.
- EFFORT-020 before changing the workflow/checklist structure used to review feature system touchpoints.

## Open items

- Implement the runtime limit changes and shared Pantry/Kitchen policy.
- Add or adapt the batch scan endpoint and adaptive chunking thresholds.
- Add image-count rate limits and preserve PD-010 telemetry constraints.
- Add setup and Settings unit coverage for same-limit behavior, over-cap fail-closed copy, image-count rate limits, and partial success.
- Replit-validate the eventual implementation with a high-photo-count mobile scenario.
- Under EFFORT-020, build the central testing/acceptance workflow and use this scan-limit review as a concrete Feature Impact Review example before closing EFFORT-005.

## Verification

- Docs-only filing; no Replit validation required.
- Run `git diff --check`.
- Before opening or merging this branch, confirm `origin/main` still owns EFFORT-020 workflow audit, scan-limit docs are EFFORT-021 everywhere, and no stale scan-limit EFFORT-020 file references remain.
