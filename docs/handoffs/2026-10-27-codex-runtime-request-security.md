# Runtime and request-boundary security review

**Agent:** codex
**Branch:** `codex/php2shell-security-review`
**Date:** 2026-10-27
**Initiative:** INIT-005 dependency prerequisite; no action feature implementation
**INIT updated:** yes, prerequisite/validation context only
**Resolves blocked handoff:** none

## Summary

Wilson requested a PHP2Shell applicability review and patches. The checked-in app uses Node/Express and React, with no PHP application/runtime configured. The review nevertheless identified a current runtime/dependency remediation need and a reproducible request-memory boundary gap. The prepared change enforces supported runtimes, bounds the supported upload contract, and preserves schema/provider behavior through a coordinated library update. It does not establish that any live deployment has been patched.

The durable learning is to verify the whole buffered request shape, installed-library behavior and actual deployed runtime version. Existing firewall protection, a runtime module major, a package-manager engine warning, or earlier passing scans cannot substitute for that evidence. Public detail stays at the coordination level under the security workflow; raw scanner and reproduction results remain local/private.

## Changes

- `.nvmrc`, `.replit`, `package.json`, `scripts/check-runtime.mjs`, dependency-audit workflow and the AGENTS runtime description align supported runtime selection and reject outdated versions before normal dev/build/start commands.
- The audit workflow retains its high/critical threshold and fails on either scanner or summary errors while printing only severity totals; raw reports/diagnostics stay in ephemeral runner files and are not uploaded.
- `package.json` / `package-lock.json` carry focused security updates and the coordinated validation/provider compatibility change; one unused dependency is removed. No stylesheet package version or current Express major changes relative to the inherited base.
- `server/routes.ts` constrains upload shape, validates accepted media before buffering, and returns controlled parser failures while preserving auth/rate-limit order and isolated temporary files.
- Eval/seed records preserve their existing sparse/string-key contracts; provider error handling preserves native header metadata.
- Regression tests cover request boundaries, installed-SDK structured output/audio-stream construction/error metadata, shared insert validation, sparse eval labels and runtime policy.
- Security workflow, EFF-017, EFF-023, INIT-005/index and the production registry record guardrails, stack dependency and evidence limits. EFF-017 remains `In Progress`; EFF-023 remains `Deferred`. Broad modernization is not reopened.

## Stack / base status

- Fresh `origin/main`: `96ec567a6f55639473d3209376fa180b2dd1f924`.
- Intended PR base: #373 / `codex/tailwind-4-audit-remediation`, `ea63835627bda8be40f93314a8e690e9bfc0044d`, itself stacked on #372.
- Implementation commit: `d85ddd2e86ccb3707e1ceef00b55d3aa9ca72fbb`; final documentation/review head and exact-head run URLs live in the PR.
- The new branch includes the existing remediation instead of recreating it. Review its incremental diff against #373; audit the eventual combined main scope with fresh `origin/main...HEAD`.
- Lower PRs have not merged. After each approved lower merge, the owning upper branch must fetch/rebase onto its new intended base, push with lease, and rerun all required gates. Refresh against current main before the eventual main merge.
- Human Replit validation: deferred to full/release regression under Wilson's accepted timing rule. No Replit Agent, deployment, secret or DB action occurred. Earlier foundation/provider validation is not claimed for the changed SDK/runtime candidate.

## Verification

**Value claim:** bound request memory to the supported contract and preserve ordinary validation/provider behavior while removing current high/critical dependency findings from the combined candidate.

**Local evidence:** macOS, patched Node `22.23.4`, npm `11.11.0`, implementation above:

- Clean `npm ci` passed. Full and production audit summaries each report **5 moderate, 0 high, 0 critical**. The same-date inherited #373 baseline reports 5 moderate / 6 high / 0 critical; earlier green audits are historical, not current proof. Scanner counts include propagated package entries and are not distinct exploitability findings.
- `npm run check` passed TypeScript/UI lint; `npm run build` passed with existing mixed-import/chunk warnings.
- `npm run test:unit` passed **60 files / 510 tests** after the final workflow tests. `phase0-security-routes.test.ts` and existing provider-boundary tests prove parser/status/provider-call contracts. The original parser was observed accepting unsupported fields; new contract cases fail before the patch and pass after it.
- `provider-schema-contracts.test.ts` explicitly uses the installed SDK: structured-output schema, audio helper bytes, actual transcription file-stream multipart construction through intercepted fetch, native error metadata, shared feedback/profile schemas. Provider traffic is synthetic and intercepted.
- `eval-fixtures.test.ts` preserves sparse labels and rejects unknown labels; `npm run eval:fixtures` validates all 27 public fixtures.
- Runtime boundary cases cover supported patch floors, unsupported/odd/prerelease versions and normal lifecycle hooks. The selected patched runtime passes the CLI check; the local older host runtime is rejected.
- The audit workflow's executed shell block is tested with synthetic scanner results: moderate findings pass; high/critical findings, scanner failure, invalid JSON, missing counts and error payloads fail; raw diagnostics do not appear in output. Both scanner and summarizer failures are preserved.
- Independent source review found no additional code blockers in the incremental patch. `git diff --check` passed.

**Required automation:** exact-head GitHub unit/build/coverage, full `e2e_guest_smoke`, dependency audit and PR secret scan are pending until push; the PR records their final run URLs and outcomes. The E2E lane must prepare a disposable schema-only Neon branch, apply/check schema, run all guest/linked/action-ledger cases and confirm deletion. Skipped/failed/stale gates are blockers. Default CodeQL setup does not run at the unprotected feature-branch stack level; fresh applicable CodeQL analyses remain required on the eventual main-targeting head after the approved stack merges. No scanner setting or threshold changes.

**Evidence limits:** source inspection does not inventory all hosting infrastructure. Deterministic tests do not prove actual socket-abort cleanup, resource behavior under concurrent load, native image-decoder expansion, real provider quality, Firebase/App Check production configuration, autoscale DB-error fallback behavior or deployed runtime patch propagation. No compromise or production remediation is claimed.

## Impact on other agents

This is a shared-surface dependency prerequisite, not out-of-order action feature work. Do not start Phase 2 from a stale pre-remediation graph or copy the changes into #371. Existing #372/#373 still require their own merge decisions; this task grants no merge authority. Preserve their visual migration evidence and rerun exact-head automation after any stack rewrite. The primary checkout's existing branch and encrypted `.env` edit were left untouched.

## Open items and next actions

1. Publish this complete branch and run exact-head CI/E2E/security checks; retain the PR as the live run-status source.
2. Obtain Wilson's explicit code/dependency merge instruction for the reviewed stack. No merge or publish is performed here.
3. At full/release regression, verify actual workspace and selected deployment runtime patch/source correlation and platform Security Center status. Run one ordinary authenticated audio Ask plus normal recipe/step and feedback/settings checks in mobile view; preserve the baseline core smoke and EFF-036 gate. Live-provider structured-output proof must be refreshed without activating a pilot.
4. After an authorized publication, confirm the approved image/runtime actually went live. If the platform module supplies an older patch, stop and request the supported platform update; do not bypass the runtime guard or claim that the module name proves success.

The [production registry](../production-validation-registry.md) contains the bounded release check. No current-main candidate or production baseline was advanced by this unmerged branch.
