# Guest bottom-nav correction merge closeout

**Agent:** codex
**Branch:** `codex/pr156-postmerge-closeout`
**Date:** 2026-06-09
**Initiative:** INIT-003
**INIT updated:** yes

## Summary

PR #156 merged the INIT-003 guest bottom-nav correction. The merged behavior removes the unapproved guest-only `Save progress` shortcut from the bottom nav while preserving the existing app menu and planning reminder promotion paths.

This closeout updates the durable docs from fresh merged `main`: INIT-003 and PD-012 now record PR #156 as merged, the initiative registry points to the latest Phase 4 correction signal, and EFF-017's registry row points to the E2E workflow learning that came out of this validation pass.

## Changes

- `initiatives/INIT-003-anonymous-trial-and-account-upgrade.md` records PR #156 as merged, updates the Phase 4 table, adds the PR table row, records validation evidence, and adds the bottom-nav correction to the current resume point.
- `initiatives/registry.md` updates INIT-003's last signal to the PR #156 merge.
- `product-decisions/pd-012-public-anonymous-trial-and-account-upgrade.md` records the PR #156 merged correction and the workflow nuance that shipped with it.
- `efforts/effort-017-environment-parity-and-ci-confidence.md` records the final PR #156 E2E authority evidence and merge SHA.
- `efforts/registry.md` updates EFF-017's last signal to the ephemeral E2E lane and signup-continuation validation gap clarified by PR #156.
- `docs/handoffs/2026-06-09-codex-guest-bottom-nav-merge-closeout.md` captures this closeout.

## Impact on other agents

Use PR #156 / merge commit `492b3a6808dd088c430b49649ea3c4ef4bfde0ee` as the source of truth for the guest bottom-nav correction. Future guest-promotion work should keep the promotion available through the menu/planning surfaces unless Wilson explicitly approves adding a durable cross-functional navigation shortcut.

For E2E evidence on runtime branches, use the GitHub `e2e_guest_smoke` lane when available because it provisions a schema-only non-production Neon branch, applies the current schema, runs `db:health`, runs Playwright, and deletes the branch. Local dotenvx E2E against a decrypted `.env` database is diagnostic unless that `DATABASE_URL` points at an equivalent prepared non-production test database.

When a change touches signup-required moments, guest promotion, quota walls, or linked-account conversion, record whether the continuous guest-blocked -> sign-up/link -> continue journey is covered or remains an optional validation gap. Custom-token linked auth proves the linked destination state, not the full conversion journey by itself.

## Open items

- Replit validation for PR #156 was intentionally deferred until production push because the automated E2E gate was clean and the runtime change only removes an unapproved shortcut.
- Phase 5/later promotion planning remains unchanged: anonymous Slop Bowl dry-run and any user-consented guest current-cook or selected-cook History import are still future scope after INIT-001 Phase 5.

## Verification

- PR #156 merged: [#156](https://github.com/wmishak404/laica/pull/156)
- Merge commit: `492b3a6808dd088c430b49649ea3c4ef4bfde0ee`
- Last automated E2E head before squash: `1102c1f802787d48e6087d5563f151db2b1bb7f5`
- GitHub Actions at PR head `1102c1f`: unit/type/build passed, Dependency Audit passed, Secret Scan passed, CodeQL passed, and `e2e_guest_smoke` passed with 7 Playwright tests after schema push + `db:health` on an ephemeral Neon branch.
- Last Replit-validated at: not refreshed for PR #156; Wilson accepted deferring Replit to production push for this low-risk removal after clean automated tests.
- This closeout branch is docs-only; `git diff --check` passed before opening its PR.
