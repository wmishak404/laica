# 2026-07-07 - Codex Phase 4 timer polish

## Summary

Branch `codex/init-001-phase4-timer-polish` continues INIT-001 Phase 4 from the merged PR #264 warm Live Cooking baseline. The slice makes Live Cooking timers a stable explicit-start five-minute control instead of a provider-duration suggestion, adds a minimizable active timer pill, and makes timer controls visible by default with an opt-out toggle beside CC. Wilson also asked to keep the app shell available on Ready Check, so this branch preserves the Prep Tray session until the guide actually starts and shows bottom nav before active cooking.

## Scope

- Timer controls remain explicit-start; step navigation clears timer state instead of carrying a running timer into the next step.
- Timer controls are visible by default and can be hidden from a compact clock toggle beside CC. The visible control shows `0:05:00` with circular play/pause and reset controls.
- Active timers can collapse to a compact time-only pill and expand back to pause/resume controls.
- Timer speech copy now uses singular/plural duration text correctly, such as `5 minutes`.
- Prep Tray selected-image loading now shows larger visible loading copy and a stable `Preview unavailable` fallback when the image resolver returns `status: unavailable`.
- Ready Check `Back to Planning` restores the Prep Tray / recipe-suggestion session instead of restarting planning. The planning session is dismissed only once `Start cooking` begins the active guide.
- Bottom nav remains visible on Ready Check per Wilson's explicit request, with additional Ready Check bottom padding so the fixed nav does not cover `Start cooking`; active hands-busy cooking still hides bottom nav.

## Non-Scope

- No provider response schema or `suggestedTimer` object.
- No route contract, durable cooking-session schema, Finish/History, assistance failure, formal eval, or Phase 5 cleanup changes.
- Durable navigation scope is limited to Wilson's explicit request to show existing bottom nav during Ready Check; the active guide remains focus-mode and hides it.
- No future voice-activity/glowing Ask a question affordance work.

## Validation

- `npx vitest run tests/unit/live-cooking-guest-session.test.tsx tests/unit/meal-planning.test.tsx tests/unit/planning-choice.test.tsx` passed: 92 tests.
- Earlier focused `npx vitest run tests/unit/live-cooking-guest-session.test.tsx` passed: 34 tests before the Ready Check/nav follow-up.
- `npm run check` passed.
- `npm run build` passed with existing stale Browserslist, Firebase dynamic/static import, and chunk-size warnings.
- `git diff --check` passed.

## Remaining Before Merge

- Push PR and wait for exact-head GitHub checks.
- Human Replit validation remains release/batch deferred unless Wilson asks for PR-level mobile validation.
