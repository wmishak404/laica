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

- Failures that block cooking flow should have a visible recovery state near the affected control or surface. This does not mean technical/system failures belong inside the recipe step text or assistant guidance.
- If cooking-step generation fails, show a calm inline recovery state with retry and a practical fallback path.
- Generated cooking steps are usable only when at least one step has a non-empty, cookable instruction. Empty arrays, blank instructions, whitespace-only instructions, or placeholder text must stay in recovery rather than rendering Step 1.
- The new Phase 4 cooking flow must not start, restore as ready, or save a cooking session from invalid generated steps. Recovery into the live guide may happen after a user-invoked retry or another validated regeneration path, but not by silently substituting an unverified or generic step list.
- If cooking assistance fails mid-step, keep the current step visible and show the failure in a separate voice-help status area, not in the step guidance. Do not route technical failure copy through the normal assistant-guidance speech path.
- For this assistance-failure slice, "fails" means the Ask-a-question pipeline cannot produce a valid assistance answer because of a technical or quota condition: microphone capture is unavailable or denied, recording hits the safety timeout, local voice usage limits are exceeded, transcription upload/service returns an error or blank transcript, `/api/cooking/assistance` returns rate-limit/service/network/unknown failure, or the assistance route returns no usable answer. It does not mean a successful user question, a successful assistant answer, user correction, preference change, or future intentional recipe/step adaptation.
- Feedback appears as an inline action in the cooking display when the issue persists, not as a toaster CTA.
- Error copy follows EFF-018 principles: first person, plain English, no user blame, and `Laica` casing.

### Timer behavior

- Timers never auto-start.
- Timer controls appear automatically only for timer-worthy steps, but the cook must explicitly start them.
- Active timer controls stay visible together and do not obscure the current step.
- A timer-worthy step has a clear start point, useful duration, meaningful consequence if missed, and still includes sensory cues.
- No timer for vague prep work such as chopping, seasoning, or "until fragrant" unless the model can provide a useful cue and duration.
- Current accepted runtime from PR #269 uses the existing step `duration` plus obvious text-derived timing such as `cook 1-2 minutes`; it does not add or require a separate provider `suggestedTimer` object.
- A richer timer metadata object with kind/reason remains future schema work and should not be treated as shipped Phase 4 behavior.

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

