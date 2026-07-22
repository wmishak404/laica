# Post-publish production regression — `cookwithlaica.com`

**Date:** 2026-07-22
**Agent:** Codex
**Branch:** `codex/post-publish-production-regression-2026-07-22`
**Production target:** `https://cookwithlaica.com`
**Source `origin/main`:** `742694d9d209dba04674ce7188319d7f449c4a6e`
**Verdict:** **BLOCKED — product regression passed broadly, mandatory admin production access/security failed**

## Overall view

The newly published custom-domain build is stable and the broad product regression passed across guest and linked flows, live providers, persistence, mobile geometry, and cleanup. Fresh production evidence also confirms the EFF-033 returning dock and Guest Finish fixes. The deployment cannot be called release-complete because the trusted admin credential behaves differently between the preview and custom-domain environments, and current `main` has lost the required admin-specific limiter and timing-safe credential comparison. EFF-036 owns both blocker tracks. Operational request details are intentionally omitted from this public report; no secret value was captured.

The accepted setup reachability exception remains real in production and is now EFF-035, an immediate P1 patch. EFF-034's timer and Settings findings also remain real P2s. A new P2 Feedback length-contract mismatch is recorded as EFF-037. No product fix, secret change, publish, rollback, or merge was performed.

## Deployment and source provenance

- Fresh `git fetch origin` established current `origin/main` at `742694d9d209dba04674ce7188319d7f449c4a6e` (`Close Guest Finish merge documentation (#332)`).
- The pre-publish evidence branch ended at documentation commit `1923ea0021b1e186a9e0db2df96c74a4d18af9d8`; its runtime base was `742694d9`. It is evidence provenance, not a different production runtime.
- Cache-busted root probes returned one stable new asset set. Exact response and asset fingerprints are omitted from this public report. Old production asset URLs returned the current SPA HTML, so no mixed old/new propagation was observed.
- A clean `742694d9` build produced CSS byte-identical to production. Production JavaScript contains the `742694d9` Guest Finish and EFF-033 runtime markers; build-time environment substitution prevents a byte-identical JavaScript claim.
- Replit showed the workspace on `main` at `742694d` and the production status as published on 2026-07-22. Neither the app nor current deployment-status surface exposed an exact new deployment SHA/marker.

## Evidence method and provenance

- Product behavior: real custom domain in controlled Chrome plus an isolated in-app guest session for the repo-owned synthetic vision upload.
- Mobile sizes: app-reported `390x844`, `412x915`, and focused breakpoint comparison at `375x667`.
- Provider behavior: live production recipe suggestions, recipe image, cooking-guide generation, Slop Bowl, TTS route/UI Repeat, and vision analysis.
- Production admin credential comparison: trusted Replit shell using the environment-injected credential without printing or persisting its value. The command, protected endpoint, preview hostname, and workspace metadata are omitted from this public report. Replit Agent was not used.
- HTTP/security/cache: read-only `curl` probes against the custom domain plus source/build inspection.
- Source provenance: current `main`, PR #244 commit `3976a63a`, PR #246 merge `690fe2cdb614fa6e208b5d5bad822bf8ab920bf2`, current tests, and current route/middleware registration.
- Destructive failure cases were not induced against shared production provider or database state. Deterministic exact-head unit/E2E evidence remains the appropriate lane for linked persistence failure and provider-recovery injection.

## Production regression matrix

