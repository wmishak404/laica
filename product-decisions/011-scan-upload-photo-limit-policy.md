# PD-011: Scan upload photo limit policy

**Date:** 2026-05-08
**Status:** Accepted
**Decision maker:** Wilson
**Type:** Product/UX / Architecture
**Scope:** Pantry/Kitchen scan upload and camera refresh surfaces
**Applies when:** Changing Pantry/Kitchen scan caps, camera capture counting, scan batch endpoints, image-count rate limits, scan error copy, or post-cook inventory rescan capacity.
**Related Initiatives:** [INIT-001 - Mobile Refresh](../initiatives/INIT-001-mobile-refresh.md)
**Related Epics:** [EPIC-021](../epics/021-scan-upload-photo-limit-policy.md), [EPIC-020](../epics/020-workflow-documentation-audit.md), [EPIC-007](../epics/007-vision-scan-no-detection-feedback.md), [EPIC-014](../epics/014-scan-session-diff-and-duplicate-refinement.md)

## Context

Phase 2.1 shipped conservative scan caps: Pantry at 8 photos, Kitchen at 6 photos, with Settings using the same split. Over-cap upload selections fail closed with "Too many photos" feedback so users are not left guessing which files were processed.

Wilson later reported a real feedback case where a user had about 30 pantry photos while trying to be thorough. That made the old cap feel too arbitrary for the first serious inventory pass, and it exposed a broader policy question: whether the cap should be higher only for first-time setup, whether later rescans deserve the same capacity, and whether Pantry/Kitchen limits should stay aligned.

The 2026-05-08 planning discussion considered cost, latency, engagement, batching, adaptive chunking, rate-limit semantics, and scan-specific error messaging. The accepted direction is to raise capacity while preserving simple user semantics and server-side guardrails.

## Decision

### Scan capacity policy

- Pantry supports 20 scanned images per inventory refresh.
- Kitchen supports 20 scanned images per inventory refresh.
- The same cap applies to first-time setup, Settings rescans, and future post-cook cleanup unless Phase 5 explicitly documents an exception.
- Pantry and Kitchen each allow 40 scanned images per day. This is per area, not one shared daily pool.
- Uploads and camera captures both count once the image is accepted for analysis.
- Over-cap selections fail closed: no subset is silently processed.
- Unsupported files do not count because they never become accepted scan images.
- Supported images count after acceptance even if they are empty, duplicate-only, text-only rejected, failed, or return no detected items.

Use "per refresh" in product copy. Avoid "per batch" because adaptive chunking means one visible refresh may become multiple server/provider chunks.

### Batch processing direction

- The happy path is one batched vision call per inventory refresh.
- Adaptive chunking should split automatically when payload size, request body limits, provider image-count limits, or latency risk make a single request unsafe.
- Server-side rate limits count images, not API requests, so chunking does not multiply a user's effective quota.
- Partial chunk successes are preserved. The UI should summarize what was saved or suggested and what could not be analyzed.
- The UI should show progress for long scans and protect against stale late results when the user cancels, backs out, starts a newer scan, or leaves the surface.

### Abuse guardrail posture

- The current implementation should keep auth-required scan access, per-user/per-area daily image limits, and short-window IP limits.
- Do not add a daily IP cap, cross-area global IP cap, profile-save-before-scan gate, or fresh-account abuse workflow for this slice.
- The repeat-fresh-account scenario is a known non-blocking risk: a user could create or use multiple Firebase accounts, scan without saving, sign out, and repeat. The short-window IP limiter makes this annoying and bounded for casual abuse, while heavier controls can wait for real cost, usage, or abuse signals.
- OpenAI/project-level API limits are an additional last-resort backstop if usage goes badly wrong. They should not be treated as the normal product limit because they can fail user flows abruptly and outside Laica's scan-specific messaging.
- Revisit stronger abuse controls if billing spikes, scan usage shows suspicious account churn, or Replit/runtime telemetry shows repeated high-volume scans from the same network.

### Messaging direction

- Preserve the scan-specific error taxonomy from Phase 2.1: text-only rejection, no-detection, rate limit, auth, service, malformed-image, over-cap, and generic scan failure should remain distinguishable.
- Do not route scan failures through generic cooking or generic AI error copy.
- Replace "per batch" phrasing with "per refresh."
- Add progress and partial-success copy for long or chunked scans.

Example copy posture:

- Over cap: "You can scan up to 20 photos per pantry refresh. Pick fewer photos to continue."
- Daily cap: "You've reached today's pantry scan limit. Try again tomorrow or add items manually."
- Partial success: "We analyzed 16 photos and saved what we found. 4 photos could not be scanned."
- Progress: "Analyzing 12 of 20 photos..."

These are directional examples, not final string locks.

### Empty inventory and in-flight scan guardrails

- An empty Pantry is a valid returning-user inventory state. Profile/onboarding readiness depends on cooking profile completion, not on Pantry having at least one saved item.
- Clearing Pantry in Settings should clear only Pantry. It must not reset Kitchen equipment, cooking profile fields, or cooking History.
- Pantry-based recipe generation is blocked when Pantry is empty. Use the direct empty-pantry message: "Your pantry is empty. Add or scan pantry items before I can suggest recipes." Include a path back to Settings > Pantry where the surface supports it.
- Do not silently generate pantry-based recipes with zero pantry items, and do not send returning users back through first-time setup just because they cleared Pantry.
- Settings scans may continue while the user switches between Settings sections, but leaving Settings should cancel or abort the active scan and ignore stale late results.
- Inventory save, reset, manual-entry, and remove-item actions should be blocked while an inventory scan is active so late scan results cannot race against destructive edits.
- Acceptance criteria for scan-capacity work should include corner cases where users reset a valid domain to empty, navigate during in-flight async work, and verify unrelated persisted data stays intact.

