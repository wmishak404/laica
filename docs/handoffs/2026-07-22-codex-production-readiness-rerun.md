# 2026-07-22 `main` production-readiness regression rerun

**Agent:** codex
**Branch:** `codex/final-production-regression-2026-07-22`
**Date:** 2026-07-22
**Initiative:** INIT-001 / INIT-003
**INIT updated:** yes
**Resolves blocked handoff:** none

## Summary

Fresh `origin/main` at `742694d9d209dba04674ce7188319d7f449c4a6e` passed exact-head local, GitHub, Replit build/database, core guest, provider, mobile, EFF-033, and guest Finish checks. This run did not inherit the recent fixes as assumed passes: returning Settings Pantry/Tools and guest Finish were exercised again on the combined current candidate at app-reported `390x844` and `412x915`. Both corrected behaviors passed.

No new product defect was found. The two accepted non-blocking findings remain reproducible: the first-time Pantry/Tools action rail is outside an unscrollable `390x844` composition, and EFF-034's Settings hub has a large blank mobile scroll tail. The rerun added useful setup-breakpoint evidence: at `375x667`, `.setup-scroll-body` does have scroll range and normal control interaction scrolls it, while at `390x844` and `412x915` the same page reports no scroll owner. That reconciles Wilson's successful scrolling with the controlled no-scroll reproduction instead of treating either as universal. EFF-035 now owns the generalized setup correction and preserves EFF-032 as superseded historical evidence.

The fresh real-Google linked matrix was recovered and completed rather than inferred from automation. Google upgrade reached Wilson's linked profile; linked Pantry and Tools persisted across reload and cleanup; Slop Bowl generated; Ticket Pass restored the same three provider suggestions after reload; a 14-step linked cook finished with saved-History wording; and the resulting History row appeared and was then removed. The browser logged Firebase's expected `auth/credential-already-in-use` collision while converting the anonymous session to Wilson's already-linked account, but the visible recovery completed with `Account successfully connected and signed in. Your kitchen is saved.` and authenticated API-backed behavior passed. A linked local-file upload could not be repeated because Chrome's ChatGPT extension lacks `Allow access to file URLs`; this is a browser-control permission, not a LAICA failure, and the same exact preview's real vision route already passed through the guest browser.

Wilson reviewed the remaining evidence boundaries and accepted the candidate as ready for production. Valid-secret and controlled-throttle admin behavior is a mandatory post-deploy smoke, not a pre-publish blocker: the exact code-level success/throttle guardrails have deterministic coverage, while missing/invalid live rejection and no-cache passed against Replit. Wilson subsequently confirmed audible TTS works on `main`; one real spoken microphone question remains a separate manual check. The viewport-height issue is an explicit release exception routed to EFF-035 as an immediate post-production structural patch. Production was not published by this task.

The controlled Codex rerun excluded flows that require live camera access, while image upload/vision passed with a repository-owned synthetic kitchen image. Wilson subsequently exercised the real camera path on `main`: camera access/capture worked and ingredients were recognized correctly from a small image set. This is bounded owner evidence, not an exhaustive device or image-corpus claim.

## Candidate and environment provenance

| Item | Evidence |
|---|---|
| Candidate | Fresh `origin/main` and local HEAD at `742694d9d209dba04674ce7188319d7f449c4a6e`; a final fetch confirmed it remained current. Latest runtime merge is PR #324 / `af36e8f`; `742694d9` is its fact-only closeout. |
| Local source | Clean temporary worktree `/private/tmp/laica-final-regression-2026-07-22`; the user's existing root-worktree `.env` edit was not touched. |
| Replit source | Direct Replit shell loaded detached exact candidate `742694d9`, passed install/check/build/unit/DB health, and started the development preview. Replit Agent was not used. |
| Mobile viewports | App-reported iPhone-like `390x844`, Pixel-like `412x915`, and a focused compact `375x667` breakpoint probe. |
| Production comparison | Published Replit marker remains `b462c9ba`; the candidate was not published and no custom-domain candidate smoke is claimed. |
| Camera scope | Controlled Codex run excluded live camera permission/capture and included upload/vision. Wilson later owner-confirmed camera access/capture and correct ingredient recognition from a small image set on `main`; broader device/image coverage is not claimed. |

## Scope provenance

