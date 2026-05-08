# EPIC-021 - Scan upload photo limit policy

**Status:** Open
**Owner:** Wilson / Codex / Claude
**Created:** 2026-05-08
**Updated:** 2026-05-08

## One-line summary

Implement the accepted Pantry/Kitchen inventory-refresh scan limit policy: 20 images per refresh, 40 images per day per area, same limits across setup and later rescans, batched processing with adaptive chunking, and scan-specific progress/error messaging.

## Linked Initiatives

- [INIT-001 - Mobile Refresh](../initiatives/INIT-001-mobile-refresh.md)

## Context

Wilson reported a real pantry setup feedback case: a user tried to be thorough and had about 30 pantry photos, but Laica limited the batch upload to 8 pantry photos.

Current implementation evidence:

- First-time setup caps Pantry at 8 photos and Kitchen at 6 photos.
- Returning Settings uses the same split limit.
- Over-cap upload batches fail closed with "Too many photos" feedback, so no partial scan is processed.

The original caps were accepted during Phase 2.1 as a trust, cost, and reliability guardrail, but the user feedback showed that a careful inventory pass can exceed the current limits. The 2026-05-08 discussion accepted a new policy in [PD-011](../product-decisions/011-scan-upload-photo-limit-policy.md): raise capacity to 20 images per inventory refresh per area, keep Pantry and Kitchen aligned, and use batching/chunking plus image-count rate limits to control cost and latency.

This epic owns the implementation follow-through. [EPIC-020](020-workflow-documentation-audit.md) is the separate workflow-documentation audit and owns EPIC-005 closeout.

## Scope

### In scope

- Pantry and Kitchen scan limits in first-time setup.
- Pantry and Kitchen scan limits in returning Settings.
- Future post-cook cleanup or rescan flows that let users refresh Pantry or Kitchen inventory.
- Upload and camera-capture counting semantics.
- Client and server enforcement for over-cap, unsupported-file, malformed-image, duplicate-only, no-detection, partial-success, and failed-image outcomes.
- Batched vision request shape, adaptive chunking, payload/body limits, stale-result protection, progress UI, and summary copy.
- Scan-specific error messaging, including rate-limit and partial-success copy.
- Tests that cover the accepted limit policy across setup, Settings, server rate limits, and scan messaging.

### Out of scope

- Replacing exact/near-exact duplicate mitigation; that remains in [EPIC-014](014-scan-session-diff-and-duplicate-refinement.md).
- Changing zero-result scan feedback semantics beyond capacity-related copy; that remains in [EPIC-007](007-vision-scan-no-detection-feedback.md).
- Changing AI error telemetry storage beyond the [PD-010](../product-decisions/010-ai-error-telemetry-allowlist.md) image-count-only constraints.
- Quantity-based pantry tracking, inventory confidence scoring, or photo-specific long-term inventory memory.

## Decisions made so far

- Pantry and Kitchen each support 20 scanned images per inventory refresh.
- The same 20-image refresh cap applies to first-time setup, Settings rescans, and future post-cook cleanup unless Phase 5 explicitly documents an exception.
- Pantry and Kitchen each get 40 scanned images per day. Daily budgets are per area, not a shared 40-image pool.
- Uploads and camera captures both count once the image is accepted for analysis.
- Over-cap selections fail closed: no subset is silently processed.
- Unsupported files do not count because they never become accepted scan images.
- Supported images count after acceptance even if they are empty, duplicate-only, text-only rejected, failed, or return no detected items.
- The happy path is one batched vision call per refresh.
- Adaptive chunking should split automatically when payload size, request body limits, provider image-count limits, or latency risk make one call unsafe.
- Server-side rate limits count images, not API requests, so chunking does not multiply the user's effective quota.
- Partial chunk successes are kept. The user should see a clear summary of what was saved or suggested and what could not be analyzed.
- The UI should show progress for long scans and protect against stale late results when the user cancels, backs out, starts a newer scan, or leaves the surface.
- Preserve scan-specific error taxonomy. Do not route scan failures through generic cooking or generic AI error copy.
- User-facing copy should say "per refresh" rather than "per batch."

## System touchpoints

Future implementation should review these before changing runtime behavior:

- Scan-specific error messaging: preserve text-only rejection, no-detection, rate-limit, auth, service, malformed-image, over-cap, and generic scan failure distinctions.
- Batch route parser and body limits: raising image count may require multipart/base64 parser changes, explicit decoded-image-size checks, and provider payload guardrails.
- Image-count rate limiting: limit by accepted image count, not request count, so adaptive chunks cannot bypass daily budgets.
- [PD-010](../product-decisions/010-ai-error-telemetry-allowlist.md) telemetry constraints: scan failure telemetry may include `image_count` only, never raw images, bytes, filenames, EXIF, base64 payloads, or detected labels.
- Phase 5 post-cook rescan capacity: inherited default is 20 images per refresh and 40 per day per area unless Phase 5 records an exception.
- Settings scan test gap: returning Settings needs the same limit, fail-closed behavior, progress, partial-success summary, and rate-limit coverage as setup.
- [EPIC-007](007-vision-scan-no-detection-feedback.md): valid zero-result scans still need explicit no-detection feedback.
- [EPIC-014](014-scan-session-diff-and-duplicate-refinement.md): larger refreshes increase duplicate/latest-scan/found-again surface area, but this epic does not own chip-state semantics.
- [EPIC-020](020-workflow-documentation-audit.md): the system-touchpoint review pattern should feed the future testing/acceptance workflow rather than becoming a separate process epic.

## Cost and latency planning notes

