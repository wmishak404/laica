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

- Registry updated: 2026-06-30.
- Current `origin/main`: `f9909af7cbc7104f9eb4da7b3a8642215fce461e`.
- Current latest merge: PR #238, `Close EFF-010 local DB strategy`.
- Current latest user-visible/runtime merge: PR #237, `Add Settings unsaved inventory reminder`.

Merged work after the 2026-06-22 production-smoke evidence that should be reviewed for the next production push:

| Date | Commit / PR | Surface | Production validation implication |
|---|---|---|---|
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

Previously deferred low-risk UI checks, such as guest bottom-nav removal, planning toast behavior, and landing auth-control contrast, should not remain separate blockers by default after the 2026-06-22 production smoke. Pull them back into scope only if the recovered production SHA proves they were not included, Wilson requests a full regression or visual pass, or a new change touches those surfaces.

## Update Rule

After every production publish or post-publish smoke, append a dated section here with:

- Published SHA or production build marker.
- `Last Replit-validated at: <sha>` when applicable.
- `Last production-smoked at: <sha>` when known.
- Evidence source handoff or release note.
- Focused smoke cases selected, pass/fail result, and explicit gaps.
- Carry-forward items for the next production push.

Keep this file as an index. Do not paste full logs, screenshots, provider payloads, secret diagnostics, or long PR transcripts here.
