# EFF-017 — Environment parity + CI confidence (reduce manual Replit validation)

**Former ID:** EPIC-017
**Status:** In Progress
**Owner:** Wilson / Codex / Claude
**Created:** 2026-05-05
**Updated:** 2026-06-10

## One-line summary

Capture the decisions + open questions required to make local + CI validation trustworthy enough that manual Replit validation is no longer the default merge gate.

## Context — why this exists

Historically, LAICA used a broad manual “Replit validation gate” because local macOS runs and Replit runs can diverge (runtime, env vars, database, OAuth domains, etc.). That created friction and correctness ambiguity: “it worked locally” did not reliably imply “it will work on Replit deploy.” The current policy narrows human Replit validation to risk-triggered PRs and release/batch checks while automation carries the routine PR merge gate.

This Effort exists to preserve the decision points and intended direction for the now-active CI harness path without re-deriving this context from chat. PR #109 merged the first additive CI foundation. As of the 2026-06-09 validation-authority update, automated evidence is the routine PR merge gate with explicit risk-lane exceptions; human manual Replit validation is targeted for higher-risk PRs and release/batch validation.

Primary spec / drift-vector inventory:
- `docs/workflows/environment-parity-spec.md`

Key external constraints (provenance):
- Replit SQL DB `DATABASE_URL` is app-scoped and cannot be used externally, so “use the same Replit DB from local” is not a viable parity strategy:
  - https://docs.replit.com/cloud-services/storage-and-databases/replit-database
- Replit has separate development vs production databases; publishing/deploy uses production DB:
  - https://docs.replit.com/cloud-services/storage-and-databases/create-production-database-when-publishing
- Firebase Auth Emulator has environment-specific token handling; local/CI auth setup must stay isolated from production:
  - https://firebase.google.com/docs/emulator-suite/connect_auth
- Firebase OAuth redirect domains: whitelisting is domain-based (any port on that domain):
  - https://support.google.com/firebase/answer/6400741?hl=en
- Identity Platform can generate authorization URIs for configured identity providers, which is useful for a production-domain start preflight:
  - https://cloud.google.com/identity-platform/docs/reference/rest/v1/accounts/createAuthUri
- Node 20 is EOL 2026-04-30; Node 22 is supported until 2027-04-30:
  - https://github.com/nodejs/Release

## Scope

### In scope

- Define minimal parity invariants (runtime + install + env contract + DB schema parity + auth parity).
- Define what CI must prove so “passes in CI” implies “safe to deploy to Replit” (with explicit exceptions).
- Define how local/CI can use deterministic auth while still ensuring production Google sign-in does not silently break.
- Define DB parity where schema and semantics are identical but instances/users/data differ per environment.
- Define a repeatable authenticated browser-smoke path for high-value flows where code review and unit tests are not enough, such as Chef It Up pantry persistence and live recipe generation.

### Out of scope (for now)

- Further broadening agent merge authority for code/security/product PRs beyond explicit human merge instructions.
- Automating full Google sign-in popup completion with a real user account. The preferred direction remains a deterministic dev-only auth lane plus a separate production-domain identity-provider preflight.
- Treating any one harness lane as proof of full app coverage; automation remains evidence that must be reasoned from, with negative scope and risk lanes.

## Decisions made so far

These are recorded from discussion; they are not yet implemented repo-wide.

1. **Parity definition target:** Behavioral parity (same semantics/contracts), not bitwise OS parity.
2. **Runtime direction:** Standardize on Node 22 LTS (Node 20 is EOL as of 2026-04-30).
3. **DB parity stance:** Different DB instances/users/data per env is OK; schema + migration posture must match.
4. **Local/CI auth lane:** Prefer deterministic local/CI auth that does not depend on real user credentials.
5. **“Real login works” definition:** Prefer an automated production-domain identity-provider start check, not an automated full Google sign-in completion (avoid test-account credential/2FA brittleness).
6. **Authenticated browser-smoke target:** Future automation should cover actual UI state transitions, DB persistence/no-duplicate assertions, and provider-route completion for selected high-value flows. Code review alone is not a substitute for these browser/environment checks.
7. **Validation-authority shift:** Routine PRs use automated evidence as the primary merge gate when the PR records claim, provenance, reasoning, negative scope, and risk lane. Human manual Replit validation is no longer the default PR gate; it is required before merge only for higher-risk/cross-functional work, uncovered live-service seams, weak/skipped automation, or explicit Wilson request. Low-risk PRs can defer human Replit checks to a batched release/pre-production pass. Future automated Replit-environment checks are a desired PR gate lane once their setup and evidence standard are accepted.

## Open questions

1. Which domain(s) are “production hostnames” for the identity-provider preflight gate?
   - Replit deployment domain(s) only vs custom domain only vs both
2. Should the preflight gate run on every PR merge, only on release, or as a nightly canary?
3. What DB strategy beyond PR #109's schema-only Neon branches is needed for local agent validation and future smoke coverage?
4. Which automated Replit-environment checks should become per-PR CI gates first, and what secrets/environment isolation do they require?
5. Which smoke journeys are the first automation targets?
   - Candidate from Phase 3.2: authenticated Chef It Up progressive staples, including staple queue UI, submit-time pantry write, duplicate prevention, loading Back/cancel, and Ticket Pass completion.
6. Should live AI recipe generation be part of every browser smoke, gated behind an explicit live-service flag, or replaced by a controlled fixture for most PR runs with a smaller provider canary?
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

The full CI-confidence objective remains broader than PR #109. The current active slice is follow-through on the additive harness: keep the routine PR gate deterministic and evidence-rich, expand accepted automated lanes where useful, and move remaining human Replit work into explicit risk-triggered or release/batch validation. Split future harness enhancements into separate PRs from `main`.

This Effort can be `Resolved` when all of the following are true:

1. CI/automation is the primary PR merge gate for correctness, with explicit human Replit exceptions documented.
2. Local + CI run a repeatable authenticated smoke path (emulator-based) and DB schema health checks.
3. A production identity-provider preflight gate exists and prevents authorized-domain regressions.
4. At least one high-value authenticated browser flow is automated end to end with deterministic test data, UI assertions, persistence/no-duplicate checks, and clear handling for provider calls.
5. `AGENTS.md` + ADR-0001 + testing/security workflows are updated so policy is consistent everywhere; EFF-010 remains the local DB/schema strategy companion.

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

