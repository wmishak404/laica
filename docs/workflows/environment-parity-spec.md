# Environment Parity Spec (Replit <-> Local macOS)

## Operating Principles

Follow [operating-principles.md](operating-principles.md): evidence first, no unsupported assumptions, objective detail, visible rationale and provenance, feedback from first principles, no hacks or duplicate paths, deletion of obsolete paths, explicit decisions, and blocking reports with exact missing inputs and smallest next actions.

**Status:** Draft (proposed)  
**Last updated:** 2026-05-04  
**Scope:** LAICA repo runtime + developer environments  
**Primary goal:** Same behavior whether developing on Replit or locally (Codex/Claude on macOS), with drift actively prevented and detected.

This spec is intentionally exhaustive. It defines what “parity” means for LAICA, enumerates every known drift vector, and proposes explicit decisions, options, checks, and revisit criteria so the project can converge on a single reproducible setup.

---

## 0) Why This Spec Exists

LAICA currently relies on:

- Replit as the authoritative runtime, secrets store, database, and deployment environment (`AGENTS.md`, `docs/adr/0001-replit-primary-local-agents.md`).
- Local macOS worktrees for faster editing and compile/build checks, with optional full local runtime via dotenvx (`product-decisions/pd-001-secrets-management.md`).

This is a workable workflow, but “workable” is not “parity”. Drift has already shown up in practice:

- Local database schema drift created false negatives/positives during feature validation (`product-decisions/pd-008-optional-context-and-local-validation-boundaries.md`, `efforts/effort-010-local-db-schema-strategy.md`).
- Local agent browser environments struggle with Firebase popup auth automation, creating a validation gap (`product-decisions/features/mobile-refresh/pd-dev-test-harness.md`).
- Local runtime version drift is possible even when the repo contains a pin (Replit pins Node via `.replit`; local pin via `.nvmrc` is advisory unless enforced).
- `.replit` currently runs dotenvx even though several workflow docs say Replit doesn’t need dotenvx, creating a “two sources of secrets truth” ambiguity.

This spec answers: “What does it take to make running on Replit vs running locally behave the same, by construction?”

---

## 1) Definitions: What “Parity” Means (Decision Required)

There are two competing definitions of “parity”:

### Option A — “Bitwise parity”

Definition: local and Replit environments are identical across OS, CPU architecture, system packages, Node patch, npm patch, and service dependencies.

Pros:
- Maximum reproducibility.
- Best chance of “no surprises” between environments.

Cons:
- Practically impossible without running local development *inside the same base image* as Replit (Linux + Nix), and/or changing Replit to use the same container as local.
- macOS-only tooling (native camera devices, Safari quirks) cannot be bitwise-identical to Replit.
- The project’s real-world surfaces (Firebase authorized domains, external callback URLs, TLS termination) differ by nature between localhost and Replit domains.

### Option B — “Behavioral parity” (recommended)

Definition: given environment-specific config values (domain, port mapping, secrets, database URL), the *application’s semantics* are identical:

- same code paths exercised for the same user action
- same validation rules and error taxonomy
- same request/response contracts at API boundaries
- same schema expectations (migrations) and persistence behavior
- same auth contract (Firebase token verification) and same production security stance

Pros:
- Achievable without pretending macOS == Linux.
- Directly tied to “correctness”: behavior is what users experience and what production depends on.

Cons:
- Requires explicit decisions about which differences are allowed (ex: port number) vs not allowed (ex: Node major/patch).
- Requires ongoing drift detection to ensure “behavioral” is not an excuse for silent divergence.

**Recommendation: Option B (Behavioral parity).**

Reasoning:
- Replit cannot be made macOS, and macOS cannot be made Replit. “Behavior” is the correct correctness target.
- The repo’s existing governance already treats Replit as the final service-backed validation gate (`AGENTS.md`, `docs/adr/0001-replit-primary-local-agents.md`), which aligns with behavioral parity plus explicit validation rules.

**Monitor correctness of this decision:**
- Count parity regressions caught only in Replit after local validation. If this count remains high after implementing this spec, the definition is too weak or the checks are insufficient.
- Maintain a “drift log” section (see §12) and track whether drift is moving from “runtime surprises” to “known, intentionally allowed differences.”

**Revisit triggers:**
- If the project adds more native/system dependencies (image/audio codecs) that behave differently on macOS vs Linux.
- If team size grows beyond solo/small-team and parity needs to become fully automated CI gates.

---

## 2) Current State: Provenance (What We Know Today)

This section is evidence-backed and should be refreshed whenever parity work changes files.

### 2.1 Runtime + ports (Replit)

- Replit modules declare Node 20 + Postgres 16 (`.replit`):
  - `modules = ["nodejs-20", "web", "postgresql-16"]`
- Replit port mapping forwards internal 5000 to external 80 (`.replit`):
  - `[[ports]] localPort = 5000 externalPort = 80`
- Replit deploy uses `npm run build` then `npm run start` (`.replit`):
  - `[deployment] build = ["npm","run","build"]`, `run = ["npm","run","start"]`

Replit ports behavior and autoscale constraints are documented here:
- Replit Ports: https://docs.replit.com/core-concepts/project-editor/app-setup/ports

### 2.2 Runtime + ports (app code)

