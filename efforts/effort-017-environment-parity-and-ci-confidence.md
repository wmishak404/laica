# EFF-017 — Environment parity + CI confidence (reduce manual Replit validation)

**Former ID:** EPIC-017
**Status:** In Progress
**Owner:** Wilson / Codex / Claude
**Created:** 2026-05-05
**Updated:** 2026-06-04

## One-line summary

Capture the decisions + open questions required to make local + CI validation trustworthy enough that manual Replit validation is no longer the default merge gate.

## Context — why this exists

Today, LAICA uses a manual “Replit validation gate” because local macOS runs and Replit runs can diverge (runtime, env vars, database, OAuth domains, etc.). This creates friction and correctness ambiguity: “it worked locally” does not reliably imply “it will work on Replit deploy.”

This Effort exists to preserve the decision points and intended direction for the now-active CI harness path without re-deriving this context from chat. PR #109 merged the first additive CI foundation, but it does not replace Replit validation.

Primary spec / drift-vector inventory:
- `docs/workflows/environment-parity-spec.md`

Key external constraints (provenance):
- Replit SQL DB `DATABASE_URL` is app-scoped and cannot be used externally, so “use the same Replit DB from local” is not a viable parity strategy:
  - https://docs.replit.com/cloud-services/storage-and-databases/replit-database
- Replit has separate development vs production databases; publishing/deploy uses production DB:
  - https://docs.replit.com/cloud-services/storage-and-databases/create-production-database-when-publishing
- Firebase Auth Emulator issues unsigned tokens; Admin SDK accepts them only when `FIREBASE_AUTH_EMULATOR_HOST` is set (must never be set in production):
  - https://firebase.google.com/docs/emulator-suite/connect_auth
- Firebase OAuth redirect domains: whitelisting is domain-based (any port on that domain):
  - https://support.google.com/firebase/answer/6400741?hl=en
- Identity Platform `accounts:createAuthUri` can generate an authorization URI for a providerId like `google.com` (useful for a “OAuth can start” preflight check):
  - https://cloud.google.com/identity-platform/docs/reference/rest/v1/accounts/createAuthUri
- Node 20 is EOL 2026-04-30; Node 22 is supported until 2027-04-30:
  - https://github.com/nodejs/Release

## Scope

### In scope

- Define minimal parity invariants (runtime + install + env contract + DB schema parity + auth parity).
- Define what CI must prove so “passes in CI” implies “safe to deploy to Replit” (with explicit exceptions).
- Define how local/CI can use Firebase Auth Emulator while still ensuring prod Google OAuth doesn’t silently break.
- Define DB parity where schema and semantics are identical but instances/users/data differ per environment.
- Define a repeatable authenticated browser-smoke path for high-value flows where code review and unit tests are not enough, such as Chef It Up pantry persistence and live recipe generation.

### Out of scope (for now)

- Changing `AGENTS.md` / ADR-0001 to remove the Replit validation gate (requires an explicit follow-up decision).
- Automating full Google OAuth popup completion with a real user account. The preferred direction remains a deterministic dev-only auth lane plus a separate production-domain OAuth preflight.
- Treating the PR #109 harness as proof that CI is already primary; it is additive until a separate ADR/PD changes validation authority.

## Decisions made so far

These are recorded from discussion; they are not yet implemented repo-wide.

1. **Parity definition target:** Behavioral parity (same semantics/contracts), not bitwise OS parity.
2. **Runtime direction:** Standardize on Node 22 LTS (Node 20 is EOL as of 2026-04-30).
3. **DB parity stance:** Different DB instances/users/data per env is OK; schema + migration posture must match.
4. **Local/CI auth lane:** Prefer Firebase Auth Emulator for deterministic local/CI auth.
5. **“Real login works” definition:** Prefer an automated “OAuth can start on prod domain” preflight check, not an automated full Google sign-in completion (avoid test-account credential/2FA brittleness).
6. **Authenticated browser-smoke target:** Future automation should cover actual UI state transitions, DB persistence/no-duplicate assertions, and provider-route completion for selected high-value flows. Code review alone is not a substitute for these browser/environment checks.

