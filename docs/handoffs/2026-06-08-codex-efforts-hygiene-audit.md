# 2026-06-08 Codex Efforts Hygiene Audit

## Summary

Weekly Efforts hygiene ran from fresh `origin/main` at `ba924d6`. The Effort source-of-truth files were already mostly current after the heavy EFF-017 and INIT-003 activity from 2026-06-01 through 2026-06-06: EFF-024 is resolved, EFF-017 is active again, and no active Effort meets its resolution or migration criteria. The only stale state found was in the first-contact agent mirrors: `AGENTS.md` and `CLAUDE.md` still listed resolved EFF-024 and omitted active EFF-017.

## Branch

- Branch: `codex/efforts-hygiene-2026-06-08`
- Base: `origin/main` at `ba924d6ad0f7ef0906d967a25ecb95fd7319da88`
- Runtime code changed: no

## Audit Inputs

- `efforts/README.md`
- `efforts/registry.md`
- Active Efforts: EFF-010, EFF-017, EFF-022, EFF-025
- Resolved cross-check: EFF-024
- Active INITs: INIT-001, INIT-002, INIT-003
- `initiatives/registry.md`
- `product-decisions/README.md`
- `product-decisions/pd-007-effort-status-and-registry-workflow.md`
- `docs/workflows/effort-system-audit.md`
- `docs/workflows/documentation-routing.md`
- `docs/workflows/testing-and-acceptance.md`
- `AGENTS.md` and `CLAUDE.md`
- Recent `origin/main` history since the previous automation run

## Decisions

| Effort | Decision | Rationale |
|---|---|---|
| EFF-010 | Keep active standalone | `npm run db:health` and CI Neon schema-only branches are useful shipped progress, but the local DB ownership model, safe `db:push` boundary, worktree `DATABASE_URL` policy, `.env.keys` provisioning, and local service-backed validation workflow remain unresolved. |
| EFF-017 | Keep active standalone, `In Progress` | PRs #109, #118, #119, #120, #123, #125, #130, #132, #135, #138, and #144 added major CI/auth/browser-smoke confidence. The Effort file already records the remaining policy/config lanes: CI-primary authority, OAuth preflight configuration/run, live-provider canary scope, coverage thresholds, production OAuth proof, and provider/eval coverage. |
| EFF-022 | Keep active standalone | No merged prompt/eval work has audited cuisine picker payloads or added cross-cuisine fixture/eval coverage. INIT-003 still points to EFF-022 as the durable home for cuisine-fit prompt work. |
| EFF-025 | Keep active standalone | No merged Settings dirty-state reminder work was found. The issue spans guest and linked Settings Pantry/Kitchen behavior and is not naturally owned by a single unclosed INIT phase today. |
| EFF-024 | Keep resolved history | PR #126 resolved the guest privacy/trust copy slice. `efforts/README.md`, `efforts/registry.md`, INIT-003, and the Effort file already record that outcome. The stale active references were only in `AGENTS.md` and `CLAUDE.md`. |

## Changes

- Updated `AGENTS.md` active Effort mirror to add EFF-017 and remove resolved EFF-024.
- Updated `CLAUDE.md` active Effort mirror to add EFF-017 and remove resolved EFF-024.
- Added this handoff.

## Verification

- `git diff --check`
- `git diff --cached --check`

## Claude Review Request

Please review the taxonomy decision, especially the conservative call to keep EFF-017 as one active standalone Effort rather than splitting it into separate OAuth/canary/coverage-policy Efforts. Current rationale: EFF-017 already has the accepted remaining-lane table from 2026-06-05, and splitting would create more status surfaces before Wilson accepts the policy/config decisions.

## Remaining Active Efforts

- EFF-010 — Local database schema strategy
- EFF-017 — Environment parity + CI confidence
- EFF-022 — Cross-cuisine recommendation prompts
- EFF-025 — Settings unsaved inventory reminder
