# Effort System Audit Workflow

## Operating Principles

Follow [operating-principles.md](operating-principles.md): evidence first, no unsupported assumptions, objective detail, visible rationale and provenance, feedback from first principles, no hacks or duplicate paths, deletion of obsolete paths, explicit decisions, and blocking reports with exact missing inputs and smallest next actions.

This workflow records how agents audit the Efforts system, close stale Efforts, prevent old Epic-style drift from coming back, and safely turn `Open` / `In Progress` Efforts into implementation slices.

## Why This Exists

Wilson found that the former Epic system had become bloated and hard to trust. Some files were stale to-do lists, some were really INIT phase work, and some were governance/workflow records that belonged in more central docs.

The rename to Efforts narrows the system: Efforts are standalone follow-up records, not a catch-all planning drawer.

## Known Failure Modes

| Inefficiency | What went wrong | Future audit check |
|---|---|---|
| Stale statuses | Work shipped or moved elsewhere, but the file stayed active | Compare each active Effort against merged PRs, INIT phase state, and PD/workflow docs |
| Duplicate governance roles | Testing, telemetry, and workflow rules lived in Efforts instead of central docs | Move durable procedures to `docs/workflows/`, ADRs, or PDs |
| INIT-worthy work filed as Efforts | Mobile Refresh follow-ups were tracked outside INIT-001 even when the INIT already owned a still-open phase | If work naturally belongs to a specific unclosed INIT phase, update that phase and the INIT in the same branch instead of keeping a separate Effort |
| Closed-as-done confusion | An Effort was closed into an INIT even though the underlying work was not shipped and no unclosed phase actually owned it | Only close into an INIT when the work is already shipped or when a specific unclosed phase naturally owns the remaining scope |
| Failure to auto-close after merge | Agents updated implementation docs but did not do the post-merge Effort closeout | After merge, flip status, add final note, update README/registry, and push a handoff |
| Orphaned Effort PRs | A recurring run opened an Effort hygiene or implementation PR, then a later run ignored it and created overlapping work | Check open PRs and recent handoffs before creating a branch; update, close, or explicitly supersede stale Effort PRs instead of stacking duplicates |
| Hygiene-only loop | The recurring audit kept the taxonomy clean but never advanced the active standalone work | After hygiene is clean, choose one unblocked `Open` or `In Progress` Effort for a PR-sized implementation slice when a clear next action exists |
| Priority by vibes | An agent chose the most interesting Effort rather than the one with evidence-backed priority or dependency value | Rank candidates by explicit priority, recent user/validation pain, shared dependency value, clear validation path, and smallest useful slice |
| `In Progress` ownership confusion | Agents treated `In Progress` as either "already handled" or "free to pile onto" | Inspect open PRs, recent handoffs, and blocked reports; continue only with a clear non-conflicting next slice |
| Confusing technical summaries | File titles and one-line summaries required too much context to understand | Keep `effort-###` filenames and plain-English one-line summaries |
| Active-list bloat | Resolved, governance, and initiative-owned items stayed in the active read list | Keep `efforts/README.md` limited to active standalone Efforts; put history in `registry.md` |
| Agent mirror drift | `AGENTS.md` or `CLAUDE.md` missed an active Effort that was added to `efforts/README.md` | Compare the active Effort mirrors directly any time an Effort is created, resolved, or audited |

## Audit Steps

1. Start from fresh `origin/main` and check open GitHub PRs before changing files.
   - Search for open PRs touching Efforts, Efforts hygiene, active Effort domains, or prior recurring-run branches.
   - If an earlier Efforts hygiene/implementation PR is still open, inspect it before creating new work. Rebase/update it only if you own the branch and the scope is still valid; otherwise document whether it is blocked, stale, superseded, or waiting for review.
   - Do not create a second hygiene PR for the same stale state unless the new branch explicitly supersedes or closes the old path.
2. Check `docs/handoffs/*-blocked.md` for blockers related to active Efforts, active INITs, validation lanes, or prior automation runs.
3. Read `efforts/README.md` for the active list.
4. Read `efforts/registry.md` only as needed for historical status or stale-link checks.
5. Scan for **status mirroring drift** (the common “stale corner sentence” failure mode):
   - Search for status-shaped phrases like `remains open`, `still active`, `active Effort`, `current active`, `active Effort read list`, `keep EFF-`, or `keeps EFF-` across `initiatives/`, `product-decisions/`, `docs/workflows/`, and resolved Effort files.
   - Replace cross-doc status claims with links to the authoritative home (Effort header or INIT resume point), or time-qualify the statement if it is truly historical chronology.
   - Suggested command (tune the phrase list as needed when new drift patterns are discovered):
     - `rg -n "remains open|still active|active Effort|current active|active Effort read list|keep EFF-|keeps EFF-" initiatives product-decisions docs/workflows efforts`