## Open questions

1. Which domain(s) are “production hostnames” for the OAuth-domain preflight gate?
   - Replit deployment domain(s) only vs custom domain only vs both
2. Should the preflight gate run on every PR merge, only on release, or as a nightly canary?
3. What DB strategy beyond PR #109's schema-only Neon branches is needed for local agent validation and future smoke coverage?
4. How should this Effort’s direction reconcile with current workflow docs that state Replit is the service-backed validation gate (ADR-0001 / `AGENTS.md` / EFF-005 / EFF-010)?
5. Which smoke journeys are the first automation targets?
   - Candidate from Phase 3.2: authenticated Chef It Up progressive staples, including staple queue UI, submit-time pantry write, duplicate prevention, loading Back/cancel, and Ticket Pass completion.
6. Should live AI recipe generation be part of every browser smoke, gated behind an explicit live-service flag, or replaced by a controlled fixture for most PR runs with a smaller live-provider canary?
7. What reset/seed API or script can safely prepare deterministic `dev-test-*` users without touching real user data?

## Agent checklist — when to read this Effort

Read EFF-017 before:

- Changing `.replit`, runtime pins, or install/run commands
- Changing auth flows (Firebase client config, token verification, domain requirements)
- Changing DB schema/migration posture or local DB setup defaults
- Changing app-wide merge validation policy (CI vs Replit gate)

Also read:
- `efforts/effort-005-testing-strategy-and-acceptance-criteria.md`
- `efforts/effort-010-local-db-schema-strategy.md`

## Resolution criteria — what "done" looks like

The full CI-confidence objective remains broader than PR #109. The current active slice is follow-through on the additive harness: configure the required GitHub repo variable/secrets, prove `e2e_guest_smoke` runs instead of skipping, and fix startup-isolation issues that block the privacy-forward guest smoke from exercising auth/setup/DB/UI. Split future harness enhancements into separate PRs from `main`. Preserve the current Replit validation gate until a separate ADR/PD explicitly changes validation authority.

This Effort can be `Resolved` when all of the following are true:

1. CI is the primary merge gate for correctness (with explicit exceptions documented).
2. Local + CI run a repeatable authenticated smoke path (emulator-based) and DB schema health checks.
3. A prod OAuth-domain preflight gate exists (automated) and prevents `auth/unauthorized-domain` regressions.
4. At least one high-value authenticated browser flow is automated end to end with deterministic test data, UI assertions, persistence/no-duplicate checks, and clear handling for live-provider calls.
5. `AGENTS.md` + ADR-0001 + EFF-005/010 are updated so policy is consistent everywhere.

## 2026-05-05 — Parked

Deferred until after `initiatives/INIT-001-mobile-refresh.md` is finished.

## 2026-05-08 - Phase 3.2 exposes authenticated browser-smoke gap

Mobile Refresh Phase 3.2 re-surfaced the same system gap in a more specific way. Codex and Replit could prove the progressive staples implementation with unit tests, TypeScript/build checks, and code-path review, but Replit could not complete the authenticated browser gate because it could not drive Firebase Google sign-in in the live preview.

The missing manual validation was not generic "does the code look right"; it required exercising the running app as an authenticated user and observing:

- Chef It Up cuisines produce a staple queue with more than four missing staples.
- Selecting rows updates the visible queue and Added shelf in the browser.
- Pending Added chips expose the visible `+` and `X` affordance and undo correctly.
- Back before submit discards pending additions.
- Submit writes confirmed staples to the Replit pantry database.
- Returning to the staple step shows saved staples as non-removable pantry facts.
- Submitting again does not create duplicate pantry rows.
- Loading disables rows/chips while Back still cancels without late auto-advance.
- Ticket Pass completes with exactly three live recipe suggestions.

Desired future automation:

