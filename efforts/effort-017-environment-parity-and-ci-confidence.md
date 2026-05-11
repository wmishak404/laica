# EFF-017 — Environment parity + CI confidence (reduce manual Replit validation)

**Former ID:** EPIC-017
**Status:** Deferred
**Owner:** Wilson / Codex / Claude
**Created:** 2026-05-05
**Updated:** 2026-05-08

## One-line summary

Capture the decisions + open questions required to make local + CI validation trustworthy enough that manual Replit validation is no longer the default merge gate.

## Context — why this exists

Today, LAICA uses a manual “Replit validation gate” because local macOS runs and Replit runs can diverge (runtime, env vars, database, OAuth domains, etc.). This creates friction and correctness ambiguity: “it worked locally” does not reliably imply “it will work on Replit deploy.”

This Effort exists to preserve the decision points and intended direction so we can resume after the current initiative work (INIT-001) without re-deriving this context from chat.

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

- Implementing automated tests / CI gates (deferred until after INIT-001).
- Changing `AGENTS.md` / ADR-0001 to remove the Replit validation gate (requires an explicit follow-up decision).
- Automating full Google OAuth popup completion with a real user account. The preferred direction remains a deterministic dev-only auth lane plus a separate production-domain OAuth preflight.

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
3. CI DB approach: Neon Local vs ephemeral Postgres vs other — and how schema health is enforced.
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

This Effort should remain `Deferred` until `initiatives/INIT-001-mobile-refresh.md` is complete.

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
