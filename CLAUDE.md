@AGENTS.md

# Laica — Claude Code Project Memory

## Operating Principles

Follow [docs/workflows/operating-principles.md](docs/workflows/operating-principles.md): evidence first, no unsupported assumptions, objective detail, visible rationale and provenance, feedback from first principles, no hacks or duplicate paths, deletion of obsolete paths, explicit decisions, and blocking reports with exact missing inputs and smallest next actions.

## What is Laica?

Laica is a full-stack cooking assistant app built with React + Express + PostgreSQL, deployed on Replit. It uses Firebase for auth, OpenAI for recipe suggestions/evaluation, and ElevenLabs for text-to-speech cooking guidance.

## Architecture

- **Client:** React 18, Vite, Tailwind CSS, shadcn/ui (Radix), wouter for routing, TanStack Query
- **Server:** Express on Node 20, TypeScript, Drizzle ORM, PostgreSQL (Neon serverless driver)
- **Auth:** Firebase (Google sign-in) on client, token verification on server; legacy Replit Auth also present
- **Deploy:** Replit autoscale deployment; build = `vite build` + `esbuild` server bundle

## Workflow — READ FIRST

See [docs/adr/0001-replit-primary-local-agents.md](docs/adr/0001-replit-primary-local-agents.md) for the full workflow contract. Key rules:

1. **Replit is primary** — runtime, database, secrets, and deployment live there.
2. **GitHub is the sync layer** — `main` is the deployable branch.
3. **Feature branches only** — use `claude/<task-name>` naming.
4. **One agent per branch** — never share a branch with Codex or a human session.
5. **Local checks OK** — `npm run check`, `npm run build` work on macOS.
6. **Local dev OK** — full app runs locally via dotenvx (see Secrets below).
7. **Service validation requires Replit** — deployment-bound changes must be tested there.

## Agent merge authority

Codex may auto-merge docs-only workflow PRs only under [`docs/workflows/agent-merge-authority.md`](docs/workflows/agent-merge-authority.md): checks pass, branch is current, there are no conflicts, changed files stay in the allowed workflow/process scope, and no human/product/security/Replit decision remains. Code, repo configuration, dependency, security/privacy, schema, product, UI, or deployment-bound PRs still require the stricter validation gates and an explicit human merge instruction.

## Commands

```bash
npm ci          # install deps
npm run dev     # start dev server (Replit — secrets injected by platform)
npm run check   # TypeScript type-check (works locally)
npm run build   # production build (works locally)
npm run db:push # push Drizzle schema to database (needs DATABASE_URL)

# Local macOS (port 5000 is taken by AirPlay)
PORT=3000 npx @dotenvx/dotenvx run -- npm run dev
```

## Project structure

```
client/          # React frontend (Vite)
server/          # Express backend
  admin-routes.ts  # admin endpoints (ADMIN_SECRET protected)
  routes.ts        # main API routes
  db.ts            # Drizzle + Neon pool
  elevenlabs.ts    # TTS integration
  openai.ts        # OpenAI client
  storage.ts       # data access layer
shared/          # shared types/schemas (Drizzle + Zod)
tests/           # Playwright + Vitest tests
docs/adr/        # Architecture decision records
docs/handoffs/   # Agent coordination handoff files
product-decisions/ # Documented product and architecture decisions
efforts/         # Standalone follow-up work — agents must check active Efforts before related work
initiatives/     # Living hubs for multi-phase initiatives
```

## Active initiatives — check before resuming phased work

The `initiatives/` directory tracks living hubs for multi-phase projects. INITs connect phase docs, product decisions, Efforts, assets, PRs, handoffs, validation state, and the current resume point. Read the relevant INIT before starting or resuming work on that initiative, and update it when phase status, PR status, validation status, assets, major decisions, or resume context changes.

**INIT sequencing rule.** Do not treat INIT phase order as a hard dependency unless the INIT or phase record says so. Before recommending or starting out-of-order INIT work, classify the relationship: hard dependency, soft sequence, parallel-safe, shared-surface conflict, or product priority call. If work skips the listed resume order, state the classification, why the override is reasonable, and what debt or handoff must be recorded.

**INIT post-merge closeout.** When an INIT-bound PR merges, the agent who performed or confirmed the merge must automatically do an immediate docs closeout from fresh `origin/main` before treating the work as finished. Do not wait for Wilson to ask. Update the INIT, initiative registry, related feature phase/product-decision docs, active Effort notes/registry entries when the merge adds signal, and a merge-closeout handoff. Push the closeout to `origin` through a docs-only PR, or explicitly record why it is deferred, who owns it, and the exact branch/PR/SHA it must reference. A final response after merging INIT work should mention the closeout PR or the documented deferral.

Current active INITs:

