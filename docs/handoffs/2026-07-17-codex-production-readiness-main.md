# 2026-07-17 `main` production-readiness regression

**Agent:** codex
**Branch:** `codex/production-readiness-2026-07-17`
**Date:** 2026-07-17
**Initiative:** INIT-001 / INIT-003
**INIT updated:** yes
**Resolves blocked handoff:** none

## Summary

`origin/main` at `2686117a202607f2e6b25b2f891d717372e0a6c4` is **not ready to publish**. Exact-head automation, Replit build/database checks, OAuth preflight, and the live provider-backed Chef It Up -> Prep Tray -> Ready Check -> Live Cooking path passed. The mobile release-batch run nevertheless found three release-blocking product defects: first-time setup actions are unreachable at common iPhone and Pixel viewport heights, returning Settings Pantry/Tools actions overlap the manual-entry control, and guest Finish speaks a false durable-history claim even though the visible guest toast is honest. Two lower-severity mobile semantics/layout issues were also recorded.

This pass deliberately used app-reported `390x844` iPhone-like and `412x915` Pixel-like viewports. It covered the documented production baseline, the changed-since-2026-06-22 runtime list, and user-perspective fit, reachability, persistence, failure, and honesty checks. A native unsaved-changes dialog later wedged the controlled signed-in Chrome session. The exact live cases that could not be completed after that harness failure are listed as explicit gaps; they are not counted as passes.

No production publish was performed. Production remains on the older Replit deployment marker `b462c9ba`, shown by Replit as published 27 days before this run. That marker could not be mapped to a local Git commit, so changed-since-last-production scope remains date-based from the recorded 2026-06-22 smoke.

## Candidate and environment provenance

| Item | Evidence |
|---|---|
| Candidate | Fresh `origin/main` at `2686117a202607f2e6b25b2f891d717372e0a6c4`; latest merge is PR #277, test-auth profile query scoping. |
| Local source | Clean temporary worktree at `/private/tmp/laica-prod-readiness-2026-07-17`; the user's existing dirty worktree and encrypted `.env` edit were not touched. |
| Replit source | Replit workspace was advanced from detached `7450a4...` to exact candidate `2686117a...`. Replit's package-installer-only `package.json` / lockfile drift was preserved in stash `codex-prod-readiness-preserve-replit-package-tool` before checkout. Replit Agent was not used. |
| Live candidate URL | Replit development preview for the exact candidate, not the published custom-domain deployment. |
| Production comparison | `https://cookwithlaica.com`; Replit deployment marker `b462c9ba`; production assets observed as `index-B0R7QUKA.js` and `index-BUH72YQq.css`. |
| Mobile viewports | App-reported `390x844` iPhone-like viewport and `412x915` Pixel-like viewport. Chrome's extension surface reported `devicePixelRatio: 0.8`, so outer-window compensation was used and the app-reported viewport is the authoritative measurement. |
| Signed-in state | Existing Google session in controlled Chrome; Google popup and guest-to-linked kitchen promotion completed. No credentials or secret values were printed. |

## Scope provenance

The matrix came from:

- [`docs/workflows/replit-validation-focus.md`](../workflows/replit-validation-focus.md): app load, auth/profile, scan, Chef It Up, Slop Bowl, Prep Tray, cooking/session, speech, feedback, mobile fixed/sticky controls, and post-publish smoke expectations.
- [`docs/production-validation-registry.md`](../production-validation-registry.md): last recorded production smoke and every registered changed-since-last-production case.
- [`initiatives/INIT-001-mobile-refresh.md`](../../initiatives/INIT-001-mobile-refresh.md): setup, Settings, Planning, imagery, Ready Check, Live Cooking, timer, transcript, speech, assistance, and Finish semantics.
- [`initiatives/INIT-003-anonymous-trial-and-account-upgrade.md`](../../initiatives/INIT-003-anonymous-trial-and-account-upgrade.md): real guest entry, guest persistence and linked-only boundaries, Google promotion, App Check, and durable-save honesty.
- The first-parent `origin/main` merge history after the date-based 2026-06-22 production baseline.

Runtime enhancements covered since that baseline include:

- Live Cooking recovery and honesty: PRs #236, #256, #258, #260, #264, #269, and #275.
- Settings and setup mobile work: PRs #237, #291, #295, and #296.
- Planning and recipe presentation: PRs #234 and #294.
- Shared mobile feedback: PR #293 toast swipe direction.
- Security/provider boundaries: PRs #244 and #245.
- Exact-head linked browser coverage and auth query isolation: PRs #276 and #277.
- Test-only, schema-health, dependency, workflow, and closeout merges were reviewed for release implications and did not add separate user-facing smoke cases.

Open PRs #274, #281, and #283 contain release-relevant prompt/runtime work but are not on `main` and are excluded from this candidate. They must be re-audited if merged before the next release candidate is cut.

## Executive result

| Lane | Result | Release meaning |
|---|---|---|
| Exact-head local gates | Pass | Install, typecheck, build, and all unit tests passed. |
| Exact-head GitHub gates | Pass | CI guest/linked E2E, audit, secret scan, CodeQL, and a manually triggered OAuth-start workflow passed for `2686117a...`. |
| Exact-head Replit gates | Pass | Install, typecheck, build, all unit tests, DB health, required secret-presence posture, app startup, provider-backed recipes/steps/image, and security rejection paths passed. |
| Core guest mobile journey | Pass with blocking findings | Full setup -> planning -> recipe -> Prep Tray -> Ready Check -> 11-step cooking -> Finish completed, but action reachability and Finish honesty defects block release. |
| Linked mobile journey | Partial | Google upgrade and profile load passed; controlled Chrome became blocked by its native unsaved-changes dialog before the remaining linked scan/History/Slop Bowl cases. |
| Production custom domain | Baseline only | Existing production app loaded; candidate was not published, so exact-candidate post-publish smoke was not possible or claimed. |
| Overall | **Not ready** | Fix blockers, add mobile geometry/hit-target regressions, rerun exact-head gates and the full failed/blocked live matrix, then publish only with explicit authorization. |

## Release-blocking findings

### P0 — First-time setup actions are unreachable on normal phone heights

Observed on exact `main`:

- At `390x844`, Pantry/Tools Back/Next measured `top 845.78px`, `bottom 893.78px`: the complete action rail is below the viewport.
- At `412x915`, Pantry Next measured `top 873.28px`, `bottom 921.28px`: it is clipped; Dietary Next measured `top 1085.78px`, `bottom 1133.78px`: it is completely unreachable.
- Attempted window/root scrolling left `window.scrollY` and root `scrollTop` at `0`. `html`, `body`, and `#root` are locked, so a user cannot recover by scrolling the page.
- The setup could be completed only through controlled DOM actions. That is test instrumentation, not evidence that a real mobile user can reach the buttons.

Source evidence explains the breakpoint hole: the bounded fixed setup shell and internal scroll-body sizing in [`client/src/index.css`](../../client/src/index.css) apply only under `@media (max-width: 480px) and (max-height: 790px)`. The required iPhone-like `390x844` and Pixel-like `412x915` viewports do not match that rule, so the shell grows past the locked root instead of keeping the action rail in view and scrolling `.setup-scroll-body`.

User impact: a new user can enter Pantry or Dietary setup and have no tappable way to continue. This is a launch-blocking onboarding failure and a regression against PR #291 / PR #295 acceptance.

Recommended fix:

1. Apply the bounded setup shell, phone frame, and internal `.setup-scroll-body` layout to all phone widths, independent of short-height compaction.
2. Keep only typography, camera-size, and spacing reductions behind the short-height condition.
3. Reserve the Back/Next rail inside `100dvh` plus safe-area clearance.
4. Add real rendered-geometry and hit-target E2E at both `390x844` and `412x915`. Assert the action center is inside the visual viewport, `elementFromPoint()` resolves to the expected control, and overflowing content scrolls inside `.setup-scroll-body`.

### P1 — Returning Settings Save bar covers `Enter manually`

Observed in linked Settings -> Kitchen Inventory -> both Pantry and Tools:

- The strict `4:5` camera frame itself passed at approximately `275.8x344.7`.
- At app-reported iPhone `390x844`, `Enter manually` measured `top 683.66px`, `bottom 739.66px`.
- The sticky Save action measured `top 703.76px`, `bottom 751.76px`.
- `elementFromPoint()` over the manual-entry control returned `Save pantry` / `Save tools`, proving this is an input-blocking hit-target overlap, not just a visual collision.
- Scrolling farther exposed the hidden control, but the initial composition invites the user to tap a visible control that executes a different action.

