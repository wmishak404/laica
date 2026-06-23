# Dependabot NPM Patch Updates

**Agent:** codex
**Branch:** codex/dependabot-npm-patch-updates
**Date:** 2026-06-23
**Initiative:** none
**INIT updated:** n/a
**Resolves blocked handoff:** none

## Summary

This branch converts Dependabot PR #221 into a Codex-owned same-repo replacement so the patch dependency bundle can get meaningful required-check evidence. The update remains routine dependency maintenance, not security remediation: no open security advisory or Dependabot security PR was used as the basis for this work.

## Changes

- `package.json` updates the npm patch-version group from Dependabot PR #221, covering Radix UI primitives, Testing Library React, Vitest coverage/runtime packages, PostCSS, Tailwind typography, and the Replit runtime error modal plugin.
- `package-lock.json` refreshes the resolved dependency graph for that patch update bundle.
- `docs/handoffs/2026-06-23-codex-dependabot-npm-patch-updates.md` records the replacement-branch context and validation evidence.

## Impact on other agents

PR #221 should be treated as superseded once the replacement PR is open and passing. Keep the remaining Dependabot PRs separate:

- PR #222 is a broad minor-version package bundle and needs a later focused pass.
- PR #223 is a Neon provider-client major update and needs targeted DB/runtime evidence.
- PR #224 is an Express/runtime middleware update and needs server-route evidence.
- PR #225 is a TypeScript major update and needs toolchain-focused evidence.

Do not call this branch security remediation unless a future advisory or Dependabot security alert supports that classification.

## Open items

- Push this branch and open a replacement PR.
- Let same-repo CI run for exact-head evidence with the normal secret-backed `e2e_guest_smoke` lane.
- After the replacement PR is open, close Dependabot PR #221 as superseded rather than merging the bot branch.
- Continue with the other Dependabot PRs only as separate risk-domain slices.

## Verification

- `npm ci` passed and reported `found 0 vulnerabilities`.
- `npm run check` passed.
- `npm run build` passed with existing Browserslist/Firebase chunk-size warnings only.
- `npm audit --audit-level=high` passed with `found 0 vulnerabilities`.
- `git diff --check origin/main...HEAD` passed.
- `npx vitest run tests/unit/live-cooking-guest-session.test.tsx` passed: 1 file / 18 tests.
- First full `npm run test:unit` run found one transient failure in `tests/unit/live-cooking-guest-session.test.tsx`; the focused file passed immediately after, and a second full `npm run test:unit` passed: 44 files / 315 tests.
- Dependabot PR #221 GitHub checks before replacement: `unit`, `npm-audit`, and `trufflehog_pr` passed; `e2e_guest_smoke` failed at the secrets preflight because Dependabot PRs do not receive the required E2E secrets.

## Stack / base status

- Base refreshed: yes
- Current base: `origin/main` at `13c4982f9ae9e122e47573dd3481affb65893763`
- Last Replit-validated at: not applicable for routine dependency metadata update
- Notes: branch started from `origin/main` at `89ce14ff169ff9a2a721a615b42cd46c28fc1bf0`, cherry-picked Dependabot commit `007001ca06e19ca884b2ae7a7f95ee5a1c7d32b4`, then rebased after PR #220 moved `main` to `13c4982f9ae9e122e47573dd3481affb65893763`.
