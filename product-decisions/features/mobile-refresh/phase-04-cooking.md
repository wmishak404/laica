# Mobile Refresh Phase 4 — Cooking Guidance

**Status:** Accepted
**Phase owner:** Wilson
**Date:** 2026-04-28
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

## Acceptance Criteria

- Ready Check appears before Step 1.
- "Cook anyway" passes acknowledged missing ingredients into cooking-step generation so the model can adapt.
- Current step remains pinned while the user scrolls guidance.
- Coach Feed is contextual and does not look like a generic chat window.
- Model steps include sensory cues where applicable.
- Suggested timers appear only on timer-worthy steps and never auto-start.
- Active timer can be minimized without hiding the step.
- Finish creates or updates cooking history but does not change pantry inventory.
- Completion sends no hidden `5` rating when the user has not rated.
- Cooking assistance route is authenticated, rate-limited, and prompt-injection guarded.

## Epic Interactions

- EPIC-001: Establishes the Warm Focus cooking surface and avoids generic AI-chat styling.
- EPIC-005: Requires Replit smoke for cooking-session persistence and speech routes.

## Backend Notes

- Cooking steps should return structured sensory guidance and optional timer metadata.
- Tap-to-talk assistance should use the cross-phase voice context allowlist.
- Session completion must set up Phase 5 cleanup state instead of writing `pantryIngredients`.
