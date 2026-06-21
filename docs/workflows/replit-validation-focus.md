# Replit Validation Focus Guide (Local -> Replit)

## Operating Principles

Follow [operating-principles.md](operating-principles.md): evidence first, no unsupported assumptions, objective detail, visible rationale and provenance, feedback from first principles, no hacks or duplicate paths, deletion of obsolete paths, explicit decisions, and blocking reports with exact missing inputs and smallest next actions.

This doc exists to make Replit validation *targeted*.

After a feature is validated locally or in CI, Replit validation should focus on the **environmental differences** that can still cause failures (ports/origins, deployment secrets, dev-vs-prod database separation, Firebase OAuth domains, etc.), not re-test everything every time.

Human manual Replit validation is not the default PR gate. Use this guide when a PR's risk lane requires manual Replit validation before merge, when a low-risk batch is ready for pre-production/release validation, or when an accepted automated Replit-environment lane needs focus areas and expected evidence.

For the exhaustive drift-vector inventory and longer-term parity plan, see:
- `docs/workflows/environment-parity-spec.md`
- `efforts/effort-017-environment-parity-and-ci-confidence.md`

## What Is Different On Replit (And Why We Validate There)

### 1) Ports and publicly reachable origins (Workspace + Deployment)

Replit runs your app inside a sandboxed cloud environment where a process must be bound to an **external port** to be reachable from the webview or the public internet. Replit binds external ports (like `:80`) to internal ports (like `:5000`/`:3000`), and Autoscale deployments only support a single external port. This can reveal bugs that never show up on localhost.  
Reference: Replit ports model and autoscale constraints. https://docs.replit.com/core-concepts/project-editor/app-setup/ports

**Why this matters for LAICA:**
- OAuth / Firebase “authorized domains” checks are based on the browser origin. A flow that works on `http://localhost:3000` can fail on `https://<app>.replit.app` with `auth/unauthorized-domain` if the domain isn’t whitelisted.
- Hard-coded absolute URLs, assumptions about `localhost`, or mixed-content assumptions can break only on Replit.

**When to focus Replit validation here:**
- Any change touching auth redirects, URL building, routing, base URL detection, cookies/session, CORS, or server listen/bind behavior.

### 2) Workspace vs Published Deployment environment separation

Replit “Project Editor” (workspace) and “Published app” (deployment) are *not the same runtime*:
- `REPLIT_DEV_DOMAIN` exists in the Project Editor, and is explicitly *not available in Deployments*. https://docs.replit.com/core-concepts/project-editor/app-setup/configuration
- `REPLIT_DEPLOYMENT` is set to `1` when running as a published app. https://docs.replit.com/core-concepts/project-editor/app-setup/secrets

**Why this matters:**
- Code that accidentally relies on `REPLIT_DEV_DOMAIN` can work in workspace but break in production.

### 3) Secrets: workspace secrets don’t automatically carry into deployments

Secrets set in the Project Editor do **not** automatically carry over to your published app; you must configure deployment secrets separately in the Publishing pane. Missing secrets often show up as “undefined env var” crashes only in the deployed app.  
Reference: https://docs.replit.com/cloud-services/deployments/troubleshooting

**Why this matters for LAICA:**
- LAICA has hard-required env vars (ex: `DATABASE_URL`, `ELEVENLABS_API_KEY`) and auth-required Firebase Admin config; missing any of these is a runtime failure.

### 4) Publishing is a snapshot; filesystem is not a datastore

Publishing creates a snapshot of your app’s files/dependencies, runs it as a separate instance, and you should avoid relying on the published app filesystem for persistence.  
References:
- https://docs.replit.com/category/replit-deployments
- https://docs.replit.com/cloud-services/deployments/troubleshooting

**Why this matters for LAICA:**
- Anything that accidentally writes state to disk (uploads, temp files used as “storage”, caching) can appear to work locally but be fragile in a published Replit app.

### 5) Database separation: development DB vs production DB

