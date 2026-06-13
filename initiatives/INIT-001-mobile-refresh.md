# INIT-001 - Mobile Refresh

**Status:** In Progress
**Owner:** Wilson / Codex / Claude / Replit
**Created:** 2026-04-29
**Current phase:** Phase 3.1 / Phase 4 planning
**Active PR:** none; [#175](https://github.com/wmishak404/laica/pull/175) merged the Phase 3.1 Ticket Pass hierarchy retry as `6510860` on 2026-06-13.
**Active branch:** none; next Phase 3.1 runtime work should start from fresh `origin/main`.

## Overview

Mobile Refresh is the phased effort to make Laica feel like a native, camera-forward, cooking-first mobile product rather than a desktop website wrapped in a mobile viewport.

The original plan spans Phase 0 through Phase 5, with Phase 3.1 added during Phase 3 review for design facelift and recipe imagery, and Phase 3.2 added for the progressive Chef It Up pantry-staple interaction:

- Phase 0: security/backend readiness
- Phase 1: auth and first authenticated routing
- Phase 2: setup, pantry scan, kitchen scan, and profile
- Phase 2.1: setup trust, privacy, scan safeguards, and visual conformance
- Phase 2.2: returning setup edits, Menu, Settings, and History IA
- Phase 3: planning, Chef It Up, Slop Bowl, and Ticket Pass
- Phase 3.1: Phase 3 design facelift, Slop It Up planning-card copy treatment, recipe imagery slots, and async generated/illustrated imagery
- Phase 3.2: progressive Added shelf for Chef It Up pantry staple suggestions
- Phase 4: cooking guidance
- Phase 5: post-cook cleanup and retention

## Current Status

Phase 0, Phase 1, Phase 2, Phase 2.1, Phase 2.2, Phase 3, Phase 3.2, and the INIT/process documentation split are merged.

Phase 2.1 is the accepted first-time setup visual and behavior anchor. It shipped setup visual conformance, camera opt-in, peer upload/manual paths, scan cancellation, clearer scan/camera errors, fail-closed upload caps, manual-entry normalization, pantry minimums, and duplicate mitigation. Pantry manual-entry spell correction later shipped through EFF-013 / PR #62 and is now resolved. Richer setup/settings scan-review states shipped through Phase 3.1 / PR #75, resolving EFF-014 for existing Setup and returning Settings Pantry/Kitchen review surfaces.

Phase 2.2 is the accepted returning-user IA bridge before Phase 3. Menu is the global access point; Settings owns Kitchen Inventory and Cooking Profile edits; History is separate cooking memory. Kitchen Inventory contains Pantry and Tools as separate scan/edit areas, preserving the existing backend `pantryIngredients` / `kitchenEquipment` contract while replacing visible Kitchen/equipment language with Tools. Returning Settings should remain visually aligned with first-time setup while preserving returning-user edit needs. PR #170 shipped the Kitchen Inventory consolidation in returning Settings, made Tools opt-in after Pantry during first-time setup, and added browser-local setup draft restore so Replit preview refreshes/remounts no longer lose Pantry/Tools setup progress. PR #171 merged the final UI polish: optional Tools reassurance copy, kitchen-specific Tools artwork, a checkmark setup completion hero, and connected Pantry/Tools header tabs with a rectangular-top Kitchen Inventory panel.

PR #173 later added a returning Settings active-section restore mitigation after release smoke found an intermittent signed-in Tools save/remount route loss. The root refresh trigger remains unidentified, but a remount while Settings is active now restores the active Settings section instead of routing complete linked profiles back to Planning. The mitigation merged as `4ee5c27` after focused Replit smoke on head `b81a0c7` confirmed refresh returned to the previously active page/section.

The latest Phase 3.1 consistency slices are merged:

- PR #71 updated the Planning entry to label the Slop Bowl path as italicized **Slop It Up** with one approved supporting line selected per mount, and highlighted only the key pantry fact in the Planning status line (dynamic count phrase or the word `empty`) in Planning coral.
- PR #73 aligned Slop Bowl pantry-check chips with the Chef It Up saved/pending grammar without changing Slop Bowl behavior.
- PR #75 aligned first-time setup and returning Settings Pantry/Kitchen inventory review chips with that same saved/pending grammar, resolving EFF-014 for Setup/Settings. Wilson validated the Settings Pantry minimum path in Replit at head `1e93bf8fdcd9933dea3200e66c138c91a5c00be1`.
- PR #141 aligned Slop Bowl generated-result and feedback button typography with the adjacent Chef It Up recipe-suggestion controls. Wilson validated the Replit visual comparison at pre-rebase head `9d30177`; after a docs-only `main` rebase, local checks and GitHub CI passed at PR head `8f11990`, and the PR merged as `2145407`.

Across these slices: saved Pantry/Tools items render as green checked chips; recently-added manual/scan items render as coral `+` chips with an `X`; found-again scan matches get quiet same-list emphasis plus scan copy; and state clears on setup Continue or successful Settings save. Phase 5 still owns future post-cook rescan labels.

PR #78 attempted the remaining Ticket Pass / Prep Tray polish from fresh `origin/main`, but Wilson rejected the resulting UI. The first pass was too incremental to count as a real Ticket Pass improvement, and a later same-day overcorrection introduced fake illustration placeholders plus broken compact-ticket formatting that read worse than the stable `main` baseline. The branch was rolled back to the safer baseline, then closed unmerged. Phase 3.1 therefore still owes a material Ticket Pass visual improvement, and the next attempt should be a narrower layout-only retry rather than another broad placeholder/art experiment.

PR #175 merged the narrower Ticket Pass hierarchy retry as `6510860` on 2026-06-13. The slice makes the existing recipe suggestions feel more like a connected pass stack instead of separate generic cards: shared ticket-pass backing, clearer selected-vs-compact depth, readable compact rows, and stable in-place selection order. The user value is better orientation while choosing a recipe: selecting another ticket no longer feels like the list is reshuffling, and Prep Tray continuity stays tied to the selected recipe. The branch intentionally did not add fake artwork, real imagery generation, Prep Tray redesign, prompt/provider changes, navigation changes, Settings changes, or backend work. Wilson's targeted Replit smoke accepted the Ticket Pass hierarchy as good for now, and GitHub `unit`, `e2e_guest_smoke`, `npm-audit`, `trufflehog_pr`, and CodeQL passed at head `100cbd66` before merge.

PR #34 merged the process and product-decision taxonomy cleanup. Phase 3 implementation shipped through [PR #38](https://github.com/wmishak404/laica/pull/38), validated at `8a5c3d5` and merged as `f1d17d8`. The Phase 3 generation lock/cancel follow-up shipped through [PR #45](https://github.com/wmishak404/laica/pull/45), validated at `0c98a47` and merged as `8892327`.

Phase 3 implements the Planning entry redesign, Chef It Up time/cuisine flow, deterministic cuisine-aware staple check, Ticket Pass suggestions, Prep Tray, Slop Bowl confirmation refresh, and Slop Bowl planning-time prompt plumbing. Wilson froze Phase 3 visuals on 2026-05-06 so the phase could close on functional correctness rather than more design iteration. Current Planning/Ticket/Prep visuals are functional scaffolding; [Phase 3.1](../product-decisions/features/mobile-refresh/pd-phase-03-1-recipe-imagery.md) owns the design facelift, Slop It Up planning-card copy treatment, and recipe imagery follow-up. Ticket Pass reserves generated-image slots with designed placeholders in the selected ticket, compact alternate tickets, and Prep Tray, while actual generated/illustrated recipe imagery should not block suggestion reveal. Post-freeze basic-usability patches keep Ticket Pass recipe order stable, display-split recipe names only when explicit supporting detail exists, ask about/save likely missing cuisine staples as concrete pantry ingredients before generation with multi-cuisine representation before extra slots, align recipe preference caps across recipe suggestion routes, enforce `additionalIngredientsNeeded` as optional enhancements rather than required missing ingredients, and lock/cancel Chef It Up recipe generation so staple rows cannot reshuffle or accept input while suggestions are loading.

[Phase 3.2](../product-decisions/features/mobile-refresh/pd-phase-03-2-progressive-staples.md) is a separate behavior/interaction polish slice on top of the merged Phase 3 + PR #45 cancellation behavior. It is not blocked by Phase 3.1 because it does not decide the broader visual facelift or recipe imagery direction. Phase 3.1 should treat the Phase 3.2 Added shelf / rolling staple queue as the current behavior to preserve or intentionally restyle during the facelift.

Wilson's Replit check of Phase 3.2 head `968d39a` confirmed the rolling staple queue, queue exhaustion, submit-time pantry persistence, and saved staples after returning from recipe suggestions. The follow-up kept the Added-only shelf and submit timing, added a visible `X` remove affordance to pending Added chips, used `+` instead of checkmarks for pending additions, marked successfully saved chips as green-check-only pantry facts, showed an inline Pantry Settings removal note when a saved chip is tapped, skipped repeat pantry-save calls for already-saved selected staples, clarified the helper copy, and documented Slop Bowl pantry-check visual alignment as Phase 3.1 scope.

[PR #46](https://github.com/wmishak404/laica/pull/46) shipped Phase 3.2 after Wilson's authenticated Replit/browser validation at `9646c80`; it merged into `main` as `b22f6b6`. Phase 3.2 is now the behavior baseline for Chef It Up's staple-check step. Phase 3.1 should preserve or intentionally restyle that behavior during the design facelift.

[PR #53](https://github.com/wmishak404/laica/pull/53) shipped the EFF-021 runtime slice after Wilson's Replit validation at `ef28e59`; it merged into `main` as `9aa6c1c`. Pantry and Kitchen now share the 20-photo per-refresh cap, scan refreshes process with bounded 4-at-a-time concurrency, empty Pantry remains a valid returning-user state, active Settings scans have cancellation/stale-result protection, and Chef It Up now surfaces the empty-Pantry blocker from the Planning choice screen. Wilson later accepted that provider-level multi-image batching is not needed at this point, so EFF-021 closed as resolved.

The 2026-05-09 Effort cleanup closed several former Mobile Refresh follow-ups as standalone Efforts. Full-row selection controls, scan no-detection feedback, shared manual-entry parsing, and Slop Bowl visual cleanup are now documented as INIT-001/phase-owned behavior instead of active Efforts. Future work in those areas should update the relevant phase record, not create a new Effort unless the work becomes standalone outside INIT-001.

The 2026-05-13 closeout pass resolved EFF-013 after PR #62 shipped conservative setup/Settings pantry manual-entry correction, and resolved EFF-015 after PR #64 shipped UI-governance enforcement. The 2026-05-14 closeout pass resolved EFF-014 after PR #75 shipped Setup/Settings scan-review chip states and Wilson confirmed the Replit head. For current Effort status and the read-before-work list, rely on `efforts/README.md` and the `## Adjacent Efforts` table below.

## Source Docs

- [Mobile Refresh phase index](../product-decisions/features/mobile-refresh/README.md)
- [Phase 0 security/backend readiness](../product-decisions/features/mobile-refresh/pd-phase-00-cross-phase-security.md)
- [Phase 1 auth](../product-decisions/features/mobile-refresh/pd-phase-01-auth.md)
- [Phase 2 setup](../product-decisions/features/mobile-refresh/pd-phase-02-setup.md)
- [Phase 2.1 setup polish](../product-decisions/features/mobile-refresh/pd-phase-02-1-setup-polish.md)
- [Phase 2.2 returning setup/settings/history IA](../product-decisions/features/mobile-refresh/pd-phase-02-2-returning-setup-settings.md)
- [Phase 3 planning](../product-decisions/features/mobile-refresh/pd-phase-03-planning.md)
- [Phase 3.1 design facelift and recipe imagery](../product-decisions/features/mobile-refresh/pd-phase-03-1-recipe-imagery.md)
- [Phase 3.2 progressive pantry staple check](../product-decisions/features/mobile-refresh/pd-phase-03-2-progressive-staples.md)
- [Phase 4 cooking](../product-decisions/features/mobile-refresh/pd-phase-04-cooking.md)
- [Phase 5 post-cook](../product-decisions/features/mobile-refresh/pd-phase-05-post-cook.md)
- [PD-012 public anonymous trial and account upgrade](../product-decisions/pd-012-public-anonymous-trial-and-account-upgrade.md)
- [AI privacy, prompt-injection, and abuse rules](../product-decisions/features/mobile-refresh/pd-cross-phase-ai-privacy.md)
- [Dev-test harness plan](../product-decisions/features/mobile-refresh/pd-dev-test-harness.md)
- [PD-005 UI governance](../product-decisions/pd-005-ui-governance.md)
- [PD-009 mobile refresh navigation](../product-decisions/pd-009-mobile-refresh-navigation.md)
- [PD-011 scan upload photo limit policy](../product-decisions/pd-011-scan-upload-photo-limit-policy.md)
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
| Phase 2.2 | Merged | PR #30 / `codex/mobile-refresh-phase-2-2-settings-history`; [#170](https://github.com/wmishak404/laica/pull/170) / `codex/setup-tools-privacy-copy`; [#171](https://github.com/wmishak404/laica/pull/171) / `codex/pr170-merge-closeout` | Returning Settings/History IA accepted and merged as `bc25ef3`; Kitchen Inventory consolidation, optional Tools setup, and setup draft restore merged as `c164f58`; final Kitchen Inventory profile UI polish merged as `ca13ccd` |
| Phase 3 | Merged | [#38](https://github.com/wmishak404/laica/pull/38) + [#45](https://github.com/wmishak404/laica/pull/45) | Functional Planning/Chef It Up/Ticket Pass/Prep Tray/Slop Bowl closed; baseline validated at `8a5c3d5` and merged as `f1d17d8`; generation lock/cancel validated at `0c98a47` and merged as `8892327` |
| Phase 3.1 | In progress | [#69](https://github.com/wmishak404/laica/pull/69), [#73](https://github.com/wmishak404/laica/pull/73), [#75](https://github.com/wmishak404/laica/pull/75), [#81](https://github.com/wmishak404/laica/pull/81), [#141](https://github.com/wmishak404/laica/pull/141), [#175](https://github.com/wmishak404/laica/pull/175); [#78](https://github.com/wmishak404/laica/pull/78) closed unmerged | Kickoff/audit, Planning copy/count emphasis, Slop Bowl pantry-check chip alignment, Setup/Settings inventory review chip states, Slop Bowl generated-result button typography alignment, PR #78 abandonment/retry brief, and accepted Ticket Pass hierarchy retry are merged. Remaining scope is light Prep Tray alignment if needed, Planning toast cleanup, async imagery, ingredient chip unification, and closeout visual review |
| Phase 3.2 | Merged | [#46](https://github.com/wmishak404/laica/pull/46) / `codex/mobile-refresh-phase-3-2-progressive-staples` | Progressive Added shelf / rolling staple queue validated at `9646c80`; merged as `b22f6b6`; behavior baseline for Phase 3.1 |
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
| #38 | Merged | `codex/mobile-refresh-phase-3-planning` | Phase 3 functional Planning/Chef It Up/Ticket Pass/Prep Tray/Slop Bowl validated at `8a5c3d5`; merged as `f1d17d8` |
| #43 | Merged | `codex/epic-018-auth-ai-errors` | EFF-018 authenticated AI error handling merged as `1110b00`; Replit PASS at `860bd68` carried to `14ac1c4` by Wilson diff review |
| #44 | Merged | `codex/epic-018-closeout` | EFF-018 docs closeout merged as `24decb2`; PR #45 later rebased onto this main head before merging |
| #45 | Merged | `codex/phase-3-generation-cancel` | Phase 3 generation lock/cancel follow-up validated at `0c98a47`; merged as `8892327` |
| #46 | Merged | `codex/mobile-refresh-phase-3-2-progressive-staples` | Phase 3.2 progressive staple queue authenticated Replit/browser validation passed at `9646c80`; merged as `b22f6b6` |
| #53 | Merged | `codex/epic-021-scan-upload-implementation` | EFF-021 scan upload runtime slice validated at `ef28e59`; merged as `9aa6c1c` |
| #73 | Merged | `codex/mobile-refresh-phase-3-1-slop-pantry-align` | Slop Bowl pantry-check chips aligned with Chef It Up saved/recent grammar; merged as `e44c5b0` |
| #74 | Closed / superseded | `codex/mobile-refresh-phase-3-1-inventory-chip-states` | Stacked PR auto-closed when #73 merged and the base branch was deleted |
| #75 | Merged | `codex/mobile-refresh-phase-3-1-inventory-chip-states` | Replacement against `main`; implements Setup/Settings Pantry/Kitchen saved/recent/found-again chip states; Wilson/Replit validated at `1e93bf8`; merged as `c82433d` |
| #76 | Merged | `codex/mobile-refresh-inventory-chip-closeout` | Docs-only closeout after PR #75; merged as `f5f7d1d` |
| #78 | Closed / abandoned | `codex/mobile-refresh-phase-3-1-ticket-prep-polish` | Ticket Pass / Prep Tray polish branch passed focused local checks and earlier behavioral smoke on `7e6c817`, but visual acceptance was withdrawn and later placeholder/layout experiments were rejected; branch rolled back to baseline and closed unmerged at `672f14e` |
| #81 | Merged | `codex/mobile-refresh-phase-3-1-ticket-pass-plan` | Docs-only abandonment and retry-planning follow-up after PR #78; merged as `7630d97` and establishes the narrower layout-only Ticket Pass brief from fresh `origin/main` |
| #141 | Merged | `codex/slop-bowl-button-fonts` | Slop Bowl generated-result and feedback buttons aligned with Chef It Up suggestion-button typography; Wilson Replit visual pass at `9d30177`, post-rebase local checks and GitHub CI at `8f11990`; merged as `2145407` |
| #170 | Merged | `codex/setup-tools-privacy-copy` | Kitchen Inventory now contains Pantry and Tools, first-time setup asks before optional Tools capture, and setup draft restore survives Replit preview refresh/remounts; GitHub CI and Replit Chrome smoke passed at `3b867b9`; merged as `c164f58` |
| #171 | Merged | `codex/pr170-merge-closeout` | Final Kitchen Inventory profile UI polish: Tools reassurance copy, kitchen-specific iconography, checkmark completion hero, connected Pantry/Tools header tabs, rectangular-top inventory panel, and PR #170 closeout docs; GitHub CI and Replit Chrome visual smoke passed at `05ff50e`; merged as `ca13ccd` |
| #173 | Merged | `codex/settings-save-remount-restore` | Settings active-section restore mitigation for signed-in save/remount route loss; dependency audit blocker cleared by PR #176 first, GitHub CI passed at `b81a0c7`, focused Replit smoke confirmed refresh restored the previous page/section, and PR merged as `4ee5c27` |
| #175 | Merged | `codex/init-001-ticket-pass-hierarchy` | Layout-only Ticket Pass hierarchy retry accepted in targeted Replit smoke, passed local checks plus GitHub `unit`, `e2e_guest_smoke`, `npm-audit`, `trufflehog_pr`, and CodeQL at head `100cbd66`; squash-merged as `6510860` |

## Efforts and Governance

| Reference | Relevance |
|---|---|
| [PD-005](../product-decisions/pd-005-ui-governance.md) | UI governance operating model |
| [`design_guidelines.md`](../design_guidelines.md) | Canonical visual identity / design standard |
| [Testing and Acceptance Workflow](../docs/workflows/testing-and-acceptance.md) | Merge readiness, validation evidence, and Feature Impact Review workflow formerly tracked by EFF-005/EFF-020 |
| [EFF-010](../efforts/effort-010-local-db-schema-strategy.md) | DB/schema authority and no local shared DB pushes |
| [EFF-013](../efforts/effort-013-pantry-manual-entry-spell-correction.md) | Resolved pantry manual-entry spell correction; future pantry spelling/canonicalization work should start from the shipped behavior and create a new Effort only if the follow-up is standalone |
| [EFF-014](../efforts/effort-014-scan-session-diff-and-duplicate-refinement.md) | Resolved by PR #75 for existing Setup/Settings scan-review chip states; Phase 5 post-cook rescan labels remain in Phase 5 |
| [EFF-017](../efforts/effort-017-environment-parity-and-ci-confidence.md) | Deferred environment-parity / smoke-confidence work; reopen only as a narrow Phase 4 harness pilot that does not replace Replit validation |
| [EFF-018](../efforts/effort-018-authenticated-ai-error-handling.md) | Resolved authenticated AI error handling and pantry recipe 400 follow-up; Phase 4 still owns live-cooking inline recovery |
| [EFF-021](../efforts/effort-021-scan-upload-photo-limit-policy.md) | Resolved mobile-refresh scan-capacity policy; retained as historical reference for Pantry/Kitchen upload limits and scan-specific messaging |

## Changes Added After Initial Plan

- Dev-test harness planned for future Firebase custom-token dev auth, not backend bypass.
- Mockup conformance gate added: linked mockups are implementation inputs, not loose inspiration.
- Setup visual/trust polish split from functional Phase 2 into Phase 2.1.
- Text-only/document-like scan safeguard folded into Phase 2.1.
- Stacked PR base refresh and Replit validation SHA hygiene added after early stale-preview risk.
- INIT system added to prevent future context loss across long phased work.
- Phase 2.2 added before Phase 3 so returning users can revisit Pantry, Kitchen/Tools, Cooking Profile, Settings, and History through Menu.
- UI governance and visual standards graduated to [PD-005](../product-decisions/pd-005-ui-governance.md) and [`design_guidelines.md`](../design_guidelines.md).
- Product decision taxonomy cleanup added on 2026-05-05 so top-level PDs stay stable decision records and feature-phase records do not become indefinite diaries.
- EFF-018 was filed from Phase 3 Replit validation to preserve the follow-up bug around demo-era AI error toasts/redirects masking pantry recipe 400s, then resolved by PR #43.
- EFF-019 was filed from the EFF-018 messaging review so persistent AI error/eval logging can proceed separately with an allowlist-first redaction policy.
- Phase 3.1 expanded on 2026-05-05 to own the Phase 3 design-drift review, root-cause notes, recommendations, and recipe imagery follow-up instead of creating a standalone active Effort.
- Phase 3 visuals frozen on 2026-05-06 so Phase 3 can close on functional validation; Phase 3.1 now owns the whitespace/card grammar, typography, Slop Bowl humor, Ticket Pass, Prep Tray, bottom nav, docs, and imagery facelift.
- Slop It Up copy direction added on 2026-05-08: Phase 3.1 should rename the Planning choice card title from `Slop Bowl` to `Slop It Up`, keep the durable feature name `Slop Bowl`, and rotate one approved italic supporting-copy line on page load.
- Ticket Pass selection orientation was fixed after the visual freeze as a basic-usability exception: recipe order stays stable, the selected ticket expands in place, and recipe names show a main/supporting split only when explicit supporting detail exists, without changing the stored recipe name.
- Chef It Up staple verification was added after the visual freeze as a recipe-quality/basic-usability exception: selected cuisines can trigger a deterministic missing-staple check, confirmed staples save to pantry, and recipe suggestions now target a hidden pantry-strict / pantry-flexible / cuisine-leaning range.
- Chef It Up generation lock/cancel was added after the visual freeze as a functional correctness exception: in-flight recipe generation freezes the submitted staple rows and disables cuisine/staple inputs, while Back aborts the request and prevents late auto-advance.
- Phase 3 closed functionally on 2026-05-08 after PR #38 and PR #45 shipped the Planning slice and the generation lock/cancel follow-up. Phase 3.1 is the next design-focused pass; Phase 4 is the next cooking-flow implementation phase.
- Phase 3.2 was added after PR #45 merged so the Chef It Up staple check can use a progressive Added shelf and rolling queue. This is behavior/interaction polish, not the Phase 3.1 visual facelift; Phase 3.1 should preserve or deliberately restyle the Phase 3.2 behavior when it implements the facelift.
- Phase 3.2 Replit review at `968d39a` kept pantry persistence timing as designed: pending Added chips are not saved on Back before submit, and confirmed staples become pantry facts only when `View recipe suggestions` starts generation. The follow-up adds pending-chip `+` + visible `X` removal, green check-only saved chips after the DB write succeeds, duplicate-save avoidance for already-saved selected staples, and submit-timing copy; full pantry-list context stays out of Phase 3.2.
- Slop Bowl pantry-check visual alignment was added to Phase 3.1 scope after Wilson preferred the newer Chef It Up Phase 3.2 chip/row direction. Phase 3.1 should compare the two surfaces and align visual grammar where appropriate without changing Slop Bowl behavior unless explicitly revisited.
- Phase 3.2 shipped through PR #46 after Wilson's authenticated Replit/browser validation at `9646c80`. Replit code-path review also passed, but the team explicitly recorded the distinction between code-verified checks and authenticated browser validation, feeding the later EFF-017 / dev-test-harness automation work.
- Scan upload capacity policy was accepted on 2026-05-08 in [PD-011](../product-decisions/pd-011-scan-upload-photo-limit-policy.md) and tracked for implementation by [EFF-021](../efforts/effort-021-scan-upload-photo-limit-policy.md): Pantry and Kitchen should each support 20 images per inventory refresh, 40 images per day per area, bounded concurrent scan processing, and scan-specific progress/partial-success/error copy.
- EFF-021 runtime implementation started on 2026-05-08 in `codex/epic-021-scan-upload-implementation`: shared scan policy constants, setup/Settings 20-photo per-refresh caps, unsupported-file counting semantics, per-refresh copy, progress/partial-success copy, image-count-aware server limiter plumbing, bounded 4-at-a-time scan concurrency, and focused unit coverage. Fresh-account scan churn is recorded as a known non-blocking risk; stronger daily/global IP caps are deferred until real usage or cost signals justify them, with OpenAI/project-level limits treated as a final spend-safety backstop rather than normal product control.
- EFF-021 also captured returning-user empty-Pantry guardrails on 2026-05-08: clearing Pantry is a valid inventory state and should not return the user to first-time setup or reset Tools/Profile/History; pantry-based recipe generation should block with explicit empty-Pantry recovery copy; active Settings scans should cancel/ignore stale results when leaving Settings and lock inventory edits while running. This corner case feeds the testing workflow so reset-to-empty states, in-flight async navigation, and cross-domain persistence checks become part of feature acceptance review.
- EFF-021 Replit follow-up on 2026-05-08 found the empty-Pantry Chef It Up blocker was too late in the flow. The Planning choice now owns a quiet Pantry status line under "What are we cooking today?" and Chef It Up blocks immediately on card tap when Pantry is empty, while Slop Bowl remains available. A final Replit check at `ef28e59` confirmed the latest status-line behavior works as designed; the notification icon was removed and final visual treatment is deferred to Phase 3.1.
- PR #53 merged the EFF-021 runtime slice into `main` as `9aa6c1c`. Wilson accepted the validated bounded-concurrency implementation as sufficient and chose not to keep provider-level batching as active scope, so EFF-021 closed as resolved. The merged slice satisfies the runtime cap, same-limit, rate-limit, progress, partial-success, active-scan lifecycle, and empty-Pantry guardrail work.
- EFF-013 resolved on 2026-05-13 after PR #62 shipped conservative setup/Settings pantry manual-entry correction with visible chip provenance, Undo, pantry-only scope, targeted tests, and Replit validation. Future pantry spelling/canonicalization starts from the shipped behavior, not an active EFF-013 read-list item.
- EFF-015 resolved on 2026-05-13 after PR #64 shipped the PR-template reviewer gate and local ESLint hex-class guard. Future UI governance starts from PD-005, `design_guidelines.md`, `.github/PULL_REQUEST_TEMPLATE.md`, and `eslint.config.js`, not an active Effort.
- Public guest entry is now governed by [PD-012](../product-decisions/pd-012-public-anonymous-trial-and-account-upgrade.md) and [INIT-003](INIT-003-anonymous-trial-and-account-upgrade.md). Phase 1's Google-only landing remains the historical shipped baseline, while Phase 5 durable history/cleanup/taste memory is explicitly linked-only in the guest-trial v1 policy.
- PR #78 proved the current Phase 3.1 Ticket Pass gap is about hierarchy and object language, not just placeholder art. The rejected overcorrection also established a negative constraint for future work: do not use fake bowl/noodle/skillet illustrations as a stand-in for the later async imagery slice, and do not trade away compact-ticket readability for a more theatrical ticket silhouette.
- PR #141 fixed Slop Bowl generated-result button typography drift by putting the generated-result/feedback surfaces under the Planning typography wrapper and using the same `h-12`, `rounded-xl`, `font-extrabold` action-button contract as adjacent Chef It Up recipe-suggestion controls. Future Slop Bowl button work should compare computed styles against Chef It Up rather than trusting local class names.
- PR #170 consolidated the Profile/Settings inventory language into Kitchen Inventory with Pantry and Tools, kept Pantry/Tools scans separate, kept backend `pantryIngredients` / `kitchenEquipment` / scan type `kitchen` contracts unchanged, removed tracking-framed inventory copy, and made setup draft restore browser-local so Replit preview refreshes/remounts preserve in-progress Pantry/Tools entries while Start Over clears the draft.
- PR #171 completed the Kitchen Inventory profile UI polish: optional Tools copy now reassures users that skipped Tools still use common kitchen basics, setup completion uses a simple checkmark hero, returning Settings uses connected Pantry/Tools tabs beside a subordinate Back chip, the inventory panel has a rectangular top edge with rounded bottom corners to avoid tab/card-radius artifacts, and the inert top-right Settings chip plus duplicate inner Pantry/Tools selector stay removed.
- PR #173 added a Settings active-section restore mitigation for signed-in save/remount route loss. This is a route-preservation remedy after remount, not a root-cause fix for the intermittent refresh trigger.
- PR #175 completed the PR #81 Ticket Pass retry brief as a layout-only runtime slice: shared ticket-pass backing, clearer selected ticket depth, readable compact rows, and a regression test that keeps generated order stable while selection expands in place. It intentionally leaves recipe imagery, Prep Tray redesign, prompts/providers, Settings, navigation, and backend behavior untouched.

## Validation State

Known validation facts:

- Replit validation passed at PR #23 head `f037552b37169f26e5fe2fe872f68150138812a6`.
- PR #23 merged into `main` as merge commit `eca3d1b504e8eb33edbeb74e78cf2755b760577f`.
- Phase 2.1 runtime Replit/mobile validation was recorded at `ac698a3`.
- Phase 2.1 final branch head `eaff0e8` was docs-only after validation.
- PR #27 merged Phase 2.1 into `main` as merge commit `5419a901af45f0e1a8e40fbc813ee52978c14f86`.
- Deeper scan-review polish remains phase-owned future work inside INIT-001 rather than a standalone Effort.
- Phase 2.2 Replit validation passed at `dc59796ae1602af4643c5fc640be47ab19a59e04`.
- PR #30 merged Phase 2.2 into `main` as merge commit `bc25ef35cb14f32cf6b05507ede77161bd743091`.
- Phase 2.2 validated Menu -> Settings, Menu -> History, Slop Bowl -> Edit pantry, Pantry/Tools/Profile saves, History list/expand/delete/undo, feedback context, returning Settings visual parity, local typecheck/build, and relevant Vitest coverage.
- Phase 3 local validation on `codex/mobile-refresh-phase-3-planning` passed `npm run check`, `npm run build`, `npx vitest run tests/unit/planning-time.test.ts tests/unit/slop-bowl-route.test.ts`, `git diff --check`, and a dotenvx dev-server boot smoke returning HTTP 200 on port 3000.
- Phase 3 baseline Replit validation passed at `8a5c3d5`; PR #38 merged Phase 3 into `main` as `f1d17d8`.
- The latest optional-enhancement contract patch passed `git diff --check`, `npm run check`, `npm run build`, and `npx vitest run tests/unit/recipe-suggestion-normalizer.test.ts tests/unit/planning-staples.test.ts`.
- The recipe-suggestion metadata patch passed `git diff --check`, `npm run check`, and `npm run build`.
- EFF-018 Replit validation passed at `860bd68`; Wilson reviewed the post-validation cleanup diff and confirmed the pass carries to `14ac1c4`. PR #43 merged the branch into `main` as `1110b0088211be593d234ea26392b47384d43470`.
- The Phase 3 generation lock/cancel follow-up on `codex/phase-3-generation-cancel` passed `npm ci`, `npx vitest run tests/unit/meal-planning.test.tsx tests/unit/planning-staples.test.ts`, `npm run check`, `npm run build`, and `git diff --check` on top of PR #44 (`24decb2`). Replit validation passed at `0c98a47`; PR #45 merged the follow-up into `main` as `8892327`.
- Phase 3.2 local validation passed `npx vitest run tests/unit/meal-planning.test.tsx tests/unit/planning-staples.test.ts`, `npm run check`, `npm run build`, and `git diff --check`.
- Phase 3.2 Replit code-path review passed at `9646c80`: 19/19 targeted unit tests, TypeScript clean, build clean, and behavioral code checks confirmed. Pantry-save failure remained code-verified rather than manually forced in the live UI.
- Phase 3.2 authenticated Replit/browser validation passed at `9646c80` by Wilson manual live preview: all 11 live UI steps passed, including rolling queue, pending chip undo, Back-before-submit no-save, submit-time pantry persistence, saved green-check-only chips, Pantry Settings inline note, no duplicate/resave behavior, loading freeze, Back cancel, Ticket Pass completion, and exactly three suggestions.
- EFF-021 local validation on `codex/epic-021-scan-upload-implementation` passed `npx vitest run tests/unit/user-profiling.test.tsx tests/unit/user-settings-scan-policy.test.tsx tests/unit/rate-limit.test.ts`, then the expanded guardrail run `npx vitest run tests/unit/profile-readiness.test.ts tests/unit/meal-planning.test.tsx tests/unit/user-settings-scan-policy.test.tsx tests/unit/user-profiling.test.tsx tests/unit/rate-limit.test.ts tests/unit/phase0-security-routes.test.ts`, plus `npm run check`, `npm run build`, `git diff --check`, and a dotenvx dev-server boot with HTTP 200 on port 3000. An earlier local in-app browser smoke reached the unauthenticated Laica welcome screen. Wilson's authenticated Replit pass covered scenarios 1-6 and 8-10 at `aa2f434`, with scenario 7 provisionally passing because native phone/desktop pickers blocked non-image selection; Wilson's later Replit check confirmed the core latest behavior looked good and active-scan Save/Reset controls were not pressable, but found the empty-Pantry Chef It Up blocker needed to move earlier. The follow-up Planning status/tap-blocker changes were validated in Replit at `ef28e59`; all items worked as designed. PR #53 merged the validated runtime slice into `main` as `9aa6c1c`.
- Phase 3.1 Slop Bowl pantry-check alignment in PR #73 passed `npx vitest run tests/unit/slop-bowl.test.tsx tests/unit/meal-planning.test.tsx`, `npm run check`, `npm run build`, and `git diff --check`; PR #73 merged as `e44c5b0`.
- Phase 3.1 Setup/Settings inventory chip-state alignment in PR #75 passed `npx vitest run tests/unit/entry-parsing.test.ts tests/unit/user-settings-scan-policy.test.tsx tests/unit/user-profiling.test.tsx tests/unit/meal-planning.test.tsx tests/unit/slop-bowl.test.tsx`, `npm run check`, `npm run build`, `git diff --check`, and a dotenvx dev-server HTTP 200 smoke. Wilson confirmed Replit was on head `1e93bf8fdcd9933dea3200e66c138c91a5c00be1` and validated the Settings Pantry minimum path; PR #75 merged as `c82433d9089ca4e9cc86b5d5e77322981333eba3`.
- PR #78's early authenticated Replit/browser pass at `7e6c8174878e76b01807ee7b1f3b3479ddb3be66` still stands only for behavioral scope: suggestion reveal, stable in-place ticket expansion for tickets 1/2/3, Prep Tray open for the selected ticket, and placeholder stability when `imageUrl` is absent. That branch never achieved visual acceptance. A later same-day illustration/layout experiment was rejected and rolled back, and PR #78 closed unmerged at `672f14e17387f601fe4a18bc0106d58108660467`.
- Phase 3.1 Slop Bowl generated-result button typography alignment in PR #141 passed `npx vitest run tests/unit/slop-bowl.test.tsx tests/unit/meal-planning.test.tsx`, `npm run check`, `npm run build`, and `git diff --check` at rebased PR head `8f11990`; GitHub CI also passed at that head. Wilson visually confirmed the Slop Bowl generated-result buttons and Chef It Up recipe-suggestion buttons in Replit at pre-rebase head `9d30177` before the branch was rebased over docs-only `origin/main` commit `b040952`; PR #141 merged as `2145407`.
- PR #170 passed GitHub `unit`, `e2e_guest_smoke`, CodeQL, `npm-audit`, and TruffleHog at head `3b867b94ee9760888d65fc8cc20b5e325ebcd894`. Replit Chrome smoke at the same head passed Pantry manual entry -> optional Tools intro -> Tools manual `blender` -> Preview refresh restoring Tools with `blender`, and Start Over -> fresh guest start returning to `Yes, Chef!` without stale Tools state. PR #170 merged as `c164f58a30e1fb382c30fa1ee6d7f2033c20ea0a`.
- PR #173 passed GitHub `npm-audit`, `unit`, `e2e_guest_smoke`, CodeQL, and TruffleHog at head `b81a0c78d2c711e0263396e6db77dd983100db39` after rebasing over PR #176's dependency audit fix. Wilson's focused Replit smoke on that exact head confirmed manual refresh returned to the previously active page/section; the original unexpected refresh could not be reproduced. PR #173 merged as `4ee5c27df2ec9dc9ed127d18c3e3a02c81995b3a`.
- PR #171 passed GitHub `unit`, `e2e_guest_smoke`, CodeQL, `npm-audit`, and TruffleHog at head `05ff50ea9ca37d5a5c1e832ac23a28924f117be8`. Replit Chrome visual smoke at the same head passed Pantry/Tools tab attachment, selected/unselected contrast, the subordinate Back chip, the rectangular-top panel without rounded-corner notch artifacts, and Pantry/Tools selected-state swaps. Local validation included focused/full `user-profiling` and `user-settings-scan-policy` Vitest coverage, `npm run check`, `npm run build`, and `git diff --check`. PR #171 merged as `ca13ccd261c328420bfb4292d19905bc5bec4683`.
- PR #175's Ticket Pass hierarchy retry passed local `npm ci`, `npm audit --audit-level=high`, `npx vitest run tests/unit/meal-planning.test.tsx`, `npm run check`, `npm run build`, and `git diff --check origin/main...HEAD` after rebasing onto `origin/main` `a20406a`. Browser fixture validation was attempted but not claimed because the in-app Browser rejected local `data:` and `file:` fixture URLs under its URL policy. Wilson then completed targeted Replit smoke at head `100cbd66`: login, happy path to recipe suggestions, ticket 1/2/3 selection with no reorder and in-place expansion, Prep Tray from the selected ticket, refresh suggestions, compact readability, and scroll/fit. GitHub `unit`, `e2e_guest_smoke`, `npm-audit`, `trufflehog_pr`, and CodeQL passed at `100cbd66`; PR #175 merged as `6510860`.
- Full `npx vitest run` is not green because existing repo-wide harness issues remain outside Phase 3 scope: `tests/e2e/cooking-workflow.test.ts` is a Playwright file being collected by Vitest, and `tests/unit/voice-recording.test.ts` expects `MediaStream` in the test environment.

## Current Resume Point

Phase 3 is functionally closed on `main` after PR #38 (`f1d17d8`) and PR #45 (`8892327`). Phase 3.2 is also merged after PR #46 (`b22f6b6`). Do not resume `codex/mobile-refresh-phase-3-planning`, `codex/phase-3-generation-cancel`, or `codex/mobile-refresh-phase-3-2-progressive-staples`.

Next implementation / validation focus:

1. Continue Phase 3.1 from fresh `origin/main` only after deciding the next narrow slice. The Ticket Pass hierarchy retry from PR #175 is merged and should not be reopened as another hierarchy-only branch unless new evidence shows a regression. The next documented Phase 3.1 candidates are light Prep Tray shell alignment if Ticket Pass acceptance exposes adjacent mismatch, Planning toast cleanup (`Your kitchen is ready` supporting line and persistence), ingredient chip unification, async/cached generated imagery into existing `imageUrl` slots, or closeout visual review.
2. When Phase 3.1 revisits Planning entry polish, remove the post-setup toast supporting line `I'll remember this on this browser while you try Laica.` and make Planning-entry success/error/status messages auto-dismiss or otherwise avoid staying pinned over the Chef It Up / Slop It Up cards unless user action is required.
3. Start Phase 4 from fresh `origin/main` when cooking guidance begins. Phase 4 owns the hands-busy cooking flow and the live-cooking inline AI error recovery that EFF-018 intentionally deferred.
4. Keep richer History share/cook-again/taste-memory behavior deferred to Phase 5 unless Wilson explicitly pulls it forward.
5. Reopen authenticated smoke automation / environment-parity work in a separate EFF-017 branch as a narrow Phase 4 harness pilot. The pilot should reduce repeated manual checks without replacing the current Replit validation gate until the harness earns trust. Testing workflow cleanup now lives in `docs/workflows/testing-and-acceptance.md` and `docs/workflows/effort-system-audit.md`, not an active Effort.
6. Pantry spell correction is resolved through EFF-013 / PR #62. Setup/Settings scan-review chip states are resolved through EFF-014 / PR #75. Future pantry spelling/canonicalization or scan-review work should start from the shipped behavior and create a new Effort only when the follow-up is standalone outside INIT/phase/PD/workflow scope. Phase 5 post-cook rescan labels remain in the Phase 5 record.
7. Coordinate any future guest-auth, upgrade, or Phase 5 returning-user memory changes with [INIT-003](INIT-003-anonymous-trial-and-account-upgrade.md). Do not reopen Phase 1 or Phase 5 assumptions in isolation. After Phase 5 is implemented and validated, trigger the INIT-003 checkpoint for whether any user-consented guest current-cook or selected-cook History import after Google linking should exist.

Plan B sequencing note for the INIT-003 public homepage:

- The public homepage + guest MVP can ship before INIT-001 Phase 4 as long as INIT-003 production gates are met and the page does not imply durable guest memory.
- Phase 4 should still start later from fresh `origin/main` when cooking guidance becomes the next implementation focus.
- Phase 5 remains after Phase 4 because it depends on Phase 4 completion semantics: history save, no pantry mutation on Finish, and pending cleanup state.
- Guest-facing Phase 4/5 copy must distinguish local guest continuation from linked-account cooking history, cleanup, taste memory, and retention.
- Replit validation of INIT-003 on 2026-05-26 exposed a Phase 4 acceptance item: if voice synthesis/playback has started, Back to Planning or any other cooking-guide exit must stop active/queued audio so speech cannot continue after leaving the cooking surface.

## Sequencing Semantics

INIT order is the default resume path, not automatically a hard dependency graph.

| Work relationship | Classification | Notes |
|---|---|---|
| INIT-003 Plan B homepage before Phase 4 | Parallel-safe with production gates | The public homepage + guest MVP may ship first if anonymous auth, quota, App Check, kill-switch/rate-limit posture, and linked-save boundaries are validated. |
| Phase 3.1 before Phase 4 | Soft sequence | Phase 3.1 is the default next design pass, but Phase 4 is not blocked by it. Phase 4 may start first if cooking guidance is the higher priority. |
| Phase 3.1 alongside Phase 4 | Parallel-safe with guardrails | Avoid shared file ownership conflicts. If Phase 4 creates or exposes visual consistency debt, record it back to Phase 3.1 or the relevant phase record. |
| Phase 4 before Phase 5 | Hard dependency | Phase 5 depends on Phase 4 completion semantics: cooking history save, no pantry mutation, and pending cleanup state. |
| EFF-017 harness with Phase 4 | Support / pilot | The harness can help Phase 4 validation, but it does not replace the current Replit validation gate until a later explicit policy change. |

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

Resolved UI governance and design-language Efforts graduated to [PD-005](../product-decisions/pd-005-ui-governance.md) and [`design_guidelines.md`](../design_guidelines.md). Active UI work should read those instead of treating resolved Efforts as live governance.

### 2026-05-05 - Process and product-decision taxonomy cleanup

PR #34 merged the docs-only process and product-decision taxonomy cleanup as merge commit `6288aefce3d923092d496ace535f7a3e8841f506`. Claude's substantive taxonomy findings were folded into the PR before merge. Phase 3 should now start from fresh `origin/main` with the cleaned documentation structure.

### 2026-05-07 - EFF-018 authenticated AI error handling merged

PR #43 merged the cross-app authenticated AI error handling fix into `main` as `1110b0088211be593d234ea26392b47384d43470`. Phase 3 remains the current mobile-refresh resume point, while Phase 4 owns the live-cooking inline error recovery that EFF-018 intentionally deferred.

### 2026-05-08 - Phase 3 functionally closed

PR #38 merged the main Phase 3 Planning implementation as `f1d17d8` after Replit validation at `8a5c3d5`. PR #45 merged the generation lock/cancel follow-up as `8892327` after Replit validation at `0c98a47`. Phase 3.1 now owns the deliberate design facelift and recipe imagery work; Phase 4 owns cooking guidance.

### 2026-05-08 - Slop It Up copy direction added to Phase 3.1

Wilson accepted **Slop It Up** as the Planning choice card title for the Slop Bowl path. The underlying feature remains **Slop Bowl**. Phase 3.1 now owns implementation of the load-time rotating, italicized supporting copy alongside the broader Planning facelift.

### 2026-05-08 - Phase 3.2 progressive staples opened

Phase 3.2 was filed for the progressive Chef It Up Added shelf / rolling staple queue. It is intentionally separate from Phase 3.1: Phase 3.1 owns facelift and imagery, while Phase 3.2 could implement behavior on top of the merged cancellation fix and later become the behavior baseline for the facelift.

### 2026-05-08 - Phase 3.2 progressive staples merged

PR #46 merged Phase 3.2 into `main` as `b22f6b6` after Wilson's authenticated Replit/browser validation at `9646c80`. The shipped behavior is now the Chef It Up staple-check baseline for Phase 3.1: rolling ranked staple rows, Added shelf, pending `+` + `X` undo chips, submit-time pantry persistence, saved green-check-only pantry facts, saved-chip Pantry Settings explanation, no duplicate/resave calls for already-saved staples, submit-time freeze, and Back cancellation.

### 2026-05-09 - Effort cleanup repoints Mobile Refresh follow-ups

The Effort system cleanup closed EFF-004, EFF-007, EFF-009, and EFF-016 as standalone active items because their remaining work is now owned by INIT-001 phase records or already shipped Mobile Refresh behavior. Phase 3.1 remains the right home for current Slop Bowl visual alignment and design facelift work.

### 2026-05-11 - Pantry spell correction and richer scan review ownership revisited

The weekly Effort hygiene audit initially tried to close EFF-013 and EFF-014 out of the standalone list because both are clearly adjacent to Mobile Refresh history. That prompted a follow-up ownership review: adjacency to an INIT is not enough by itself if no specific unclosed phase naturally owns the remaining work.

### 2026-05-11 - Follow-up ownership rule corrected

Wilson clarified that adjacent initiative work should only move out of the Effort system when a specific unclosed INIT phase naturally owns it or the work is already shipped. Pantry spell correction and richer scan-review cleanup do not yet meet that bar, so they remain active Efforts even though INIT-001 should stay aware of them during future phase work.

### 2026-05-11 - Effort hygiene closeout merged

PR #57 merged into `main` as `8654d04` and made the corrected routing rule durable in the Effort hygiene workflow, active Effort files, registry/read lists, and INIT references. The resulting baseline is:

- At that point, EFF-013 and EFF-014 stayed active until a specific unclosed Mobile Refresh phase explicitly owned them or the work shipped. EFF-013 later shipped and resolved on 2026-05-13.
- Future effort-hygiene audits should determine whether a phase is still open/future from the INIT phase table, current phase, and current resume point rather than the phase-record `Status:` line alone.

### 2026-05-13 - EFF-013 and EFF-015 resolved

PR #62 merged pantry manual-entry spell correction as `8de1e88`, and PR #63 closed EFF-013 as `12467f8`. PR #64 merged UI-governance enforcement as `e4d5cfe`, and PR #65 closed EFF-015 as `c969fbd`. For current Effort status (what is active vs deferred vs resolved), rely on `efforts/README.md` (active read list) and each Effort file header, not chronology text.

### 2026-05-14 - Phase 3.1 kickoff audit merged

PR #69 merged the Phase 3.1 kickoff/audit docs into `main` as `d6e422e`. Phase 3.1 remains the next default agenda item, still as a soft sequence before Phase 4 rather than a hard blocker. The first recommended runtime slice is the Planning entry **Slop It Up** title and stable italic supporting-copy treatment; broader UI facelift, Slop Bowl pantry-check visual alignment, Ticket Pass/Prep Tray polish, and async imagery stay separate slices.

### 2026-05-14 - Phase 3.1 inventory chip states merged

PR #73 merged the Slop Bowl pantry-check chip alignment as `e44c5b0`, and PR #75 merged Setup/Settings Pantry/Kitchen saved/recent/found-again inventory review chip states as `c82433d`. Wilson confirmed the Replit head `1e93bf8fdcd9933dea3200e66c138c91a5c00be1` and validated the Settings Pantry minimum path after the branch was rebased onto `main`; earlier screenshots on the same branch family covered Settings Kitchen, Slop Bowl parity, and first-time setup Pantry/Kitchen states. EFF-014 is resolved for Setup/Settings, with Phase 5 post-cook rescan labels still owned by Phase 5.

### 2026-05-15 - PR #78 abandoned; Ticket Pass retry narrowed

PR #78 attempted the remaining Ticket Pass / Prep Tray polish from fresh `origin/main`, but it did not reach an acceptable visual result. The first pass still read too much like the old centered card stack, and a later same-day overcorrection introduced fake illustration placeholders plus compact-ticket layout breakage that Wilson rejected immediately. The branch was rolled back to the safer baseline and closed unmerged at `672f14e`. Phase 3.1 should restart Ticket Pass from the current stable `main` surface with a narrower layout-only brief: preserve the current placeholder slot and readable compact-row skeleton, improve hierarchy through composition and silhouette around that skeleton, and defer generated imagery plus any broader Prep Tray redesign until after Ticket Pass is visually accepted.

### 2026-05-16 - PR #81 merged the abandonment plan

PR #81 merged the docs-only abandonment follow-up as `7630d97`. The rejected PR #78 branch is now historical only, and the durable baseline on `main` is explicit: the next Ticket Pass runtime attempt should start from fresh `origin/main`, preserve the current placeholder slot and compact-row readability as the minimum floor, and pursue a narrower layout-only hierarchy pass before any new imagery experiment.

### 2026-05-29 - Planning setup toast follow-up added to Phase 3.1

INIT-003 public guest validation exposed a Planning-entry polish issue that belongs to Phase 3.1 rather than the production-gates branch: after setup, the `Your kitchen is ready` toast includes the supporting line `I'll remember this on this browser while you try Laica.` and remains visible over the Chef It Up / Slop It Up cards. Phase 3.1 should remove that supporting line and review toast/banner persistence so transient success, error, and status messages do not cover the primary Planning choices unless action is required.

### 2026-06-05 - Slop Bowl generated-result button typography aligned

PR #141 merged Slop Bowl generated-result and feedback button typography alignment as `2145407`. The root cause was local Slop Bowl button sizing/weight plus a missing Planning typography wrapper, which made the `Let's cook this!`, `Try something else`, and `Plan your own meal instead` controls feel like a different app family from adjacent Chef It Up recipe-suggestion buttons. The merged fix adds the Planning wrapper and matches the shared action-button contract while keeping Slop Bowl behavior unchanged.

Wilson visually confirmed the Replit comparison at pre-rebase head `9d30177`; after the branch rebased over docs-only `main` closeout commit `b040952`, focused unit tests, `npm run check`, `npm run build`, `git diff --check`, and GitHub CI passed at PR head `8f11990`.

### 2026-06-11 - Kitchen Inventory consolidation merged

PR #170 merged the accepted Pantry/Tools profile consolidation as `c164f58`. Settings now presents Kitchen Inventory with Pantry and Tools inside it, first-time setup asks before opening the optional Tools capture surface, visible Kitchen/equipment language is replaced with Tools, and backend profile/scan contracts remain unchanged. The follow-up also fixed the Replit preview refresh/remount data-loss path by restoring in-progress setup draft state in the browser and clearing it on setup finish or guest Start Over.

GitHub CI and Replit Chrome smoke passed at `3b867b94ee9760888d65fc8cc20b5e325ebcd894`; Wilson's passive-wait reproduction no longer reproduced the old data-loss problem before merge.

### 2026-06-11 - Kitchen Inventory UI polish merged

PR #171 merged the final profile consolidation UI polish as `ca13ccd`. The optional Tools intro now leads with `Any kitchen tools to add?`, frames the scan as optional, and reassures skippers that Laica will use common kitchen basics. Returning Settings now uses connected Pantry/Tools header tabs beside a smaller Back chip, removes the duplicate inner Pantry/Tools selector and inert Settings chip, and gives the Kitchen Inventory panel a rectangular top edge with rounded bottom corners so the tab rail does not create radius artifacts.

GitHub CI and Replit Chrome visual smoke passed at `05ff50ea9ca37d5a5c1e832ac23a28924f117be8`. The next runtime attempt should still start from fresh `main` for the narrower Ticket Pass Phase 3.1 retry unless Wilson pulls Phase 4 forward.

### 2026-06-12 - Ticket Pass hierarchy retry opened

Codex opened the PR #81 retry brief on `codex/init-001-ticket-pass-hierarchy` from fresh `origin/main` `ca03c3c`. The slice is deliberately layout-only: it makes the existing tickets read more like a connected pass stack through shared backing, selected-ticket depth, readable compact rows, and a regression test for stable generated order with in-place expansion.

This branch does not add fake illustrations, generated imagery, Prep Tray redesign, prompt/provider changes, Settings changes, navigation changes, or backend work. Local code validation passed, but `npm audit` was blocked by the existing `@grpc/grpc-js` advisory until PR #176 landed.

### 2026-06-13 - Ticket Pass branch rebased after audit and Settings merges

After PR #176 cleared the dependency audit blocker and PR #173/#179 landed the Settings remount mitigation and closeout, PR #175 was rebased onto fresh `origin/main` `a20406a`. Local validation passed including `npm audit --audit-level=high`, preparing the branch for final Replit visual smoke and ready-for-review CI.

### 2026-06-13 - Ticket Pass hierarchy retry merged

Wilson completed the targeted Replit smoke at PR #175 head `100cbd66`: login, happy path to recipe suggestions, ticket 1/2/3 selection without reorder, in-place expansion, Prep Tray from the selected ticket, refresh suggestions, compact readability, and scroll/fit. Wilson accepted the Ticket Pass hierarchy as good for now.

After the PR was marked ready, GitHub `unit`, `e2e_guest_smoke`, `npm-audit`, `trufflehog_pr`, and CodeQL passed on the exact head. PR #175 squash-merged into `main` as `6510860`. Future Phase 3.1 work should treat the connected pass stack as the accepted baseline and move to another documented slice rather than repeating the PR #78/PR #175 Ticket Pass hierarchy loop.
