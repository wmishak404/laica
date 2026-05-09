# Mobile Refresh Dev-Test Harness

**Status:** Planned
**Document kind:** Feature Phase Record
**Phase owner:** Wilson
**Date:** 2026-04-29
**Initiative:** [INIT-001 — Mobile Refresh](../../../initiatives/INIT-001-mobile-refresh.md)

## Goal

Make LAICA's development and Replit validation environment agent-testable without weakening production authentication or replacing the manual signed-in smoke required for PR #23.

Phase 2 exposed a repeatable validation gap: agents can run deterministic checks and unauthenticated browser smoke, but they cannot reliably drive Google popup sign-in. This note records the intended future harness so Phases 3-5 do not keep rediscovering the same blocker.

## Direction

### Real dev auth, not backend bypass

- The preferred path is a dev-only Firebase custom-token lane.
- The client should still sign in through Firebase, and protected API calls should still carry Firebase bearer tokens.
- The server must continue using Firebase Admin token verification for authenticated requests.
- A backend auth-bypass header is rejected as the default approach because it would test a different security contract than production.

### Strict dev-only gating

Any future harness must be unavailable unless all of these are true:

- the runtime is non-production
- an explicit opt-in env flag is enabled
- a secret test header or equivalent guard is provided
- the requested user is one of a small set of deterministic test users

The harness must never grant access to production users, real personal data, or arbitrary user ids.

### Hybrid test model

- Deterministic tests should use fixture data, seeded test users, and controlled API responses where that improves repeatability.
- Replit remains the authoritative service-backed validation environment.
- Live-service smoke for Firebase, Neon, OpenAI vision, ElevenLabs, speech, and persistence should be explicit rather than the default for every automated run.
- Paid-service calls must not happen unless the smoke command or validation checklist intentionally opts into them.

### Phase 3.2 Chef It Up smoke target

The Phase 3.2 progressive staples review showed the next concrete harness target. Code review and unit tests proved the state machine, but the merge gate still needed a human to run the authenticated Replit browser flow because agents could not complete Firebase Google sign-in.

Future automation should make this flow repeatable with a deterministic test user:

- sign in through a dev-only Firebase custom-token or emulator-backed lane, not a backend auth bypass
- seed a pantry/profile state that makes selected cuisines produce more than four missing staples
- verify the rolling staple queue, Added shelf, pending `+` + `X` chip undo, and saved green-check-only chip state in the browser
- submit and assert pantry persistence for the test user
- return and assert already-saved staples do not duplicate or re-save
- exercise Back during loading and confirm no late auto-advance
- complete to Ticket Pass with either controlled recipe fixtures for ordinary UI smoke or an explicit live-provider mode for OpenAI/Replit validation

### Data and schema boundaries

- No schema pushes should be part of the dev-test harness itself.
- Test users and seeded records should use obvious `dev-test-*` identifiers and non-personal placeholder data.
- Reset behavior should be deterministic so repeated agent smoke runs start from known `fresh`, `incomplete`, and `complete` user states.

## Non-Goals

- This does not change PR #23's validation gate. Phase 2 setup still requires manual signed-in smoke before merge.
- This does not approve implementation details, env var names, package scripts, or route names.
- This does not authorize a production auth bypass or a shortcut around Firebase token verification.
- This does not replace Replit's live-service validation gate for deployment-bound changes.

## Expected Future Implementation Shape

When implemented in a separate branch, the harness should include:

- a dev-only endpoint or command that mints Firebase custom tokens for deterministic test scenarios
- client/test tooling that signs in with `signInWithCustomToken`
- seed/reset support for fresh, incomplete, and complete profile states
- smoke coverage for authenticated routing, setup, settings, Chef It Up progressive staples, Slop Bowl quick-add, and protected API access
- a separate explicit live-service smoke path for camera/vision, recipe generation, speech, and persistence

## Effort Interactions

- [Testing and Acceptance Workflow](../../../docs/workflows/testing-and-acceptance.md): Adds concrete evidence for the app-wide testing strategy and local-vs-Replit validation matrix.
- EFFORT-010: Reinforces that schema pushes and database drift handling remain separate from feature smoke tooling.
- EFFORT-017: Owns the broader environment parity and CI confidence work that would let this harness reduce manual Replit browser validation later.
