# Stale Prep Plan Hard-Refresh Validation Signal

**Agent:** codex
**Branch:** codex/deferred-stale-prep-plan-effort
**Date:** 2026-06-08
**Initiative:** none
**INIT updated:** n/a

## Summary

Wilson reported that the Replit hard-refresh validation passed for PR #149: after generating/viewing a prep tray from old pantry contents, changing and saving Pantry to new contents, and refreshing the app, the old prep tray/session did not come back.

## Changes

- `efforts/effort-026-stale-prep-plan-invalidation.md`: records the hard-refresh validation signal and narrows remaining validation.
- `efforts/registry.md`: updates EFF-026's last signal.
- PR #149 description should be updated with this Replit validation signal.

## Impact on other agents

- Treat stale-plan hard refresh after pantry change as Wilson-Replit-smoked for PR #149.
- EFF-026 remains `In Progress` unless unchanged-profile Live Cooking refresh is validated or Wilson accepts it as out of scope.

## Open items

- Explicit unchanged-profile Live Cooking refresh to confirm PR #144 restore reliability still holds in Replit.
- Pantry reset/delete/add variants if Wilson's mid-prep-tray pantry changes did not cover those exact saved-change paths.

## Verification

- Source provenance: Wilson chat report on 2026-06-08.
- Claimed behavior: old prep tray/session did not return after pantry save plus browser hard refresh.
- Command/check provenance: Replit UI smoke by Wilson, no local commands in this docs-only validation-record pass.
- Observed result: stale prep tray/session did not come back after hard refresh in the tested flow.
- Reasoning: this directly exercises the browser persisted-state boundary that caused stale active plans to survive reloads.
- Negative scope: unchanged-profile Live Cooking restore was not explicitly included in Wilson's selected hard-refresh report.

## Stack / base status

- Base refreshed: yes
- Current base: `origin/main` at `ba924d6ad0f7ef0906d967a25ecb95fd7319da88`
- Last Replit-validated at: Wilson-reported for hard-refresh stale-plan behavior; runtime code SHA remains `3180c17bd6c8cb4309ce7354559102005a0c8464`
- Notes: docs-only validation-record update on top of PR #149's implementation branch.
