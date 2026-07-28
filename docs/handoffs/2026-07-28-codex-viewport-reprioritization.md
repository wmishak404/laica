# Deprioritize proactive viewport work

**Agent:** codex
**Branch:** codex/defer-viewport-work
**Date:** 2026-07-28
**Initiative:** INIT-001
**INIT updated:** yes
**Resolves blocked handoff:** none

## Summary

Wilson accepted the deployed viewport experience as the current baseline after production and post-publish testing. Daily Effort and INIT agents should stop selecting viewport-only implementation work and move to other documented pipeline items. EFF-035 is deferred, not resolved: its production evidence remains valid, but it may reopen only from Wilson-supplied user feedback or materially changed production regression evidence.

This decision does not weaken LAICA's mobile-first validation discipline. Unrelated UI changes should still use representative mobile viewport, scroll, and hit-target checks when required by their risk lane.

## Changes

- `efforts/effort-035-universal-setup-viewport-resilience.md`
  - Changes EFF-035 from `Open` / immediate P1 to `Deferred`.
  - Records the 2026-07-28 reopen trigger and preserves prior production findings as historical evidence.
- `efforts/README.md`
  - Removes EFF-035 from the active implementation pool and adds it to the deferred list.
- `efforts/registry.md`
  - Records the deferred status and Wilson-controlled reopen trigger.
- `initiatives/INIT-001-mobile-refresh.md`
  - Replaces the stale pre-publish resume text with the post-publish priority boundary.
  - Directs automated triage away from viewport-only work while retaining mobile validation requirements.

## Impact on other agents

- Do not resume `codex/eff-035-setup-viewport-resilience` or create a replacement viewport branch.
- Do not choose EFF-035 merely because it has production regression evidence; its authoritative status is `Deferred`.
- Do not turn adjacent visual-fit findings into a new Effort or INIT phase without Wilson-supplied user feedback or materially changed production evidence.
- Continue to use the repo's mobile-first UI validation rules for non-viewport work.
- Rank the next non-viewport item from fresh `origin/main`, live PR ownership, and the current Effort/INIT sources. EFF-036 remains a P0 with an owner-authorized production configuration dependency; EFF-037 is the next small active non-viewport Effort but still contains product choices that must not be guessed; INIT-004 and INIT-001 Phase 4/5 work must respect their live PR ownership and documented decision gates.
- Four recent EFF-035 daily threads were explicitly stopped on 2026-07-28. Their worktrees were clean and no viewport implementation, commit, push, or PR needs salvage or closeout.

## Open items

- EFF-034 remains open and has existing PRs #333 and #334; this reprioritization does not select, merge, close, or rewrite those branches. Agents should not create additional viewport work around its Settings-tail finding.
- Wilson can reopen EFF-035 by supplying user feedback that the current viewport experience is unsatisfactory or by accepting new production evidence as a priority change.
- The active `INIT Triage Implementation` automation was updated immediately with the non-viewport priority override. The `Daily Efforts Hygiene and Implementation` automation uses a local environment setup file, so its matching update was presented to Wilson as a reviewable automation change rather than bypassing that safeguard.

## Verification

- Documentation-only change; no runtime, CSS, test, schema, provider, secret, navigation, or deployment behavior changed.
- Verify EFF-035 is absent from `efforts/README.md`'s active list and present in the deferred list.
- Verify EFF-035, the registry, INIT-001, and this handoff use the same reopen trigger.
- Run `git diff --check` and targeted searches for stale active/P1 EFF-035 wording.
