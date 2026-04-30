# INIT-001 — Mobile Refresh

**Status:** In Progress
**Owner:** Wilson / Codex / Claude / Replit
**Created:** 2026-04-29
**Current phase:** Phase 2 setup polish and validation
**Active PR:** [PR #23](https://github.com/wmishak404/laica/pull/23)

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

Phase 0, Phase 1, and the INIT/process documentation split are merged. Phase 2 is open as draft PR #23.

PR #25 split and merged the INIT/process/design documentation stack from PR #23, making it the shared workflow baseline for Phase 2 polish and later Phase 3-5 work.

PR #23 has been refreshed onto current `origin/main` after PR #25 merged and now contains the Phase 2 implementation/polish lane again. It is not merge-ready. The latest PR head is not Replit-validated, and the branch still needs Phase 2 visual conformance polish plus signed-in Replit smoke.

The exact current `Last Replit-validated at` SHA lives in the PR #23 description; treat the INIT and PR body together as the source of truth.

## Source Docs

- [Mobile Refresh phase index](../product-decisions/features/mobile-refresh/README.md)
- [Phase 0 security/backend readiness](../product-decisions/features/mobile-refresh/phase-00-cross-phase-security.md)
- [Phase 1 auth](../product-decisions/features/mobile-refresh/phase-01-auth.md)
- [Phase 2 setup](../product-decisions/features/mobile-refresh/phase-02-setup.md)
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
| Phase 2 | Draft / active | PR #23 / `codex/mobile-refresh-phase-2-setup` | Functional setup work exists; visual polish, Back/escape, and signed-in smoke remain |
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
| #23 | Draft / open | `codex/mobile-refresh-phase-2-setup` | Refreshed onto `origin/main` after PR #25; latest head not Replit-validated |
| #25 | Merged | `codex/mobile-refresh-init-process-docs` | Docs-only INIT/process/design baseline |

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
- PR #23 UI feedback added: camera off by default with toggle, one upload action, peer manual entry, processing animation, privacy-aware copy, and first-time welcome follow-up.
- EPIC-012 added for LAICA design language and visual identity.
- Mobile Refresh Design Language drafted and annotated with visual exemplars.
- Stacked PR base refresh rule added after PR #22 polish was missing from early PR #23 preview.
- Replit validation hygiene added: validation is tied to commit SHA and becomes stale after any later branch commit.
- INIT system added to prevent future context loss across long phased work.

## Validation State

Known validation facts:

- Earlier deterministic Phase 2 Replit checks passed before later docs/process commits and are stale.
- Latest PR #23 head after the PR #25 refresh is not Replit-validated.
- Full signed-in Phase 2 smoke is still needed.
- Phase 2 visual conformance review is still needed.

Required before PR #23 merge:

- Replit fetches latest `codex/mobile-refresh-phase-2-setup`.
- Deterministic checks pass at latest head.
- Signed-in smoke covers setup routing, camera, upload/manual fallback, no-detection feedback, batch caps, comma parsing, settings, and profile gates.
- Setup screens conform to Phase 2 mockup and design-language draft.
- Pantry/Kitchen camera flows include a clear Back/escape path.
- Capture/upload scan processing shows a visible scanning state.

## Current Resume Point

Resume at PR #23, Phase 2 setup polish.

Next implementation focus:

1. Read [Mobile Refresh Design Language](../product-decisions/features/mobile-refresh/design-language.md), [Phase 2 setup](../product-decisions/features/mobile-refresh/phase-02-setup.md), and [EPIC-012](../epics/012-laica-design-language.md).
2. Polish setup UI toward the Phase 2 mockup and latest PR #23 UI feedback.
3. Add Back/escape affordances to Pantry/Kitchen camera steps without letting incomplete users bypass required setup into cooking.
4. Make camera opt-in/off by default with an accessible on/off toggle, combine upload actions, give manual entry peer visual weight, show scanning/processing animation, and revise pantry copy away from privacy-invasive language.
5. Decide whether the first-time welcome/get-started page is pulled into PR #23 or captured as Phase 2.1 follow-up.
6. Run local checks.
7. Have Replit fetch latest branch and re-run validation at the latest commit SHA.

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