[PR #260](https://github.com/wmishak404/laica/pull/260) merged the compact Live Cooking cockpit slice as `72df557` on 2026-07-07 from fresh `origin/main` after PR #258 and its closeout. Wilson's 2026-07-07 UX review corrected the original plan: do not name the guidance area "Coach Feed"; keep typography aligned with earlier Laica planning/setup surfaces; make the live guide fit mostly in one screen; use one Ready Check start action instead of `Cook anyway` / `Cook silently`; place `Repeat`, `Ask a question`, and audio mute controls in a sticky bottom command bar; make transcript text opt-in behind an icon-like CC toggle; show `Step X of N` with action-forward dot-node step previews; keep timers optional; remove routine `minor` safety badges from the step card; and prevent screen sleep during active Live Cooking when the browser supports it.

Wilson's Replit QA pass on the cockpit branch added two product findings. First, the active cooking shell is still a functional foundation rather than final visual design: the background currently reads plain white compared with the warmer coral/rust setup and planning flow, so a later visual polish pass must decide the durable warm cooking surface. Second, Live Cooking steps must be glanceable actions, not recipe paragraphs. When provider output combines prep, heating, adding, and cooking into one blob, the correct fix is to generate more atomic steps and render any remaining multi-sentence instruction as separated detail lines rather than treating the paragraph as one mobile headline. Wilson's follow-up examples make action-label clarity a prompt/runtime acceptance rule and an INIT-004 eval candidate: `Boil Water` is correct where `Bring 4 Cups` is clipped, `Cook Leek & Spinach` is better than `Heat Oil Butter` when the step is really cooking vegetables, `Push Vegetables Aside` is required instead of the ungrammatical `Push Vegetables Side`, and `Add Cold Rice` / `Add Rice` is required instead of `Add Cold Cooked`. Repeating `Cook Vegetables` for multiple later fried-rice steps also fails the quick-recall purpose; labels must distinguish the milestone, such as adding rice, mixing fried rice, seasoning, or serving.

The revised branch turns the active cooking guide from the old dark centered card into a compact hands-busy cockpit. The current step uses a short action label as the sticky headline when the provider supplies one or when the instruction is too paragraph-like, with separated detail lines underneath. A horizontal dot rail previews the cook's route through the recipe with action labels such as `Boil Water` instead of raw leading words like `Bring 4 Cups`, contextual `Look for` / `Pro tip` / `Avoid` cues stay compact beneath it, captions default hidden behind a CC icon button, and taller repeat/ask/mute controls remain anchored at the bottom. The adjacent preparing-guide and step-recovery panels still use tokenized focus-mode surfaces so generation, retry, and backup paths no longer visually fall back to the pre-refresh dark treatment.

This slice preserves PR #191 speech arbitration, PR #236 recovery/Finish behavior, PR #256 invalid-step validation, and PR #258 Ready Check entry. It does not change route schema, durable session schema, Finish/History semantics, Phase 5 cleanup state, or durable navigation. It does add a narrow cooking-step prompt refinement: each provider step should be one cookable action or milestone and may include `actionLabel` for the rail/mobile headline. The client accepts that optional field and has a compatibility fallback for older saved/provider steps. It also makes the existing timer presentation more compact/optional and requests a best-effort browser screen wake lock during the live guide. Local evidence included focused Live Cooking Vitest coverage for the compact cockpit, opt-in captions, action labels, multi-line instruction fallback, step preview strip, and existing speech/session/recovery baselines; exact-head GitHub `unit`, `e2e_guest_smoke`, `npm-audit`, `trufflehog_pr`, and CodeQL passed at `0040f9f` before merge. Human Replit validation remains deferred to the next production/release batch.

## 2026-07-07 warm cooking-surface polish merged

[PR #264](https://github.com/wmishak404/laica/pull/264) (`codex/init-001-live-cooking-warm-polish`) started from `origin/main` `3d33239` after the PR #260 closeout and merged as `fc07c1b` on 2026-07-07. It addresses Wilson's remaining visual finding without reopening the cockpit behavior. The slice gives Ready Check, preparing/recovery, the active step card, preview rail, compact cues, captions, and bottom command bar a scoped `live-cooking-ui` warm focus-mode surface using setup/planning-adjacent cream, coral, rust, teal, herb, and butter tokens. It intentionally keeps the compact cockpit structure from PR #260: one `Start cooking`, sticky action headline, action-forward preview rail, compact cues, opt-in CC captions, bottom Repeat / Ask a question / Audio controls, screen wake lock, and existing timer behavior.

Implementation guardrail: the warm classes are scoped as `.live-cooking-ui .live-cooking-*` so they beat shadcn `Card` default `bg-card` / `border` utilities in computed style. This follows PD-005's rendered-style rule; matching class names alone are not accepted as visual proof when primitive utilities can win the cascade. The merged slice does not change route contracts, provider response schema, durable cooking-session schema, Finish/History semantics, assistance failure handling, durable navigation, formal INIT-004 eval work, full timer redesign, or Phase 5 cleanup.

Local evidence: focused `npx vitest run tests/unit/live-cooking-guest-session.test.tsx` passed with 31 tests before prompt tightening and asserted the scoped warm root, step card, guidance panel, preview card, and command bar classes. Focused `npx vitest run tests/unit/cooking-steps-prompt.test.ts tests/unit/live-cooking-guest-session.test.tsx` passed with 32 tests after prompt tightening. Full `npm run test:unit` passed before prompt tightening; `npm run check`, `npm run build`, and `git diff --check` passed after prompt tightening. Build retained the existing stale Browserslist, Firebase dynamic/static import, and bundle-size warnings. A local Playwright mobile visual smoke at `390x844` used provider-light route stubs and a stubbed `/api/auth/session` because the decrypted local DB still lacks `anonymous_recipe_usage`; it captured `/tmp/laica-live-cooking-ready-warm-polish-clean.png` and `/tmp/laica-live-cooking-active-warm-polish-clean.png`. Computed styles confirmed the root warm gradient (`rgb(255, 249, 240)` to `rgb(252, 239, 222)`), warm step-card gradient, active preview coral background/border, warm command bar, Nunito font, and active-screen `scrollHeight: 844` matching the `844` viewport height. Exact-head GitHub `unit`, `e2e_guest_smoke`, dependency audit, and secret scan passed at PR head `a180b32`; CodeQL was not surfaced in the final connector check and is not claimed as final evidence. Wilson's Replit pass was a light skim only; full human regression remains deferred to production/release-batch validation.

Wilson's Replit follow-up on the same branch found two additional step-preview prompt failure modes: `Prep Leek` should be `Prep Leeks` when the cook is handling multiple leeks, and a final off-heat / green-onion / serve step should be labeled `Garnish` or `Garnish & Serve`, not stale generic `Cook Vegetables`. PR #264 tightens the cooking-step user prompt so action labels preserve plural ingredient grammar and final garnish/serve semantics outrank generic ingredient-bucket labels. This prompt change does not change the route contract, response schema, client fallback/eval harness, or durable session storage.

## 2026-07-07 timer polish branch

[PR #269](https://github.com/wmishak404/laica/pull/269) merged as `c6091b9` on 2026-07-08 PT / 2026-07-09 UTC from final PR head `b0bdc9a`. Branch `codex/init-001-phase4-timer-polish` implemented the first bounded timer redesign without changing provider schema: Live Cooking shows a stable explicit-start timer control using the current recipe step's real `duration` instead of preloading active timer state or exposing provider-duration suggestions as separate cards. Navigating steps clears timer state, and the visible timer shows the step duration in `H:MM:SS` format with a centered larger clock plus persistent circular play/pause and reset controls. Timer controls appear automatically for duration-bearing steps and for explicit time language such as `cook 1-2 minutes`; durationless steps do not invent a fallback timer. The old separate timer visibility toggle is removed, leaving CC as the compact guidance-panel toggle. When captions are open, the transcript and boxed circular CC button share one row to reduce wasted vertical space. The action-forward step preview rail scrolls the active preview card into view as the cook advances, so later steps are not stranded off-screen while the rail remains at the first cards; when the rail has hidden content to the left or right, a small bottom-floating return control appears only on that side and snaps back to the current step. Timer speech copy now handles singular/plural duration text.

Wilson's 2026-07-08 Replit timer run clarified the completion contract: CC remains a voice/transcript affordance and should not become the general timer-notification surface. When a countdown reaches zero, the timer control itself must show an independent visible completion state such as `Time's up`, even if speech synthesis is unavailable or captions are hidden. The timer may still send the same completion text through the speech/transcript path when voice is available, but visual timer completion is required on its own.

Wilson's Replit review at PR head `3849c846` added a Ready Check app-shell follow-up that belongs in this same PR: Prep Tray selected-image loading now includes larger visible copy plus a stable `Preview unavailable` fallback when the resolver returns `status: unavailable`; Ready Check `Back to Planning` preserves and restores the Prep Tray / recipe suggestions instead of restarting planning; and the existing bottom nav remains visible on Ready Check per Wilson's explicit request, with active hands-busy cooking still hiding it. The planning session is dismissed only after `Start cooking` begins the active guide.

Wilson's 2026-07-08 Replit smoke also showed speech synthesis exhausting the old user quota during heavy Live Cooking testing. The branch raises only the speech synthesis user fallback limits from `30/hour` and `120/day` to `90/hour` and `360/day`, preserving Replit/env overrides and the broader `/api` abuse limiter as separate protections.

The branch intentionally does not add `suggestedTimer` schema, timer kinds/reasons, provider prompt changes, route contracts, durable cooking-session schema changes, assistance failure handling, Finish/History semantics, formal eval work, or Phase 5 cleanup. Durable navigation scope is limited to showing the existing bottom nav on Ready Check. Focused local evidence includes `npx vitest run tests/unit/live-cooking-guest-session.test.tsx tests/unit/meal-planning.test.tsx tests/unit/planning-choice.test.tsx --testTimeout=15000`, `npx vitest run tests/unit/rate-limit.test.ts`, `npm run check`, `npm run build`, and `git diff --check`; the later step-preview overflow affordance added focused Live Cooking coverage at 41 tests. Exact-head GitHub `unit`, `e2e_guest_smoke`, `npm-audit`, `trufflehog_pr`, CodeQL, and Analyze checks passed at final PR head `b0bdc9a`. Chrome-extension Replit smoke passed at that head without Replit Agent and covered the intended and negative behaviors for Prep Tray loading, Ready Check navigation/nav, CC persistence/layout, durationless-step timer absence, real/text-derived timer presence, start/pause/reset, visible `Time's up`, timer clearing on Next, and rail follow/overflow-return. Full production/release-batch regression remains deferred and should include the timer, compact CC row, visible `Time's up` state, raised speech quota after server restart, step-preview rail follow/overflow-return behavior on a long recipe, Prep Tray image fallback, and Ready Check navigation/nav behavior.

## 2026-07-09 / 2026-07-10 assistance failure inline recovery merged

[PR #275](https://github.com/wmishak404/laica/pull/275) merged as `148c881` on 2026-07-10 from final PR head `eb364ee`. It implements the accepted Phase 4 criterion that cooking-assistance failures must have a visible recovery path without polluting the cooking step itself. When microphone access, recording/transcription, usage limits, empty assistance responses, or `/api/cooking/assistance` failures interrupt `Ask a question`, Live Cooking now shows a warm voice-help status panel outside the Step guidance area, keeps the pinned current step visible, and keeps the bottom `Ask a question` control available for retry. The failure copy is status copy only; it is not played as cooking guidance.

The precise scope is non-recipe-changing technical failure states: unavailable/denied microphone capture, recording safety timeout, local voice usage-limit exhaustion, failed or blank transcription, assistance-route rate limiting, assistance-route service/network/unknown failures, and empty assistance answers. Successful Ask-a-question responses are not treated as errors by this slice; future R&D may intentionally let successful questions revise or adapt live cooking steps under a separate product contract.

The slice reuses the existing AI error classifier for assistance-route failures and keeps the status copy direct: the cook can keep following the unchanged cooking guide and try asking again when ready. Retrying clears the separate voice-help status, and a successful assistant answer clears it through the normal assistant-response path.

This merged slice does not change route contracts, provider prompts, provider response schema, durable cooking-session schema, Finish/History semantics, full provider schema shape, Phase 5 cleanup, durable navigation, or the future voice-activity affordance. The visual change stays inside the existing scoped `.live-cooking-ui` warm focus-mode surface and uses the existing cooking tokens, preserving the PR #264 computed-style specificity guardrail.

Local evidence: `npm ci`, `npx vitest run tests/unit/live-cooking-guest-session.test.tsx --testTimeout=15000`, `npm run check`, `npm run build`, `npm run test:unit`, `npm audit --audit-level=high`, and `git diff --check` passed during the PR. Focused assertions prove microphone-denial and assistance-route failures render the separate voice-help status outside Step guidance, preserve the current step, clear the issue on retry, and keep technical failure copy out of the normal assistant-answer path. PR #275 updated the guest E2E smoke for the new status panel; final pre-merge local `git diff --check`, `npm run check`, focused Live Cooking Vitest, and `npm run build` passed at `eb364ee`; exact-head GitHub `unit`, `e2e_guest_smoke`, `npm-audit`, `trufflehog_pr`, CodeQL, and Analyze checks also passed. Local targeted Playwright did not reach the changed assertion because the local dotenvx database is missing `anonymous_recipe_usage`, matching the known local-environment gap. Human Replit validation is deferred to release/batch validation unless Wilson asks for PR-level device microphone/provider smoke, because the merged slice is a narrow client failure-presentation change with mocked provider coverage and no schema, auth, deployment, or persistence changes.

## 2026-07-14 adjacent Efforts queued before next Phase 4 slice

Wilson directed the next Phase 4 / automation resume pass to pick up two adjacent visual/layout Efforts before starting another Phase 4 runtime slice, once Codex thread `019f3b47-9d04-7a03-8973-2a9cd1bb19b4` has merged:

- [EFF-028](../../../efforts/effort-028-chef-it-up-time-title-clearance.md): Chef It Up mobile visual clearance. This covers the time-selection title being covered by the floating Back button and the mobile Prep Tray selected image sitting inset instead of filling the hero area like desktop.
- [EFF-029](../../../efforts/effort-029-settings-camera-action-clearance.md): Settings camera height and action clearance. This covers returning logged-in Settings Pantry/Tools camera frames that are too short and pinned action buttons hidden under the authenticated bottom nav.

These are priority/resume routing notes, not new Phase 4 cooking behavior. They should stay scoped to mobile visual/layout fixes and preserve the current provider, schema, prompt, navigation, Prep Tray content, Ready Check, and Live Cooking behavior unless Wilson explicitly reprioritizes. After those Efforts are either implemented or explicitly deferred, continue Phase 4 from the PR #275 assistance-failure baseline toward full provider schema shape or Phase 5 cleanup as appropriate.

## Acceptance Criteria

- Ready Check appears before Step 1.
- Ready Check has one primary `Start cooking` action; acknowledged missing/skipped ingredients still pass into cooking-step generation so the model can adapt.
- Current step remains pinned with the actual cooking action as the headline while the user moves through guidance.
- Provider-generated Live Cooking steps should be atomic cookable actions or milestones; paragraph-like steps should be split at generation time when possible.
- Optional `actionLabel` values provide 2-4 word verb-first rail/headline labels such as `Boil Water`, `Prep Leeks`, `Cook Leek & Spinach`, `Garnish`, or `Push Vegetables Aside`.
- Action labels may stretch to 5 words only when required to complete the meaning.
- Action labels must avoid measurements and focus on the action needed in the step.
- Action labels must work as quick recall cards for a cook mid-step, fit in the small step-preview card without truncation, avoid repeats compared with other step labels in the same recipe, and make sense in plain English.
- Action labels must be grammatical, idiomatic kitchen phrases that name the real cookable action. The prompt should teach correction relationships, not only examples: measurement-driven labels like `Bring 4 Cups` should become action/result labels like `Boil Water`; setup-only labels like `Heat Oil Butter` should become the actual milestone such as `Cook Leek & Spinach`; ungrammatical labels like `Push Vegetables Side` should become idiomatic labels like `Push Vegetables Aside`; missing-object labels like `Add Cold Cooked` should include the noun, such as `Add Cold Rice`.
- Action labels must preserve ingredient number/plurality where it affects grammar: `Prep Leeks` for multiple leeks, not `Prep Leek`.
- Final garnish, off-heat, plating, and serving steps must not fall back to stale generic labels like `Cook Vegetables`; use the actual finishing action such as `Garnish`, `Garnish & Serve`, or `Serve Fried Rice`.
- When a step prefers cold cooked rice but the cook may only have warm rice, the guidance should offer a practical workaround such as spreading warm rice out to steam off and cool briefly before frying, rather than treating cold rice as a confusing missing requirement.
- Formal step-preview/action-label eval work is intentionally deferred to a separate INIT-004 lane so it can remain auditable apart from recipe-generation and cooking-instruction evals.
- If a provider still returns a multi-sentence instruction, the client renders it as separated detail lines beneath the short action headline instead of one large text blob.
- Live Cooking uses the existing Laica planning/setup typography tone.
- The guidance area has no user-facing "Coach Feed" label and does not look like a generic chat/feed window.
- Step progress includes dot nodes and short action-forward preview labels for each step.
- The step-preview rail follows the current step; if hidden steps exist to the left or right, a small bottom-floating return control appears only for the hidden side and snaps the rail back to the current step when selected.
- Routine `minor` safety badges are not shown as a persistent status chip.
- Repeat step instruction, Ask a question, and audio mute controls are taller icon-over-label buttons anchored in a bottom command bar, with Ask a question centered.
- Transcript text is hidden by default and appears only when the icon-like CC caption toggle is enabled; when open, the transcript and circular boxed-CC toggle share one compact row.
- Active Live Cooking requests a screen wake lock when supported by the browser and releases it when the guide exits or the page hides.
- Model steps include sensory cues where applicable.
- Timer controls appear automatically for timer-worthy steps, show the current recipe step's real or text-derived duration in `H:MM:SS` format, and never auto-start.
- The timer control uses a centered larger clock plus circular play/pause and reset buttons; durationless steps do not invent a fallback timer, and provider step durations are not surfaced as separate timer suggestions in this slice.
- When a timer reaches zero, the timer control itself shows a visible `Time's up` completion state. CC remains reserved for voice/transcript display and is not auto-opened as the timer alert.
- Live Cooking should use a warm focus-mode cooking surface that visually relates to the coral/rust setup and planning surfaces without becoming a heavy marketing/hero composition.
- Active timer controls remain visible together; the minimize/collapse affordance was removed after Wilson found it displaced pause/reset and made the timer harder to understand.
- Finish creates or updates cooking history but does not change pantry inventory.
- Guest Finish never creates durable cooking history unless the user has linked Google first.
- Completion sends no hidden `5` rating when the user has not rated.
- Cooking assistance route is authenticated, rate-limited, and prompt-injection guarded.
- Cooking-step generation failure has an inline retry/recovery state.
- Cooking-step generation validates output before entering the live guide: empty arrays, blank instructions, whitespace-only instructions, and non-cookable placeholder text are treated as recovery states, not as usable steps.
- Step-generation recovery into Live Cooking is explicit and evidence-backed: retry or regeneration must produce a validated usable guide before the app starts/saves a cooking session; the generic backup guide remains a clearly labeled user choice, not silent self-recovery.
- Cooking-assistance technical/quota failure appears in a separate voice-help status/retry area outside Step guidance. PR #275 implements this only for the narrow Ask-a-question failure list above while preserving the pinned current step; it does not define successful assistance answers or future step adaptation.
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
- EFF-028: Queued as the next adjacent Chef It Up visual-clearance task before more Phase 4 runtime work, after the gated thread merge.
- EFF-029: Queued as the next adjacent returning Settings camera/action-layout task before more Phase 4 runtime work, after the gated thread merge.
- INIT-003 Plan B: Public guest entry may ship before full Phase 4, so Phase 4 must preserve the linked-vs-guest memory boundary introduced by the homepage.

## Backend Notes

- Cooking steps should return structured sensory guidance and optional timer metadata.
- Tap-to-talk assistance should use the cross-phase voice context allowlist.
- Session completion must set up Phase 5 cleanup state instead of writing `pantryIngredients`.
