# 2026-06-17 - Live Cooking Speech Interaction Acceptance Seed

**Intake id:** `speech-interaction-acceptance-seed-2026-06-17`
**Source:** Wilson manual review questions in PR #191 thread
**Owner / reviewer:** Wilson / Codex
**Raw artifact handling:** Chat-derived summary only; no raw audio, provider output, user-identifying data, or production traces committed
**Privacy posture:** Synthetic/manual acceptance matrix; no private user data
**Related surfaces:** Live Cooking speech interaction, speech synthesis orchestration, transcript fidelity, mute, step navigation, Ask for Help
**Prompt/model/evaluator versions:** UI interaction acceptance seed; no prompt/model/judge run yet
**Input schema:** User action sequence, current transcript text, audio enabled/muted state, active/pending synthesis state, expected played transcript
**Sample size:** 12 acceptance scenarios seeded from 8 Wilson questions plus 4 adjacent interruption cases
**Positive definition:** A human/user-value pass means the cook hears only the current visible/requested guidance, mute is respected immediately and across steps, recording is not contaminated by Laica talking, and synthesized speech matches the visible transcript.
**Trend tags:** `speech-arbitration`, `transcript-fidelity`, `mute-persistence`, `hands-busy-guidance`, `goal-value-acceptance`

## Source Summary

Wilson clarified that the original Back-to-Planning speech leak is only one member of a broader Live Cooking speech-arbitration contract. The durable user goal is calm hands-busy guidance: Laica should speak the guidance the cook is currently seeing or explicitly requested, and stale audio should never compete with the current step, mute state, or recording.

This seed is intentionally **not** a new INIT-004 Phase 3 harness requirement. INIT-004 V1 remains recipe, Slop Bowl, and cooking-step output quality. This record preserves speech-interaction eval criteria for INIT-001 Phase 4 and any later speech eval extension after Wilson opens that scope.

## Metrics Summary

| Metric | Value | Calibration status | Notes |
|---|---|---|---|
| Observed pass rate | 12/12 deterministic scenarios passing | Automated interaction checks, not human listening labels | `npx vitest run tests/unit/live-cooking-guest-session.test.tsx` passed 18/18 tests locally on 2026-06-18 after the PR #191 arbitration implementation. |
| Item-level pass rate | 12/12 acceptance scenarios passing | Automated interaction checks, not human listening labels | The seeded acceptance list is now executable coverage in `tests/unit/live-cooking-guest-session.test.tsx`. |
| Human label pass rate | Not run | n/a until human labels exist | Wilson's questions define expected behavior, not completed labels. |
| TPR | Not run | n/a until human labels exist | No judge exists. |
| TNR | Not run | n/a until human labels exist | No judge exists. |
| Corrected pass rate | Not run | n/a until TPR/TNR valid | Not applicable. |
| Confidence interval | Not run | n/a | Not applicable. |

## Failure / Learning Clusters

