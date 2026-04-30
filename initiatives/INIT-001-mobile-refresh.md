# INIT-001 — Mobile Refresh

**Status:** In Progress
**Owner:** Wilson / Codex / Claude / Replit
**Created:** 2026-04-29
**Current phase:** Phase 2.1 setup polish in implementation
**Active PR:** None
**Active branch:** `codex/mobile-refresh-phase-2-1-setup-polish`

## Overview

Mobile Refresh is the phased effort to make LAICA feel like a native, camera-forward, cooking-first mobile product rather than a desktop website wrapped in a mobile viewport.

The original plan spans Phase 0 through Phase 5:

- Phase 0: security/backend readiness
- Phase 1: auth and first authenticated routing
- Phase 2: setup, pantry scan, kitchen scan, and profile
- Phase 3: planning, Chef It Up, Slop Bowl, and Ticket Pass
- Phase 4: cooking guidance
- Phase 5: post-cook cleanup and retention

The initiative also includes cross-phase AI privacy, prompt-injection, abuse-prevention, design-language, validation, and agent workflow rules discovered during implementation.

## Current Status

Phase 0, Phase 1, Phase 2, and the INIT/process documentation split are merged.

PR #25 split and merged the INIT/process/design documentation stack from PR #23, making it the shared workflow baseline for Phase 2 polish and later Phase 3-5 work.

PR #23 merged functional Phase 2 setup after Replit validation passed. Wilson decided to defer the latest UI trust/privacy and visual-flow feedback to Phase 2.1 because PR #23 was already large.

Phase 2.1 implementation started from fresh `origin/main` at `4ef300cda6778bbd562e918fc5b835a246b65bd8` on `codex/mobile-refresh-phase-2-1-setup-polish`. Local TypeScript, focused Vitest, and production build checks have passed; Replit validation is still required before merge.

## Source Docs

- [Mobile Refresh phase index](../product-decisions/features/mobile-refresh/README.md)
- [Phase 0 security/backend readiness](../product-decisions/features/mobile-refresh/phase-00-cross-phase-security.md)
- [Phase 1 auth](../product-decisions/features/mobile-refresh/phase-01-auth.md)
- [Phase 2 setup](../product-decisions/features/mobile-refresh/phase-02-setup.md)
- [Phase 2.1 setup polish](../product-decisions/features/mobile-refresh/phase-02-1-setup-polish.md)
- [Phase 3 planning](../product-decisions/features/mobile-refresh/phase-03-planning.md)
- [Phase 4 cooking](../product-decisions/features/mobile-refresh/phase-04-cooking.md)
- [Phase 5 post-cook](../product-decisions/features/mobile-refresh/phase-05-post-cook.md)
- [AI privacy, prompt-injection, and abuse rules](../product-decisions/features/mobile-refresh/cross-phase-ai-privacy.md)
- [Mobile Refresh Design Language](../product-decisions/features/mobile-refresh/design-language.md)
- [Dev-test harness plan](../product-decisions/features/mobile-refresh/dev-test-harness.md)
- [PD-009 mobile refresh navigation](../product-decisions/009-mobile-refresh-navigation.md)

## Assets

| Asset | Role |
|---|---|
| [phase-01-auth.png](../docs/assets/mobile-refresh/phase-01-auth.png) | Auth/landing visual exemplar |
| [phase-02-setup.png](../docs/assets/mobile-refresh/phase-02-setup.png) | Setup and camera-first onboarding exemplar |
| [phase-03-planning-flow.png](../docs/assets/mobile-refresh/phase-03-planning-flow.png) | Planning entry and Chef It Up / Slop Bowl hierarchy exemplar |
| [phase-03-ticket-pass.png](../docs/assets/mobile-refresh/phase-03-ticket-pass.png) | Ticket Pass recipe suggestion exemplar |
| [phase-04-cooking.png](../docs/assets/mobile-refresh/phase-04-cooking.png) | Cooking guidance exemplar |
| [phase-05-post-cook.png](../docs/assets/mobile-refresh/phase-05-post-cook.png) | Post-cook cleanup and retention exemplar |

## Phase Progress