6. Compare **agent read-list mirrors** directly.
   - `efforts/README.md` is authoritative for the active Effort read list, but `AGENTS.md` and `CLAUDE.md` mirror it for first-contact agent instructions.
   - When an Effort is created, resolved, deferred, or audited, verify every active Effort ID in `efforts/README.md` appears in both `AGENTS.md` and `CLAUDE.md` with an accurate read-before-work trigger.
   - Also verify removed/resolved Effort IDs are not still listed as active in either agent file.
   - Do not rely only on broad `rg` hits. A missing mirror entry can be hidden when the Effort appears correctly in INITs, registry rows, or handoffs.
7. For each active Effort, ask:
   - Has merged work already satisfied it?
   - Does it naturally belong to a specific unclosed phase inside an active INIT?
   - Has the work already been addressed in the past, either fully or partially, and is that outcome already documented?
   - If it is already shipped, is the accepted outcome documented in the appropriate closed phase / chronology location?
   - If it would move under an INIT, has the target unclosed phase been updated in the same branch so ownership is explicit?
   - Is it really a workflow/ADR/PD?
   - Does the one-line summary still explain the goal to a human?
   - Does the active read trigger still prevent useful mistakes?
8. Close or repoint stale Efforts in the same branch.
   - If the work is already done, resolve it and document the accepted outcome in the appropriate closed INIT phase / chronology location.
   - If the work is not done but a specific unclosed INIT phase clearly owns it, update that phase and the INIT in the same branch, then resolve the Effort into that phase-owned work.
   - If the work does not clearly belong to a specific unclosed INIT phase, keep it as an Effort even when it is adjacent to initiative work. Add cross-references instead of forcing it into the INIT.
9. Update `AGENTS.md`, `CLAUDE.md`, `initiatives/registry.md`, relevant INITs, relevant PDs/workflow docs, the Efforts README, and the Effort registry if the source of truth changes.
10. If hygiene changes active status, ownership, routing, or taxonomy in a non-trivial way, open the docs PR and stop unless the implementation work is directly dependent on that hygiene decision and still has a clear validation path.
11. If hygiene is clean and the task or automation asks to advance Efforts, use the implementation loop below.
12. Write a handoff with what changed, why it changed, remaining active Efforts, implementation choice if any, and verification.
13. Ask Claude for peer review through the PR/handoff path when the taxonomy, closeout rationale, or implementation risk is non-trivial.

## Implementation Loop

The recurring Efforts automation may implement work only after the audit steps above are clean enough that the active work pool is trustworthy.

Definitions:

- **Active Effort:** an Effort listed in `efforts/README.md` with status `Open` or `In Progress`.
- **Implementation candidate:** an active Effort with a clear next action, no conflicting open owner/branch, no unresolved blocker that requires Wilson, and acceptance/validation criteria specific enough for a PR-sized slice.
- **PR-sized slice:** the smallest useful change that can be reviewed, validated, documented, and handed off without dragging unrelated Efforts or INIT phases into the same branch.
- **Highest priority:** the candidate with the strongest evidence-backed reason to go first, not merely the first row in the README.

Candidate selection:

1. Exclude `Blocked`, `Deferred`, and `Resolved` Efforts unless the task is explicitly to unblock, close out, reclassify, or reopen them.
2. Prefer explicit `Priority:` metadata in the Effort file when present.
3. Prefer recently observed user pain, validation failures, stale validation impact, or product regressions over tidy cleanup.
4. Prefer work that unlocks or de-risks multiple Efforts, INIT phases, validation lanes, or future PRs.
5. Prefer candidates with a clear test/validation lane and clear negative scope.
6. Avoid taking over an existing branch or PR unless that is the intended task and the current owner/handoff makes it safe.
7. If the ranking depends on product direction, architecture, security/privacy, secrets, Replit-side setup, or merge policy, stop and ask Wilson with the smallest concrete decision needed.

Implementation rules:

- Read the chosen Effort, linked INITs, linked phase records, linked PDs/workflows, recent handoffs, and any related active Efforts before editing runtime code.
- Use a fresh feature branch with clear ownership, normally `codex/<effort-short-name>` for Codex work.
- Keep the implementation slice scoped to one Effort unless another source doc explicitly owns the shared change.
- Update the Effort only when the work adds durable signal: a new decision, validation result, blocker, status change, or resolution evidence.
- If status or active-list membership changes, update `efforts/README.md`, `efforts/registry.md`, `AGENTS.md`, and `CLAUDE.md` in the same branch.
- PR descriptions and handoffs should include a short **Hygiene result** and **Effort implementation choice** so reviewers can see why this Effort was selected.
- Do not merge implementation PRs without explicit human merge instruction or a separate workflow rule that grants authority for that exact PR type.