User impact: a Pantry/Tools user can accidentally press Save while trying to enter an item. Both the visual hierarchy and actual hit target are wrong.

Recommended fix:

1. Give the scroll content explicit bottom clearance equal to the sticky action rail plus mobile safe area, or keep the action rail in normal layout flow.
2. Use one owner for bottom-nav/action clearance; avoid stacking independent padding and sticky offsets.
3. Add the same `elementFromPoint()` and in-viewport actionable-box assertions for Pantry and Tools at `390x844` and `412x915`.

### P1 — Guest Finish falsely claims cooking history was saved

Observed after completing all 11 provider-generated steps as a guest:

- Visible toast: `Sign up before saving cooking history.` — correct.
- Spoken/transcript assistant response: `Nice, dinner's ready. Saved to your cooking history. Pantry cleanup comes next.` — false for a guest.
- Guest Pantry remained unchanged after Finish, which confirms no durable completion/history write should be implied.

Source evidence in [`client/src/components/cooking/live-cooking.tsx`](../../client/src/components/cooking/live-cooking.tsx): `completeCookingSession()` correctly branches to the guest-safe toast and returns, but `nextStep()` unconditionally sets the linked completion transcript before calling it. The unit expectation in [`tests/unit/live-cooking-guest-session.test.tsx`](../../tests/unit/live-cooking-guest-session.test.tsx) currently codifies the linked wording for the guest flow, so green CI does not protect the product boundary.

User impact: Laica gives two contradictory completion messages and promises durable history that the guest does not have. This violates INIT-003's linked-only durability model and the Finish-honesty acceptance from PR #236.

Recommended fix:

1. Derive one completion message from guest/linked mode and use it for transcript, speech, and toast.
2. Change the guest unit assertion to require sign-up-before-history wording and explicitly reject `Saved to your cooking history`.
3. Add a linked assertion that retains the saved-history copy only after the completion mutation succeeds.

## Additional findings

### P2 — Settings root has unnecessary blank/inert mobile scroll

At `390x844`, Settings root measured about `1020px` document height even without content that needed that space. The returning main padding and parent bottom padding compound, leaving a large blank scroll tail. It did not block the tested controls, but it makes the page feel unfinished and weakens confidence in sticky-control geometry.

Suggested fix: consolidate bottom clearance into the shared returning shell and verify no blank document tail at phone viewports.

### P2 — Reset timer relabels a fresh timer as `Resume timer`

After starting a 30-second timer and pressing Reset, the timer returned to the full duration and paused state, but the primary action read `Resume timer`. Functionally it restarts correctly; semantically, Reset should return the control to `Start 30 second timer`. The current label logic treats every positive paused value as resumable.

Suggested fix: track `hasTimerStarted` independently from the remaining seconds, clear it on Reset/step change, and cover Start -> Reset -> Start plus Pause -> Resume in focused tests.

## Automated evidence

### Local exact-head candidate

| Command | Source provenance | Observed result | Negative scope |
|---|---|---|---|
| `npm ci` | Clean candidate worktree, lockfile at `2686117a...` | Pass; 1,114 packages audited, 0 vulnerabilities. | Does not exercise runtime secrets or Replit services. |
| `npm run check` | Same exact head | Pass. | Compile/type evidence only. |
| `npm run build` | Same exact head | Pass. Warnings: stale Browserslist data, Firebase mixed static/dynamic import, and chunk over 500 kB. Output included about 904.63 kB JS and 161.64 kB CSS. | Performance budget was not defined as a release gate; warnings remain non-blocking signal. |
| `npm run test:unit` | Same exact head | Pass: 50 files / 389 tests. | DOM-unit coverage did not catch the phone-height layout defects; one guest Finish test protects the wrong wording. |
| `npm run check:oauth` without decrypted runtime env | Same exact head | Skipped by the command. | Not counted as a pass; exact-head GitHub OAuth workflow below is the evidence. |

### GitHub exact-head candidate

