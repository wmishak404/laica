# Production Validation Registry

This is the compact operational ledger for what production has most recently proven and what the next production push needs to test. Keep detailed evidence in PRs and handoffs; keep this file short enough that a release pass can start here without context bloat.

Use `docs/workflows/replit-validation-focus.md` for the full validation routine and evidence report format.

## Current Production Smoke Baseline

- Last recorded production smoke date: 2026-06-22.
- Evidence source: `docs/handoffs/2026-06-22-codex-prod-vision-scan-resolution.md`.
- Recorded passed production surfaces: production app load, Google sign-in/profile, pantry image scan via `/api/vision/analyze`, Chef It Up suggestions, Prep Tray selected image, cooking steps/session, speech, and feedback write.
- Live vision evidence: pantry review chips were shown for `oysters`, `herb butter`, and `salt`.
- Last production-smoked SHA/build marker: not recorded in the 2026-06-22 handoff. The next production validation pass must identify and record the deployed build marker or exact SHA before comparing changed-since-last-prod scope.

Until the exact production-smoked SHA is recovered, treat 2026-06-22 as a date-based baseline, not commit-level proof.

## Current Main Candidate

- Registry updated: 2026-07-16 for the PR #293, PR #294, and PR #296 addenda below.
- Current `origin/main`: `0e7910df11abb7a87f99e2003e4b8410125ba0b4`.
- Current latest merge: PR #301, `[codex] Record EFF-028 production readiness checks`.
- Current latest user-visible/runtime merge: PR #296, `[codex] Require Next after setup skill selection`.

The row list below still needs the normal changed-since-last-prod review before a production publish because it has not been fully refreshed for every merge after the 2026-06-30 candidate. The dated addenda record PR #275, PR #276, PR #293, PR #294, and PR #296 coverage now so the next production-readiness pass does not lose that test signal; they are not a full audit of every intervening merge.

## 2026-07-10 PR #275 Production-Readiness Addendum

- PR #275 merged at `148c881591479d2c5f07c500dd440682989824b4` after exact-head GitHub checks passed for head `eb364ee7127f86c2b46c826e74619d48719b1c50`.
- Include the PR #275 Live Cooking assistance-failure behavior in the next production/release-batch smoke when the release SHA contains this merge: deny microphone or force an assistance-route failure, then confirm the current step remains visible, the separate voice-help status appears outside Step guidance, retry clears it, and technical failure copy is not spoken as cooking guidance.
- No extra PR-level manual Replit smoke was required before merge because this was a narrow client failure-presentation slice with deterministic Live Cooking unit coverage, an updated guest E2E assertion, passing exact-head GitHub CI, and no schema, auth, provider contract, persistence, secrets, deployment, or navigation changes.

## 2026-07-10 PR #276 Production-Readiness Addendum

- PR #276 merged at `c75d5bb334900549d0b8b00b4ad84d7ef1a5e96e` after exact-head GitHub checks passed for head `14a04d9242c239c497298ef8201b227ebbf2b8b3`.
- Include the PR #276 linked dev-auth browser smoke in the next production-readiness evidence when the release SHA contains this merge. The smoke signs in the linked `dev-test-linked-browser-ci` profile, completes Chef It Up planning, saves Settings Pantry and Tools inventory, then verifies the linked profile through the authenticated `/api/user/profile` path.
- No extra manual production smoke is required solely for PR #276 because it added test and documentation coverage only. Add a targeted Settings Pantry/Tools save/reload check if a later release changes auth, linked profiles, Settings inventory persistence, or the E2E lane is stale, skipped, or no longer running at the release SHA.

## 2026-07-16 PR #293 Production-Readiness Addendum

- PR #293 merged at `d7aadd2764abb5e6ba36a77c491e40241ba35211` after exact-head checks passed for head `551eb489f847be1262b3b5d5be930d1e99dfa01d`.
- Include the shared toast dismissal behavior in the next production/release-batch mobile UI smoke when the release SHA contains this merge: trigger a toast, swipe right, left, and up to dismiss it, confirm the exit animation follows the swipe direction, and confirm downward swipes do not dismiss.
- Wilson confirmed a mobile browser spot check on 2026-07-16 before merge, but the exact viewport/device preset was not captured. Treat that as supplemental product-feel evidence; the production-readiness regression should still record the mobile browser or device preset used for the formal check.
- No extra provider, auth, schema, DB, persistence, secrets, deployment, or navigation smoke is required solely for PR #293 because it changes the shared client toast primitive and has focused unit coverage plus exact-head CI.

## 2026-07-16 PR #294 Production-Readiness Addendum

