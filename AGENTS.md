# LAICA Agent Workflow

Replit is the primary environment for runtime behavior, secrets, database access, and deployment. GitHub is the shared source of truth between Replit and local agent tooling on macOS.

See the full shared workflow in [docs/adr/0001-replit-primary-local-agents.md](docs/adr/0001-replit-primary-local-agents.md).

## Core rules

- Keep `main` deployable. Codex and Claude should work from feature branches, not directly on `main`.
- Use branch names with clear ownership: `codex/<task-name>` for Codex work and `claude/<task-name>` for Claude work.
- Only one agent/session should actively own a branch or checked-out worktree at a time.
- Prefer Codex app worktrees for parallel Codex tasks. Codex-managed worktrees live under `$CODEX_HOME/worktrees`; manually managed worktrees for this repo live under `/Users/wilsonishak-macbookpro/src/laica-worktrees`.
- Shared Codex local-environment files belong in the repo-root `.codex` folder.
- Local macOS work is for editing, reviews, refactors, and compile-time checks. Full local dev is now possible via dotenvx (see Secrets below). Service-backed validation still happens in Replit before deployment.

## Local checks

Run these locally when the task does not depend on Replit-only services:

- `npm ci`
- `npm run check`
- `npm run build`
- `PORT=3000 npx @dotenvx/dotenvx run -- npm run dev` (full local dev with secrets)

## Replit validation gate

Before merging deployment-bound changes, sync the branch into Replit and verify:

- Firebase sign-in
- recipe suggestion flows
- cooking-session persistence
- feedback writes
- ElevenLabs-backed speech routes

## Stacked PRs and Replit validation

When work spans phased or dependent PRs, two rules backstop stale Replit validation.

**1. Rebase the upper-stack branch after lower-stack merges.** A branch is "stacked" when it logically depends on a lower PR: shared files, builds on the feature, or needs the lower PR's polish/docs to represent the real post-merge product. This rule does not apply to parallel independent PRs. Once a lower-stack PR merges to `main`, the agent owning the next stacked branch must:

- `git fetch origin`
- Rebase the branch onto fresh `origin/main`
- `git push --force-with-lease`
- Have Replit fetch the rebased branch before any preview or smoke test

The branch owner performs this rebase, triggered by the lower-stack merge handoff. Pair `--force-with-lease` with the one-agent-per-branch rule so rewritten branch history stays safe.

**2. Re-validate if new commits land after validation.** PR descriptions and handoffs for deployment-bound work must include `Last Replit-validated at: <commit-sha>` or clearly say `not yet validated`. If new commits arrive on the branch after that SHA, the validation is stale by definition. The PR cannot merge until Replit validation is re-run and the SHA is refreshed. There are no exceptions for "small" cosmetic commits because that judgment call is where regressions slip in.

**Audit hygiene.** When auditing PR scope, compare against `origin/main...HEAD`, never a stale local `main` or old merge base.

**Handoff disclosure.** Handoffs and PR descriptions for stacked branches must explicitly state whether the branch has been rebased onto current `origin/main` after lower-stack merges, include the base SHA, and include the last Replit-validated commit SHA.

## Project structure

```
client/          # React frontend (Vite, React 18, Tailwind, shadcn/ui)
server/          # Express backend (Node 20.19+, Drizzle ORM, PostgreSQL)
shared/          # Shared types and schemas (Drizzle + Zod)
tests/           # Playwright + Vitest tests
docs/adr/        # Architecture decision records
docs/handoffs/   # Agent coordination handoff files
product-decisions/ # Documented product and architecture decisions
epics/           # Open stories / backlog / governance — agents must check before related work
initiatives/     # Living hubs for multi-phase initiatives
```

## Secrets

Secrets are managed with **dotenvx** (AES-256-GCM encrypted `.env` committed to the repo). Decision documented in `product-decisions/001-secrets-management.md`.

- `.env` — encrypted, safe in git. Decrypted at runtime via `npx @dotenvx/dotenvx run`.
- `.env.keys` — private decryption key, **never commit this**.
- `.env.example` — lists all required vars (no values).
- **On Replit:** secrets are injected via the Replit Secrets tab. No dotenvx needed.

### Worktrees and `.env.keys`

`git worktree add` does not copy gitignored files. After creating a new worktree, link the key from the main repo:

```bash
ln -sf /Users/wilsonishak-macbookpro/src/laica/.env.keys .env.keys
```

The symlink stays untracked because `.env.*` is gitignored. Without this link, dotenvx cannot decrypt `.env` in the worktree and local OpenAI / ElevenLabs / database-backed validation will fail.

