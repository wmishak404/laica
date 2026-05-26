# INIT-003 Phase 3 merge closeout

**Agent:** codex
**Branch:** `codex/init-003-merge-closeout`
**Date:** 2026-05-26
**Initiative:** INIT-003
**INIT updated:** yes

## Summary

PR #102 merged the INIT-003 Plan B public homepage + clean guest MVP slice, so the initiative has moved from Phase 3 implementation into the remaining production gates. This closeout records the merge, the Replit-validated SHA, the next resume point, and the local DB schema-drift evidence that appeared during anonymous-path smoke testing.

## Changes

- `initiatives/INIT-003-anonymous-trial-and-account-upgrade.md`
  - Marks Phase 3 complete via PR #102, merged as `515b7ec`.
  - Records Replit validation at `c952d13c9918356de2c5aaf31cb0dbde6f2d1824`.
  - Updates the current resume point to the remaining guest-MVP production gates: anonymous quota enforcement, anonymous kill switch, anonymous rate-limit identity, App Check posture, and upgrade-to-save boundaries.
  - Notes that local schema drift in `prompt_versions` / `ai_interactions` belongs to EFF-010 rather than blocking PR #102.
- `initiatives/registry.md`
  - Updates INIT-003's current phase and last signal after PR #102 merged.
- `efforts/effort-010-local-db-schema-strategy.md`
  - Adds the 2026-05-26 local smoke evidence: anonymous guest AI routes returned `200`, but optional prompt/eval tables were missing locally.
  - Reinforces that agents should not run `npm run db:push` from arbitrary local worktrees until the local DB ownership model is decided.
- `efforts/registry.md`
  - Updates EFF-010's last signal with the INIT-003 schema-drift evidence.

## Impact on other agents

Start remaining INIT-003 production-gate work from fresh `origin/main`, not from the merged PR branch. Replit remains authoritative for deployment-bound auth, DB-backed, provider-backed, AI, and speech behavior.

Before changing DB schema, local DB setup, or schema validation, read EFF-010. The local anonymous smoke showed that optional prompt/eval logging can degrade while still producing successful user-facing recipe/cooking responses, but the missing tables are still a real local-environment reliability problem.

## Open items

- Implement remaining guest-MVP production gates:
  - anonymous quota enforcement
  - anonymous kill switch
  - anonymous rate-limit identity
  - Firebase App Check posture
  - upgrade-to-save boundaries
- Keep anonymous Slop Bowl dry-run as follow-up scope unless Wilson explicitly pulls it into the next gate branch.
- INIT-001 Phase 4 still owns the Replit-discovered audio lifecycle acceptance item: leaving the cooking guide must stop active/queued voice playback, synthesis, recording, and hands-busy audio work.

## Verification

- PR #102 checks passed before merge:
  - CodeQL / Analyze
  - `npm-audit`
  - TruffleHog jobs skipped as configured
- PR #102 Replit validation:
  - Last Replit-validated at `c952d13c9918356de2c5aaf31cb0dbde6f2d1824`
  - Guest anonymous happy path, Google linked happy path, guest persistence, recipe suggestions, cooking guide entry, linked history/profile writes, and landing no-quota-pressure were validated by Wilson.
- Local unhappy-path support at `c952d13`:
  - `npx vitest run tests/unit/firebase-auth.test.ts tests/unit/auth-session-route.test.ts tests/unit/planning-choice.test.tsx tests/unit/live-cooking-guest-session.test.tsx`
  - no-auth API probes returned `401` for `/api/auth/session`, `/api/auth/google`, and `/api/user/profile`
- Closeout branch verification:
  - `git diff --check` passed

## Stack / base status

- Base refreshed: yes
- Current base: `origin/main` at `515b7ec`
- Last Replit-validated at: `c952d13c9918356de2c5aaf31cb0dbde6f2d1824` for merged PR #102
- Notes: This is a docs-only post-merge closeout branch created from fresh `origin/main` after PR #102 merged.