| Surface | Fresh production result | Evidence / negative scope |
|---|---|---|
| HTTPS and custom-domain load | Pass | Stable new asset set, valid certificate, security headers, no mixed publish propagation. |
| Public landing | Pass | Responsive `390x844` landing, guest and Google entry points, carousel content. [Screenshot](../assets/production-regression/2026-07-22/production-landing-390x844.jpg). |
| Guest start and first-time setup | Partial / accepted exception | Guest auth and setup state worked; Pantry/Tools action reachability reproduced EFF-035 at `390x844` and `412x915`. |
| Pantry manual entry | Pass | Added `rice, eggs, soy sauce`; setup summary and Planning used three items. |
| Tools manual entry | Pass | Added `skillet, saucepan`; setup summary retained two tools. |
| Pantry image upload / vision | Pass | Repo-owned synthetic kitchen image produced `beef patties`, `uncooked rice`, `bbq sauce`, and `eggs`; success toast and review chips were present, with no console error. |
| Physical camera access/capture | Human/hardware boundary | Not objectively exercised on the production custom domain. Wilson's earlier main-branch physical camera/correct-recognition evidence remains bounded context, not a production pass. |
| Cooking Skill | Pass | `Next` disabled before choice; `Beginner` selection did not auto-advance and enabled `Next`. Phase 2.1 stale wording was corrected. |
| Dietary setup / confirmation | Pass | `No restrictions`; summary correctly showed Pantry 3, Tools 2, beginner, and no restrictions. |
| Guest planning and Slop boundary | Pass | Chef It Up available; guest Slop showed sign-up boundary and did not enter a bowl; guest History remained disabled. |
| Chef It Up time/cuisine | Pass | `30 minutes`, no cuisine preference; title/buttons/nav fit both mobile sizes. [Screenshot](../assets/production-regression/2026-07-22/production-chef-time-390x844.jpg). |
| Provider suggestions | Pass | Live production returned three pantry-grounded suggestions: `Simple Soy Sauce Fried Rice`, `Rice & Omelet Bowl`, and `Asian-Style Egg Rice Soup`. |
| Ticket Pass restore | Pass | Reload restored the exact three suggestions and selection structure. [Screenshot](../assets/production-regression/2026-07-22/production-ticket-pass-390x844.jpg). |
| Prep Tray imagery | Pass | Selected fried-rice image resolved from `/api/recipe-images/...`, filled the mobile hero, and did not bleed back onto Ticket Pass. [Screenshot](../assets/production-regression/2026-07-22/production-prep-tray-image-390x844.jpg). |
| Ready Check | Pass | Ingredients/equipment/heat-off copy and Start cooking were visible and usable; Back restored Prep Tray instead of resetting. [Screenshot](../assets/production-regression/2026-07-22/production-ready-check-390x844.jpg). |
| Live Cooking | Pass | Live provider generated nine concrete steps; compact step rail, cues, previous/next, captions, and command bar fit. [Screenshot](../assets/production-regression/2026-07-22/production-live-cooking-step1-390x844.jpg). |
| Timer | Partial / accepted P2 | Start/Pause worked. Reset returned the full `0:12:00` readout but left `Resume timer`; EFF-034 reproduced. |
| Session/captions restore | Pass | Reload on Step 2 restored Step 2 of 9, open captions, timer value, and cooking state. |
| Repeat/TTS route and transcript | Pass with audio boundary | Repeat updated the transcript to the exact step instruction without console failure. Audible output was not objectively verified; Wilson's earlier main-branch audible evidence is not promoted to production. |
| Ask-a-question / microphone state | Partial | Control entered `Listening...` and canceled back to `Ask a question` without console error. No recognized spoken utterance was supplied, so spoken-input accuracy remains unclaimed. |
| Guest Finish | Pass | Transcript and toast both said `Dinner's ready. Sign up to save this session to your cooking history.` No saved-History claim. Fit remained usable at both target sizes. [390](../assets/production-regression/2026-07-22/production-guest-finish-390x844.jpg), [412](../assets/production-regression/2026-07-22/production-guest-finish-412x915.jpg). |
| Guest Pantry/Tools persistence | Pass and cleaned | Unique synthetic Pantry and Tools items survived reload; both were removed, saved, and reload-confirmed absent. |
| Google promotion / existing account | Pass | Account chooser, explicit import consent, success confirmation, and linked kitchen load completed. Existing linked data was not overwritten. |
| Auth/session restore and sign-out | Pass | Linked Pantry write survived reload; final sign-out returned to public landing. |
| Returning Settings Pantry/Tools | Pass | EFF-033 remained fixed. Pantry/Tools used a bounded internal scroller (`610/840px`, true bottom `230.5px`), document stayed viewport-sized, dock remained in-flow above Cook/Menu, and centers belonged to Settings/Save. [Pantry](../assets/production-regression/2026-07-22/production-eff033-returning-pantry-dock-390x844.jpg), [Tools](../assets/production-regression/2026-07-22/production-eff033-returning-tools-dock-390x844.jpg). |
| Settings root | Accepted P2 | `390x844` document height `1020px` and `412x915` height `1091px` despite last content near `480px`; EFF-034 blank tail reproduced. |
| Keyboard/focus | Bounded pass | At `375x667`, focused Pantry input remained visible at `272–324px`, while the dock stayed at `546–594px`. Desktop emulation cannot claim physical mobile keyboard/browser-chrome behavior; EFF-035 retains real-device scope. |
| Linked Slop Bowl | Pass | Live production generated `Spicy Gochujang Beef & Arugula Noodle Bowl`, Ready Check, and a 13-step guide. Guest access remained gated. Sparse three-item linked threshold was not mutated against the shared 45-item account. |
| Linked Finish / History | Pass and cleaned | Finish claimed save only after persistence; exact new History row appeared and was deleted. |
| Feedback short write | Pass; cleanup unavailable | Labeled row `Codex production regression 2026-07-22: short feedback submission probe; safe to delete.` succeeded. No user-facing delete path exists. |
| Feedback upper-length boundary | Fail / P2 | A 289-character draft was accepted by the form, rejected by the server, and shown as generic transient failure. EFF-037. |
| Toast gestures | Pass | Right, left, and up dismissed; down did not. Toasts temporarily own their visible top hit area and can be dismissed normally. |
| Error/recovery surfaces | Bounded | No unsafe provider/DB failure was induced. The existing deterministic exact-head lane remains evidence for linked Finish failure/retry and cooking-step failure presentation; production normal-path recovery via reload/back passed. |
| Admin missing/invalid | Pass | Both were denied with the required no-cache and response-variance controls. Exact operational headers are omitted from this public report. |
| Admin valid credential | **Fail / blocker** | The trusted credential succeeded in preview but was denied by the custom domain. The secret value was never printed or persisted. |
| Admin throttle/hardening | **Fail / blocker** | Production exposed only the broad API policy; current source does not mount the dedicated limiter and uses direct string comparison. No live flood was performed. |