## Privacy and telemetry constraints

This policy inherits [PD-010](010-ai-error-telemetry-allowlist.md). Scan telemetry may use `image_count` as an aggregate count only. Do not log or persist raw images, image bytes, filenames, EXIF data, base64 payloads, detected labels, or per-image content in AI error telemetry, stdout JSON logs, admin APIs, or handoffs.

## Rationale

- A first inventory refresh is where thorough users get the most value from photos, but pantry accuracy also decays over time. Keeping the same cap for setup, Settings, and post-cook rescans is simpler and avoids treating returning users as second-class.
- A shared Pantry/Kitchen cap avoids unexplained asymmetry. Different old caps were an implementation detail, not a product principle.
- 20 images is a middle path between the old 8/6 caps and the 30-photo feedback case. It materially helps thorough users while keeping upload latency, mobile engagement, and provider costs inside a controllable envelope.
- 40 images per day per area lets a user recover from a failed or incomplete refresh without opening unlimited scan abuse.
- Counting images instead of requests keeps adaptive chunking honest.
- Preserving partial successes respects the user's time and avoids discarding good work because one chunk failed.
- Scan-specific messaging matters because inventory scans fail for reasons that cooking/recipe AI failures do not: unsupported files, text-only evidence, no physical items detected, malformed images, over-cap selection, and duplicate-only results.
- The fresh-account abuse case is possible but sufficiently intentional and high-friction that extra daily/global IP caps are deferred until observed usage justifies the added product and operational complexity. Provider-side OpenAI limits remain a hard spend-safety backstop, but the app should not rely on them for ordinary user experience.
- Treating empty Pantry as valid preserves returning-user trust: reset/cleanup should not erase profile identity, Kitchen equipment, or History. The recipe-generation blocker is the right point to enforce the dependency because it is where Pantry contents are actually required.

## Cost and latency planning notes

During planning, maxing both Pantry and Kitchen under the accepted daily cap was estimated around `$0.67-$0.89` per user per day if each photo were processed independently. Batched processing was estimated closer to `$0.18-$0.28` per user per day, with `$0.35` as a planning guardrail.

These are planning estimates, not billing guarantees. Implementation should recalculate with the live model, compression, provider pricing, and observed token/image usage before rollout. If real latency is high enough that users may disengage, progress UI, cancellability, stale-result protection, and partial-success summaries are product requirements, not polish.

## Alternatives considered

| Alternative | Why not chosen |
|---|---|
| Keep Pantry at 8 and Kitchen at 6 | The real feedback case showed careful pantry setup can exceed the old cap, and the split limit is hard to explain |
| Raise only first-time setup | First setup is high value, but returning users also rescan after restocks, reorganizing, or cooking; one rule is easier to understand |
| Raise to 30 immediately | It best matches the reported case but raises cost, latency, and payload risk before batching/chunking is implemented |
| Use different Pantry and Kitchen limits | Future asymmetry should require an explicit product decision; default policy keeps the same limit |
| Count API requests instead of images | Adaptive chunking could accidentally increase effective quota or punish users for server-side implementation details |
| Fail the whole refresh on any chunk failure | This discards successful analysis and makes long scans feel brittle |
| Use generic AI error messaging | Scan failures need inventory-specific recovery and should not borrow cooking/recipe failure copy |
| Add daily/global IP caps immediately | More machinery than the current risk deserves; existing auth, per-user limits, and short-window IP limits are enough for this rollout unless real usage says otherwise |

## Consequences

- [EPIC-021](../epics/021-scan-upload-photo-limit-policy.md) owns implementation follow-through and should stay open until runtime limits, tests, and validation match this policy.
- Setup, Settings, and post-cook rescan docs should treat old 8/6/4 photo caps as historical unless a later decision supersedes this policy.
- The scan route may need a new batch contract or a backward-compatible batch mode, plus explicit parser/body/provider payload guardrails.
- Tests must cover setup and Settings limits, same-limit Pantry/Kitchen behavior, fail-closed over-cap copy, unsupported-file counting, accepted-image counting, image-count rate limits, partial-success behavior, and stale-result protection.
- Tests should also cover returning-user empty-Pantry states, Pantry-dependent recipe blockers, Settings Back/cancel behavior during active scans, and persistence boundaries after clearing Pantry.
- Replit validation should include a high-photo-count mobile scan scenario before this epic resolves.
- Abuse hardening beyond the existing short-window IP limit is a monitoring follow-up, not a blocker for the current EPIC-021 runtime slice.

## Open follow-ups

- Pick exact compression, dimension, and byte-size thresholds for adaptive chunking.
- Decide whether setup and Settings share one batch endpoint or layer batch semantics over the existing scan route.
- Finalize copy for progress, daily cap, partial success, and per-refresh over-cap messages.
- Add the Feature Impact Review/system-touchpoint checklist to the future testing/acceptance workflow under [EPIC-020](../epics/020-workflow-documentation-audit.md), using this policy review as a worked example.
