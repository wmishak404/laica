# INIT-003 — Anonymous Trial and Account Upgrade

**Status:** In Progress
**Owner:** Wilson / Codex / Claude / Replit
**Created:** 2026-05-15
**Current phase:** Post-Phase 3 production gates — quota, abuse controls, App Check, and upgrade-to-save
**Active PR:** None
**Active branch:** None

## Overview

INIT-003 is the cross-cutting initiative for public guest entry, guest recipe limits, Google upgrade rules, and the persistence/security contract that sits between first-time trial use and durable account memory.

The initiative exists because the accepted direction is no longer just a mobile-refresh auth polish question. It affects:

- Firebase auth mode and route contracts
- anonymous abuse controls and operational cost posture
- local vs durable app state
- recipe-generation gating and upgrade UX
- [INIT-001](INIT-001-mobile-refresh.md) Phase 5 returning-user memory behavior
- future browser validation and auth-smoke work tracked by [EFF-017](../efforts/effort-017-environment-parity-and-ci-confidence.md)

The current accepted direction is:

- public anonymous Firebase entry is allowed
- guests receive 10 successful recipe generations in v1
- the quota is quiet in the UI and becomes stronger near exhaustion
- same-browser guest progress persists through normal reopen
- Google linking is required for recipe generation `#11+`
- Google linking is required for all durable server-side saves
- durable Phase 5 history/cleanup/taste memory remains linked-only

## Current Status

