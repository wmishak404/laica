# LAICA Agent Workflow

## Operating Principles

Follow [docs/workflows/operating-principles.md](docs/workflows/operating-principles.md): evidence first, no unsupported assumptions, objective detail, visible rationale and provenance, feedback from first principles, no hacks or duplicate paths, deletion of obsolete paths, explicit decisions, and blocking reports with exact missing inputs and smallest next actions.

Replit is the primary environment for runtime behavior, secrets, database access, and deployment. GitHub is the shared source of truth between Replit and local agent tooling on macOS.

See the full shared workflow in [docs/adr/0001-replit-primary-local-agents.md](docs/adr/0001-replit-primary-local-agents.md).

## Core rules

- Keep `main` deployable. Codex and Claude should work from feature branches, not directly on `main`.
- Use branch names with clear ownership: `codex/<task-name>` for Codex work and `claude/<task-name>` for Claude work.
- Only one agent/session should actively own a branch or checked-out worktree at a time.
- Prefer Codex app worktrees for parallel Codex tasks. Codex-managed worktrees live under `$CODEX_HOME/worktrees`; manually managed worktrees for this repo live under `/Users/wilsonishak-macbookpro/src/laica-worktrees`.
- Shared Codex local-environment files belong in the repo-root `.codex` folder.
- Local macOS work is for editing, reviews, refactors, and compile-time checks. Full local dev is now possible via dotenvx (see Secrets below). Human manual Replit validation is reserved for production deployment readiness and PRs whose risk lane requires it.

## Local checks

Run these locally when the task does not depend on Replit-only services:

- `npm ci`
- `npm run check`
- `npm run build`
- `PORT=3000 npm run env:run -- npm run dev` (full local dev with secrets)

## Automated test evidence gate

When automated tests, CI, Playwright, `db:health`, or future eval runs are used as merge-readiness evidence, the PR or handoff must include the evidence report required by [`docs/workflows/testing-and-acceptance.md`](docs/workflows/testing-and-acceptance.md): claimed behavior, command/check provenance, source provenance, observed result, reasoning, and negative scope. Do not conclude a code PR is correct from "tests passed" or "CI green" alone.

Every pushed implementation build/head intended for review or merge must run or trigger the full automated E2E gate for that exact head. Human manual Replit smoke is complementary deployment/release validation, not a substitute for a missing, skipped, or failed automated E2E gate. Future automated Replit-environment checks may become PR gates when their evidence lane is documented and accepted.

## Bug investigation evidence

Before fixing a reported bug, follow the bug investigation evidence protocol in [`docs/workflows/testing-and-acceptance.md`](docs/workflows/testing-and-acceptance.md). Collect the relevant browser, Replit, server, DB/cache, and env-presence evidence; separate observed facts from inference; and ask Wilson for the exact missing logs, screenshots, or Network Response bodies when the initial report is incomplete. Do not prescribe a fix from screenshots alone when route responses, server logs, environment presence, cache rows, or current branch/SHA are needed.

## Human Replit validation policy

Human manual Replit validation is no longer the default PR merge gate for every deployment-bound change. Use [`docs/workflows/testing-and-acceptance.md`](docs/workflows/testing-and-acceptance.md) to classify the validation lane.

When Replit validation uses Chrome for app UI, default to Chrome's mobile viewport / device toolbar because LAICA's primary users are mobile. Record the viewport or device preset in the PR/handoff evidence, and explicitly check pinned navigation bars, back buttons, sticky CTAs, scroll fit, and visual element layout in mobile view. Add desktop viewport checks only when the changed surface is desktop-specific or responsive risk calls for both.

### Replit Agent credit guard

When accessing Replit through Chrome, do not use Replit Agent by default because it spends Replit credits. Prefer direct Replit shell commands, the workspace UI, local tooling, and GitHub automation first. If Replit Agent looks necessary because direct shell/UI paths are blocked or substantially unsafe, stop and ask Wilson for explicit approval before starting or continuing a Replit Agent task. Document any approved Replit Agent use in the PR or handoff evidence, including why direct validation was insufficient.

For low-risk, narrowly scoped changes with strong automated evidence, PRs may defer human Replit validation to a batched pre-production/release pass. The PR or handoff must annotate the risk, automated evidence, negative scope, and the exact deferred manual checks so future debugging can trace a regression back to the enhancement without bloating durable docs.

