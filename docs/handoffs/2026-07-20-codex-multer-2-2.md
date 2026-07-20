# Multer 2.2 runtime and declarations replacement

**Agent:** codex
**Branch:** `codex/deps-multer-2-2`
**Date:** 2026-07-20
**Initiative:** none
**INIT updated:** n/a
**Effort:** EFF-023 updated with the runtime/type coupling signal
**Resolves blocked handoff:** none

## Summary

This focused Express-middleware branch replaces Dependabot PR #314's declarations-only update with an explicit `multer@2.2.0` and `@types/multer@2.2.0` pair. It verifies the real authenticated `/api/speech/transcribe` upload path, preserves in-memory parsing followed by the existing randomized exclusive temporary-file provider handoff, and gives the existing 10 MiB file-size limit a stable HTTP 413 JSON response instead of falling into the generic server-error path.

The branch matters beyond package metadata because LAICA uses Multer on a provider-bound route. Keeping runtime and declarations in one reviewed slice makes the dependency intent visible and gives future dependency work an exact behavior boundary to protect.

## Source and compatibility review

- npm registry metadata queried on 2026-07-20 reported `2.2.0` as the stable `latest` tag for both `multer` and `@types/multer`; Multer's separate `next` tag was `3.0.0-alpha.2` and is intentionally out of scope.
- Multer 2.2.0 supports Node `>=10.16.0`, which includes LAICA's declared Node `>=20.19.0 <21 || >=22.12.0` range.
- Dependabot PR #314 was open from current base `b4236b6f88b02c3bc3d2b69191a3a71b48a99675` and changed only `@types/multer` plus its lock entry. The replacement changes both direct ranges so future installs communicate the intended runtime/type floor.
- Before this branch, `package.json` declared `multer@^2.0.2`, while the lockfile already resolved runtime 2.2.0. The replacement therefore does not introduce an unobserved runtime tarball; it aligns the declared range, types, and focused route evidence.
- The locked 2.2.0 runtime dependency graph remains limited to `append-field`, `busboy`, `concat-stream`, and `type-is`. No unrelated lockfile package resolution changed.

## Changes

- `package.json` and `package-lock.json` align `multer` and `@types/multer` on compatible `^2.2.0` ranges and locked 2.2.0 artifacts.
- `server/routes.ts` names the 10 MiB transcription upload boundary, keeps `multer.memoryStorage()`, and maps only Multer's `LIMIT_FILE_SIZE` error to HTTP 413 with `{ "error": "Audio file exceeds the 10 MB upload limit" }`. Other upload errors continue to the existing error chain.
- `tests/unit/provider-boundary-happy-paths.test.ts` now proves the parsed audio reaches the exclusive temp-file write as a `Buffer`, preserves provider arguments, and rejects a 10 MiB-plus-one-byte file without constructing or calling the provider.
- EFF-023 records why runtime middleware and declarations are one upgrade lane. The production validation registry carries the smallest real-provider release check and a regression breadcrumb.

## Impact on other agents

Treat Dependabot PR #314 as superseded only after the replacement PR is fully green. Do not merge #314 separately: it describes the declarations change without the explicit runtime floor or route regression evidence.

The accepted audio MIME list, authenticated/user rate limits, OpenAI request shape, transcription response, and randomized `laica-transcribe-*` cleanup boundary remain authoritative and unchanged. Future transcription work should keep the 413 over-limit response provider-free.

## Verification

### Value claim

LAICA installs the current compatible Multer runtime/type pair reproducibly; accepted multipart audio is parsed into memory and handed to the existing isolated temp-file/provider path, while audio above the configured 10 MiB boundary receives a stable 413 JSON rejection before any provider client or call.

### Evidence collected before publication

- Base provenance: created from fresh `origin/main` at `b4236b6f88b02c3bc3d2b69191a3a71b48a99675` as delegated, then rebased before PR creation onto `04b88c5cd4be383771d690a250cafda5eb031a03` after docs-only PR #319 advanced `main`. Both PR #319's cartographer entry and this branch's Multer entry are preserved in EFF-023.
- Official registry metadata: stable runtime and declarations both `2.2.0`; Multer engine range compatible with LAICA's Node policy.
- `npm ls multer @types/multer --depth=0` reported exactly `multer@2.2.0` and `@types/multer@2.2.0`.
- Focused real-route regression: `npx vitest run tests/unit/provider-boundary-happy-paths.test.ts tests/unit/phase0-security-routes.test.ts` passed 2 files / 28 tests.
- `npm ci` passed, installing 1,053 packages from the exact lockfile.
- A second `npm install --package-lock-only --ignore-scripts` reported the lockfile up to date; the resulting `package-lock.json` diff contains only the two direct range changes and the `@types/multer` 2.2.0 artifact metadata. The runtime artifact was already locked at 2.2.0 on `main`.
- `npm run check` passed TypeScript and UI lint.
- `npm run build` passed the Vite client and esbuild server builds. The existing Browserslist-age, Firebase dynamic/static import, and large-chunk warnings remained.
- `npm run test:unit` passed 50 files / 390 tests.
- `npm audit --audit-level=high` passed the high/critical gate. npm still reports one moderate finding already present in this exact base; advisory specifics remain in private/local tooling rather than public markdown.
- `git diff --check` passed.
- Exact-head GitHub gates are pending below and must be updated in the pull-request evidence before merge readiness is claimed.

### Evidence limits and validation lane

The route tests use real Express, Multer, multipart parsing, in-memory buffer handling, filesystem allocation/write/cleanup, and the server's actual middleware order, but mock Firebase identity and the OpenAI provider client. They do not prove provider credentials, live Replit filesystem behavior, browser recording/compression, or deployed proxy/body-size limits.

Human Replit validation is deferred to release/batch validation. Because this branch changes server upload behavior but has deterministic route-level coverage, the release check is the smallest provider-backed confirmation: one signed-in Live Cooking transcription with the real provider, combined with the existing PR #244 check. Exact-head GitHub unit/E2E/audit/TruffleHog/CodeQL checks remain mandatory before merge review.

## Open items

- Publish the draft replacement PR, record its number, and mark it ready after local evidence is complete.
- Monitor required exact-head GitHub checks and place the exact head SHA/run URLs and negative scope in the PR body.
- Once every required replacement check is green, comment on and close Dependabot PR #314 as superseded. Do not merge this replacement branch; the coordinating parent retains that decision/action.

## Stack / base status

- Base refreshed: yes
- Current base: `origin/main` at `04b88c5cd4be383771d690a250cafda5eb031a03`
- Last Replit-validated at: Human Replit validation deferred to release/batch validation
- Notes: independent focused dependency slice; not stacked on another dependency PR.