Phase 3 shipped through [PR #102](https://github.com/wmishak404/laica/pull/102), merging the public pre-auth homepage, real Firebase anonymous entry, same-browser guest setup persistence, and linked-only durable-memory boundaries as the Plan B guest MVP slice. The accepted launch path remains **Plan B: public homepage + clean guest MVP**, not full anonymous-trial completion.

The next work is the remaining production-gate slice that makes public anonymous traffic safe to operate: quota enforcement, anonymous kill switch, anonymous rate-limit identity, App Check posture, and upgrade-to-save boundaries.

**Sequencing classification:** this is a soft-sequence override with hard production gates. The public homepage and client anonymous entry can be implemented before the full quota/save-boundary stack, but production readiness still depends on the Phase 1/2 server foundations, quota accounting, App Check, and upgrade boundaries. The homepage CTA must start a real Firebase anonymous session; it must not fake guest mode.

The remaining server-auth foundation should stay narrow:

- provider-aware server auth session metadata
- anonymous kill switch
- anonymous IP-keyed rate-limit identity
- null-safe linked-user upsert behavior
- linked-only compatibility guard on the existing `/api/auth/google` path

Public production enablement is blocked until Firebase App Check is configured and enforced.

## Plan B Guest MVP Launch Path

Plan B prioritizes shipping the public pre-auth homepage before INIT-001 Phase 4 or Phase 5, while keeping the guest runtime honest about what is local/session-limited versus durable account memory.

Before public launch, the remaining minimum guest-MVP gates are:

- Anonymous quota enforcement, anonymous kill switch, anonymous rate-limit identity, and Firebase App Check posture are confirmed before production enablement.
- Guest quota/upgrade messaging appears inside usage moments, not on the landing page.
- Upgrade-to-save boundaries clearly separate browser-local guest continuation from linked-account durable saves.

Out of scope for this launch path:

- Full INIT-001 Phase 4 cooking guidance.
- INIT-001 Phase 5 post-cook cleanup, taste memory, next-meal retention, and durable History behavior for guests.
- Retro-importing anonymous completion state into durable linked-account history after Google linking.

## Source Docs

- [PD-012 — Public anonymous trial and account upgrade](../product-decisions/pd-012-public-anonymous-trial-and-account-upgrade.md)
- [INIT-001 — Mobile Refresh](INIT-001-mobile-refresh.md)
- [Mobile Refresh Phase 1 — Auth and First Authenticated Routing](../product-decisions/features/mobile-refresh/pd-phase-01-auth.md)
- [Mobile Refresh Phase 5 — Post-Cook Cleanup and Retention](../product-decisions/features/mobile-refresh/pd-phase-05-post-cook.md)
- [Mobile Refresh Dev-Test Harness](../product-decisions/features/mobile-refresh/pd-dev-test-harness.md)
- [EFF-017 — Environment parity and CI confidence](../efforts/effort-017-environment-parity-and-ci-confidence.md)
- [EFF-010 — Local DB schema strategy](../efforts/effort-010-local-db-schema-strategy.md)
- [Testing and Acceptance Workflow](../docs/workflows/testing-and-acceptance.md)

## Assets

Phase 3 adds selected slightly-cartoony consumer-packaged generated landing assets for the pre-auth proof carousel:

- `attached_assets/landing-packaged-cartoon-kitchen-scan.jpg` — warm home-kitchen scan concept with labeled fictional beef patties / BBQ sauce packaging, unlabeled visible rice and eggs, natural uneven ingredient placement, and no raw meat
- `attached_assets/landing-packaged-cartoon-recipe-bowl.jpg` — appetizing home-cooked Loco Moco-style bowl from the labeled ingredients
- `attached_assets/landing-packaged-cartoon-cooking-guidance.jpg` — warm stovetop/pan cooking scene with matching beef patties / BBQ sauce labels in the background and unlabeled visible rice and eggs

PD-012 is the source of truth for the image-generation approach: public product-flow imagery should avoid raw meat, use fictional labeled packaging when labels clarify packaged grocery ingredients, leave obvious loose or transparent-container ingredients visually identifiable but unlabeled when possible, avoid real logos/trade dress/people, keep scan-image ingredient placement natural without making the scene chaotic, and keep interactive UI chrome in the app layer.

## Phase Progress

| Phase | Status | PR / branch | Current signal |
|---|---|---|---|
| Phase 0 — docs baseline and prerequisites | Complete | `codex/init-003-anonymous-trial-docs` | INIT-003 and PD-012 capture the accepted guest model, security gates, and revisit triggers before runtime work starts |
| Phase 1 — server auth and abuse-control foundations | Planned | TBD | Add server-derived `authMode`, anonymous kill switch, App Check enforcement path, IP-keyed anonymous rate limits, and null-safe linked upsert behavior |
| Phase 2 — guest quota state and auth session contract | Planned | TBD | Canonical auth-session route plus 10-generation anonymous quota accounting |
| Phase 3 — client guest entry, same-browser persistence, and public pre-auth homepage | Complete | [PR #102](https://github.com/wmishak404/laica/pull/102) / `codex/init-003-preauth-homepage` | Merged as `515b7ec` after Replit validation at `c952d13`: anonymous sign-in, `/api/auth/session` adoption, local guest profile persistence, A+C hybrid pre-auth homepage, and no landing-page quota pressure |
| Phase 4 — upgrade-to-save boundary and promotion | Planned | TBD | Typed `UPGRADE_REQUIRED` responses, Google link flow, and strict trial-state promotion |
| Phase 5 — anonymous cooking coverage and Phase 5 integration | Planned | TBD | Anonymous-safe Slop Bowl path plus linked-only durable cooking/history/cleanup memory |
| Phase 6 — operations, cleanup, and launch | Planned | TBD | Account-mode operational logging, stale anonymous-account cleanup, and production enablement gates |

## PRs and Branches

| PR | Status | Branch | Validation / merge signal |
|---|---|---|---|
| [#102](https://github.com/wmishak404/laica/pull/102) | Merged | `codex/init-003-preauth-homepage` | Merged as `515b7ec` after Replit validation at `c952d13c9918356de2c5aaf31cb0dbde6f2d1824`; local unhappy-path probes covered no-auth API rejection, anonymous Google-upsert rejection, empty-pantry guest guard, and anonymous live-cooking durable-session guard |

## Efforts and Governance

| Reference | Relevance |
|---|---|
| [PD-012](../product-decisions/pd-012-public-anonymous-trial-and-account-upgrade.md) | Durable accepted product/security policy for guest mode and upgrade boundaries |
| [INIT-001](INIT-001-mobile-refresh.md) | Phase 1 landing and Phase 5 returning-user behavior both intersect with this initiative |
| [EFF-017](../efforts/effort-017-environment-parity-and-ci-confidence.md) | Future auth/browser smoke work should adapt to guest mode without replacing linked-account Replit validation |
| [EFF-010](../efforts/effort-010-local-db-schema-strategy.md) | Any schema work for quota accounting or promotion must still follow Replit-authoritative DB workflow |
| [Testing and Acceptance Workflow](../docs/workflows/testing-and-acceptance.md) | Merge readiness and Replit validation evidence remain required for runtime phases |

Analytics work is intentionally separate. If measurement implementation begins, file a standalone effort rather than expanding INIT-003 to own both runtime auth changes and product analytics.

## Changes Added After Initial Plan

- The work began as a planning-only auth-harness discussion from fresh `origin/main`, then shifted into a public product decision for anonymous guest entry.
- The team explicitly rejected personal Chrome/session reuse and a generic backend auth-bypass as the main path.
- The guest model temporarily moved to "unlimited until save," then changed back after product review because it left too little incentive to link Google.
- The accepted v1 guest model is now **10 successful recipe generations**, not unlimited generation and not full-cook counting.
- Wilson raised the cap from 5 to 10 on 2026-05-24 so guest mode has more room for user flow, trust building, and iteration when early recipe generations miss the user's pantry, taste, or expectations.
- "Save gate" was clarified to mean **durable server-side writes only**, not same-browser local guest persistence.
- Same-browser guest persistence through normal reopen was accepted so users do not have to rescan pantry after ordinary browser restarts.
- The upgrade message split was accepted:
  - cap moment: unlock more recipes
  - save moment: save your kitchen
- Product analytics was intentionally separated from INIT-003 runtime scope so guest auth, quota, persistence, and Phase 5 boundaries can land without also inventing a new analytics foundation.
- Wilson placed the richer pre-auth homepage in INIT-003 Phase 3 because it is the public guest-entry surface, not only historical mobile-refresh auth polish. The accepted landing direction is the A+C hybrid: lead with `Cook from what you already have.`, use `Start cooking now` as the guest CTA, keep Google as the linked-account path, use a 3-step proof carousel for scan/recipe/guidance, and avoid numeric quota language on the landing page.
- Wilson accepted Plan B on 2026-05-22: ship the public homepage and narrow guest MVP before full INIT-001 Phase 4 or Phase 5, as long as production guest gates remain explicit and durable cooking memory stays linked-account only.
- Wilson initially selected domestic-realistic generated imagery for the public carousel on 2026-05-23, then revised that decision on 2026-05-24 after seeing the raw beef on the front page with fresh eyes. The accepted direction is now slightly-cartoony consumer-packaged imagery: labeled fictional grocery packages, no raw meat hero signal, home-cooked recipe output, and app-rendered UI around the image.
- Wilson tightened the carousel visual contract on 2026-05-24: the scan image should use natural ingredient placement rather than perfect alignment without turning the counter chaotic, the recipe demo may loosen landing-only meta spacing while preserving the production planning-ticket primitive, the guidance slide should communicate step/checklist/tip support instead of putting numbered markers on a food photo, and numeric `1/3` style labels are unnecessary when progress dots already show the carousel state.
- Wilson tightened the generated-image label contract on 2026-05-24: keep fictional labels where they clarify packaged products, but leave obvious rice/eggs visually identifiable without printed labels so the scan story signals recognition beyond text reading. Matching packaged labels should use the same style across the scan and guidance slides.
- Wilson confirmed on 2026-05-26 that the anonymous guest path has a practical automation benefit: agents can exercise the guest setup/recipe/cooking-guide happy path through real Firebase anonymous auth without a third-party Google popup. This improves browser-smoke confidence for guest flows, but does not replace Replit validation of Google sign-in, linked-user upsert/routing, history, or durable cooking persistence.

## Validation State

- PR #102 was Replit-validated at `c952d13c9918356de2c5aaf31cb0dbde6f2d1824` before merge. The happy-path refresh confirmed anonymous Firebase entry, same-browser guest setup persistence, guest recipe suggestions, guest cooking-guide entry without durable cooking-session writes, Google linked sign-in/routing, linked profile writes, linked history behavior, and no landing-page quota pressure.
- Local smoke at `c952d13` added unhappy-path confidence for no-auth API rejection, anonymous Google-upsert rejection, empty-pantry guest recovery, and anonymous live-cooking durable-session boundaries. Additional local browser clicks were interrupted by the Codex app/browser surface reset and should not replace Replit UI validation.
- Local anonymous smoke exposed existing local database schema drift: `prompt_versions` and `ai_interactions` were absent from the local database, producing prompt/eval logging warnings while user-facing AI routes still returned `200`. This is now tracked in [EFF-010](../efforts/effort-010-local-db-schema-strategy.md), not treated as a PR #102 blocker.
- Future runtime phases should keep Replit as the authoritative validation environment for linked-account, provider-backed, DB-backed, and deployment-bound behavior.
- Production enablement is blocked until Firebase App Check is configured and anonymous auth can be verified under real quota, rate-limit, kill-switch, and upgrade-to-save behavior.

## Current Resume Point

1. Start the remaining guest-MVP production gates from fresh `origin/main`: anonymous quota enforcement, anonymous kill switch, anonymous rate-limit identity, Firebase App Check posture, and upgrade-to-save boundaries.
2. Keep the server-auth slice narrow: server-derived auth mode, null-safe linked upsert, auth-session hardening, quota enforcement, and explicit linked-only durability.
3. Do not enable public anonymous auth in production until App Check, anonymous quota enforcement, anonymous abuse controls, and linked-save boundaries are implemented and validated.
4. Coordinate Phase 4/5 guest-facing copy with INIT-001: landing promises cooking guidance, but durable cooking memory and Phase 5 retention remain linked-only in v1.
5. Keep anonymous Slop Bowl dry-run as follow-up scope unless Wilson explicitly pulls it into the next gate branch.
6. If measurement work becomes urgent, file a separate analytics effort rather than overloading the runtime auth branches.

## Chronology

### 2026-05-15 — Initiative created from guest-auth planning

Wilson asked for a secure alternative to repeated manual Google popup validation, then widened the product direction to a public guest entry path using Firebase anonymous auth. Planning explored a dev-only custom-token harness, then a public unlimited-guest model, then revisited the lack of conversion incentive and the Phase 5 returning-user implications.

The accepted direction became:

- public anonymous Firebase entry
- 10 successful recipe generations in v1
- same-browser guest persistence through normal reopen
- Google required for recipe generation `#11+`
- Google required for all durable server-side saves
- linked-only durable Phase 5 memory

Security review also locked several preconditions into the initiative baseline:

- server-derived guest-vs-linked mode from verified Firebase claims
- anonymous IP-keyed rate-limit identity
- server kill switch for anonymous traffic
- App Check before production enablement
- no anonymous durable-user row creation on sign-in alone

### 2026-05-26 — Phase 3 merged via PR #102

[PR #102](https://github.com/wmishak404/laica/pull/102) merged as `515b7ec` after Wilson refreshed Replit happy-path validation at `c952d13c9918356de2c5aaf31cb0dbde6f2d1824`.

The merged Plan B slice includes the public pre-auth homepage, `Start cooking now` anonymous Firebase entry, `/api/auth/session` linked-vs-anonymous metadata, browser-local guest profile persistence, guest access to Chef It Up recipe ideas and the cooking guide without durable cooking-session writes, linked-only Settings/History durability, and homepage carousel polish.

Remaining work moves to the production gates: quota enforcement, anonymous kill switch, anonymous rate-limit identity, App Check posture, and upgrade-to-save boundaries. Local unhappy-path probes supported the merge, but Replit remains authoritative for provider-backed, DB-backed, and deployment-bound behavior.