- PR #294 merged at `4e872deeb494b72f56ce5011a5b1bd213ee9fb29` after exact-head GitHub checks passed for head `127701d99e2f2cd85b37114bb68a5e1774065255`.
- Include the EFF-028 mobile visual checks in the next production/release-batch smoke when the release SHA contains this merge: Chef It Up time-selection title centered and clear of the floating Back button in iPhone-like mobile view, the full time-selection stack not biased below the available visual center, Ticket Pass heading shortened to `Recipe suggestions`, mobile Prep Tray ready selected image filling the hero area, and no selected-image bleed when returning to Ticket Pass.
- Last Replit-validated at `127701d99e2f2cd85b37114bb68a5e1774065255`: Chrome/Replit mobile validation used compensated viewport overrides because the controlled preview tab reported `devicePixelRatio: 0.8`; app-reported `390x744`, `390x844`, and `375x667` viewports passed. Replit Agent was not used.
- Carry the exact-head Replit validation forward unless a later release changes Chef It Up, Ticket Pass, Prep Tray, shared mobile layout, or release readiness asks for a full visual regression.
- Negative scope: no provider, schema, prompt, durable navigation, Ticket Pass generation/refresh behavior, Ready Check, Live Cooking, image-generation/cache behavior, recipe route, direct dependency, or package manifest change.

## 2026-07-16 PR #296 Production-Readiness Addendum

- PR #296 merged at `fc9739960306447f1148405db3e88e04798ea2fc` after exact-head GitHub checks passed for head `06234908d88013d79f91a5c79d03125f092222ac`.
- Include the setup cooking-skill select-then-Next behavior in the next production/release-batch smoke when the release SHA contains this merge: bottom `Next` should be disabled before selection; selecting `Beginner`, `Intermediate`, or `Expert` should select the row without auto-advancing, enable the bottom `Next` action, and advance to Dietary only after `Next` is tapped.
- Exact-head human Replit validation is not claimed after the final rebase; Wilson's spot check before the merge-readiness refresh accepted the behavior, and exact-head GitHub unit/E2E checks passed before merge. Add a targeted mobile setup smoke if later setup-flow changes land, exact-head CI is stale/skipped, or release readiness asks for a full setup regression.
- Negative scope: no Pantry, Tools, Dietary, Ready, returning Settings, provider route, schema, durable navigation, or Live Cooking change.

Merged work after the 2026-06-22 production-smoke evidence that should be reviewed for the next production push:

