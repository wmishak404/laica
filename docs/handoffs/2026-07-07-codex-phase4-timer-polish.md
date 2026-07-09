# 2026-07-07 - Codex Phase 4 timer polish

## Summary

Branch `codex/init-001-phase4-timer-polish` continued INIT-001 Phase 4 from the merged PR #264 warm Live Cooking baseline and shipped through [PR #269](https://github.com/wmishak404/laica/pull/269), squash-merged as `c6091b9` from final PR head `b0bdc9a`. The slice makes Live Cooking timers stable and explicit-start using the current recipe step's real duration, shows timers automatically only when the step has a timer-worthy duration, keeps the timer readout centered with persistent play/pause and reset controls, and shows a visible `Time's up` state in the timer control when the countdown completes. Wilson also asked to keep the app shell available on Ready Check, so this branch preserves the Prep Tray session until the guide actually starts and shows bottom nav before active cooking.

## Scope

- Timer controls remain explicit-start; step navigation clears timer state instead of carrying a running timer into the next step.
- Timer controls appear automatically when the current recipe step has a timer-worthy `duration` or explicit time language such as `cook 1-2 minutes`. The visible control shows that duration in `H:MM:SS` format with circular play/pause and reset controls; durationless steps do not invent a fallback timer.
- The old separate timer visibility toggle is removed; CC remains the only compact toggle in the guidance panel, uses a circular button with a boxed `CC` mark, and shares a row with the transcript when captions are open to reduce wasted vertical space.
- Step previews stay action-forward and now scroll the active preview card into view as the cook moves through later steps, so the rail follows the current step instead of remaining at the leftmost start position. If the cook manually scrolls the rail or hidden steps exist off either edge, a small bottom-floating left/right return control appears only for the hidden side and snaps the rail back to the current step.
- Timer completion is a first-class visual timer state, not a CC workaround: CC remains voice/transcript-only and is not auto-opened when a countdown reaches zero.
- Active timers no longer collapse/minimize; the centered time, play/pause, and reset controls remain visible together so the cook does not lose the controls mid-step.
- Timer speech copy now uses singular/plural duration text correctly, such as `1 minute` or `2 minutes`.
- Speech synthesis user limits are raised 3x for Live Cooking testing and hands-busy usage: `90/hour` and `360/day`. This changes only the `speech` bucket fallbacks; env overrides and the broader `/api` request limiter remain separate.
- Prep Tray selected-image loading now shows larger visible loading copy and a stable `Preview unavailable` fallback when the image resolver returns `status: unavailable`.
- Ready Check `Back to Planning` restores the Prep Tray / recipe-suggestion session instead of restarting planning. The planning session is dismissed only once `Start cooking` begins the active guide.
- Bottom nav remains visible on Ready Check per Wilson's explicit request, with additional Ready Check bottom padding so the fixed nav does not cover `Start cooking`; active hands-busy cooking still hides bottom nav.

## Non-Scope

- No provider response schema or `suggestedTimer` object.
- No route contract, durable cooking-session schema, Finish/History, assistance failure, formal eval, or Phase 5 cleanup changes.
- Durable navigation scope is limited to Wilson's explicit request to show existing bottom nav during Ready Check; the active guide remains focus-mode and hides it.
- No future voice-activity/glowing Ask a question affordance work.

## Validation

- `npx vitest run tests/unit/live-cooking-guest-session.test.tsx --testTimeout=15000` passed after the step-preview overflow affordance: 41 tests.
- Earlier focused `npx vitest run tests/unit/live-cooking-guest-session.test.tsx --testTimeout=15000` passed: 40 tests.
- `npx vitest run tests/unit/live-cooking-guest-session.test.tsx tests/unit/meal-planning.test.tsx tests/unit/planning-choice.test.tsx --testTimeout=15000` passed: 96 tests.
- `npx vitest run tests/unit/rate-limit.test.ts` passed after the speech-limit increase: 2 files, 18 tests.
- Latest rail-follow patch: `npm run check`, `npm run build`, and `git diff --check` passed. Build retained the existing stale Browserslist, Firebase dynamic/static import, and chunk-size warnings.
- Exact-head GitHub checks passed at final PR head `b0bdc9a`: `unit`, `e2e_guest_smoke`, `npm-audit`, `trufflehog_pr`, CodeQL, and both Analyze lanes.
- Wilson's light Replit smoke on 2026-07-08 after resetting Replit to `8be2901` confirmed the compact CC layout: transcript on the left, circular boxed-CC control on the same row, and no extra vertical dead space. This is visual smoke evidence only, not full human regression.
- Wilson's later Replit smoke on 2026-07-08 at the PR head confirmed the new step-preview rail affordance looks good and functions well: the active rail position follows the current step, and the bottom left/right return controls appear for hidden rail content and snap back to the current step. This is acceptance smoke for the added rail affordance only; full production regression remains release/batch deferred.
- Chrome-extension Replit smoke on 2026-07-08 at final PR head `b0bdc9a` exercised the merged PR flow end to end without Replit Agent: Planning -> Chef It Up -> `30m` -> `No preference` -> generated recipe suggestions -> Prep Tray -> Ready Check -> active Live Cooking. Observed pass: Prep Tray showed the larger `Cooking up the preview...` copy; the selected recipe image resolved successfully; Ready Check showed bottom nav, a larger/bolder `Start cooking`, and `Back to Planning` returned to the same Prep Tray instead of restarting; active guide hid bottom nav; CC persisted on in the reused browser and toggled off/on correctly; prep steps 1-6 had no invented timer; the step-preview rail followed the active step and exposed right-only, both-side, then left-only bottom return affordances as expected; the generated `2-3 minutes` steps derived a `0:03:00` explicit-start timer; start/pause/reset worked; the timer was run to visible `Time's up`; Next cleared the completed timer state; final step showed `Garnish & Serve` with `Finish`; and browser console warnings/errors were empty. Negative scope: this run did not hit `Preview unavailable` because imagery resolved, did not click `Ask a question` to avoid microphone permission, and did not click `Finish` to avoid a history/completion side effect.

## Production / Release-Batch Deferrals

- Full production/release-batch regression remains deferred. It should include the changed-since-last-prod Phase 4 timer and captions path: load the merged head, confirm speech synthesis has the raised `90/hour` and `360/day` user fallbacks after server restart, enter Live Cooking, find a timed step, confirm the automatic explicit-start timer uses the step's real duration or text-derived timing, start/pause/reset it, let it reach `Time's up` without relying on CC, open captions and confirm the boxed circular CC button shares the row with the transcript, confirm durationless steps do not invent timers, navigate deep into a long recipe and confirm the step-preview rail follows the current card plus shows bottom left/right return affordances only when hidden rail content exists, and rerun Ready Check/Prep Tray follow-ups for selected-image loading copy, `Preview unavailable`, Back to Planning restore, visible Ready Check bottom nav, and active-cooking hidden bottom nav.