## New blocker — EFF-036

### Observed facts

1. A masked, trusted Replit-shell probe using the configured environment credential succeeded in preview but was denied by the custom domain. The endpoint, preview hostname, request command, and exact response mapping are intentionally omitted from this public report.
2. Missing and invalid custom-domain probes were both denied with the required no-cache and response-variance controls.
3. Production advertised only the broad API rate-limit policy.
4. PR #244 commit `3976a63a` introduced:
   - constant-time admin secret comparison,
   - mounted `adminIpLimit`,
   - focused threshold-boundary coverage.
5. PR #246 merge `690fe2cdb614fa6e208b5d5bad822bf8ab920bf2` later removed that middleware and comparison while adding admin/eval report functionality. `adminIpLimit` remains exported but unused, and current tests no longer assert its threshold.

### Severity and release interpretation

**P0 / release blocker.** Normal product use remains available, so this is not a public-site outage. It still blocks release acceptance because the explicitly mandatory post-deploy admin gate cannot authorize the trusted operator secret, and the protected surface is missing its dedicated abuse control and timing-safe comparison. The public invalid boundary passing does not make authorized operations or brute-force resistance acceptable.

### Smallest principled correction

1. Reconcile the published deployment secret with the trusted Replit secret source without displaying or logging the value.
2. Restore constant-time comparison and mount the dedicated limiter while preserving PR #246 eval-report functionality and all no-cache headers.
3. Restore focused missing/invalid/valid/threshold/reset/no-cache coverage without publishing production threshold or request details.
4. With Wilson's explicit publish authority, republish and rerun the safe custom-domain admin matrix from the trusted process. Do not use browser-visible secret headers or live request flooding.

## Release and rollback interpretation

- Mark the current deployment **blocked / not release-complete** until EFF-036 passes on the custom domain.
- The public product regression, missing/invalid admin denial, and no-cache boundary passed; no production data corruption or broad user outage was observed. The generic API limiter is still present, although it is not an acceptable substitute for dedicated admin hardening.
- Do not perform a blind rollback from this evidence. No earlier deployment was proven in this run to contain both the current product fixes and a working current admin secret plus dedicated hardening, so rollback could restore stale behavior without resolving the configuration problem.
- Preferred recovery is a forward, minimal configuration/code correction followed by an explicitly authorized republish and exact admin resmoke. If admin isolation or secret reconciliation cannot be completed promptly, Wilson should make the rollback/route-disable decision with a verified target rather than treating this report as rollback authority.
- No rollback, route disablement, secret mutation, republish, or production fix was performed.

## New P2 — EFF-037

The UI accepted 289 characters and enabled Submit; the server's 280-character schema rejected the request, while the client contract allows 300. The generic `Try again later` copy incorrectly implies a transient outage. The smallest fix is one shared canonical maximum plus boundary-specific client/server validation and actionable copy. Short production feedback succeeded immediately afterward, so this is not a general write-path outage.

[Production screenshot](../assets/production-regression/2026-07-22/production-feedback-length-mismatch-390x844.jpg)

## Accepted production exceptions

### EFF-035 — P1 immediate patch

- `390x844`: Pantry and Tools Back/Next began at approximately `845.78px`; `documentElement` and `.setup-scroll-body` had no scroll range.
- `412x915`: Pantry actions ended at approximately `921.28px`, six pixels beyond the viewport.
- `375x667`: expanded manual entry produced real `.setup-scroll-body` overflow.

This is height/overflow/safe-area behavior, not a named-device or camera-only bug. The current release exception remains accepted, but production does not count as a pass for setup action reachability.

[Pantry 390](../assets/production-regression/2026-07-22/production-eff035-pantry-unreachable-390x844.jpg), [Tools 390](../assets/production-regression/2026-07-22/production-eff035-tools-unreachable-390x844.jpg), [Pantry 412](../assets/production-regression/2026-07-22/production-eff035-pantry-412x915.jpg)

