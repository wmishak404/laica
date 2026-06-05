# EFF-017 Deterministic Wrap-up

**Agent:** codex
**Branch:** codex/eff-017-deterministic-wrapup
**Date:** 2026-06-05
**Initiative:** none
**INIT updated:** n/a

## Summary

This branch takes the remaining deterministic EFF-017 backlog items in one PR-sized scoop without expanding routine CI into live providers or full Google popup automation. It adds a linked-user browser smoke on top of the existing dev-auth token lane, introduces the first scoped UI/accessibility guardrail, and turns on non-blocking unit coverage visibility.

The change matters because EFF-017 now has deterministic coverage for the highest-value linked-user browser gap: a real Firebase Web SDK sign-in, protected API profile seed/read, UI planning actions, provider-light recipe request, persisted pantry update, no-duplicate assertion, and reload proof. EFF-017 should still remain `In Progress` after this PR until the separate policy question is settled: Replit remains the primary deployment/runtime validation authority until `AGENTS.md`, ADR-0001, and related testing policy docs deliberately say otherwise.

## Changes

- `.github/workflows/ci.yml`
  Adds a non-blocking `npm run test:coverage` unit-job step with a `coverage/coverage-summary.json` artifact, and extends the existing conditional E2E job to allow `dev-test-linked-browser-ci` plus `VITE_LAICA_DEV_AUTH_BROWSER=true`.
- `client/src/lib/firebase.ts`
  Adds a dev-only custom-token browser helper behind both `import.meta.env.DEV` and `VITE_LAICA_DEV_AUTH_BROWSER=true`. This uses Firebase Web SDK `signInWithCustomToken`; it does not add a production auth bypass.
- `tests/e2e/linked-dev-auth.test.ts`
  Keeps the API-level linked dev-auth smoke and adds a browser smoke that mints a custom token, exchanges it for a Firebase ID token, seeds a linked profile through `/api/user/profile`, signs the browser in, drives Chef It Up, stubs `/api/recipes/pantry`, asserts the captured POST request payload, verifies recipe suggestions render, reads the linked profile back, checks pantry additions are unique, reloads, and verifies the planning count persists.
- `tests/e2e/accessibility-guardrail.test.ts`
  Adds a scoped Playwright/axe guardrail for the landing auth controls: visible accessible names, 44 px tap targets, and no serious/critical WCAG A/AA violations on the landing `main` surface.
- `package.json`, `package-lock.json`, `vitest.config.ts`, `.gitignore`, `.env.example`, `tests/setup.ts`
  Adds `@vitest/coverage-v8`, `@axe-core/playwright`, `npm run test:coverage`, JSON summary coverage reporting, ignored local `coverage/`, the browser dev-auth env flag, and a Firebase auth unit-test mock for `signInWithCustomToken`.
- `efforts/effort-017-environment-parity-and-ci-confidence.md`
  Records the branch signal, local evidence, CI-intended Playwright lane, and remaining negative scope.

## Evidence Report

Claim: this branch adds deterministic linked-user browser coverage while keeping default CI provider-light.

Command/check provenance:
- `npm install --save-dev @vitest/coverage-v8@4.1.8 @axe-core/playwright`
- `npm run check`
- `npm run test:unit`
- `npm run test:coverage`
- `npm run build`
- `npm audit --audit-level=high`
- `git diff --check`
- Attempted targeted Playwright command under dotenvx:
  `LAICA_DEV_AUTH_ENABLED=true LAICA_DEV_AUTH_SECRET=local-dev-auth-smoke LAICA_DEV_AUTH_ALLOWED_USERS="dev-test-linked-ci dev-test-linked-browser-ci" VITE_LAICA_DEV_AUTH_BROWSER=true npx --yes @dotenvx/dotenvx run -- npx playwright test --project=chromium tests/e2e/accessibility-guardrail.test.ts tests/e2e/linked-dev-auth.test.ts`

Source provenance:
- `AGENTS.md`
- `docs/workflows/testing-and-acceptance.md`
- `docs/workflows/agent-merge-authority.md`
- `efforts/effort-017-environment-parity-and-ci-confidence.md`
- `docs/handoffs/2026-06-04-codex-eff-017-linked-dev-auth.md`
- `docs/handoffs/2026-06-04-codex-eff-017-linked-dev-auth-merge-closeout.md`
- Current branch diff against `origin/main` at `a6292f3527c6e0b39b894c901f1af83233e4779a`