- A dev-only Firebase custom-token or emulator-backed auth lane that still sends Firebase bearer tokens to protected APIs.
- Deterministic `dev-test-*` users with resettable pantry/profile fixtures.
- Browser-level Playwright smoke for the Chef It Up progressive-staples flow.
- DB assertion/reset support scoped to test users so no-duplicate behavior can be proven safely.
- A controlled choice for recipe generation: fixture/stub for routine UI smoke, plus explicit live-provider smoke or canary when validating OpenAI/Replit provider integration.
- Clear separation between code-verified checks and runtime/browser-verified checks in PR/handoff validation notes.

This does not reactivate EFF-017 during INIT-001. It preserves the new concrete acceptance target for the later environment-parity/dev-test-harness window.

## 2026-05-13 - EFF-013 pantry correction added as a future smoke candidate

The EFF-013 pantry manual-entry correction slice adds another useful authenticated-smoke target for the later harness. The candidate flow is intentionally narrower than the Phase 3.2 Chef It Up target: sign in with a deterministic test user, exercise setup pantry manual correction, verify corrected-chip provenance and Undo, exercise Settings pantry manual correction, confirm kitchen manual entry is not corrected, save pantry, reload or revisit Settings, and assert corrected pantry values persist for the test user.

This note does **not** reactivate EFF-017 or weaken the current Replit validation gate. EFF-013 remains a runtime/client-profile-persistence change that requires targeted manual Replit validation until the dev-auth + seed/reset + authenticated browser-smoke harness exists and is accepted as a merge-readiness signal.

## 2026-05-13 - EFF-013 Replit spot-check validation signals

Wilson's first Replit spot-check on EFF-013 produced useful process signal before the formal targeted validation pass finished:

- Good pattern: the validation stayed narrow and product-real. Entering `brocoli, avacado, beens, ryce, chickin` immediately exposed that local tests covered the planned examples but not the messier user-like variants Wilson actually tried.
- Good pattern: Replit did not need a broad regression sweep to find the issue. The failure sat exactly inside the changed runtime surface: authenticated pantry manual entry rendering and persistence-adjacent state.
- Bad pattern: the initial local test data was too spec-shaped (`brocolli`, `avacado`, `zuchini`) and therefore overfit the correction map. Future smoke candidates should include a small "representative messy input" row, not only the examples named in the planning note.
- Bad pattern: the toast technically provided provenance, but in the wrong visual location. The product signal was easier to evaluate in Replit because Wilson could see the corrected chips and notice that the notification should be generic while the tags themselves show what changed.
- Process implication: EFF-017's eventual authenticated-smoke harness should capture both data assertions and user-visible provenance assertions. For this flow that means corrected values persist, kitchen terms remain unchanged, Undo restores originals, and corrected pantry chips visibly identify the changed entries during the interaction.
- Lightweight-doc implication: validation discoveries should be appended to the owning Effort and to EFF-017 only when they teach something about the validation process. This keeps EFF-017 as a pattern log for reducing human attention later, not a duplicate feature changelog.

Wilson then completed the full targeted Replit checklist at the pre-rebase runtime SHA that now corresponds to `6f41ea4aa8b892e0697b5f4d5402a35eb76f95bb`, covering branch/SHA confirmation, Firebase sign-in, setup pantry correction + Undo, Settings pantry correction + Undo, duplicate-after-correction behavior, kitchen non-correction, and pantry save/reload persistence.