- A dev-only deterministic auth lane that still sends Firebase bearer tokens to protected APIs.
- Deterministic `dev-test-*` users with resettable pantry/profile fixtures.
- Browser-level Playwright smoke for the Chef It Up progressive-staples flow.
- DB assertion/reset support scoped to test users so no-duplicate behavior can be proven safely.
- A controlled choice for recipe generation: fixture/stub for routine UI smoke, plus explicit provider smoke or canary when validating OpenAI/Replit provider integration.
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

- The guest-lane E2E job is intentionally gated on private GitHub configuration. Until that configuration exists, the guest-lane E2E smoke and schema-health path will be skipped in CI, so the confidence lift is limited to typecheck/build/unit.

This is an expected setup dependency, not a change in the Replit-authoritative validation policy.

## 2026-06-01 — PR #109 merged; EFF-017 reopened for harness follow-through

PR #109 merged to `main` as `3720c26`, making the CI automation harness a shipped additive foundation rather than a parked plan. EFF-017 is now `In Progress` because work, decisions, and validation are partially complete.

Do not create a new INIT for the immediate next step. The concrete follow-up belongs here: complete the required private GitHub Actions configuration so the guest smoke stops being skipped and produces real guest-lane plus schema-health evidence.

Open separate PRs from `main` for later harness improvements such as stubbed AI mode, selector hardening, provider canary workflows, production identity-provider preflight, or a stronger dev-auth lane. A policy change from Replit-primary to CI-primary validation requires a separate explicit ADR/PD.

## 2026-06-01 — First active E2E run proved config and exposed startup isolation bug

Wilson configured the required private GitHub Actions inputs after PR #109 merged. Re-running the `main` CI workflow confirmed the guest smoke no longer skipped: preflight checks passed, the workflow prepared an isolated schema-health environment, installed browser dependencies, and cleaned up afterward.

The run then failed while Playwright waited for the local web server because `server/routes.ts` eagerly constructed an OpenAI transcription client at module load. The guest smoke itself is intentionally neutral: it completes anonymous auth/setup and reaches the planning choice without calling paid AI providers. The correct follow-up is therefore a startup-isolation fix, not expanding the guest-smoke secret contract to require `OPENAI_API_KEY`.

Process lesson: the guest-lane smoke should stay privacy-forward and provider-light by default. Live OpenAI or transcription validation belongs in an explicit provider smoke/canary once that scope is deliberately accepted.

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

Open scope that remains outside the default merge gate until separately accepted: live OpenAI output quality, ElevenLabs audio quality, full Google linked-account login, production identity-provider preflight, admin eval/prompt-versioning workflows, `storage.ts` data-access integration, and Replit deployment behavior. These should become separate EFF-017 slices or INIT/PD work when their acceptance criteria are clear.

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

- GitHub PR checks passed for head `e3f7d1029e301c69b04160fd83a106227b37bf9b`, including the required test, dependency, secret, and static-analysis checks.
- Wilson checked out PR #120 in the Replit workspace and ran `npm ci && npm run test:unit && npm run check && npm run build`; the Replit shell pass matched local evidence with 30 unit files / 186 tests passing and build warnings limited to known non-blocking Vite/Browserslist/chunk notices.
- Wilson also completed a scoped Replit happy-path smoke on the branch. Corner-case Replit checks were not run.

This slice increases deterministic route confidence but does not resolve EFF-017 and does not change the Replit-primary validation policy. Remaining accepted backlog items are provider-light live-cooking smoke, mocked provider-boundary happy paths, coverage reporting/ratcheting, and UI/accessibility guardrails. Live OpenAI output quality, ElevenLabs audio quality, Google linked-account login, production identity-provider preflight, admin eval/prompt-versioning workflows, `storage.ts` integration, exhaustive corner-case Replit coverage, and Replit deployment behavior remain outside this branch's automated proof.

## 2026-06-02 — Provider-light live-cooking smoke branch started

Branch `codex/eff-017-live-cooking-smoke` started from current `origin/main` at `b66848881bc0d1c538258af8177892793aec521f` after PR #120 and PR #122 had merged. This branch implements the next accepted EFF-017 backlog item by extending the guest Playwright flow from prep tray into Live Cooking with `/api/cooking/steps` stubbed in the browser harness.

Current branch signal:

- The new smoke keeps `/api/recipes/pantry`, `/api/cooking/steps`, `/api/speech/synthesize`, `/api/speech/transcribe`, and `/api/cooking/assistance` provider-light through Playwright route stubs where relevant.
- It asserts the cooking-steps request payload, first-step rendering, next/back navigation, timer start/pause/resume controls, and ask-for-help fallback behavior when microphone access is unavailable.
- `client/src/components/cooking/live-cooking.tsx` gained an accessible timer play/pause label so the smoke can assert the actual user control instead of DOM structure.
- Local `npm ci`, focused Vitest, full unit suite, `npm run check`, `npm run build`, and `git diff --check` passed.
- Local DB-backed Playwright did not complete against the decrypted local `.env` database because `npm run db:health` reports missing `ai_interactions`, `prompt_versions`, `anonymous_recipe_usage`, and `cooking_sessions.recipe_snapshot`. Per EFF-010, this branch does not run `db:push` against that unknown local database; the GitHub E2E job's schema-only Neon branch is the expected automation evidence for the browser smoke.

This does not change the Replit-primary validation policy. Live OpenAI quality, ElevenLabs audio quality, Google linked login, production identity-provider preflight, real storage integration beyond the harness, full Replit deployment behavior, and exhaustive corner cases remain outside this branch.

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

Still unvalidated by this slice: live OpenAI output quality, ElevenLabs audio quality, Google linked-account login, production identity-provider preflight, real storage integration beyond the harness, full Replit deployment behavior, Replit Playwright browser behavior in the current workspace, and exhaustive corner cases.

## 2026-06-04 — Anonymous promotion CI retro: assign every gap to a lane

PR #126 (`codex/anonymous-google-promotion`) merged after the routine GitHub Actions gate passed, including typecheck/build/unit and the guest E2E smoke on a disposable schema-only branch. The same PR also needed Replit/manual evidence for Google promotion behavior, because the current CI lane intentionally avoids real Google sign-in and live provider identity.

