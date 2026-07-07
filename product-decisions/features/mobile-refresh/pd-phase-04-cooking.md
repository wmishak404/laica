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
- Step guidance lives inside the cooking surface without naming it as a separate feed or chat area.
- Live Cooking should behave like a compact hands-busy cockpit: the current instruction, route through the recipe, contextual cues, optional timer, and repeat/ask/mute controls should be reachable with minimal scrolling on a phone.
- Transcript text is an opt-in closed-caption layer. By default, the cook should rely visually on the current step and step previews, not an always-open transcript panel.
- During active Live Cooking, request a screen wake lock when supported so dirty-handed cooks are not forced to unlock the phone mid-step.
- Voice is tap-to-talk in v1. Realtime voice-agent cooking is deferred.

### Cooking guidance philosophy

- Cues over clocks: visual, aroma, sound, texture, and doneness cues should be central.
- Time appears only when it meaningfully helps.
- Safety and common-mistake notes should be brief and contextual.

### Live-cooking error posture

- Active cooking errors render inline inside the cooking surface, not as transient toasts.
- If cooking-step generation fails, show a calm inline recovery state with retry and a practical fallback path.
- Generated cooking steps are usable only when at least one step has a non-empty, cookable instruction. Empty arrays, blank instructions, whitespace-only instructions, or placeholder text must stay in recovery rather than rendering Step 1.
- The new Phase 4 cooking flow must not start, restore as ready, or save a cooking session from invalid generated steps. Recovery into the live guide may happen after a user-invoked retry or another validated regeneration path, but not by silently substituting an unverified or generic step list.
- If cooking assistance fails mid-step, keep the current step visible and show the failure in the inline guidance/caption area.
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

### Speech arbitration and transcript fidelity

Speech behavior is part of the cooking guide's user value, not a background implementation detail. The user goal is calm hands-busy guidance: the cook hears the thing they are currently looking at or asking for, and stale audio never competes with the current step, mute state, or recording.

Before any Phase 4 speech/audio branch is merge-ready, it must classify and test the speech action matrix below. Locally deterministic cases should become Vitest or Playwright assertions; real-device/provider confidence can remain a named Replit/mobile speech-smoke lane when browser permissions, device audio, or live provider quality matter.

| Case | User value protected | Expected behavior | Minimum evidence before merge |
|---|---|---|---|
| Initial step after welcome/setup | The cook starts with the actual first instruction, not only a generic welcome. | After guide setup, Step 1 audio plays once and matches the visible transcript. | Local unit/component test for Step 1 speech request payload; Replit/mobile smoke when changing autoplay/permission behavior. |
| Next / Previous while audio is playing | The cook can advance without old guidance talking over the current step. | Navigation stops active and pending old audio, then speaks the new step transcript. | Unit test that interrupts active playback and late synthesis, plus transcript payload assertion. |
| Another speech-bearing action starts | Only the current requested guidance should be heard. | Repeat Step, timer completion, assistance response, or any future speech action cancels earlier active/pending speech before starting its own. | Unit tests for one shared speech-arbitration path, not one-off button fixes. |
| Ask a question | Voice input should not be contaminated by Laica talking. | Starting recording stops current/pending speech before microphone capture begins; late synthesis from the interrupted speech is ignored. | Unit test for stop-before-recording and late response invalidation; Replit smoke for real microphone permission/audio as needed. |
| Back / Finish / unmount / route exit | Audio must not continue after leaving the cooking surface. | Exit stops playback, queued synthesis, retry timers, recording, and late async responses. | Existing PR #191 Back/late-synthesis regression plus equivalent coverage for Finish/unmount when those paths change. |
| Mute pressed | Mute means quiet now, not after the current request finishes. | Muting stops active and pending speech immediately, blocks late synthesis playback, and leaves recording state explicit. | Unit test for active playback, scheduled speech, and in-flight synthesis cancellation. |
| Mute persists across steps | The user stays in control after muting. | Navigating steps while muted updates transcript/UI but does not auto-start audio. | Unit/component test for muted step navigation. |
| Unmute | Turning audio back on should not surprise the cook. | Unmuting does not auto-play stale or current text; speech resumes only after an explicit action such as Repeat Step or new step action. | Unit/component test for unmute-no-autoplay and Repeat Step opt-in. |
| Transcript fidelity | The cook should be able to read and hear the same guidance. | The exact visible transcript text is what speech synthesis receives, after any intentional normalization documented in the component contract. | Unit assertion on synthesized text for step, repeat, timer, and assistance response. |
| Rapid repeated actions | Fast taps should settle on one current instruction. | Rapid Next/Previous/Repeat actions cancel older speech requests and only the last requested transcript can play. | Unit test using fake timers and late promise resolution. |
| Timer completion during speech | Time-sensitive alerts should not layer over stale step audio. | Timer completion interrupts current guidance and speaks the timer alert once, or records an explicit no-audio decision if muted. | Unit test for timer alert arbitration. |