| Date | Commit / PR | Surface | Production validation implication |
|---|---|---|---|
| 2026-07-16 | `fc97399` / PR #296 | First-time setup cooking-skill select-then-Next behavior | Focused mobile setup smoke: bottom `Next` should be disabled before skill selection; selecting a cooking-skill row should not auto-advance, should enable the bottom `Next` action, and `Next` should advance to Dietary. Rely on exact-head GitHub unit/E2E evidence unless later setup-flow changes or stale automation make release confidence indirect. |
| 2026-07-16 | `4e872de` / PR #294 | EFF-028 Chef It Up time-selection, Ticket Pass heading, and mobile Prep Tray ready-image visuals | Focused mobile visual smoke: time-selection title is centered/clear of Back without bottom bias, Ticket Pass heading reads `Recipe suggestions`, and mobile Prep Tray ready selected image fills the hero area without bleeding back into Ticket Pass. Carry exact-head Replit validation at `127701d99e2f2cd85b37114bb68a5e1774065255` unless later mobile layout changes land. |
| 2026-07-16 | `d7aadd2` / PR #293 | Shared toast primitive swipe dismissal and direction-matched exit animation | Focused mobile UI smoke: trigger a toast, swipe right/left/up to dismiss, verify the exit animation follows the gesture direction, and verify down swipe does not dismiss. Record the mobile browser or device preset because the pre-merge mobile spot check did not capture it. |
| 2026-07-10 | `148c881` / PR #275 | Live Cooking `Ask a question` technical/quota failure presentation | Release-batch Live Cooking smoke: deny microphone or force assistance-route failure; verify current step stays visible, separate voice-help retry status appears outside Step guidance, retry clears it, and technical failure copy is not spoken as cooking guidance. |
| 2026-07-10 | `c75d5bb` / PR #276 | EFF-017 linked dev-auth browser smoke for Chef It Up plus Settings Pantry/Tools persistence | Carry the exact-head GitHub E2E evidence into the production-readiness report. Do not duplicate manually unless later auth/profile/settings work or stale automation makes the release confidence indirect. |
| 2026-06-30 | `a4450a6` / PR #248 | EFF-022 fallback merge closeout docs | No production UI smoke beyond normal release evidence; included here to keep the current main candidate explicit. |
| 2026-06-30 | `203e621` / PR #247 | EFF-022 fallback direction and INIT-004 eval planning docs | No production UI smoke beyond normal release evidence; included here to keep the current main candidate explicit. |
| 2026-06-30 | `3976a63` / PR #244 | Admin route hardening, transcription temp-file isolation, and runtime rate-limit policy | Focused security/provider smoke: signed-in Live Cooking transcription with the real provider, ordinary repeated voice-question usage from a shared network/browser, shared-network recipe/cooking assistance, and admin valid/invalid/throttled/no-cache behavior in Replit. |
| 2026-06-30 | `142ea9b` / PR #245 | Live Cooking transcript pin preference hardening | Focused Live Cooking smoke: transcript panel appears during normal cooking and the pin/unpin toggle remains usable. Rely on exact-head unit coverage for malformed saved-state recovery unless the production smoke deliberately includes safe browser-storage manipulation. |
| 2026-06-29 | `f9909af` / PR #238 | EFF-010 local DB strategy closeout and worktree setup policy | No user-visible production smoke beyond normal release evidence; included here to keep the current main candidate explicit. |
| 2026-06-29 | `41a657c` / PR #243 | EFF-025 Settings reminder merge closeout docs | No extra production smoke beyond the PR #237 Settings focused check below. |
| 2026-06-29 | `b056d91` / PR #241 | PR #234 ingredient-chip merge closeout docs | No extra production smoke beyond the PR #234 ingredient-chip focused check below. |
| 2026-06-29 | `18446db` / PR #237 | Settings Pantry/Tools unsaved inventory reminders | Focused Settings smoke: dirty reminders, dirty Save copy, leave/switch prompts, and save-clears-reminder should be visible on mobile without feeling noisy. |
| 2026-06-29 | `7c0d5b7` / PR #239 | INIT-004 eval taxonomy closeout docs | No production UI smoke beyond normal release evidence; included here only to keep the current main candidate explicit. |
| 2026-06-29 | `bc9290c` / PR #234 | Ticket Pass and Prep Tray ingredient chips | Focused visual smoke: known pantry ingredients should use checked pantry-fact styling; optional extras should stay visually distinct. |
| 2026-06-29 | `f3e886b` / PR #236 plus `a25fb01` closeout | Live Cooking step-generation recovery and linked Finish copy | Focused Live Cooking smoke required in the next production/release batch. |
| 2026-06-29 | `11b1847` / PR #235 | `useAuth` session coverage | Test-only coverage. No extra manual production case beyond baseline sign-in/session restore unless auth behavior changes again. |
| 2026-06-23 | `13c4982` / PR #220 | Recipe image schema health check | No direct user-visible production path; baseline build/startup and Prep Tray selected-image smoke are enough. |
| 2026-06-22 to 2026-06-29 | PRs #218, #219, #226, #227, #228, #229, #230, #231, #232, #233 | Dependency, eval, workflow, and docs closeouts | Trust exact-head automation first; production smoke should cover startup, DB-backed baseline flows, and provider canaries rather than duplicating docs-only context. |

## Next Production Push Scope

Before publishing or smoking the next production build:

1. Identify the currently deployed production build marker or exact SHA.
2. Record the intended publish SHA and compare it with this registry's `origin/main` candidate.
3. If any new commits landed after this registry update, add their user-visible/provider/auth/DB/deployment surfaces to the focused smoke list.

Run the baseline core smoke from `docs/workflows/replit-validation-focus.md`:

- Production app load on the custom domain.
- Firebase sign-in/profile load.
- Pantry image scan.
- Chef It Up recipe suggestions.
- Slop It Up / Slop Bowl generation.
- Prep Tray open and selected image render.
- `Cook this` into cooking steps/session start.
- ElevenLabs-backed speech.
- Feedback write.

Run these changed-since-last-prod focused checks for the current candidate:

- PR #294 EFF-028 mobile visual clearance:
  - In mobile view, prefer iPhone presets or real mobile Safari when available. Include at least one short iPhone-like viewport if doing a full visual regression.
  - Open Chef It Up time selection and confirm the title is centered, clears the floating Back button, and the full stack is not biased below the available visual center.
  - Confirm the clock/timer treatment, slider, info card, and bottom `Next` remain visible and usable without page-edge crowding.
  - Generate or open Ticket Pass and confirm the heading reads `Recipe suggestions`.
  - Open Prep Tray after the ready selected image resolves and confirm the mobile selected image fills the hero area like desktop.
  - Return to Ticket Pass when available and confirm the selected image does not bleed into the suggestion-card placeholder art.
- PR #296 setup cooking-skill explicit Next:
  - In the first-time setup flow on mobile, confirm the bottom `Next` action is disabled before selecting a cooking skill.
  - In the first-time setup flow on mobile, select `Beginner`, `Intermediate`, or `Expert`.
  - Confirm the row becomes selected and the flow does not auto-advance.
  - Confirm the bottom `Next` action enables after selection and advances to Dietary only after it is tapped.
  - Confirm the setup bottom rail remains usable and visually consistent with adjacent setup pages.