- CI run `29614871358` passed at `2686117a...`, including `unit` and `e2e_guest_smoke`.
- The E2E job provisioned a disposable Neon schema, pushed the schema, passed `db:health`, installed Chromium, ran guest plus linked dev-auth browser coverage, and cleaned up the schema branch.
- Dependency audit, secret scan, and CodeQL passed at the same head.
- Manually triggered OAuth workflow run `29617868025` passed `google_oauth_start` at the same head.
- CI currently configures only Playwright `Desktop Chrome`. Local Playwright configuration defines Pixel 5 and iPhone 12 projects, but `package.json` and CI select only `--project=chromium`. This is why exact-head E2E stayed green while common-phone setup/actions failed.

### Replit exact-head candidate

| Check | Observed result |
|---|---|
| `npm ci` | Pass; 0 vulnerabilities. |
| `npm run check` | Pass. |
| `npm run build` | Pass; same warning classes as local. Replit output included about 911.63 kB JS and 161.64 kB CSS. |
| `npm run test:unit` | Pass: 50 files / 389 tests. |
| `npm run db:health` | Pass against the Replit database. |
| Masked env-presence check | Required database, ElevenLabs, OpenAI, admin, Firebase client/service-account, and App Check keys were `set`; `FIREBASE_APP_CHECK_ENFORCED=true`; `ANONYMOUS_AUTH_DISABLED=false`; `RUNTIME=workspace`. `FIREBASE_PROJECT_ID` and `BASE64` were missing but the configured service-account/client paths were sufficient for the tested runtime. No values were printed. |
| Admin rejection | Missing and synthetic-invalid `X-Admin-Secret` returned `403` with `Cache-Control: no-store, max-age=0`, `Pragma: no-cache`, `Expires: 0`, and `Vary: X-Admin-Secret`. |
| Dev auth exposure | `/api/dev/auth/linked-token` returned `404`, confirming the workspace did not expose the CI-only dev-auth path. |

## Live regression matrix

### Public entry, guest setup, and persistence

