# Efforts Hygiene and Implementation Loop

**Agent:** codex
**Branch:** `codex/efforts-hygiene-implementation-loop`
**Date:** 2026-06-18
**Initiative:** none
**INIT updated:** n/a

## Summary

This branch turns Wilson's revised Daily Efforts automation from a loose "audit, then pick something" instruction into an explicit hygiene-plus-implementation workflow. The important coordination change is that `Open` and `In Progress` Efforts are now defined as the active implementation pool only after hygiene checks pass: agents must first reconcile active lists, open PRs, recent/blocked handoffs, INIT ownership, and mirror drift before choosing a PR-sized slice.

The audit also found two concrete misses in the current state: `EFF-027` was added to the Efforts README/registry by PR #192 but had not been mirrored into `AGENTS.md` or `CLAUDE.md`, and an older Efforts hygiene PR (#183) had been left open from 2026-06-15. This branch fixes the first-contact mirror drift and documents that future automation runs must inspect/update/close stale Efforts PRs before creating new ones. PR #183 was later closed and superseded by PR #197, which carried forward the still-useful factual hygiene fixes.

## Changes

- `docs/workflows/effort-system-audit.md`
  - Adds open-PR and blocked-handoff checks before new Efforts work begins.
  - Adds failure modes for orphaned Effort PRs, hygiene-only loops, priority-by-vibes selection, and `In Progress` ownership confusion.
  - Defines active Effort, implementation candidate, PR-sized slice, and evidence-backed priority.
  - Replaces the old docs-only weekly automation prompt with the daily hygiene-plus-implementation prompt.
- `efforts/README.md`
  - Adds the active work loop and tightens `Open` / `In Progress` status definitions.
- `product-decisions/pd-007-effort-status-and-registry-workflow.md`
  - Records the 2026-06-18 accepted interpretation for Efforts automation and implementation authority boundaries.
- `AGENTS.md` and `CLAUDE.md`
  - Add `EFF-027` to the active Effort mirrors.
  - Add the first-contact rule for recurring Efforts hygiene/implementation runs.

## Impact on other agents

Future recurring Efforts runs should not create a fresh hygiene branch until they have inspected open Effort PRs and recent hygiene branches. PR #183 is the example that prompted this rule: it predated `EFF-027` and current `origin/main`, then was closed and superseded by PR #197 rather than merged unchanged.

When the automation chooses implementation work, the handoff and PR should include a short `Hygiene result` and `Effort implementation choice` so reviewers can see why that Effort was selected.

## Open items

- The Codex app automation update was submitted as a suggested update, not silently applied, because the automation uses a worktree setup config path and the app requires review for that update mode.
- PR #183 has been closed as superseded by PR #197.
- The EFF-017 OAuth-preflight blocker remains documented in `docs/handoffs/2026-06-05-codex-eff-017-oauth-preflight-blocked.md`; this branch does not unblock it.

## Verification

- Reviewed current automation config and memory under `$CODEX_HOME/automations/efforts-hygiene`.
- Viewed the existing `efforts-hygiene` automation card and submitted a suggested prompt update through the Codex app.
- `gh pr view 183 --json ...` originally confirmed PR #183 was open and waiting on review/update; it was later closed as superseded by PR #197.
- `gh pr list --state open --limit 40 --json ...` originally confirmed open PRs #191, #186, and #183.
- `rg --files docs/handoffs -g '*blocked.md'` found the known EFF-017 OAuth-preflight blocker.
- `rg -n "effort-0(10|17|22|25|27)|EFF-0(10|17|22|25|27)|Status:|Current active Efforts|Active Effort Read List" efforts/README.md efforts/registry.md AGENTS.md CLAUDE.md` confirmed `EFF-027` is now mirrored in the first-contact agent docs.
- `rg -n "remains open|still active|active Effort|current active|active Effort read list|keep EFF-|keeps EFF-" initiatives product-decisions docs/workflows efforts AGENTS.md CLAUDE.md` was reviewed; the actionable Mobile Refresh EFF-017 wording was carried forward by PR #197 and is no longer open in PR #183.
- `git diff --check` passed.
