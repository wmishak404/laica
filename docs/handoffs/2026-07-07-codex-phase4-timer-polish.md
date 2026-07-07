# 2026-07-07 - Codex Phase 4 timer polish

## Summary

Branch `codex/init-001-phase4-timer-polish` continues INIT-001 Phase 4 from the merged PR #264 warm Live Cooking baseline. The slice turns existing step `duration` values into optional timer suggestions instead of preloaded timer state, adds a minimizable active timer pill, and suppresses timer suggestions for obvious prep-only work.

## Scope

- Timer suggestions remain opt-in; step navigation clears timer state instead of loading the next step's duration as if a timer already exists.
- Active timers can collapse to a compact time-only pill and expand back to pause/resume controls.
- Timer speech copy now uses singular/plural duration text correctly, such as `1 minute`.
- Obvious prep-only instructions such as chopping do not show timer suggestions even when a duration is present.

## Non-Scope

- No provider response schema or `suggestedTimer` object.
- No route contract, durable cooking-session schema, Finish/History, assistance failure, durable navigation, formal eval, or Phase 5 cleanup changes.
- No future voice-activity/glowing Ask a question affordance work.

## Validation

- `npx vitest run tests/unit/live-cooking-guest-session.test.tsx` passed: 34 tests.
- `npm run check` passed.
- `npm run build` passed with existing stale Browserslist, Firebase dynamic/static import, and chunk-size warnings.
- `git diff --check` passed.

## Remaining Before Merge

- Push PR and wait for exact-head GitHub checks.
- Human Replit validation remains release/batch deferred unless Wilson asks for PR-level mobile validation.