The matrix was rebuilt from [`replit-validation-focus.md`](../workflows/replit-validation-focus.md), [`production-validation-registry.md`](../production-validation-registry.md), INIT-001, INIT-003, the then-active EFF-032/EFF-034 evidence, and first-parent merges after the prior readiness candidate `2686117a`. Wilson's resulting release decision superseded EFF-032 with EFF-035 as the active implementation home.

The accumulated-main delta after that candidate was explicitly audited:

- dependency, security-tool, and workflow maintenance through PRs #306-#310, #319, #322, and #329;
- PR #328 linked Ticket Pass restore stability (`0dcb9b72`);
- PR #330 E2E app-asset limiter capacity (`1c40069e`);
- PR #325 / EFF-033 returning Settings action dock (`ad3738e6`);
- PR #324 Guest Finish persistence-outcome truthfulness (`af36e8f0`);
- fact-only closeouts PRs #331 and #332.

## Executive result

| Lane | Result | Release meaning |
|---|---|---|
| Exact-head local gates | Pass | `npm ci`, check, build, 51 files / 399 unit tests, and high/critical audit gate passed. |
| Exact-head GitHub gates | Pass | Current-main CI ran nine guest + linked schema-backed Playwright tests and passed; audit, secret scan, CodeQL, and scheduled OAuth-start preflight also passed. |
| Exact-head Replit gates | Pass | Install, check, build, 51 / 399 unit, DB health, app start, provider recipes/steps/image, feedback, and live rejection/security probes passed. |
| Core guest mobile journey | Pass with accepted exception | Setup behavior, planning, recipe, imagery, Ready Check, eight-step cooking, session restore, transcript controls, speech request, Finish, Settings, feedback, and gestures were exercised. The height-dependent setup limitation is accepted for this release and routed to EFF-035; EFF-034 remains post-release polish. |
| Recently fixed behavior | Pass | EFF-033 and guest Finish were freshly re-tested on the combined current candidate; neither result was inherited from its implementation PR. |
| Linked direct-live journey | Pass, except duplicate linked upload | Real Google upgrade/profile, linked Pantry/Tools reload persistence, Slop Bowl, Ticket Pass reload restore, 14-step cook, linked Finish, and History persistence passed. A duplicate linked local-file upload was blocked by Chrome extension permission; exact-preview guest vision already passed. |
| Admin direct-live lane | Pre-publish guardrails pass; post-deploy smoke required | Missing/invalid rejection and no-cache passed; exact deterministic valid-secret/throttle coverage passed. Exercise the real deployed secret and throttle after publish. |
| New product findings | None | Every observed product issue maps to EFF-035 or EFF-034; EFF-032 is retained only as superseded historical evidence. |
| Overall | **Ready for production** | Wilson confirmed audible TTS on `main`; spoken microphone input remains a separate manual check, admin valid/throttle is a mandatory post-deploy smoke, and EFF-035 is an immediate post-production release-exception patch. Separate publish authorization is still required. |

## Fresh regression results

### Public entry and first-time setup

| Case | Result | Evidence / reasoning |
|---|---|---|
| Landing and guest entry | Pass | Landing CTA and proof content rendered at mobile sizes; a real anonymous session entered setup. |
| Pantry manual entry | Functional pass / accepted EFF-035 release exception | Three items saved correctly. At `390x844`, Upload and manual controls fit, but Back/Next start at `845.78px`; no document or intended internal scroll owner has range. |
| Optional Tools | Functional pass / accepted EFF-035 release exception | Optional screen fit and Add Tools manual entry saved `whisk`. The expanded Tools inventory has the same unreachable action rail at `390x844`. |
| Compact-browser scroll comparison | EFF-035 evidence | At `375x667`, `.setup-scroll-body` measured `501px` client / `607px` scroll height; activating Enter manually moved it to `scrollTop 106.5`. At `390x844` and `412x915`, the same page reported no scroll owner. |
| Cooking skill select-then-Next | Pass | Next was disabled before selection; Beginner selected without auto-advancing; Next enabled and then advanced to Dietary. |
| Dietary and completion | Pass | No restrictions selected; final summary correctly showed Pantry 3, Tools skipped in the first pass, beginner, and no restrictions; Planning loaded. |
| Live camera | **Owner-confirmed bounded pass after the controlled rerun** | Wilson reported that camera access/capture works on `main` and that ingredients were recognized correctly from a small image set. No exhaustive device/browser/image-corpus coverage is inferred. |

