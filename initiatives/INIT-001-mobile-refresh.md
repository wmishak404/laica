# INIT-001 - Mobile Refresh

**Status:** In Progress
**Owner:** Wilson / Codex / Claude / Replit
**Created:** 2026-04-29
**Current phase:** Phase 3 implementation
**Active PR:** None
**Active branch:** `codex/mobile-refresh-phase-3-planning`

## Overview

Mobile Refresh is the phased effort to make Laica feel like a native, camera-forward, cooking-first mobile product rather than a desktop website wrapped in a mobile viewport.

The original plan spans Phase 0 through Phase 5, with Phase 3.1 added during Phase 3 review for design facelift and recipe imagery:

- Phase 0: security/backend readiness
- Phase 1: auth and first authenticated routing
- Phase 2: setup, pantry scan, kitchen scan, and profile
- Phase 2.1: setup trust, privacy, scan safeguards, and visual conformance
- Phase 2.2: returning setup edits, Menu, Settings, and History IA
- Phase 3: planning, Chef It Up, Slop Bowl, and Ticket Pass
- Phase 3.1: Phase 3 design facelift, recipe imagery slots, and async generated/illustrated imagery
- Phase 4: cooking guidance
- Phase 5: post-cook cleanup and retention

## Current Status

Phase 0, Phase 1, Phase 2, Phase 2.1, Phase 2.2, and the INIT/process documentation split are merged.

Phase 2.1 is the accepted first-time setup visual and behavior anchor. It shipped setup visual conformance, camera opt-in, peer upload/manual paths, scan cancellation, clearer scan/camera errors, fail-closed upload caps, manual-entry normalization, pantry minimums, and duplicate mitigation. Deeper scan-session duplicate refinement remains deferred to [EPIC-014](../epics/014-scan-session-diff-and-duplicate-refinement.md).

Phase 2.2 is the accepted returning-user IA bridge before Phase 3. Menu is the global access point; Settings owns Pantry/Kitchen/Profile edits; History is separate cooking memory. Returning Settings should remain visually aligned with first-time setup while preserving returning-user edit needs.

PR #34 merged the process and product-decision taxonomy cleanup. Phase 3 implementation is now in progress on `codex/mobile-refresh-phase-3-planning` from `origin/main` at `b4c1747bd20b5be469d11b66f74c79a83fbc8887`.

Phase 3 currently implements the Planning entry redesign, Chef It Up time/cuisine flow, deterministic cuisine-aware staple check, Ticket Pass suggestions, Prep Tray, Slop Bowl confirmation refresh, and Slop Bowl planning-time prompt plumbing. Wilson froze Phase 3 visuals on 2026-05-06 so this branch can close on functional correctness rather than more design iteration. Current Planning/Ticket/Prep visuals are functional scaffolding; [Phase 3.1](../product-decisions/features/mobile-refresh/phase-03-1-recipe-imagery.md) owns the design facelift plus recipe imagery follow-up. Ticket Pass reserves generated-image slots with designed placeholders in the selected ticket, compact alternate tickets, and Prep Tray, while actual generated/illustrated recipe imagery should not block suggestion reveal. Post-freeze basic-usability patches keep Ticket Pass recipe order stable, display-split recipe names only when explicit supporting detail exists, and ask about/save likely missing cuisine staples as concrete pantry ingredients before generation with multi-cuisine representation before extra slots, so recipe suggestions stay pantry-first. Local `npm run check`, `npm run build`, focused Vitest coverage, and dotenvx dev-server boot smoke have passed. Replit validation is not yet run.

## Source Docs

- [Mobile Refresh phase index](../product-decisions/features/mobile-refresh/README.md)
- [Phase 0 security/backend readiness](../product-decisions/features/mobile-refresh/phase-00-cross-phase-security.md)
- [Phase 1 auth](../product-decisions/features/mobile-refresh/phase-01-auth.md)
- [Phase 2 setup](../product-decisions/features/mobile-refresh/phase-02-setup.md)
- [Phase 2.1 setup polish](../product-decisions/features/mobile-refresh/phase-02-1-setup-polish.md)
- [Phase 2.2 returning setup/settings/history IA](../product-decisions/features/mobile-refresh/phase-02-2-returning-setup-settings.md)
- [Phase 3 planning](../product-decisions/features/mobile-refresh/phase-03-planning.md)
- [Phase 3.1 design facelift and recipe imagery](../product-decisions/features/mobile-refresh/phase-03-1-recipe-imagery.md)
- [Phase 4 cooking](../product-decisions/features/mobile-refresh/phase-04-cooking.md)
- [Phase 5 post-cook](../product-decisions/features/mobile-refresh/phase-05-post-cook.md)
- [AI privacy, prompt-injection, and abuse rules](../product-decisions/features/mobile-refresh/cross-phase-ai-privacy.md)
- [Dev-test harness plan](../product-decisions/features/mobile-refresh/dev-test-harness.md)
- [PD-005 UI governance](../product-decisions/005-ui-governance.md)
- [PD-009 mobile refresh navigation](../product-decisions/009-mobile-refresh-navigation.md)
- [`design_guidelines.md`](../design_guidelines.md)

