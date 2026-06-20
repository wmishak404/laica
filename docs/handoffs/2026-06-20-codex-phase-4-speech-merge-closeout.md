# Phase 4 Speech Arbitration Merge Closeout

**Agent:** codex
**Branch:** `codex/init-001-cooking-audio-closeout`
**Date:** 2026-06-20
**Initiative:** INIT-001
**INIT updated:** yes

## Summary

PR #191 merged the narrow Live Cooking speech-arbitration slice, so existing cooking guidance now has deterministic ownership for speech playback. The user-facing value is quieter, safer hands-busy guidance: Back to Planning, step changes, Mute, Ask for Help, timers, Repeat Step, and rapid actions no longer leave stale audio competing with the current visible transcript.

This closeout moves durable docs from "PR #191 pending" to "PR #191 merged baseline" and records the exact validation boundary: Wilson manually passed the 12-case Replit speech matrix at PR head `1bc9221398883064d9876e690e58f8cf75f1950d`; after a docs/workflow-only rebase, exact-head GitHub `unit` and `e2e_guest_smoke` passed at `b2e6f5448fc23d6e8c06549f42bd6e3e49962d7e`; the PR merged as `104ee0cfc2ecb77bc7129cc64c91b1a08e8f06d1`.

## Changes

- `initiatives/INIT-001-mobile-refresh.md`: clears PR #191 as the active branch, records the merge, and makes PR #191 the speech-arbitration baseline for future Phase 4 work.
- `initiatives/registry.md`: updates INIT-001 active PRs to none and records PR #191's merge/validation signal.
- `product-decisions/features/mobile-refresh/pd-phase-04-cooking.md`: changes the audio lifecycle slice from pending merge to merged behavior and records the validation evidence.
- `docs/evals/registry.md`: marks the speech-interaction acceptance seed as merged through PR #191.
- `docs/evals/intakes/speech-interaction-acceptance-seed-2026-06-17.md`: adds Wilson's 12/12 manual Replit pass to the metrics summary and keeps live-provider quality canary work deferred.
- `docs/handoffs/2026-06-20-codex-phase-4-speech-merge-closeout.md`: this closeout handoff.

## Impact on other agents

Future Phase 4 work should start from fresh `origin/main` and preserve PR #191's speech ownership baseline. New Ready Check, Coach Feed, timer redesign, live-cooking inline recovery, provider-prompt, schema, or Finish/Phase 5 semantics remain future Phase 4/5 scope and should not reinterpret PR #191 as having completed the full cooking guidance phase.

The default local dotenvx DB drift remains an EFF-010 / EFF-017 evidence-environment issue. Do not run `npm run db:push` against the decrypted default `.env` DB; use GitHub's schema-only `e2e_guest_smoke` or a guarded local diagnostics sandbox if local reproduction is needed.

## Open items

- Full Phase 4 still needs Ready Check, Coach Feed, timer redesign, live-cooking inline AI error recovery, and Finish/history semantics.
- Future speech work that changes real device audio, microphone permission, ElevenLabs pronunciation, or live provider quality should add a named Replit/mobile speech-smoke lane or canary.
- No active Effort is closed by this PR. EFF-010 and EFF-017 remain active and unchanged.

## Verification

- PR #191 merged on 2026-06-20 as `104ee0cfc2ecb77bc7129cc64c91b1a08e8f06d1`.
- Wilson manually passed the 12-case Replit speech matrix at PR head `1bc9221398883064d9876e690e58f8cf75f1950d`.
- Before merge, exact-head GitHub checks passed at `b2e6f5448fc23d6e8c06549f42bd6e3e49962d7e`: `unit`, `e2e_guest_smoke`, `npm-audit`, `trufflehog_pr`, and CodeQL.
- Closeout branch validation passed: `git diff --check`; targeted `rg` spot-check found no stale PR #191 pending / ready-for-review language in the updated INIT, registry, phase, eval, or closeout handoff docs.

## Stack / base status

- Base refreshed: yes
- Current base: `origin/main` at `762488e0672a4f45e12a0d24ecfdb39729c5f5ae`
- Last Replit-validated at: `1bc9221398883064d9876e690e58f8cf75f1950d`
- Notes: closeout started from fresh `origin/main` immediately after PR #191 merged, then was rebased after PR #205 merged the INIT-004 pantry fixture batch and touched the eval/initiative registries. No new runtime validation is needed for this docs-only closeout.