Require human Replit validation before PR merge only when the change is higher risk or cross-functional, changes schema/secrets/deployment/runtime startup, changes auth/session/provider behavior in a way CI or automated Replit-environment checks do not exercise, has weak or skipped automated evidence, or Wilson explicitly asks for PR-level manual validation.

**Production regression registration rule.** Any PR or post-merge closeout that changes runtime behavior after the last production-smoked build must leave a changed-since-last-production breadcrumb before the work is treated as done. Runtime behavior includes user-visible UI/layout/copy, shared UI primitives, client workflow state, server routes, auth/session, provider calls, DB/persistence, deployment/startup, schema, rate limits, and validation lane changes. Add or update the smallest relevant entry in [`docs/production-validation-registry.md`](docs/production-validation-registry.md) with the focused production-push check, exact PR/merge/head evidence, negative scope, and future-bug breadcrumb, or explicitly state in the PR/handoff why no registry entry is needed because the change is docs-only/non-runtime or already covered by an existing active registry item. Do not expand this into a full regression by default; production push validation runs baseline core smoke plus only the surfaces changed since the last production push, risk-triggered canaries, and Wilson-requested full-regression scope.

Before production publish, sync the merged validation batch into Replit and verify the selected focus areas manually or through an accepted automated Replit-environment lane:

- Use `docs/workflows/replit-validation-focus.md` to choose *targeted* Replit validation steps based on what changed locally.
- Firebase sign-in
- recipe suggestion flows
- cooking-session persistence
- feedback writes
- ElevenLabs-backed speech routes

## Stacked PRs and Replit validation

When work spans phased or dependent PRs, two rules backstop stale Replit validation when a branch claims human/manual or automated Replit-environment evidence, or is part of a batched pre-production validation pass.

**1. Rebase the upper-stack branch after lower-stack merges.** A branch is "stacked" when it logically depends on a lower PR: shared files, builds on the feature, or needs the lower PR's polish/docs to represent the real post-merge product. This rule does not apply to parallel independent PRs. Once a lower-stack PR merges to `main`, the agent owning the next stacked branch must:

- `git fetch origin`
- Rebase the branch onto fresh `origin/main`
- `git push --force-with-lease`
- Have Replit fetch the rebased branch before any preview or smoke test

The branch owner performs this rebase, triggered by the lower-stack merge handoff. Pair `--force-with-lease` with the one-agent-per-branch rule so rewritten branch history stays safe.

**2. Re-validate if new commits land after validation.** PR descriptions and handoffs for work that claims Replit validation must include `Last Replit-validated at: <commit-sha>` or clearly say `Human Replit validation: deferred to release/batch validation`. If new commits arrive after a claimed Replit-validated SHA, that validation is stale by definition for the affected batch. There are no exceptions for "small" cosmetic commits because that judgment call is where regressions slip in.

**Audit hygiene.** When auditing PR scope, compare against `origin/main...HEAD`, never a stale local `main` or old merge base.

**Handoff disclosure.** Handoffs and PR descriptions for stacked branches must explicitly state whether the branch has been rebased onto current `origin/main` after lower-stack merges, include the base SHA, and include either the last Replit-validated commit SHA or the deferred release/batch validation status.

## Agent merge authority

Codex may auto-merge docs-only workflow PRs and fact-only post-merge closeout PRs only under [`docs/workflows/agent-merge-authority.md`](docs/workflows/agent-merge-authority.md): checks pass, branch is current, there are no conflicts, changed files stay inside the allowed workflow/process or evidence-closeout scope, and no human/product/security/Replit decision remains. When Wilson explicitly approves merging an INIT/Effort/code/product PR, that merge instruction also authorizes the mechanical closeout PR if it only records already-merged facts, validation, deferrals, and the next resume point without adding scope or changing decisions. Code, repo configuration, dependency, security/privacy, schema, product, UI, or deployment-bound PRs still require the stricter validation gates and an explicit human merge instruction.

Codex may mark its own complete draft PRs ready for review and monitor CI without waiting for Wilson only under the ready-for-review rule in [`docs/workflows/agent-merge-authority.md`](docs/workflows/agent-merge-authority.md). This starts automation/review; it does not grant merge authority.