The retro lesson is not "make CI cover everything." The stronger rule is: every important uncovered behavior should belong to a named validation lane with a clear reason and future automation path. Default PR CI should stay deterministic, provider-light, and privacy-forward; Replit/manual validation should shrink to the places where real environment, provider, identity, or human judgment still matters.

Useful lane assignments from PR #126:

| Gap | Preferred lane |
|---|---|
| Full Google popup/linking and existing-Google credential import | Replit human validation for now; do not make routine PR CI depend on real Google credentials or popup completion |
| Firebase/OAuth authorized-domain drift | Automated production-domain identity-provider preflight, not full login completion |
| Existing-Google consent and merge policy | Unit/component coverage using mocked `credential-already-in-use` errors and local merge assertions |
| Guest recipe `#11` exact toast copy | Cheap Playwright forced-403 test that stubs `/api/recipes/pantry` with `LINKED_ACCOUNT_REQUIRED`; do not spend 10 real generations to reach the boundary |
| Replit/Firebase real runtime behavior | Targeted Replit validation when auth/provider/deployment behavior changes, until a later ADR/PD changes validation authority |
| Live OpenAI, Vision, and ElevenLabs quality | Separate provider canary or manual release smoke; keep the default PR gate provider-light |
| History non-import after conversion | Unit/route assertions for anonymous durable-write boundaries plus Replit/manual conversion validation until a deterministic linked dev-auth lane exists |

Near-term EFF-017 follow-ups from this retro:

1. Add a guest quota-copy Playwright test that forces the `403 LINKED_ACCOUNT_REQUIRED` response and asserts `Sign up before making more recipes.`
2. Add an OAuth-domain/config preflight that proves Google OAuth can start for the accepted production/Replit domain without completing real sign-in.
3. Design a deterministic linked-account dev-auth lane so CI can cover linked-user flows without relying on Google popup automation.
4. Keep provider canaries separate from default PR CI and record their evidence with the automation evidence report format.

## 2026-06-02 — Provider-boundary happy-path coverage branch started

Branch `codex/eff-017-provider-boundary-happy-paths` started from fresh `origin/main` at `ab6cc77378ddc8e35b50a7423c8266773b772862` after the PR #123 and PR #124 closeouts had merged.
It was later rebased after PR #127 merged onto `origin/main` at `2aebd0f533e79fb8acbda76c7b0c4842512e5b08`, preserving the PR #127 CI gap-lane retro and keeping this provider-boundary slice scoped to mocked route coverage.
It was rebased again after PR #128 merged onto `origin/main` at `f46798d82c1b8ede22daab1368168fe5863f3dd4`; PR #128 was an INIT-003 checkpoint, so this branch's provider-boundary claim and Replit-not-required lane remain unchanged.

Current branch signal:

- Adds mocked route-level provider-boundary tests for `POST /api/cooking/steps`, `POST /api/speech/synthesize`, `POST /api/speech/transcribe`, and `POST /api/vision/analyze` in `tests/unit/provider-boundary-happy-paths.test.ts`.
- Keeps the routine gate provider-light by mocking `server/openai`, `server/elevenlabs`, and the direct OpenAI transcription constructor; the tests assert request validation, successful response shape, and provider payload/context without calling live OpenAI, ElevenLabs, transcription, or vision providers.
- Local `npm ci`, focused Vitest, full unit suite, `npm run check`, `npm run build`, and `git diff --check` passed. Build still reports the known Browserslist age, Firebase dynamic/static import, and chunk-size warnings.

This does not change the Replit-primary validation policy. Replit validation is not yet run for this branch, and live OpenAI quality, ElevenLabs audio quality, Google linked login, production identity-provider preflight, real storage integration beyond the harness, full Replit deployment behavior, Replit-shell Playwright until Chromium dependencies are configured, and exhaustive corner cases remain outside this provider-light proof.

## 2026-06-04 — Guest quota-copy forced-response branch merged

PR #125 merged as `82f49f782e69b08e57e091a72d3bbba10d7e5c65`, completing the mocked provider-boundary happy-path backlog item. PR #129 then merged as `9adc6d93c8445b4770713972607631a196b1d4c2`, documenting that Codex may mark its own complete draft PRs ready and monitor CI without expanding code merge authority.

Branch `codex/eff-017-guest-quota-copy-smoke` started from fresh `origin/main` at `9adc6d93c8445b4770713972607631a196b1d4c2` for the first near-term follow-up from the PR #126 retro: guest recipe `#11` copy coverage without spending ten real generations. PR #130 merged as `fc75ae0c50ab95b7de72195d4e146981055b81af`.

Current branch signal:

- Adds a forced-response Playwright case to `tests/e2e/cooking-workflow.test.ts`.
- Reuses the guest setup and Chef It Up planning path, stubs `POST /api/recipes/pantry` with `403 LINKED_ACCOUNT_REQUIRED`, and asserts the cap toast title/body: `Sign up to unlock more recipes` and `Sign up before making more recipes.`
- Keeps the routine gate provider-light; the test does not call live OpenAI, ElevenLabs, Google OAuth, transcription, or vision providers.
- Local `npm run check`, `npm run build`, `git diff --check`, and Playwright test discovery passed. Local focused Playwright execution did not reach app behavior: sandboxed `tsx` IPC failed with `EPERM`, and the unsandboxed isolated-port retry then failed at server startup because `DATABASE_URL` is not present in the local shell. GitHub Actions passed on the PR head, including the configured `e2e_guest_smoke` lane with disposable Neon schema-health setup and cleanup.

This does not change the Replit-primary validation policy. Live OpenAI quality, ElevenLabs audio quality, Google linked login, production identity-provider preflight, real storage integration beyond the harness, full Replit deployment behavior, Replit-shell Playwright until Chromium dependencies are configured, and exhaustive corner cases remain outside this forced-response proof.

## 2026-06-04 — PR #132 merged identity-provider preflight lane

PR #132 (`codex/eff-017-oauth-start-preflight`) merged as `26985d3a46a40857525a9ccb6992010d2c6c3b13` after starting from fresh `origin/main` at `040df3912d6b8f1463ff48f8bc5fc97c9e76b493`. This implements the next near-term lane from the PR #126 retro: prove Google sign-in can start for accepted production/Replit targets without automating full Google sign-in.

Merged signal:

- Adds a script and workflow that check whether a configured Google sign-in start path can produce an authorization URI for accepted HTTPS targets.
- Adds mocked unit coverage for skip/fail behavior, target validation, request/response shape, sanitized provider error reporting, and no raw target/key logging.
- Adds a separate GitHub Actions workflow with manual and scheduled entry points. It is intentionally separate from the routine PR CI gate and only runs the live preflight when the required private GitHub configuration is present.
- Extends `.env.example` with the preflight env contract.
- Required GitHub checks passed on the PR head.
- An automated security check flagged a logging issue on an early push; the merged version sanitizes logs, adds regression assertions that sensitive inputs are not logged, and passed the required check.

Parallel-safe next lanes:

- Deterministic linked-account dev-auth design is parallel-safe with this branch, but should read INIT-003 and the mobile-refresh dev-test-harness note before proposing how linked-user flows enter CI without Google popup automation.
- Provider canary planning is parallel-safe, but must remain outside default PR CI and should name exactly which OpenAI, Vision, ElevenLabs, and storage/provider seams it proves.
- Coverage reporting/ratcheting is parallel-safe conceptually, but may touch `package.json` or workflow files; coordinate branch order if this preflight PR is still open.
- UI/accessibility guardrails are parallel-safe conceptually, but should avoid editing the same Playwright helper surfaces if another EFF-017 browser-smoke branch is active.

This does not change the Replit-primary validation policy. It does not complete a Google login, link an account, prove production identity-provider state until private configuration is complete and the workflow runs, prove provider/audio/model quality, or validate Replit deployment behavior.

## 2026-06-04 — Linked dev-auth CI lane branch

Branch `codex/eff-017-linked-dev-auth` started from fresh `origin/main` at `559a7c10e483b2b77dd9766bf7db7286c3ce75b9` for the deterministic linked-account dev-auth lane from the PR #126 retro. PR #135 merged as `545c00fa2dc695b9f0cadb6eb15d952c661fd2f4`.

Merged signal:

- Adds a dev-only endpoint that mints Firebase custom tokens for allowlisted test users only when the private dev-auth guards prove the runtime is non-production and non-deployment.
- Seeds the deterministic linked test user through `storage.upsertUser` and returns a Firebase custom token with private no-store headers; it does not add a backend auth-bypass header to protected routes.
- Adds unit coverage for disabled, production/Replit deployment, missing secret header, malformed UID/email, unallowlisted UID, and successful seed/token behavior.
- Adds a Playwright API smoke that mints a custom token, exchanges it through Firebase Identity Toolkit, and calls `/api/auth/session` plus `/api/auth/user` with the resulting Firebase ID token.
- Extends the existing conditional GitHub E2E job to opt into dev-auth only inside the provider-light smoke lane; routine unit/typecheck/build CI and paid provider boundaries remain unchanged.

Local evidence on the branch: focused Vitest for the new route/helper passed, full `npm run test:unit` passed, `npm run check` passed, `npm run build` passed, `git diff --check` passed, and Playwright test discovery found the new Chromium smoke. Required GitHub checks passed on the PR head.

This does not change the Replit-primary validation policy. It does not complete Google popup sign-in, prove anonymous-to-Google linking UX, prove production authorized-domain state, validate live OpenAI quality, validate ElevenLabs audio quality, validate Replit deployment behavior, or replace Replit/human validation for third-party identity UI and full linked-account promotion flows.

## 2026-06-05 — Deterministic EFF-017 wrap-up branch started

Branch `codex/eff-017-deterministic-wrapup` started from fresh `origin/main` at `a6292f3527c6e0b39b894c901f1af83233e4779a` after PR #135 and PR #136 merged the linked dev-auth lane and its docs closeout.

Current branch signal:

- Extends the linked dev-auth lane from API-only Playwright into a browser-level linked-user smoke. The smoke signs in a deterministic test user through the Firebase Web SDK behind private dev-only guards, seeds a complete linked profile through protected APIs, drives Chef It Up, stubs `/api/recipes/pantry`, asserts the provider-light request payload, verifies recipe suggestions render, reads the linked profile back, and checks confirmed pantry staples persisted exactly once.
- Adds the first UI/accessibility guardrail with Playwright + axe for the landing auth surface: accessible button names, minimum 44 px tap targets, and no serious/critical WCAG A/AA axe violations on the scoped surface.
- Adds non-blocking unit coverage visibility through `npm run test:coverage` plus a CI coverage-summary artifact. This intentionally starts with visibility, not thresholds; thresholds should be added only after the measured baseline is accepted and ratcheting rules are explicit.
- Keeps routine CI provider-light. The branch does not add live OpenAI, ElevenLabs, transcription, vision, or Google popup completion to the default PR gate.

PR CI iteration signal:

- The first PR runs caught real guardrail value before merge: the new accessibility smoke flagged landing CTA contrast and keyboard focusability for the horizontal journey scroll region. The branch fixed those with a landing-specific button variant and visible focus treatment instead of weakening the guardrail.
- The linked browser smoke then reached the Chef It Up provider-light planning path and exposed a test-timing issue around pantry request capture. The smoke now waits for the actual `POST /api/recipes/pantry` request and asserts its submitted JSON payload directly, keeping the same behavior claim while avoiding route-handler timing as evidence.

Local evidence before PR:

- `npm install --save-dev @vitest/coverage-v8@4.1.8 @axe-core/playwright` completed and reported `found 0 vulnerabilities`.
- `npm run check` passed.
- `npm run test:unit` passed: 33 files, 218 tests.
- `npm run test:coverage` passed: 33 files, 218 tests, overall line coverage 65.18%.
- `npm run build` passed with the existing Browserslist age, Firebase dynamic/static import, and chunk-size warnings.
- `npm audit --audit-level=high` passed and reported `found 0 vulnerabilities`.
- `git diff --check` passed.
- Local secret-backed Playwright execution was not claimed as evidence: sandboxed dependency execution could not resolve the registry, and the escalated rerun was rejected because fetching/executing tooling while holding decrypted secrets was too risky. The shell also did not already have the required service environment. GitHub Actions remains the intended evidence lane for this browser smoke because the workflow has the configured private inputs and disposable schema setup.

Replit attempt before merge:

- Wilson loaded PR #138 in Replit and confirmed the checked-out head was `30d4d0f7c81c50a6c08fc3b73347c0ca0537f1c2`.
- Replit shell checks were blocked before app behavior: the package install path hit a Replit package-firewall blocker, so `npm run check` and `npm run build` did not have local shell tooling available afterward.
- The Replit env sanity check for the dev-auth browser guard passed without exposing the guard name in public docs.

