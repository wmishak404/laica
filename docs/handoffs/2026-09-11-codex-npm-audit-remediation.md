# Current npm audit gate remediation

**Agent:** codex
**Branch:** `codex/npm-audit-2026-09-11`
**Date:** 2026-09-11
**Initiative:** none
**INIT updated:** n/a
**Resolves blocked handoff:** none

## Summary

The repository-wide dependency audit blocked docs-only PR #363 after registry metadata identified new high-severity findings in the package graph inherited from `main`. This independent branch applies npm's compatible lockfile-only remediation while leaving direct dependency declarations, application code, INIT-005 product decisions, and broad dependency modernization unchanged.

This matters to coordination because the security branch must merge first. PR #363 can then refresh from remediated `main` and produce authoritative exact-head evidence for the agentic cooking actions plan.

## Changes

- `package-lock.json` updates compatible runtime and development resolutions through `npm audit fix --package-lock-only`; `package.json` is unchanged.
- `efforts/effort-017-environment-parity-and-ci-confidence.md` records that the time-based repository audit detected a finding independent of the docs PR that surfaced it.
- `efforts/effort-023-broad-dependency-modernization-strategy.md` records the concrete security trigger while keeping broad modernization deferred.
- `docs/production-validation-registry.md` adds one bounded future upload/transcription check because a runtime middleware resolution changes even though its route contract and application code do not.
- This handoff records evidence, negative scope, and the PR #363 unblock sequence.

No client, server, shared schema, test, workflow, secret, Replit, deployment, or product-behavior file changed. Exact advisory identities, dependency paths, and reproduction detail remain in GitHub security tooling and private scan output rather than public repository prose.

## Impact on other agents

- Do not copy this lockfile change into PR #363. After this remediation merges, refresh PR #363 from fresh `origin/main` and rerun all of its exact-head checks.
- The remediation clears only the shared dependency gate. It does not review, alter, or validate the INIT-005 agentic cooking actions plan.
- Branches that carry `package-lock.json` should refresh from remediated `main` instead of independently recreating the resolution changes.
- EFF-017 remains `In Progress`; EFF-023 remains `Deferred`. No INIT state changes on this branch.

## Open items

- Push this branch and open a separate dependency/security PR.
- Require exact-head GitHub CI/E2E, dependency audit, secret scan, and CodeQL evidence before merge.
- Dependency/security changes require Wilson's explicit merge instruction; this branch is not eligible for Codex auto-merge.
- After the dependency PR merges, rebase PR #363 onto fresh `origin/main`, rerun its exact-head gates, and update its readiness evidence before considering the docs PR merge-ready.

Human Replit validation is deferred from the dependency PR because the change is lockfile-only, application contracts are unchanged, and deterministic route/middleware coverage plus exact-head automation provide the pre-merge evidence. The production validation registry retains one focused audio-question check for the next selected release. Replit Agent was not used.

## Verification

Source provenance:

- Base: `origin/main@636344b49f6bc966fd027c58950f9db166c2e6b5`.
- Trigger: PR #363's shared dependency-audit job reported high-severity findings on the unchanged package graph; specifics remain in the run and security tooling.
- Lockfile generation and local validation runtime: Node `24.14.1`, npm `11.11.0`.

Observed local evidence:

- `npm audit fix --package-lock-only`: completed and changed only `package-lock.json` before the documentation/evidence updates were added.
- `npm ci`: passed and installed the remediated graph deterministically.
- `npm audit --audit-level=high`: passed the repository's enforced high/critical threshold.
- `npm audit --omit=dev --audit-level=high`: passed the production-graph high/critical threshold.
- `npm run check`: passed TypeScript and UI lint.
- `npm run build`: passed the Vite client and esbuild server builds; existing Firebase mixed-import and large-chunk warnings remain.
- `npm run test:unit`: passed 53 files / 411 tests.
- `npx vitest run tests/unit/phase0-security-routes.test.ts tests/unit/provider-boundary-happy-paths.test.ts`: passed 2 files / 27 tests, including normal multipart transcription, missing/unsupported upload rejection, provider-key/error handling, error redaction, and user-limiter behavior.
- `git diff --check`: passed before commit.

Evidence reasoning and limits:

- Clean installation, both enforced-threshold audits, compile, build, full unit, and focused multipart/provider-boundary tests show that the lockfile resolves deterministically and preserves the local contracts exercised around the affected runtime and development paths.
- Exact-head GitHub schema-backed guest + linked E2E, audit, secret scan, CodeQL, and CI-runner behavior remain pending until the branch is pushed.
- No claim is made about unrelated future registry findings, production provider availability, malformed live traffic, Replit deployment behavior, or the product content of PR #363.

## Post-merge update

PR #364 merged as `008d2e32bd9ae8fb4feac05bc65ec22f40c0b3f4` from exact validated head `9923564dde4f9f2a009d87db321a802ead5d8a17`. Required GitHub checks passed, including schema-backed guest + linked E2E and disposable Neon cleanup. The remaining PR #363 refresh sequence is recorded in [`2026-09-11-codex-npm-audit-remediation-closeout.md`](2026-09-11-codex-npm-audit-remediation-closeout.md).
