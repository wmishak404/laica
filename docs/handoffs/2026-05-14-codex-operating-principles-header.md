# Workflow operating principles header

**Agent:** codex
**Branch:** codex/workflow-operating-principles
**Date:** 2026-05-14
**Initiative:** none
**INIT updated:** n/a

## Summary

Wilson's operating principles are now a top-level workflow entrypoint instead of being implied by scattered lower sections. This docs-only change adds a canonical operating-principles workflow, places a concise reminder at the top of the master agent/Replit files and every workflow document, and records that future workflow docs must include the same reminder.

## Changes

- `docs/workflows/operating-principles.md` created as the canonical source for evidence-first work, visible rationale/provenance, first-principles feedback, no duplicate paths or half-migrations, deletion of obsolete paths, explicit decision capture, and blocking reports.
- `AGENTS.md`, `CLAUDE.md`, and `replit.md` now open with a concise Operating Principles reminder that links to the canonical workflow.
- All `docs/workflows/*.md` files now include the reminder near the top. The new canonical workflow carries its own reminder section rather than a self-link.
- `docs/workflows/documentation-routing.md` now says every future workflow doc must include the reminder immediately after its title.
- Blocking report storage is now explicit: current response for immediate visibility, dated `docs/handoffs/*-blocked.md` for durable resume context, PR description when applicable, and owning INIT/Effort/phase/PD/workflow docs only when the blocker changes durable state.
- Blocker discovery is now explicit: agents check related `docs/handoffs/*-blocked.md` reports when starting or resuming work, unblock what they can safely unblock, and record resolutions without deleting the original blocked handoff.
- Duplicate audit kept the lower mechanics/examples that still add value: Documentation foundation rules, Claude's blocked handoff protocol, Documentation Routing's source-of-truth guidance, Effort Audit's no-redundancy checks, and Environment Parity's provenance examples.

## Impact on other agents

Start workflow and master-doc reading from the top reminder, then use `docs/workflows/operating-principles.md` for the full standard and examples. When creating a new workflow doc, include the same concise reminder immediately after the title before adding workflow-specific mechanics.

## Open items

No product, runtime, Replit, INIT, or Effort follow-up is required. This branch still needs normal PR review/merge handling before the reminder is visible on `main`.

## Verification

- `git diff --check` passed.
- `rg -l "^## Operating Principles" AGENTS.md CLAUDE.md replit.md docs/workflows/*.md` confirms the reminder/header exists in the three master files and all workflow docs.
- `rg -n 'Every new \`docs/workflows/\*\.md\` file must include|new \`docs/workflows/\*\.md\`' docs/workflows/documentation-routing.md` confirms the future-workflow rule exists.
- Targeted duplicate search confirmed overlapping text is retained as workflow mechanics/examples rather than competing generic principle copies.
- Replit validation not required because this is docs-only.