## Project structure

```
client/          # React frontend (Vite, React 18, Tailwind, shadcn/ui)
server/          # Express backend (Node 20.19+, Drizzle ORM, PostgreSQL)
shared/          # Shared types and schemas (Drizzle + Zod)
tests/           # Playwright + Vitest tests
docs/adr/        # Architecture decision records
docs/handoffs/   # Agent coordination handoff files
product-decisions/ # Documented product and architecture decisions
efforts/         # Standalone follow-up work — agents must check active Efforts before related work
initiatives/     # Living hubs for multi-phase initiatives
```

## Secrets

Secrets are managed with **dotenvx** (AES-256-GCM encrypted `.env` committed to the repo). Decision documented in `product-decisions/pd-001-secrets-management.md`.

- `.env` — encrypted, safe in git. Decrypted at runtime via `npm run env:run -- <command>`.
- `.env.keys` — private decryption key, **never commit this**.
- `.env.example` — lists all required vars (no values).
- **On Replit:** secrets are injected via the Replit Secrets tab. No dotenvx needed.

### Worktrees and `.env.keys`

`git worktree add` does not copy gitignored files. After creating a new worktree, link the key from the main repo:

```bash
npm run setup:worktree
```

The helper creates or verifies the untracked `.env.keys` symlink without printing secret values. The symlink stays untracked because `.env.*` is gitignored. Without this link, dotenvx cannot decrypt `.env` in the worktree and local OpenAI / ElevenLabs / database-backed validation will fail.

Run dotenvx through the repo scripts after `npm ci`; avoid ad hoc `npx @dotenvx/dotenvx` fetches while decrypted secrets are in scope.