## Assets

| Asset | Role |
|---|---|
| [phase-01-auth.png](../docs/assets/mobile-refresh/phase-01-auth.png) | Auth/landing visual exemplar |
| [phase-02-setup.png](../docs/assets/mobile-refresh/phase-02-setup.png) | Setup and camera-first onboarding exemplar |
| [phase-02-2-returning-setup-settings-storyboard.svg](../docs/assets/mobile-refresh/phase-02-2-returning-setup-settings-storyboard.svg) | Returning setup, Menu, Settings, and History storyboard |
| [phase-03-planning-flow.png](../docs/assets/mobile-refresh/phase-03-planning-flow.png) | Planning entry and Chef It Up / Slop Bowl hierarchy exemplar |
| [phase-03-ticket-pass.png](../docs/assets/mobile-refresh/phase-03-ticket-pass.png) | Ticket Pass recipe suggestion exemplar |
| [phase-04-cooking.png](../docs/assets/mobile-refresh/phase-04-cooking.png) | Cooking guidance exemplar |
| [phase-05-post-cook.png](../docs/assets/mobile-refresh/phase-05-post-cook.png) | Post-cook cleanup and retention exemplar |

## Phase Progress

| Phase | Status | PR / branch | Current signal |
|---|---|---|---|
| Planning docs | Merged | PR #20 / `codex/mobile-refresh-planning-docs` | Phase 0-5 docs and mockups added |
| Phase 0 | Merged | PR #21 / `codex/mobile-refresh-phase-0-security` | Firebase Admin auth, AI route protection, rate limits, ownership, body limits |
| Phase 1 | Merged | PR #22 / `codex/mobile-refresh-phase-1-auth` | Auth landing and first authenticated routing |
| Phase 2 | Merged | PR #23 / `codex/mobile-refresh-phase-2-setup` | Functional setup validated and merged; visual/trust polish moved to Phase 2.1 |
| INIT/process docs | Merged | PR #25 / `codex/mobile-refresh-init-process-docs` | Docs-only INIT/process/design baseline |
| Phase 2.1 | Merged | PR #27 / `codex/mobile-refresh-phase-2-1-setup-polish` | First-time setup visual/trust polish accepted and merged as `5419a90` |
| Phase 2.2 | Merged | PR #30 / `codex/mobile-refresh-phase-2-2-settings-history` | Returning Settings/History IA accepted and merged as `bc25ef3` |
| Phase 3 | In Progress | `codex/mobile-refresh-phase-3-planning` | Functional Planning/Chef It Up/Ticket Pass/Prep Tray/Slop Bowl implemented; visuals frozen; Replit validation pending |
| Phase 3.1 | Planned | TBD | Design facelift, recipe imagery/illustration direction, and async image hydration into Phase 3 slots |
| Phase 4 | Planned | TBD | Cooking guidance and hands-busy mode |
| Phase 5 | Planned | TBD | Post-cook cleanup and retention |

## PRs and Branches

| PR | Status | Branch | Validation / merge signal |
|---|---|---|---|
| #20 | Merged | `codex/mobile-refresh-planning-docs` | Docs/assets only |
| #21 | Merged | `codex/mobile-refresh-phase-0-security` | Replit/security validation completed before merge |
| #22 | Merged | `codex/mobile-refresh-phase-1-auth` | Phase 1 polish merged to `main` |
| #23 | Merged | `codex/mobile-refresh-phase-2-setup` | Functional Replit validation passed at `f037552`; merged as functional Phase 2 |
| #24 | Closed / superseded | `codex/vision-text-only-scan-epic` | Folded into Phase 2.1 scope |
| #25 | Merged | `codex/mobile-refresh-init-process-docs` | Docs-only INIT/process/design baseline |
| #26 | Merged | `codex/mobile-refresh-phase-2-closeout` | Phase 2 closeout moved resume point to Phase 2.1 |
| #27 | Merged | `codex/mobile-refresh-phase-2-1-setup-polish` | Runtime validation at `ac698a3`; final branch head `eaff0e8` docs-only; merged as `5419a90` |
| #30 | Merged | `codex/mobile-refresh-phase-2-2-settings-history` | Replit validation passed at `dc59796`; merged as `bc25ef3` |
| #34 | Merged | `codex/init-process-pd-taxonomy` | Docs-only process/PD taxonomy cleanup; Claude architectural review completed with follow-up fixes folded in; merged as `6288aef` |

