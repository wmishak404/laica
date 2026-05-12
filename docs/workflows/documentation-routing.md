# Documentation Routing and Closeout Workflow

This workflow keeps planning docs useful without turning every cleanup into another growing checklist. Use it when a change creates, updates, graduates, or closes product rationale, feature specs, validation policy, initiative state, Efforts, or handoffs.

## Plain-English Rule

Every meaningful change should update the smallest durable home that future agents need, then close the loop through indexes, active read lists, and handoffs only where the source of truth actually changed.

Do not copy the same rationale into every related doc. Pick the primary home, link from the surrounding indexes, and record point-in-time evidence in the handoff or PR.

## Consult Before Filing

Routing starts by consulting the system, not by choosing a file. Before deciding where a request belongs, identify the product capability, behavior, or operating discipline being changed. Do not let the first UI entry point, affected file, or visible screen become the owner by default.

Use this order:

1. Name the capability, behavior, or discipline at stake.
2. Read the current source docs for that domain: relevant INIT, current phase records, top-level PDs, active Efforts, active epics, workflow docs, design guidance, and validation guidance.
3. Decide whether the work is already owned by a current or future phase, durable policy, repeatable workflow, or standalone Effort.
4. Only then choose the primary home from the routing matrix.

For example, a request to combine Pantry and Kitchen scanning should not route only from the setup screen where the complaint appeared. First identify the changed capability, such as inventory capture flow, scan-session policy, duplicate handling, setup completeness, or ongoing ingredient management, then consult the governing INIT/PD/Effort/workflow before filing.

## Closed Phase Boundary

Do not create a new minor phase under an INIT phase that is already closed and merged once the initiative has moved to a later phase. For example, if Phase 2 is closed and work is now in Phase 3.1 or later, do not add `pd-phase-02-3-*` as active scope.

Use one of these homes instead:

- the current or next phase record, when the request changes active initiative work
- the INIT current-state or chronology section, when the important fact is initiative history or resume context
- a top-level PD, when the outcome becomes durable product or operating policy
- an active or new Effort, only when the work is concrete and not owned by an active INIT, phase, PD, ADR, or workflow

Closed phase records may receive a historical note or link when needed, but they should not become new active work queues after the initiative has advanced.

## Routing Matrix

| Need | Primary home | Update when |
|---|---|---|
| Durable product, UX, architecture, privacy, or process decision | Top-level `product-decisions/pd-NNN-*.md` | The decision should outlive one branch or phase and future agents would make worse choices without the rationale |
| Feature- or phase-scoped specs, acceptance criteria, open questions, and final outcomes | `product-decisions/features/<feature>/pd-phase-NN-*.md` or another feature-scoped `pd-*.md` | The signal belongs to an active feature and is not durable enough for a top-level PD |
| Multi-phase initiative state, source docs, validation status, PR status, assets, and current resume point | `initiatives/INIT-NNN-*.md` plus `initiatives/registry.md` | A change affects the initiative timeline, phase status, validation state, or next resume point |
| Standalone follow-up not owned by an active INIT, phase, PD, ADR, or workflow | `efforts/effort-NNN-*.md` plus active Effort read lists | Work is concrete, important, and not naturally owned elsewhere yet |
| Repeatable operating procedure | `docs/workflows/*.md` | Agents should follow the rule across multiple future tasks |
| Visual standard | `design_guidelines.md` with PD-005 for governance | The change affects palette, typography, surface posture, mockup conformance, or visual acceptance |
| Service-backed validation focus | `docs/workflows/replit-validation-focus.md` | A change affects which Replit checks prove readiness |
| Local-vs-Replit authority or environment boundaries | ADR-0001 and relevant workflow docs | The change affects where runtime truth, secrets, DB access, or deployment validation live |
| Point-in-time command output, branch status, review notes, or transfer context | `docs/handoffs/YYYY-MM-DD-<agent>-*.md` and PR description | Evidence or coordination is useful, but should not become long-lived policy |

## Closeout Loop

Before closing a branch or PR, run this short loop:

1. Run the consult-before-filing pass so the system, not the first entry point, determines ownership.
2. Identify the primary durable home using the routing matrix.
3. Update only the linked indexes/read lists whose status, title, source doc, or active trigger changed.
4. If an Effort, INIT phase, or feature phase is resolved, moved, or reopened, update its registry/read list in the same branch.
5. If the change adds or revises a repeatable workflow, update the workflow doc and link it from `AGENTS.md` / `CLAUDE.md` only when it changes global agent behavior.
6. If the change depends on volatile external facts, mark the owning PD with volatility metadata and verify those facts before implementation or merge.
7. Record validation, deferrals, and remaining unvalidated scope in the handoff/PR rather than duplicating them into every source doc.
8. Run `git diff --check` and a targeted reference search for renamed IDs, moved files, or old source-of-truth names.
9. Start the final response, handoff, and PR summary with what changed overall, then keep the concrete changelog and validation details.

## What Changed Overall

Every completed task should leave Wilson with a concise overall summary before the detailed task list. This section does not replace the normal changelog, file list, validation notes, or deferrals.

Include:

- what changed across the product, workflow, or documentation system
- why it matters to future agent decisions, coordination, or merge readiness
- the learning or discipline added to the whole system, when the task produced one
- validation status, unvalidated scope, and any explicit deferrals or owner decisions

If a task has no broader system learning, say that plainly. Do not invent process lessons just to fill the section.

After this section, still list what was done in practical terms: files changed, docs updated, commands run, checks passed or skipped, PR/branch state, and remaining work.

## ID and Filename Conventions

- Product decision filenames: `product-decisions/pd-NNN-short-name.md`; heading ID: `PD-NNN`.
- Feature decision filenames: `product-decisions/features/<feature>/pd-phase-NN-short-name.md` for phases, or `pd-short-name.md` for non-phase feature records.
- Effort filenames: `efforts/effort-NNN-short-name.md`; visible ID: `EFF-NNN`.
- Effort files renamed from the old Epic system keep `**Former ID:** EPIC-NNN` near the top for historical search.
- Active read lists should show full visible IDs such as `EFF-014`, not only `014`.

## Volatile Decisions

Some accepted decisions depend on facts that age faster than product intent: provider model availability, pricing, laws, deployment limits, package security posture, or third-party API behavior.

For those PDs, add lightweight metadata near the top:

```markdown
**Volatility:** Stable | External/vendor-dependent | Active review needed
**Review trigger:** <when to re-check authoritative sources>
```

Use the metadata to prompt verification, not to reopen settled product intent. When implementation relies on a volatile fact, verify it against the authoritative source during that branch and record the result in the handoff or PR.

## Relationship to Existing Workflows

- Use [`testing-and-acceptance.md`](testing-and-acceptance.md) for validation ownership and merge-readiness evidence.
- Use [`effort-system-audit.md`](effort-system-audit.md) when closing, repointing, or auditing Efforts.
- Use [`replit-validation-focus.md`](replit-validation-focus.md) when selecting targeted Replit validation.
- Use [`ai-error-handling-and-telemetry.md`](ai-error-handling-and-telemetry.md) for AI error and telemetry workflow details.
