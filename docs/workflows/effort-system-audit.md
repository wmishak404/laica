# Effort System Audit Workflow

## Operating Principles

Follow [operating-principles.md](operating-principles.md): evidence first, no unsupported assumptions, objective detail, visible rationale and provenance, feedback from first principles, no hacks or duplicate paths, deletion of obsolete paths, explicit decisions, and blocking reports with exact missing inputs and smallest next actions.

This workflow records how agents audit the Efforts system, close stale Efforts, and prevent old Epic-style drift from coming back.

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
| Confusing technical summaries | File titles and one-line summaries required too much context to understand | Keep `effort-###` filenames and plain-English one-line summaries |
| Active-list bloat | Resolved, governance, and initiative-owned items stayed in the active read list | Keep `efforts/README.md` limited to active standalone Efforts; put history in `registry.md` |
| Agent mirror drift | `AGENTS.md` or `CLAUDE.md` missed an active Effort that was added to `efforts/README.md` | Compare the active Effort mirrors directly any time an Effort is created, resolved, or audited |

## Audit Steps

1. Read `efforts/README.md` for the active list.
2. Read `efforts/registry.md` only as needed for historical status or stale-link checks.
3. Scan for **status mirroring drift** (the common “stale corner sentence” failure mode):
   - Search for status-shaped phrases like `remains open`, `still active`, `active Effort`, `current active`, `active Effort read list`, `keep EFF-`, or `keeps EFF-` across `initiatives/`, `product-decisions/`, `docs/workflows/`, and resolved Effort files.
   - Replace cross-doc status claims with links to the authoritative home (Effort header or INIT resume point), or time-qualify the statement if it is truly historical chronology.
   - Suggested command (tune the phrase list as needed when new drift patterns are discovered):
     - `rg -n "remains open|still active|active Effort|current active|active Effort read list|keep EFF-|keeps EFF-" initiatives product-decisions docs/workflows efforts`
4. Compare **agent read-list mirrors** directly.
   - `efforts/README.md` is authoritative for the active Effort read list, but `AGENTS.md` and `CLAUDE.md` mirror it for first-contact agent instructions.
   - When an Effort is created, resolved, deferred, or audited, verify every active Effort ID in `efforts/README.md` appears in both `AGENTS.md` and `CLAUDE.md` with an accurate read-before-work trigger.
   - Also verify removed/resolved Effort IDs are not still listed as active in either agent file.
   - Do not rely only on broad `rg` hits. A missing mirror entry can be hidden when the Effort appears correctly in INITs, registry rows, or handoffs.
5. For each active Effort, ask:
   - Has merged work already satisfied it?
   - Does it naturally belong to a specific unclosed phase inside an active INIT?
   - Has the work already been addressed in the past, either fully or partially, and is that outcome already documented?
   - If it is already shipped, is the accepted outcome documented in the appropriate closed phase / chronology location?
   - If it would move under an INIT, has the target unclosed phase been updated in the same branch so ownership is explicit?
   - Is it really a workflow/ADR/PD?
   - Does the one-line summary still explain the goal to a human?
   - Does the active read trigger still prevent useful mistakes?
6. Close or repoint stale Efforts in the same branch.
   - If the work is already done, resolve it and document the accepted outcome in the appropriate closed INIT phase / chronology location.
   - If the work is not done but a specific unclosed INIT phase clearly owns it, update that phase and the INIT in the same branch, then resolve the Effort into that phase-owned work.
   - If the work does not clearly belong to a specific unclosed INIT phase, keep it as an Effort even when it is adjacent to initiative work. Add cross-references instead of forcing it into the INIT.
7. Update `AGENTS.md`, `CLAUDE.md`, `initiatives/registry.md`, relevant INITs, relevant PDs/workflow docs, the Efforts README, and the Effort registry if the source of truth changes.
8. Write a handoff with what changed, why it changed, remaining active Efforts, and verification.
9. Ask Claude for peer review through the PR/handoff path when the taxonomy or closeout rationale is non-trivial.

## Cross-Reference Docs

Use these docs deliberately during the audit instead of relying on a generic folder sweep:

- [`../workflows/effort-system-audit.md`](effort-system-audit.md) for the audit steps, failure modes, and closure acceptance criteria.
- [`../workflows/testing-and-acceptance.md`](testing-and-acceptance.md) when an Effort carries validation workflow, merge-readiness, or acceptance-criteria content that may belong in the shared testing workflow instead.
- [`../workflows/documentation-routing.md`](documentation-routing.md) when deciding whether the durable home is a PD, feature phase record, INIT, Effort, workflow doc, or handoff.
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

Use this in the Codex Automations menu for a recurring docs-only hygiene check:

```text
Weekly effort hygiene audit: from fresh origin/main, review efforts/README.md, efforts/registry.md, initiatives/registry.md, active INITs, product-decisions/README.md, product-decisions/pd-007-effort-status-and-registry-workflow.md, docs/workflows/effort-system-audit.md, and docs/workflows/testing-and-acceptance.md. Open any domain-specific PD/workflow already linked from an active Effort when that is the likely durable home. For every active Effort, determine whether it is still a standalone to-do, has been resolved by merged work, naturally belongs to a specific unclosed phase inside an active INIT, or should graduate into a PD/workflow doc. When testing INIT ownership, use the INIT phase table, current phase, and current resume point rather than the phase-record `Status:` line alone. Check whether the work has actually been addressed in the past before closing it. Apply the closure acceptance criteria in `docs/workflows/effort-system-audit.md`: shipped vs unshipped must be explicit; one specific unclosed phase must clearly own remaining scope; the receiving phase/INIT must be updated in the same branch; resume point and discoverability must stay obvious; and cross-surface work should stay as an Effort if no single unclosed phase truly owns it. If the work is already shipped, resolve it and document the accepted outcome in the appropriate closed INIT phase/chronology location. If the work is not shipped but a specific unclosed INIT phase clearly owns it, update that phase and the INIT in the same branch and resolve the Effort into that phase-owned work. If no specific unclosed INIT phase naturally owns it, keep it as an Effort even if the initiative is adjacent. Add or refresh plain-English summaries, update the registry/read lists, sync AGENTS.md / CLAUDE.md when the active list changes, and write a handoff. Do not change runtime code. Open a docs-only PR and request Claude peer review before merge.
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
