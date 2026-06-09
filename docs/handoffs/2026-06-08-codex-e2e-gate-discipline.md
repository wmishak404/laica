# 2026-06-08 — Automated E2E gate discipline

## Summary

Wilson set the standing rule that every pushed implementation build should run the full automated E2E gate automatically, separate from any Replit smoke. This handoff records the workflow update and the current PR #149 gate status after attempting the E2E run locally.

## Branch / PR

- Branch: `codex/deferred-stale-prep-plan-effort`
- PR: #149, stale prep plan invalidation
- Head tested before this docs update: `faa2531148c2`

## Workflow update

- Updated `docs/workflows/testing-and-acceptance.md` to require an automated E2E gate for every pushed implementation head intended for review or merge.
- Updated `AGENTS.md` with the same short rule so new agent sessions see it immediately.
- Clarified that Replit smoke/manual validation is complementary deployment evidence and cannot substitute for missing/skipped/failed automated E2E.
- Documented a dotenvx local E2E command that avoids macOS port `5000` collisions:

```bash
PORT=3000 PLAYWRIGHT_BASE_URL=http://127.0.0.1:3000 npx @dotenvx/dotenvx run -- npm run db:health
PORT=3000 PLAYWRIGHT_BASE_URL=http://127.0.0.1:3000 npx @dotenvx/dotenvx run -- npm run test:e2e
```

## E2E evidence captured

Attempt 1:

- Command: `npx @dotenvx/dotenvx run -- npm run test:e2e`
- Environment: local macOS worktree, sandboxed network
- Result: did not reach Playwright; `npx` could not resolve `@dotenvx/dotenvx` due sandbox DNS/network.
- Meaning: not app evidence.

Attempt 2:

- Command: `npx @dotenvx/dotenvx run -- npm run test:e2e` with network escalation
- Environment: local macOS worktree, default Playwright base URL `http://localhost:5000`
- Result: 5 failed, 2 skipped. Failure screenshots were blank because port `5000` was already owned by macOS `ControlCenter`, not the Laica dev server.
- Meaning: harness/port collision, not app behavior evidence.

Attempt 3:

- Command: `PORT=3000 PLAYWRIGHT_BASE_URL=http://127.0.0.1:3000 npx @dotenvx/dotenvx run -- npm run test:e2e`
- Environment: local macOS worktree with dotenvx env and `.env.keys` symlinked
- Result: 1 passed, 4 failed, 2 skipped.
- Observed failure: guest E2E tests reached the app but timed out waiting for setup because `/api/auth/session` hit `DrizzleQueryError` / Postgres `42P01`: relation `anonymous_recipe_usage` does not exist.
- Skipped scope: linked dev-auth E2Es skipped because the local dotenvx env did not include the required linked dev-auth variables.
- Meaning: the local service-backed E2E gate failed due local DB/schema/env drift. PR #149 is not merge-ready from automated E2E evidence until rerun successfully in a valid E2E environment, preferably GitHub Actions' disposable Neon branch or a local test DB that passes `db:health`.

## Merge status

- Replit manual validation for the stale prep plan fix passed earlier, including guest, signed-in, mid-prep pantry change, hard refresh, unchanged-profile Live Cooking refresh, and history behavior.
- That Replit evidence still supports the product fix, but it does not satisfy the new automated E2E gate rule.
- Current blocker before merge: automated E2E gate has not passed for the current pushed head.

## Next action

Mark PR #149 ready for review to trigger GitHub Actions, then monitor the `CI (Typecheck, Unit, E2E)` workflow. If the GitHub E2E job runs with its disposable Neon branch and passes for the current head, update the PR/handoff with the passing run evidence before merge. If it skips or fails, treat that as a merge blocker.
