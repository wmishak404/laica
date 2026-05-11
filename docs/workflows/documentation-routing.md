# Documentation Routing and Closeout Workflow

This workflow keeps planning docs useful without turning every cleanup into another growing checklist. Use it when a change creates, updates, graduates, or closes product rationale, feature specs, validation policy, initiative state, Efforts, or handoffs.

## Plain-English Rule

Every meaningful change should update the smallest durable home that future agents need, then close the loop through indexes, active read lists, and handoffs only where the source of truth actually changed.

Do not copy the same rationale into every related doc. Pick the primary home, link from the surrounding indexes, and record point-in-time evidence in the handoff or PR.

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

1. Identify the primary durable home using the routing matrix.
2. Update only the linked indexes/read lists whose status, title, source doc, or active trigger changed.
3. If an Effort, INIT phase, or feature phase is resolved, moved, or reopened, update its registry/read list in the same branch.
4. If the change adds or revises a repeatable workflow, update the workflow doc and link it from `AGENTS.md` / `CLAUDE.md` only when it changes global agent behavior.
5. If the change depends on volatile external facts, mark the owning PD with volatility metadata and verify those facts before implementation or merge.
6. Record validation, deferrals, and remaining unvalidated scope in the handoff/PR rather than duplicating them into every source doc.
7. Run `git diff --check` and a targeted reference search for renamed IDs, moved files, or old source-of-truth names.

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
