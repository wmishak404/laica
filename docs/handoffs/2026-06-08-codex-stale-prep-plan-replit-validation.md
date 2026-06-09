# Stale Prep Plan Replit Validation Signal

**Agent:** codex
**Branch:** codex/deferred-stale-prep-plan-effort
**Date:** 2026-06-08
**Initiative:** none
**INIT updated:** n/a

## Summary

Wilson reported Replit validation signal for PR #149 after testing guest and signed-in flows plus a pantry change during the prep-tray decision point. The core stale-session bug did not reproduce: the app did not resume the previous stale session, and History did not record the prep-tray decision as a session until cooking actually started.

## Changes

- `efforts/effort-026-stale-prep-plan-invalidation.md`: records Wilson's Replit validation signal and remaining narrow validation gaps.
- `efforts/registry.md`: updates EFF-026's last signal with the Replit smoke result.
- PR #149 description should be updated with the same validation provenance.

## Impact on other agents

- Treat `3180c17bd6c8cb4309ce7354559102005a0c8464` as Wilson-Replit-smoked for the reported guest/signed-in stale-session and history behavior.
- Do not mark EFF-026 `Resolved` yet unless the remaining hard-refresh and unchanged-profile restore checks are also validated or Wilson explicitly accepts them as out of scope.

## Open items

- Explicit hard refresh after pantry changes.
- Explicit unchanged-profile Live Cooking refresh to confirm PR #144 restore reliability still holds in Replit.
- Pantry reset/delete/add variants if Wilson's mid-prep-tray pantry change did not cover those exact saved-change paths.

## Verification

- Source provenance: Wilson chat report on 2026-06-08.
- Claimed behavior: guest and signed-in flows did not resume a previous stale session after pantry change during the prep-tray decision; History did not record a cooking session until cooking actually started.
- Command/check provenance: Replit UI smoke by Wilson, no local commands in this follow-up docs pass.
- Observed result: stale session did not resume in the tested flows; History behavior matched the intended active-vs-started boundary.
- Reasoning: the observed behavior exercises the new profile-basis invalidation and scoped cache clearing at the user-visible bug boundary.
- Negative scope: hard-refresh-after-change and unchanged-profile Live Cooking refresh were not explicitly included in Wilson's report.

## Stack / base status

- Base refreshed: yes
- Current base: `origin/main` at `ba924d6ad0f7ef0906d967a25ecb95fd7319da88`
- Last Replit-validated at: `3180c17bd6c8cb4309ce7354559102005a0c8464` for the reported flows only
- Notes: docs-only validation-record update on top of PR #149's implementation branch.
