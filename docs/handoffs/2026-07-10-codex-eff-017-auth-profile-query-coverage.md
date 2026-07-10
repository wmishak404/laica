# EFF-017 Auth Profile Query Coverage

**Agent:** codex
**Branch:** codex/efforts-hygiene-2026-07-09
**Date:** 2026-07-10; refreshed 2026-07-17
**Initiative:** none — standalone EFF-017 slice; INIT-001 / INIT-002 / INIT-003 / INIT-004 were read for routing context
**INIT updated:** no
**Resolves blocked handoff:** none

## Summary

Daily Efforts hygiene originally found the active Effort pool correctly limited to EFF-017 and EFF-022. PR #249 had merged the prior EFF-017 cooking-session hook coverage, so this branch records that merge signal and adds another deterministic auth-scoped client-state test slice. EFF-022 remains active, but open prompt/eval PR #274 overlaps that domain and its runtime fallback threshold/copy work remains deferred.

On 2026-07-13, the branch was rebased onto current `origin/main` at `deaf17e7e6ccd9c4bd75239dcadfc586fed65e1b` after PR #276, PR #278, and PR #279 landed. The rebase preserved both the merged linked Settings dev-auth browser coverage signal from `main` and this auth/profile query coverage signal.

On 2026-07-14, the branch was rebased again onto current `origin/main` at `9dcb37da4e57f4c655816e6a0c399fa67365f43f` after the EFF-028/EFF-029 Phase 4 routing closeout landed. Hygiene stayed clean: EFF-028 and EFF-029 are now active but explicitly gated on thread `019f3b47-9d04-7a03-8973-2a9cd1bb19b4` / PR #281, while this branch remains the existing EFF-017 implementation slice.

On 2026-07-17, the branch was rebased cleanly onto current `origin/main` at `8fe58e97ac9fdcd364047cb21db3e0898552e65e` after PR #294, PR #295, PR #296, and their mechanical closeouts resolved EFF-028, EFF-029, and EFF-030. Hygiene stayed clean: the active Effort pool is EFF-017 and EFF-022, and this existing PR remains the non-duplicative EFF-017 implementation slice.

## Hygiene result

No active Effort should close, move into an INIT, or graduate into a PD/workflow doc for this refresh. The active read list, registry, agent entrypoint links, recent handoffs, and open PR ownership are aligned. EFF-017 remains the active implementation lane for this PR; EFF-022 remains open with overlapping prompt/eval PR #274 and deferred runtime threshold/copy work. EFF-028, EFF-029, EFF-030, and EFF-031 are resolved history only.

## Effort implementation choice

EFF-017 was selected because auth-scoped client state is a shared dependency for INIT-001 cooking continuity, INIT-003 guest/linked boundaries, and release validation. EFF-022 was not selected because its prompt/eval surface overlaps open PR #274 and its runtime fallback threshold/copy work remains deferred. No new Effort slice was started on 2026-07-17 because this open PR already owns the highest-priority non-conflicting EFF-017 implementation path and only needed a current-base refresh.

## Changes

- `tests/unit/use-auth-session.test.tsx`
  - Adds profile-query coverage proving guest session users do not fetch linked-only profile data.
  - Adds linked-profile coverage proving `useUserProfile` queries are keyed by authenticated user id.
- `efforts/effort-017-environment-parity-and-ci-confidence.md`
  - Records PR #249's merge and this new auth/profile coverage signal.
- `efforts/registry.md`
  - Refreshes EFF-017's last-signal summary.
- `docs/handoffs/2026-07-10-codex-eff-017-auth-profile-query-coverage.md`
  - Captures the hygiene result, implementation choice, validation, and remaining scope.

## Impact on other agents

Use `efforts/README.md` as the active Effort list. No Effort was closed, deferred, reopened, or moved into an INIT by this branch. EFF-017 remains `In Progress`; EFF-022 remains `Open`. EFF-028, EFF-029, EFF-030, and EFF-031 are resolved history.

Avoid overlapping EFF-022 prompt/eval work while PR #274 is open unless the new work explicitly coordinates with that branch. The old OAuth preflight blocked handoff remains unresolved and should not be treated as complete provider/auth evidence.

## Open items

- EFF-017 still needs separate decisions or slices for provider canaries, automated Replit-environment checks, OAuth preflight configuration, coverage ratcheting, and broader live-surface coverage.
- EFF-022 remains open for the transparent pantry-fallback activation threshold and user-facing copy.
- Replit validation is not required before merge for this branch because it is test-only coverage plus docs hygiene with no runtime behavior change.

## Verification

- `npm ci` passed with existing dependency deprecation warnings and zero vulnerabilities.
- `npx vitest run tests/unit/use-auth-session.test.tsx` — 1 file / 7 tests passed.
- `npm run test:unit` — 48 files / 377 tests passed.
- `npm run check` passed.
- `npm run build` passed with existing Browserslist, Firebase dynamic-import, and chunk-size warnings.
- `git diff --check` passed on 2026-07-13 before the first refresh.
- `git diff --check origin/main...HEAD` passed on 2026-07-13 before the first refresh.
- 2026-07-14 rebase validation passed after rebasing onto `9dcb37d`:
  - `npx vitest run tests/unit/use-auth-session.test.tsx` — 1 file / 7 tests passed.
  - `npm run test:unit` — 48 files / 377 tests passed.
  - `npm run check` passed.
  - `npm run build` passed with the existing Browserslist, Firebase dynamic-import, and chunk-size warnings.
  - `git diff --check` passed.
  - `git diff --check origin/main...HEAD` passed.
- 2026-07-17 rebase validation passed after rebasing onto `8fe58e97ac9fdcd364047cb21db3e0898552e65e`:
  - `npm ci` passed with existing deprecation warnings and zero vulnerabilities.
  - `npx vitest run tests/unit/use-auth-session.test.tsx` — 1 file / 7 tests passed.
  - `npm run test:unit` — 50 files / 389 tests passed.
  - `npm run check` passed.
  - `npm run build` passed with the existing Browserslist, Firebase dynamic-import, and chunk-size warnings.
  - `git diff --check` passed.
  - `git diff --check origin/main...HEAD` passed.
- GitHub exact-head checks are recorded on PR #277 after the force-with-lease push; use the live PR rollup as the source of truth for final CI status.

Value claim: EFF-017 now has direct deterministic coverage that guest auth does not unlock linked-only profile fetches and linked profile cache keys stay scoped to the authenticated user id.

Evidence limits: This does not validate Replit; does not change runtime behavior; does not exercise live OpenAI, ElevenLabs, Firebase Google popup behavior, or OAuth preflight configuration; and does not resolve provider canary or validation-authority policy work.

## Stack / base status

- Base refreshed: yes
- Current base: `origin/main` at `8fe58e97ac9fdcd364047cb21db3e0898552e65e`
- Last Replit-validated at: not applicable for a test-only/docs hygiene branch
- Notes: branch name retained `2026-07-09` after a local git-metadata lock prevented branch rename; rebased on 2026-07-13 after PR #276/#278/#279, on 2026-07-14 after PR #287 closeout, and on 2026-07-17 after EFF-028/EFF-029/EFF-030 implementation and closeout PRs landed. Conflict resolution was only needed on 2026-07-13, when EFF-017/registry chronology was reconciled by keeping both July 10 coverage signals.
