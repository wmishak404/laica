# INIT-005 compatible dependency remediation and remaining decision

**Agent:** Codex
**Branch:** `codex/init-005-audit-remediation`
**Date:** 2026-10-07
**Initiative:** [INIT-005](../../initiatives/INIT-005-agentic-cooking-actions.md)
**INIT updated:** no — the still-open #371 closeout already owns the merged Phase 1 facts and dependency-first resume point; this work has not cleared that prerequisite or started Phase 2
**Resolves blocked handoff:** none; the #371 dependency blocker remains open
**Status:** Compatible slice complete for review; merge blocked by the unchanged audit gate

## Summary

Phase 1 #369 is already merged as `96ec567a6f55639473d3209376fa180b2dd1f924`; it is not recreated here. Read both closeout handoffs from `codex/init-005-phase1-merge-closeout` at `925ef50d7a3d12c5ab87168644e778fabe92a5bf`, because those documents are not on main. This separate branch applies six compatible lockfile updates, adds a real credential-compatibility test, and preserves the remaining architectural decision. Full and production audits improve to five high and zero critical package entries, but still fail the existing high/critical gate. Counts include propagated dependent entries, not distinct production exploits.

Unresolved advisory details and dependency paths remain in private local investigation artifacts and security tooling, following `docs/workflows/security-due-diligence.md`. No force upgrade, audit suppression, threshold change, secret change, publish, enrollment, or Replit Agent use occurred.

## Changes

- `package-lock.json`: five existing-range transitive patch resolutions and Firebase Admin 13.8.0 to 13.10.0 within the existing declaration. Direct dependency declarations and overrides are unchanged. The within-major SDK release removes an affected dependency and uses native private-key parsing; signing remains native.
- `tests/unit/firebase-admin-credentials.test.ts`: actual installed SDK, generated ephemeral RSA credentials, both PEM encodings, signed custom-token binding, tamper rejection, and malformed-key rejection. No real credential or network call.
- `efforts/effort-023-broad-dependency-modernization-strategy.md`: narrow audit-triggered scope and the separately gated foundation migration; no Effort status change.
- `docs/production-validation-registry.md`: focused dependency/runtime breadcrumb for the next approved release.

## Dependabot and ownership audit

As observed on 2026-10-07, #370 remains open at `7211f9fc1073b9978e96e9fa36acfba7824cf515`. Its exact lockfile correction is reused in this consolidated gate-remediation candidate; do not merge both blindly. Leave #370 intact until the approved replacement lands. #361 remains open at `c97b10889c317b2d1245c3f8074f75b9897d078a`; its actual diff includes an unapproved Express major upgrade, so it was not copied. Neither is authorized for merge. Their failed E2E jobs stopped at credential preflight and do not establish application incompatibility.

The compatible candidate starts from fresh main `96ec567a`. The original `/Users/wilsonishak-macbookpro/src/laica` checkout and its pre-existing encrypted `.env` modification were preserved by using a separate checkout.

## Phase 2 preparation only

Read the accepted master plan and Phase 1 record from #371, AGENTS, active Efforts, PD-005 and design guidelines. Live ownership audit found #334 open at `b8c1090b98aa6fff93b4df81d1b3acc341ab3503` and #281 open at `0c157a663f6f72cf534f177028288a259924a7e7`; both conflict with current main and have stale July evidence. No reviews/comments or related new timer/schema blocked handoff were found. This is shared-surface coordination, not authority to merge either PR.

- #334/EFF-034 owns Reset-to-Start plus unrelated Settings layout. The accepted Phase 2 controller must preserve Reset-to-Start; a later #334 refresh must reconcile its obsolete timer hunk without overwriting the controller. Settings remains separate.
- #281 owns step normalization and session snapshot fields. Do not assume it is on main or import its largest-duration fallback as authorization. Resolve step references conservatively from the owned saved snapshot; ranges, multiple candidates and conflicting duration sources clarify.
- Use one manual/assistant deadline-based timer controller and one atomic persisted timer/application journal. Bind dispatch to owner, browser/cook, step and timer revision; serialize competing tabs; receipt retries reconcile the same application. Status reads and uncertain delivery never authorize a second start.
- Route eligible tap-to-talk once through the action boundary. Clear direct commands need no second confirmation; ordinary advice, suggestions, negation and uncertain/interrupted speech stay non-mutating. Preserve speech ownership, remove raw transcript logging, and keep rollout defaults disabled.

Phase 2 must separately report changed-behavior tests for explicit/step-derived durations; ambiguity/negation/advice; running/paused timers; stale state; pre/post-dispatch failure and retry; duplicate/reload/multiple-tab/background behavior; speech arbitration; untimed-step controls; and mobile layout at `390x844` and `412x915`. Its full regression gate is additional exact-head install/check/build/unit/fixture/security and schema-backed guest/linked/ledger E2E, with Neon cleanup. Real microphone/provider/speech/mobile acceptance requires targeted Replit evidence at the final Phase 2 head; Phase 1's `e56cc6dd` validation cannot substitute.

## Verification

**Value claim:** reduce current dependency findings without introducing a major migration, and prove that the actual SDK still parses supported credentials and signs identity-bound custom tokens.

Change-specific evidence: the three actual-SDK credential cases pass. Existing Firebase auth, rate-limit, upload/provider and action cases run in the full suite; their mocks do not independently prove the changed key-parser boundary. Clean installation passes; the lock diff changes six versions and removes one dependency entry without altering package declarations. Registry metadata and upstream release/source review justify each compatible resolution.

Full local regression: Node `24.14.1`, npm `11.11.0`; `npm ci`, `npm run check`, `npm run build`, 58 unit files / 468 tests, and all 27 public eval fixtures pass. Build retains existing chunk-size and mixed-import warnings. Full audit: 15 entries (10 moderate, 5 high, 0 critical); production audit: 14 entries (9 moderate, 5 high, 0 critical). Both exit 1 as required. Whitespace and changed Markdown links are checked before push. Exact-head GitHub results and URLs are recorded in the PR description after the final push; a missing, skipped or failed E2E result is not a pass.

Risk lane: automation-primary for this compatible slice, conditional on final-head schema-backed linked E2E. That lane uses actual service-account initialization, custom-token signing, Google token exchange and authenticated routes. Human Replit validation is deferred to the focused release check in the registry; no new Replit or production evidence is claimed. The offline tests do not prove real Google/App Check, Firestore, provider behavior or deployment secret propagation.

## Open items and exact resume

1. Wilson must decide whether to authorize a separate major stylesheet-foundation migration with browser-support and mobile visual acceptance, or keep the gate blocked while waiting for a compatible upstream fix. No exception or forced upgrade is proposed by this branch.
2. Keep this PR and #371 unmerged while the audit fails. Prepare the chosen follow-up separately, refresh this compatible candidate if needed, and run the exact-head full gate. Obtain explicit approval before dependency/code merges.
3. After approved remediation lands on main, rebase `codex/init-005-phase1-merge-closeout` onto fresh main, push with lease, rerun all checks and review threads, then perform the already-authorized mechanical #371 closeout.
4. Only then start the isolated Phase 2 implementation branch from fresh main, repeat the live #334/#281 ownership audit, update INIT/phase evidence and the production breadcrumb, and push the handoff. EFF-036 remains a separately owned production-readiness concern before pilot publishing. Publishing, pilot activation and Replit Agent use require explicit approval.
