# Local Diagnostics Sandbox

Use this workflow when a local browser review or local Playwright run needs real auth/session behavior without mutating the decrypted `.env` database.

For the broader environment inventory and when this sandbox is worth using versus CI/Replit, see [environment-map.md](environment-map.md).

## Why this exists

The regular local `.env` database can drift behind `main`. When that happens, the app may fail before the feature under review loads, such as `/api/auth/session` failing because `anonymous_recipe_usage` is missing. That is environment drift, not proof that the product branch is broken.

GitHub Actions avoids this by creating a schema-only Neon branch, pushing the current Drizzle schema, running `db:health`, running Playwright, and deleting the branch. Local diagnostics should mirror that shape when they need service-backed confidence.

## Required sandbox

Use a disposable/non-production database or Neon branch. Do not point this workflow at Replit, production, or the default decrypted `.env` database.

Required env:

- `LAICA_LOCAL_SANDBOX_DATABASE_URL` — the disposable database URL to prepare and use.
- `LAICA_LOCAL_SANDBOX_CONFIRM_SCHEMA_PUSH=true` — explicit acknowledgement that this workflow will run `drizzle-kit push --force` against the sandbox URL.

The helper refuses to run when `LAICA_LOCAL_SANDBOX_DATABASE_URL` equals `DATABASE_URL`.

## Visual review

```bash
ln -sf /Users/wilsonishak-macbookpro/src/laica/.env.keys .env.keys
LAICA_LOCAL_SANDBOX_DATABASE_URL='postgresql://...' \
LAICA_LOCAL_SANDBOX_CONFIRM_SCHEMA_PUSH=true \
PORT=3000 \
npm run env:run -- npm run dev:sandbox
```

Then open `http://127.0.0.1:3000`.

What the helper does:

1. Overrides `DATABASE_URL` only for the child process.
2. Runs `npm run db:push -- --force` against the sandbox.
3. Runs `npm run db:health` against the sandbox.
4. Starts `npm run dev` with the sandbox `DATABASE_URL`.

## Local Playwright

```bash
ln -sf /Users/wilsonishak-macbookpro/src/laica/.env.keys .env.keys
LAICA_LOCAL_SANDBOX_DATABASE_URL='postgresql://...' \
LAICA_LOCAL_SANDBOX_CONFIRM_SCHEMA_PUSH=true \
PORT=3000 \
PLAYWRIGHT_BASE_URL=http://127.0.0.1:3000 \
npm run env:run -- npm run test:e2e:sandbox
```

This is still local diagnostic evidence unless the sandbox is equivalent to the accepted non-production CI lane and the result is recorded with exact command provenance.

## Prepare only

```bash
LAICA_LOCAL_SANDBOX_DATABASE_URL='postgresql://...' \
LAICA_LOCAL_SANDBOX_CONFIRM_SCHEMA_PUSH=true \
npm run env:run -- npm run db:sandbox:prepare
```

Use this when you only want to schema-push and health-check the sandbox before starting a server manually.

## Safety notes

- Never commit sandbox URLs or copied secrets.
- Use `npm run env:run -- ...` after `npm ci`; do not let ad hoc `npx @dotenvx/dotenvx` fetch code while decrypted secrets are in scope.
- Prefer short-lived Neon branches for feature reviews.
- Delete disposable branches/databases after the diagnostic session when your provider does not do that automatically.
- Do not treat this as permission to run `db:push` against arbitrary shared databases; EFF-010 still owns the broader local database strategy.