| Phase | Status | PR / branch | Notes |
|---|---|---|---|
| Planning docs | Merged | PR #20 / `codex/mobile-refresh-planning-docs` | Phase 0-5 docs and mockups added |
| Phase 0 | Merged | PR #21 / `codex/mobile-refresh-phase-0-security` | Firebase Admin auth, AI route protection, rate limits, ownership, body limits |
| Phase 1 | Merged | PR #22 / `codex/mobile-refresh-phase-1-auth` | Auth landing and first authenticated routing; polish commit preserved after rebase |
| Phase 2 | Merged | PR #23 / `codex/mobile-refresh-phase-2-setup` | Functional setup work validated in Replit and merged; latest visual/trust feedback deferred |
| Phase 2.1 | In Progress | `codex/mobile-refresh-phase-2-1-setup-polish` | Setup polish: welcome/get-started, camera opt-in, upload/manual hierarchy, scanning state, text-only scan safeguard, Back/escape, copy, auto-advance |
| INIT/process docs | Merged | PR #25 / `codex/mobile-refresh-init-process-docs` | Docs-only branch split from PR #23; now baseline for remaining Phase 2-5 work |
| Phase 3 | Planned | TBD | Planning entry, Chef It Up, Slop Bowl update, Ticket Pass |
| Phase 4 | Planned | TBD | Cooking guidance and hands-busy mode |
| Phase 5 | Planned | TBD | Post-cook cleanup and retention |

## PRs and Branches

| PR | Status | Branch | Validation |
|---|---|---|---|
| #20 | Merged | `codex/mobile-refresh-planning-docs` | Docs/assets only |
| #21 | Merged | `codex/mobile-refresh-phase-0-security` | Replit/security validation completed before merge |
| #22 | Merged | `codex/mobile-refresh-phase-1-auth` | Phase 1 polish merged to `main` |
| #23 | Merged | `codex/mobile-refresh-phase-2-setup` | Functional Replit validation passed at `f037552`; merged as functional Phase 2 |
| #24 | Closed / superseded | `codex/vision-text-only-scan-epic` | Standalone EPIC-011 PR superseded by Phase 2.1 scope |
| #25 | Merged | `codex/mobile-refresh-init-process-docs` | Docs-only INIT/process/design baseline |
| #26 | Merged | `codex/mobile-refresh-phase-2-closeout` | Phase 2 closeout moved resume point to Phase 2.1 |
| TBD | In progress | `codex/mobile-refresh-phase-2-1-setup-polish` | Local checks passed; Replit validation not yet run |

## Epics and Governance

| Epic | Relevance |
|---|---|
| [EPIC-001](../epics/001-ui-governance.md) | UI consistency, tokens, primitives, design governance |
| [EPIC-004](../epics/004-selection-controls-tap-targets.md) | Full-row mobile selection controls |
| [EPIC-005](../epics/005-testing-strategy-and-acceptance-criteria.md) | Merge readiness, validation workflow, visual acceptance gap |
| [EPIC-007](../epics/007-vision-scan-no-detection-feedback.md) | Pantry/kitchen no-detection feedback |
| [EPIC-009](../epics/009-consistent-comma-separated-ingredient-entry.md) | Shared comma-separated manual entry |
| [EPIC-010](../epics/010-local-db-schema-strategy.md) | DB/schema authority and no local shared DB pushes |
| [EPIC-012](../epics/012-laica-design-language.md) | LAICA design language and visual identity |

## Changes Added After Initial Plan

- Dev-test harness planned for future Firebase custom-token dev auth, not backend bypass.
- Mockup conformance gate added: linked mockups are implementation inputs, not loose inspiration.
- Phase 2 scope corrected: setup visual polish and Pantry/Kitchen Back/escape are merge-readiness items.
- PR #23 UI feedback added and deferred to Phase 2.1: camera off by default with toggle, one upload action, peer manual entry, processing animation, text-only scan safeguard, privacy-aware copy, single-choice auto-advance, and first-time welcome follow-up.
- EPIC-012 added for LAICA design language and visual identity.
- Mobile Refresh Design Language drafted and annotated with visual exemplars.
- Stacked PR base refresh rule added after PR #22 polish was missing from early PR #23 preview.
- Replit validation hygiene added: validation is tied to commit SHA and becomes stale after any later branch commit.
- INIT system added to prevent future context loss across long phased work.

## Validation State

Known validation facts:

- Replit validation passed at PR #23 head `f037552b37169f26e5fe2fe872f68150138812a6` per Wilson.
- The 16 signed-in post-auth functional smoke items passed in Replit.
- Latest UI trust/privacy feedback is deferred to Phase 2.1.
- PR #23 merged into `main` as merge commit `eca3d1b504e8eb33edbeb74e78cf2755b760577f`.