EFF-017 is closer to resolution after this branch because the remaining deterministic backlog items are represented: high-value linked browser flow, coverage visibility, and initial UI/accessibility guardrails. It should still remain `In Progress` until the policy criteria are resolved: Replit-primary authority is still documented, provider canaries remain separate from default CI, and `AGENTS.md` / ADR-0001 / related testing policy docs have not been changed to make CI the primary correctness gate.

Still unvalidated by this slice: live OpenAI output quality, live `/api/recipes/pantry` provider response-contract drift because the smoke stubs recipe suggestions, ElevenLabs audio quality, full Google popup login/linking, production identity-provider state until the preflight workflow is configured and run, real storage integration beyond the disposable test harness, idempotency across repeated recipe submissions beyond the single-submit unique-staples assertion, full Replit deployment behavior, Replit-shell Playwright until Chromium dependencies are configured, and exhaustive corner cases.

## 2026-06-05 — PR #138 merged deterministic wrap-up; EFF-017 stays In Progress

PR #138 merged to `main` as `823b0758824e55bca6de5d203de5b841ba91843f` after final required GitHub checks passed at head `b252588aa7498d8949e0b0559c6b8b51c3abd00c`. The deterministic linked-user browser smoke, landing accessibility/tap-target guardrail, and non-blocking coverage visibility are now part of `main`.

Merged CI now covers linked dev-auth browser behavior with a real Firebase ID token plus disposable Neon persistence, but it does not automate full Google popup login or account linking. Routine CI remains provider-light: the browser smoke stubs `/api/recipes/pantry`, live OpenAI quality and response-contract drift remain outside the default gate, ElevenLabs audio quality is still unvalidated, and coverage remains visibility-only with no thresholds.

Wilson completed scoped Replit human smoke on the PR runtime content: Google sign-in, one recipe suggestion round, Live Cooking guidance, and Slop Bowl were green. Replit shell install/check/build did not complete because the package install path hit a Replit package-firewall blocker, leaving local shell tooling unavailable afterward. Replit env sanity confirmed the dev-auth browser guard was disabled. The font inconsistency observed during the same Replit smoke is intentionally not tracked in EFF-017 because it is being handled in another workstream.

Do not close or split EFF-017 yet. The remaining resolution work is policy and lane alignment: decide and document whether CI becomes the primary correctness gate with explicit exceptions, configure and run the identity-provider preflight rather than only shipping the lane, decide provider canary scope, decide coverage threshold/ratchet posture, and reconcile `AGENTS.md`, ADR-0001, and testing-policy language.

Still unvalidated or excluded: live provider response-contract drift, repeated-submit idempotency beyond the current single-submit unique-staples assertion, full Google popup login/linking, production identity-provider state until preflight runs, full Replit deployment behavior, Replit-shell Playwright, and exhaustive corner cases.

## 2026-06-05 — Identity-provider preflight run blocked by provider configuration

After PR #139 merged the PR #138 closeout to `main` as `b040952b2bc9635c99e0bea9889c1c19fede441f`, Codex manually dispatched the existing identity-provider preflight workflow on `main`.

Observed result:

- GitHub Actions configuration was checked through GitHub-owned settings surfaces; exact variable and secret names are intentionally not repeated in this public Effort file.
- The scheduled preflight still has no default target.
- The workflow installed dependencies successfully and then failed in the preflight command.
- The sanitized provider error indicated a configuration mismatch.

Reasoning and current inference:

- Google Identity Platform can create an authorization URI for a configured identity provider when the project/key setup matches.
- The failed run is therefore real negative evidence for the currently configured GitHub Actions preflight project/key alignment, not proof that full Replit Google sign-in is broken. Wilson's PR #138 Replit smoke still observed Google sign-in green.
- The likely configuration gap is project/key alignment for the production/Replit Firebase project. Exact key, variable, run, and provider-error details belong in GitHub Actions/Security or private maintainer notes.

Next smallest actions:

1. Decide the accepted preflight target set.
2. Configure the accepted target set in private GitHub repo settings.
3. Ensure the workflow uses credentials for the Firebase/identity-provider project where Google sign-in is enabled.
4. Rerun the preflight and record pass/fail evidence without copying exact security/config artifacts into public markdown.

## 2026-06-05 — Remaining EFF-017 items classified after deterministic wrap-up

With PR #138 merged and PR #139 merged as its closeout, the remaining EFF-017 work is no longer a single automation backlog. It separates into decision/config blockers and future implementation lanes:

| Remaining item | Current classification | Smallest next action |
|---|---|---|
| CI-primary merge authority | Human validation-policy decision | Do not edit `AGENTS.md`, ADR-0001, or `docs/workflows/testing-and-acceptance.md` to make CI primary until Wilson explicitly accepts the policy shift and its exceptions. |
| Identity-provider preflight | Blocked by GitHub/Firebase configuration | Resolve accepted target set and provider-enabled project/key alignment, then rerun the preflight. |
| Provider canary | Product/ops lane decision | Decide which seams belong in canary evidence: OpenAI recipe contract, Vision route contract, ElevenLabs synth/audio reachability, transcription route, and any storage/provider correlation. Keep canaries outside default PR CI unless explicitly accepted. |
| Coverage thresholds | Evidence-ratcheting decision | Use PR #138's non-blocking coverage as visibility first. Add thresholds only after the baseline and ratchet rule are accepted; do not turn the current 65.18% line baseline into a blocking gate by default. |
| Replit shell install/check/build | Replit package-install blocker | Resolve the package-install blocker or change the install path before treating Replit shell `npm ci`, `npm run check`, or `npm run build` as available evidence again. |
| Full Google popup/linking and Replit deployment behavior | Replit human/ops validation lane | Keep outside deterministic CI until a separate full-login automation or deployment preflight is accepted. |

This classification does not close or split EFF-017 yet. It narrows the next useful work: either resolve the identity-provider config blocker, write a canary-lane proposal/implementation branch, or ask Wilson for the validation-authority decision before touching policy docs.

## 2026-06-05 — Replit smoke caught planning profile-save auth churn

Wilson's short Replit smoke after PR #140 found a deployment-blocking Chef It Up edge case that routine CI did not catch: with a real Google-linked user, selecting a cuisine and adding new suggested staples before requesting recipes could return the UI to the "What are we cooking today?" planning-choice screen. The same flow proceeded when no new staples were added, and selecting cuisine alone also proceeded.