- PR #293 shared toast swipe dismissal:
  - Trigger a toast on mobile browser or Chrome device toolbar and record the browser/device preset.
  - Swipe right, left, and up; confirm each gesture dismisses the toast.
  - Confirm each dismissal exits in the same direction as the swipe.
  - Swipe down and confirm the toast remains visible.
- PR #275 Live Cooking assistance-failure presentation:
  - Deny microphone access or force `/api/cooking/assistance` to fail while in Live Cooking.
  - Confirm the current step remains visible and unchanged.
  - Confirm a separate voice-help retry status appears outside Step guidance.
  - Confirm retry clears the status.
  - Confirm technical failure copy is not spoken as cooking guidance.
- PR #276 linked Settings dev-auth smoke:
  - Include the PR #276 exact-head GitHub E2E pass in the production-readiness evidence when validating a release SHA that contains `c75d5bb`.
  - Confirm the readiness report names the linked user coverage: Chef It Up planning, Settings Pantry/Tools persistence, and authenticated profile verification.
  - If the release SHA has later auth/profile/settings persistence changes or stale/skipped E2E evidence, add a targeted live Settings Pantry/Tools save/reload check.
- PR #244 admin/transcription boundary hardening:
  - In signed-in Live Cooking, use the real transcription or voice-question path and confirm the provider-backed flow works without temp-file or cleanup errors.
  - Repeat normal recipe and cooking-assistance requests from the same network/browser enough to confirm ordinary shared-network use is not blocked by the rate-limit policy.
  - Exercise admin valid-secret, invalid-secret, and throttled attempts in Replit and confirm admin responses remain non-cacheable without exposing secret values.
- PR #245 Live Cooking transcript pin preference:
  - During normal Live Cooking, confirm the transcript panel appears.
  - Toggle pin/unpin and confirm the control remains usable through the cooking flow.
  - If safe for the smoke lane, reload or re-enter Live Cooking and confirm the saved pin preference does not break guide load. If not, record the gap and rely on PR #245 exact-head unit coverage for malformed saved-state recovery.
- PR #234 ingredient chips:
  - Open a recipe through Ticket Pass and Prep Tray with known pantry ingredients.
  - Confirm `Uses` and `Use these` chips read as checked pantry facts.
  - Confirm optional extras remain visually separate and text does not overflow on mobile.
- PR #237 Settings unsaved inventory reminders:
  - In Settings -> Kitchen Inventory -> Pantry, add and remove an item before Save.
  - Confirm the inline unsaved reminder is visible, the Save copy reflects dirty changes, and saving clears the reminder.
  - Repeat the same pattern for Tools.
  - With unsaved Pantry or Tools changes, switch sections or press Back and confirm the leave prompt is understandable without being noisy.
- PR #236 Live Cooking recovery:
  - Normal Prep Tray -> `Cook this` still enters generated cooking steps/session.
  - Induced `/api/cooking/steps` failure shows the inline recovery panel instead of silently switching to generic steps.
  - After removing the induced failure, `Try again` recovers into generated steps.
  - `Use basic steps` is clearly labeled as a generic backup and is not automatic.
  - Linked-user `Finish` copy says cooking history is saved and pantry cleanup comes next, without implying pantry inventory was already updated.

If production smoke cannot safely induce the cooking-step failure, record that gap explicitly and rely on PR #236 exact-head unit coverage for the forced failure path while still validating normal entry and Finish copy in production.

Continue carrying the June 2026 provider-secret lesson as a canary, not a blocker: include one live pantry vision scan in each production publish pass until Wilson retires that risk. Include ElevenLabs speech when Live Cooking or speech remains in the release smoke scope.

Previously deferred low-risk UI checks, such as guest bottom-nav removal, planning toast behavior, and landing auth-control contrast, should not remain separate blockers by default after the 2026-06-22 production smoke. Pull them back into scope only if the recovered production SHA proves they were not included, Wilson requests a full regression or visual pass, or a new change touches those surfaces. PR #293 is tracked above because it is a new shared-toast change after that baseline.

## Update Rule

After every production publish or post-publish smoke, append a dated section here with:

- Published SHA or production build marker.
- `Last Replit-validated at: <sha>` when applicable.
- `Last production-smoked at: <sha>` when known.
- Evidence source handoff or release note.
- Focused smoke cases selected, pass/fail result, and explicit gaps.
- Carry-forward items for the next production push.

Keep this file as an index. Do not paste full logs, screenshots, provider payloads, secret diagnostics, or long PR transcripts here.
