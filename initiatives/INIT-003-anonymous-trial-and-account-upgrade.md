# INIT-003 — Anonymous Trial and Account Upgrade

**Status:** In Progress
**Owner:** Wilson / Codex / Claude / Replit
**Created:** 2026-05-15
**Current phase:** Phase 5 / later promotion follow-up planning

## Overview

INIT-003 is the cross-cutting initiative for public guest entry, guest recipe limits, Google linked-account rules, and the persistence/security contract that sits between first-time trial use and durable account memory.

The initiative exists because the accepted direction is no longer just a mobile-refresh auth polish question. It affects:

- Firebase auth mode and route contracts
- anonymous abuse controls and operational cost posture
- local vs durable app state
- recipe-generation gating and linked-account prompts
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

PR #107 merged the remaining production-gate slice that makes public anonymous traffic safer to operate: quota enforcement, anonymous kill switch, anonymous rate-limit identity, App Check posture, linked-account save boundaries, session-local guest Settings, and guest/linked cache isolation.

As of 2026-05-29, `main` includes the production gates through merge commit `a0efc430450aa4f0e582dd7d96ebcdc187633098`:

- `anonymous_recipe_usage` tracks anonymous recipe-generation quota without creating `auth_users` rows for anonymous sign-in alone.
- Chef It Up generation routes reserve one anonymous quota slot before provider work and refund it on provider failure; recipe attempt `#11+` returns typed `LINKED_ACCOUNT_REQUIRED`.
- Anonymous Firebase traffic can be stopped with `ANONYMOUS_AUTH_DISABLED`.
- Anonymous client entry now waits for `/api/auth/session` before marking a Firebase anonymous user as accepted, so the server-side kill switch remains authoritative before the app shell opens.
- User-scoped rate-limit keys collapse anonymous users to the client IP instead of the anonymous Firebase UID. Chef It Up recipe generation now defaults to a 20-request / 30-minute user burst limit so the abuse backstop does not normally interrupt validation of the 10-successful-generation guest quota.
- Firebase App Check verification is available behind `FIREBASE_APP_CHECK_ENFORCED`; the client sends `X-Firebase-AppCheck` when `VITE_FIREBASE_APP_CHECK_SITE_KEY` is configured. Wilson validated enforced App Check at PR head `72ef2f7` before merge.
- Durable profile/settings/pantry/cooking-session/history routes reject anonymous tokens with typed `LINKED_ACCOUNT_REQUIRED` so server-side saves remain linked-account only.
- Guest Settings for Pantry, Kitchen, and Cooking Profile remain available as same-browser session edits; they update the browser-local guest profile and do not call durable profile/settings APIs.
- Chef It Up planning state, planning time, local cooking resume state, linked profile queries, and linked cooking-session/history queries are scoped by guest/linked user identity so same-browser anonymous trials do not cross-pollinate into later Google accounts.

The 10-generation quota is intentionally a low-friction v1 product gate, not a durable human-identity guarantee. Same-browser normal reopen should preserve the same anonymous Firebase UID and quota state, but explicit sign-out, cleared site data, another browser/device, or incognito can create a fresh anonymous UID. Wilson accepted this tradeoff on 2026-05-27 for the early public MVP; App Check, IP-keyed rate limits, and the anonymous kill switch are the current abuse backstops. Stronger identity or abuse controls are deferred until usage/cost signals justify crossing that bridge.

PR #107's merged production-gates slice did not start the fuller Phase 4 promotion/linking flow and did not add anonymous Slop Bowl dry-run behavior. PR #126 later merged the first Phase 4 Google promotion slice; Slop Bowl remains linked-only until a later explicit phase changes that boundary.

**Sequencing classification:** this remains a soft-sequence override with hard production gates. The public homepage and client anonymous entry shipped before the full quota/save-boundary stack, but production readiness depended on the Phase 1/2 server foundations, quota accounting, App Check, and linked-account boundaries that PR #107 has now merged. The homepage CTA must continue to start a real Firebase anonymous session; it must not fake guest mode.

Target-runtime public enablement should keep App Check configured and enforced for the public domain, leave `ANONYMOUS_AUTH_DISABLED` unset only when guest access should be open, and ensure the `anonymous_recipe_usage` table is present before quota testing.