### 2026-06-17 - Audio lifecycle cleanup slice

[PR #191](https://github.com/wmishak404/laica/pull/191) merged as `104ee0c` on 2026-06-20 and implements the first narrow Phase 4 runtime slice for the Replit-observed speech-leak issue and Wilson's follow-up speech-action matrix. Back to Planning, Finish, and unmount share a cleanup path that clears delayed speech, clears mobile audio retry timers, stops current audio/browser speech synthesis, invalidates late ElevenLabs synthesis responses before playback, and cancels active voice recording without processing abandoned audio chunks. Existing Live Cooking speech controls now share a current-request arbitration token so Step navigation, Repeat Step, timer messages, Ask for Help, Mute, Unmute, and rapid repeated actions cannot leave stale audio playing over the current visible/requested transcript.

Wilson's follow-up review expanded the merge acceptance surface from the original exit bug to the full speech-arbitration matrix above. PR #191 converted those matrix cases for current Live Cooking speech behavior into passing deterministic assertions in `tests/unit/live-cooking-guest-session.test.tsx`. Wilson manually passed the 12-case Replit speech matrix at PR head `1bc9221`, including Back to Planning cleanup, step interruption, competing speech actions, hard refresh/mute/help coverage, mute persistence, unmute-no-autoplay, Repeat Step restart, rapid actions, and transcript fidelity. After a docs/workflow-only rebase, exact-head GitHub `unit` and `e2e_guest_smoke` passed at `b2e6f54` before merge. The default local dotenvx DB drift remains routed through ADR-0001 / EFF-017 rather than a PR #191 product bug. This merged slice does not widen Phase 4 into Ready Check, step guidance, timer redesign, inline AI recovery, Finish/history semantics, provider prompts, schema changes, or Phase 5 cleanup; it clarifies what "speech works" means for the existing Live Cooking controls.

### 2026-06-25 - Inline recovery and Finish contract slice

PR #236 (`codex/init-001-cooking-step-recovery`) began as the next bounded Phase 4 runtime slice. The branch makes current Live Cooking more honest when cooking-step generation fails or returns an empty step array: the cook stays in an inline recovery panel with `Try again`, `Use basic steps`, and `Back to Planning` instead of silently dropping into generic fallback instructions. The backup path remains available, but only after the cook chooses it and sees that it is intentionally generic.

The same slice corrects the existing Finish contract for current Live Cooking controls. The final-step action is reachable as `Finish`; linked completion sends no hidden default `5` rating or invented `userNotes`; linked success copy uses the accepted Phase 4 language (`Nice, dinner's ready.`, `Saved to your cooking history.`, `Pantry cleanup comes next.`); and guest completion continues to avoid durable history. This does not implement Ready Check, step-guidance redesign, timer redesign, provider prompt changes, schema changes, pantry cleanup state, taste memory, or full Phase 5 post-cook flow.

Focused local coverage in `tests/unit/live-cooking-guest-session.test.tsx` now proves failed step generation stays inline and retryable, generic backup steps require explicit user choice, and linked Finish omits invented rating/notes while using the accepted history/cleanup copy. The full Phase 4 revamp must tighten this further by treating blank, whitespace-only, or otherwise non-cookable generated instructions as failed generation before any live guide/session state is created. Replit/manual validation remains useful before broader Phase 4 closeout if later work changes real provider behavior, device audio, microphone permissions, cooking-session persistence, or Finish-to-Phase-5 semantics.

Wilson approved the small-win merge on 2026-06-29 so the silent generic fallback would stop shipping while the broader Phase 4 revamp remains planned. PR #236 was rebased over PR #235 and PR #232 closeout, exact-head GitHub `unit`, `e2e_guest_smoke`, `npm-audit`, `trufflehog_pr`, and CodeQL passed at `3053faa`, and the branch squash-merged as `f3e886b`. Human Replit validation was deferred to the next production/release batch. That batch should include a changed-since-last-prod focused smoke for current Live Cooking: normal generated steps still load, an induced `/api/cooking/steps` network failure shows inline recovery rather than generic steps, `Try again` can recover after the failure is removed, `Use basic steps` remains clearly labeled as generic, and linked Finish copy still avoids rating and pantry-update claims.

### 2026-07-06 - Generated-step validation slice

[PR #256](https://github.com/wmishak404/laica/pull/256) merged as `f40cb1c` on 2026-07-06. It tightens the PR #236 recovery contract so blank, whitespace-only, and obvious placeholder generated instructions do not start or restore a Live Cooking guide and do not create a linked cooking session. When every generated instruction is unusable, the existing inline recovery panel remains the user-visible state; the generic backup guide still requires an explicit `Use basic steps` choice.

The slice routes both fresh provider output and browser-local restored step trays through the same sanitizer, so stale placeholder local state cannot bypass regeneration. Focused local coverage in `tests/unit/live-cooking-guest-session.test.tsx` proves linked sessions are not started from placeholder output and saved placeholder trays regenerate instead of rendering as Step 1.

This does not change the cooking-step prompt, provider behavior, route schema, Ready Check, step-guidance visual refresh, timer redesign, speech/audio arbitration, durable History semantics, Phase 5 cleanup state, or the current basic-backup copy. Exact-head GitHub `unit`, `e2e_guest_smoke`, `npm-audit`, `trufflehog_pr`, and CodeQL passed at `bb98cf8` before merge. Human Replit validation remains release/batch scope unless later work changes real provider behavior, device audio, microphone permissions, cooking-session persistence, or Finish-to-Phase-5 semantics.

## 2026-07-07 Ready Check slice

[PR #258](https://github.com/wmishak404/laica/pull/258) merged the Ready Check slice as `496731c` on 2026-07-07. It starts the broader Phase 4 mobile refresh by putting a user-controlled Ready Check before new Live Cooking step generation. New sessions now check for a valid saved guide first, then show Ready Check instead of calling `/api/cooking/steps` on mount. Valid restored guides still resume directly into the step tray, while invalid saved placeholder guides stay out of Step 1 until the cook explicitly starts and receives newly validated steps.

This slice implemented the first two Ready Check acceptance items without pulling in the rest of the Phase 4 redesign: new cooking sessions wait for an explicit start, and optional missing/skipped ingredients are sent through the client helper, `/api/cooking/steps` schema, `getCookingSteps` prompt context, and AI interaction log. The compact step-guidance cockpit, timer redesign, pinned-step visual overhaul, full provider schema shape, Finish-to-Phase-5 cleanup state, and human Replit validation remain outside this narrow branch.

Local evidence for the branch included focused Vitest coverage for Ready Check gating, guest/linked session boundaries, invalid-step recovery, and route schema plumbing; full `npm run test:unit`; `npm run check`; `npm run build`; and `git diff --check`. Exact-head GitHub `unit`, `e2e_guest_smoke`, `npm-audit`, `trufflehog_pr`, and CodeQL passed at validated head `8529878` before merge; `trufflehog_push` skipped as expected. Local Playwright E2E was not run because the worktree did not have `.env.keys` or a configured `LAICA_LOCAL_SANDBOX_DATABASE_URL`. Human Replit validation remains release/batch scope per EFF-017 and the testing workflow.

## 2026-07-07 Live Cooking cockpit slice

Branch `codex/init-001-phase4-step-coach` continues Phase 4 from fresh `origin/main` after PR #258 and its closeout. Wilson's 2026-07-07 UX review corrected the original plan: do not name the guidance area "Coach Feed"; keep typography aligned with earlier Laica planning/setup surfaces; make the live guide fit mostly in one mobile screen; use one Ready Check start action instead of `Cook anyway` / `Cook silently`; place `Repeat`, `Ask a question`, and audio mute controls in a sticky bottom command bar; make transcript text opt-in behind an icon-like CC toggle; show `Step X of N` with action-forward dot-node step previews; keep timers optional; remove routine `minor` safety badges from the step card; and prevent screen sleep during active Live Cooking when the browser supports it.

The revised branch turns the active cooking guide from the old dark centered card into a compact hands-busy cockpit. The current instruction is the sticky top-panel headline, a horizontal dot rail previews the cook's route through the recipe with action labels such as `Boil Water` instead of raw leading words like `Bring 4 Cups`, contextual `Look for` / `Pro tip` / `Avoid` cues stay compact beneath it, captions default hidden behind a CC icon button, and taller repeat/ask/mute controls remain anchored at the bottom. The adjacent preparing-guide and step-recovery panels still use tokenized focus-mode surfaces so generation, retry, and backup paths no longer visually fall back to the pre-refresh dark treatment.

This slice is visual/structural and preserves PR #191 speech arbitration, PR #236 recovery/Finish behavior, PR #256 invalid-step validation, and PR #258 Ready Check entry. It does not change cooking-step prompts, route schema, provider output, Finish/History semantics, Phase 5 cleanup state, or durable navigation. It only makes the existing timer presentation more compact/optional and requests a best-effort browser screen wake lock during the live guide. Local evidence includes focused Live Cooking Vitest coverage for the compact cockpit, opt-in captions, step preview strip, and existing speech/session/recovery baselines; full exact-head validation remains required before merge.

## Acceptance Criteria

- Ready Check appears before Step 1.
- Ready Check has one primary `Start cooking` action; acknowledged missing/skipped ingredients still pass into cooking-step generation so the model can adapt.
- Current step remains pinned with the actual instruction as the headline while the user moves through guidance.
- Live Cooking uses the existing Laica planning/setup typography tone.
- The guidance area has no user-facing "Coach Feed" label and does not look like a generic chat/feed window.
- Step progress includes dot nodes and short action-forward preview labels for each step.
- Routine `minor` safety badges are not shown as a persistent status chip.
- Repeat step instruction, Ask a question, and audio mute controls are taller icon-over-label buttons anchored in a bottom command bar, with Ask a question centered.
- Transcript text is hidden by default and appears only when the icon-like CC caption toggle is enabled.
- Active Live Cooking requests a screen wake lock when supported by the browser and releases it when the guide exits or the page hides.
- Model steps include sensory cues where applicable.
- Suggested timers appear only on timer-worthy steps and never auto-start.
- Active timer can be minimized without hiding the step.
- Finish creates or updates cooking history but does not change pantry inventory.
- Guest Finish never creates durable cooking history unless the user has linked Google first.
- Completion sends no hidden `5` rating when the user has not rated.
- Cooking assistance route is authenticated, rate-limited, and prompt-injection guarded.
- Cooking-step generation failure has an inline retry/recovery state.
- Cooking-step generation validates output before entering the live guide: empty arrays, blank instructions, whitespace-only instructions, and non-cookable placeholder text are treated as recovery states, not as usable steps.
- Step-generation recovery into Live Cooking is explicit and evidence-backed: retry or regeneration must produce a validated usable guide before the app starts/saves a cooking session; the generic backup guide remains a clearly labeled user choice, not silent self-recovery.
- Cooking-assistance failure appears in the relevant inline guidance/caption area, not only in a toast.
- Persistent live-cooking failures offer inline Feedback access.
- No live-cooking failure hides the pinned current step or leaves the cook without a next action.
- Live-cooking errors follow EFF-018 status classification and copy principles.
- Pressing Back to Planning, Finish, sign-out, browser back, or otherwise leaving the cooking guide stops active voice playback, cancels queued synthesis/recording work, and prevents audio from continuing after the cooking UI has exited. The Back/late-synthesis path is covered in `tests/unit/live-cooking-guest-session.test.tsx`, and Wilson manually passed Back-to-Planning cleanup in Replit at PR head `1bc9221`; Replit/mobile speech smoke remains useful before broader Phase 4 closeout when later Phase 4 work changes device audio, microphone permission, or provider quality.
- Live Cooking speech arbitration follows the matrix above: the currently visible or requested transcript owns audio playback, new speech-bearing actions interrupt old active/pending speech, mute is immediate and persistent across steps, unmute does not auto-play until an explicit speech action, and synthesized speech receives the exact visible transcript text unless a documented normalization rule says otherwise.

## Effort Interactions

- PD-005 / `design_guidelines.md`: Establishes the Warm Focus cooking surface and avoids generic AI-chat styling.
- [Testing and Acceptance Workflow](../../../docs/workflows/testing-and-acceptance.md): Requires Replit smoke for cooking-session persistence and speech routes.
- EFF-017: Keeps Phase 4 evidence honest by separating exact-head GitHub CI/E2E from local sandbox DB setup and release/batch Replit validation.
- EFF-018: Provides shared authenticated AI error classification and non-demo copy; Phase 4 owns live-cooking presentation, retry, and Feedback placement.
- INIT-003 Plan B: Public guest entry may ship before full Phase 4, so Phase 4 must preserve the linked-vs-guest memory boundary introduced by the homepage.

## Backend Notes

- Cooking steps should return structured sensory guidance and optional timer metadata.
- Tap-to-talk assistance should use the cross-phase voice context allowlist.
- Session completion must set up Phase 5 cleanup state instead of writing `pantryIngredients`.