- Good pattern: the checklist was concrete enough to prove the changed behavior without pulling in AI routes, ElevenLabs, vision upload, schema pushes, or broad regression passes.
- Good pattern: recording the exact validated SHA made the staleness rule mechanical. Any runtime commit after the validated runtime content should make this validation stale by definition; after the PR conflict rebase, the content-equivalent runtime point is `6b093db35074434a914a82f43daa8c680cc091aa`.
- Good pattern: the later common-staple dictionary expansion is a concrete example of that staleness rule working as intended. Even a tiny exact-match map change is user-visible runtime behavior, so it needs a fresh targeted pantry validation before merge.
- Good pattern: the corrected-chip flash review added another future-smoke assertion type: when provenance is visual, the validation should ask whether the cue is actually noticeable in context, not merely whether a CSS animation exists.
- Good pattern: the later dictionary-addition spellcheck pass is useful as a scoped validation signal, but it should not silently upgrade to full branch validation. Future EFF-017 process should let agents record partial passes by scope while keeping the full validated-SHA rule strict.
- Good pattern: Wilson's final visual confirmation closed the loop on the exact thing the previous validation had left open: not "does animation code exist?", but "is the provenance cue obvious enough in the real product surface?"
- Process implication: future EFF-017 smoke specs should pair each runtime behavior with a small "negative scope" list. That keeps validation focused and reduces Wilson's attention load because the reviewer does not have to re-decide which adjacent systems are irrelevant every time.

## 2026-05-13 - Phase 4 harness pilot trigger accepted

Wilson accepted the recommendation to use EFF-017 during Mobile Refresh Phase 4 instead of waiting until all of INIT-001 is complete. The accepted shape is intentionally narrow: start with an authenticated smoke harness pilot that helps Phase 4 validation, while keeping manual Replit validation authoritative until the harness earns trust.

The first EFF-017 implementation branch should not claim that CI replaces Replit validation. It should use already-shipped behavior such as EFF-013 pantry correction or Phase 3.2 Chef It Up as a stable harness target first, then apply the harness to Phase 4 cooking guidance where auth, persistence, AI-assisted guidance, inline error recovery, and possible speech routes make repeated manual checking expensive.

## 2026-05-14 - Phase 3.1 planning-copy validation signal

The Phase 3.1 Planning copy slice reinforced EFF-017's current status rather than reopening it. Codex could run unit/type/build checks locally and boot the dotenvx dev server, but the in-app browser only reached the signed-out landing screen, so the authenticated Planning card still needed Wilson's Replit validation. Wilson confirmed the `Slop It Up` copy/title treatment in Replit at runtime head `39e4a361fb16a22f63638759a801435a5b00715b`.

Process implication: EFF-017 remains `Deferred` until the accepted Phase 4 harness pilot starts, and Replit/manual validation remains authoritative for auth-gated UI surfaces. The eventual harness should support lightweight authenticated visual-smoke assertions too, not only complex AI or persistence flows, because even a small Planning-card copy change cannot be fully observed locally without a reliable dev-auth lane.

## 2026-05-29 - CI guest-lane E2E harness started (remote Neon, no Docker)

Work began on a minimal CI harness that can run without Replit, using:

- A dedicated **remote Neon** test project (schema-only branches per run, no production/Replit data).
- A **guest-lane Playwright smoke** that avoids Google popup OAuth and instead signs in with Firebase anonymous auth.

This does not yet remove the Replit validation gate for deployment-bound changes. It is an incremental step toward (a) making "passes in CI" meaningful for real UI flows, and (b) shrinking the set of checks that require a human to drive a browser.

The immediate parity learning reinforced by this slice:

- DB instances can differ per environment, but schema parity must be enforced (EFF-010).
- Auth automation needs a deterministic lane (guest auth is the first practical one; dev-only custom-token lane remains the stronger future direction per `pd-dev-test-harness.md`).

## 2026-06-01 — Harness foundation merge-ready; E2E activation pending repo config

PR #109 (`codex/ci-automation-harness`) was brought to merge-ready state on a `main`-rebased head with green GitHub checks.

Important limitation to record explicitly:

- The `e2e_guest_smoke` job is intentionally gated on repo `vars` / `secrets` (Neon + Firebase + ElevenLabs). Until those are configured in GitHub, the guest-lane E2E smoke and `db:health` path will be skipped in CI, so the confidence lift is limited to typecheck/build/unit.

This is an expected setup dependency, not a change in the Replit-authoritative validation policy.

## 2026-06-01 — PR #109 merged; EFF-017 reopened for harness follow-through

PR #109 merged to `main` as `3720c26`, making the CI automation harness a shipped additive foundation rather than a parked plan. EFF-017 is now `In Progress` because work, decisions, and validation are partially complete.