- Server listens on `process.env.PORT || "5000"` and binds `host: "0.0.0.0"`; sets `reusePort` only when `REPL_ID` is present (`server/index.ts`).

### 2.3 Node pinning (local intent)

- Local pin exists as `.nvmrc = 20.19.0` (`.nvmrc`).
- `package.json` engines allow `>=20.19.0 <21 || >=22.12.0` (meaning Node 22+ is allowed, not rejected).
- Npm engine enforcement is not guaranteed unless `engine-strict` is enabled (project-level `.npmrc` or user config).

### 2.4 Secrets + dotenvx

- Secrets decision: encrypted `.env` is committed; `.env.keys` is not committed (`product-decisions/pd-001-secrets-management.md`, `.gitignore`).
- Local full dev command is documented as `PORT=3000 npx @dotenvx/dotenvx run -- npm run dev` (`AGENTS.md`, `CLAUDE.md`).
- Replit secrets are documented as injected via Replit Secrets tab (`AGENTS.md`).
- However, Replit workflow currently runs dotenvx anyway (`.replit` workflow task runs `npx --yes @dotenvx/dotenvx run -- npm run dev`).

Dotenvx precedence (important for deciding if dotenvx can be used safely on Replit without overriding Secrets):
- dotenvx env var precedence: https://dotenvx.com/docs/advanced/run-environment-variable-precedence.html
- dotenvx `--overload` overrides pre-existing env vars (avoid on Replit unless explicitly desired): https://dotenvx.com/docs/quickstart/environments

Replit Secrets injection:
- Replit Secrets: https://docs.replit.com/replit-workspace/workspace-features/secrets

### 2.5 Database reality

- App requires `DATABASE_URL` at runtime and crashes if missing (`server/db.ts`, `drizzle.config.ts`).
- Replit provides `DATABASE_URL` and related `PG*` env vars for its built-in DB (`docs.replit.com`):
  - Replit Database docs (env vars): https://docs.replit.com/cloud-services/storage-and-databases/sql-database
- Local DB drift has been observed and is tracked as an Effort (`efforts/effort-010-local-db-schema-strategy.md`).

Key constraint: Replit’s built-in database `DATABASE_URL` is app-scoped and not usable externally, which prevents “use the same DB URL locally” as a parity strategy:
- Replit Database docs: https://docs.replit.com/cloud-services/storage-and-databases/replit-database

### 2.6 Firebase auth domains

- Client uses Firebase web SDK and requires `VITE_FIREBASE_*` at build/runtime (`client/src/lib/firebase.ts`).
- The UI explicitly warns “Firebase requires exact domains, not wildcards” (`client/src/components/auth/FirebaseAuthSetup.tsx`).
- Firebase docs note that authorized domains must be managed in Firebase Auth settings; `localhost` is not always authorized by default for newer projects:
  - Firebase FAQ “Limit your authorized authentication domains”: https://firebase.google.com/support/faq/

### 2.7 Testing / validation

- Repo workflow docs define local checks (`npm ci`, `npm run check`, `npm run build`) and a Replit validation gate for service-backed flows (`AGENTS.md`, `docs/adr/0001-replit-primary-local-agents.md`).
- [`testing-and-acceptance.md`](testing-and-acceptance.md) records how validation evidence and acceptance criteria should be routed; standard test scripts are still an environment-parity follow-up.

### 2.8 Agent tooling constraints (Codex + Claude)

Parity isn’t only “runtime”; it’s also “the way agents start and validate the app”.

**Codex local environment config (checked in):**
- `.codex/environments/environment.toml` runs `npm ci` for setup, but its `Dev server` action runs plain `npm run dev` (no dotenvx, no `PORT` override). This can start a server without required secrets on local machines unless secrets are already in the environment.

**Claude Code safety config (checked in):**
- `.claude/settings.json` denies reads of `.env` and `.env.*` by design. This is good security hygiene, but it means parity workflows that require inspecting dotenvx secrets cannot rely on Claude reading `.env` directly.

Implication:
- “One setup” must include an agent-safe, non-secret-leaking parity check path (for example, checking presence of required env vars without printing values, and using dotenvx `--strict` without `--debug`).

---

## 3) Parity Targets (Non-Negotiable Invariants)

To claim “parity” (behavioral parity definition), the following must be true.

### 3.1 Dependency graph invariants

1. `package-lock.json` is authoritative in both environments.
2. Both environments install dependencies with `npm ci` (not `npm install`) for reproducibility.

Provenance for `npm ci` behavior:
- npm `ci` is lockfile-driven and fails if lockfile doesn’t match `package.json`: https://docs.npmjs.com/cli/v11/commands/npm-ci

### 3.2 Node runtime invariants (decision required)

Minimum:
- Same Node major: Node 20.x in both environments.

Preferred (for “tight parity”):
- Same Node patch: exact `node -v` match across Replit + local.

Why patch-level matters:
- Even within a major line, minor/patch releases can change module loading behavior (ex: Node 20.19.0 enabled `require(esm)` by default): https://nodejs.org/en/blog/release/v20.19.0/

### 3.3 Secrets invariants

1. There is exactly one authoritative “required vars list” (the contract), and both envs use it.
2. Secret values never appear in plaintext in git history.
3. Drift between “Replit Secrets values” and “local dotenvx values” is detectable (and ideally eliminated).

### 3.4 Database invariants