Replit can use separate development and production databases (depending on whether your workspace is on legacy Neon vs Helium). After publishing, the published app uses the production database while the workspace continues using the development database.  
Reference: https://docs.replit.com/cloud-services/storage-and-databases/create-production-database-when-publishing

**Why this matters for LAICA:**
- Schema drift can exist between dev and prod DBs if migrations/pushes are only applied in one place.
- “It worked in Replit workspace” is not a guarantee it works in the deployed app’s DB.

### 6) Linux runtime and native/module differences

Replit runs on Linux; local dev is usually macOS (often ARM64). Native modules and system tools can behave differently even with identical JS code.

**Why this matters for LAICA:**
- Image/audio handling, headless browser bits, image conversion toolchains, and optional native modules are more likely to diverge.

## Production Publish Validation Routine

Use this routine before pushing a merged `main` build to production. It is intentionally split between checks that should be trusted from automation and checks that still need Replit or the deployed production runtime because they depend on secrets, provider network access, deployment domains, or human judgment.

Do not use Replit Agent for this routine unless Wilson explicitly approves it. Prefer direct Replit shell, the workspace UI, Chrome, GitHub checks, and app/API evidence. Never print secret values; use masked presence checks that print only `set` or `MISSING`.

### 1) Select The Exact Build

- Confirm the intended production source is current `origin/main`.
- Record the exact SHA that will be validated and published.
- Confirm no release-relevant PR, docs closeout, or migration branch is still expected to merge first.
- If any commit lands after validation starts, mark previous validation stale for the affected surfaces and rerun the relevant checks.

### 2) Automated Evidence To Trust First

Run or confirm these against the exact SHA. If a check is already green on GitHub for that SHA, use the GitHub run as evidence instead of repeating it manually unless debugging is needed.

| Check | Routine owner | Confidence when passing | What it proves | What it does not prove |
|---|---|---|---|---|
| `npm ci` | Local/CI | High | Dependencies install from lockfile. | Replit deployment secrets, live providers, OAuth domains. |
| `npm run check` | Local/CI | High | TypeScript/static contract checks pass. | Runtime service config or user workflow quality. |
| `npm run build` | Local/CI | High | Production bundle and server build compile. | Deployed Replit snapshot actually updated. |
| `npm run test:unit` | Local/CI | High for covered deterministic behavior | Route/component/helper contracts covered by unit assertions. | Browser flows, live provider behavior, deployment config. |
| GitHub `unit` | GitHub required gate | High for its suite on exact head | Required unit suite passed in the shared CI environment. | Replit-only drift and live provider quality. |
| GitHub `e2e_guest_smoke` | GitHub required gate | High for guest smoke on exact head | Disposable Neon branch, schema push, `db:health`, and Playwright guest smoke passed. | Full Google popup login, production DB, live OpenAI/ElevenLabs quality, deployed Replit behavior. |
| GitHub security checks | GitHub required/review gate | Medium to High by scanner scope | Known configured static/dependency/secret checks did not block the head. | Runtime security headers, private provider-console config, unscanned manual surfaces. |

If an automated lane is skipped, pending, stale, or unavailable, report it as `Blocked` or `Low confidence`; do not convert it into a pass through a manual smoke.

### 3) Replit Workspace Pre-Publish Validation

Run this after automation is green or after recording the exact automation gap. The goal is to prove Replit-specific runtime seams before publishing.

1. Sync Replit workspace to the validated `origin/main` SHA.
2. Record Replit shell provenance: branch, `git status --short --branch`, `git rev-parse HEAD`, and the matching remote SHA.
3. Confirm workspace startup through the normal run command or direct shell command; capture the app URL and any startup errors.
4. Use masked presence checks for required runtime secrets in the workspace and deployment configuration:
   - `DATABASE_URL`
   - `ELEVENLABS_API_KEY`
   - `OPENAI_API_KEY`
   - `ADMIN_SECRET` when admin routes are in scope
   - `VITE_FIREBASE_*` client config
   - Firebase Admin/service-account config used by the server