Do not create a new INIT for the immediate next step. The concrete follow-up belongs here: configure `NEON_PROJECT_ID` plus the required Neon, Firebase, and ElevenLabs GitHub Actions secrets so `e2e_guest_smoke` stops being skipped and produces real guest-lane + `db:health` evidence.

Open separate PRs from `main` for later harness improvements such as stubbed AI mode, selector hardening, canary/live-provider workflows, prod OAuth-domain preflight, or a stronger dev-auth lane. A policy change from Replit-primary to CI-primary validation requires a separate explicit ADR/PD.

## 2026-06-01 — First active E2E run proved config and exposed startup isolation bug

Wilson configured the GitHub Actions Neon/Firebase/ElevenLabs inputs after PR #109 merged. Re-running the `main` CI workflow confirmed the `e2e_guest_smoke` job no longer skipped: preflight secrets passed, the workflow created a schema-only Neon branch, applied schema with Drizzle, passed `npm run db:health`, installed Chromium, and cleaned up the Neon branch.

The run then failed while Playwright waited for the local web server because `server/routes.ts` eagerly constructed an OpenAI transcription client at module load. The guest smoke itself is intentionally neutral: it completes anonymous auth/setup and reaches the planning choice without calling paid AI providers. The correct follow-up is therefore a startup-isolation fix, not expanding the guest-smoke secret contract to require `OPENAI_API_KEY`.

Process lesson: the guest-lane smoke should stay privacy-forward and provider-light by default. Live OpenAI or transcription validation belongs in an explicit live-provider smoke/canary once that scope is deliberately accepted.

## 2026-06-01 — Automation evidence reports accepted as merge-gate discipline

Wilson accepted the evidence shape from the PR #118 CI proof as the standard for automation-backed merge gates: automated tests are evidence that must be reasoned from, not a conclusion by themselves. Future CI, Playwright, `db:health`, local test, Replit automation, or eval-backed merge claims need to present the claimed behavior, command/check provenance, source provenance, observed result, reasoning, and negative scope before the branch is called correct or merge-ready.

This matters for EFF-017 because increasing automation confidence can otherwise create a false sense of coverage. A passing harness should reduce manual bottlenecks only when reviewers can see what was actually exercised, which environment ran it, which branch/SHA it covered, how external resources were prepared and cleaned up, and which provider/Replit/human paths remain outside the automation.

Future eval work should inherit the same standard: dataset or fixture identity, evaluator/prompt/model version where relevant, metric and threshold, sample size, failure examples or cluster summaries, privacy/redaction posture, and artifact location. This complements INIT-002's telemetry/eval direction without changing the current Replit-primary validation policy.

## 2026-06-01 — Guest planning workflow coverage branch started

PR #118 merged as `1541988`, and the post-merge `main` CI run passed, including the now-active guest E2E job. That closed the startup-isolation blocker and proved the Neon/Firebase/ElevenLabs configuration can run from `main`.

The next branch, `codex/e2e-user-workflow-coverage`, starts the first user-facing expansion beyond setup. It keeps the basic guest lane provider-light by stubbing only the browser request to `/api/recipes/pantry`, then exercises the visible Chef It Up planning path: guest setup, planning-time selection, cuisine selection, staple confirmation, request payload assertions, three recipe-ticket rendering, and prep-tray entry.

Coverage intent:

- Prove more of the actual user journey than "can reach planning choice."
- Verify that pantry items, selected staples, time, cuisine, confirmed staples, and unconfirmed visible staples are what the UI would send into the AI-backed recipe route.
- Keep OpenAI out of the routine merge gate. Live recipe quality, provider availability, model output, cooking-step generation, speech, vision, linked-account persistence, and Replit deployment behavior remain outside this branch's claim.

This is still not enough to resolve EFF-017. It adds deterministic user-flow coverage while preserving the current Replit-primary policy until the remaining resolution criteria are deliberately implemented and accepted.

## 2026-06-01 — PR #119 coverage audit accepted as phased backlog