Observed Replit/browser signal:

- Replit shell `npm ci` and `npm run test:unit` passed on `main` after PR #140, so the prior package-firewall blocker did not reproduce in this shell.
- Browser/Replit logs showed `PUT /api/user/profile 200`, `POST /api/recipes/pantry 200`, intermittent `GET /api/auth/session 401`, and follow-up `POST /api/auth/google 200`.
- Browser console reported `AbortError: signal is aborted without reason` from the meal-planning active-generation cancellation path.

Current inference: saving planning-time staple additions invalidated `/api/auth/session`; with real Google auth in Replit, that auth-session churn could briefly unset/remount the app route while recipe generation was still in flight, aborting the request UI and returning to planning choice. The fix lane should keep ordinary profile/pantry mutations from invalidating auth session state; identity changes such as guest promotion remain separate.

EFF-017 implication: deterministic linked dev-auth CI is valuable but still does not replace real Replit/Google smoke for auth-session lifecycle behavior before production deploys. Future browser smoke should consider an assertion that profile saves during active generation do not remount the planning surface.

## 2026-06-05 — Replit smoke caught cooking-step context schema rejection

After PR #143 merged, Wilson's Replit light smoke reached Live Cooking through Chef It Up and found a new Start Cooking error: the client showed an AI error popup while console logs reported `POST /api/cooking/steps 400` and `Invalid cooking steps request`. The UI fell back to basic steps, but the route-level rejection meant the live cooking-step provider path was not actually validated for that Chef It Up recipe.

Current inference: the cooking-steps route reused the strict user pantry-item schema for generated recipe context. Chef It Up recipe outputs can pass richer ingredient/equipment strings into Live Cooking than hand-entered pantry values, so provider-boundary route coverage needs a fixture with descriptive generated context, not only short pantry item names.

EFF-017 implication: mocked provider-boundary coverage should include realistic model-shaped payloads from upstream user flows. Passing route tests with short strings did not fully cover the Chef It Up → Live Cooking contract.

## 2026-06-05 — Replit smoke caught active cooking remount state loss

While retesting the cooking-steps fix on the PR #144 branch, Wilson found a guest Chef It Up flow that entered Live Cooking briefly and then returned to the "What are we cooking today?" planning-choice menu with no user-facing error. Browser console showed `[vite] server connection lost` and `TypeError: Failed to fetch`, not the earlier `/api/cooking/steps 400`.

Current inference: the Replit dev server or client connection remounted while Live Cooking was loading. Live Cooking already persisted step/timer state, but the parent app held the selected recipe only in React memory. After a remount, the app could reload the complete guest profile and choose the default planning phase because there was no durable active cooking plan to restore.

EFF-017 implication: runtime confidence needs app-level remount/reconnect assertions in addition to route-contract tests. The PR #144 branch now adds a scoped active-cooking-plan restore guard and a guest remount unit regression; it still does not prove production outage behavior or replace Replit smoke for deployment-bound runtime behavior.

## 2026-06-05 — Replit refresh check caught Live Cooking step-tray reinitialization

Wilson then targeted the restore path directly by hard-refreshing during Live Cooking. The parent-level active-plan restore kept the recipe screen, but Live Cooking reinitialized the guide instead of restoring the existing generated step tray. A refresh near the final step could render the Live Cooking shell and controls without a current step card.

Current inference: the scoped cooking-session cache preserved `currentStepIndex`, timer, and running state, but not the generated provider steps/ingredients. Restoring progress without restoring the step list can replay the provider setup and can briefly or permanently leave the UI without a valid current step when the saved index and loaded steps disagree.

EFF-017 implication: remount/reconnect confidence needs component-level state restoration tests, not only parent-route tests. The PR #144 branch now persists generated steps/ingredients in the scoped cooking-session cache, restores them without re-calling `/api/cooking/steps`, clamps restored indexes to available steps, and adds a Live Cooking guest refresh regression.

## 2026-06-05 — Replit idle/auth-resync signal caught duplicate durable session start

Wilson later left the Replit app window open and observed Live Cooking activity resume several minutes after the original session. Replit logs showed `POST /api/auth/google`, `GET /api/user/profile`, speech synthesis, `POST /api/cooking/steps`, and `POST /api/cooking/session/start` at the later timestamp. The exact page state before the idle event was unknown, but the duplicate durable start signal was testable.

Focused unit reproduction confirmed that a linked user restoring a saved Live Cooking tray still created another durable cooking session because `cookingSessionId` was only in React memory. The PR #144 branch now persists durable cooking session id/start time in the scoped cooking-session cache, restores them when present, and suppresses a new `session/start` call for restored linked sessions even when older saved cache lacks an id.

EFF-017 implication: reconnect/idle confidence must cover provider route calls and durable write side effects separately. Preventing an empty UI or provider re-fetch is not sufficient if a remount can also create duplicate History-backed sessions.

## 2026-06-06 — PR #144 merged Chef It Up Live Cooking reliability fixes

PR #144 merged to `main` as `f9fb337e705626f8875dbd428a2e576119a905ea` after local tests, GitHub CI, and Wilson's Replit validation passed on head `5b5446248dab468082389436a0f01ca5cf5a519f`.

Final evidence:

- Focused unit slice passed: provider-boundary route, parent active-plan restore, Live Cooking step-tray restore, and no duplicate durable linked session start.
- Full local `npm run test:unit`, `npm run check`, and `npm run build` passed.
- GitHub CI passed with the required test, dependency, secret, and static-analysis checks.
- Replit validation covered guest Chef It Up into provider-backed Live Cooking, guest constraints, guest-to-existing-Google linking and profile merge, linked Chef It Up with added staples after cuisine selection, Live Cooking assistance, refresh restore at current/final steps, no duplicate `/api/cooking/session/start` or duplicate History entry, and completion/History behavior.

EFF-017 remains `In Progress`. PR #144 improved runtime confidence and added useful regression coverage for provider-boundary payload shape and remount/restore side effects, but it does not resolve the remaining EFF-017 policy/config work: CI-primary policy alignment, identity-provider preflight configuration/run, provider canary decisions, coverage threshold/ratchet posture, production identity-provider proof, and broader provider quality/eval coverage.