- `initiatives/INIT-001-mobile-refresh.md` — read before Mobile Refresh Phase 0-5 work, PR reviews, Replit validation, or design/validation/process updates tied to the mobile-refresh initiative.
- `initiatives/INIT-002-ai-error-telemetry.md` — read before adding AI error logging/telemetry, creating or migrating an `ai_error_events` schema, adding admin APIs for AI error summaries/lists/details, correlating Feedback with AI failures, or extending the eval pipeline to consume operational error clusters.
- `initiatives/INIT-003-anonymous-trial-and-account-upgrade.md` — read before changing guest entry, anonymous quota, Google linking, account upgrade boundaries, guest persistence, App Check launch gates, or Phase 5 linked-only memory behavior.

## UI governance — check before any UI work

UI governance and visual standards are **not** tracked as active Efforts. Before adding new pages, tone-forward components, hex-literal styling, custom primitive overrides, font/icon changes, scoped-class reuse on a new wrapper, or visual changes tied to mobile-refresh phases, read [`product-decisions/pd-005-ui-governance.md`](product-decisions/pd-005-ui-governance.md) (operating model) and [`design_guidelines.md`](design_guidelines.md) (canonical visual standard). Resolved-state history lives in [`efforts/registry.md`](efforts/registry.md).

## Active Efforts — check before starting work in a governed domain

The `efforts/` directory tracks standalone follow-up work that does not currently belong inside an active INIT, feature phase record, PD, ADR, or workflow doc. These are **not** GitHub Issues and **not** bug reports. See `efforts/README.md` for the convention, status model, and current active read list. Use `efforts/registry.md` only when historical context is directly relevant. This workflow is durable in `product-decisions/pd-007-effort-status-and-registry-workflow.md`.

Current active Efforts:

- `efforts/effort-010-local-db-schema-strategy.md` — read before changing local DB bootstrap, schema sync, or Neon drift workflow
- `efforts/effort-022-cross-cuisine-recommendation-prompts.md` — read before changing recipe suggestion prompts, cuisine preference packaging, recipe eval criteria, cuisine picker options, or homepage/onboarding examples that name a cuisine tradition

If work belongs to an active/future INIT phase, update the INIT or feature phase record instead of creating a new Effort. If work is governance/process, update a workflow doc, ADR, or PD instead of creating a new Effort.

If your work intersects with an active Effort, cite it in your handoff and state how the change interacts with it (conforms / defers / adds new evidence).

**Effort closeout after merge.** If a merged PR satisfies an Effort's resolution criteria, do a short docs closeout pass from fresh `main` instead of assuming the merged code will implicitly close the Effort. The closeout should flip the Effort status to `Resolved`, add a final dated resolution note with merged PR / handoff references, remove the Effort from `efforts/README.md`'s active read list, update `efforts/registry.md`, and push a handoff. If real follow-up scope remains, track it as a separate active Effort only when it is standalone; otherwise document it in the relevant INIT, phase record, workflow doc, ADR, or PD.

## Secrets

Secrets are managed with **dotenvx** (AES-256-GCM encrypted `.env` committed to the repo). Decision documented in `product-decisions/pd-001-secrets-management.md`.

- `.env` — encrypted, safe in git. Decrypted at runtime.
- `.env.keys` — private decryption key, **never commit this**
- `.env.example` — lists all required vars (no values)
- To decrypt and run: `npx @dotenvx/dotenvx run -- <command>`
- To edit secrets: `npx @dotenvx/dotenvx decrypt`, edit, then `npx @dotenvx/dotenvx encrypt`
- **On Replit:** secrets are injected via the Replit Secrets tab. No dotenvx needed.

### Worktrees and `.env.keys`

`git worktree add` does not copy gitignored files. After creating a new worktree, link the key from the main repo:

```bash
ln -sf /Users/wilsonishak-macbookpro/src/laica/.env.keys .env.keys
```

The symlink stays untracked because `.env.*` is gitignored. Without this link, dotenvx cannot decrypt `.env` in the worktree and local OpenAI / ElevenLabs / database-backed validation will fail.

### Required env vars
- `DATABASE_URL` — Neon PostgreSQL connection string (crashes on startup if missing)
- `ELEVENLABS_API_KEY` — text-to-speech (crashes on startup if missing)
- `OPENAI_API_KEY` — AI features (graceful fallback if missing)
- `ADMIN_SECRET` — admin endpoint auth (only needed for eval routes)
- `SESSION_SECRET` — express session signing
- `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_APP_ID` — Firebase client config

### Security notes
- The historical `ADMIN_SECRET` exposure has been rotated in Replit. Treat old Git history as sensitive.
- Never hardcode secret values. The encrypted `.env` and Replit Secrets are the only approved stores.

