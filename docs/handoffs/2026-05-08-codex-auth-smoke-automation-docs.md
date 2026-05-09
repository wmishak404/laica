# Authenticated smoke automation docs

**Agent:** codex
**Branch:** codex/automated-auth-smoke-docs
**Date:** 2026-05-08
**Initiative:** none
**INIT updated:** n/a

## Summary

Documented Wilson's desire to automate the authenticated browser validation that Phase 3.2 still requires manually. This is intentionally separate from the Phase 3.2 feature branch so the system-upgrade tangent can continue in another window without moving the validated feature target.

The existing home is [EFFORT-017](../../efforts/effort-017-environment-parity-and-ci-confidence.md), not a new epic. EFFORT-017 already tracks reducing manual Replit validation through environment parity, CI confidence, deterministic auth, and repeatable smoke paths.

## Changes

- `efforts/effort-017-environment-parity-and-ci-confidence.md`
  - Added the Phase 3.2 authenticated browser-smoke gap.
  - Recorded blockers: Firebase Google sign-in, deterministic test users/data, DB assertions/reset, live provider cost/flakiness, and the need to distinguish code-verified from browser-verified validation.
  - Added Chef It Up progressive staples as a candidate high-value smoke journey.
- `product-decisions/features/mobile-refresh/dev-test-harness.md`
  - Added a concrete Phase 3.2 Chef It Up smoke target for the future dev-test harness.
  - Preserves the accepted direction: dev-only Firebase custom-token or emulator-backed lane, not a backend auth bypass.
- `efforts/registry.md`
  - Updated EFFORT-017's last signal.

## Impact on other agents

Future automation work should start from EFFORT-017 and the dev-test harness note. The desired first concrete browser smoke is:

- deterministic `dev-test-*` user sign-in
- seed profile/pantry so Chef It Up has more than four missing staple candidates
- verify rolling queue, Added shelf, pending undo, saved-chip state, Back/cancel behavior, pantry persistence, duplicate prevention, and Ticket Pass completion
- decide whether recipe generation uses fixtures by default with a separate explicit live-provider smoke

Do not fold this into Phase 3.2 unless Wilson explicitly asks. Phase 3.2 still needs manual live-preview validation on its own branch.

## Open items

- Decide implementation approach: Firebase Auth Emulator vs dev-only custom-token lane for Replit/local/CI.
- Decide test DB strategy and reset API/script for deterministic users.
- Decide when live AI routes are exercised versus stubbed.
- Revisit after INIT-001 or when Wilson opens a dedicated automation/parity window.

## Verification

- Docs-only change.
- Run `git diff --check` before commit.

## Stack / base status

- Base refreshed: yes
- Current base: `origin/main`
- Last Replit-validated at: not applicable; docs-only backlog capture