1. Both environments run against a DB with the same schema version (Drizzle schema parity).
2. Schema migrations/push policy is explicit (who can run `db:push`, and against which DB).
3. Optional-context behavior is consistent across environments, per PD-008:
   - optional reads degrade gracefully; required persistence fails loudly (`product-decisions/pd-008-optional-context-and-local-validation-boundaries.md`).

### 3.5 Auth invariants

1. Both environments use the same auth contract: Firebase bearer tokens verified server-side (`server/firebaseAuth.ts`).
2. “Dev shortcuts” do not silently change security semantics (see dev-test harness direction).

---

## 4) Decision Catalogue (Options, Pros/Cons, Recommendation, Monitoring)

This section is the core of the spec. Each item describes a decision that must be made to reach parity.

### D1 — What Node version is “the one true runtime”?

**Current facts (provenance):**
- Replit config declares Node 20 via `modules = ["nodejs-20", ...]` (`.replit`).
- Local pin file exists: `.nvmrc = 20.19.0`.
- `package.json` engines allow Node 22+ too.

**Options:**

1. Pin to Node 20.x only (major parity).
2. Pin to exact Node patch (tight parity), matching Replit’s actual `node -v`.
3. Move both environments to Node 22 LTS (update `.replit` + local pin + validate).

**Pros/cons:**

- Option 1 (major parity):
  - Pros: easiest; avoids churn if Replit updates patch automatically.
  - Cons: “exact parity” request is not satisfied; patch differences can create subtle behavior drift (module loading, TLS, etc).

- Option 2 (exact patch parity):
  - Pros: strongest reproducibility.
  - Cons: requires measuring Replit’s actual Node patch and keeping it pinned; can cause more frequent “update both sides” work.

- Option 3 (Node 22 everywhere):
  - Pros: longer support window; modern runtime; `package.json` already allows Node 22.12+.
  - Cons: requires Replit module change; increases risk of runtime differences vs current deployed behavior; requires full Replit validation gate before shipping.

**Recommendation: Option 2 (exact patch parity), but with a formal measurement step.**

Reasoning:
- The user goal is “exact parity” and “no diverging behavior.” Node patch is a top drift vector.
- The project already has `.nvmrc = 20.19.0`, implying intent to pin patch.

**Monitoring:**
- Add a parity-check script that logs `node -v`/`npm -v` in both envs and fails if mismatch. Run it in Replit workflow and as a local preflight.

**Revisit when:**
- Replit’s `nodejs-20` module becomes hard to keep patch-pinned.
- The repo’s dependencies demand Node 22+ (for example, a future Vite or Firebase requirement).

---

### D2 — Should Replit run dotenvx?

**Current facts (provenance):**
- Docs say Replit Secrets are injected and dotenvx is needed locally (`AGENTS.md`).
- `.replit` workflow runs `npx --yes @dotenvx/dotenvx run -- npm run dev`.
- dotenvx defaults to “pre-existing env vars win”, unless `--overload` is used.

**Options:**

1. Replit does NOT run dotenvx. Replit Secrets are the only source of values on Replit.
2. Replit DOES run dotenvx, but with strict rules:
   - no `--overload`
   - Replit Secrets override `.env` values
   - dotenvx is used primarily as a “required vars contract check” and to support the encrypted `.env` model
3. Replit DOES run dotenvx with `--overload`, making `.env` override Replit Secrets.

**Pros/cons:**

- Option 1 (no dotenvx on Replit):
  - Pros: single secrets path on Replit; simplest mental model; aligns with “Replit is canonical secrets store.”
  - Cons: local and Replit use different mechanisms; drift between local `.env` values and Replit Secrets can persist.

- Option 2 (dotenvx on Replit, no overload):
  - Pros: one command to run everywhere; keeps Replit Secrets authoritative; can add `--strict` to fail fast if `.env` is missing/corrupt without overriding Secrets.
  - Cons: still two sources of truth; dotenvx becomes “present” on Replit even if not necessary; requires careful documentation to avoid misconfig.

- Option 3 (dotenvx overload):
  - Pros: truly one canonical `.env` file for all environments.
  - Cons: high risk; `.env` lives in git (encrypted, but still); easy to accidentally ship wrong values; defeats Replit Secrets as canonical runtime config.

**Recommendation: Option 1 short-term, Option 2 long-term (phased).**

Reasoning:
- Short-term: remove ambiguity by matching the docs and making Replit’s run path strictly “Replit Secrets”. This reduces hidden coupling and makes it obvious where to change runtime values.
- Long-term: if you want “one setup command” everywhere, Option 2 is safer than Option 3 because it preserves Replit Secrets precedence.

**Monitoring:**
- If Option 1: add a drift audit checklist item in every deployment-bound PR: “Replit Secrets updated? local `.env` updated? both needed?”
- If Option 2: add `dotenvx run --strict --verbose` logs in Replit workflow (but never `--debug`), and confirm it never overrides Secrets.

**Revisit when:**
- The project adds more environments (staging/prod) and secrets drift becomes costly.
- Team grows and manual secrets sync becomes an operational burden.

Relevant docs:
- dotenvx run strict: https://dotenvx.com/docs/advanced/run-strict
- Replit Secrets: https://docs.replit.com/replit-workspace/workspace-features/secrets

---