## When blocked — human handoff protocol

If you hit a blocker you truly cannot resolve (permissions, secrets rotation, Replit-side action, etc.):

1. **Stop working** — do not retry or work around blindly.
2. **Write a blocking report** in the current response and, when branch state or another handoff is needed, in `docs/handoffs/YYYY-MM-DD-claude-<short-name>-blocked.md`.
3. **Include a context checkpoint** so work can resume seamlessly:
   - Current branch and last commit
   - What was completed so far
   - What remains on the plan
   - Any decisions made or assumptions in flight
   - Exact next step to pick up after unblock
4. **Update the owning source doc only when the blocker changes durable state** — for example INIT validation status, Effort status, phase acceptance, or workflow policy.

The goal is zero lost context — the human (or a fresh agent session) should be able to read the checkpoint and continue without re-deriving anything.

## Agent coordination — handoffs

When completing a task, write a handoff file in `docs/handoffs/` so the other agent (Codex) can pick up context. When starting new work, read recent handoffs to understand what's changed and check for related `docs/handoffs/*-blocked.md` reports before assuming the path is clear. See [docs/handoffs/README.md](docs/handoffs/README.md) for the naming convention, blocked-handoff discovery, and required sections. PR descriptions should include the same structured summary.

**Documentation foundation rule.** Do not leave product rationale, UX direction, validation scope, or operational lessons trapped in chat. When work changes behavior, IA, visual direction, acceptance criteria, validation status, or agent workflow, update the durable source of truth in the same branch: the relevant INIT, feature phase/product-decision note, active Effort(s), workflow doc, handoff, and PR description as applicable. Use [`docs/workflows/documentation-routing.md`](docs/workflows/documentation-routing.md) before closeout to choose the smallest durable home and update only the indexes/read lists whose source-of-truth status changed. Capture what changed, why it changed, what was validated, what remains unvalidated, and any explicit deferrals. No shortcut docs: future agents should be able to resume from the repository without re-deriving the thread. When documenting design consistency, include implementation guardrails too: shared component/root wrappers, CSS specificity or token requirements, and the exact visual comparison needed so matching class names do not hide computed-style drift.

**Summary opening rule.** Final task summaries, handoffs, and PR descriptions should open with a concise overall view when the task changes the product/workflow/docs system, then still include the concrete implementation changelog, files changed, validation, and deferrals as before. State why the change matters for future coordination or merge readiness, what learning or discipline was added to future work, what was validated, and what remains deferred or unvalidated. If there is no broader system learning, keep the summary simple instead of forcing a special heading or inventing one.

## Auto-push permissions for planning documents

Claude may **commit and push without asking** when the changes are limited to planning and coordination documents:
- `docs/handoffs/*.md` — agent handoff files
- `product-decisions/*.md` and `product-decisions/README.md` — product decision records
- `efforts/effort-*.md` and `efforts/README.md` — standalone follow-up work
- `initiatives/*.md` and `initiatives/README.md` — living multi-phase initiative hubs
- `AGENTS.md` and `CLAUDE.md` — workflow/process updates

This keeps a continuous conversation flow between Claude and Codex. The other agent can't see anything until it's on `origin`.

**Stop and ask the human when:**
- The change touches source code (`client/`, `server/`, `shared/`, `tests/`)
- There is a question, ambiguity, or decision that needs human input
- The handoff proposes something that hasn't been discussed/approved yet
- Any destructive git operation (force push, branch delete, rebase)

## Branch transitions — carrying WIP

When a planning branch (like `claude/funny-boyd`) transitions to an implementation branch (like `claude/slop-bowl-ui`):

1. Wait for the docs PR to merge to `main`.
2. Create the new implementation branch from `main`.
3. Re-apply any uncommitted WIP (e.g., prototype `slop-bowl.tsx`, modified `app.tsx`, `openai.ts`) onto the new branch. Use `git stash` or manual copy — do not assume the old worktree will persist.
4. The new branch should contain only implementation changes. All planning docs are already on `main`.

This prevents orphaned work and ensures clean git history.

## Claude-specific notes

- Auth is Firebase (Google sign-in only), not Replit Auth. `server/replitAuth.ts` is legacy and unused.
- `reusePort` in server listen is Replit-only (guarded by `REPL_ID` env var).
- The server port is configurable via `PORT` env var (defaults to 5000).
- Vite runs as Express middleware in dev mode (single port serves API + client).
- AI prompts are versioned in the database via `prompt_versions` table.
- Run Claude from the repo root or from a dedicated feature checkout for the task you are handling.
- Keep personal overrides in `.claude/settings.local.json` and any user-only memory outside tracked project files.
- Treat Replit as the final verification environment for database-backed, auth-backed, and deployment-bound changes.
