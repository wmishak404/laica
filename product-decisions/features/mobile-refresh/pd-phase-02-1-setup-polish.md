# Mobile Refresh Phase 2.1 - Setup Polish: Trust, Privacy, and Visual Conformance

**Status:** Merged via PR #27
**Document kind:** Feature Phase Record
**Phase owner:** Wilson
**Date:** 2026-04-29
**Initiative:** [INIT-001 - Mobile Refresh](../../../initiatives/INIT-001-mobile-refresh.md)
**Source phase:** [Phase 2 setup](pd-phase-02-setup.md)
**Mockup:** [phase-02-setup.png](../../../docs/assets/mobile-refresh/phase-02-setup.png)

## Goal

Polish the functional Phase 2 setup flow so it matches Laica's intended mobile-refresh design language, communicates trust and user control, and resolves the UI feedback found during PR #23 testing.

Phase 2.1 exists because PR #23 passed functional Replit validation but became too large to absorb another visual/interaction pass safely.

## Final Outcome

Phase 2.1 is the accepted first-time setup anchor for later mobile-refresh work. Future Planning, Cooking, Settings, and scan surfaces should treat this phase as the reference for camera-first onboarding, setup-scoped typography, upload/manual hierarchy, scan feedback, and privacy-aware copy.

Accepted durable outcomes:

- Setup uses a warm cream/coral phone-flow treatment aligned with the Phase 2 mockup.
- Setup-scoped `Fraunces` display and `Nunito` body/control typography are accepted for setup-derived surfaces, without changing global app typography.
- Camera starts off by default and uses in-frame controls: small translucent camera/tips toggles and a large blank shutter capture button.
- Upload and manual entry are peer-level alternatives for privacy-sensitive users.
- Upload batches over the pantry cap of 8 photos or kitchen cap of 6 photos fail closed: nothing is processed and the user sees the limit message.
- Pantry and Kitchen scan rate-limit meters are separate.
- Back during an active scan cancels the scan and ignores stale results.
- Fatal batch failures do not apply partial results.
- Scan feedback distinguishes text-only rejection, no-detection, rate limit, image/auth/service failure, and generic failures.
- Text-only screenshots, lists, receipts, menus, recipes, documents, and notes are rejected as inventory evidence; physical pantry/kitchen photos with visible products/tools remain valid.
- Manual entries are normalized, deduped, length-clamped, stripped of common prompt markers, and split on commas. Periods also recover common comma-like typos.
- Pantry requires at least 3 ingredients before setup can continue.
- Cooking Skill auto-advances after one full-row single-choice selection; multi-select screens keep explicit continuation.
- Exact and near-exact duplicate scan labels are skipped; duplicate-only scans show `Already saved`.
- Deeper semantic/label-drift duplicate refinement is deferred to [EFFORT-014](../../../efforts/effort-014-scan-session-diff-and-duplicate-refinement.md).

## Visual Direction

Accepted setup direction:

- Welcome opens with `Yes, Chef!`.
- Pantry uses `Start with pantry staples.`.
- Setup uses one top progress treatment instead of stacked brand/step/section chips.
- `Upload photos` and `Enter manually` labels are readable on phone screens and do not carry technical helper labels below obvious commands.
- Kitchen keeps the Pantry interaction model but shifts equipment-specific accents toward gray/silver and light wood while preserving coral progress.
- Cooking Skill and Dietary Restrictions use relevant multicolor illustration-style icons.
- `No restrictions` is isolated from other dietary options.
- Confirmation keeps its accepted structure while matching the illustration direction.
- Authenticated app pages do not reintroduce the old persistent top header; account/profile/sign-out access lives in the menu surface per [PD-009](../../pd-009-mobile-refresh-navigation.md).

## Validation State

Phase 2.1 was visually accepted by Wilson. Runtime Replit/mobile validation was recorded at `ac698a3`, and PR #27 merged the phase into `main` as merge commit `5419a901af45f0e1a8e40fbc813ee52978c14f86`. Final branch head `eaff0e8` was docs-only after runtime validation.

Local gates recorded for the phase:

- `npm run check`
- `npm run build`
- Focused Vitest coverage:
  - `tests/unit/equipment-vision-prompts.test.ts`
  - `tests/unit/vision-analysis-result.test.ts`
  - `tests/unit/vision-result.test.ts`
  - `tests/unit/entry-parsing.test.ts`
  - `tests/unit/rate-limit.test.ts`
  - `tests/unit/native-camera.test.tsx`
  - `tests/unit/user-profiling.test.tsx`

Replit validation covered:

- App shell without old persistent header and with menu/account access preserved.
- Welcome, Pantry, Kitchen, Cooking Skill, Dietary Restrictions, and Confirmation visual flow.
- Back/escape behavior without bypassing required setup.
- Scan cancellation and stale-result prevention.
- Camera opt-in/off behavior, permission failure feedback, and capture flash.
- Pantry/Kitchen upload caps, fail-closed oversized batches, and separate scan meters.
- Settings upload cap parity.
- Manual entry parsing, active state, prompt-marker stripping, and Pantry placeholder rotation.
- Text-only scan rejection and physical product/tool allowance.
- Duplicate-scan mitigation.
- Setup completion transition to Planning.
- No DB schema change or API contract break.

## Effort and Governance Interactions

- [PD-005](../../pd-005-ui-governance.md) / [`design_guidelines.md`](../../../design_guidelines.md): Setup typography and visual utilities remain scoped and documented as a pilot, not a silent global primitive/font change.
- Full-row selection pattern: Single-choice setup rows may auto-advance; multi-select screens retain explicit continuation.
- [Testing and Acceptance Workflow](../../../docs/workflows/testing-and-acceptance.md): Phase 2.1 is the feature-level acceptance pattern for combining local gates, Replit prerequisites, visual review, and merge acceptance.
- Scan feedback: Pantry and Kitchen scans must show explicit no-detection feedback for valid zero-result photos.
- Shared manual-entry parser: Comma-separated manual entry stays shared; Phase 2.1 also accepts period-as-comma typo recovery for manual entry.
- [EFFORT-010](../../../efforts/effort-010-local-db-schema-strategy.md): Phase 2.1 did not add DB schema changes or reopen the validated Phase 2 data contract.
- [EFFORT-014](../../../efforts/effort-014-scan-session-diff-and-duplicate-refinement.md): Latest-scan chip states and deeper duplicate/overlap refinement remain deferred.

## Deferrals

- Semantic scan-session duplicate cleanup and latest-scan chip states.
- Pantry manual-entry spell correction.
- OCR/list/receipt/grocery-import workflows.
- Dropping the legacy `weekly_time` DB column.
- Phase 3 Planning entry redesign.

## Historical Detail

Detailed Replit feedback rounds and implementation notes remain in the dated handoffs from 2026-04-30 and 2026-05-01. This phase record intentionally keeps the final accepted outcome, validation state, and durable lessons first so future agents do not need the full implementation diary by default.