### EFF-034 — P2 cleanup

- Reset timer readout was correct, action semantics were not.
- Settings root retained a large inert tail at both target sizes.

[Timer](../assets/production-regression/2026-07-22/production-eff034-timer-reset-390x844.jpg), [Settings 390](../assets/production-regression/2026-07-22/production-eff034-settings-blank-scroll-390x844.jpg), [Settings 412](../assets/production-regression/2026-07-22/production-eff034-settings-blank-scroll-412x915.jpg)

## HTTP, security, cache, and routing observations

- HTTPS root: `200`; HTTP redirects `301` to the HTTPS custom domain.
- Apex TLS certificate was valid for the test date; `www.cookwithlaica.com` did not resolve and is not claimed as supported.
- CSP, `frame-ancestors 'none'`, HSTS, content-type sniffing protection, referrer policy, and related Helmet headers were present. Edge and app both emitted HSTS.
- Root and hashed assets used `private, max-age=0` with ETag/Last-Modified, prioritizing freshness over long-lived immutable caching.
- No service-worker registration exists in the production bundle. `/sw.js` and `/service-worker.js` resolve to SPA HTML rather than a worker.
- `/api/version`, `/health`, old asset URLs, and other unmatched paths can resolve to the SPA HTML with `200`. This is recorded as catch-all routing behavior; no version endpoint is claimed.
- One production console error occurred during the existing-account promotion: Firebase `auth/credential-already-in-use`. Source confirms this is the expected branch that opens explicit import consent; the visible flow recovered and completed. Treat it as recoverable diagnostic noise, not a failed promotion.

## Data changes and cleanup

- Guest Pantry `codex regression mint`: added, reload-confirmed, removed, saved, and reload-confirmed absent.
- Guest Tools `codex regression spatula`: added, reload-confirmed, removed, and saved.
- Linked Pantry `codex linked regression mint`: added, reload-confirmed, removed, saved, and reload-confirmed absent.
- Linked History row `Spicy Gochujang Beef & Arugula Noodle Bowl`: created by the test and deleted immediately.
- Isolated guest vision detections: cleared before closing the session.
- Google account: signed out at the end of linked testing.
- Feedback: one labeled successful row remains because the product exposes no delete path; owner may delete `Codex production regression 2026-07-22: short feedback submission probe; safe to delete.` from the backing store.
- No shared pantry ingredient was consumed/removed, no existing History row was changed, and no provider/DB failure was induced.

## Documentation routing and ownership

- `docs/production-validation-registry.md`: new production baseline, deployment fingerprint, verdict, negative scope, and cleanup.
- `initiatives/INIT-001-mobile-refresh.md`: fresh EFF-033/product matrix signal; EFF-035/EFF-034/EFF-037 routing.
- `initiatives/INIT-003-anonymous-trial-and-account-upgrade.md`: fresh guest/linked/promotion/History boundaries.
- EFF-032: resolved as superseded historical evidence, not implemented.
- EFF-034: fresh production reproduction appended.
- EFF-035: active immediate viewport-resilience patch added from accepted pre-publish decision plus fresh production signal.
- EFF-036: new standalone production admin blocker after ownership audit found no INIT/active Effort owner.
- EFF-037: new standalone Feedback contract P2 after ownership audit found no INIT/active Effort owner.
- Phase 2.1: stale Cooking Skill auto-advance wording corrected to merged select-then-Next behavior.

## Evidence-branch validation

- `npm ci` — passed; lockfile installation reported the repository's existing one low and one moderate audit finding without changing manifests or the lockfile.
- `npm run check` — passed (`tsc` plus UI ESLint).
- `npm run build` — passed; retained existing Browserslist-age, Firebase mixed-import, and chunk-size warnings.
- `git diff --check` — passed.
- Automated E2E was not rerun for this evidence-only docs/assets branch. It contains no runtime change; the direct custom-domain matrix above is the production evidence, and any later implementation/publish must run the exact-head E2E gate required by `testing-and-acceptance.md`.

## Required next actions

1. **EFF-036 first:** diagnose production secret drift and restore admin hardening on a fresh implementation branch; obtain Wilson's explicit publish authority; rerun the secret-safe admin production matrix.
2. **EFF-035 immediately after/parallel-safe:** implement the generalized setup viewport patch with exact-head mobile geometry and real-device browser/keyboard/safe-area evidence.
3. Keep EFF-034 and EFF-037 as non-blocking P2 follow-up.
4. Owner cleanup: delete the single labeled production feedback row if desired.
5. Do not merge, republish, or call the release complete from this evidence-only branch without Wilson's explicit authority.
