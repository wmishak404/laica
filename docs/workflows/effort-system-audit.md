# Effort System Audit Workflow

This workflow records how agents audit the Efforts system, close stale Efforts, and prevent old Epic-style drift from coming back.

## Why This Exists

Wilson found that the former Epic system had become bloated and hard to trust. Some files were stale to-do lists, some were really INIT phase work, and some were governance/workflow records that belonged in more central docs.

The rename to Efforts narrows the system: Efforts are standalone follow-up records, not a catch-all planning drawer.

## Known Failure Modes

| Inefficiency | What went wrong | Future audit check |
|---|---|---|
| Stale statuses | Work shipped or moved elsewhere, but the file stayed active | Compare each active Effort against merged PRs, INIT phase state, and PD/workflow docs |
| Duplicate governance roles | Testing, telemetry, and workflow rules lived in Efforts instead of central docs | Move durable procedures to `docs/workflows/`, ADRs, or PDs |
| INIT-worthy work filed as Efforts | Mobile Refresh follow-ups were tracked outside INIT-001 even when the INIT already owned the phase | If work belongs to an active initiative or future phase, update that INIT/phase record instead |
| Failure to auto-close after merge | Agents updated implementation docs but did not do the post-merge Effort closeout | After merge, flip status, add final note, update README/registry, and push a handoff |
| Confusing technical summaries | File titles and one-line summaries required too much context to understand | Keep `effort-###` filenames and plain-English one-line summaries |
| Active-list bloat | Resolved, governance, and initiative-owned items stayed in the active read list | Keep `efforts/README.md` limited to active standalone Efforts; put history in `registry.md` |

## Audit Steps

1. Read `efforts/README.md` for the active list.
2. Read `efforts/registry.md` only as needed for historical status or stale-link checks.
3. For each active Effort, ask:
   - Has merged work already satisfied it?
   - Is it now owned by an INIT or feature phase?
   - Is it really a workflow/ADR/PD?
   - Does the one-line summary still explain the goal to a human?
   - Does the active read trigger still prevent useful mistakes?
4. Close or repoint stale Efforts in the same branch.
5. Update `AGENTS.md`, `CLAUDE.md`, INITs, PDs, workflow docs, the Efforts README, and registry if the source of truth changes.
6. Write a handoff with what changed, why it changed, remaining active Efforts, and verification.
7. Ask Claude for peer review through the PR/handoff path when the taxonomy or closeout rationale is non-trivial.

## Automation Prompt

Use this in the Codex Automations menu for a recurring docs-only hygiene check:

```text
Weekly effort hygiene audit: from fresh origin/main, review efforts/README.md, efforts/registry.md, active INITs, product-decisions/README.md, and docs/workflows/. For every active Effort, determine whether it is still a standalone to-do, has been resolved by merged work, belongs inside an active INIT/phase record, or should graduate into a PD/workflow doc. Add or refresh plain-English summaries, close resolved efforts, update the registry/read lists, and write a handoff. Do not change runtime code. Open a docs-only PR and request Claude peer review before merge.
```

## 2026-05-09 Cleanup Record

The cleanup renamed `epics/` to `efforts/`, changed numbered filenames to `effort-###-...`, moved the durable workflow decision to [`PD-007`](../../product-decisions/pd-007-effort-status-and-registry-workflow.md), and closed the stale/governance items Wilson groomed:

- EFFORT-004 closed because Mobile Refresh phases now own the full-row selection-control pattern.
- EFFORT-005 closed into [`testing-and-acceptance.md`](testing-and-acceptance.md).
- EFFORT-007 closed because scan no-detection feedback is part of INIT-001 scan behavior, not a standalone active Effort.
- EFFORT-009 closed because the shared parser work shipped through Mobile Refresh phases.
- EFFORT-016 closed because INIT-001 Phase 3.1 owns Slop Bowl visual redesign/polish.
- EFFORT-019 closed into INIT-002, [`PD-010`](../../product-decisions/pd-010-ai-error-telemetry-allowlist.md), and [`ai-error-handling-and-telemetry.md`](ai-error-handling-and-telemetry.md).
- EFFORT-020 closed into this audit workflow, [`testing-and-acceptance.md`](testing-and-acceptance.md), and PD-007.

## 2026-05-11 Cleanup Record

The weekly hygiene pass confirmed the Effort system should stay limited to true standalones:

- EFFORT-013 closed because pantry spell correction is future Mobile Refresh phase work, not a standalone backlog track.
- EFFORT-014 closed because richer latest-scan and duplicate-review UX is also Mobile Refresh phase work.
- `AGENTS.md`, `CLAUDE.md`, `efforts/README.md`, and `INIT-001` were updated so the active read list now only includes true standalone follow-ups.
