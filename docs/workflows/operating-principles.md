# Operating Principles Workflow

## Operating Principles Reminder

This workflow is the canonical source for the top-of-file operating-principles reminder in `AGENTS.md`, `CLAUDE.md`, `replit.md`, and every workflow document. Apply these principles before making decisions, giving feedback, implementing changes, validating work, or handing context to another agent.

## Plain-English Rule

Work from evidence, show the context needed to trust the result, keep the active system clean, and record decisions where future agents can find them.

## Principles

1. **Evidence first; no unsupported assumptions.** Start from repo state, source docs, validated behavior, and user-stated intent. Separate fact, inference, preference, and open question.
2. **Be objective and detail-oriented.** Evaluate behavior, tradeoffs, risks, and outcomes plainly. Do not defend prior work, guess intent, or smooth over uncertainty.
3. **Show visible rationale, context, and provenance.** Include the files, commands, docs, prior decisions, validation evidence, assumptions, and examples another agent needs to trust and resume the work.
4. **Give feedback from first principles.** Feedback should explain the principle behind the critique, the concrete reasoning, provenance, and specific positive and negative examples from past or current work.
5. **No hacks, duplicate paths, or half-migrations.** Do not leave parallel implementations, compatibility shims, abandoned logic, or temporary paths unless explicitly approved and documented with an owner and removal trigger.
6. **Delete what is no longer needed; rely on git history.** Prefer removing obsolete code/docs over preserving clutter just in case.
7. **Explicit over implicit; no tribal knowledge.** If future agents need to know why something works this way, record it in the durable source of truth.
8. **Capture decisions as they happen.** Record product, UX, architecture, validation, workflow, and implementation decisions during or after the work in the right home.
9. **When blocked, produce a blocking report.** Stop guessing. State the exact blocker, missing input or permission, what was already tried, smallest next actions, owner if known, and resume point.
10. **Turn bugs into durable learning.** When validation or user testing exposes a bug, treat it as evidence about the system, not only as a patch. Capture the cause, regression test or validation gap, durable rule or spec update, and remaining re-test requirement in the smallest appropriate source of truth.

## Decision Homes

| Need | Durable home |
|---|---|
| Durable product, UX, architecture, privacy, model, or process decision | `product-decisions/` |
| Feature- or phase-scoped decisions, acceptance criteria, and open questions | `product-decisions/features/` |
| Multi-phase initiative state, source docs, PR status, validation status, and resume point | `initiatives/` |
| Standalone follow-up not owned by an INIT, phase, PD, ADR, or workflow | `efforts/` |
| Architecture decisions | `docs/adr/` |
| Repeatable operating procedures | `docs/workflows/` |
| Point-in-time branch evidence, review notes, validation notes, and transfer context | `docs/handoffs/` and PR descriptions |
| UI visual standards and governance | `design_guidelines.md` and `product-decisions/pd-005-ui-governance.md` |

Use [`documentation-routing.md`](documentation-routing.md) when the right home is not obvious.

## Feedback Standard

When giving implementation, design, product, or process feedback, include:

- the first principle or governing rule behind the feedback
- the concrete reasoning for why the current work does or does not satisfy it
- provenance: files, docs, PRs, commands, validation notes, or user decisions that support the feedback
- at least one positive example and one negative example when the feedback is teaching a reusable standard

Do not frame preference as fact. Label recommendations, tradeoffs, assumptions, and unresolved questions.

## Bug and Regression Learning

When a bug, regression, or surprising validation failure is found:

- State the observed behavior, expected behavior, environment, branch/SHA, and evidence that proves the bug.
- Identify the root cause or clearly label the current explanation as an inference.
- Add or update automated coverage when the bug can be reproduced locally or deterministically. If it cannot, record the Replit/human validation gap and the smallest re-test.
- Update the durable source of truth when the bug reveals a missing product rule, architecture rule, validation requirement, workflow discipline, or acceptance criterion.
- Record point-in-time details in the handoff and PR description so reviewers know which previous validation is stale and which SHA needs re-testing.

Do not leave the learning only in chat. Do not create a new Effort just to say a bug happened; create or update an Effort only when the remaining follow-up is standalone and not already owned by an INIT, phase record, PD, ADR, or workflow.

## Blocking Report Shape

When work cannot move forward without human input, external action, permissions, secrets, Replit-side intervention, or a product decision, leave a blocking report with:

- exact blocker
- missing input, access, approval, or environment action
- what was already checked or tried
- smallest next actions
- owner if known
- current branch, last relevant commit, changed files, and resume point

Do not keep retrying blindly or invent a workaround that creates a second path.

## Blocking Report Homes

Blocking reports are point-in-time resume context, not a new backlog system.

| Situation | Where the blocking report lives |
|---|---|
| Work stops in an agent conversation | Final response or status update in the current thread |
| Work has branch state, changed files, validation findings, or another agent/human may resume it | `docs/handoffs/YYYY-MM-DD-<agent>-<short-name>-blocked.md` |
| A PR already exists or will be opened for the blocked branch | PR description, mirrored from the handoff summary |
| The blocker changes durable initiative state, Effort status, phase acceptance, validation status, or a workflow rule | The owning INIT, Effort, feature phase record, PD, ADR, or workflow doc, plus the handoff/PR |

Do not create a new Effort just to store a blocked status. Create or update an Effort only when the unresolved follow-up is standalone and not already owned by an INIT, phase record, PD, ADR, or workflow.

## Blocker Discovery

Other agents should not wait for Wilson to ask whether blockers exist. When starting or resuming related work, agents must check the active source docs for the domain and scan `docs/handoffs/` for `*-blocked.md` files. Read the matching blocked handoff before continuing.

If an agent can safely unblock the work within its authority, it should do so, record what changed in its own handoff/PR, and update the owning source doc only when durable state changed. If the blocker still needs human judgment, secrets, Replit-side action, or an external dependency, keep the blocked handoff as the durable resume point and report the smallest next action back to Wilson.

Blocked handoffs are historical coordination records. Do not delete or rewrite them after unblocking; add the resolution in a follow-up handoff, PR description, or owning source doc when state changed.

## Examples

### Documentation routing

Positive example: A behavior change updates the smallest durable home, such as the relevant feature phase record or top-level PD, then records point-in-time validation and transfer context in a handoff or PR.

Negative example: The same rationale is copied into several related docs, leaving future agents unsure which version is authoritative.

### Replit validation

Positive example: A deployment-bound auth, DB, AI, or speech change cites [`replit-validation-focus.md`](replit-validation-focus.md), records what was validated on Replit, and includes `Last Replit-validated at: <commit-sha>` or `not yet validated`.

Negative example: A PR says "works locally" for a service-backed flow without naming which Replit drift vectors remain unvalidated.

### Effort and INIT ownership

Positive example: Before creating or closing an Effort, the agent checks active Efforts, the relevant INIT phase table, current resume point, and existing PD/workflow docs, then keeps one clear active owner.

Negative example: A new active Effort is created for work already owned by an unclosed INIT phase, splitting the source of truth.

### UI governance

Positive example: A UI change cites `product-decisions/pd-005-ui-governance.md` and `design_guidelines.md`, names the shared component/root wrapper or token requirement, and records the visual comparison needed to verify the result.

Negative example: A handoff says class names match while ignoring computed-style drift, wrapper specificity, or the actual visual comparison users will see.

### Cleanup and migration

Positive example: Once a new path is accepted, obsolete code/docs are removed in the same branch or documented with an explicit owner and removal trigger.

Negative example: A compatibility shim, old implementation branch, or duplicate workflow remains because it might be useful later, even though git history already preserves it.

### Blocking reports

Positive example: A Replit-only secret/action blocker is reported in the final response and mirrored into a dated handoff with the exact missing secret/action, what was already tried, the branch/SHA, and the first command or UI step to resume. If an INIT validation status changed, the INIT is updated too.

Negative example: An agent writes "blocked on Replit" in chat only, without the missing input, prior checks, branch/SHA, durable handoff, or resume point.

Positive discovery example: Before starting a related task, an agent checks `docs/handoffs/*-blocked.md`, reads the matching blocker, unblocks what it can, and records the resolution in its handoff/PR.

Negative discovery example: A human has to ask every agent whether blockers exist because the blocker was only left in chat or no agent checked blocked handoffs before resuming.

### Bug closeout

Positive example: Replit validation exposes a client/server auth race. The fix adds a regression test, updates the owning INIT and PD with the durable server-authoritative rule, refreshes the testing workflow so future auth-gated changes include that boundary, and marks the old Replit validation stale until the fixed SHA is re-tested.

Negative example: The code is patched and chat says "fixed," but no regression coverage, PR note, handoff update, or durable rule explains why the bug happened or how future work avoids it.