### Planning, provider, imagery, and shared feedback

| Case | Result | Evidence / reasoning |
|---|---|---|
| Chef It Up time screen | Pass | At `390x844`, centered title cleared Back; slider/info/Next fit and Next center-hit itself. |
| Provider suggestions | Pass | Real provider returned exactly three recipes for rice, eggs, and soy sauce. |
| Ticket Pass and chips | Pass | Heading read `Recipe suggestions`; pantry facts and optional extras remained distinct with no horizontal overflow. |
| Prep Tray image | Pass | Selected 1024x1024 image resolved through `/api/recipe-images/...`, filled the mobile hero, and did not bleed back into Ticket Pass. |
| Image upload/vision | Pass | Repository-owned synthetic kitchen image detected `beef patties`, `bbq sauce`, and `tapioca pearls`; all three unsaved synthetic items were removed afterward. |
| Guest Slop Bowl boundary | Pass | Guest path remained linked-only and showed sign-up guidance; guest History remained disabled. |
| Feedback write | Pass with cleanup note | Submitted `Production readiness regression 2026-07-22 — synthetic feedback record; safe to delete.` Success toast appeared. The row may be deleted during cleanup. |
| Toast swipe directions | Pass | Right, left, and up dismissed; down remained open. |

### Ready Check and Live Cooking

| Case | Result | Evidence / reasoning |
|---|---|---|
| Ready Check | Pass | Clear Start cooking action fit and center-hit at `390x844`. |
| Provider guide | Pass | Eight concrete provider steps generated and every step was traversed through Finish. |
| Session and captions restore | Pass | Reload restored Step 2 and retained the hidden-captions preference. |
| Repeat / speech request | Pass for route/UI; audible output not objectively verified | Repeat updated transcript with no browser errors. The automation runner cannot establish what a human heard. |
| Ask a question | Partial live pass | Microphone entered `Listening...` and canceled back to `Ask a question` cleanly. No spoken sample was supplied, so provider transcription/answer is not claimed. |
| Assistance failure presentation | Automated pass / direct-live gap | Exact focused unit coverage passed; this runner did not safely force a route failure. |
| Cooking-step recovery | Normal path pass / induced-failure gap | Provider steps loaded normally. The report retains exact deterministic recovery coverage instead of corrupting the live preview to force a failure. |
| Timer semantics | Known EFF-034, not freshly live-reproduced | This generated guide had no timer-bearing step. The existing Reset -> `Resume timer` finding remains open and is not called fixed. |
| Guest Finish | **Pass** | Fresh `390x844` and `412x915` run used `Dinner's ready. Sign up to save this session to your cooking history.` in transcript/toast, with zero false saved-History claim and usable layout. |

### Returning Settings and persistence

| Case | Result | Evidence / reasoning |
|---|---|---|
| EFF-033 Pantry `390x844` | **Pass** | Dock was a direct page child, `0..390px`, opaque, flush to Cook/Menu, and separated from the bounded scroller. At true bottom, Enter manually was fully above the dock and center-hit itself. |
| EFF-033 Tools `412x915` | **Pass** | Dock was `0..412px`, opaque, flush to Cook/Menu; upload/manual and 48px Settings/Save actions center-hit themselves. |
| Guest Pantry/Tools save/reload | Pass | Synthetic Tools item persisted across reload and was removed; vision detections stayed unsaved and were removed. Dirty reminder and Save copy cleared after save. |
| Linked Pantry/Tools save/reload | Pass | After real Google upgrade, a synthetic Pantry item and `codex regression whisk` each saved, survived reload, and were removed with cleanup persisted. One early Tools probe reloaded before mutation completion and lost the draft; the controlled rerun waited for the Save label to clear, then retained it on reload and cleanup. |
| Unsaved leave guard | Guard triggered / copy not inspected | Native confirmation appeared and prevented silent loss, then temporarily wedged the controlled Chrome connection. Control was later recovered and the linked matrix completed; this was a control-harness interruption, not a product failure. |
| Settings hub | Known EFF-034 | At `390x844`, the page still rendered about `1020px` of document height with a large blank/inert tail. |

### Fresh linked/authenticated matrix

