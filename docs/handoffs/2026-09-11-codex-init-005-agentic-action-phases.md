# INIT-005 agentic action phase plan

**Agent:** codex
**Branch:** `codex/init-005-agentic-action-phases`
**Date:** 2026-09-11
**Initiative:** INIT-005
**INIT updated:** yes; INIT-001 also updated to remove ownership
**Resolves blocked handoff:** none

## Summary

Wilson reclassified Agentic Cooking Actions from a Mobile Refresh Phase 4 extension into independent INIT-005. The accepted plan now has seven numbered phases and treats the Action Registry, Action Ledger, scoped capability discovery, guardrails, action-specific evals, and future integration boundary as foundational work before the first user-visible timer action.

INIT-001 remains the stable Live Cooking baseline but no longer owns or sequences the action platform. This prevents the nearly complete mobile-refresh initiative from becoming the long-term tracker for backend action architecture, durable user-data mutation, recipe state, voice tools, third-party integration policy, and rollout governance.

## Changes

- Created `initiatives/INIT-005-agentic-cooking-actions.md` and registered it in the active INIT read list and registry.
- Moved the source plan into `product-decisions/features/agentic-cooking-actions/` and added a dedicated feature index.
- Added seven phases: foundation/guardrails, timer prototype, session and pantry/profile corrections, recipe patching/History, restart/replan safety, voice/integration interface, and controlled rollout.
- Added the Action Registry, Action Ledger, capability/status API shape, caller scoping, and trace lifecycle to the accepted plan.
- Recorded that a direct, unambiguous timer-start command is itself authorization and receives no redundant confirmation; inferred or ambiguous timer behavior remains non-mutating, while recipe and durable-data changes require exact confirmation.
- Recorded the explicit non-goal that INIT-005 is not a general-purpose personal agent and remains limited to the active cooking task, that user's own data, and approved capabilities.
- Updated INIT-001 and Mobile Refresh docs so they preserve historical provenance without owning or gating INIT-005.

## Impact on other agents

Read INIT-005 before any agentic cooking action, action proposal/confirmation route, action ledger, cooking action eval, voice tool, or integration work. Start future implementation from fresh `origin/main` after this docs PR merges. Do not add action implementation back to INIT-001 Phase 4.

## Open items

- Wilson has not yet approved spawning implementation tasks or starting runtime work.
- Phase 1 still needs a fresh audit of Live Cooking, routes, shared schemas, action-adjacent storage, authentication/session ownership, rate limits, and open PR overlap.
- The exact Action Ledger persistence model and future voice transcript-confidence/ambiguity thresholds remain implementation/product decisions.

## Verification

- Documentation-only change; no runtime behavior changed.
- Validate internal links, stale path references, `git diff --check`, and exact-head GitHub checks before merge.
- Human Replit validation and production-registry updates are not required for this docs-only reclassification.