## 2026-06-09 — PR #156 clarified local DB drift vs ephemeral CI E2E authority

While validating the guest bottom-nav shortcut removal, local dotenvx-backed Playwright against the worktree `.env` database failed after anonymous auth because `/api/auth/session` correctly queried required quota state and the local configured database was missing `anonymous_recipe_usage`. `db:health` also found older drift for `ai_interactions`, `prompt_versions`, and `cooking_sessions.recipe_snapshot`.

This was useful system signal, not a product-code reason to weaken `/api/auth/session`: unknown or stale databases should fail loudly when required guest quota schema is absent.

The authoritative automated E2E lane for the PR then passed on GitHub Actions head `1102c1f`, and PR #156 merged as `492b3a6808dd088c430b49649ea3c4ef4bfde0ee`: `e2e_guest_smoke` created a schema-only Neon branch, applied the current Drizzle schema, passed `db:health`, ran Playwright, and deleted the Neon branch. The Testing and Acceptance Workflow now states this explicitly: use the ephemeral non-production Neon lane for merge-gate E2E evidence when available; treat local decrypted `.env` E2E as diagnostic unless `DATABASE_URL` is pointed at an equivalent prepared non-production test database.

## 2026-06-09 — Guest signup-continuation nuance added to post-E2E risk checks

The same PR discussion clarified a separate coverage nuance: Firebase custom-token dev auth is valuable because it tests the signed-in linked destination state without a brittle Google popup, but it does not automatically prove the continuous product journey where a guest hits a signup-required boundary, signs up or links, and then resumes the intended action/state with the right guest data preserved.

The Testing and Acceptance Workflow now asks agents to record that distinction after E2E when a change touches guest promotion, signup-required copy, quota walls, linked-only save boundaries, guest-to-linked conversion, or navigation into those surfaces. If routine CI proves the guest block and linked destination separately, the continuous guest-blocked -> sign-up/link -> continue journey should be listed as an optional but relevant validation gap, with the follow-up lane chosen by risk: targeted Playwright with dev auth, Replit human validation, or a future identity-provider/preflight check.

## 2026-06-09 — Human Replit validation moved from default PR gate to risk/release lane

Wilson accepted the validation-authority shift that EFF-017 had been working toward: human manual Replit validation should no longer be a default PR merge gate for every deployment-bound code change. Routine PR readiness should rely on documented automated evidence, exact-head CI/E2E status, and a lightweight risk lane. Human Replit validation remains required before PR merge only when risk warrants it: higher-risk/cross-functional changes, schema/secrets/deployment/runtime startup changes, auth/session/provider behavior not exercised by CI or accepted automated Replit-environment checks, weak/skipped automation, or explicit Wilson request.

Low-risk security or runtime-boundary fixes can now be batched so one targeted release/pre-production Replit pass covers several related patches. The PR/handoff should carry a compact risk annotation: risk lane, why the lane fits, exact evidence, deferred manual scope, and a future-bug breadcrumb. This keeps future debugging traceable without creating a new Effort or workflow note for every small hardening patch.

This does not resolve EFF-017. Remaining work is to turn more real Replit-environment checks into automated CI lanes, finish provider canary decisions, resolve identity-provider preflight configuration/targeting, and eventually decide coverage threshold/ratchet posture. The policy update reduces the human bottleneck now while preserving explicit manual gates where automation still cannot prove the relevant live-service behavior.

## 2026-06-10 — Replit package firewall blocker traced to deleted legacy auth dependency island

While preparing INIT-002 Phase 1 Replit observation, a clean Replit `npm ci` on the PR #159 head was blocked by Replit's package firewall at transitive `es5-ext@0.10.64`. The blocked package entered only through direct dependency `memoizee@0.4.17`, which was imported only by the unused legacy Replit OIDC/session file.

The cleanup branch deletes the legacy Replit auth file and removes the whole unused OIDC/session dependency island (`memoizee`, `openid-client`, `passport`, `passport-local`, `express-session`, `connect-pg-simple`, `memorystore`, and their local-only type packages). This is environment-parity hygiene: it restores clean-install viability without changing the active Firebase Auth path.

EFF-017 implication: Replit clean-install evidence can fail for dead dependency paths as well as active runtime code. Future Replit-environment automation should keep package-firewall failures as first-class install blockers, but agents should prefer deleting unused dependency islands over adding overrides when repo search proves the path is obsolete. `REPLIT_DOMAINS` remains part of the Vite development-host allowlist; legacy `SESSION_SECRET` / `ISSUER_URL` are no longer application contract variables.

## 2026-06-10 — Direct Replit shell/browser validation proved viable but not automated

PR #159 (`codex/init-002-phase-1-telemetry`) merged as `382ebd07f106ac241e2ed1caa69d34c46a66882c` after the final head `76b536170c5c47d7cb04016b3c4cae451544da3b` passed local checks, GitHub CI/E2E, and direct Replit shell/browser validation.

New EFF-017 signal:

- Replit shell validation can cover an exact PR head without Replit Agent: fetch the branch, switch detached to the reviewed SHA, run `npm ci`, `npm run check`, `npm run build`, and `npm run test:unit`, then record the observed package count, test counts, and warnings.
- Replit browser validation through Chrome can complete a real Google sign-out/sign-in loop using the existing account chooser without entering credentials or 2FA. For PR #159, selecting `wilson@ishak.net` returned to authenticated app state and the menu confirmed `Wilson Ishak · wilson@ishak.net`.
- Replit request checks can prove environment-specific headers and auth boundaries. PR #159's direct curl checks showed server-generated `X-Request-Id` values on real `/api/*` `401` responses and proved a client-supplied request id was overwritten.
- Replit Agent is not required for these checks and remains approval-required because of credits.

This narrows the old negative scope around Replit access and install viability, but it does **not** create an accepted automated Replit-environment gate. The lane is still manual/direct through Chrome and shell, with evidence recorded in the PR body or handoff. It also does not prove production deployment behavior, identity-provider preflight configuration, live OpenAI/ElevenLabs/Vision/transcription canaries, AI output quality, or broader provider failure telemetry. Future automated Replit-environment work should turn this pattern into a repeatable script/workflow before treating it as a merge gate.

## 2026-06-10 — Test and CI audit reconciliation after PR #159/#164

