# PR #78 abandoned; Ticket Pass retry plan

**Agent:** codex
**Branch:** codex/mobile-refresh-phase-3-1-ticket-pass-plan
**Date:** 2026-05-15
**Initiative:** INIT-001
**INIT updated:** yes

## Summary

PR #78 is now closed as abandoned, and the durable Mobile Refresh docs no longer treat it as a half-successful Ticket Pass polish branch. The updated plan records that the branch failed for two opposite reasons at once: one pass was too incremental to count as a material Ticket Pass improvement, and a later overcorrection with fake illustration placeholders plus broken compact-ticket formatting was worse than the stable `main` baseline. The next attempt should restart from fresh `origin/main` with a much narrower layout-only brief.

## Changes

- `initiatives/INIT-001-mobile-refresh.md`: records PR #78 as closed/unmerged, updates the active branch/reference state, adds the rejection lessons to the initiative history and validation facts, and tightens the Phase 3.1 resume point to a layout-only Ticket Pass retry with explicit guardrails.
- `initiatives/registry.md`: refreshes INIT-001's last signal so future agents immediately see that PR #78 was abandoned and that the next attempt should preserve the current baseline while narrowing scope.
- `product-decisions/features/mobile-refresh/pd-phase-03-1-recipe-imagery.md`: changes Phase 3.1 status to active, adds a dated PR #78 abandonment section with concrete retry constraints and selected-ticket state examples, marks the Ticket Pass drift as not fixed, and records new negative constraints around fake illustrations and compact-layout regressions.
- `docs/handoffs/2026-05-15-codex-pr78-abandon-ticket-pass-plan.md`: captures this handoff.

## Impact on other agents

Do not resume `codex/mobile-refresh-phase-3-1-ticket-prep-polish`. That branch is historical only.

The next runtime attempt should start from fresh `origin/main` and keep these constraints:

- Preserve the current placeholder slot treatment; do not introduce fake bowl/noodle/skillet illustration placeholders.
- Preserve the current compact-row skeleton and readability as the minimum acceptable baseline.
- Preserve stable generated order, in-place expansion, and the display-only recipe-name split contract.
- Improve Ticket Pass through composition and silhouette around the existing content skeleton before touching real imagery work.
- Keep Prep Tray narrow in the same pass; do not broaden it into a new exploration until Ticket Pass is accepted.

## Open items

- Push this planning branch and review the docs diff before any new Ticket Pass implementation branch starts.
- The future runtime retry still needs a fresh implementation branch from `origin/main`; this planning branch should not become the runtime branch.
- No new Replit validation was run for this docs-only planning pass.

## Stack / base status

- Base refreshed: yes
- Current base: origin/main at `6a4ec60382d89338ffa8c672149b6410eda0518c`
- Last Replit-validated at: n/a - docs-only planning branch
- Notes: PR #78 is already closed. This branch exists only to make the abandonment and retry constraints durable on top of fresh `origin/main`.

## Verification

- Verified GitHub state for PR #76 and PR #78 before updating INIT references.
- Read current `origin/main` versions of INIT-001, the Phase 3.1 record, and the initiative registry before editing.
- `git diff --check`