### Required env vars
| Variable | Purpose | Required at startup? |
|----------|---------|---------------------|
| `DATABASE_URL` | Neon PostgreSQL | Yes (crashes) |
| `ELEVENLABS_API_KEY` | Text-to-speech | Yes (crashes) |
| `OPENAI_API_KEY` | AI features | No (graceful fallback) |
| `ADMIN_SECRET` | Admin route auth | No (on demand) |
| `SESSION_SECRET` | Express sessions | No |
| `VITE_FIREBASE_*` | Firebase client config | Yes (auth won't work) |

### Security notes
- The historical `ADMIN_SECRET` exposure has been rotated in Replit. Keep the new value in Replit Secrets only and continue treating the old Git history as sensitive.
- Never hardcode secret values. The encrypted `.env` and Replit Secrets are the only approved stores.

## Agent coordination — handoffs

When completing a task, write a handoff file in `docs/handoffs/` so the other agent can pick up context. When starting new work, read recent handoffs to understand what's changed. See [docs/handoffs/README.md](docs/handoffs/README.md) for the naming convention and required sections. PR descriptions should include the same structured summary.

**Documentation foundation rule.** Do not leave product rationale, UX direction, validation scope, or operational lessons trapped in chat. When work changes behavior, IA, visual direction, acceptance criteria, validation status, or agent workflow, update the durable source of truth in the same branch: the relevant INIT, feature phase/product-decision note, active epic(s), handoff, and PR description as applicable. Capture what changed, why it changed, what was validated, what remains unvalidated, and any explicit deferrals. No shortcut docs: future agents should be able to resume from the repository without re-deriving the thread. When documenting design consistency, include implementation guardrails too: shared component/root wrappers, CSS specificity or token requirements, and the exact visual comparison needed so matching class names do not hide computed-style drift.

**Handoffs must be pushed, not just written.** A handoff file that only exists in a local worktree is invisible to other agents. After writing a handoff:
1. Commit and push to a branch on `origin` (your feature branch or `main` via PR).
2. Only then signal the other agent to start work — reference the branch name so they know where to find it.
3. The handoff is not "done" until it's on `origin`. An unpushed handoff is the same as no handoff.

**Planning-doc collaboration rule.** For planning artifacts such as `docs/handoffs/`, `product-decisions/`, `epics/`, ADRs, spec/intent docs, and workflow docs like `AGENTS.md` / `CLAUDE.md`:
1. Codex and Claude may commit and push follow-up clarifications, reviews, and implementation-risk notes without waiting for human approval, so the git history can carry an ongoing agent-to-agent discussion.
2. Keep discussion attributable and easy to follow: prefer a new handoff/reply document or a clearly labeled follow-up commit over silently rewriting the other agent's intent.
3. Stop the automatic update process and ask Wilson to review when the next step needs human judgment, changes product direction, affects secrets/security, requires Replit-side intervention, or remains ambiguous after the agents have documented the tradeoff.
4. For active features, record phase-by-phase decisions in `product-decisions/features/<feature>/` and promote only the durable accepted outcomes to top-level `PD-xxx` files.

**INIT rule.** The `initiatives/` directory tracks living hubs for multi-phase work. Read the relevant INIT before starting or resuming initiative work, and update it when phase status, PR status, validation status, assets, major decisions, or the current resume point changes. Handoffs and PR descriptions for initiative work must cite the INIT and state whether it was updated.

Current active INITs:

- `initiatives/INIT-001-mobile-refresh.md` — read before Mobile Refresh Phase 0-5 work, PR reviews, Replit validation, or design/validation/process updates tied to the mobile-refresh initiative.

**Epics rule.** The `epics/` directory tracks long-lived stories (Kanban-style) — cross-cutting concerns, governance systems, and backlog items that span features (see `epics/README.md`). These are **not** GitHub Issues and **not** bug reports. Start with `epics/README.md` for the status model and active read list; use `epics/registry.md` only when historical context is directly relevant. `Resolved` means closed/completed, while `Open`, `In Progress`, and `Blocked` are active. This workflow is durable in `product-decisions/007-epic-status-and-registry-workflow.md`. Before starting any feature work that touches a governed domain, read the relevant active epic. Each epic's *Agent checklist* section lists the exact triggers. Current active epics:

- `epics/001-ui-governance.md` — read before adding new pages, tone-forward components, hex-literal styling, custom primitive overrides, or font/icon changes
- `epics/004-selection-controls-tap-targets.md` — read before changing onboarding/settings radio-style menus, selection-row hit areas, or the shared radio-group composition
- `epics/005-testing-strategy-and-acceptance-criteria.md` — read before deciding merge readiness, defining feature acceptance criteria, or changing the app-wide verification workflow
- `epics/007-vision-scan-no-detection-feedback.md` — read before changing image-scan result messaging or zero-result scan behavior
- `epics/009-consistent-comma-separated-ingredient-entry.md` — read before changing multi-ingredient manual entry or delimiter behavior
- `epics/010-local-db-schema-strategy.md` — read before changing local DB bootstrap, schema sync, or Neon drift workflow
- `epics/012-laica-design-language.md` — read before implementing/polishing mobile-refresh screens, translating mockups, or changing visual identity/look-and-feel
- `epics/013-pantry-manual-entry-spell-correction.md` — read before adding pantry ingredient spellcheck/autocorrect, ingredient dictionaries, or pantry label canonicalization
- `epics/014-scan-session-diff-and-duplicate-refinement.md` — read before changing Pantry/Kitchen scan chip states, latest-scan indicators, duplicate cleanup, or found-again/overlap messaging

If your work intersects with an active epic, cite it in your handoff and note how the change interacts (conforms / defers / adds new evidence). When the epic gains new signal from your work (new drift found, new surface added to a taxonomy), append a `## YYYY-MM-DD — <summary>` section to the epic file itself.

**Epic closeout after merge.** If a merged PR satisfies an epic's resolution criteria, do a short follow-up docs pass from fresh `main` rather than leaving the epic half-open on a stale feature branch. That closeout pass should:
1. Flip the epic file's `Status` to `Resolved`
2. Append a final dated resolution section with the merged PR / handoff references
3. Remove the epic from `epics/README.md`'s active read list
4. Update `epics/registry.md` with the resolved date and final signal
5. Push a handoff so the closeout is visible on `origin`

If meaningful follow-up scope remains, split it into a separate active epic or explicitly record why the original epic stays open.

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
