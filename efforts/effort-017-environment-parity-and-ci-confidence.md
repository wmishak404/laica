# EFF-017 — Environment parity + CI confidence (reduce manual Replit validation)

**Former ID:** EPIC-017
**Status:** In Progress
**Owner:** Wilson / Codex / Claude
**Created:** 2026-05-05
**Updated:** 2026-06-01

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