### D3 — Database strategy for local parity

**Current facts (provenance):**
- The app requires `DATABASE_URL` and will crash without it (`server/db.ts`, `drizzle.config.ts`).
- Local schema drift happened and is tracked as EFF-010.
- Replit Database `DATABASE_URL` is app-scoped and cannot be used externally, so local cannot “just point at Replit DB” (Replit DB docs).

**Options:**

1. Local uses a dedicated Neon project / branch per worktree.
2. Local uses one shared Neon development database (single URL for all local worktrees).
3. Local uses a local Postgres 16 instance (Docker or native install).
4. Local uses a “DB-less mode” with stubs/mocks for most development (service-backed only on Replit).

**Pros/cons:**

- Option 1 (Neon per worktree):
  - Pros: strong isolation; schema pushes don’t collide across branches; best for parallel agent work.
  - Cons: more setup; needs automation for creation/cleanup; requires Neon access/workflow.

- Option 2 (shared Neon):
  - Pros: simplest; one URL.
  - Cons: schema pushes collide; parallel branch testing can corrupt one another; hard to debug.

- Option 3 (local Postgres):
  - Pros: fastest local loop; does not rely on external network; can match Postgres 16 like Replit.
  - Cons: more local ops; differs from Replit/Neon network model; still requires schema push discipline.

- Option 4 (DB-less):
  - Pros: simplest local setup.
  - Cons: violates “same behavior” for DB-backed features; pushes most correctness checks to Replit; repeats the drift problems that created EFF-010.

**Recommendation: Option 1 (Neon per worktree) if you want “exact parity”, otherwise Option 3.**

Reasoning:
- Parity means DB-backed features behave consistently. The only reliable way is to ensure schema is correct wherever you test.
- Isolation is critical because agents and humans run multiple branches in parallel; shared DB will reintroduce drift and non-reproducible bugs.

**Monitoring:**
- Add a “schema health check” command that verifies required tables/columns exist before running local service-backed tests.
- Track how often a local test failure turns out to be schema drift; the goal is to drive this to ~0.

**Revisit when:**
- The project adopts a formal migration pipeline (instead of `drizzle-kit push`) and can safely share a DB.

Replit DB docs for env vars + scoping:
- https://docs.replit.com/cloud-services/storage-and-databases/sql-database
- https://docs.replit.com/cloud-services/storage-and-databases/replit-database

---

### D4 — Firebase authorized domains strategy (critical for parity)

**Current facts (provenance):**
- Firebase web auth requires the app domain be authorized, and newer projects may not include `localhost` by default (Firebase FAQ).
- LAICA uses Google sign-in (Firebase web SDK) and expects `localhost` to be used locally (`firebase-domain-setup.md`, `FirebaseAuthSetup.tsx`).
- Replit dev URLs and deploy URLs can vary by project and configuration.

**Options:**

1. Manually add every active Replit domain + `localhost` to Firebase authorized domains.
2. Adopt a single stable domain for auth redirects using Firebase Hosting custom auth domain (ex: `auth.cookwithlaica.com`) and add only that + `localhost` + production domains.
3. Do not support local Firebase sign-in; local dev relies on mocks and Replit is the only auth validation environment.

**Pros/cons:**

- Option 1 (manual list):
  - Pros: simplest conceptually; no extra infra.
  - Cons: operationally brittle; Replit domains change; easy to miss; causes repeated `auth/unauthorized-domain` failures.

- Option 2 (stable auth domain):
  - Pros: dramatically reduces drift; avoids per-Replit-domain churn; aligns with production hardening.
  - Cons: requires Firebase Hosting and DNS config; requires careful rollout and monitoring.

- Option 3 (no local auth):
  - Pros: simplest local setup.
  - Cons: violates parity goal; blocks local end-to-end validation; increases dependence on Replit/human QA.

**Recommendation: Option 2 (stable auth domain), with Option 1 as a short-term bridge.**

Reasoning:
- The parity goal requires both environments to validate auth-backed flows. Replit and localhost origins change; a stable auth redirect domain reduces the moving parts.
- The repo already contains guidance about custom auth domains (`firebase-domain-setup.md`).

**Monitoring:**
- Track `auth/unauthorized-domain` occurrences in dev logs (client console + backend 401 rates).
- After rollout, verify sign-in works from:
  - localhost dev
  - Replit dev URL
  - Replit deployment URL
  - custom production domain

**Revisit when:**
- If Firebase/Google sign-in flows change or if you add more auth providers.

Firebase provenance:
- Firebase FAQ authorized domains + localhost note: https://firebase.google.com/support/faq/

---

### D5 — “One command” dev entrypoint across environments

**Current facts (provenance):**
- Replit run uses `npm run dev` or dotenvx-wrapped `npm run dev` (depending on workflow path).
- Local docs recommend `PORT=3000 npx @dotenvx/dotenvx run -- npm run dev` because macOS may have port 5000 conflicts (`CLAUDE.md`, `AGENTS.md`).
- The app defaults port 5000 if `PORT` not set (`server/index.ts`).

**Options:**

1. Standardize on port 5000 everywhere; require local dev to free port 5000 (disable AirPlay Receiver on macOS).
2. Standardize on “port is configurable”; provide a single wrapper script that chooses:
   - Replit: 5000
   - local: 3000
