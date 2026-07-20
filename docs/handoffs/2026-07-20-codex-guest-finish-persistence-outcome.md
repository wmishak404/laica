# Guest Finish persistence outcome correction

**Agent:** codex  
**Branch:** `codex/guest-finish-persistence-outcome`  
**Date:** 2026-07-20  
**Initiative:** INIT-003  
**INIT updated:** yes  
**Resolves blocked handoff:** none

## Summary

Draft [PR #324](https://github.com/wmishak404/laica/pull/324) makes every Live Cooking completion claim follow the actual persistence outcome. Guest Finish remains a valid browser-local completion and asks the cook to sign up before saving History. Linked Finish does not claim History was saved until its mutation succeeds. A linked persistence failure keeps the local recovery record and presents an honest retry. Transcript, speech, toast, and persistent retry status all derive from the same typed outcome.

This closes the implementation gap found by the 2026-07-17 production-readiness run without changing the accepted linked-only durability boundary. INIT-003, the Phase 4 cooking contract, and the production validation registry now carry the same rule. Local gates, the full GitHub E2E lane, direct Replit checks, and both required phone viewports have passed; the PR carries the exact final-head workflow results after this evidence commit.

## Bug investigation evidence

### Observed facts

- The Replit production-readiness run on candidate `2686117a` completed a real anonymous cook. The toast said sign-up was required before History, while transcript/speech said `Saved to your cooking history`. No guest History save occurred. Source: [2026-07-17 production-readiness handoff](2026-07-17-codex-production-readiness-main.md).
- At required base `08fa856d`, `nextStep()` set the linked saved-History transcript unconditionally before calling completion.
- At the same base, `completeCookingSession()` cleared the scoped local recovery record and invoked the parent completion callback before checking guest mode or awaiting the linked mutation.
- The guest branch emitted an honest toast and skipped the mutation, so the false claim was a presentation-order problem rather than evidence of a guest authorization write.
- The linked failure catch logged the error after the recovery state and parent completion had already been cleared, while the earlier transcript still claimed success.
- The pre-fix focused Live Cooking suite passed 44 tests, showing that the green suite did not cover completion-channel consistency or linked failure recovery.

### Inference and reasoning

- A guest-only copy conditional would leave linked failure capable of claiming success and would not restore recoverability; completion needed to return an outcome selected after persistence resolved.
- Clearing recovery and calling the parent completion callback belong only to guest-local completion or confirmed linked persistence success. Keeping them out of the linked failure path makes retry semantics explicit and prevents an unsaved cook from being treated as completed.
- Rendering all surfaces from one typed outcome is the smallest durable way to prevent simultaneous transcript, speech, toast, and status copy from drifting.

### Missing evidence at investigation time

- The production run did not deliberately induce a linked completion failure. That path is covered deterministically by a rejected mutation followed by a successful retry in the focused unit suite.
- Replit iPhone-/Pixel-like runtime evidence and a direct linked success/History check were missing during investigation. The observed runtime results and retained screenshots are recorded below.

## Changes

- `client/src/components/cooking/live-cooking.tsx`
  - adds typed `guest-local`, `linked-saved`, and `linked-save-failed` outcomes
  - derives transcript, speech, toast, and retry status from the selected outcome
  - waits for linked persistence before claiming success, clearing recovery, or invoking the parent completion callback
  - preserves a retryable local state after linked failure and prevents duplicate Finish submissions
- `tests/unit/live-cooking-guest-session.test.tsx`
  - proves guests never receive a saved-History claim
  - proves linked success copy is absent while persistence is pending and appears only after resolution
  - proves failure copy stays consistent, recovery state remains, and retry can succeed
  - asserts synthesized speech matches the transcript and toast exactly
- `tests/e2e/cooking-workflow.test.ts`
  - extends the guest smoke through Finish and rejects saved-History copy
- `initiatives/INIT-003-anonymous-trial-and-account-upgrade.md`
  - records PR #324, the outcome contract, validation state, and current resume point
- `product-decisions/features/mobile-refresh/pd-phase-04-cooking.md`
  - makes completion timing, retry, and cross-surface consistency part of the durable Phase 4 acceptance contract
- `docs/production-validation-registry.md`
  - adds the smallest changed-since-production Finish check and future-bug breadcrumb
- `docs/assets/mobile-refresh/2026-07-20-codex-guest-finish-honest-390x844.jpg`
  - retains the iPhone-like guest toast/transcript result
- `docs/assets/mobile-refresh/2026-07-20-codex-guest-finish-honest-412x915.jpg`
  - retains the Pixel-like guest toast/transcript result

## Verification

### Claimed behavior

- Guest Finish says `Dinner's ready. Sign up to save this session to your cooking history.` and makes no durable completion mutation.
- Linked Finish withholds saved-History wording until the durable completion mutation succeeds.
- Linked persistence failure never announces success, preserves the scoped local cooking session, and exposes `Try Finish again`.
- Transcript, speech, toast, and retry status use the same outcome title/description.

### Command and source provenance

- Required base: `codex/production-readiness-2026-07-17` at `08fa856d028c00f577f4e6dd3492efa8c00639de`.
- Initial implementation commit before base refresh: `5d41870b7fc01ba959d06925a94fab9755bc68aa`.
- Rebased implementation commit: `d71daecc`; pre-handoff evidence head: `8721683dab1354b3864b6a948e9d9f41deba65f0`.
- PR #322 merged the lockfile-only audit remediation as `b4236b6f`. The branch was then rebased onto that fresh `origin/main`, replaying the required production-readiness commits and retargeting PR #324 to `main`.
- Local install used the committed lockfile through `npm ci`.
- Local tests exercise the checked-out source directly; GitHub E2E uses a schema-pushed ephemeral Neon branch and the PR head.

### Observed results

- Post-rebase `npm ci`: pass; 1,053 packages installed / 1,054 audited, with one moderate advisory below the repository's high/critical gate.
- Pre-fix `npm run test:unit -- tests/unit/live-cooking-guest-session.test.tsx`: pass, 44 tests; the bug remained unguarded.
- Post-fix focused Live Cooking suite: pass, 46 tests.
- `npm run check`: pass.
- `npm run build`: pass with existing stale Browserslist, Firebase mixed-import, and bundle-size warnings.
- `npm run test:unit`: pass, 50 files / 391 tests.
- `git diff --check`: pass.
- Local `db:health`: the configured development DB endpoint is disabled after the sandbox IPC restriction was separately ruled out, so local DB-backed E2E is not promoted as merge evidence.
- Initial GitHub run `29784569592` at pre-rebase head `b99d021a`: typecheck/lint, build, unit, coverage baseline, ephemeral-Neon schema push/health, and full guest + linked dev-auth Playwright smoke passed. Secret scan run `29784569599` passed.
- The initial dependency-audit run failed on the newly disclosed transitive advisory inherited from the delegated base. PR #322 independently remediated that default-branch lockfile issue; after rebasing, local `npm audit --audit-level=high` passes.
- Final exact-head GitHub workflow IDs and conclusions are recorded in PR #324 after this handoff commit triggers the repository workflows.
- Replit direct-shell validation at `8721683d`: clean-state fetch/switch succeeded; `npm ci`, `npm run check`, and `npm run build` passed. Build retained the existing Browserslist-age, Firebase mixed-import, and large-chunk warnings. Replit Agent was not used.
- Linked Replit result at app-reported `390x844`: a real provider-backed `Leek, Carrot & Beef Fried Rice` flow generated 12 steps; Finish showed `Dinner's ready. Saved to your cooking history. Pantry cleanup comes next.` in both toast and transcript. History then loaded a new matching entry dated Jul 20, 2026 at 04:18 PM.
- Guest Replit result at app-reported `390x844` and `412x915`: a new anonymous setup with browser-local pantry data completed a real provider-backed eight-step `Simple Egg Fried Rice` cook. Toast and transcript both read `Dinner's ready. Sign up to save this session to your cooking history.`; neither viewport contained saved-History wording, and guest History remained disabled in the menu.
- Retained visual evidence: [iPhone-like `390x844`](../assets/mobile-refresh/2026-07-20-codex-guest-finish-honest-390x844.jpg) and [Pixel-like `412x915`](../assets/mobile-refresh/2026-07-20-codex-guest-finish-honest-412x915.jpg).

### Evidence limits

- Automated linked failure uses a controlled rejected mutation; no production database failure was induced.
- The exact speech string is verified at the synthesis call boundary. Audible output still depends on the configured runtime voice provider/browser audio policy.
- Replit proves the linked mutation's successful persisted result and the guest/local result; pending-state timing and failure/retry are deterministic unit evidence rather than induced live-database failure evidence.
- Passing guest/linked automation does not validate Phase 5 cleanup, guest History import, or unrelated cooking/provider quality.

## UI governance conformance

- The retry surface reuses the existing shadcn `Alert` destructive variant and existing semantic tokens.
- No raw color, global primitive override, font/icon change, wrapper-specificity expansion, or durable navigation change was introduced.
- Required mobile visual comparison is limited to ensuring the completion transcript/toast and retry status remain legible without covering pinned cooking controls.

## Impact on other agents

- Treat the outcome type in Live Cooking as the canonical completion presentation boundary; do not add auth-specific completion copy outside it.
- Phase 5 cleanup can build on confirmed linked completion, but this PR does not define cleanup state or guest import.
- EFF-032 and EFF-034 remain explicitly deferred. EFF-033 and returning Settings layout remain owned by their separate thread and are untouched here.

## Negative scope

No pantry mutation, rating/notes invention, server route, schema, provider prompt, Firebase/auth, History query, guest History import, Slop Bowl, Phase 5 cleanup, durable navigation, Settings layout, EFF-032, EFF-033, or EFF-034 behavior changed.

## Open items

- Treat the exact final-head GitHub workflow results and compact Replit resync as live PR evidence; no repository edit should follow them before review.
- Keep PR #324 draft after validation. Wilson's explicit approval is required before merge.

## Stack / base status

- Base refreshed: yes
- Current base: `origin/main` at `b4236b6f88b02c3bc3d2b69191a3a71b48a99675`
- Last Replit-validated at: `8721683dab1354b3864b6a948e9d9f41deba65f0` before this evidence-only commit; PR #324 records the compact final-head resync.
- Notes: work started from required `08fa856d`, then rebased after audit-remediation PR #322 merged. The rebase replayed the two production-readiness documentation commits plus this implementation, so PR #324 now targets fresh `main` without losing the delegated evidence baseline.