## Epics and Governance

| Reference | Relevance |
|---|---|
| [PD-005](../product-decisions/005-ui-governance.md) | UI governance operating model |
| [`design_guidelines.md`](../design_guidelines.md) | Canonical visual identity / design standard |
| [EPIC-004](../epics/004-selection-controls-tap-targets.md) | Full-row mobile selection controls |
| [EPIC-005](../epics/005-testing-strategy-and-acceptance-criteria.md) | Merge readiness, validation workflow, visual acceptance gap |
| [EPIC-007](../epics/007-vision-scan-no-detection-feedback.md) | Pantry/kitchen no-detection feedback |
| [EPIC-009](../epics/009-consistent-comma-separated-ingredient-entry.md) | Shared comma-separated manual entry |
| [EPIC-010](../epics/010-local-db-schema-strategy.md) | DB/schema authority and no local shared DB pushes |
| [EPIC-013](../epics/013-pantry-manual-entry-spell-correction.md) | Future pantry manual-entry ingredient spelling correction |
| [EPIC-014](../epics/014-scan-session-diff-and-duplicate-refinement.md) | Future latest-scan chip indicators and duplicate-like scan cleanup |
| [EPIC-018](../epics/018-authenticated-ai-error-handling.md) | Authenticated AI error handling and pantry recipe 400 follow-up |

## Changes Added After Initial Plan

- Dev-test harness planned for future Firebase custom-token dev auth, not backend bypass.
- Mockup conformance gate added: linked mockups are implementation inputs, not loose inspiration.
- Setup visual/trust polish split from functional Phase 2 into Phase 2.1.
- Text-only/document-like scan safeguard folded into Phase 2.1.
- Stacked PR base refresh and Replit validation SHA hygiene added after early stale-preview risk.
- INIT system added to prevent future context loss across long phased work.
- Phase 2.2 added before Phase 3 so returning users can revisit Pantry, Kitchen, Cooking Profile, Settings, and History through Menu.
- UI governance and visual standards graduated to [PD-005](../product-decisions/005-ui-governance.md) and [`design_guidelines.md`](../design_guidelines.md).
- Product decision taxonomy cleanup added on 2026-05-05 so top-level PDs stay stable decision records and feature-phase records do not become indefinite diaries.
- EPIC-018 was filed from Phase 3 Replit validation to preserve the follow-up bug around demo-era AI error toasts/redirects masking pantry recipe 400s.
- Phase 3.1 expanded on 2026-05-05 to own the Phase 3 design-drift review, root-cause notes, recommendations, and recipe imagery follow-up instead of creating a standalone active epic.
- Phase 3 visuals frozen on 2026-05-06 so Phase 3 can close on functional validation; Phase 3.1 now owns the whitespace/card grammar, typography, Slop Bowl humor, Ticket Pass, Prep Tray, bottom nav, docs, and imagery facelift.
- Ticket Pass selection orientation was fixed after the visual freeze as a basic-usability exception: recipe order stays stable, the selected ticket expands in place, and recipe names show a main/supporting split only when explicit supporting detail exists, without changing the stored recipe name.
- Chef It Up staple verification was added after the visual freeze as a recipe-quality/basic-usability exception: selected cuisines can trigger a deterministic missing-staple check, confirmed staples save to pantry, and recipe suggestions now target a hidden pantry-strict / pantry-flexible / cuisine-leaning range.

## Validation State

Known validation facts:

