# Mobile Refresh Phase 4 — Cooking Guidance

**Status:** Accepted
**Document kind:** Feature Phase Record
**Phase owner:** Wilson
**Date:** 2026-04-28
**Initiative:** [INIT-001 — Mobile Refresh](../../../initiatives/INIT-001-mobile-refresh.md)
**Mockup:** [phase-04-cooking.png](../../../docs/assets/mobile-refresh/phase-04-cooking.png)

## Goal

Turn cooking into a calm, hands-free-biased guide that prioritizes sensory cues over generic timers or chat.

## Decisions

### Flow shape

- Start with a quick Ready Check for ingredients, equipment, audio, and stove/heat readiness.
- Current step is pinned, large, and always visible.
- Coach Feed lives below the pinned step and provides focused guidance, not generic chat.
- Voice is tap-to-talk in v1. Realtime voice-agent cooking is deferred.

### Cooking guidance philosophy

- Cues over clocks: visual, aroma, sound, texture, and doneness cues should be central.
- Time appears only when it meaningfully helps.
- Safety and common-mistake notes should be brief and contextual.

### Live-cooking error posture

- Active cooking errors render inline inside the cooking surface, not as transient toasts.
- If cooking-step generation fails, show a calm inline recovery state with retry and a practical fallback path.
- If cooking assistance fails mid-step, keep the current step visible and show the failure in the Coach Feed area.
- Feedback appears as an inline action in the cooking display when the issue persists, not as a toaster CTA.
- Error copy follows EFF-018 principles: first person, plain English, no user blame, and `Laica` casing.

### Timer behavior

- Timers never auto-start.
- Timer suggestions appear only when needed.
- Active timer is a compact detachable/minimizable pill that does not obscure the current step.
- A timer-worthy step has a clear start point, useful duration, meaningful consequence if missed, and still includes sensory cues.
- No timer for vague prep work such as chopping, seasoning, or "until fragrant" unless the model can provide a useful cue and duration.

Suggested timer shape:

```ts
suggestedTimer?: {
  durationSeconds: number;
  label: string;
  kind: "passive" | "active" | "resting" | "safety";
  reason: string;
}
```

### Finish behavior

- Finish copy: "Nice, dinner's ready.", "Saved to your cooking history.", "Pantry cleanup comes next."
- Completion saves cooking history.
- Completion does not mutate pantry.
- Do not save a hidden default 5-star rating.
- Phase 5 owns pantry cleanup.

### INIT-003 public homepage overlap

- The new pre-auth homepage promises cooking guidance to prospective users; Phase 4 remains the implementation home for fulfilling that promise in the linked-account cooking flow.
- Guest cooking must not silently create durable cooking history or Phase 5 cleanup state. If a guest reaches a cooking completion moment before durable guest promotion exists, the UI must require Google linking or show a clear local-only boundary.
- Finish copy may need linked-vs-guest variants. Linked users can see durable-history language; guests should not see copy that implies saved history, cleanup memory, taste memory, or retention.

### Audio lifecycle

- Leaving the cooking guide must stop any active speech playback, queued speech synthesis, recording, or hands-busy audio work.
- Back-to-planning, Finish, sign-out, route changes, and component unmounts must share the same cleanup path so audio cannot continue after the cooking surface exits.
- This cleanup applies to linked and anonymous cooking sessions. Guest mode makes the flow easier to automate, but it should not get a weaker audio lifecycle than linked-account cooking.

### 2026-06-17 - Audio lifecycle cleanup slice

[PR #191](https://github.com/wmishak404/laica/pull/191) / `codex/init-001-cooking-audio-cleanup` implements the first narrow Phase 4 runtime slice for the Replit-observed speech-leak issue. Back to Planning, Finish, and unmount now share a cleanup path that clears delayed speech, clears mobile audio retry timers, stops current audio/browser speech synthesis, invalidates late ElevenLabs synthesis responses before playback, and cancels active voice recording without processing abandoned audio chunks.

This slice intentionally does not implement the broader Phase 4 cooking redesign: Ready Check, Coach Feed, timer redesign, inline AI recovery, Finish/history semantics, provider prompts, schema changes, and Phase 5 cleanup remain future Phase 4/5 work.

## Acceptance Criteria

- Ready Check appears before Step 1.
- "Cook anyway" passes acknowledged missing ingredients into cooking-step generation so the model can adapt.
- Current step remains pinned while the user scrolls guidance.
- Coach Feed is contextual and does not look like a generic chat window.
- Model steps include sensory cues where applicable.
- Suggested timers appear only on timer-worthy steps and never auto-start.
- Active timer can be minimized without hiding the step.
- Finish creates or updates cooking history but does not change pantry inventory.
- Guest Finish never creates durable cooking history unless the user has linked Google first.
- Completion sends no hidden `5` rating when the user has not rated.
- Cooking assistance route is authenticated, rate-limited, and prompt-injection guarded.
- Cooking-step generation failure has an inline retry/recovery state.
- Cooking-assistance failure appears in Coach Feed or the relevant inline guidance area, not only in a toast.
- Persistent live-cooking failures offer inline Feedback access.
- No live-cooking failure hides the pinned current step or leaves the cook without a next action.
- Live-cooking errors follow EFF-018 status classification and copy principles.
- Pressing Back to Planning, Finish, sign-out, browser back, or otherwise leaving the cooking guide stops active voice playback, cancels queued synthesis/recording work, and prevents audio from continuing after the cooking UI has exited. The Back/late-synthesis path is covered in `tests/unit/live-cooking-guest-session.test.tsx`; Replit/mobile speech smoke remains useful before broader Phase 4 closeout.

## Effort Interactions

- PD-005 / `design_guidelines.md`: Establishes the Warm Focus cooking surface and avoids generic AI-chat styling.
- [Testing and Acceptance Workflow](../../../docs/workflows/testing-and-acceptance.md): Requires Replit smoke for cooking-session persistence and speech routes.
- EFF-018: Provides shared authenticated AI error classification and non-demo copy; Phase 4 owns live-cooking presentation, retry, and Feedback placement.
- INIT-003 Plan B: Public guest entry may ship before full Phase 4, so Phase 4 must preserve the linked-vs-guest memory boundary introduced by the homepage.

## Backend Notes

- Cooking steps should return structured sensory guidance and optional timer metadata.
- Tap-to-talk assistance should use the cross-phase voice context allowlist.
- Session completion must set up Phase 5 cleanup state instead of writing `pantryIngredients`.