5. Confirm the database lane intentionally points at the expected non-production or production DB for the validation target; do not infer this from successful app load.
6. Run only the live flows that automation cannot confidently prove for the release batch:
   - Firebase entry: anonymous guest start and Google sign-in completion on the Replit domain.
   - Backend auth: authenticated API calls return 200 after real sign-in; an unauthenticated probe still returns the expected 401.
   - Pantry/Settings persistence: add, delete, save, reload, and verify state only if Settings/profile/inventory changed or was recently risky.
   - Vision pantry scan: upload a known food image and confirm the server returns recognized ingredients. After the June 2026 production incident, include a live OpenAI-backed image canary whenever provider secrets or production publish readiness are in scope.
   - Recipe suggestion flow: pantry -> Chef It Up -> recipe suggestions -> Ticket Pass/Prep Tray -> Live Cooking entry.
   - Cooking persistence: reload/remount during Ticket Pass or Live Cooking and confirm the active workflow restores when the release batch touched workflow state, auth bootstrap, persistence, or routing.
   - ElevenLabs speech: generate or play speech on Replit when speech routes, provider config, or release-critical cooking assistance are in scope.
   - Feedback write: submit feedback and confirm success when feedback, auth, DB writes, or admin review surfaces changed.
   - Security/header/admin checks: use focused live header/admin probes only when those surfaces changed or security due diligence requires them.

For each selected flow, record the user-visible result, route status/response body where relevant, and console/server-log errors. Do not preserve raw images, audio, auth tokens, provider payloads, or secret diagnostics in public docs.

### 4) Publish And Post-Publish Smoke

Only publish after Wilson explicitly instructs production publish or confirms the release action. After publishing:

1. Open the production custom domain and confirm it serves the new build, not the previous snapshot. Use a non-secret build marker, asset hash, response header, or `last-modified` evidence.
2. Confirm production auth can start on the custom domain and that the browser origin is accepted by Firebase.
3. Run one release-critical live provider canary. For current production readiness, prioritize the vision pantry scan with the known food image because it proves the rotated OpenAI key reached the deployed environment.
4. If the release batch touched speech, run one ElevenLabs-backed speech route.
5. If the release batch touched DB/schema/persistence, complete one production-safe create/read/update path using synthetic or disposable data and verify no schema/runtime errors appear.
6. Check production browser console and server logs around the smoke window for new errors.
7. Record `Last Replit-validated at: <sha>` and `Last production-smoked at: <sha>` in the handoff or release note.

### Confidence Report

Every production-push validation summary should include this table. Assign confidence per lane, not as a single vague score.

| Lane | Confidence | Evidence | Limits / gaps |
|---|---|---|---|
| Exact-head automation | High / Medium / Low / Blocked | Commands or GitHub checks with SHA. | Name skipped, stale, mocked, provider-light, or environment-light coverage. |
| Replit workspace smoke | High / Medium / Low / Blocked | Shell/browser steps, SHA, selected flows, observed route/UI results. | Name flows not selected and seams still only proved in prod. |
| Live provider canaries | High / Medium / Low / Blocked | Vision/OpenAI, ElevenLabs, OAuth, or other live-provider evidence. | Name provider quality limits, sample size, and any secrets not verified present. |
| Post-publish production smoke | High / Medium / Low / Blocked | Production domain, build marker, selected live flows, logs. | Name any smoke skipped because publish was not yet approved or because a dependency was unavailable. |
| Overall release confidence | High / Medium / Low / Blocked | Short rationale from the lane results. | Smallest next action to raise confidence. |

Use these meanings consistently:

- `High`: exact-head deterministic automation passed, or the selected live check directly exercised the real runtime seam it claims to prove.
- `Medium`: the check passed but sample size is narrow, the provider is live but quality is not exhaustively evaluated, or the workspace is close to production but not the deployed custom domain.
- `Low`: evidence is indirect, stale, local-only for a Replit/prod seam, or missing meaningful negative-path coverage.
- `Blocked`: the check could not run, skipped unexpectedly, used the wrong SHA, lacked required secrets/config, or produced conflicting evidence.

## What To Validate On Replit (Matrix)