Codex and Claude ran parallel audits of the current test and CI posture, then reconciled the findings after PR #159 merged as `382ebd07f106ac241e2ed1caa69d34c46a66882c`. The active automated suite is healthy and current: PR #159 added request-id and AI-error telemetry coverage, and its final head `76b536170c5c47d7cb04016b3c4cae451544da3b` passed GitHub `unit`, `e2e_guest_smoke`, dependency audit, secret scan, and CodeQL. The post-merge `main` CI run for `382ebd0` also passed `unit` and `e2e_guest_smoke`.

The audit did not find stale active tests. Recent runtime changes have generally shipped with same-branch regression coverage, including the Replit-smoke bugs around profile-save auth churn, model-shaped cooking-step payloads, remount restore, duplicate durable session starts, stale prep-plan invalidation, speech upload MIME hardening, feedback private headers, and guest bottom-nav correction. The old `voice-recording.test.ts` copied-logic problem has been fixed; the test now imports the shipping helper.

The current weakness is enforcement and measurement, not the existence of tests:

| Item | Current classification | Smallest next action |
|---|---|---|
| Required CI checks | Repo setting / governance gap | The `unit` and `e2e_guest_smoke` jobs already run and pass in normal same-repo CI, but they should also be mechanically required for protected merges. This is a GitHub settings/ruleset action, not a code-test change. Treat skipped or missing E2E evidence as a blocker, not as a pass. |
| Coverage denominator | Measurement-integrity gap | Before adding thresholds, make coverage include all intended shipped source files, including currently unimported or fully mocked files. Coverage should remain evidence about exercised code, not a substitute for behavior tests or E2E claims. |
| Coverage thresholds | Evidence-ratcheting decision | After the denominator is honest, record the baseline and ratchet rule. Do not promote the current visible coverage percentage into a blocking threshold until the denominator and policy are accepted. |
| OAuth start preflight | Configured scheduled canary lane | The workflow runs against a masked accepted target set after the GitHub Firebase API key was aligned with the working Firebase Browser key. This lane proves Google OAuth can start for accepted production/Replit domains without automating full popup completion. It complements, but does not replace, linked dev-auth CI or Replit/Chrome full-login validation. |
| Direct Replit shell/browser evidence | Proven manual lane | PR #159 proved exact-head Replit shell checks and Chrome browser sign-in validation are viable without using Replit Agent. Keep using this for risk-triggered PR evidence, but do not call it an automated Replit-environment gate until a reusable workflow/script, setup, evidence report, and negative scope are documented and accepted. |
| Old root test artifacts | Cleanup candidate | `test-runner.js`, `run-tests.sh`, `test-criteria.md`, and `test-criteria-template.js` describe an older ad hoc testing path and should be removed or rewritten to point at the current `npm run test:*`, `db:health`, E2E evidence, and risk-lane workflow. |
| Dead or dormant code | Coverage clarity candidate | Audit and remove confirmed-dead code before treating "cover everything" metrics as meaningful. Examples to verify before deletion include `server/localAuth.ts`, old pages, disabled grocery surfaces, and orphaned cooking components. Keep live surfaces such as `cooking-history.tsx` separate from dead-code cleanup; they need tests, not deletion. |
| Live but thinly tested surfaces | Targeted coverage backlog | Add focused coverage for `cooking-history.tsx`, broader `useAuth` behavior, broader `live-cooking.tsx` behavior, and admin/eval routes when INIT-004 moves from planning into implementation. |

The direct Replit validation lane recorded above is a useful middle lane between GitHub CI and Wilson-only smoke. It can now produce stronger PR-level evidence without spending Replit Agent credits. It still does not prove production/deployed Replit behavior, identity-provider preflight configuration, live OpenAI/ElevenLabs/Vision/transcription canaries, storage integration against a real non-disposable DB beyond the validated shell/browser path, or AI output quality. It also does not replace the GitHub `e2e_guest_smoke` requirement for every pushed implementation head intended for review or merge.

EFF-017 remains `In Progress`. The next highest-leverage actions are: mechanically require the routine correctness checks in GitHub settings, make coverage measurement honest before thresholds, configure and rerun the OAuth preflight lane, clean up stale root test artifacts and confirmed-dead code, and then add targeted coverage for live-but-thin surfaces.

## 2026-06-10 — Approved audit fixes started after PR #159/#164 rebase

Wilson approved the first three reconciliation items from the test/CI audit: require the core GitHub checks, make the coverage denominator honest before thresholds, and fix/configure the OAuth start preflight so it actually runs. The implementation branch was rebased onto fresh `origin/main` after PR #159 and PR #164, preserving the PR #159 direct Replit validation signal and the PR #164 INIT closeout.

Current implementation signal:

- The protected GitHub ruleset now requires `unit` and `e2e_guest_smoke` alongside the existing security/dependency checks. Raw ruleset API payloads and exact settings evidence were kept out of public markdown and recorded in a local-private evidence note instead.
- Vitest coverage now includes intended shipped source globs across `client/src`, `server`, `shared`, and `scripts` before any thresholds are proposed. Coverage remains non-blocking measurement evidence, not a replacement for behavior-specific happy-path, corner-case, and non-happy-path tests.
- The OAuth start preflight now has a masked accepted target set, a scheduled canary trigger, and manual dispatch for targeted checks. Missing or rejected config is visible when manually dispatched, while public logs hide raw target URLs, API keys, and provider diagnostics by default.
- Manual dispatch passed after GitHub's production OAuth preflight key was aligned with the working Firebase Browser key. That exposed that the E2E custom-token lane must stay on the separate `laica-ci-test` Firebase project, so the branch now splits CI Firebase secrets (`CI_FIREBASE_*`) from production/provider OAuth preflight secrets (`OAUTH_PREFLIGHT_*`).
- After the split-secret commit, GitHub `unit`, `e2e_guest_smoke`, security/dependency checks, CodeQL, and manual OAuth Start Preflight all passed on the same pushed head.
- A local/private diagnostics opt-in exists for OAuth provider errors, but it must not be enabled in public GitHub workflows. Exact CI/ruleset/provider evidence belongs under the security due-diligence private-evidence rule.

This does not close EFF-017. Remaining follow-up still includes root test-runner artifact cleanup, dead-code sweep, coverage baseline/ratchet decision after the honest denominator is measured, Replit-specific OAuth target decisions, provider canary scope, production/deployment proof, and targeted tests for live-but-thin surfaces as those areas are touched.