| Case | Result | Evidence / user perspective |
|---|---|---|
| Production custom-domain load | Pass for existing deployment | Landing page loaded at iPhone-like viewport, primary CTAs measured 56px, carousel advanced, and console stayed clean. This is not candidate evidence because the candidate was not published. |
| Candidate guest entry | Pass | Public CTA created a real anonymous session and entered setup. |
| Setup Pantry manual path | Functional pass / layout fail | Five synthetic pantry items could be entered and saved through controlled actions; normal mobile Back/Next reachability fails as described above. |
| Optional Tools | Functional pass / layout fail | Optional path worked; same action-rail reachability defect applies. |
| Cooking skill select-then-Next (PR #296) | Pass | Next disabled before selection; selecting Beginner stayed on the same page and enabled Next; Next advanced to Dietary. |
| Dietary / no restrictions | Functional pass / layout fail | Selection worked; Dietary Next is fully below both tested phone viewports. |
| Setup completion | Pass | Completion confirmation appeared and Planning loaded. |
| Guest setup persistence | Pass | Reload restored completed guest setup and Pantry. |
| Guest Slop Bowl boundary | Pass | Slop It Up remained linked-only and showed sign-up guidance. |
| Guest History boundary | Pass | History remained disabled/linked-only. |

### Planning, recipe, imagery, and feedback

| Case | Result | Evidence / user perspective |
|---|---|---|
| Chef It Up time screen (PR #294) | Pass | At `390x844`, title was centered, clear of Back, and the stack did not feel bottom-biased. |
| Provider recipe suggestions | Pass | Real provider returned exactly three suggestions. |
| Ticket heading | Pass | Heading read `Recipe suggestions`. |
| Ticket ingredient chips (PR #234) | Pass | Pantry-fact chips were distinct from optional extras; no mobile overflow was observed. |
| Prep Tray selected image | Pass | Real selected image resolved through `/api/recipe-images/...`, rendered at 1024x1024 source resolution, filled the mobile hero with `object-fit: cover`, and did not bleed back into Ticket Pass. |
| Feedback write | Pass | Submitted one synthetic record: `Production readiness test 2026-07-17 — synthetic feedback record; safe to delete.` Dialog closed without an error. The row may be deleted during cleanup. |
| Guest Settings local persistence | Pass | A synthetic guest item saved and survived reload, then was removed before the run moved on. |
| Scan tips | Pass | Guidance was readable and controls fit. |
| Camera start/stop | Harness-limited | Camera entered `Starting camera…`; the in-app browser exposed no permission surface. Turning it off recovered safely. No product failure is claimed from this runner limitation. |

### Ready Check and Live Cooking

| Case | Result | Evidence / user perspective |
|---|---|---|
| Ready Check (PR #258) | Pass | Optional missing context was shown without blocking; one clear `Start cooking` action; bottom nav fit. |
| Provider-generated guide | Pass | Real provider returned 11 nonblank, non-placeholder steps with action labels. |
| Compact warm cockpit (PRs #260/#264) | Pass | Current step, preview rail, cues, CC, and command bar fit at `390x844`; visual hierarchy remained glanceable. |
| Preview rail follow (PR #269) | Pass | Rail followed as the run traversed all 11 steps. |
| Explicit-start timer | Pass with P2 label issue | A real 30-second step supported Start, Pause, Resume, Reset, completion, visible `Time's up`, and Restart. Reset wording issue recorded above. |
| CC / transcript preference (PR #245) | Pass | CC showed and hid the transcript; reload restored step 5 and the captions preference. |
| Cooking-session restore | Pass for guest-local state | Reload restored the active guide and current step. |
| Repeat step / speech route | Provider route pass; audible playback unverified | Repeat updated transcript. The in-app browser then reported unavailable `AudioContext` and duplicate-synthesis throttling because repeat overlapped the welcome request. Since synthesis is awaited before client playback, the provider route completed; this runner did not provide reliable audible-output evidence. |
| Finish | **Fail** | Guest visible toast was honest, but transcript/speech made the false saved-history claim. Pantry remained unchanged. |
| Back to Planning | Pass | Returned cleanly and retained the five-item guest Pantry. |

### Shared mobile interactions

| Case | Result | Evidence |
|---|---|---|
| Toast swipe right | Pass | Dismissed in the right direction. |
| Toast swipe left | Pass | Dismissed with negative-X exit. |
| Toast swipe up | Pass | Dismissed with negative-Y exit. |
| Toast swipe down | Pass | Toast remained open. |
| Pixel viewport | Pass for toast / fail for setup reachability | Toast behavior passed at `412x915`; setup Dietary action remained unreachable. |

### Google promotion and linked state

| Case | Result | Evidence / side effect |
|---|---|---|
| Guest -> Google link | Pass | Existing signed-in Google popup completed. The confirmation step was understandable and the app showed `Account successfully connected and signed in. Your kitchen is saved.` |
| Linked profile/session restore | Pass | Linked Planning showed 31 pantry items and reload preserved the linked session. |
| Promotion import boundary | Pass with cleanup note | The smoke intentionally exercised setup import. Because the UI did not expose safe item-level provenance after the merge, the imported-vs-existing pantry delta was not destructively rolled back. Future cleanup should inspect rather than guess. |
| Settings root | Pass with P2 blank-scroll finding | Hub loaded; persistent bottom navigation remained present. |
| Settings Pantry/Tools frame | Frame pass / action overlap fail | Both strict `4:5` camera frames passed; Save bar covered `Enter manually` on both lists. |
| Unsaved-changes reminder (PR #237) | Pass, then harness blocked | Adding an unsaved synthetic Tools draft and pressing Back produced the expected native confirmation. The draft was not saved. The controlled Chrome backend then became wedged on that native dialog. |

## Explicit gaps and smallest next actions

The following cases are **not passes**. They were prevented by the controlled signed-in Chrome session becoming stuck on its native unsaved-changes confirmation. Replit shell and the guest in-app browser remained usable, so all safe independent testing continued before this report was closed.

| Missing direct live case | Existing indirect evidence | Smallest next action after fixes |
|---|---|---|
| Exact-head Pantry image upload/vision scan | 2026-06-22 production scan passed; exact-head unit/CI/provider and Replit env/DB gates passed. | Clear the native dialog, upload the repository's synthetic kitchen image in linked Settings, verify review chips, then remove synthetic inventory additions. |
| Linked Slop Bowl generation and feedback | Guest gate passed; route/unit coverage passed. | Run one linked live generation, reject/accept as appropriate, and enter Prep Tray/Ready Check without persisting unwanted user data. |
| Linked History expand/delete/undo | Unit and historical production coverage only. | Create a clearly synthetic linked cook, verify list/expand/delete/undo, and remove it. Do not delete an existing user cook. |
| Live microphone transcription and assistance-failure panel | PR #275 exact-head unit/E2E and environment presence; current step preservation was inspected in code. | Deny microphone once, then allow one real question; verify the separate failure panel, retry clearing, current-step stability, transcription, and no technical text in guidance speech. |
| Valid-secret and throttled admin path | Missing/invalid live `403` + no-cache passed; exact-head route tests passed. | From Replit shell, send only status/header probes with masked secret use. Do not print payloads or values. Confirm valid access, controlled throttle, recovery, and no-cache headers. |
| Induced cooking-step provider failure/retry/basic backup | Exact-head unit/E2E recovery coverage passed; normal provider path passed live. | Use a controlled non-production failure hook or intercepted candidate-preview response; verify retry and explicit basic backup without corrupting user data. |
| Exact-candidate post-publish custom-domain smoke | Candidate was not published and no publish authorization was inferred. | After blockers are fixed and Wilson authorizes publish, record the published SHA/build marker and rerun app load, auth, scan, recipes, Slop Bowl, imagery, cooking, speech, feedback, and focused mobile cases on the custom domain. |

The native dialog itself is not an application failure: the unsaved-changes guard worked. It is a browser-control limitation. Clearing the dialog is also required before the unsaved synthetic Tools draft can be confirmed discarded in that browser tab.

## Recommended repair and retest order

1. Fix the setup phone-height containment/reachability defect and add iPhone/Pixel geometry plus hit-target E2E.
2. Fix returning Settings action/manual-entry overlap and consolidate bottom clearance; add Pantry/Tools geometry plus hit-target E2E.
3. Fix guest Finish message derivation and correct the guest unit assertion; retain a linked success-after-mutation assertion.
4. Fix or explicitly accept the timer Reset wording and Settings blank-scroll tail.
5. Run `npm ci`, `npm run check`, `npm run build`, `npm run test:unit`, and the full exact-head GitHub E2E/security/OAuth gates.
6. Repeat the complete mobile matrix at app-reported `390x844` and `412x915`, including real taps rather than DOM-forced actions.
7. Complete every explicit linked/provider/admin gap above in Replit without using Replit Agent.
8. Only after a clean report, publish with explicit authorization and run the custom-domain post-publish smoke at the exact published marker.

## Changes

- Added this all-in-one production-readiness report.
- Updated the production validation registry with the exact candidate, deployed marker, verdict, blockers, and rerun requirements.
- Updated INIT-001 with the mobile regression findings and release resume point.
- Updated INIT-003 with the guest/linked validation result and Finish-honesty blocker.

No runtime code was changed. The user asked for testing, a report, and fix recommendations; implementation remains a separate branch/PR after prioritization.

## Impact on other agents

- Do not publish `2686117a...` as the next production build.
- Start mobile layout repair from the measured `390x844` and `412x915` failures, not from desktop or short-phone-only CSS assumptions.
- Treat green desktop E2E as necessary but insufficient for mobile release readiness until at least the setup and Settings critical paths run in CI mobile projects.
- Read this report, INIT-001, INIT-003, and the production validation registry before resuming the release batch.
- Preserve the Replit package-tool stash named above; it predates the exact-head test checkout and was not authored as part of this work.

## Open items

- Runtime fixes for the three blockers and two P2 findings.
- Completion of the explicit signed/provider/admin gaps after the native dialog is cleared.
- Safe cleanup review for the synthetic feedback row and guest-to-linked imported pantry delta.
- Exact-candidate post-publish smoke after explicit publish authorization.

## Verification

Documentation verification for this branch:

- `git diff --check`
- Link/path review against the current repository tree
- Branch pushed to `origin` so the report is visible to other agents

Runtime verification and its negative scope are recorded in the Automated evidence and Live regression matrix sections above. This report does not claim that the candidate was published or that blocked direct-live cases passed through indirect evidence.