- Replit validation passed at PR #23 head `f037552b37169f26e5fe2fe872f68150138812a6`.
- PR #23 merged into `main` as merge commit `eca3d1b504e8eb33edbeb74e78cf2755b760577f`.
- Phase 2.1 runtime Replit/mobile validation was recorded at `ac698a3`.
- Phase 2.1 final branch head `eaff0e8` was docs-only after validation.
- PR #27 merged Phase 2.1 into `main` as merge commit `5419a901af45f0e1a8e40fbc813ee52978c14f86`.
- Deeper scan-session duplicate refinement is deferred to [EPIC-014](../epics/014-scan-session-diff-and-duplicate-refinement.md).
- Phase 2.2 Replit validation passed at `dc59796ae1602af4643c5fc640be47ab19a59e04`.
- PR #30 merged Phase 2.2 into `main` as merge commit `bc25ef35cb14f32cf6b05507ede77161bd743091`.
- Phase 2.2 validated Menu -> Settings, Menu -> History, Slop Bowl -> Edit pantry, Pantry/Kitchen/Profile saves, History list/expand/delete/undo, feedback context, returning Settings visual parity, local typecheck/build, and relevant Vitest coverage.
- Phase 3 local validation on `codex/mobile-refresh-phase-3-planning` has passed `npm run check`, `npm run build`, `npx vitest run tests/unit/planning-time.test.ts tests/unit/slop-bowl-route.test.ts`, `git diff --check`, and a dotenvx dev-server boot smoke returning HTTP 200 on port 3000.
- Full `npx vitest run` is not green because existing repo-wide harness issues remain outside Phase 3 scope: `tests/e2e/cooking-workflow.test.ts` is a Playwright file being collected by Vitest, and `tests/unit/voice-recording.test.ts` expects `MediaStream` in the test environment.

## Current Resume Point

Continue Phase 3 implementation on `codex/mobile-refresh-phase-3-planning`.

Next implementation / validation focus:

1. Do not make more Phase 3 visual changes unless an issue blocks functional validation or basic usability.
2. Run Replit validation for authenticated Planning entry, Chef It Up time/cuisine/staple-check flow, multi-cuisine staple representation, concrete herb staple labels, confirmed-staple pantry save, recipe generation, refresh suggestions, Ticket Pass selection, Ticket Pass stable-order expansion across all three recipes, Prep Tray -> Cooking, Slop Bowl quick-add/remove, sparse-pantry guard, Slop Bowl generation, and Slop Bowl -> Edit pantry.
3. Refresh the PR/handoff `Last Replit-validated at` SHA after Replit passes.
4. Move design facelift work to [Phase 3.1](../product-decisions/features/mobile-refresh/phase-03-1-recipe-imagery.md): whitespace/card grammar, typography, Slop Bowl humor treatment, Ticket Pass hierarchy, Prep Tray image layout, bottom nav fit, docs updates, and async/cached recipe imagery.
5. Keep richer History share/cook-again/taste-memory behavior deferred to Phase 5 unless Wilson explicitly pulls it forward.

## Chronology

### 2026-04-28 - Initial phase plan captured

Codex added Mobile Refresh phase records, cross-phase AI/privacy rules, and visual assets. PR #20 merged the planning docs.

### 2026-04-29 - Phase 0, Phase 1, and functional Phase 2 landed

PR #21 merged security/backend readiness. PR #22 merged auth/routing. PR #23 merged functional setup after Replit validation; Wilson deferred visual/trust polish into Phase 2.1.

### 2026-04-29 - Process and design layers added

The initiative gained dev-test harness planning, mockup conformance rules, mobile-refresh design-language evidence, stacked PR validation hygiene, and this INIT hub. PR #25 merged the docs/process baseline.

### 2026-05-01 - Phase 2.1 merged

PR #27 merged setup visual/trust polish into `main`. Phase 2.1 is the accepted first-time setup anchor for later mobile-refresh work.

### 2026-05-01 - Phase 2.2 merged

PR #30 merged returning setup edits, Menu, Settings, and History IA into `main`. Phase 3 should start from fresh `origin/main`.

### 2026-05-02 - UI governance graduated

Resolved UI governance and design-language epics graduated to [PD-005](../product-decisions/005-ui-governance.md) and [`design_guidelines.md`](../design_guidelines.md). Active UI work should read those instead of treating resolved epics as live governance.

### 2026-05-05 - Process and product-decision taxonomy cleanup

PR #34 merged the docs-only process and product-decision taxonomy cleanup as merge commit `6288aefce3d923092d496ace535f7a3e8841f506`. Claude's substantive taxonomy findings were folded into the PR before merge. Phase 3 should now start from fresh `origin/main` with the cleaned documentation structure.