Use this as a checklist picker. If you did not touch a category, you generally do not need to re-test it in Replit. If a PR defers human Replit validation to a release/batch pass, copy only the relevant rows into the PR risk note or handoff.

| If your change touches… | Replit validation focus |
|---|---|
| `.replit`, deployment commands, ports, server bind/listen logic | Workspace Run button works; Preview loads; deployed app serves traffic; no port mismatch; app listens on the expected port and is reachable via external port binding. |
| Auth UI / Firebase client config / redirect flow | Google sign-in begins and completes on Replit domain; no `auth/unauthorized-domain`; after sign-in, authenticated API calls succeed. Also sanity check on the *deployed* domain if this is a deployment-bound change. |
| Firebase Admin verification / auth middleware | After real sign-in on Replit, server accepts the ID token and returns 200s; invalid/expired tokens still 401; no hidden reliance on emulator-only behavior. |
| DB schema / migrations / Drizzle schema / persistence code | Create/update flows that write to DB; reads of existing data; confirm the deployed app is using the intended DB (dev vs prod) and schema is present; watch logs for migration/schema errors. |
| Secrets / env-var contract / `.env.example` / required vars | Workspace and deployed app both have all required vars configured; no “works in workspace, breaks in deploy” due to missing secrets. |
| AI provider routes (OpenAI/Claude), rate limits | Real provider calls succeed using Replit secrets; ensure rate-limit behavior is sane in a long-running server process; watch for provider/network errors that local mocks wouldn’t catch. |
| ElevenLabs speech routes | Speech endpoints return audio on Replit; latency acceptable; no missing key or network egress issues. |
| File uploads / vision / image processing | Upload/scan flows work in Replit; no reliance on local filesystem persistence; any system package assumptions (image conversion) behave on Linux. |
| Security-sensitive headers, production HTML, admin routes, or provider abuse controls | Confirm served HTML/header behavior from the running Replit server, admin responses are not cacheable, and DB-backed security controls have their schema applied. Reuse focused checks from [`security-due-diligence.md`](security-due-diligence.md). |
| Performance / boot-time changes | Deploy health check passes (homepage responds quickly); app doesn’t crash-loop; logs clean. |

## Replit Validation Request Template (Copy/Paste)

Use this in PR descriptions and handoffs only when manual Replit validation is required before merge or deliberately deferred to a release/batch pass. For future automated Replit-environment checks, use the same focus/coverage fields and replace human steps with the script/workflow/run provenance.

```md
## Replit validation request

Validated locally:
- [ ] npm ci
- [ ] npm run check
- [ ] npm run build
- [ ] manual localhost smoke (describe)

Replit validation lane:
- [ ] Human before PR merge
- [ ] Human release/batch validation
- [ ] Automated Replit-environment gate

Replit validation target:
- [ ] Workspace (replit.dev)
- [ ] Deployment (replit.app / custom domain)

Focus areas (only select what applies):
- [ ] Ports/origin
- [ ] Secrets in deployment
- [ ] Firebase auth (Google sign-in)
- [ ] Firebase Admin token verification
- [ ] DB writes/reads + schema/migrations
- [ ] AI routes (OpenAI/Claude)
- [ ] ElevenLabs speech routes
- [ ] Vision / uploads / image processing
- [ ] Security headers / caching / external scripts / abuse limits

Coverage classification:

| Case | Local automated? | Replit automated? | Needs Replit human? | Confidence / provenance |
|---|---|---|---|---|
| Happy path:  |  |  |  |  |
| Corner case:  |  |  |  |  |
| Boundary/regression:  |  |  |  |  |
| Not covered/deferred:  |  |  |  |  |

Steps to run on Replit (numbered, specific):
1.
2.
3.

Last Replit-validated at: <commit-sha> / deferred to release-batch validation
```

## Updating This Doc

If a regression is caught *only* on Replit after local validation:
1. Add the root cause to the relevant section above (new drift vector or clearer trigger).
2. Add a new row to the matrix if the category wasn’t covered.
3. Update the PR/handoff template if we keep missing the same item.
