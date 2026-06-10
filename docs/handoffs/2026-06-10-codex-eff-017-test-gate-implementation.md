# 2026-06-10 - EFF-017 Test Gate Implementation

## Summary

PR #165 implements Wilson-approved EFF-017 audit reconciliation items 1-3: mechanically require the routine correctness checks, make coverage measurement include intended shipped source files before thresholds, and turn the OAuth start preflight from an inert/skippable workflow into an active sanitized canary lane.

This branch also adds the durable security rule Wilson requested: exact CI/ruleset/provider/security evidence stays out of public GitHub docs, PR bodies, pushed handoffs, and public Actions logs. Keep raw settings payloads, provider diagnostics, and sensitive scanner details in local/private evidence or maintainer-only security/settings surfaces.

## Branch And PR

- Branch: `codex/eff-017-test-audit-reconciliation`
- PR: #165, `[codex] Implement EFF-017 test gate fixes`
- Base: fresh `origin/main` after PR #159 and PR #164.
- Related Effort: `efforts/effort-017-environment-parity-and-ci-confidence.md`.

## What Changed

- GitHub settings: protected required status checks now include `unit` and `e2e_guest_smoke` alongside the existing security/dependency checks. Raw ruleset API payloads are local/private only.
- `vitest.config.ts`: coverage now includes `client/src`, `server`, `shared`, and `scripts` shipped-source globs so the reported baseline includes unimported/fully mocked files before any threshold discussion.
- `.github/workflows/oauth-start-preflight.yml`: removed the job-level skip and moved the configured continue-target source to a masked secret.
- `scripts/oauth-start-preflight.ts`: public logs hide provider diagnostics by default; a private/local opt-in can reveal provider diagnostics when evidence is captured outside public GitHub.
- `tests/unit/oauth-start-preflight.test.ts` and `tests/unit/oauth-preflight-workflow.test.ts`: cover sanitized provider logging, private diagnostic opt-in, no workflow-level skip, and secret-backed target configuration.
- `docs/workflows/security-due-diligence.md` and `docs/workflows/testing-and-acceptance.md`: record the private-evidence and OAuth-target masking rules.
- `docs/workflows/testing-and-acceptance.md`: adds a human-readable Mermaid validation-flow chart for local checks, GitHub required CI, risk-triggered Replit validation, production publish, post-publish smoke, and the OAuth preflight side canary.
- `.gitignore`: reserves `.codex/private/` for local-only evidence in worktrees where that directory is writable.

## Validation

Local validation before PR/push:

- `npx vitest run tests/unit/oauth-start-preflight.test.ts tests/unit/oauth-preflight-workflow.test.ts` passed: 2 files / 10 tests.
- `npm run test:unit` passed: 37 files / 241 tests.
- `npm run test:coverage` passed: 37 files / 241 tests. Honest denominator baseline: 42.35% statements / 42.69% lines.
- `npm run check` passed.
- `npm run build` passed with the known Browserslist/Firebase dynamic-import/chunk-size warnings.
- `git diff --check` passed.

PR validation:

- Required PR checks passed after each pushed head, including `unit` and `e2e_guest_smoke`.
- OAuth Start Preflight manual dispatch now reaches checkout/setup/install and the provider preflight command with target/key masking active. It still fails with a sanitized HTTP 400 provider/config rejection, so the lane is active but private identity-provider configuration alignment remains unresolved.

## Private Evidence

Exact ruleset payloads, OAuth setting history, workflow run ids, and provider-diagnostic handling notes were kept out of public markdown. The local-private evidence note is under:

- `$CODEX_HOME/private/laica/2026-06-10-eff-017-ci-oauth-ruleset-evidence.md`

Do not copy raw provider diagnostics, exact settings payloads, or full secret/variable matrices into public GitHub.

## Negative Scope

- No coverage thresholds or ratchet policy were added.
- Root `test-runner.js`, `run-tests.sh`, and `test-criteria*` cleanup remains a later approved reconciliation item.
- No dead-code sweep was performed.
- Replit-specific OAuth targets were not added because the accepted Replit target set was not established.
- OAuth preflight now runs and fails loudly, but it does not pass yet. The remaining blocker is private provider/Firebase configuration alignment.
- This does not complete real Google popup sign-in, account linking, production deployment behavior, live OpenAI/ElevenLabs/Vision/transcription canaries, or AI output quality validation.

## Next Steps

1. Resolve the private identity-provider configuration alignment, then rerun OAuth Start Preflight and record sanitized pass/fail evidence.
2. Continue approved reconciliation items 4-6 in separate scoped work: stale root test artifact cleanup, dead-code sweep, and targeted coverage for live-but-thin surfaces.
3. Decide coverage threshold/ratchet policy only after accepting the honest baseline.