Observed result:
- Dependency install completed and reported `found 0 vulnerabilities`.
- `npm run check` passed.
- `npm run test:unit` passed: 33 test files, 218 tests.
- `npm run test:coverage` passed: 33 test files, 218 tests; overall line coverage was 65.18%, with no threshold enforced.
- `npm run build` passed with the existing non-blocking Browserslist age, Firebase dynamic/static import, and chunk-size warnings.
- `npm audit --audit-level=high` passed and reported `found 0 vulnerabilities`.
- `git diff --check` passed.
- Local targeted Playwright did not reach app behavior. The sandboxed run could not resolve `registry.npmjs.org` for dotenvx. The escalated rerun was rejected because fetching/executing dotenvx while holding decrypted secrets was too risky. A secret-presence probe then confirmed the shell did not already have `DATABASE_URL`, `ELEVENLABS_API_KEY`, `VITE_FIREBASE_API_KEY`, and `FIREBASE_SERVICE_ACCOUNT_BASE64`.
- Early PR CI iterations caught useful issues before merge: the a11y guardrail flagged landing CTA contrast plus horizontal-scroll focusability, and the linked browser smoke exposed a pantry-request assertion timing race. The branch fixed the product/accessibility issues and now asserts the linked smoke's provider-light pantry payload from the actual captured POST request.

Reasoning:
- The linked browser smoke uses the same Firebase custom-token path created by the prior dev-auth lane, then verifies protected API access with a real Firebase ID token and a browser sign-in through Firebase Web SDK. That is stronger than a backend auth-bypass header and still deterministic because it is limited to allowlisted `dev-test-*` users and a disposable CI database.
- The recipe route remains stubbed in Playwright, so the routine E2E job proves UI/request/persistence behavior without calling live OpenAI or paid providers.
- Coverage reporting is intentionally non-blocking because this PR creates visibility and baseline artifacts first. Thresholds should come only after the baseline and ratcheting policy are accepted.
- The local Playwright attempt is useful provenance but not positive evidence. The intended positive browser evidence is the GitHub Actions E2E lane, which already provisions a schema-only Neon branch and configured Firebase secrets.

Negative scope:
- This does not validate live OpenAI output quality.
- This does not validate the live `/api/recipes/pantry` provider response contract; the browser smoke stubs recipe suggestions and asserts request/persistence behavior.
- This does not validate ElevenLabs audio quality.
- This does not complete full Google popup login or anonymous-to-Google linking.
- This does not prove production authorized-domain state until the OAuth-start preflight workflow is configured and run.
- This does not validate real storage integration beyond the disposable Neon/test-user harness.
- This does not validate full Replit deployment behavior.
- This does not validate Replit-shell Playwright until Chromium dependencies are configured.
- This does not prove idempotency across repeated recipe submissions; it proves one submit persists selected staples uniquely.
- This does not cover exhaustive corner cases.

## Impact on other agents

Future EFF-017 work should treat this PR as the deterministic wrap-up of the accepted backlog items from the PR #119/PR #126 retros. The remaining work is no longer "add a first smoke" but "decide policy and canary lanes":

- Live-provider canaries should remain separate from default PR CI.
- Replit-primary policy should only change through explicit ADR/PD/workflow-doc edits.
- Coverage thresholds should be introduced only after the non-blocking baseline is accepted.
- Any new linked-user browser smoke can reuse the `VITE_LAICA_DEV_AUTH_BROWSER` helper, but only inside dev/test environments with the existing server-side `LAICA_DEV_AUTH_*` guards.

## Open items

- GitHub Actions must run on the opened PR to provide the positive secret-backed Playwright evidence for the new linked browser and a11y smoke.
- EFF-017 remains `In Progress` after this branch unless Wilson separately accepts a policy-doc pass that makes CI the primary correctness gate with explicit exceptions.
- Live OpenAI/Vision/ElevenLabs canary design remains a separate lane and should not be added to default PR CI by accident.

## Verification

Local checks already run:
- `npm install --save-dev @vitest/coverage-v8@4.1.8 @axe-core/playwright`
- `npm run check`
- `npm run test:unit`
- `npm run test:coverage`
- `npm run build`
- `npm audit --audit-level=high`
- `git diff --check`

Expected PR checks:
- CI `unit`, including non-blocking coverage artifact upload.
- CI `e2e_guest_smoke`, now including the guest lane, linked dev-auth API smoke, linked dev-auth browser smoke, and accessibility guardrail on a disposable schema-only Neon branch.
- Existing dependency audit, secret scan, and CodeQL/GitHub Advanced Security checks.

## Stack / base status

- Base refreshed: yes
- Current base: `origin/main` at `a6292f3527c6e0b39b894c901f1af83233e4779a`
- Last Replit-validated at: not yet validated
- Notes: branch started after PR #135 and PR #136 merged; no lower-stack PR is pending for this branch.
