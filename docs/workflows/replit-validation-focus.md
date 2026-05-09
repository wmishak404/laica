# Replit Validation Focus Guide (Local -> Replit)

This doc exists to make Replit validation *targeted*.

After a feature is validated locally, Replit validation should focus on the **environmental differences** that can still cause failures (ports/origins, deployment secrets, dev-vs-prod database separation, Firebase OAuth domains, etc.), not re-test everything every time.

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
- Image/audio handling and any native dependency (`bcrypt`, headless browser bits, image conversion toolchains) are more likely to diverge.

## What To Validate On Replit (Matrix)

Use this as a checklist picker. If you didn’t touch a category, you generally don’t need to re-test it in Replit.

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
| Performance / boot-time changes | Deploy health check passes (homepage responds quickly); app doesn’t crash-loop; logs clean. |

## Replit Validation Request Template (Copy/Paste)

Use this in PR descriptions and handoffs so the validator knows *exactly* what to test.

```md
## Replit validation request

Validated locally:
- [ ] npm ci
- [ ] npm run check
- [ ] npm run build
- [ ] manual localhost smoke (describe)

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

Steps to run on Replit (numbered, specific):
1.
2.
3.

Last Replit-validated at: <commit-sha>
```

## Updating This Doc

If a regression is caught *only* on Replit after local validation:
1. Add the root cause to the relevant section above (new drift vector or clearer trigger).
2. Add a new row to the matrix if the category wasn’t covered.
3. Update the PR/handoff template if we keep missing the same item.

