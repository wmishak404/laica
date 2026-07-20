# Dotenvx v2.15.1 upgrade

**Agent:** codex
**Branch:** codex/deps-dotenvx-2-14
**Date:** 2026-07-20
**Initiative:** none
**INIT updated:** n/a
**Resolves blocked handoff:** none

## Summary

This focused dependency branch replaces the behind Dependabot PR #254 and newer overlapping PR #313 with the coordinated dotenvx upgrade of the repo-pinned local CLI from `1.73.1` to `2.15.1`. The replacement keeps the accepted lockfile-installed local secret workflow intact, verifies the v2 CLI against both synthetic data and the repository's encrypted environment without printing secret values, and leaves Replit's separate workflow command unchanged.

The official dotenvx changelog listed `2.14.0` as current when this branch was created on 2026-07-20, then published `2.15.0` and `2.15.1` later the same day. Version `2.15.0` adds optional 1Password `op://` secret support and `2.15.1` improves the elapsed-time message while waiting on 1Password. LAICA has no `op://` references and continues to use local encrypted `.env` files, so the release notes identify no compatibility concern for the repository's `run`, `encrypt`, or `decrypt` boundaries; the functional checks below cover those boundaries directly. PR #254 had advanced only to `2.12.0` and was behind `main`, while PR #313 overlaps this same dependency at `2.15.1`. PR #308 supersedes both without closing them; the coordinating task owns that closeout after exact-head gates pass.

## Changes

- `package.json` pins `@dotenvx/dotenvx` to exact version `2.15.1`.
- `package-lock.json` records dotenvx v2's smaller dependency graph, including `@dotenvx/primitives` and `@dotenvx/tooling`.
- `.replit` is intentionally unchanged. Its existing unpinned `npx --yes @dotenvx/dotenvx` development workflow remains a separate EFF-017 environment-parity question and is not silently changed by this dependency update.

## Effort interaction

- **EFF-017:** conforms to the existing decision that local secret-backed commands use the repo-pinned `npm run env:*` scripts. This slice changes the pinned CLI implementation but does not change environment authority, Replit secret precedence, CI secret isolation, DB setup, or EFF-017 status.
- **EFF-023:** conforms to the focused-major-upgrade strategy instead of merging a broad dependency bundle. This one-package slice has its own compatibility review and validation; EFF-023 remains deferred and its status does not change.
- No INIT owns this dependency-only maintenance slice, so no INIT was updated.

## Impact on other agents

Continue to run local secret-backed commands through `npm run env:run -- ...` after `npm ci`. Do not use ad hoc `npx @dotenvx/dotenvx` while decrypted secrets are in scope. Dotenvx v2.15.1 sends its informational injection message to stderr, but the repository does not parse or pipe that message as command data.

## Open items

- PR #308 must be marked ready and receive the required exact-head GitHub `unit`, `e2e_guest_smoke`, dependency-audit, secret-scan, and CodeQL evidence before merge readiness can be claimed.
- After exact-head gates pass, the coordinating task should close Dependabot PRs #254 and #313 as superseded.
- Human Replit validation is deferred to release/batch validation. This branch changes a local dev dependency and lockfile only; it does not change `.replit`, deployment build/run commands, application code, schema, auth, persistence, provider behavior, or UI. If the Replit dotenvx command is changed later, that separate branch must select and document its own Replit validation lane.

## Verification

### Value claim

The repository's pinned local secrets runner installs reproducibly at dotenvx `2.15.1` and continues to support the three used CLI boundaries: runtime injection, encryption, and decryption.

### Evidence

- Base provenance: rebased onto fresh `origin/main` at `5b303d32e69a12caea0c12713843962277a38f26` after PRs #306, #307, #309, and #310 merged.
- The rebase preserved the dependency patch updates from PR #309 and the removal of unused `react-resizable-panels` from PR #310; the resulting `origin/main...HEAD` package diff remains limited to dotenvx `2.15.1` and its lock graph.
- `npm ci` passed, installing 1,053 packages and reporting 0 vulnerabilities.
- `npm run check` passed TypeScript and UI lint.
- `npm run build` passed the Vite client and esbuild server builds; existing Browserslist, Firebase chunking, and large-chunk warnings remained.
- `npm run test:unit` passed 50 files / 389 tests.
- `npm audit --audit-level=high` passed with 0 vulnerabilities using live registry advisory data.
- A synthetic non-secret fixture in `/private/tmp` passed `dotenvx encrypt`, `dotenvx run`, and `dotenvx decrypt`; the recovered value matched the original fixture. The temporary fixture and generated synthetic key were removed afterward.
- `npm run env:run -- node ...` loaded the repository's encrypted environment and printed only `set` / `MISSING` status for four named variables; all four were `set`, and no secret values were printed.
- A bounded `PORT=3000 npm run env:run -- npm run dev` startup served HTTP `200`. The first sandboxed attempt hit the known local `tsx` IPC `EPERM`; the approved outside-sandbox rerun started successfully and was stopped after the HTTP check.
- `git diff --check` passed after the handoff was added.

### Evidence limits

- Local CLI and startup evidence does not prove Replit workflow behavior because `.replit` uses a separate unpinned command and is unchanged here.
- No secret values, decrypted environment contents, live provider payloads, or full process environments were inspected or recorded.
- The local startup check did not exercise authenticated UI flows, database writes, Firebase sign-in, OpenAI routes, ElevenLabs routes, or deployment behavior.
- Exact-head GitHub unit, E2E, audit, secret-scan, and CodeQL evidence is pending after the rebased head is pushed and cannot be claimed from Dependabot PR #254's missing-secret run.

## Stack / base status

- Base refreshed: yes
- Current base: `origin/main` at `5b303d32e69a12caea0c12713843962277a38f26`
- Last Replit-validated at: Human Replit validation deferred to release/batch validation
- Notes: independent focused dependency slice rebased after dependency PRs #306, #307, #309, and #310 merged; it is not stacked on PR #297, PR #305, or another open dependency branch. It incorporates and supersedes overlapping Dependabot PR #313 rather than stacking on it. Wilson authorized the coordinating dependency sequence for merge on 2026-07-20; the coordinating root retains the merge action, and this branch owner must not merge PR #308.