| Case | Result | Evidence / reasoning |
|---|---|---|
| Real Google upgrade/profile | Pass | Existing Google account selection completed on the exact Replit preview. The app showed `Account successfully connected and signed in. Your kitchen is saved.` and loaded Wilson's 31-item linked pantry plus 18 linked tools. |
| Linked Slop Bowl | Pass | Saved-pantry confirmation produced `Beef & Spinach Curry Rice Bowl` from the real provider, with ingredients and an enabled cook path. |
| Linked Ticket Pass restore | **Pass** | Provider returned `Korean Beef Bone Soup Rice Bowl`, `Curried Vegetable & Tofu Stir Fry`, and `Savory Sage & Cheese Omelette Wrap`; reload restored the Recipe suggestions screen and all three exact titles. |
| Linked Prep Tray / Ready Check | Pass | Selected recipe preview completed, Ready Check used the saved linked ingredients/tools, and Start cooking generated a 14-step guide. |
| Linked Finish truthfulness | **Pass** | After traversing all 14 steps, transcript and toast used `Dinner's ready. Saved to your cooking history. Pantry cleanup comes next.` only after the completion mutation resolved. |
| Linked History write/cleanup | **Pass** | `Korean Beef Bone Soup Rice Bowl` appeared at the top of History with the current timestamp and expected metadata; the synthetic regression row was then removed and `Recipe removed` confirmed cleanup. |
| Linked image upload | Browser-permission gap, not product failure | Chrome opened the chooser but refused local-file attachment because the ChatGPT extension lacks file-URL access. The same exact preview's guest upload exercised the real `/api/vision/analyze` route successfully with a repository-owned image. |

## Automated and server evidence

| Check | Source provenance | Observed result | Negative scope |
|---|---|---|---|
| `npm ci` | Clean exact-head local worktree | Pass; 1,053 packages installed. | Does not exercise Replit runtime. |
| `npm run check` | Exact local head | Pass. | Compile/lint only. |
| `npm run build` | Exact local head | Pass; retained stale Browserslist, Firebase mixed-import, and >500 kB chunk warnings. | No defined performance gate. |
| `npm run test:unit` | Exact local head | Pass: 51 files / 399 tests. | Does not prove browser geometry or live providers. |
| Focused Live Cooking/planning/admin/rate-limit Vitest | Exact local head | Pass: 6 files / 103 tests. | Deterministic failure/admin evidence, not live secret/provider proof. |
| `npm audit --audit-level=high` | Exact lockfile | Pass; zero high/critical. | One low `body-parser` and one moderate `protobufjs` advisory remain. |
| GitHub CI `29874990266` | Exact candidate `742694d9` | Pass: disposable Neon schema push/health, `Running 9 tests using 1 worker`, `9 passed (51.8s)`, cleanup; unit/build/coverage passed. | CI linked dev-auth is not real Google popup validation. |
| OAuth Start Preflight `29921023021` | Exact candidate `742694d9` | Pass. | Proves provider/config start, not end-user popup completion. |
| GitHub security gates | Exact candidate `742694d9` | Audit `29874990223`, secret scan `29874990277`, and CodeQL `29874990053` passed. | No live Replit secret use. |
| Replit install/check/build/unit/DB | Detached exact candidate | Pass; 51 / 399 unit and DB schema health passed. | Development preview, not published custom domain. |
| Admin missing/invalid | Exact Replit preview | Both returned `403`, `Cache-Control: no-store, max-age=0`, `Pragma: no-cache`, `Expires: 0`, and `Vary: X-Admin-Secret`. | Does not prove valid-secret or 60/hour throttle. |
| Preview load/header probe | Exact Replit preview | `200`; security headers present and app assets loaded under the repaired 1,000/15-minute broad app-asset limit. | Vite development HTML is not the production bundle. |

## Existing non-blockers and recommendations

### EFF-035 — universal setup viewport resilience

Fresh screenshots and measurements confirm the limitation is real at `390x844`, while the `375x667` comparison confirms why some viewport-height combinations can scroll. Wilson explicitly accepted it for this release because the generalized fix changes structural layout behavior. EFF-035 now owns the immediate post-production patch: one intentional scroll owner, dynamic viewport height, safe-area clearance, and normal-interaction evidence across height, orientation, keyboard, browser-chrome, and text-scaling cases without changing the visual design or adding device-specific breakpoints. EFF-032 is resolved as superseded, not as implemented.