## Cross-Reference Docs

Use these docs deliberately during the audit instead of relying on a generic folder sweep:

- [`../workflows/effort-system-audit.md`](effort-system-audit.md) for the audit steps, failure modes, and closure acceptance criteria.
- [`../workflows/testing-and-acceptance.md`](testing-and-acceptance.md) when an Effort carries validation workflow, merge-readiness, or acceptance-criteria content that may belong in the shared testing workflow instead.
- [`../workflows/documentation-routing.md`](documentation-routing.md) when deciding whether the durable home is a PD, feature phase record, INIT, Effort, workflow doc, or handoff.
- [`../workflows/agent-merge-authority.md`](agent-merge-authority.md) before marking a PR ready, relying on checks as merge evidence, or merging docs/process branches.
- [`../handoffs/README.md`](../handoffs/README.md) for handoff shape and blocked-handoff discovery.
- [`../../product-decisions/pd-007-effort-status-and-registry-workflow.md`](../../product-decisions/pd-007-effort-status-and-registry-workflow.md) when deciding whether something should remain an Effort at all or graduate into a PD/workflow/INIT.
- [`../../product-decisions/README.md`](../../product-decisions/README.md) when the likely durable home is a top-level PD or feature-phase record rather than an Effort.
- [`../../initiatives/registry.md`](../../initiatives/registry.md) plus the relevant active INIT file when initiative phase ownership, current phase, or last-signal text may need to change.
- [`../../AGENTS.md`](../../AGENTS.md) and [`../../CLAUDE.md`](../../CLAUDE.md) when the active Effort read list or planning-doc workflow rules need to stay in sync.
- Domain-specific source docs already linked from the Effort or INIT when those are the likely durable home for the remaining signal.

## Closure Acceptance Criteria

Before closing or repointing an Effort, use this checklist:

1. **Shipped vs unshipped is explicit.**
   - Do not close an Effort as if it is done unless the underlying product or workflow work is actually shipped/accepted.
2. **A single unclosed phase clearly owns it.**
   - If the work is moving into an INIT, one specific unclosed phase or active slice should naturally own the remaining scope.
   - Determine "unclosed" from the INIT's phase table, current phase, and current resume point, not from the phase-record `Status:` line alone. Some future phase docs are already `Accepted` as specs even though implementation has not started yet.
   - If ownership is split across multiple future phases or surfaces, keep it as an Effort.
3. **The target phase is updated in the same branch.**
   - The receiving phase/INIT should be edited at the same time so ownership is not inferred from old docs.
4. **Resume point stays obvious.**
   - A future agent should be able to answer “where do I pick this up?” without reading multiple closed phases to reconstruct intent.
5. **Historical source is preserved.**
   - Keep the originating closed-phase deferral or chronology note when it explains how the work was discovered.
6. **Cross-surface scope is honest.**
   - If the work spans setup, Settings, post-cook cleanup, or multiple initiative surfaces, do not force it into one phase unless the receiving phase really covers that breadth.
7. **Discoverability is preserved.**
   - The final home should still be easy to find through the terms a future agent is likely to search.
8. **No redundancy is introduced.**
   - After the move, there should be one clear active home. Historical references are fine; duplicate active ownership is not.
   - Avoid cross-doc status sentences that can drift. Prefer links to Effort headers / INIT resume points.
9. **Acceptance/validation context survives the move.**
   - If the Effort carried meaningful open questions, validation expectations, or design constraints, the new home must preserve them or link back clearly.

## Automation Prompt

Use this in the Codex Automations menu for the recurring Efforts hygiene and implementation loop:

```text
Daily Efforts hygiene and implementation: start from fresh origin/main. First run hygiene. Review efforts/README.md, efforts/registry.md, initiatives/registry.md, active INITs, product-decisions/README.md, product-decisions/pd-007-effort-status-and-registry-workflow.md, docs/workflows/effort-system-audit.md, docs/workflows/documentation-routing.md, docs/workflows/testing-and-acceptance.md, docs/workflows/agent-merge-authority.md, and docs/handoffs/README.md. Check open GitHub PRs for prior Efforts hygiene or implementation branches and for branches touching active Effort domains; inspect any still-open prior run before creating new work. Check docs/handoffs/*-blocked.md and recent handoffs for blockers or active ownership.

For every active Effort, determine whether it is still a standalone to-do, has been resolved by merged work, naturally belongs to a specific unclosed phase inside an active INIT, or should graduate into a PD/workflow doc. When testing INIT ownership, use the INIT phase table, current phase, and current resume point rather than the phase-record Status line alone. Check whether the work has actually been addressed in the past before closing it. Apply the closure acceptance criteria in docs/workflows/effort-system-audit.md. If the work is already shipped, resolve it and document the accepted outcome in the appropriate closed INIT phase/chronology location. If the work is not shipped but a specific unclosed INIT phase clearly owns it, update that phase and the INIT in the same branch and resolve the Effort into that phase-owned work. If no specific unclosed INIT phase naturally owns it, keep it as an Effort even if the initiative is adjacent. Add or refresh plain-English summaries, update the registry/read lists, and sync AGENTS.md / CLAUDE.md when the active list changes.

If hygiene finds non-trivial status, taxonomy, ownership, or stale-open-PR work, handle that first with a docs/handoff PR and stop unless the implementation slice is clearly safe and directly depends on the hygiene change. If hygiene is clean, choose one unblocked Open or In Progress Effort for a PR-sized implementation slice. Prefer explicit Priority metadata, recent user or validation pain, work that unlocks multiple Efforts/INITs, a clear validation lane, and the smallest useful slice. Do not implement Blocked, Deferred, or Resolved Efforts unless the task is explicitly to unblock, close out, reclassify, or reopen them. Stop and ask Wilson if the next step needs product direction, architecture, secrets/security, Replit-side action, or merge authority.

For the chosen Effort, read the Effort, linked INITs/phase records/PDs/workflows, related active Efforts, recent handoffs, and applicable validation workflow before editing code. Keep changes scoped to one Effort and one PR-sized slice. Update the Effort only when the work adds durable signal, and update README/registry/AGENTS/CLAUDE if status or active-list membership changes. Run the checks required by docs/workflows/testing-and-acceptance.md for the changed surface. Write a handoff and open a PR with Hygiene result, Effort implementation choice, files changed, validation evidence, negative scope, and open items. Request Claude peer review when taxonomy, closeout rationale, or implementation risk is non-trivial. Do not merge PRs without explicit Wilson approval or a separate workflow rule that grants authority for that exact PR type. Rename the thread after selecting the Effort so recurring runs are distinguishable.
```

## 2026-05-09 Cleanup Record

The cleanup renamed `epics/` to `efforts/`, changed numbered filenames to `effort-###-...`, moved the durable workflow decision to [`PD-007`](../../product-decisions/pd-007-effort-status-and-registry-workflow.md), and closed the stale/governance items Wilson groomed:

- EFF-004 closed because Mobile Refresh phases now own the full-row selection-control pattern.
- EFF-005 closed into [`testing-and-acceptance.md`](testing-and-acceptance.md).
- EFF-007 closed because scan no-detection feedback is part of INIT-001 scan behavior, not a standalone active Effort.
- EFF-009 closed because the shared parser work shipped through Mobile Refresh phases.
- EFF-016 closed because INIT-001 Phase 3.1 owns Slop Bowl visual redesign/polish.
- EFF-019 closed into INIT-002, [`PD-010`](../../product-decisions/pd-010-ai-error-telemetry-allowlist.md), and [`ai-error-handling-and-telemetry.md`](ai-error-handling-and-telemetry.md).
- EFF-020 closed into this audit workflow, [`testing-and-acceptance.md`](testing-and-acceptance.md), and PD-007.

## 2026-05-11 Cleanup Record

The weekly hygiene pass initially tried to close EFF-013 and EFF-014 because both were adjacent to Mobile Refresh work.

That interpretation was later corrected: adjacency to an INIT is not enough by itself. If no specific unclosed phase clearly owns the remaining work, the item should stay as an active Effort.

## 2026-05-11 Follow-up Clarification

Wilson flagged an important ambiguity after the cleanup: closed standalone Efforts can read like shipped product work when their only remaining pointers are buried in already-merged phase docs, and a dedicated non-phase INIT parking lot is not the right fix if no unclosed phase really owns the work.

The corrected rule is now part of this workflow:

- Keep historical deferral notes in the closed phase records that originally created them.
- If the work is already shipped, a closed phase / chronology note is enough.
- If the work is unshipped, only move it out of the Effort system when a specific unclosed INIT phase naturally owns it and that phase is updated in the same branch.
- If no such phase exists yet, keep the item as an Effort and cross-reference the INIT instead of forcing a premature home.