### Required env vars
| Variable | Purpose | Required at startup? |
|----------|---------|---------------------|
| `DATABASE_URL` | Neon PostgreSQL | Yes (crashes) |
| `ELEVENLABS_API_KEY` | Text-to-speech | Yes (crashes) |
| `OPENAI_API_KEY` | AI features | No (graceful fallback) |
| `ADMIN_SECRET` | Admin route auth | No (on demand) |
| `VITE_FIREBASE_*` | Firebase client config | Yes (auth won't work) |

### Security notes
- `ADMIN_SECRET` has been rotated. Keep the current value in Replit Secrets only.
- Never hardcode secret values. The encrypted `.env` and Replit Secrets are the only approved stores.
- Never run or recommend commands that dump full process environments in secret-bearing contexts, such as `ps eww`, `env`, `printenv`, `set`, or `/proc/*/environ`. Replit and dotenvx inject secrets as environment variables, so use masked presence checks that print only `set` / `MISSING` and never secret values.

## Agent coordination — handoffs

When completing a task, write a handoff file in `docs/handoffs/` so the other agent can pick up context. When starting new work, read recent handoffs to understand what's changed and check for related `docs/handoffs/*-blocked.md` reports before assuming the path is clear. See [docs/handoffs/README.md](docs/handoffs/README.md) for the naming convention, blocked-handoff discovery, and required sections. PR descriptions should include the same structured summary.

**Documentation foundation rule.** Do not leave product rationale, UX direction, validation scope, bug learnings, or operational lessons trapped in chat. When work changes behavior, IA, visual direction, acceptance criteria, validation status, or agent workflow, update the durable source of truth in the same branch: the relevant INIT, feature phase/product-decision note, active Effort(s), workflow doc, handoff, and PR description as applicable. When validation or user testing finds a bug, record the observed behavior, root cause or current inference, regression coverage or validation gap, stale-validation impact, and the durable rule/spec update if future agents need it. Use [`docs/workflows/documentation-routing.md`](docs/workflows/documentation-routing.md) before closeout to choose the smallest durable home and update only the indexes/read lists whose source-of-truth status changed. Capture what changed, why it changed, what was validated, what remains unvalidated, and any explicit deferrals. No shortcut docs: future agents should be able to resume from the repository without re-deriving the thread. When documenting design consistency, include implementation guardrails too: shared component/root wrappers, CSS specificity or token requirements, and the exact visual comparison needed so matching class names do not hide computed-style drift.

**Summary opening rule.** Final task summaries, handoffs, and PR descriptions should open with a concise overall view when the task changes the product/workflow/docs system, then still include the concrete implementation changelog, files changed, validation, and deferrals as before. State why the change matters for future coordination or merge readiness, what learning or discipline was added to future work, what was validated, and what remains deferred or unvalidated. Keep user-value or "why it matters" language tightly bound to accepted product direction and observed behavior; do not turn implementation details, rejected options, broad phrases like "safer", or invented claims such as "the user no longer has to..." into durable product intent. If there is no broader system learning, keep the summary simple instead of forcing a special heading or inventing one.

**Handoffs must be pushed, not just written.** A handoff file that only exists in a local worktree is invisible to other agents. After writing a handoff:
1. Commit and push to a branch on `origin` (your feature branch or `main` via PR).
2. Only then signal the other agent to start work — reference the branch name so they know where to find it.
3. The handoff is not "done" until it's on `origin`. An unpushed handoff is the same as no handoff.

**Planning-doc collaboration rule.** For planning artifacts such as `docs/handoffs/`, `product-decisions/`, `efforts/`, ADRs, spec/intent docs, and workflow docs like `AGENTS.md` / `CLAUDE.md`:
1. Codex and Claude may commit and push follow-up clarifications, reviews, and implementation-risk notes without waiting for human approval, so the git history can carry an ongoing agent-to-agent discussion.
2. Keep discussion attributable and easy to follow: prefer a new handoff/reply document or a clearly labeled follow-up commit over silently rewriting the other agent's intent.
3. Stop the automatic update process and ask Wilson to review when the next step needs human judgment, changes product direction, affects secrets/security, requires Replit-side intervention, or remains ambiguous after the agents have documented the tradeoff.
4. For active features, record phase-by-phase decisions in `product-decisions/features/<feature>/` and promote only the durable accepted outcomes to top-level `PD-NNN` files.

**Promotion-path rule.** Use [`docs/workflows/documentation-routing.md`](docs/workflows/documentation-routing.md) for the promotion ladder from current thread -> open PR -> handoff -> Effort -> INIT. Do not create an Effort or INIT for a one-off task unless unresolved follow-up must survive beyond the current branch/PR/thread.

**INIT rule.** The `initiatives/` directory tracks living hubs for multi-phase work. Read the relevant INIT before starting or resuming initiative work, and update it when phase status, PR status, validation status, assets, major decisions, or the current resume point changes. Handoffs and PR descriptions for initiative work must cite the INIT and state whether it was updated.

**INIT sequencing rule.** Do not treat INIT phase order as a hard dependency unless the INIT or phase record says so. Before recommending or starting out-of-order INIT work, classify the relationship: hard dependency, soft sequence, parallel-safe, shared-surface conflict, or product priority call. If work skips the listed resume order, state the classification, why the override is reasonable, and what debt or handoff must be recorded.

**INIT post-merge closeout.** When an INIT-bound PR merges, the agent who performed or confirmed the merge must automatically do an immediate docs closeout from fresh `origin/main` before treating the work as finished. Do not wait for Wilson to ask. Update the INIT, initiative registry, related feature phase/product-decision docs, active Effort notes/registry entries when the merge adds signal, and a merge-closeout handoff. Push the closeout to `origin` through a docs-only PR, or explicitly record why it is deferred, who owns it, and the exact branch/PR/SHA it must reference. A final response after merging INIT work should mention the closeout PR or the documented deferral.

For the current active INIT read list and read-before-work triggers, use [`initiatives/README.md`](initiatives/README.md). Do not mirror active INIT IDs in this file.

**UI governance rule.** UI governance and visual standards are **not** tracked as active Efforts. Before adding new pages, tone-forward components, hex-literal styling, custom primitive overrides, font/icon changes, scoped-class reuse on a new wrapper, durable cross-functional navigation changes, or visual changes tied to mobile-refresh phases, read [`product-decisions/pd-005-ui-governance.md`](product-decisions/pd-005-ui-governance.md) (operating model) and [`design_guidelines.md`](design_guidelines.md) (canonical visual standard). Resolved-state history lives in [`efforts/registry.md`](efforts/registry.md).

**Navigation approval rule.** Ask Wilson before adding, removing, reordering, renaming, or changing auth-mode visibility for durable cross-functional navigation surfaces such as the bottom nav, top nav/header, app menu/account drawer, global menu, tabs, or persistent app-shell actions. Treat these as product/IA decisions, not incidental UI polish or copy work. If approved, record the explicit approval, affected surfaces, and affected user modes in the PR description, handoff, and relevant INIT/PD.

**Efforts rule.** The `efforts/` directory tracks standalone follow-up work that does not currently belong inside an active INIT, feature phase record, PD, ADR, or workflow doc. These are **not** GitHub Issues and **not** bug reports. Start with [`efforts/README.md`](efforts/README.md) for the status model, active read list, and read-before-work triggers; use [`efforts/registry.md`](efforts/registry.md) only when historical context is directly relevant. This workflow is durable in [`product-decisions/pd-007-effort-status-and-registry-workflow.md`](product-decisions/pd-007-effort-status-and-registry-workflow.md). Do not mirror active Effort IDs in this file.

If work belongs to an active/future INIT phase, update the INIT or feature phase record instead of creating a new Effort. If work is governance/process, update a workflow doc, ADR, or PD instead of creating a new Effort.

If your work intersects with an active Effort, cite it in your handoff and note how the change interacts (conforms / defers / adds new evidence). When the Effort gains new signal from your work, append a `## YYYY-MM-DD — <summary>` section to the Effort file itself.

**Efforts hygiene and implementation loop.** Recurring Efforts runs must follow [`docs/workflows/effort-system-audit.md`](docs/workflows/effort-system-audit.md): start from fresh `origin/main`, check open Effort/hygiene PRs, recent handoffs, blocked handoffs, active INIT ownership, and agent entrypoint links before choosing work. After hygiene is clean, an agent may choose one unblocked `Open` or `In Progress` Effort for a PR-sized implementation slice; do not implement `Blocked`, `Deferred`, or `Resolved` Efforts unless the task is explicitly to unblock, close out, or reclassify them. Stop and ask Wilson when priority, product direction, architecture, secrets/security, Replit-side action, or merge authority is the real missing input.

**Effort closeout after merge.** If a merged PR satisfies an Effort's resolution criteria, do a short follow-up docs pass from fresh `main` rather than leaving the Effort half-open on a stale feature branch. That closeout pass should:
1. Flip the Effort file's `Status` to `Resolved`
2. Append a final dated resolution section with the merged PR / handoff references
3. Remove the Effort from `efforts/README.md`'s active read list
4. Update `efforts/registry.md` with the resolved date and final signal
5. Push a handoff so the closeout is visible on `origin`

If meaningful follow-up scope remains, split it into a separate active Effort only when it is standalone; otherwise document it in the relevant INIT, phase record, workflow doc, ADR, or PD.

## Branch transitions — planning to implementation

When a planning/docs branch wraps up (PR merged) and implementation begins, follow this process to avoid lost context and duplicated work:

1. **Merge the docs PR to `main` first.** Both agents start implementation branches from the updated `main` so all specs, handoffs, and decisions are visible.
2. **Each agent opens a fresh feature branch** from `main` with clear ownership:
   - Claude: `claude/slop-bowl-ui` (or similar)
   - Codex: `codex/slop-bowl-api` (or similar)
3. **Carry forward uncommitted WIP.** If an agent has local work-in-progress from the planning branch (e.g., prototype UI code), it cherry-picks or re-applies that work onto the new implementation branch. The owning agent is responsible for this — the other agent should not expect to see it until it's committed.
4. **Read merged docs for shared context.** Both agents read `product-decisions/`, `docs/handoffs/`, and feature phase records on `main` before starting implementation. These are the source of truth — not the old planning branch.
5. **No two agents on the same file.** File ownership from the plan (e.g., Claude owns `client/`, Codex owns `server/`) must be respected to avoid merge conflicts. If a boundary case arises, write a handoff asking the other agent to make the change in their domain.
6. **Signal readiness via handoff.** When one agent's work is ready for integration testing, push a handoff to `origin` so the other agent (or the human) knows.

## Code conventions

- TypeScript throughout (client and server)
- Drizzle ORM for database access; Zod for validation
- shadcn/ui component library (Radix primitives + Tailwind)
- wouter for client-side routing
- TanStack Query for server state
