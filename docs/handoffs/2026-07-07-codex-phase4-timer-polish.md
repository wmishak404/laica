# 2026-07-07 - Codex Phase 4 timer polish

## Summary

Branch `codex/init-001-phase4-timer-polish` continues INIT-001 Phase 4 from the merged PR #264 warm Live Cooking baseline. The slice makes Live Cooking timers stable and explicit-start using the current recipe step's real duration, shows timers automatically only when the step has a timer-worthy duration, keeps the timer readout centered with persistent play/pause and reset controls, and shows a visible `Time's up` state in the timer control when the countdown completes. Wilson also asked to keep the app shell available on Ready Check, so this branch preserves the Prep Tray session until the guide actually starts and shows bottom nav before active cooking.

## Scope

- Timer controls remain explicit-start; step navigation clears timer state instead of carrying a running timer into the next step.
- Timer controls appear automatically when the current recipe step has a timer-worthy `duration` or explicit time language such as `cook 1-2 minutes`. The visible control shows that duration in `H:MM:SS` format with circular play/pause and reset controls; durationless steps do not invent a fallback timer.
- The old separate timer visibility toggle is removed; CC remains the only compact toggle in the guidance panel and is circular/centered.
- Timer completion is a first-class visual timer state, not a CC workaround: CC remains voice/transcript-only and is not auto-opened when a countdown reaches zero.
- Active timers no longer collapse/minimize; the centered time, play/pause, and reset controls remain visible together so the cook does not lose the controls mid-step.
- Timer speech copy now uses singular/plural duration text correctly, such as `1 minute` or `2 minutes`.
- Prep Tray selected-image loading now shows larger visible loading copy and a stable `Preview unavailable` fallback when the image resolver returns `status: unavailable`.
- Ready Check `Back to Planning` restores the Prep Tray / recipe-suggestion session instead of restarting planning. The planning session is dismissed only once `Start cooking` begins the active guide.
- Bottom nav remains visible on Ready Check per Wilson's explicit request, with additional Ready Check bottom padding so the fixed nav does not cover `Start cooking`; active hands-busy cooking still hides bottom nav.

## Non-Scope

- No provider response schema or `suggestedTimer` object.
- No route contract, durable cooking-session schema, Finish/History, assistance failure, formal eval, or Phase 5 cleanup changes.
- Durable navigation scope is limited to Wilson's explicit request to show existing bottom nav during Ready Check; the active guide remains focus-mode and hides it.
- No future voice-activity/glowing Ask a question affordance work.

## Validation

- `npx vitest run tests/unit/live-cooking-guest-session.test.tsx --testTimeout=15000` passed: 39 tests.
- `npx vitest run tests/unit/live-cooking-guest-session.test.tsx tests/unit/meal-planning.test.tsx tests/unit/planning-choice.test.tsx --testTimeout=15000` passed: 96 tests.
- `npm run check` passed.
- `npm run build` passed with existing stale Browserslist, Firebase dynamic/static import, and chunk-size warnings.
- `git diff --check` passed.
- Exact-head GitHub checks passed at `1165975`: `unit`, `e2e_guest_smoke`, `npm-audit`, `trufflehog_pr`, CodeQL, and both Analyze lanes.

## Remaining Before Merge

- Human Replit validation remains release/batch deferred unless Wilson asks for PR-level mobile validation.