The planning discussion estimated that maxing both Pantry and Kitchen under the accepted daily cap could cost roughly `$0.67-$0.89` per user per day if each photo were processed independently, while batched processing was estimated closer to `$0.18-$0.28` per user per day with a `$0.35` planning guardrail. These are planning estimates, not billing guarantees; implementation should recalculate with the live model, image compression, and observed token usage before rollout.

Latency is part of product quality for this policy. If the happy path takes long enough that users may disengage, the UI needs visible progress, cancellability, stale-result protection, and partial-success handling rather than a silent spinner.

## Open implementation questions

1. What exact image compression, dimension, and byte-size thresholds should trigger adaptive chunking?
2. Should setup and Settings share one batch endpoint, or should the existing scan endpoint grow a batch-compatible request contract?
3. What progress states are enough for mobile trust: selected, uploading, analyzing, saving, partial completion, and retry?
4. What copy should summarize mixed outcomes when some chunks succeed and some fail?
5. Which Replit validation scenario should prove the 20-image path without requiring a human to upload 40 real photos during every smoke test?

## Agent checklist - when to read this epic

Read EPIC-021 before starting any of the following:

- [ ] Changing Pantry or Kitchen scan caps in first-time setup
- [ ] Changing Pantry or Kitchen scan caps in returning Settings
- [ ] Changing "Too many photos" copy or over-cap fail-closed behavior
- [ ] Changing scan rate-limit behavior for Pantry or Kitchen uploads
- [ ] Adding or modifying batched scan routes, payload parsing, image compression, or adaptive chunking
- [ ] Adding post-cook cleanup, rescan, or inventory-refresh capacity
- [ ] Changing scan progress, partial-success, stale-result, or retry copy
- [ ] Defining acceptance criteria for high-photo-count Pantry or Kitchen validation

When this epic applies, also cite:

- [PD-011](../product-decisions/011-scan-upload-photo-limit-policy.md) for the accepted policy
- [EPIC-005](005-testing-strategy-and-acceptance-criteria.md) for validation and acceptance criteria until it graduates under EPIC-020
- [EPIC-007](007-vision-scan-no-detection-feedback.md) for scan outcome messaging
- [EPIC-014](014-scan-session-diff-and-duplicate-refinement.md) when upload capacity intersects with latest-scan or duplicate-review state
- [EPIC-020](020-workflow-documentation-audit.md) if the work changes the cross-feature impact review workflow itself

## Resolution criteria - what "done" looks like

This epic is `Resolved` when all of the following are true:

1. Setup and Settings enforce 20 scanned images per Pantry refresh and 20 per Kitchen refresh.
2. Setup, Settings, and any implemented post-cook rescan flow share the same accepted limit unless a later product decision explicitly documents an exception.
3. Server-side enforcement applies 40 scanned images per day per area and counts accepted images rather than requests.
4. Uploads and camera captures share the same counting semantics.
5. Over-cap selections fail closed; unsupported files do not count; supported accepted images count even when rejected, failed, duplicate-only, text-only, empty, or no-detection.
6. Batched scan processing uses one call on the happy path and adaptive chunking when payload/provider limits are at risk.
7. Partial chunk successes are preserved with clear summary copy.
8. Progress and stale-result protection exist on mobile scan surfaces.
9. Scan-specific error taxonomy and "per refresh" copy are implemented without falling back to generic cooking/AI messaging.
10. Unit coverage verifies setup and Settings limits, same-limit Pantry/Kitchen behavior, over-cap fail-closed copy, image-count rate limits, and partial-success behavior.
11. Replit validation or a handoff records the accepted behavior on mobile with a high-photo-count scenario.

## Linked artifacts

- [PD-011 - Scan upload photo limit policy](../product-decisions/011-scan-upload-photo-limit-policy.md)
- [PD-010 - AI error telemetry allowlist](../product-decisions/010-ai-error-telemetry-allowlist.md)
- [Cross-phase AI privacy, prompt-injection, and abuse rules](../product-decisions/features/mobile-refresh/cross-phase-ai-privacy.md)
- [Phase 2.1 setup polish](../product-decisions/features/mobile-refresh/phase-02-1-setup-polish.md)
- [Phase 5 post-cook cleanup and retention](../product-decisions/features/mobile-refresh/phase-05-post-cook.md)
- [INIT-001 - Mobile Refresh](../initiatives/INIT-001-mobile-refresh.md)
- [EPIC-005 - App-wide testing strategy and acceptance criteria workflow](005-testing-strategy-and-acceptance-criteria.md)
- [EPIC-007 - Vision scan should explicitly say when nothing was detected](007-vision-scan-no-detection-feedback.md)
- [EPIC-014 - Scan session diff and duplicate refinement](014-scan-session-diff-and-duplicate-refinement.md)
- [EPIC-020 - Workflow documentation audit and graduation](020-workflow-documentation-audit.md)

## Chronology

### 2026-05-08 - Filed from high-photo-count pantry feedback

Wilson reported that a user tried to be thorough with about 30 pantry photos but hit the current 8-photo pantry upload cap. The first filing preserved the product questions around raising the limit, defining the lifecycle semantics, and keeping Pantry/Kitchen aligned.

### 2026-05-08 - Renumbered to EPIC-021 and accepted policy recorded

After `origin/main` claimed EPIC-020 for the workflow-documentation audit, this scan-limit epic was renumbered to EPIC-021. Wilson accepted the 20-image per-refresh policy, 40-image daily budget per area, same-limit Pantry/Kitchen rule, batched happy path, adaptive chunking direction, image-count rate limits, partial-success preservation, progress/stale-result UI direction, and scan-specific messaging posture. [PD-011](../product-decisions/011-scan-upload-photo-limit-policy.md) is the durable decision record.
