# INIT-003 — Anonymous Trial and Account Upgrade

**Status:** Planning
**Owner:** Wilson / Codex / Claude / Replit
**Created:** 2026-05-15
**Current phase:** Phase 1 — server auth and abuse-control foundations (next)
**Active PR:** None
**Active branch:** None; the historical docs branch `codex/init-003-anonymous-trial-docs` is already contained in `origin/main`

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
- guests receive 5 successful recipe generations in v1
- the quota is subtle in the UI and becomes stronger near exhaustion
- same-browser guest progress persists through normal reopen
- Google linking is required for recipe generation `#6+`
- Google linking is required for all durable server-side saves
- durable Phase 5 history/cleanup/taste memory remains linked-only

## Current Status

Phase 0 is merged on `main` via docs-baseline commit `f3de076`. It added INIT-003, PD-012, the cross-links from Mobile Refresh Phase 1/Phase 5, and the initial handoff.

No runtime implementation has started yet. The first runtime slice can now begin from fresh `origin/main`, inheriting the same accepted product and security contract instead of rebuilding it from chat.

The first runtime phase should stay narrow:

- provider-aware server auth session metadata
- anonymous kill switch
- anonymous IP-keyed rate-limit identity
- null-safe linked-user upsert behavior
- linked-only compatibility guard on the existing `/api/auth/google` path

Public production enablement is blocked until Firebase App Check is configured and enforced.

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

No new dedicated assets yet. Future UI work may reuse or extend the Mobile Refresh auth/landing and post-cook references once runtime implementation begins.

## Phase Progress

| Phase | Status | PR / branch | Current signal |
|---|---|---|---|
| Phase 0 — docs baseline and prerequisites | Merged | `f3de076` / `codex/init-003-anonymous-trial-docs` | INIT-003 and PD-012 captured the accepted guest model, security gates, and revisit triggers before runtime work starts |
| Phase 1 — server auth and abuse-control foundations | Planned (next) | TBD | Add server-derived `authMode`, anonymous kill switch, App Check enforcement path, IP-keyed anonymous rate limits, and null-safe linked upsert behavior |
| Phase 2 — guest quota state and auth session contract | Planned | TBD | Canonical auth-session route plus 5-generation anonymous quota accounting |
| Phase 3 — client guest entry and same-browser persistence | Planned | TBD | Anonymous sign-in, `/api/auth/session` adoption, and local guest-state namespacing/cleanup |
| Phase 4 — upgrade-to-save boundary and promotion | Planned | TBD | Typed `UPGRADE_REQUIRED` responses, Google link flow, and strict trial-state promotion |
| Phase 5 — anonymous cooking coverage and Phase 5 integration | Planned | TBD | Anonymous-safe Slop Bowl path plus linked-only durable cooking/history/cleanup memory |
| Phase 6 — operations, cleanup, and launch | Planned | TBD | Account-mode operational logging, stale anonymous-account cleanup, and production enablement gates |

## PRs and Branches

| PR | Status | Branch | Validation / merge signal |
|---|---|---|---|
| Docs baseline | Merged | `codex/init-003-anonymous-trial-docs` | Commit `f3de076` is on `origin/main`; runtime validation has not started |

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
- The accepted v1 guest model is now **5 successful recipe generations**, not unlimited generation and not full-cook counting.
- "Save gate" was clarified to mean **durable server-side writes only**, not same-browser local guest persistence.
- Same-browser guest persistence through normal reopen was accepted so users do not have to rescan pantry after ordinary browser restarts.
- The upgrade message split was accepted:
  - cap moment: unlock more recipes
  - save moment: save your kitchen
- Product analytics was intentionally separated from INIT-003 runtime scope so guest auth, quota, persistence, and Phase 5 boundaries can land without also inventing a new analytics foundation.

## Validation State

- Phase 0 docs baseline is on `origin/main` at `f3de076`; no runtime validation has been performed.
- Future runtime phases should keep Replit as the authoritative validation environment for linked-account, provider-backed, and deployment-bound behavior.
- Production enablement is blocked until Firebase App Check is configured and anonymous auth can be verified under real rate-limit and kill-switch behavior.

## Current Resume Point

1. Start Phase 1 runtime work from fresh `origin/main` on a new branch, not on the historical docs branch.
2. Keep the first runtime slice narrow: server auth mode, kill switch, anonymous rate-limit identity, null-safe linked upsert, and auth-session groundwork.
3. Do not enable public anonymous auth in production until App Check, anonymous quota enforcement, and linked-save boundaries are implemented and validated.
4. If measurement work becomes urgent, file a separate analytics effort rather than overloading the Phase 1 runtime branch.

## Chronology

### 2026-05-15 — Initiative created from guest-auth planning

Wilson asked for a secure alternative to repeated manual Google popup validation, then widened the product direction to a public guest entry path using Firebase anonymous auth. Planning explored a dev-only custom-token harness, then a public unlimited-guest model, then revisited the lack of conversion incentive and the Phase 5 returning-user implications.

The accepted direction became:

- public anonymous Firebase entry
- 5 successful recipe generations in v1
- same-browser guest persistence through normal reopen
- Google required for recipe generation `#6+`
- Google required for all durable server-side saves
- linked-only durable Phase 5 memory

Security review also locked several preconditions into the initiative baseline:

- server-derived guest-vs-linked mode from verified Firebase claims
- anonymous IP-keyed rate-limit identity
- server kill switch for anonymous traffic
- App Check before production enablement
- no anonymous durable-user row creation on sign-in alone

### 2026-05-20 — Phase 0 docs baseline found on main

The weekly Effort hygiene audit found the Phase 0 docs-baseline commit `f3de076` on `origin/main` while INIT-003 still described the docs branch as active. The INIT and registry now treat Phase 0 as merged and Phase 1 as the next runtime slice. No runtime implementation or validation has started.
