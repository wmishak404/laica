# Environment Map

Use this as the quick human-review map for LAICA environments: what each environment proves, which database it uses, which auth path it exercises, and when it is worth paying the setup/cost/bandwidth overhead.

This is not a replacement for [testing-and-acceptance.md](testing-and-acceptance.md), [environment-parity-spec.md](environment-parity-spec.md), or [EFF-010](../../efforts/effort-010-local-db-schema-strategy.md). It is the short lookup table for targeted environment questions.

## Summary Table

| Environment | Primary use | Database | Auth path | Good evidence for | Not good evidence for |
|---|---|---|---|---|---|
| Local static/unit loop | Fast implementation confidence | Usually none; unit tests mock or isolate dependencies | Mocked Firebase/auth hooks or mocked route auth | TypeScript, lint, build, component logic, route contracts under mocks | Real browser auth, real DB schema, Replit/domain behavior |
| Local browser with default `.env` | Quick visual/debug workbench | Remote Neon URL decrypted from local `.env`; may drift behind `main` | Real Firebase client -> backend `/api/auth/session` -> Firebase Admin | Layout, copy, interaction feel when `db:health` passes | Merge-gate E2E when DB is stale; guest quota/auth confidence when schema drifts |
| Local diagnostics sandbox | Optional local browser/Playwright with clean schema | Disposable/non-production Neon/Postgres URL from `LAICA_LOCAL_SANDBOX_DATABASE_URL` | Same local Firebase/dotenvx auth config; child process overrides only `DATABASE_URL` | Interactive local debugging that needs real auth/session and current schema | Routine merge evidence unless provenance matches accepted non-production E2E requirements |
| GitHub CI unit job | Required PR baseline | None for most checks; mocked or isolated test state | Mocked/unit-level | Typecheck, lint, build, full unit suite, coverage measurement | Real Firebase popup, live DB/browser, Replit secrets/deployment |
| GitHub CI `e2e_guest_smoke` | Preferred routine merge-gate E2E | Disposable schema-only Neon branch; CI pushes schema, runs `db:health`, then deletes branch | CI Firebase test project; real anonymous auth plus guarded linked dev-auth users | Guest smoke, linked dev-auth smoke, DB schema/current-app browser contract on exact PR head | Real Google popup completion, production OAuth domain, live OpenAI/ElevenLabs quality, Replit deploy behavior |
| Replit workspace/preview | Primary runtime/secrets/deployment environment; risk-triggered or batched validation | Replit-provisioned app database via Replit env/secrets | Real Firebase anonymous/Google on Replit domain/config | Environment seams: secrets, Firebase authorized domains, deployed runtime behavior, human visual judgement | Cheap every-PR smoke; local implementation speed |
| Production/deployed Replit | Release confidence after publish | Production deployment database | Real production Firebase/provider config on public domain | Post-publish smoke and user-facing release verification | Branch debugging or experimental schema work |

## Cost and Bandwidth Guidance

- Prefer **local static/unit** for the inner development loop because it has the lowest cost and no remote service setup.
- Prefer **GitHub CI `e2e_guest_smoke`** for routine DB-backed browser confidence because it already creates and deletes the prepared Neon branch once per pushed review head.
- Avoid spinning up **local diagnostics sandbox** by default. It is useful when a human needs interactive local browser review or an agent needs to debug a browser/auth issue before pushing, but it duplicates the remote DB/schema work CI already does.
- Do not mutate the default decrypted `.env` database to save time. If it is stale, classify that as local environment drift and use CI or a disposable sandbox instead.
- Replit and production checks should stay targeted. Use them when the risk lane needs real domain/secrets/provider/deployment proof, not as a reflex after every small UI copy change.

## Environment Details

### Local static/unit loop

- **Commands:** `npm run check`, `npm run build`, `npm run test:unit`, or targeted `npx vitest run ...`.
- **Database:** none for most checks; tests mock or isolate storage/auth/provider seams.
- **Auth path:** mocked Firebase/auth hooks, mocked route auth, or synthetic unit fixtures.
- **Use when:** implementing UI logic, schema-safe TypeScript changes, copy updates, route-contract behavior under mocks, parser/normalizer logic.
- **Caution:** passing unit tests does not prove local browser auth or database schema health.

### Local browser with default `.env`

- **Command:** `PORT=3000 npx @dotenvx/dotenvx run -- npm run dev`.
- **Database:** the `DATABASE_URL` decrypted from committed `.env` using local `.env.keys`.
- **Auth path:** real browser Firebase client credentials from dotenvx, backend Firebase Admin verification, and real `/api/auth/session`.
- **Use when:** quick visual review or debugging after `npm run db:health` passes.
- **Caution:** if `db:health` fails, the browser may fail before the feature under review loads. Do not treat that as a product regression.

### Local diagnostics sandbox

- **Command:** `npx @dotenvx/dotenvx run -- npm run dev:sandbox` with `LAICA_LOCAL_SANDBOX_DATABASE_URL` and `LAICA_LOCAL_SANDBOX_CONFIRM_SCHEMA_PUSH=true`.
- **Database:** disposable/non-production DB URL only; helper refuses to run when the sandbox URL equals the default `DATABASE_URL`.
- **Auth path:** same local Firebase/dotenvx auth config as local browser, with only the child-process `DATABASE_URL` overridden.
- **Use when:** interactive local browser review needs real auth/session and the default `.env` DB is stale.
- **Caution:** this still consumes remote DB resources and should not replace CI for routine E2E confidence.

### GitHub CI unit job

- **Workflow:** `.github/workflows/ci.yml`, job `unit`.
- **Database:** no prepared service DB.
- **Auth path:** mocked/unit-level paths.
- **Use when:** every reviewable PR; establishes compile/build/unit baseline.
- **Caution:** it is necessary but not enough for runtime/user-flow PRs.

### GitHub CI `e2e_guest_smoke`

- **Workflow:** `.github/workflows/ci.yml`, job `e2e_guest_smoke`.
- **Database:** schema-only Neon branch created by CI, current Drizzle schema pushed with `drizzle-kit push --force`, `db:health` checked, branch deleted in cleanup.
- **Auth path:** CI Firebase test project for anonymous auth plus guarded linked dev-auth users.
- **Use when:** routine merge-gate E2E for runtime/product/client/server/schema/auth/persistence/user-flow PRs.
- **Caution:** this is provider-light by design. It does not prove live Google popup completion, production OAuth, live AI quality, audio quality, or Replit deployment behavior.

### Replit workspace/preview

- **Database:** Replit-provisioned app database through Replit env/secrets.
- **Auth path:** real Firebase on Replit domain/config.
- **Use when:** risk lane needs real runtime proof, environment seams, secrets, provider availability, or human visual judgement.
- **Caution:** Replit Agent can spend credits; prefer direct shell/UI/GitHub automation before asking for Agent help.

### Production/deployed Replit

- **Database:** production deployment database.
- **Auth path:** real public-domain Firebase/provider config.
- **Use when:** post-publish smoke and release confidence.
- **Caution:** never use production as a branch debugging sandbox.

## Decision Rule

When choosing an environment, ask:

1. **What claim are we trying to prove?** UI copy, component state, DB-backed guest flow, real provider/domain behavior, or production release health?
2. **Does the environment exercise that claim directly?** If auth/database/provider behavior matters, mocks are not enough.
3. **Is the environment already prepared?** A stale DB, missing secret, skipped CI job, or wrong Firebase project is a blocker, not evidence.
4. **Is another environment already proving the same thing cheaper?** Prefer CI for prepared DB-backed E2E before duplicating the work locally.