| Cluster | Evidence | Criterion family | Proposed deterministic check | Proposed judge or human label | Product / prompt implication |
|---|---|---|---|---|---|
| First-step start | User asked whether Step 1 after welcome plays correctly | Speech lifecycle / transcript fidelity | Assert the Step 1 transcript is the first step speech payload after guide setup | Human/mobile smoke for real permission behavior | Initial cooking guidance should start with useful step content, not only generic welcome copy. |
| Step interruption | User asked whether Next interrupts current speech and plays the new step | Speech arbitration | Fake active/pending speech, click Next/Previous, resolve old synthesis late, assert only new transcript can play | Human smoke for real device audio | Step navigation must be current-state-owned. |
| Competing speech actions | User asked whether another action with speech stops current audio | Speech arbitration | Trigger Repeat Step, timer completion, and assistant response while old speech is active/pending | Human label if future actions are ambiguous | Centralize speech ownership instead of one-off button fixes. |
| Ask for Help contamination | User asked whether current audio stops when asking a question | Voice input hygiene | Assert Ask for Help stops active/pending speech before recording starts and ignores late old synthesis | Replit/mobile microphone smoke | Laica should not talk over the user's voice input. |
| Exit cleanup | User asked whether Back to Planning completely stops audio | Audio lifecycle | Existing PR #191 Back/late-synthesis regression; add Finish/unmount equivalents when those paths change | Replit/mobile smoke before broader Phase 4 closeout | Exiting cooking must be quiet. |
| Mute semantics | User asked whether mute stops all audio and persists across steps | User control / mute persistence | Assert mute stops active/scheduled/in-flight speech, step navigation while muted does not speak, unmute does not autoplay | Human smoke for real device button feel | Mute means immediate and durable quiet until explicit speech request. |
| Transcript fidelity | User asked whether speech exactly matches transcript or drifts | Transcript fidelity | Assert `synthesizeSpeech` receives the exact visible transcript string for step/repeat/timer/assistant cases | Human listening spot-check for provider pronunciation only | Visible and spoken guidance should not diverge. |
| Rapid actions | Adjacent acceptance case inferred from step/action interruption | Race-condition resilience | Rapid Next/Previous/Repeat taps with fake timers and late promise resolution; assert final requested transcript wins | Human smoke if UI feels laggy | Fast hands-busy actions should settle on one current instruction. |
| Timer interruption | Adjacent acceptance case inferred from "another set of speech audio" | Time-sensitive alert arbitration | Timer completion interrupts old speech or stays muted, then speaks once if audio enabled | Human judgement for timer priority if product changes | Time-sensitive audio should not layer over stale step audio. |

## Positive Examples Worth Preserving

| Example | Why it passed | Regression risk if over-corrected |
|---|---|---|
| Back-to-Planning late synthesis regression in PR #191 | It proves late provider audio cannot start after the cooking surface exits. | A future centralized speech token must preserve exit cleanup and not only handle step transitions. |
| Unmute requires Repeat Step | It preserves user control by avoiding surprise audio after the user turns sound back on. | Over-eager replay would make unmute feel unsafe in a kitchen context. |

## Fixture Candidates

| Candidate | Source id / description | Intended criterion | Raw-data handling |
|---|---|---|---|
| `live-cooking-step-1-after-welcome` | Synthetic two-step recipe with welcome/setup transcript | First-step start and transcript fidelity | Synthetic unit fixture in `tests/unit/live-cooking-guest-session.test.tsx` |
| `live-cooking-next-interrupts-old-step` | Synthetic in-flight Step 1 synthesis, click Next, late Step 1 resolution | Step interruption and stale promise invalidation | Synthetic unit fixture |
| `live-cooking-ask-help-stops-speech` | Synthetic active/pending step speech, click Ask for Help | Voice input hygiene | Synthetic unit fixture; real microphone remains smoke-only |
| `live-cooking-muted-step-navigation` | Synthetic muted state plus step navigation | Mute persistence | Synthetic unit/component fixture |
| `live-cooking-transcript-payload-match` | Synthetic step/repeat/timer/assistant transcript strings | Transcript fidelity | Synthetic unit fixture |

## Open Questions / Deferrals

- PR #191 keeps the current arbitration utility inside `LiveCooking` because the slice is bounded to one component and the evidence does not yet justify a shared hook. Reconsider extraction only when another cooking or speech surface needs the same contract.
- Decide whether real ElevenLabs pronunciation/audio quality belongs in a future live-provider canary or remains human release smoke. Owner: Wilson / future INIT-001 Phase 4 validation. Smallest next action: document a named Replit/mobile speech-smoke script or checklist after deterministic arbitration is covered.
- Keep INIT-004 Phase 3 harness scope unchanged. Owner: future INIT-004 agent. Smallest next action: do not add speech synthesis/transcription to V1 eval harness unless Wilson explicitly opens a speech eval phase.
