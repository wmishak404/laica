# INIT-003 production gates

**Agent:** codex
**Branch:** `codex/init-003-production-gates`
**PR:** [#107](https://github.com/wmishak404/laica/pull/107)
**Date:** 2026-05-27
**Initiative:** INIT-003
**INIT updated:** yes

## Summary

This branch turns the public anonymous guest MVP from "usable in the happy path" into a locally verified production-gate slice. It adds quota accounting, a server kill switch, anonymous abuse-control keying, Firebase App Check posture, linked-only durable-save boundaries, and session-local guest Settings access while intentionally leaving the fuller Phase 4 Google promotion/import flow and anonymous Slop Bowl dry-run for later phases.

Wilson clarified on 2026-05-27 that the 10-generation quota is acceptable as an early public-MVP friction reducer even though it is not durable human identity. The quota is per Firebase anonymous UID: same-browser normal reopen should preserve it, but sign-out, cleared site data, another browser/device, or incognito can create a fresh anonymous UID. App Check, IP-keyed rate limits, and the kill switch are the current abuse backstops; stronger identity or abuse controls are deferred until usage/cost signals require them. Wilson also asked to reserve "upgrade" language for future paid-tier work, so the runtime API now uses `LINKED_ACCOUNT_REQUIRED` for this boundary.

Wilson's Replit walkthrough showed the old 10-request / 1-hour recipe rate limit could fire as `429 RATE_LIMITED` before the intended `#11` guest quota boundary. This branch now defaults Chef It Up recipe generation to 20 requests per 30 minutes and uses `Retry-After` to keep rate-limit copy aligned with the actual wait. A `429` is still the abuse-control limiter; the guest quota acceptance criterion remains the separate `403 LINKED_ACCOUNT_REQUIRED` response after 10 successful generations.

Wilson later refilled OpenAI API credits after Replit surfaced OpenAI `insufficient_quota`. The route was already refunding the anonymous quota reservation on provider failure, but the failure was too easy to confuse with the app limiter or guest quota. This branch now preserves OpenAI quota exhaustion as typed `503 AI_PROVIDER_QUOTA_EXHAUSTED`, with client copy that says the issue is on Laica's AI capacity side and not the user's guest limit.

Wilson's 2026-05-28 Replit pass also exposed a same-browser cache-isolation fault: anonymous or older linked Chef It Up planning preferences could appear after signing in with a different Google account. This branch now scopes Chef It Up planning state, planning time, local live-cooking resume state, linked profile query cache, and linked cooking-session/history query cache by guest/linked user identity, and it drops legacy unscoped browser keys instead of restoring them.

## Changes

- `shared/schema.ts`
  - Adds `anonymous_recipe_usage` for anonymous Firebase UID quota accounting without creating `auth_users` rows.
- `server/storage.ts`
  - Adds quota read/reserve/refund methods. Reservation is atomic and refunded on provider failure so validation errors and failed generations do not consume the intended successful-generation quota.
- `server/routes.ts`
  - Adds typed `LINKED_ACCOUNT_REQUIRED` responses for recipe-cap and durable-save boundaries.
  - Uses "Sign in or create an account to save your ingredients and profile" copy for durable-save boundaries.
  - Enforces the anonymous 10-generation Chef It Up quota on `/api/recipes/suggestions` and `/api/recipes/pantry`.
  - Returns anonymous quota metadata from `/api/auth/session` and successful anonymous recipe responses.
  - Returns typed `AI_PROVIDER_QUOTA_EXHAUSTED` for OpenAI prepaid-credit/quota exhaustion while refunding anonymous quota reservations.
  - Blocks anonymous durable profile/settings/pantry/cooking-session/history routes.
  - Keeps Slop Bowl linked-only until a later explicit anonymous dry-run phase.
- `server/ai-errors.ts`, `server/openai.ts`
  - Detects OpenAI `insufficient_quota` and preserves it as a typed provider-capacity error instead of collapsing it to generic `AI_SERVICE_ERROR`.
- `server/firebaseAuth.ts`
  - Adds `ANONYMOUS_AUTH_DISABLED` kill switch handling.
  - Adds optional Firebase App Check verification behind `FIREBASE_APP_CHECK_ENFORCED`.
- `server/security.ts`
  - Allows the Google reCAPTCHA script/frame sources needed by Firebase App Check under production CSP.
- `server/rate-limit.ts`
  - Keys anonymous user-scoped rate limits by client IP instead of anonymous Firebase UID.
  - Tunes the Chef It Up user burst limiter from 10 requests / 1 hour to 20 requests / 30 minutes.
- `client/src/lib/firebase.ts`, `client/src/lib/queryClient.ts`, `client/src/hooks/useFirebaseAuth.ts`
  - Initializes Firebase App Check when `VITE_FIREBASE_APP_CHECK_SITE_KEY` is configured.
  - Sends `X-Firebase-AppCheck` on API requests.
  - Verifies guest sign-in against `/api/auth/session` so the server kill switch is honored before entering the app.
  - Routes Google backend sync through the shared API client so App Check is included.
- `client/src/pages/app.tsx`, `client/src/components/cooking/user-settings.tsx`
  - Allows anonymous guests to open Settings for Pantry, Kitchen, and Cooking Profile after setup.
  - Saves guest Settings edits through the same browser-local guest profile used by setup and planning, without calling durable profile/settings APIs.
  - Keeps History and Slop Bowl linked-account only.
- `client/src/pages/app.tsx`, `client/src/pages/cooking-new.tsx`, `client/src/components/cooking/meal-planning.tsx`, `client/src/components/cooking/live-cooking.tsx`
  - Scopes browser-local planning time, Chef It Up planning session restore, and live-cooking local resume state by guest/linked user identity.
  - Removes legacy unscoped local-storage keys so stale anonymous or prior-account state is not restored into a later account.
- `client/src/hooks/useAuth.ts`, `client/src/hooks/useCookingSession.ts`, `client/src/components/cooking/cooking-history.tsx`
  - Scopes linked profile, active cooking-session, and cooking-history query keys by auth user id so TanStack Query's infinite stale time cannot reuse another account's cached data.
- `client/src/lib/rateLimitHandler.ts`
  - Adds user-facing classification for `LINKED_ACCOUNT_REQUIRED`, anonymous-disabled, and App Check errors.
  - Uses `Retry-After` for rate-limit wait copy instead of hardcoding "a few minutes."
  - Separates provider quota exhaustion from app-side `429 RATE_LIMITED` and guest quota copy.
- `.env.example`
  - Documents the new public-gate env vars.
- `tests/unit/*`, `tests/setup.ts`
  - Adds coverage for App Check, kill switch, quota enforcement/refund, linked-only durable saves, Slop Bowl linked-only guard, anonymous IP-keyed rate limits, and session-only guest Settings edits.
- `initiatives/INIT-003-anonymous-trial-and-account-upgrade.md`, `initiatives/registry.md`, `efforts/effort-010-local-db-schema-strategy.md`, `efforts/registry.md`
  - Records the branch state, local validation, Replit validation requirements, and EFF-010 schema-workflow signal.

## Testing discipline

The reusable testing workflow update was split into docs-only [PR #108](https://github.com/wmishak404/laica/pull/108), which merged as `fc55772`. This branch was then rebased onto that fresh `origin/main`, and the validation notes below follow the new local/Replit/human/confidence-gap classification.

## Impact on other agents

Do not run local `npm run db:push` to apply `anonymous_recipe_usage`; EFF-010 still owns the local DB mutation policy. Replit must apply/validate this schema through the project-authoritative path before branch merge readiness.

`FIREBASE_APP_CHECK_ENFORCED` should stay off until Firebase Console App Check is configured for the public domain and `VITE_FIREBASE_APP_CHECK_SITE_KEY` is present in the matching client environment. Once enabled, protected API calls depend on the `X-Firebase-AppCheck` client header.

Anonymous Slop Bowl remains explicitly linked-only in this branch. That is intentional and follows the INIT's "anonymous Slop Bowl dry-run later" boundary.

Guest Settings are available in this branch, but only as local guest-profile edits. Replit validation should confirm a guest can revisit Settings after setup/cooking, add/delete pantry items, update kitchen tools/profile, return to Chef It Up, and still receive `LINKED_ACCOUNT_REQUIRED` for direct durable profile/settings/history/cooking-session API writes.

Any Replit validation done before the cache-isolation fix is stale for linked profile/settings save and linked cooking-session/history cache behavior. Re-smoke with a browser that previously used anonymous guest mode before considering the linked regression resolved.

## Open items

- Replit validation is still required for the latest head's linked cache isolation, kill switch, App Check enforcement, linked cooking-session persistence, and final deployment-bound behavior.
- PR #107 remains draft until Replit validation is complete.
- Phase 4 Google link/promotion/import remains follow-up scope.
- Phase 5 / anonymous Slop Bowl dry-run remains follow-up scope unless Wilson explicitly pulls it forward.

## Verification

Local checks passed on 2026-05-27 and 2026-05-28:

- `npm ci`
- `npx vitest run tests/unit/firebase-auth.test.ts tests/unit/auth-session-route.test.ts tests/unit/anonymous-production-gates-route.test.ts tests/unit/rate-limit.test.ts tests/unit/security-hardening.test.ts tests/unit/live-cooking-guest-session.test.tsx tests/unit/slop-bowl-route.test.ts tests/unit/phase0-security-routes.test.ts`
- `npx vitest run tests/unit/planning-choice.test.tsx tests/unit/user-settings-scan-policy.test.tsx tests/unit/anonymous-production-gates-route.test.ts tests/unit/live-cooking-guest-session.test.tsx`
- `npx vitest run tests/unit/anonymous-production-gates-route.test.ts tests/unit/rate-limit.test.ts tests/unit/ai-error-handling.test.tsx`
- `npx vitest run tests/unit/ai-provider-errors.test.ts tests/unit/anonymous-production-gates-route.test.ts tests/unit/ai-error-handling.test.tsx`
- `npx vitest run tests/unit/planning-choice.test.tsx tests/unit/meal-planning.test.tsx tests/unit/anonymous-production-gates-route.test.ts tests/unit/live-cooking-guest-session.test.tsx` — 30 tests passed after cache-isolation fix
- `npx vitest run` — 26 files / 162 tests passed after cache-isolation fix
- `npm run check`
- `npm run build`
- `git diff --check`

`npm run build` emitted existing-style Vite warnings about stale Browserslist data, Firebase dynamic/static import chunking, and a chunk larger than 500 kB; the build completed successfully.

`npm ci` completed with 3 moderate audit findings, which are not introduced by this branch and remain dependency-maintenance scope.

Playwright e2e status:

- `npx playwright test --list` found 30 cases in `tests/e2e/cooking-workflow.test.ts`.
- `npx playwright test --project=chromium` ran the 6 Chromium cases and all 6 failed on stale selectors/test assumptions (`Sign in with Google`, `recipe-list`, `Ask for Help`, `audio-toggle`). Treat this as stale e2e-suite coverage, not passing app-wide browser evidence and not an INIT-003 product failure.

## Coverage classification

| Case | Local automated? | Replit automated? | Needs Replit human? | Confidence / provenance |
|---|---|---|---|---|
| Anonymous guest server session and quota metadata | Partial | No script yet | Replit partially passed | `tests/unit/auth-session-route.test.ts` and `tests/unit/anonymous-production-gates-route.test.ts` cover route/session seams with mocked Firebase/storage/OpenAI. Wilson validated real anonymous runtime enough to continue, but final pass should still happen at the merge SHA. |
| Anonymous quota success and metadata | Yes | No script yet | Replit partially passed | `tests/unit/anonymous-production-gates-route.test.ts` proves reserve/metadata behavior locally. Replit initially lacked `anonymous_recipe_usage`; after manual schema setup, Wilson confirmed the table was ready and continued quota validation. |
| Attempt `#11` block | Yes | No script yet | Replit passed before latest cache fix | Local test asserts `LINKED_ACCOUNT_REQUIRED`, `linkedAccountReason: recipe_limit`, quota `0`, and no OpenAI call. Wilson observed the intended `403 LINKED_ACCOUNT_REQUIRED` after exhausting the guest quota; final merge readiness should re-check only if quota code changes again. |
| Provider failure refund | Yes | No script yet | Maybe | Local test forces provider failure and asserts refund; Replit can only prove this if logs or a safe forced-failure path make it observable. |
| OpenAI provider quota exhaustion | Yes | No script yet | Replit partially passed | `tests/unit/ai-provider-errors.test.ts`, `tests/unit/anonymous-production-gates-route.test.ts`, and `tests/unit/ai-error-handling.test.tsx` prove OpenAI `insufficient_quota` becomes typed `503 AI_PROVIDER_QUOTA_EXHAUSTED`, refunds anonymous quota, and is not presented as app rate limit or guest quota. Wilson confirmed the OpenAI credit issue was provider billing capacity, then refilled credits and resumed validation. |
| Guest durable-save boundaries | Yes | No script yet | Replit passed at `e19098e` | Local route/component tests cover guest blocking and linked-user cooking-session preservation. Wilson confirmed the updated durable-save copy and `POST /api/recipes/pantry 403` behavior on Replit. |
| Guest Settings session-local edits | Yes | No script yet | Replit passed before latest cache fix | `tests/unit/planning-choice.test.tsx` covers menu and empty-pantry entry into session Settings; `tests/unit/user-settings-scan-policy.test.tsx` covers pantry add/delete, kitchen edits, and cooking-profile edits without durable API calls. Wilson confirmed guest Settings, Chef It Up using edited data, and linked-only History/Slop Bowl on Replit. |
| Linked account cache isolation | Yes | No script yet | Replit passed at `e19098e` | `tests/unit/planning-choice.test.tsx` and `tests/unit/meal-planning.test.tsx` prove planning-time and in-progress Chef It Up state are scoped by auth identity. Code now also scopes linked profile/history/cooking query keys and live-cooking local resume state. Wilson re-tested linked profile/settings after anonymous guest use in the same browser and did not see stale cuisine/time/profile data. |
| Anonymous kill switch | Yes | No script yet | Yes, not yet run | `tests/unit/firebase-auth.test.ts` proves middleware rejection after token verification; Replit requires env change/restart and human confirmation before public enablement. |
| Anonymous IP-keyed rate limit | Yes | No script yet | Replit confidence gap | `tests/unit/rate-limit.test.ts` proves key derivation, typed payloads, and the 20-request / 30-minute Chef It Up burst default; Replit should watch proxy/client-IP behavior in the long-running runtime. |
| App Check posture | Yes | No script yet | Yes, not yet run | Local Firebase-auth tests cover missing/invalid/valid middleware branches with mocks; Firebase Console/site-key/debug-token/enforcement behavior needs Replit/human setup. |
| Linked cooking-session persistence | Partial | No script yet | Replit passed at `e19098e` | `tests/unit/live-cooking-guest-session.test.tsx` proves guests do not create durable sessions and linked users do. Wilson confirmed a linked Google user could start live cooking, advance, refresh/navigate, and resume/write the same linked account's session/history on Replit. |
| Vision and ElevenLabs sanity | No direct local provider test in this branch | No script yet | Replit passed baseline | Auth/App Check header changes can break protected provider routes; Wilson confirmed vision scan, recipe generation, cooking steps, and speech synthesis in the Replit baseline. Repeat after App Check enforcement is enabled. |
| Existing app-wide browser e2e | Listed, but stale/failing | No script yet | Yes for service-backed functions | `npx playwright test --project=chromium` fails on stale selectors in `tests/e2e/cooking-workflow.test.ts`; repair/replace this suite before treating it as app-wide browser evidence. |
| Deferred Phase 4/5 scope | No | No | Not for this branch | Google promotion/import, anonymous Slop Bowl dry-run, durable guest memory, and Phase 5 memory remain out of scope per INIT-003. |

## Replit validation request

Validated locally:

- [x] `npm ci`
- [x] `npm run check`
- [x] `npm run build`
- [x] focused Vitest suite listed above
- [x] full Vitest suite: 26 files / 162 tests
- [x] Playwright e2e probe attempted; current Chromium suite is stale/failing, so it is not app-wide evidence
- [ ] manual localhost smoke

Replit validation target:

- [x] Workspace / preview before merge
- [ ] Deployment or production-equivalent public domain before enabling public anonymous auth

Focus areas:

- [x] Secrets in deployment
- [x] Firebase auth (anonymous and Google sign-in)
- [x] Firebase Admin token verification
- [x] DB writes/reads + schema
- [x] AI routes
- [ ] Firebase App Check enforced mode
- [x] Vision / uploads enough to confirm App Check/auth headers do not break setup scans
- [x] ElevenLabs speech sanity enough to confirm auth middleware changes did not regress protected speech routes

Steps already run or partially run on Replit:

1. `anonymous_recipe_usage` was missing at first, then Wilson applied the Replit-side helper and confirmed `anonymous_recipe_usage ready: { rows: 0 }`.
2. Guest setup, guest Settings Pantry/Kitchen/Cooking Profile edits, returning to Chef It Up with edited guest data, linked-only History/Slop Bowl boundaries, Google sign-in, linked History, durable-save guest rejection, vision scan, recipe generation, cooking steps, and speech synthesis were baseline-passed by Wilson.
3. The guest `#11` quota block was observed as `403 LINKED_ACCOUNT_REQUIRED`. Earlier `429` results were app abuse-rate-limit behavior, and one `insufficient_quota` result was OpenAI prepaid-credit capacity, not guest quota.
4. At `e19098e`, Wilson re-tested linked profile/settings after anonymous guest use in the same browser; no stale cuisine/time/profile data appeared.
5. At `e19098e`, Wilson re-tested guest durable-save copy and saw the expected `POST /api/recipes/pantry 403`; logout/login and Replit page refresh did not leak stale state, and the anonymous quota count persisted across normal page refresh.
6. At `e19098e`, Wilson confirmed linked cooking-session persistence after Google sign-in, live cooking, step advance, refresh/navigate, and history/session resume/write.

Remaining Replit steps before merge readiness:

1. Set `ANONYMOUS_AUTH_DISABLED=true`, restart, and confirm anonymous protected API/session calls return `ANONYMOUS_ACCESS_DISABLED`; unset it before continuing.
2. Configure `VITE_FIREBASE_APP_CHECK_SITE_KEY` and Firebase Console/domain settings if not already configured. Enable `FIREBASE_APP_CHECK_ENFORCED=true`, restart, and confirm anonymous setup/recipe flow, Google sign-in/upsert, profile writes, vision scan, cooking steps, and speech routes still work with App Check tokens.
3. Repeat provider sanity after App Check enforcement: vision scan, recipe generation, cooking steps, and speech synthesis.

Last Replit-validated at: partial manual validation at `e19098e`; kill switch and App Check enforced mode not yet validated.

## Stack / base status

- Base refreshed: yes
- Current base: `origin/main` at `fc55772f3055aea631ba162d4da60d901b02d772`
- Last Replit-validated at: partial manual validation at `e19098e`; kill switch and App Check enforced mode not yet validated
- Notes: `codex/init-003-production-gates` was reset from old Phase 3 base `515b7ec` onto fresh `origin/main` after PR #105 and PR #106, then rebased again after docs-only PR #108 merged. PR #102 was previously Replit-validated at `c952d13c9918356de2c5aaf31cb0dbde6f2d1824`, but this production-gates branch needs fresh Replit validation.