### EFF-034 — timer wording and Settings blank tail

The Settings blank tail reproduced unchanged. The timer case was not present in this generated guide, so it remains open from prior evidence. The fix should remove duplicate shell/nav bottom clearance and distinguish reset/never-started timer state from paused state. These remain P2 and do not reopen the recently resolved EFF-033 dock.

### Dependency warnings

The high/critical audit gate is green. A narrow maintenance PR can update transitive `body-parser@1.20.5` through Express and `protobufjs@7.6.4` through Firebase/Google dependencies after compatibility checks. They are not elevated to release blockers by this run.

## Manual and post-deploy validation ownership

These are not pre-publish product blockers under Wilson's accepted release decision:

| Gap | Strongest current evidence | Smallest remaining action |
|---|---|---|
| Valid-secret and controlled admin throttle | Live missing/invalid/no-cache passed; focused exact-head admin/rate-limit unit suite passed, including valid-secret and throttling behavior with controlled test configuration. | Mandatory post-deploy smoke: use the deployed secret only in-process, confirm valid succeeds/invalid fails, trigger a controlled throttle, verify non-cacheable responses and recovery without exposing the secret. |
| Audible TTS playback | **Owner-confirmed pass on `main`**: Wilson reported that TTS works. This is human playback evidence rather than an automation claim. | None for pre-publish readiness. |
| Camera capture and ingredient recognition | **Owner-confirmed bounded pass on `main`**: camera access/capture worked and a small image set produced correct ingredient recognition. | None for pre-publish readiness; retain normal regression coverage without treating the small set as exhaustive. |
| Spoken microphone question | Mic start/cancel passed; provider/unit evidence is green, but no real spoken sample was supplied during the controlled rerun. | Wilson may ask one real question manually in `main`; do not infer microphone capture from the separate TTS pass. |
| Induced step/assistance failure | Exact deterministic unit coverage passed; normal provider path passed. | Retain as resilience coverage; use a safe non-production failure hook in a later focused pass rather than damaging shared runtime state. |
| Exact-candidate custom-domain smoke | Production was not published by this task. | After explicit publish authorization, record the deployed marker and run the focused custom-domain smoke, including the admin checks above. |

## Screenshot evidence

| Evidence | Screenshot |
|---|---|
| Fresh setup Pantry `390x844` reproduction (EFF-035; originally EFF-032 evidence) | [`first-time-pantry-actions-unreachable-390x844.jpg`](../assets/production-readiness/2026-07-22/first-time-pantry-actions-unreachable-390x844.jpg) |
| Fresh setup Tools `390x844` reproduction (EFF-035; originally EFF-032 evidence) | [`first-time-tools-actions-unreachable-390x844.jpg`](../assets/production-readiness/2026-07-22/first-time-tools-actions-unreachable-390x844.jpg) |
| Fresh EFF-033 Pantry true-bottom clearance | [`guest-settings-pantry-scrolled-390x844.jpg`](../assets/production-readiness/2026-07-22/guest-settings-pantry-scrolled-390x844.jpg) |
| Fresh EFF-033 Tools true-bottom clearance | [`guest-settings-tools-scrolled-412x915.jpg`](../assets/production-readiness/2026-07-22/guest-settings-tools-scrolled-412x915.jpg) |
| Fresh guest Finish honest transcript `390x844` | [`guest-finish-transcript-390x844.jpg`](../assets/production-readiness/2026-07-22/guest-finish-transcript-390x844.jpg) |
| Fresh guest Finish honest transcript `412x915` | [`guest-finish-transcript-412x915.jpg`](../assets/production-readiness/2026-07-22/guest-finish-transcript-412x915.jpg) |
| Fresh linked Finish saved-History transcript `390x844` | [`linked-finish-transcript-390x844.jpg`](../assets/production-readiness/2026-07-22/linked-finish-transcript-390x844.jpg) |
| Fresh linked History row before cleanup | [`linked-history-entry-390x844.jpg`](../assets/production-readiness/2026-07-22/linked-history-entry-390x844.jpg) |
| Fresh linked Tools persistence after reload | [`linked-tools-after-reload-390x844.jpg`](../assets/production-readiness/2026-07-22/linked-tools-after-reload-390x844.jpg) |
| Fresh image-upload vision result/items | [`guest-pantry-vision-result-390x844.jpg`](../assets/production-readiness/2026-07-22/guest-pantry-vision-result-390x844.jpg), [`guest-pantry-vision-items-390x844.jpg`](../assets/production-readiness/2026-07-22/guest-pantry-vision-items-390x844.jpg) |
| Fresh EFF-034 Settings blank tail | [`settings-root-390x844.jpg`](../assets/production-readiness/2026-07-22/settings-root-390x844.jpg) |