3. Standardize on port 3000 everywhere; change Replit port mapping to forward 3000 -> 80 and set `PORT=3000` in Replit.

**Pros/cons:**

- Option 1:
  - Pros: closest to Replit; aligns Playwright config; simplest parity story.
  - Cons: local macOS friction; requires OS setting changes; not feasible for everyone.

- Option 2:
  - Pros: ergonomic; acknowledges OS reality; if app is truly port-agnostic, behavior remains identical.
  - Cons: “exact parity” is weaker at the origin layer; must ensure no hidden port assumptions exist (Playwright baseURL, Firebase redirect settings).

- Option 3:
  - Pros: matches common local defaults; avoids port 5000 conflict entirely.
  - Cons: requires Replit config changes; may break existing assumptions; must validate autoscale constraints (non-localhost binding).

**Recommendation: Option 2 (port-configurable via wrapper), unless you want the strictest possible parity, then Option 1.**

Reasoning:
- The app is already designed to be `PORT` configurable.
- Port number should not change semantics; if it does, that’s a bug this spec will flush out.

Monitoring:
- Add a “port invariants” checklist item: all URLs should be relative; no absolute `localhost:5000` baked into runtime code.
- Ensure Playwright config is parameterized or matches the selected port.

Revisit when:
- If you introduce features that depend on absolute origins (webhooks, OAuth redirect origins, cookie domains).

---

### D6 — Authenticated test automation gap (Replit vs local)

**Current facts (provenance):**
- Agents cannot reliably drive Google popup sign-in in local in-app browser; this gap is documented (`product-decisions/features/mobile-refresh/pd-dev-test-harness.md`).
- The accepted direction rejects a backend auth bypass as the default and prefers a dev-only Firebase custom token lane.

**Options:**

1. Keep manual signed-in smoke on Replit as the only authenticated UI validation path.
2. Implement the planned dev-test harness:
   - dev-only endpoint to mint Firebase custom tokens for deterministic test users
   - strict gating (non-prod + env opt-in + secret header + allowlist users)
3. Implement a backend bypass header for tests.

**Pros/cons:**

- Option 1:
  - Pros: no code risk; preserves security semantics.
  - Cons: blocks true parity; slows iteration; doesn’t scale as app grows.

- Option 2:
  - Pros: preserves Firebase token contract; enables deterministic automated smoke; aligns with the existing planned direction.
  - Cons: implementation work; requires careful gating and security review.

- Option 3:
  - Pros: fastest to implement.
  - Cons: changes the security contract under test; high risk of “it passed locally but not in production.”

**Recommendation: Option 2.**

Reasoning:
- It’s the only option that improves automation while preserving the real auth contract.
- It is already documented as the intended direction, so turning it into an implemented spec reduces repeated rediscovery.

Monitoring:
- Require a hard “dev harness enabled” flag and log when it’s active.
- Add tests that prove harness is disabled in production mode.

Revisit when:
- If Firebase introduces new constraints on custom tokens or if you switch auth providers.

Relevant Firebase provenance:
- Creating custom tokens (Admin SDK): https://firebase.google.com/docs/auth/admin/create-custom-tokens
- Auth emulator capabilities/differences (useful model for dev-only auth tooling): https://firebase.google.com/docs/emulator-suite/connect_auth

---

### D7 — Should local dev adopt Nix/containerization to match Replit system deps?

**Current facts (provenance):**
- Replit uses Nix channels and packages (this repo sets `[nix] channel = "stable-24_05"` and installs `imagemagick` via `.replit`).
- Replit docs explicitly frame `replit.nix` as the tool for reproducible system dependencies: https://docs.replit.com/replit-app/configuration
- Local macOS development, by default, uses whatever is installed via Homebrew/Xcode/etc (not pinned by this repo).

**Why this matters:**
- Even if most dependencies are JavaScript, some packages ship native binaries (example in this repo: `bcrypt`), and system tooling can influence runtime behavior (image/audio processing, headless browser dependencies, etc).
- CPU architecture differs: many macOS setups are `arm64`, while Replit commonly runs `linux` on `x86_64`. Native module builds may differ, even if behavior should be equivalent.

**Options:**

1. Do not adopt Nix locally; minimize reliance on OS packages; accept “system deps parity” is best-effort.
2. Adopt Nix locally on macOS and define system deps in `replit.nix` (or a Nix flake) so both Replit and local use the same Nix-defined packages.
3. Run local development inside a Linux container (Devcontainer/Docker) pinned to the same Node + system deps, and treat “native macOS runs” as secondary.

**Pros/cons:**

- Option 1:
  - Pros: lowest friction; no new toolchain.
  - Cons: “exact parity” is limited; native dependency drift remains possible.

- Option 2:
  - Pros: closest match to Replit’s model; pins system deps; can reduce drift without switching to containers.
  - Cons: introduces Nix to local workflow (learning curve, install overhead); some macOS Nix ergonomics can be painful.

- Option 3:
  - Pros: strongest OS-level parity; can match Linux semantics closely.
  - Cons: requires Docker/devcontainer adoption; camera/device flows on macOS browsers remain different; higher setup complexity.

**Recommendation: Option 1 short-term, Option 2 only if/when system deps become meaningful.**

