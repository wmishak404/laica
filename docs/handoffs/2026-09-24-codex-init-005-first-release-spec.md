# INIT-005 first-release specification

**Agent:** codex
**Branch:** `codex/init-005-first-release-spec`
**Date:** 2026-09-24
**Initiative:** INIT-005
**INIT updated:** yes
**Resolves blocked handoff:** none

## Summary

INIT-005 execution starts with a reviewable specification for the Phase 1 foundation and Phase 2 private tap-to-talk timer pilot. Wilson selected private production access and the existing Ask-a-question input on September 23, then authorized starting the initiative on September 24. This task records that direction without claiming runtime implementation or rollout.

The review corrected contradictory timer-confirmation guidance, moved pilot/kill controls ahead of execution, selected a dedicated transactional action ledger, and defined browser execution receipts and unresolved outcomes. It also moves pantry-and-guide bundles to Phase 4 and requires applicable food-safety rejection before those mutations. These changes give the implementation branch a repository source of truth instead of relying on the prior chat.

## Changes

- `product-decisions/features/agentic-cooking-actions/pd-phase-01-action-foundation.md`: new source audit, foundation contracts, public interface, privacy/rollout defaults, acceptance matrix, and runtime resume sequence.
- `product-decisions/features/agentic-cooking-actions/pd-agentic-cooking-actions-plan.md`: reviewed release boundary, receipt API/lifecycle, direct tap-to-talk timer acceptance, corrected later dependencies, and execution authorization.
- `product-decisions/features/mobile-refresh/pd-cross-phase-ai-privacy.md`: reconciled direct timer authorization, pre-dispatch audit failure versus post-dispatch uncertainty, and allowlisted action-record policy.
- `initiatives/INIT-005-agentic-cooking-actions.md`, `initiatives/registry.md`, and the feature `README.md`: specification task started; runtime remains next after docs merge.
- This handoff: point-in-time evidence and coordination. No runtime files, tests, dependencies, configuration, secrets, or generated assets changed.

## Impact on Other Agents

Read [INIT-005](../../initiatives/INIT-005-agentic-cooking-actions.md) and the [Phase 1 record](../../product-decisions/features/agentic-cooking-actions/pd-phase-01-action-foundation.md) before implementation. The seven-phase roadmap remains; the first release ends at the private Phase 2 timer pilot.

- PR #334 / EFF-034 has a Phase 2 timer-reset shared surface. This work conforms to Reset-to-Start intent but does not resolve the Effort or absorb Settings changes.
- PR #281 has a Phase 2 step-schema/session contract overlap. Do not assume its unmerged normalization exists on main.
- EFF-017's validation discipline is retained; no new app-wide gate or Effort state is introduced.
- INIT-003 guest persistence remains authoritative. The pilot default is allowlisted linked accounts; guest and non-pilot advice stays answer-only.
- INIT-004 infrastructure is reused with a distinct action-eval lane; no existing eval dataset, score, or status is changed.
- Open PR and blocked-handoff scan found no competing INIT-005 runtime owner. Historical OAuth, vision-provider, and cartographer blockers do not block this docs task; they do not prove current production readiness either.

The primary checkout had an existing `.env` modification. Work was isolated in a Codex-managed worktree and did not read or change that file or link private decryption keys.

## Verification

**Value claim:** Future agents can implement the selected pilot from consistent phase, privacy, and initiative records, distinguishing authorization, dispatch, and observed execution.

**Evidence:**

- Source audit: `origin/main` and GitHub main both `895df8187008294197650be6a8cbcece4d2abf04`; targeted reads of assistance/transcription routes, best-effort AI logging, client timer/parser/restoration, linked-session storage, current plans, and open PR metadata.
- `git diff --check`: passed for the specification changes.
- Read-only Python relative-link/heading-anchor check: passed for the six specification/index files before this handoff (44 references); final handoff-inclusive check recorded in the PR.
- Targeted `rg` consistency scan: no current blanket timer-confirmation rule, undecided ledger-storage claim, or obsolete Phase 1 authorization blocker remains in the changed current-state docs.
- Final committed scope and exact head, and any repository CI results, are recorded in the PR. GitHub CI has not yet run at handoff authoring time.

**Reasoning:** The checks establish local document/reference integrity and a source-grounded implementation contract. They do not establish that action execution works.

**Evidence limits:** No local unit/E2E/build/provider tests were run because this task changes only Markdown. No action schema, DB migration, prompt/model change, live microphone behavior, timer execution, retention job, pilot membership, or production readiness is validated.

**Replit validation:** Not required for this docs-only task. Runtime foundation and timer branches retain the specified schema/auth/provider and mobile validation gates. Replit Agent was not used.

**Production registry:** No entry needed: documentation only; no runtime change since the last production-smoked build. Future implementation PRs must add their own changed-since-production entries.

## Open Items and Resume

1. Review and explicitly merge this specification PR. Per [merge authority](../workflows/agent-merge-authority.md), this changes active INIT state, feature acceptance, and privacy contracts, so workflow-only auto-merge authority does not apply.
2. After merge, perform immediate INIT fact-only closeout from fresh main.
3. Start a fresh Phase 1 runtime branch from updated main. Implementation is authorized; no repeat kickoff approval is needed. Keep cooking executors unavailable until the foundation gate passes.
4. Phase 2 timer execution, actual pilot enrollment/activation, model comparison, guest action rollout, and Phases 3-7 remain future work. No new user-visible task was created.

## Stack / Base Status

- Base refreshed: yes; `git fetch origin` on 2026-09-24.
- Current base: `origin/main` at `895df8187008294197650be6a8cbcece4d2abf04`.
- Not stacked on an unmerged branch. Re-audit open shared surfaces before Phase 2.
- Last Replit-validated at: not applicable; documentation-only scope.
