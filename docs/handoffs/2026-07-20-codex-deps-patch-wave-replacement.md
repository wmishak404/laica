# Dependabot npm patch wave replacement

**Agent:** codex
**Branch:** `codex/deps-patch-wave-2026-07-20`
**Date:** 2026-07-20
**Initiative:** none
**INIT updated:** n/a
**Resolves blocked handoff:** none

## Summary

This branch carries Dependabot PR #318's current patch wave onto a same-repository branch based on fresh `origin/main` after audit-remediation PR #322 and docs-only PR #319 merged. It preserves the exact `package.json` and `package-lock.json` results from current Dependabot head `95ba89070a172d7a09bf5ab0bfe2c2c71b466fa8`, which rebased onto PR #322's corrected base while this replacement was being validated. The replacement exists so LAICA's protected exact-head E2E and CodeQL lanes can run in the repository trust boundary; it does not broaden #318's declared dependency scope.

## Changes

- `package.json` and `package-lock.json`
  - Update the next Radix UI patch family from PR #318, including the aligned lockfile-only `@radix-ui/react-collapsible` and `@radix-ui/react-dialog` resolutions.
  - Update `@types/node` within the Node 20 declaration line from `20.19.39` to `20.19.43`.
  - Update PostCSS from `8.5.19` to `8.5.20`, including its aligned Nano ID lockfile resolution.
  - Retain the already-merged PR #322 lock-only remediation while regenerating the #318 lockfile result from corrected `origin/main`.
- `docs/handoffs/2026-07-20-codex-deps-patch-wave-replacement.md`
  - Record source provenance, validation, risk routing, negative scope, and the replacement relationship to PR #318.

## Effort interaction and risk

- **EFF-023:** conforms to the accepted routine patch grouping. The scope is explicit: Radix UI primitives, Node 20 declarations, and PostCSS plus their aligned lockfile resolutions. It does not start the deferred broad provider, database, UI-foundation, or toolchain modernization work, and EFF-023's status is unchanged.
- **EFF-017:** Dependabot cannot supply the protected secret set required by `e2e_guest_smoke`, and its CodeQL introduced-alert comparison is neutral rather than evidence. This same-repository replacement must receive the full exact-head GitHub unit, E2E, dependency-audit, TruffleHog, and CodeQL gates before merge readiness can be claimed.
- **INIT:** no initiative phase, product direction, asset, status, or resume point changes, so no INIT was updated.

## Exact negative scope

- Does not include PR #314's `@types/multer` minor update.
- Does not include PR #315's `express-rate-limit` minor update.
- Does not include PR #316's Replit Cartographer plugin minor update.
- Does not include PR #317's Radix context-menu minor update.
- Does not include PR #311's `actions/setup-node` major workflow update or any other minor/major package change.
- Does not modify application code, UI wrappers, runtime configuration, `.replit`, GitHub workflows, schema, auth, persistence, provider behavior, prompts, navigation, or deployment configuration.
- Does not grant Dependabot access to repository secrets or weaken the required exact-head E2E gate.

## Impact on other agents

PR #318 must remain open until this replacement is ready and all required exact-head checks are green. Once that condition is met, close PR #318 as superseded by the replacement; do not merge both. If `origin/main` or the bot head changes before publication, refresh the provenance deliberately and re-establish exact package scope rather than silently combining another dependency lane.

Wilson authorized tackling this fresh dependency batch on 2026-07-20. That authorization does not authorize this branch owner to merge the replacement PR.

## Open items

