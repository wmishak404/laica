# 2026-06-04 — Codex EFF-017 Linked Dev-Auth Merge Closeout

## Summary

PR #135 merged the first deterministic linked-account dev-auth CI lane. Future EFF-017 work can now build linked-user browser/API coverage on top of a Firebase custom-token path instead of relying on Google popup automation or a backend auth bypass.

## Merge

- PR: https://github.com/wmishak404/laica/pull/135
- Branch: `codex/eff-017-linked-dev-auth`
- Merge SHA: `545c00fa2dc695b9f0cadb6eb15d952c661fd2f4`
- PR head before merge: `73f2e7aa981afb5782e32d2afccd9408d16be50b`
- Closeout branch: `codex/eff-017-linked-dev-auth-closeout`

## Final Evidence

- Local evidence recorded in PR #135 and the pre-merge handoff:
  - focused Vitest for dev-auth route/Firebase helper passed
  - `npm run test:unit` passed, 33 files / 218 tests
  - `npm run check` passed
  - `npm run build` passed
  - `git diff --check` passed
  - Playwright discovery found the linked dev-auth smoke
- GitHub checks passed on PR head `73f2e7aa981afb5782e32d2afccd9408d16be50b`:
  - Dependency Audit / `npm-audit`
  - Secret Scan / `trufflehog_pr`
  - CI `unit`
  - CI `e2e_guest_smoke`
  - CodeQL `Analyze (actions)`
  - CodeQL `Analyze (javascript-typescript)`
  - GitHub Advanced Security `CodeQL`
- The `e2e_guest_smoke` job created a disposable Neon schema-only branch, applied schema, passed `db:health`, ran `E2E (guest + linked dev-auth smoke)`, reported `5 passed`, and deleted the Neon branch.

## Docs Updated

- `efforts/effort-017-environment-parity-and-ci-confidence.md`
- `product-decisions/features/mobile-refresh/pd-dev-test-harness.md`

## Still Unvalidated

This merge still does not validate live Google popup sign-in, anonymous-to-Google linking UX, Firebase Console authorized-domain state beyond the OAuth-start preflight lane, live OpenAI quality, ElevenLabs audio quality, full Replit deployment behavior, Replit-shell Playwright until Chromium dependencies are configured, or exhaustive corner cases.

## Suggested Next EFF-017 Lanes

- Build browser-level `signInWithCustomToken` setup/profile/settings/linked-flow coverage on top of the merged dev-auth lane.
- Keep live-provider canaries outside default PR CI and record evidence with the automation evidence report format.
- Continue coverage reporting/ratcheting and UI/accessibility guardrail planning as parallel-safe EFF-017 work.