Claude cross-checked PR #119's CI run and test inventory against the app's actual user-facing surface area. The audit confirmed that the current gate is worth using as a regression floor: `npm run check`, `npm run build`, the full unit suite, and the guest-lane Playwright job now protect auth, request validation, anonymous quota, security/rate-limit behavior, and the guest setup-to-planning-to-prep-tray path.

Wilson accepted the framing that this is not "full app regression coverage." Do not describe PR #119 or the current harness as covering all aspects of LAICA. The next EFF-017 work should close the highest-value user-facing gaps in phases:

1. **P0 route-contract coverage.**
   Add mocked route tests for shipped user-facing and service-writing routes that currently have little or no direct coverage: `POST /api/feedback`, `POST /api/cooking/assistance`, `POST /api/grocery/list`, `POST /api/ingredients/alternatives`, cooking-session lifecycle routes (`start`, `active`, `complete`, history/list, delete one, delete all), `POST /api/user/pantry/reset`, and `GET /api/speech/voices`. Fix or replace `tests/unit/voice-recording.test.ts` so it imports real shipping logic instead of re-declaring copied behavior inside the test.

2. **Provider-light live-cooking smoke.**
   Extend Playwright coverage from the prep tray into live cooking with `/api/cooking/steps` stubbed. Prove step rendering, basic next/back behavior, timer controls, and the ask-for-help UI without making OpenAI or ElevenLabs part of the routine merge gate.

3. **Mocked provider-boundary happy paths.**
   Add route-level happy-path coverage for `POST /api/cooking/steps`, `POST /api/speech/synthesize`, `POST /api/speech/transcribe`, and `POST /api/vision/analyze` using mocked providers. Keep live provider availability and model quality in explicit canary/eval work, not the default PR gate.

4. **Coverage visibility and ratcheting.**
   Turn on coverage reporting first as a visible, non-blocking artifact. Add thresholds only after P0 holes are closed, starting at the measured baseline and ratcheting upward so coverage cannot silently erode.

5. **UI and accessibility guardrails.**
   Add focused assertions for important tap targets, obvious accessibility regressions, and key-screen axe/a11y checks. Treat these as complements to the existing UI-governance lint/PR-template guardrails, not a replacement for product/design review.

Open scope that remains outside the default merge gate until separately accepted: live OpenAI output quality, ElevenLabs audio quality, full Google linked-account login, production OAuth-domain preflight, admin eval/prompt-versioning workflows, `storage.ts` data-access integration, and Replit deployment behavior. These should become separate EFF-017 slices or INIT/PD work when their acceptance criteria are clear.

## 2026-06-02 — PR #120 merged P0 route-contract coverage

PR #120 merged as `df4e2d563113cdc58c898dd871ccdaaeb0fd5409`, implementing the first accepted backlog item from the PR #119 audit. The branch `codex/eff-017-route-contract-p0` started from `origin/main` at PR #119's merge commit `979254935344309d80604701bc6554e557ca995b`.

Coverage added:

- Mocked HTTP route-contract tests for `POST /api/feedback`, `POST /api/cooking/assistance`, `POST /api/ingredients/alternatives`, cooking-session lifecycle routes (`start`, progress update, `complete`, history/list, `active`, delete one, delete all), `POST /api/user/pantry/reset`, and `GET /api/speech/voices`.
- Explicit provider-light assertions that OpenAI/ElevenLabs helpers are mocked and not live-called in this routine unit gate.
- Current disabled-route coverage for `POST /api/grocery/list`: the handler remains commented out in shipping code, so the test asserts `404` and verifies `getGroceryList` is not called. Reactivating the route is a separate product/behavior decision, not part of this coverage slice.
- Replacement of `tests/unit/voice-recording.test.ts` with tests that import shipping voice-recording helpers from `client/src/lib/voiceRecording.ts`; this removes the copied in-test logic that had drifted from the component's actual silence thresholds.

Local evidence before handoff:

- `npm ci` installed dependencies successfully and reported `found 0 vulnerabilities`.
- `npx vitest run tests/unit/voice-recording.test.ts tests/unit/p0-route-contracts.test.ts` passed: 2 files, 23 tests.
- `npm run test:unit` passed: 30 files, 186 tests.
- `npm run check` passed.
- `npm run build` passed, with the pre-existing Browserslist age, dynamic/static Firebase import, and chunk-size warnings.
- `git diff --check` passed.

Additional merge evidence:

- GitHub PR checks passed for head `e3f7d1029e301c69b04160fd83a106227b37bf9b`, including `unit`, `e2e_guest_smoke`, dependency audit, TruffleHog, and CodeQL checks.
- Wilson checked out PR #120 in the Replit workspace and ran `npm ci && npm run test:unit && npm run check && npm run build`; the Replit shell pass matched local evidence with 30 unit files / 186 tests passing and build warnings limited to known non-blocking Vite/Browserslist/chunk notices.
- Wilson also completed a scoped Replit happy-path smoke on the branch. Corner-case Replit checks were not run.

This slice increases deterministic route confidence but does not resolve EFF-017 and does not change the Replit-primary validation policy. Remaining accepted backlog items are provider-light live-cooking smoke, mocked provider-boundary happy paths, coverage reporting/ratcheting, and UI/accessibility guardrails. Live OpenAI output quality, ElevenLabs audio quality, Google linked-account login, prod OAuth-domain preflight, admin eval/prompt-versioning workflows, `storage.ts` integration, exhaustive corner-case Replit coverage, and Replit deployment behavior remain outside this branch's automated proof.

## 2026-06-02 — Provider-light live-cooking smoke branch started

Branch `codex/eff-017-live-cooking-smoke` started from current `origin/main` at `b66848881bc0d1c538258af8177892793aec521f` after PR #120 and PR #122 had merged. This branch implements the next accepted EFF-017 backlog item by extending the guest Playwright flow from prep tray into Live Cooking with `/api/cooking/steps` stubbed in the browser harness.

Current branch signal:

- The new smoke keeps `/api/recipes/pantry`, `/api/cooking/steps`, `/api/speech/synthesize`, `/api/speech/transcribe`, and `/api/cooking/assistance` provider-light through Playwright route stubs where relevant.
- It asserts the cooking-steps request payload, first-step rendering, next/back navigation, timer start/pause/resume controls, and ask-for-help fallback behavior when microphone access is unavailable.
- `client/src/components/cooking/live-cooking.tsx` gained an accessible timer play/pause label so the smoke can assert the actual user control instead of DOM structure.
- Local `npm ci`, focused Vitest, full unit suite, `npm run check`, `npm run build`, and `git diff --check` passed.
- Local DB-backed Playwright did not complete against the decrypted local `.env` database because `npm run db:health` reports missing `ai_interactions`, `prompt_versions`, `anonymous_recipe_usage`, and `cooking_sessions.recipe_snapshot`. Per EFF-010, this branch does not run `db:push` against that unknown local database; the GitHub E2E job's schema-only Neon branch is the expected automation evidence for the browser smoke.

This does not change the Replit-primary validation policy. Live OpenAI quality, ElevenLabs audio quality, Google linked login, prod OAuth preflight, real storage integration beyond the harness, full Replit deployment behavior, and exhaustive corner cases remain outside this branch.

## 2026-06-02 — PR #123 merged provider-light live-cooking smoke

PR #123 merged as `d0869ca52b30e07017c9325ff9034b842d8a59df`, completing the accepted provider-light live-cooking smoke backlog item from the PR #119 audit.

Merged coverage signal:

- The existing guest Playwright smoke now continues from Chef It Up prep tray into Live Cooking.
- The browser harness stubs `/api/cooking/steps` and provider-adjacent speech/help requests so the routine E2E gate does not call live OpenAI, ElevenLabs, transcription, or assistance providers.
- The smoke asserts cooking-step rendering, cooking-step request payload shape, basic `Next` / `Previous` behavior, timer start/pause/resume controls, and ask-for-help fallback UI when microphone access is unavailable.
- `client/src/components/cooking/live-cooking.tsx` exposes the timer play/pause control with an accessible label.

