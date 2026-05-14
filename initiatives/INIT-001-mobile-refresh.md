# INIT-001 - Mobile Refresh

**Status:** In Progress
**Owner:** Wilson / Codex / Claude / Replit
**Created:** 2026-04-29
**Current phase:** Phase 3.1 / Phase 4 planning
**Active PR:** [#74](https://github.com/wmishak404/laica/pull/74) stacked on [#73](https://github.com/wmishak404/laica/pull/73)
**Active branch:** `codex/mobile-refresh-phase-3-1-inventory-chip-states` (stacked on PR #73)

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

Phase 2.1 is the accepted first-time setup visual and behavior anchor. It shipped setup visual conformance, camera opt-in, peer upload/manual paths, scan cancellation, clearer scan/camera errors, fail-closed upload caps, manual-entry normalization, pantry minimums, and duplicate mitigation. Pantry manual-entry spell correction later shipped through EFF-013 / PR #62 and is now resolved. Richer setup/settings scan-review states are now being pulled into Phase 3.1 through the inventory chip-state branch; EFF-014 remains active until that branch merges and Wilson validates the behavior.

Phase 2.2 is the accepted returning-user IA bridge before Phase 3. Menu is the global access point; Settings owns Pantry/Kitchen/Profile edits; History is separate cooking memory. Returning Settings should remain visually aligned with first-time setup while preserving returning-user edit needs.

The next Phase 3.1 consistency slice is `codex/mobile-refresh-phase-3-1-inventory-chip-states`, stacked on PR #73 because the Slop Bowl pantry-chip alignment branch is still open. It pulls the active EFF-014 setup/settings scope into Phase 3.1: saved Pantry/Kitchen items use green checked chips, recently-added manual/scan items use coral `+` chips with an `X`, found-again scan matches get quiet same-list emphasis plus scan copy, and state clears on setup Continue or successful Settings save. EFF-014 remains active until this stacked branch merges and Wilson completes the printed Replit/mobile validation checklist; Phase 5 still owns future post-cook rescan labels.

PR #34 merged the process and product-decision taxonomy cleanup. Phase 3 implementation shipped through [PR #38](https://github.com/wmishak404/laica/pull/38), validated at `8a5c3d5` and merged as `f1d17d8`. The Phase 3 generation lock/cancel follow-up shipped through [PR #45](https://github.com/wmishak404/laica/pull/45), validated at `0c98a47` and merged as `8892327`.

Phase 3 implements the Planning entry redesign, Chef It Up time/cuisine flow, deterministic cuisine-aware staple check, Ticket Pass suggestions, Prep Tray, Slop Bowl confirmation refresh, and Slop Bowl planning-time prompt plumbing. Wilson froze Phase 3 visuals on 2026-05-06 so the phase could close on functional correctness rather than more design iteration. Current Planning/Ticket/Prep visuals are functional scaffolding; [Phase 3.1](../product-decisions/features/mobile-refresh/pd-phase-03-1-recipe-imagery.md) owns the design facelift, Slop It Up planning-card copy treatment, and recipe imagery follow-up. Ticket Pass reserves generated-image slots with designed placeholders in the selected ticket, compact alternate tickets, and Prep Tray, while actual generated/illustrated recipe imagery should not block suggestion reveal. Post-freeze basic-usability patches keep Ticket Pass recipe order stable, display-split recipe names only when explicit supporting detail exists, ask about/save likely missing cuisine staples as concrete pantry ingredients before generation with multi-cuisine representation before extra slots, align recipe preference caps across recipe suggestion routes, enforce `additionalIngredientsNeeded` as optional enhancements rather than required missing ingredients, and lock/cancel Chef It Up recipe generation so staple rows cannot reshuffle or accept input while suggestions are loading.

[Phase 3.2](../product-decisions/features/mobile-refresh/pd-phase-03-2-progressive-staples.md) is a separate behavior/interaction polish slice on top of the merged Phase 3 + PR #45 cancellation behavior. It is not blocked by Phase 3.1 because it does not decide the broader visual facelift or recipe imagery direction. Phase 3.1 should treat the Phase 3.2 Added shelf / rolling staple queue as the current behavior to preserve or intentionally restyle during the facelift.

Wilson's Replit check of Phase 3.2 head `968d39a` confirmed the rolling staple queue, queue exhaustion, submit-time pantry persistence, and saved staples after returning from recipe suggestions. The follow-up kept the Added-only shelf and submit timing, added a visible `X` remove affordance to pending Added chips, used `+` instead of checkmarks for pending additions, marked successfully saved chips as green-check-only pantry facts, showed an inline Pantry Settings removal note when a saved chip is tapped, skipped repeat pantry-save calls for already-saved selected staples, clarified the helper copy, and documented Slop Bowl pantry-check visual alignment as Phase 3.1 scope.

[PR #46](https://github.com/wmishak404/laica/pull/46) shipped Phase 3.2 after Wilson's authenticated Replit/browser validation at `9646c80`; it merged into `main` as `b22f6b6`. Phase 3.2 is now the behavior baseline for Chef It Up's staple-check step. Phase 3.1 should preserve or intentionally restyle that behavior during the design facelift.

[PR #53](https://github.com/wmishak404/laica/pull/53) shipped the EFF-021 runtime slice after Wilson's Replit validation at `ef28e59`; it merged into `main` as `9aa6c1c`. Pantry and Kitchen now share the 20-photo per-refresh cap, scan refreshes process with bounded 4-at-a-time concurrency, empty Pantry remains a valid returning-user state, active Settings scans have cancellation/stale-result protection, and Chef It Up now surfaces the empty-Pantry blocker from the Planning choice screen. Wilson later accepted that provider-level multi-image batching is not needed at this point, so EFF-021 closed as resolved.

The 2026-05-09 Effort cleanup closed several former Mobile Refresh follow-ups as standalone Efforts. Full-row selection controls, scan no-detection feedback, shared manual-entry parsing, and Slop Bowl visual cleanup are now documented as INIT-001/phase-owned behavior instead of active Efforts. Future work in those areas should update the relevant phase record, not create a new Effort unless the work becomes standalone outside INIT-001.

The 2026-05-13 closeout pass resolved EFF-013 after PR #62 shipped conservative setup/Settings pantry manual-entry correction, and resolved EFF-015 after PR #64 shipped UI-governance enforcement. The current active Effort read list for Mobile Refresh-adjacent work is therefore EFF-010 for DB/schema workflow and EFF-014 for scan-session duplicate/latest-scan refinement. EFF-017 remains deferred until a narrow Phase 4 harness pilot explicitly reopens it.

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
| Phase 2.2 | Merged | PR #30 / `codex/mobile-refresh-phase-2-2-settings-history` | Returning Settings/History IA accepted and merged as `bc25ef3` |
| Phase 3 | Merged | [#38](https://github.com/wmishak404/laica/pull/38) + [#45](https://github.com/wmishak404/laica/pull/45) | Functional Planning/Chef It Up/Ticket Pass/Prep Tray/Slop Bowl closed; baseline validated at `8a5c3d5` and merged as `f1d17d8`; generation lock/cancel validated at `0c98a47` and merged as `8892327` |
| Phase 3.1 | In progress | [#69](https://github.com/wmishak404/laica/pull/69), [#73](https://github.com/wmishak404/laica/pull/73), [#74](https://github.com/wmishak404/laica/pull/74) | Design facelift and imagery work is landing in narrow slices; current stack aligns Slop Bowl pantry-check chips, then Setup/Settings inventory review chip states for EFF-014 |
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
| #73 | Open | `codex/mobile-refresh-phase-3-1-slop-pantry-align` | Lower stack for current inventory chip-state branch; aligns Slop Bowl pantry-check chips with Chef It Up saved/recent grammar |
| #74 | Draft / open | `codex/mobile-refresh-phase-3-1-inventory-chip-states` | Stacked on #73; implements Setup/Settings Pantry/Kitchen saved/recent/found-again chip states and EFF-014 resolution path |

## Efforts and Governance

| Reference | Relevance |
|---|---|
| [PD-005](../product-decisions/pd-005-ui-governance.md) | UI governance operating model |
| [`design_guidelines.md`](../design_guidelines.md) | Canonical visual identity / design standard |
| [Testing and Acceptance Workflow](../docs/workflows/testing-and-acceptance.md) | Merge readiness, validation evidence, and Feature Impact Review workflow formerly tracked by EFF-005/EFF-020 |
| [EFF-010](../efforts/effort-010-local-db-schema-strategy.md) | DB/schema authority and no local shared DB pushes |
| [EFF-013](../efforts/effort-013-pantry-manual-entry-spell-correction.md) | Resolved pantry manual-entry spell correction; future pantry spelling/canonicalization work should start from the shipped behavior and create a new Effort only if the follow-up is standalone |
| [EFF-014](../efforts/effort-014-scan-session-diff-and-duplicate-refinement.md) | In-progress setup/settings scan-review chip-state branch; close after merge and Wilson Replit/mobile validation, with Phase 5 rescan labels deferred to Phase 5 |
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
- Phase 2.2 added before Phase 3 so returning users can revisit Pantry, Kitchen, Cooking Profile, Settings, and History through Menu.
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
- EFF-021 also captured returning-user empty-Pantry guardrails on 2026-05-08: clearing Pantry is a valid inventory state and should not return the user to first-time setup or reset Kitchen/Profile/History; pantry-based recipe generation should block with explicit empty-Pantry recovery copy; active Settings scans should cancel/ignore stale results when leaving Settings and lock inventory edits while running. This corner case feeds the testing workflow so reset-to-empty states, in-flight async navigation, and cross-domain persistence checks become part of feature acceptance review.
- EFF-021 Replit follow-up on 2026-05-08 found the empty-Pantry Chef It Up blocker was too late in the flow. The Planning choice now owns a quiet Pantry status line under "What are we cooking today?" and Chef It Up blocks immediately on card tap when Pantry is empty, while Slop Bowl remains available. A final Replit check at `ef28e59` confirmed the latest status-line behavior works as designed; the notification icon was removed and final visual treatment is deferred to Phase 3.1.
- PR #53 merged the EFF-021 runtime slice into `main` as `9aa6c1c`. Wilson accepted the validated bounded-concurrency implementation as sufficient and chose not to keep provider-level batching as active scope, so EFF-021 closed as resolved. The merged slice satisfies the runtime cap, same-limit, rate-limit, progress, partial-success, active-scan lifecycle, and empty-Pantry guardrail work.
- EFF-013 resolved on 2026-05-13 after PR #62 shipped conservative setup/Settings pantry manual-entry correction with visible chip provenance, Undo, pantry-only scope, targeted tests, and Replit validation. Future pantry spelling/canonicalization starts from the shipped behavior, not an active EFF-013 read-list item.
- EFF-015 resolved on 2026-05-13 after PR #64 shipped the PR-template reviewer gate and local ESLint hex-class guard. Future UI governance starts from PD-005, `design_guidelines.md`, `.github/PULL_REQUEST_TEMPLATE.md`, and `eslint.config.js`, not an active Effort.

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
- Phase 2.2 validated Menu -> Settings, Menu -> History, Slop Bowl -> Edit pantry, Pantry/Kitchen/Profile saves, History list/expand/delete/undo, feedback context, returning Settings visual parity, local typecheck/build, and relevant Vitest coverage.
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
- Full `npx vitest run` is not green because existing repo-wide harness issues remain outside Phase 3 scope: `tests/e2e/cooking-workflow.test.ts` is a Playwright file being collected by Vitest, and `tests/unit/voice-recording.test.ts` expects `MediaStream` in the test environment.

## Current Resume Point

Phase 3 is functionally closed on `main` after PR #38 (`f1d17d8`) and PR #45 (`8892327`). Phase 3.2 is also merged after PR #46 (`b22f6b6`). Do not resume `codex/mobile-refresh-phase-3-planning`, `codex/phase-3-generation-cancel`, or `codex/mobile-refresh-phase-3-2-progressive-staples`.

Next implementation / validation focus:

1. Start Phase 3.1 from fresh `origin/main` for the design facelift and recipe imagery pass: whitespace/card grammar, typography consistency, Slop It Up card-title/copy treatment, Slop Bowl humor treatment, Slop Bowl pantry-check visual alignment with the shipped Chef It Up Phase 3.2 chip/row direction, Ticket Pass hierarchy, Prep Tray image layout, bottom nav fit, docs updates, and async/cached generated or illustrated recipe imagery into the existing Phase 3 image slots. Phase 3.1 should preserve or intentionally restyle the Phase 3.2 Added shelf / rolling queue behavior, including the pending `+` + `X` versus saved green-check-only chip distinction and saved-chip tap-to-explain removal note.
2. Start Phase 4 from fresh `origin/main` when cooking guidance begins. Phase 4 owns the hands-busy cooking flow and the live-cooking inline AI error recovery that EFF-018 intentionally deferred.
3. Keep richer History share/cook-again/taste-memory behavior deferred to Phase 5 unless Wilson explicitly pulls it forward.
4. Reopen authenticated smoke automation / environment-parity work in a separate EFF-017 branch as a narrow Phase 4 harness pilot. The pilot should reduce repeated manual checks without replacing the current Replit validation gate until the harness earns trust. Testing workflow cleanup now lives in `docs/workflows/testing-and-acceptance.md` and `docs/workflows/effort-system-audit.md`, not an active Effort.
5. Pantry spell correction is resolved through EFF-013 / PR #62. Future pantry spelling/canonicalization work should start from the shipped behavior and create a new Effort only when the follow-up is standalone outside INIT/phase/PD/workflow scope. EFF-014 setup/settings chip-state work is active on `codex/mobile-refresh-phase-3-1-inventory-chip-states`; close EFF-014 only after that branch merges and Wilson completes the printed Replit/mobile validation checklist. Phase 5 post-cook rescan labels remain in the Phase 5 record.

## Sequencing Semantics

INIT order is the default resume path, not automatically a hard dependency graph.

| Work relationship | Classification | Notes |
|---|---|---|
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

PR #62 merged pantry manual-entry spell correction as `8de1e88`, and PR #63 closed EFF-013 as `12467f8`. PR #64 merged UI-governance enforcement as `e4d5cfe`, and PR #65 closed EFF-015 as `c969fbd`. The active Effort read list no longer includes EFF-013 or EFF-015; Mobile Refresh-adjacent active Effort work is EFF-014 unless the task touches DB/schema workflow EFF-010. EFF-017 remains deferred until the Phase 4 harness pilot.

### 2026-05-14 - Phase 3.1 kickoff audit merged

PR #69 merged the Phase 3.1 kickoff/audit docs into `main` as `d6e422e`. Phase 3.1 remains the next default agenda item, still as a soft sequence before Phase 4 rather than a hard blocker. The first recommended runtime slice is the Planning entry **Slop It Up** title and stable italic supporting-copy treatment; broader UI facelift, Slop Bowl pantry-check visual alignment, Ticket Pass/Prep Tray polish, and async imagery stay separate slices.