Reasoning:
- Today the repo’s only explicit Nix package is `imagemagick` and it is not referenced directly by the codebase.
- The highest-signal parity risks are Node version, secrets, DB schema, and auth flows; solving those yields most correctness.

**Monitoring:**
- Track incidents where a bug reproduces in one environment but not the other due to system dependency or native module differences.
- If these become non-trivial (more than “rare edge”), adopt Option 2.

**Revisit when:**
- A feature introduces OS-level tools (ffmpeg, libvips, imagemagick usage, OCR libs).
- Playwright/E2E becomes a first-class gate and needs consistent browsers/system deps.

---

## 5) Unified Environment Contract (Explicit Variables + Semantics)

This section defines the canonical environment contract. Every environment (Replit dev, Replit deploy, local macOS dev, local tests) must implement it.

### 5.1 Canonical environment variables

#### Required for server startup (hard failure if missing)

- `DATABASE_URL`
  - Provenance: `server/db.ts` throws if missing; `drizzle.config.ts` throws if missing.
- `ELEVENLABS_API_KEY`
  - Provenance: `server/elevenlabs.ts` throws if missing.
- Firebase Admin config (required for any authenticated API to succeed):
  - `FIREBASE_SERVICE_ACCOUNT_JSON` OR `FIREBASE_SERVICE_ACCOUNT_BASE64` (preferred in secrets stores)
  - `FIREBASE_PROJECT_ID` (optional override; derived if not set)
  - Provenance: `server/firebaseAuth.ts`

