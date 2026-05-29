# CI Guest-Lane Automation Harness — Claude Review Response

**Agent:** claude
**Branch:** `codex/ci-automation-harness` (reviewed PR #109 @ `f09c4a5`)
**Date:** 2026-05-29
**Reply to:** `docs/handoffs/2026-05-29-codex-ci-automation-harness-claude-review.md`
**Inline review:** https://github.com/wmishak404/laica/pull/109#pullrequestreview-4392093380

## Summary

Reviewed Codex's first automation/testing slice (PR #109). Verified by real execution on the PR ref (clean `npm ci` in a throwaway worktree): **164/164 unit tests pass, `npm run check` clean**. Privacy posture is good by construction and the in-memory HTTP harness is faithful for route-contract tests. One must-fix silently disables the entire E2E lane; two should-fix items warrant a decision before merge. The rest is polish or future slices.

## Findings (severity-ordered)

### Must-fix
- **M1 — `e2e_guest_smoke` never runs.** `ci.yml` gates the job `if:` on `secrets.*` (lines 44–49). The `secrets` context is **not available in a job-level `if:`** — it resolves to empty, so each `secrets.X != ''` is `'' != ''` → false → the whole `&&` chain is false → job always skipped. The guest-lane E2E (the centerpiece of this PR) is a no-op on every run. Fix: gate only on `vars.*` / `github.*` (`vars.NEON_PROJECT_ID != ''` + fork check already work), and verify required secrets *inside steps* (map to `env:`, fail loud) or via a preflight job output. Ref: actions/runner#520.

### Should-fix (decide before merge)
- **S1 — no `db:push` before `db:health`.** The schema-only Neon branch inherits the *parent* project's schema; nothing applies this PR's `shared/schema.ts`. `db:health` therefore validates the parent, not the schema under test — a schema-changing PR either passes here while the dev server 500s in E2E, or blocks until the parent is migrated out-of-band. Add `npm run db:push` (non-interactive) against `${{ steps.neon.outputs.db_url }}` before `db:health`.
- **S2 — Node parity.** CI pins `22.12.0`; AGENTS.md/CLAUDE.md state Node 20 (Replit). Running CI on a different major than the deploy target undercuts EFF-017's parity goal. Align to one source of truth.

### Nice-to-have / future
- **`ELEVENLABS_API_KEY` is required, not over-constrained** (answers the PR's open question): `server/elevenlabs.ts:3-4` throws at module load and `server/routes.ts:7` imports it eagerly → `npm run dev` can't boot without it, so the E2E gate/env is correct. The `unit` job rightly omits it (each route test `vi.mock`s `server/elevenlabs`). To decouple later, make `elevenlabs.ts` lazy (throw on first use).
- **`http-test-client.ts`** — sound approach (real `connection` + raw HTTP/1.1 through Node's parser; verified by 164 green tests). Latent edge cases, dormant today: `decodeChunkedBody` slices a JS string by a *byte* length from the chunk header (corrupts multibyte chunked bodies); `parseHeaders` comma-joins duplicate headers (wrong for `Set-Cookie`). Correctness relies on `NODE_ENV=test` disabling the socket-bound global limiter (vitest sets it by default).
- **`db-schema-health.ts`** — requirement names verified against `shared/schema.ts` (incl. `cooking_sessions.recipe_snapshot`). Existence-only (no type/nullability). Curated allowlist is fine for a tripwire but can itself drift from schema.
- **E2E selectors** — all verified against `client/src/components/cooking/user-profiling.tsx` at the PR ref, incl. punctuation-sensitive headings (substring match → trailing `.`/`?` matters), the runtime-composed `Save ingredients` button (`Save {isPantry ? 'ingredients' : ...}`), and `role="radio"` skill options. Low-flake adds: assert both planning buttons after setup; one `/api/auth/session` anonymous-mode check (exercises the server-owned gate).
- **Privacy/secrets** — `pull_request` (not `_target`) + non-fork gate; anonymous auth; disposable schema-only branch; `delete` in `always()`; no secret logging. Verify the Neon `create-branch-action` masks its `db_url` output; no `upload-artifact` step (no leak, but no failure-debug artifacts either).
- **Action versions** — verify `actions/checkout@v6`, `actions/setup-node@v6`, `neondatabase/create-branch-action@v6`, `delete-branch-action@v3` tags resolve and that `create-branch-action` emits `db_url` + `branch_id`.

## Impact on other agents (Codex)
- **Fix M1 before merge** or the E2E lane is inert. Recommended shape: gate `e2e_guest_smoke` on `vars.*` (+ fork check), consume secrets in-step.
- Decide S1/S2.
- **No code changes from me** — review-only. Committed this handoff directly onto `codex/ci-automation-harness` at Wilson's instruction; I reviewed from a separate read-only worktree on the PR ref, so your Codex worktree's working state is untouched. Pull before your next push to avoid a non-fast-forward.

## Open items
- M1 must-fix (Codex). S1/S2 decisions (Wilson/Codex). Verify Neon `db_url` masking + action tags/outputs (Codex).

## Verification
- Clean `npm ci` in a throwaway worktree on `f09c4a5`; `NODE_ENV=test npx vitest run` → 27 files / 164 tests pass.
- `npm run check` (tsc + eslint) → clean.
- Selector/heading/role strings grepped against `user-profiling.tsx`; `shared/schema.ts` `pgTable` names cross-checked vs `db-schema-health` REQUIREMENTS; elevenlabs eager-import startup path confirmed.
- M1's `secrets`-in-`if` limitation confirmed against GitHub docs / actions/runner#520.

## EPIC / Effort interaction
- **EPIC-005** (testing strategy & acceptance criteria) — triggers hit: "deciding what verification is enough before merge", "adding test scripts to `package.json`", "Playwright/Vitest coverage intended to become standard". Interaction: **adds new signal** — the PR wires the standard `test`/`test:unit`/`test:e2e` scripts EPIC-005 flagged as missing and a first stable smoke (progress toward resolution criterion #5). **Conforms** to EPIC-005's stance that automation supplements, not replaces, the Replit gate. Caveat: M1 means CI does not yet deliver the evidence it claims — EPIC-005 should not treat CI as a trusted gate until M1 is fixed and a green E2E run is observed.
- **EFF-010 / EFF-017** — conforms: schema-parity-not-data-parity and "CI does not replace Replit" preserved; S1 strengthens EFF-010's drift-catching intent.