- Force-with-lease the refreshed same-repository branch, mark PR #321 ready, and collect fresh exact-head unit, E2E, dependency-audit, TruffleHog, and CodeQL evidence.
- Exact-head evidence at `fe768cf8d0c129f6b09cea60ccd1999902cfef1b` is stale after the #322 refresh. Its unit, guest E2E, TruffleHog, and CodeQL jobs passed, while its audit job exposed the inherited base blocker that PR #322 subsequently corrected.
- Exact-head evidence at `68613ea930337193018b5437c1ccd7d1c6213c0b` is also stale after docs-only PR #319 advanced main. Its unit, guest E2E, dependency-audit, TruffleHog, and CodeQL gates all passed; the successful E2E attempt followed two environment-provisioning collisions with another concurrent repository E2E run and required no code change.
- Exact-head evidence at `aeeccd6aa0f1b636187873b2aa6245dbc736937b` passed unit, guest E2E, dependency-audit, TruffleHog, and both CodeQL analyses on current main. It became stale only because the final closure audit found that Dependabot had rebased #318; the bot's package files remained byte-identical, but the durable provenance correction requires one final exact-head run.
- Close PR #318 only after the replacement is green.

## Verification

### Value claim

The current #318 patch wave is preserved without dependency-scope expansion on a same-repository branch capable of producing the protected exact-head CI evidence unavailable to Dependabot.

### Provenance

- Base: `origin/main@04b88c5cd4be383771d690a250cafda5eb031a03` (docs-only PR #319, descending from audit-remediation PR #322 at `b4236b6f88b02c3bc3d2b69191a3a71b48a99675`).
- Current Dependabot source: PR #318 head `95ba89070a172d7a09bf5ab0bfe2c2c71b466fa8`, based on PR #322's merge `b4236b6f88b02c3bc3d2b69191a3a71b48a99675`.
- Current `package.json` blob: `37e90dd0cb45672681f97d7a27330148af295c1e`.
- Current `package-lock.json` blob: `cc27a8f1fe4a11c86c8763ca51f9b0a04482c4d3`.
- The current bot diff changes only `package.json` and `package-lock.json`, and both files are byte-identical to this replacement.
- Historical provenance: the earlier bot head `ad9e79b0dcbc9db872164ccad9dcd064c4c12828` was based on pre-remediation main `4775ce5fc8c0a4bd6dd5148c8e329eb5f0211038` and had lockfile blob `93d0c9c32485d9ecf3466e848c8541c30ca6460f`. Its rebase absorbed exactly the four lockfile entries already merged through PR #322 (12 insertions and 12 deletions) without changing #318's declared manifest scope.
- `npm install --package-lock-only --ignore-scripts` produced no further changes from the current bot result.

### Local observed results

Local runtime: Node `v24.14.1`, npm `11.11.0`.

- `npm ci` — completed successfully; installed 1,053 packages.
- `npm run check` — passed TypeScript and UI lint.
- `npm run build` — passed the Vite client and esbuild server builds; existing Browserslist-age, Firebase mixed-import, and large-chunk warnings remain.
- `npm run test:unit` — passed: 50 files, 389 tests.
- `npm run test:coverage` — passed: 50 files, 389 tests; 53.94% line coverage. Coverage remains informational.
- `npm audit --audit-level=high` — passed; the remaining moderate finding is below this repository's high/critical gate, and exact advisory details remain in security tooling rather than public markdown.
- `git diff --check origin/main...HEAD` — passed.
- Package-file hashes remained identical to the recorded corrected-base blobs after lock regeneration, install, build, and tests.

### Evidence limits and Replit lane

- Local automation does not substitute for the required exact-head GitHub E2E gate.
- No local browser/mobile visual, live OpenAI, ElevenLabs, Firebase/Google sign-in, DB-backed manual, Replit, or production-deployment behavior was exercised.
- Human Replit validation is deferred to release/batch validation because this patch-only maintenance does not change schema, secrets, auth contracts, provider code, runtime startup, or deployment configuration. A fresh runtime or exact-head CI risk signal would reopen that lane.

## Stack / base status

- Base refreshed: yes
- Current base: `origin/main` at `04b88c5cd4be383771d690a250cafda5eb031a03`
- Last Replit-validated at: human Replit validation deferred to release/batch validation
- Notes: refreshed after PR #319 merged on top of PR #322. The docs-only #319 base change does not affect the package result; this branch preserves PR #308's dotenvx `2.15.1` result and PR #322's lock-only audit remediation without stacking on or absorbing PRs #314-#317.