Evidence:

- GitHub checks passed at PR head `e4c915e9795e6c52ef1c191daff8f28a694d4215`, including the `e2e_guest_smoke` job on a disposable schema-only Neon branch.
- Replit shell validation at the same head passed `npm ci`, `npm run db:health`, `npm run test:unit`, `npm run check`, and `npm run build`.
- Replit shell Playwright remains unvalidated because Chromium cannot launch in the current workspace without the shared library `libglib-2.0.so.0`; `npx playwright install --with-deps chromium` cannot install apt-style system packages from the Replit shell. Treat this as a Replit workspace browser-dependency blocker, not as app-behavior evidence.

Current EFF-017 implication:

- The provider-light live-cooking smoke backlog item is complete.
- Remaining accepted backlog items are mocked provider-boundary happy paths, coverage reporting/ratcheting, and UI/accessibility guardrails.
- Replit remains primary for deployment-bound runtime validation until a separate ADR/PD changes validation authority. GitHub Actions is currently the reliable automated Playwright runner; Replit-shell Playwright should only become a dependency if the workspace's Chromium system dependencies are deliberately configured through Replit System Dependencies/Nix.

Still unvalidated by this slice: live OpenAI output quality, ElevenLabs audio quality, Google linked-account login, prod OAuth-domain preflight, real storage integration beyond the harness, full Replit deployment behavior, Replit Playwright browser behavior in the current workspace, and exhaustive corner cases.

## 2026-06-04 — Anonymous promotion CI retro: assign every gap to a lane

PR #126 (`codex/anonymous-google-promotion`) merged after the routine GitHub Actions gate passed: Dependency Audit, Secret Scan, typecheck/build/unit, and the guest E2E smoke on a disposable schema-only Neon branch. The same PR also needed Replit/manual evidence for Google promotion behavior, because the current CI lane intentionally avoids real Google OAuth and live provider identity.

The retro lesson is not "make CI cover everything." The stronger rule is: every important uncovered behavior should belong to a named validation lane with a clear reason and future automation path. Default PR CI should stay deterministic, provider-light, and privacy-forward; Replit/manual validation should shrink to the places where real environment, provider, identity, or human judgment still matters.

Useful lane assignments from PR #126:

| Gap | Preferred lane |
|---|---|
| Full Google popup/linking and existing-Google credential import | Replit human validation for now; do not make routine PR CI depend on real Google credentials or popup completion |
| Firebase/OAuth authorized-domain drift | Automated production-domain OAuth-start preflight, not full login completion |
| Existing-Google consent and merge policy | Unit/component coverage using mocked `credential-already-in-use` errors and local merge assertions |
| Guest recipe `#11` exact toast copy | Cheap Playwright forced-403 test that stubs `/api/recipes/pantry` with `LINKED_ACCOUNT_REQUIRED`; do not spend 10 real generations to reach the boundary |
| Replit/Firebase real runtime behavior | Targeted Replit validation when auth/provider/deployment behavior changes, until a later ADR/PD changes validation authority |
| Live OpenAI, Vision, and ElevenLabs quality | Separate live-provider canary or manual release smoke; keep the default PR gate provider-light |
| History non-import after conversion | Unit/route assertions for anonymous durable-write boundaries plus Replit/manual conversion validation until a deterministic linked dev-auth lane exists |

Near-term EFF-017 follow-ups from this retro:

1. Add a guest quota-copy Playwright test that forces the `403 LINKED_ACCOUNT_REQUIRED` response and asserts `Sign up before making more recipes.`
2. Add an OAuth-domain/config preflight that proves Google OAuth can start for the accepted production/Replit domain without completing real sign-in.
3. Design a deterministic linked-account dev-auth lane so CI can cover linked-user flows without relying on Google popup automation.
4. Keep live-provider canaries separate from default PR CI and record their evidence with the automation evidence report format.