Required before Phase 2.1 merge:

- Start Phase 2.1 from fresh `origin/main`.
- Implement the setup polish and text-only scan safeguard scope in [Phase 2.1 setup polish](../product-decisions/features/mobile-refresh/phase-02-1-setup-polish.md).
- Re-run Replit validation at the latest Phase 2.1 runtime head before merge.

## Current Resume Point

Resume at Phase 2.1 setup polish on `codex/mobile-refresh-phase-2-1-setup-polish`.

Next implementation focus:

1. Pull `codex/mobile-refresh-phase-2-1-setup-polish` into Replit.
2. Run the Phase 2.1 signed-in Replit validation checklist at the latest branch head.
3. Open the Phase 2.1 PR after validation state is recorded.
4. Treat PR #24 as superseded by Phase 2.1, not as a separate epic branch to merge.
5. Keep Phase 2.1 within the validated Phase 2 backend/data contract.

## Chronology

### 2026-04-28 — Phase 0-5 plan and mockups captured

Codex added mobile-refresh phase records, cross-phase AI/privacy rules, and tracked visual assets. PR #20 merged those planning docs.

### 2026-04-29 — Phase 0 and Phase 1 merged

PR #21 merged Phase 0 security/backend readiness. PR #22 merged Phase 1 auth and routing, including a landing polish commit.

### 2026-04-29 — Phase 2 draft exposed validation and design gaps

PR #23 implemented much of the functional setup flow, but Replit/manual review surfaced missing visual conformance, missing Back/escape from camera flow, and authenticated-smoke limitations.

### 2026-04-29 — Process and design layers added

The initiative gained dev-test harness planning, mockup conformance rules, EPIC-012, the mobile-refresh design-language draft, stacked PR validation hygiene, and this INIT hub.

### 2026-04-29 — INIT/process docs split and merged

PR #25 merged the INIT/process/design documentation baseline separately from PR #23. PR #23 was then refreshed onto the new `origin/main` so it can continue as the Phase 2 implementation and polish branch.

### 2026-04-29 — Phase 2 UI trust/privacy feedback added

Wilson's PR #23 testing added concrete setup polish feedback: simplify upload actions, make camera opt-in with an accessible toggle, show a scanning/processing state, provide real Back/escape from step 1, elevate manual entry for privacy-sensitive users, soften pantry copy, and consider a first-time welcome page follow-up.

### 2026-04-29 — Single-choice setup auto-advance feedback added

Wilson's Step 3 testing clarified that Cooking Skill should behave as a one-tap single-choice input: selecting `Beginner`, `Intermediate`, or `Expert` should accept and advance without a separate `Next` button. The same rule should apply to future single-choice multiple-choice screens, while multi-select screens should keep explicit continuation.

### 2026-04-29 — Phase 2 functional Replit validation passed

Wilson reported that Replit validation and the 16 signed-in post-auth functional smoke items passed at PR #23 head `f037552b37169f26e5fe2fe872f68150138812a6`.

### 2026-04-29 — Phase 2.1 setup polish split

Wilson decided to defer the latest visual/trust/privacy feedback to Phase 2.1 because PR #23 is already large. PR #23 should close functional Phase 2; Phase 2.1 owns setup polish, camera opt-in, manual/upload hierarchy, scanning state, Back/escape, softer copy, single-choice auto-advance, and optional welcome/get-started context.

### 2026-04-29 — EPIC-011 / PR #24 folded into Phase 2.1

Wilson decided the text-only vision scan safeguard from PR #24 belongs in Phase 2.1 because it affects the same pantry/kitchen scan surfaces and trust model. PR #24 is superseded; Phase 2.1 owns rejecting text-only/document-like scan inputs while preserving labels on visible physical products.

### 2026-04-29 — Phase 2 merged

PR #23 merged functional Phase 2 setup into `main` as merge commit `eca3d1b504e8eb33edbeb74e78cf2755b760577f`. The remote feature branch was deleted. Phase 2.1 is now the next active Mobile Refresh scope.

### 2026-04-30 — Phase 2.1 implementation branch started

Codex started `codex/mobile-refresh-phase-2-1-setup-polish` from `origin/main` at `4ef300cda6778bbd562e918fc5b835a246b65bd8`. The branch implements the first-time welcome screen, camera opt-in, upload/manual hierarchy, scanning state, privacy-aware copy, Cooking Skill auto-advance, and text-only scan rejection contract. Local checks passed; Replit validation is not yet run.