Additional evidence in the same folder covers Planning, time selection, Ticket Pass, Prep Tray, Ready Check, and Live Cooking.

## Changes

- Added this all-in-one exact-candidate regression report and screenshot set.
- Updated the production validation registry with the rerun verdict, accepted release decision, validation ownership, and post-deploy smoke.
- Preserved EFF-032 as historical evidence, superseded it with the broader EFF-035 immediate post-production patch, and retained EFF-034 as post-release polish.
- Updated INIT-001 and INIT-003 validation/resume points.

No runtime, product, UI, test, workflow-policy, dependency, schema, deployment, or production-publish change was made.

## Impact on other agents

- Treat `742694d9` as the latest broadly tested and production-ready candidate, not as an already published build.
- Do not reopen EFF-033 or Guest Finish from stale assumptions; fresh combined-candidate evidence passed. Investigate only if new contrary evidence appears.
- Real-Google linked release behavior has fresh direct-live proof. Admin valid/throttle is now a mandatory post-deploy smoke rather than a pre-publish hold.
- EFF-035 is the single active home for the immediate post-production setup viewport patch; EFF-032 is resolved as superseded, and EFF-034 remains post-release polish.
- Camera permission/capture and small-set ingredient recognition are owner-confirmed on `main`; broader device and image-corpus coverage is not claimed.

## Open items

- Wilson's audible TTS check in `main` passed; one real spoken microphone check remains separate.
- Obtain separate publish authorization, then run the mandatory masked valid/invalid/throttled admin and custom-domain smoke after deployment.
- Implement EFF-035 as the immediate post-production patch, with EFF-034 following as normal polish.
- Delete the clearly labeled synthetic feedback row if desired.

## Verification

- `git diff --check`
- screenshot file/type/path audit
- Markdown link/path audit
- exact-main fetch/ancestor check
- exact-head local, GitHub, Replit, provider, and mobile evidence as recorded above

This report deliberately separates observed facts from Wilson-owned manual acceptance and post-deploy smoke. Wilson's manual audible-TTS and bounded camera/ingredient-recognition passes are recorded, but the report does not claim exhaustive camera device/image-corpus coverage, a duplicate linked local-file upload, real spoken microphone input, a production publish, production-secret success/throttling, or a custom-domain pass.

## 2026-07-22 — Wilson production-readiness decision

Wilson accepted `742694d9` as ready for production based on the exact-head automated, Replit, provider, guest, linked, persistence, and mobile evidence above. The release decision assigns the remaining work instead of treating it as one undifferentiated hold:

- admin valid-secret and controlled-throttle behavior is a mandatory post-deploy smoke because the real deployed secret/environment is the authoritative target;
- audible TTS is owner-confirmed working on `main`; one spoken microphone question remains a separate manual check;
- the height-dependent setup limitation is accepted for this release and moves to EFF-035 as an immediate post-production generalized viewport/overflow/safe-area patch;
- EFF-034 remains normal post-release polish;
- publishing still requires a separate explicit instruction and this task did not publish production.

## 2026-07-22 — Owner-confirmed TTS pass

Wilson reported that TTS works on `main`. This closes the audible-playback acceptance item as a human-confirmed pass. It does not establish microphone capture or spoken-question transcription, which remains separately unclaimed, and it does not change the post-deploy admin smoke, EFF-035 release exception, EFF-034 polish scope, or production publish status.

## 2026-07-22 — Owner-confirmed camera and small-set recognition pass

Wilson reported that the camera works on `main` and ingredients were recognized correctly from a small set of images. This closes the previously deferred live-camera acceptance item as a bounded human-confirmed pass. The evidence supports camera access/capture plus representative ingredient recognition; it does not claim exhaustive phone/browser compatibility, lighting/angle conditions, or image-corpus accuracy. No screenshot was supplied with this pass, and none is inferred. The result does not alter EFF-035, which owns setup viewport reachability rather than camera functionality.