As of 2026-06-04, PR #126 has merged the first Phase 4 promotion implementation slice. It keeps the product mental model that a guest is not holding a durable account: anonymous users see sign-up/save-progress CTAs for preservation plus a separate start-over escape hatch, and Google conversion preserves the same-browser Pantry, Kitchen, Cooking Profile, and favorite-chef setup. It intentionally does not bulk-import completed anonymous cooks into durable History.

As of 2026-06-09, PR #156 merged the follow-up correction that removes the unapproved guest-only `Save progress` bottom-nav shortcut. Guest promotion remains available through the planning reminder and app menu, but durable cross-functional navigation additions now require explicit Wilson approval before implementation.

## Plan B Guest MVP Launch Path

Plan B prioritizes shipping the public pre-auth homepage before INIT-001 Phase 4 or Phase 5, while keeping the guest runtime honest about what is local/session-limited versus durable account memory.

Before public launch, the minimum guest-MVP gates are:

- Anonymous quota enforcement, anonymous kill switch, anonymous rate-limit identity, and Firebase App Check posture are confirmed before production enablement. These passed in Replit for PR #107 at `72ef2f7` before merge.
- Guest quota/linked-account messaging appears inside usage moments, not on the landing page.
- Linked-account save boundaries clearly separate browser-local guest continuation from linked-account durable saves.

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
- [EFF-010 — Local DB schema strategy](../efforts/effort-010-local-db-schema-strategy.md) — resolved policy history; current DB validation boundaries live in ADR-0001 and the testing/local-sandbox workflows
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
| Phase 1 — server auth and abuse-control foundations | Complete | [#107](https://github.com/wmishak404/laica/pull/107) / `codex/init-003-production-gates` | Merged as `a0efc43`; adds anonymous kill switch, App Check enforcement path, IP-keyed anonymous rate-limit identity, backend-session client gate, and linked-only durable-route guardrails; Replit kill switch passed at `33872fd`, App Check enforced smoke passed at `72ef2f7` |
| Phase 2 — guest quota state and auth session contract | Complete | [#107](https://github.com/wmishak404/laica/pull/107) / `codex/init-003-production-gates` | Merged as `a0efc43`; adds `anonymous_recipe_usage`, anonymous session quota metadata, and 10-generation quota reservation/refund enforcement for Chef It Up generation routes; Replit schema/runtime quota validation passed, including `#11` `LINKED_ACCOUNT_REQUIRED` |
| Phase 3 — client guest entry, same-browser persistence, and public pre-auth homepage | Complete | [PR #102](https://github.com/wmishak404/laica/pull/102) / `codex/init-003-preauth-homepage` | Merged as `515b7ec` after Replit validation at `c952d13`: anonymous sign-in, `/api/auth/session` adoption, local guest profile persistence, A+C hybrid pre-auth homepage, and no landing-page quota pressure |
| Phase 4 — linked-account save boundary and promotion | First slice complete; bottom-nav shortcut correction merged | [#126](https://github.com/wmishak404/laica/pull/126) / `codex/anonymous-google-promotion`; [#156](https://github.com/wmishak404/laica/pull/156) / `codex/remove-guest-bottom-nav-menu` | PR #126 merged as `8282d51`; preserves same-browser Pantry, Kitchen, Cooking Profile, and favorite chefs through Google conversion, uses neutral import consent for credential-in-use flows, shows inline success confirmation, and keeps durable History import deferred. PR #156 merged as `492b3a6`; removes the unapproved guest-only `Save progress` bottom-nav shortcut while keeping promotion available through the planning reminder and app menu, and records the E2E/guest-signup validation workflow nuance. |
| Phase 5 — anonymous cooking coverage and Phase 5 integration | Planned | TBD | Anonymous-safe Slop Bowl path plus linked-only durable cooking/history/cleanup memory; revisit after INIT-001 Phase 5 is implemented/validated to decide whether explicit guest current-cook or selected-cook import after Google linking is worth designing |
| Phase 6 — operations, cleanup, and launch | Production-gate slice complete; later cleanup/ops planned | [#107](https://github.com/wmishak404/laica/pull/107) / `codex/init-003-production-gates` | App Check posture and kill-switch env contract are merged; Replit final gate passed at `72ef2f7` with `FIREBASE_APP_CHECK_ENFORCED=true`; later cleanup/ops work remains separate |

## PRs and Branches

| PR | Status | Branch | Validation / merge signal |
|---|---|---|---|
| [#102](https://github.com/wmishak404/laica/pull/102) | Merged | `codex/init-003-preauth-homepage` | Merged as `515b7ec` after Replit validation at `c952d13c9918356de2c5aaf31cb0dbde6f2d1824`; local unhappy-path probes covered no-auth API rejection, anonymous Google-upsert rejection, empty-pantry guest guard, and anonymous live-cooking durable-session guard |
| [#107](https://github.com/wmishak404/laica/pull/107) | Merged | `codex/init-003-production-gates` | Merged as `a0efc430450aa4f0e582dd7d96ebcdc187633098` after Replit validation at `72ef2f7`; local `npm ci`, focused Vitest, full Vitest suite, `npm run check`, `npm run build`, and `git diff --check` passed; existing Playwright e2e is stale/failing and not app-wide evidence; Wilson's Replit walkthrough passed guest Settings, provider sanity baseline, schema, quota, durable-save copy, Google sign-in, linked cache isolation, linked History, linked cooking-session persistence, kill-switch behavior, and App Check enforced mode |
| [#126](https://github.com/wmishak404/laica/pull/126) | Merged | `codex/anonymous-google-promotion` | Merged as `8282d5193f6eeef50eeecdff9f91bd029bbcd561`; CI passed Dependency Audit, Secret Scan, typecheck/build/unit, and guest E2E smoke at head `f2eb44d`; Wilson Replit-validated the runtime promotion flows at code head `2a4ae75`, with only an optional guest `#11` body-copy recheck left after the final copy-only fix |
| [#156](https://github.com/wmishak404/laica/pull/156) | Merged | `codex/remove-guest-bottom-nav-menu` | Merged as `492b3a6808dd088c430b49649ea3c4ef4bfde0ee`; removes the unapproved guest-only `Save progress` bottom-nav shortcut while preserving the menu and planning reminder promotion paths. GitHub CI passed on head `1102c1f`, including `e2e_guest_smoke` against an ephemeral schema-pushed Neon branch; Replit validation deferred until production push. |

## Efforts and Governance

| Reference | Relevance |
|---|---|
| [PD-012](../product-decisions/pd-012-public-anonymous-trial-and-account-upgrade.md) | Durable accepted product/security policy for guest mode and upgrade boundaries |
| [INIT-001](INIT-001-mobile-refresh.md) | Phase 1 landing and Phase 5 returning-user behavior both intersect with this initiative |
| [EFF-017](../efforts/effort-017-environment-parity-and-ci-confidence.md) | Future auth/browser smoke work should adapt to guest mode without replacing linked-account Replit validation |
| [EFF-024](../efforts/effort-024-guest-privacy-trust-messaging.md) | Resolved by PR #126's restrained menu-level browser-local cue plus concise Settings copy; use as history for future guest trust messaging |
| [EFF-010](../efforts/effort-010-local-db-schema-strategy.md) | Resolved local DB policy history; quota/promotion schema work must still follow ADR-0001 and the testing/local-sandbox workflows |
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
- The linked-account prompt split was accepted:
  - cap moment: unlock more recipes
  - save moment: sign in or create an account to save your ingredients and profile
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
- PR #107 satisfied the production-gate validation requirement before merge: Firebase App Check was configured in Replit, anonymous auth was verified under real quota, rate-limit, kill-switch, and linked-account save behavior, and the final App Check enforced smoke passed at `72ef2f7`.
- 2026-05-27 local checks for `codex/init-003-production-gates` passed:
  - `npm ci`
  - `npx vitest run tests/unit/firebase-auth.test.ts tests/unit/auth-session-route.test.ts tests/unit/anonymous-production-gates-route.test.ts tests/unit/rate-limit.test.ts tests/unit/security-hardening.test.ts tests/unit/live-cooking-guest-session.test.tsx tests/unit/slop-bowl-route.test.ts tests/unit/phase0-security-routes.test.ts`
  - `npx vitest run tests/unit/planning-choice.test.tsx tests/unit/user-settings-scan-policy.test.tsx tests/unit/anonymous-production-gates-route.test.ts tests/unit/live-cooking-guest-session.test.tsx`
  - `npx vitest run` — 25 files / 153 tests
  - `npm run check`
  - `npm run build`
  - `git diff --check`
- 2026-05-27 Playwright probe after PR #108 rebase found 30 e2e cases in `tests/e2e/cooking-workflow.test.ts`, but the Chromium slice failed all 6 cases on stale selectors/test assumptions (`Sign in with Google`, `recipe-list`, `Ask for Help`, `audio-toggle`). This is recorded as stale e2e coverage, not product validation evidence for INIT-003.
- 2026-05-27 guest Settings adjustment added local coverage that anonymous users can open Settings from the menu or empty-pantry recovery and save Pantry add/delete, Kitchen edits, and Cooking Profile edits through the session callback without durable API calls.
- 2026-05-28 local checks after the Replit cache-isolation finding passed:
  - `npx vitest run tests/unit/planning-choice.test.tsx tests/unit/meal-planning.test.tsx tests/unit/anonymous-production-gates-route.test.ts tests/unit/live-cooking-guest-session.test.tsx` — 30 tests
  - `npm run check`
  - `npx vitest run` — 26 files / 162 tests
  - `npm run build`
  - `git diff --check`
- 2026-05-28 Replit validation has partially run for `codex/init-003-production-gates`: Wilson confirmed guest Settings session-local edits, Chef It Up using edited guest data, History and Slop Bowl linked-only boundaries, Google sign-in, linked History loads/writes, durable-save rejection and copy for guests, provider sanity baseline for vision/recipes/cooking steps/speech, `anonymous_recipe_usage` schema availability after a manual Replit DB helper, the `#11` guest quota block returning `403 LINKED_ACCOUNT_REQUIRED`, linked profile/settings cache isolation after anonymous guest use, anonymous quota persistence across normal Replit page refresh, and linked cooking-session persistence.
- Kill-switch validation passed at `33872fd`: guest start stayed on the landing page, displayed the guest-unavailable toast, and Replit logged `/api/auth/session 403`; after Wilson removed the secret and restarted, guest sign-in worked again. App Check pre-enforcement validation confirmed the Replit client sends `X-Firebase-AppCheck` on `/api/auth/session` while enforcement is off. Wilson then loaded the current PR head `72ef2f7`, set `FIREBASE_APP_CHECK_ENFORCED=true`, and passed the final smoke: guest start, recipe generation, Google sign-in, linked profile/settings save, vision scan, cooking steps, and speech all worked with no `APP_CHECK_REQUIRED` or `APP_CHECK_INVALID`.
- 2026-06-03 Replit validation for `codex/anonymous-google-promotion` confirmed guest mental-model surfaces, same-browser setup persistence, new Google account promotion, existing Google credential/import consent, restrained Settings copy, neutral Google-import wording, and the inline post-link confirmation copy at runtime head `e2231be`. Follow-up Replit validation confirmed completed guest cooks do not retro-import into durable History after conversion, and the guest recipe `#11` quota gate blocks as expected. The quota toast title was correct, but the body still surfaced old `Link Google` wording from the server response; the client now overrides recipe-cap body copy to `Sign up before making more recipes.` Wilson then loaded latest head `2a4ae75`, confirmed the app loads cleanly, confirmed the linked-account success message lingers until navigation, and confirmed signed-in accounts can pass recipe attempt `#11` as designed. Popup cancellation uses calm copy but still takes about three seconds because Firebase reports popup closure asynchronously. Guest `#11` blocking was manually confirmed shortly before the final copy-only fix, so the remaining guest-only `#11` body-copy check is optional; local unit coverage guards the copy override.
- 2026-06-04 PR #126 merged as `8282d5193f6eeef50eeecdff9f91bd029bbcd561` after GitHub Actions passed Dependency Audit, Secret Scan, typecheck/build/unit, and guest E2E smoke at PR head `f2eb44d`. This completes the first Phase 4 Google promotion slice; future guest cook/History import remains explicit Phase 5 or promotion follow-up, not an automatic conversion side effect.
- 2026-06-09 PR #156 merged as `492b3a6808dd088c430b49649ea3c4ef4bfde0ee` after GitHub Actions passed unit/type/build, dependency, secret, CodeQL, and `e2e_guest_smoke` on PR head `1102c1f`. The E2E lane used a schema-only Neon branch, pushed the current schema, passed `db:health`, ran 7 Playwright tests, and deleted the branch. Local dotenvx E2E against the decrypted worktree `.env` database failed first because that database was stale and missing `anonymous_recipe_usage`; this is recorded as EFF-010 diagnostic signal, not product failure.

## Current Resume Point

1. Treat the public guest production-gate code as merged on `main` through PR #107 (`a0efc43`) and Replit-validated at `72ef2f7`.
2. When enabling or revalidating a public runtime, confirm the target environment has `VITE_FIREBASE_APP_CHECK_SITE_KEY`, Firebase Console App Check registration for the target domain, `FIREBASE_APP_CHECK_ENFORCED=true`, `ANONYMOUS_AUTH_DISABLED` unset unless guest access should be paused, and the `anonymous_recipe_usage` table present.
3. Treat the first Phase 4 Google promotion slice as merged through PR #126 (`8282d51`). Phase 5/anonymous Slop Bowl dry-run and any explicit current-cook or selected-cook History import remain separate follow-up scope unless Wilson pulls them forward.
4. Treat the guest bottom-nav correction as merged through PR #156 (`492b3a6`): guests should not receive a one-function `Save progress` bottom-nav shortcut unless Wilson explicitly approves that durable navigation addition. Promotion remains available through the planning reminder and app menu.
5. Use conversion-gated durability for guest promotion: first preserve Pantry, Kitchen, and Cooking Profile when the user links Google and consents; do not bulk- or background-import every completed anonymous cook into durable History in the first promotion slice.
6. Keep durable History, cleanup memory, taste memory, next-meal retention, and durable cooking-session memory linked-account only unless a later INIT-003 phase changes that boundary. A future Phase 5/promotion path may explicitly save a current guest cook after conversion, but that must be user-consented and designed with cleanup/taste semantics instead of automatic retro-import.
7. Checkpoint after INIT-001 Phase 5 is complete: reopen this INIT's Phase 5/later-promotion planning and decide whether to add any user-consented guest current-cook or selected-cook History import after Google linking. Do this only after INIT-001 Phase 5 has real merged semantics for History, cleanup, taste signal, pending cleanup, and next-meal retention.
8. Use the remaining follow-up Efforts as the durable homes for post-validation learnings: [EFF-022](../efforts/effort-022-cross-cuisine-recommendation-prompts.md) for cuisine-fit prompt/eval work. [EFF-024](../efforts/effort-024-guest-privacy-trust-messaging.md) is resolved by PR #126 and [EFF-025](../efforts/effort-025-settings-unsaved-inventory-reminder.md) is resolved by PR #237, so both should be used as history only.
9. If measurement work becomes urgent, file a separate analytics effort rather than overloading the runtime auth branches.

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

Remaining work moves to the production gates: quota enforcement, anonymous kill switch, anonymous rate-limit identity, App Check posture, and linked-account save boundaries. Local unhappy-path probes supported the merge, but Replit remains authoritative for provider-backed, DB-backed, and deployment-bound behavior.

### 2026-05-27 — Production gates branch implemented locally

`codex/init-003-production-gates` was reset to fresh `origin/main` at `c1d084f`, then implemented the remaining public guest MVP safety gates in one branch:

- anonymous quota table and reservation/refund enforcement for Chef It Up recipe generation
- typed `LINKED_ACCOUNT_REQUIRED` responses for recipe cap and durable-save boundaries
- linked-only server guards for durable profile/settings/pantry/cooking/history routes
- anonymous auth kill switch
- anonymous IP-keyed rate-limit identity
- Firebase App Check client token attachment and server enforcement path
- session-local guest Settings access for Pantry/Kitchen/Cooking Profile edits without durable API writes

The branch intentionally does not begin the later Google promotion/import flow or anonymous Slop Bowl dry-run. Local compile/build/unit validation passed, and Replit remains the final gate for schema, auth, DB-backed, AI, App Check, and speech-adjacent runtime behavior.

After docs-only [PR #108](https://github.com/wmishak404/laica/pull/108) merged as `fc55772`, the branch rebased onto fresh `origin/main` and reran the local validation matrix. Full Vitest passed, compile/build checks passed, and the stale Playwright e2e suite was recorded as a separate testing-coverage gap rather than a blocker for the local route/middleware evidence.

Wilson's Replit walkthrough then exposed a guest UX gap: after first setup/cook, anonymous users could not revisit Pantry/Kitchen/Profile Settings even though those same-browser profile fields are the data Chef It Up uses for later attempts. The branch was adjusted so Settings is available to guests in session-only mode, with local tests proving the menu path, empty-pantry recovery path, pantry add/delete, kitchen edits, and cooking-profile edits do not call durable linked-account APIs.

Wilson's Replit quota walkthrough also showed the old 10-request / 1-hour recipe rate limit firing as `429 RATE_LIMITED` before the intended `#11` guest quota boundary could be observed. The branch now uses a 20-request / 30-minute Chef It Up user burst limit and rate-limit copy based on the server `Retry-After` header. A `429` remains abuse-control behavior; the `#11` quota acceptance check is still the separate `403 LINKED_ACCOUNT_REQUIRED` path.

The same walkthrough then exposed an OpenAI prepaid-credit exhaustion path: OpenAI returned `insufficient_quota`, the route refunded the anonymous quota reservation, but the user-facing failure was too easy to confuse with Laica's guest cap or app rate limiter. The branch now preserves OpenAI `insufficient_quota` as typed `503 AI_PROVIDER_QUOTA_EXHAUSTED` with copy that says the issue is on Laica's AI capacity side, not the guest recipe limit. A provider-quota failure still does not count as a successful anonymous recipe generation.

### 2026-05-28 — Replit validation findings and cache isolation fix

Wilson's Replit validation covered the real anonymous/linked runtime more deeply:

- guest Settings after setup now works for Pantry, Kitchen, and Cooking Profile as session-local browser data
- Chef It Up used the edited guest local profile data on a later generation
- History and Slop Bowl remained linked-account only
- Google sign-in and linked History loaded/wrote successfully
- direct guest durable-save attempts returned `LINKED_ACCOUNT_REQUIRED`
- vision scan, recipe generation, cooking steps, and speech synthesis worked after OpenAI credits were refilled
- `anonymous_recipe_usage` existed after Replit-side schema setup, and the guest `#11` recipe-generation attempt returned the intended `403 LINKED_ACCOUNT_REQUIRED`

The walkthrough also found a cache-isolation bug: same-browser Chef It Up planning preferences and last time selection could carry from anonymous or prior linked sessions into a later Google account. The branch now scopes Chef It Up planning session storage, planning-time storage, local live-cooking resume storage, linked profile query cache, and linked cooking-session/history query cache by guest/linked user identity. Legacy unscoped browser keys are removed instead of restored.

Wilson then re-tested the latest head `e19098e`: linked profile/settings after anonymous guest use no longer showed stale cuisine/time/profile data; guest durable-save copy passed with `POST /api/recipes/pantry 403`; logout/login and Replit page refresh did not leak state; anonymous quota persisted across normal page refresh; and linked cooking-session persistence passed after Google sign-in, live cooking, step advance, refresh/navigate, and history/session resume/write.

### 2026-05-28 — Kill-switch client gate fix

Wilson's first Replit kill-switch attempt produced the expected user-facing error but still let the anonymous Firebase session route into the app. The server gate was working, but the client accepted `onAuthStateChanged` anonymous state before `/api/auth/session` rejected it.

The branch now verifies anonymous Firebase state through `/api/auth/session` before setting the authenticated app user or auth query cache. If the backend rejects the anonymous session, the client signs out Firebase, clears the auth cache, and stays signed out. Local regression coverage in `tests/unit/firebase-auth-client.test.tsx` proves both the accepted anonymous session path and the kill-switch rejection path.

### 2026-05-29 — Kill-switch re-test passed

Wilson re-tested the anonymous kill switch on Replit at PR head `33872fd`. With `ANONYMOUS_AUTH_DISABLED=true`, clicking `Start cooking now` stayed on the landing page, displayed the `Guest cooking did not start` toast with the guest-unavailable copy, and the Replit console showed repeated `/api/auth/session 403` responses. After Wilson removed the secret and restarted, guest sign-in worked again. This validates the server kill switch, client-side anonymous session gate, and rollback path together.

Wilson also registered the Firebase Web App for App Check with reCAPTCHA v3 and added `VITE_FIREBASE_APP_CHECK_SITE_KEY` to Replit. With enforcement still off, Replit DevTools confirmed `/api/auth/session` carried `X-Firebase-AppCheck` on `200 OK` and `304` responses. This validates the client-token attachment and removes the earlier environment assumption that App Check might not be configured.

Wilson then loaded the current PR head `72ef2f7` in Replit, set `FIREBASE_APP_CHECK_ENFORCED=true`, and reran the final smoke: guest start, recipe generation, Google sign-in, linked profile/settings save, vision scan, cooking steps, and speech all passed with no `APP_CHECK_REQUIRED` or `APP_CHECK_INVALID`. PR #107 merged as squash commit `a0efc430450aa4f0e582dd7d96ebcdc187633098`.

The merged production-gates slice makes the Plan B public guest MVP operationally safer to open: guest entry remains real Firebase anonymous auth; quota enforcement is server-backed; abuse controls include App Check, IP-keyed anonymous rate limits, and a kill switch; durable saves remain linked-account only; guest Pantry/Kitchen/Profile Settings stay same-browser local; and durable History, cleanup memory, taste memory, next-meal retention, and durable cooking sessions remain linked-account only.

At that point, post-merge follow-up scope remained explicit: Phase 4 owned fuller Google promotion/link/import behavior, Phase 5 owned linked returning-user memory and any future anonymous Slop Bowl dry-run decision, EFF-022 owned cuisine-fit prompt/eval improvements, EFF-024 owned guest privacy/trust messaging, EFF-025 owned unsaved Settings reminders, and analytics was separate. PR #126 later completed the first Phase 4 promotion slice and resolved EFF-024; PR #237 later resolved EFF-025.

### 2026-06-03 — Conversion-gated guest History decision

Wilson clarified the next account-promotion mental model: the public guest path is not an anonymous account the user should manage, and the first durable promise is that signing up with Google preserves the setup work they choose to keep, especially Pantry, Kitchen, and Cooking Profile. Completed anonymous cooks should not be bulk- or background-imported into durable History in the first promotion slice.

The accepted near-term implementation direction is conversion-gated durability. Guest cooks may remain local before conversion. At or after a Google conversion moment, Laica may save a current guest cook or selected cook state only through an explicit user-consented promotion/import path. Richer completed-cook import remains Phase 5/promotion design scope because cleanup, taste signal, next-meal retention, and History semantics need to be coherent before guest cook state becomes durable memory.

### 2026-06-03 — Phase 4 promotion branch started

`codex/anonymous-google-promotion` started the first Google promotion slice from the accepted conversion-gated decision. The branch changes guest copy away from anonymous-account framing, adds visible but non-blocking save-progress CTAs, keeps a separate guest start-over action, links an anonymous Firebase user to Google when possible, and asks before switching into Google and importing browser-local setup. The import scope remains Pantry, Kitchen, and Cooking Profile only; durable History, cleanup memory, taste memory, next-meal retention, and durable cooking-session memory stay linked-only and are not retro-filled from completed anonymous cooks.

Wilson's Replit review accepted the refined UX at runtime head `e2231be`: new-account and existing-credential account-promotion flows both worked, Settings copy was better after removing repeated "this browser" reminders, the neutral Google-import dialog was friendly enough for a brand-new-feeling Google path, and the inline confirmation should read `Account successfully connected and signed in. Your kitchen is saved.` Follow-up implementation makes that inline confirmation session-backed so it should survive auth/profile refresh churn and remain visible until the user moves to the next page/flow; recheck that behavior on the latest branch head before merge.

### 2026-06-04 — Phase 4 first promotion slice merged

PR #126 merged the first Google promotion slice as `8282d5193f6eeef50eeecdff9f91bd029bbcd561`. The merged behavior preserves browser-local Pantry, Kitchen, Cooking Profile, and favorite chefs when the guest links Google or consents to import into an existing Google credential path; keeps Sign up and Start over separate; shows the requested inline success confirmation until navigation; and keeps completed guest cooks out of durable History.

GitHub Actions passed Dependency Audit, Secret Scan, typecheck/build/unit, and guest E2E smoke at PR head `f2eb44d`. Replit validation reached code head `2a4ae75`; later commits were docs-only. The only unconfirmed runtime micro-copy is the optional guest `#11` toast body recheck after the final copy-only fix, with local unit coverage guarding `Sign up before making more recipes.`