#### Required for client auth (build/runtime)

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_APP_ID`
  - Provenance: `client/src/lib/firebase.ts`

#### Optional / feature-gated

- `OPENAI_API_KEY`
  - Provenance: `server/openai.ts` accepts empty string for non-critical paths, but many AI features will fail if unset.
- `ADMIN_SECRET`
  - Provenance: `server/admin-routes.ts` requires for admin endpoints.
- `SESSION_SECRET`, `REPLIT_DOMAINS`, `ISSUER_URL`
  - Provenance: `server/replitAuth.ts` (legacy path; should remain disabled unless explicitly used).
- `PORT`
  - Provenance: `server/index.ts`

#### Optional rate-limit overrides (naming decision required)

The repo intends to allow `RATE_LIMIT_*` overrides (`replit.md`), but `server/rate-limit.ts` currently computes env var names in a way that appears incorrect for normal usage (it inserts underscores between every capital letter, producing keys like `_R_A_T_E__L_I_M_I_T_SLOP_BOWL_HOUR`).

This spec requires a decision:

- Either explicitly define the override variable names and fix the implementation to match,
- Or explicitly de-scope env overrides and remove the contract claim.

Monitoring:
- Add a unit test that asserts the expected env var name mapping for a sample key (ex: `RATE_LIMIT_RECIPE_HOUR`).

---

## 6) Replit Environment Spec (Exact Requirements)

### 6.1 Replit `.replit` requirements

Must define:
- Node module version (Node 20 vs Node 22 decision).
- Single external port mapping aligned with server listen port (autoscale constraint).
- Deployment build/run commands match `package.json` scripts.

Provenance:
- `.replit` in this repo.
- Replit App configuration docs: https://docs.replit.com/replit-app/configuration
- Replit Ports docs: https://docs.replit.com/core-concepts/project-editor/app-setup/ports

### 6.2 Replit Secrets requirements

Must contain:
- Every required server+client env var from §5.1.
- If dotenvx is used on Replit (Decision D2 Option 2/3): `DOTENV_PRIVATE_KEY` must be present in Secrets instead of `.env.keys`.

Provenance:
- Replit Secrets docs: https://docs.replit.com/replit-workspace/workspace-features/secrets
- dotenvx private key behavior: https://dotenvx.com/docs/quickstart/encryption

### 6.3 Replit DB requirements

If using Replit Database (recommended for Replit runtime correctness):
- `DATABASE_URL` comes from Replit DB tool and cannot be used externally; do not attempt to reuse it locally.

Provenance:
- https://docs.replit.com/cloud-services/storage-and-databases/replit-database

---

## 7) Local macOS Environment Spec (Exact Requirements)

### 7.1 Node runtime

Local must run the same Node version as Replit per Decision D1.

Required enforcement mechanisms (choose one; document which is adopted):

- `nvm` using `.nvmrc` (minimal change, but requires developers to run `nvm use` and have nvm installed)
- `mise`/`asdf`/Volta (stronger automatic enforcement, but introduces new tooling)
- A repo-level preflight script that checks `node -v` and fails fast

### 7.2 Secrets

Local must have access to dotenvx private key:
- `.env.keys` must exist in each worktree (symlink allowed).

Provenance:
- Worktree symlink instructions: `AGENTS.md`
- dotenvx private key: https://dotenvx.com/docs/quickstart/encryption

### 7.3 Database

Local must have a DB strategy chosen in Decision D3 and must include a schema health check before any service-backed testing.

### 7.4 Ports

Local may use `PORT=3000` if macOS port 5000 is unavailable (docs mention AirPlay Receiver conflicts). This is allowed only if:
- the app is proven port-agnostic
- all automated tests parameterize baseURL or consistently use the chosen port

Provenance (why port 5000 can be busy on macOS):
- AirPlay Receiver commonly binds to port 5000 on macOS; disabling it is a known workaround: https://alexwlchan.net/notes/2026/flask-and-port-5000/

---

## 8) Parity Checklists (Concrete, Verifiable)

This section defines what it means to “prove parity”.

### 8.1 Static parity checks (must pass locally + in Replit)

- `npm ci`
- `npm run check`
- `npm run build`

Provenance:
- `AGENTS.md`, `docs/adr/0001-replit-primary-local-agents.md`

### 8.2 Runtime parity checks (unauthenticated)

These checks must pass in both environments:

- App boots and serves HTML at `/`
- Client renders without console errors on first load
- API health endpoint (if present) responds (if absent, add one as a parity tool)

### 8.3 Runtime parity checks (authenticated)

These checks must pass in both environments (manual until dev-test harness is implemented):

- Firebase sign-in works
- Authenticated API calls succeed with real bearer tokens
- Cooking-session persistence works (DB writes)
- Feedback writes work (DB writes)
- Vision analyze route behaves the same (rate-limits, error taxonomy)
- ElevenLabs TTS route works

Provenance:
- Replit validation gate items: `AGENTS.md`

### 8.4 AI parity checks

AI features are costly and non-deterministic; parity means:

- Same model IDs configured (server code constants) and same structured output validation.
- Same sanitization and logging rules apply.

Provenance:
- `server/openai.ts`
- AI privacy policy: `product-decisions/features/mobile-refresh/pd-cross-phase-ai-privacy.md`

---

## 9) Drift Detection (Continuous)

Parity is not “set and forget”. This spec requires explicit drift detection.

### 9.1 Mandatory drift signals to log/record

- `node -v`, `npm -v`, `process.platform`, `process.arch`
- `DATABASE_URL` “kind” classification (Replit DB vs Neon vs local Postgres) without logging the raw secret
- `REPL_ID` presence (Replit vs local)
- App version (git SHA) shown in logs at boot

### 9.2 Where to record drift findings

- Short term: `docs/handoffs/YYYY-MM-DD-<agent>-env-parity.md`
- Durable: append dated sections to this workflow, [`testing-and-acceptance.md`](testing-and-acceptance.md), or EFF-010/EFF-017 as appropriate.

---

## 10) Implementation Worklist (No Shortcuts, Ordered)

This is the explicit “what it would take” list. Each item has an owner and acceptance criteria.

1. Measure and record Replit runtime versions.
   - Output: record `node -v` and `npm -v` from Replit dev and Replit deploy environments in a durable doc.

2. Decide D1 (Node runtime) and update pins accordingly.
   - Output: a single chosen Node version, enforced locally and checked on Replit.

3. Decide D2 (dotenvx on Replit) and remove ambiguity.
   - Output: `.replit` workflow and docs match.

4. Decide D3 (local DB strategy) and implement the workflow.
   - Output: a documented, repeatable local DB setup; EFF-010 advances toward resolution.

5. Decide D4 (Firebase domain strategy) and implement stable auth domain if chosen.
   - Output: documented Firebase config; local + Replit sign-in works reliably.

6. Normalize dev entrypoint command(s).
   - Output: one documented `npm run dev` wrapper that works in both envs (or explicit env-specific wrappers), with a parity check that catches missing secrets.

7. Standardize test scripts in `package.json` (testing workflow / environment-parity follow-up).
   - Output: `test:unit`, `test:e2e`, `test:smoke:*` scripts with clear semantics.

8. Implement dev-test harness (planned) to close authenticated smoke gap.
   - Output: deterministic test user sign-in path; strict dev-only gating; production remains unchanged.

9. Add drift detection checks (boot logs + parity check script).
   - Output: failures become explicit; “it worked locally” becomes meaningful.

---

## 10.1 Detailed Runbooks (Step-by-step)

This section is intentionally procedural. It is the “no shortcuts” checklist to get to parity.

### Replit runbook (Dev workspace)

1. Confirm `.replit` is present and defines:
   - `modules = ["nodejs-20", "web", "postgresql-16"]`
   - a single `[[ports]]` mapping consistent with the server’s listen port
   - `[deployment]` build/run commands match `package.json` scripts
   - Provenance: `.replit`, Replit configuration docs: https://docs.replit.com/replit-app/configuration

2. Confirm the server binds to non-localhost so autoscale can expose it:
   - `server.listen({ host: "0.0.0.0", port: process.env.PORT || "5000" })`
   - Provenance: `server/index.ts`, Replit ports + autoscale constraints: https://docs.replit.com/core-concepts/project-editor/app-setup/ports

3. In Replit Secrets, set every required variable from §5.1 for Dev:
   - `DATABASE_URL`
   - `ELEVENLABS_API_KEY`
   - `OPENAI_API_KEY` (recommended for full parity; optional in code, but many flows depend on it)
   - `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_APP_ID`
   - `FIREBASE_SERVICE_ACCOUNT_BASE64` (preferred) or `FIREBASE_SERVICE_ACCOUNT_JSON`
   - `FIREBASE_PROJECT_ID` (optional override)
   - `ADMIN_SECRET` (only if using admin/eval endpoints)
   - Provenance: Replit Secrets docs: https://docs.replit.com/replit-workspace/workspace-features/secrets

4. Confirm the database is provisioned and `DATABASE_URL` exists:
   - Replit DB tool shows connection credentials and sets `DATABASE_URL`, plus `PGHOST`, `PGUSER`, etc.
   - Provenance: https://docs.replit.com/cloud-services/storage-and-databases/sql-database

5. Install dependencies reproducibly:
   - Run `npm ci` (not `npm install`) to ensure lockfile fidelity.
   - Provenance: `AGENTS.md` local checks; npm ci docs: https://docs.npmjs.com/cli/v11/commands/npm-ci

6. Record Replit runtime metadata in a durable doc (required for D1 exact patch parity):
   - `node -v`, `npm -v`
   - Replit env metadata present (ex: `REPL_ID`, `REPLIT_DEV_DOMAIN`, `REPLIT_DOMAINS`)
   - Provenance for env metadata: https://docs.replit.com/replit-app/configuration and https://docs.replit.com/programming-ide/workspace-features/storing-sensitive-information-environment-variables

7. Run parity verification:
   - `npm run check`
   - `npm run build`
   - service-backed smoke checklist (auth, DB writes, vision, TTS) per §8.3

### Replit runbook (Deployments)

Replit deploy environments can differ from dev workspaces (environment vars, domains, ephemeral storage). Parity requires explicitly validating both.

1. Confirm deployment build/run matches `.replit`:
   - `npm run build` and `npm run start`
   - Provenance: `.replit` `[deployment]`

2. Confirm deployment env metadata is recognized:
   - `REPLIT_DEPLOYMENT=1` in deployed apps (Replit docs)
   - Provenance: Replit env var docs: https://docs.replit.com/programming-ide/workspace-features/storing-sensitive-information-environment-variables

3. Confirm secrets are present in the deployment environment (not just dev workspace).
4. Confirm DB used by deployment is correct (Replit separates development and production databases; do not reuse dev DB for production by accident).
   - Provenance: Replit DB docs mention separate dev/prod DBs: https://docs.replit.com/cloud-services/storage-and-databases/replit-database

### Local macOS runbook (Codex/Claude worktree)

1. Confirm Node version matches the project pin:
   - `.nvmrc` exists and is authoritative for local intent.
   - Enforce by running `node -v` and comparing to the chosen parity target (Decision D1).

2. Confirm dotenvx private key availability:
   - Each worktree must have `.env.keys` present (symlink is acceptable).
   - Provenance: `AGENTS.md` “Worktrees and .env.keys”; dotenvx key docs: https://dotenvx.com/docs/quickstart/encryption

3. Install dependencies reproducibly:
   - `npm ci` (not `npm install`)

4. Start the dev server with secrets injected:
   - `PORT=<chosen> npx @dotenvx/dotenvx run --strict -- npm run dev`
   - Rationale:
     - `--strict` fails fast if `.env` cannot decrypt (prevents “half-working local”).
     - Avoid `--overload` unless explicitly deciding `.env` should override existing env vars.
   - Provenance: dotenvx `--strict` docs: https://dotenvx.com/docs/advanced/run-strict

5. Validate local DB per the chosen D3 strategy:
   - Before running service-backed flows, run schema health checks (see EFF-010).
   - Provenance: `efforts/effort-010-local-db-schema-strategy.md`

6. Auth parity:
   - Ensure Firebase authorized domains include `localhost` (Firebase no longer guarantees it by default after 2025-04-28).
   - Provenance: Firebase FAQ: https://firebase.google.com/support/faq/

---

## 10.2 Deliverables (What “Done” Looks Like)

Parity work is complete only when all deliverables are satisfied:

1. A single written parity definition is adopted (Option B recommended) and referenced by workflow docs.
2. Node version parity is enforced with an automated check in both environments.
3. `npm ci` is the standard install in both environments (Replit + local).
4. The environment variable contract in §5.1 is complete, accurate, and enforced.
5. A local DB strategy is chosen, implemented, and reduces schema drift incidents to ~0.
6. Firebase domain strategy makes auth reliable on both Replit and localhost.
7. A minimal authenticated smoke path exists that can be repeated (manual at first, harness later).
8. Drift detection is in place and drift findings are recorded durably.

---

## 10.3 Open Implementation Questions (Must Be Answered To Implement)

This spec intentionally does not guess values it cannot know from the repo alone. To implement it, the following must be measured/decided:

- What exact `node -v` and `npm -v` does Replit `nodejs-20` provide in:
  - Dev workspace
  - Autoscale deployment
- Which DB provider is used in Replit today (legacy Neon vs Replit-hosted DB)?
  - Replit docs describe how to check via `DATABASE_URL` contents (helium vs neon): https://docs.replit.com/cloud-services/storage-and-databases/sql-database

---

## 11) Risk Register

Parity work is high-leverage but also high-risk because it touches the foundations.

Key risks:
- Over-constraining the environment makes iteration painful (developers ignore the rules).
- Under-constraining leaves drift intact (parity becomes “aspirational”).
- Secrets drift can cause subtle differences that look like product bugs.
- DB schema drift wastes time and can ship regressions if mistaken for feature behavior.

Mitigations:
- Keep enforcement to a small number of high-signal checks (Node version, npm ci, schema health).
- Record validation at commit SHAs (already required by workflow).

---

## 12) Drift Log (Append-Only)

Append new drift findings here with date + links to handoffs/PRs.

### 2026-05-04 — Draft created

- This spec created to unify and formalize parity requirements and decisions.
