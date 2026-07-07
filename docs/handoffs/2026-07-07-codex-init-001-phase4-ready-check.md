# INIT-001 Phase 4 Ready Check

**Agent:** codex
**Branch:** `codex/init-001-phase4-ready-check`
**Date:** 2026-07-07
**Initiative:** INIT-001
**INIT updated:** yes
**Resolves blocked handoff:** none

## Summary

This branch starts the broader Phase 4 Live Cooking mobile refresh with the smallest user-visible gate: new cooking guides now wait behind a Ready Check instead of generating steps on mount. The slice preserves the merged PR #191 speech arbitration baseline, PR #236 recovery/Finish baseline, and PR #256 generated-step validation baseline while adding explicit user intent before Step 1/session start.

## Changes

- `client/src/components/cooking/live-cooking.tsx`: Adds saved-session checking, Ready Check, `Start cooking`, `Cook anyway`, and `Cook silently` entry paths. Valid restored guides resume directly; invalid saved placeholder guides no longer auto-regenerate until the cook passes Ready Check. `Cook silently` starts with audio disabled.
- `client/src/lib/openai.ts`, `server/routes.ts`, `server/openai.ts`: Add optional `acknowledgedMissingIngredients` to cooking-step generation, route validation, prompt context, and interaction logging so `Cook anyway` is durable request provenance.
- `tests/unit/live-cooking-guest-session.test.tsx`: Covers Ready Check request gating, acknowledged missing/skipped ingredient payloads, restored-guide bypass, invalid saved-step regeneration after Ready Check, guest/linked persistence boundaries, recovery, Finish, and speech arbitration after the new gate.
- `tests/unit/provider-boundary-happy-paths.test.ts`: Covers route trimming and forwarding for acknowledged missing/skipped ingredients.
- `tests/e2e/cooking-workflow.test.ts`: Moves provider-light guest smoke expectations so `/api/cooking/steps` fires after Ready Check, not immediately after `Cook this`.
- `product-decisions/features/mobile-refresh/pd-phase-04-cooking.md`, `initiatives/INIT-001-mobile-refresh.md`, `initiatives/registry.md`: Record the branch scope, validation lanes, and remaining Phase 4 work.

## Impact on other agents

Future Phase 4 branches should treat Ready Check as the current entry baseline. Do not restore the old mount-time `/api/cooking/steps` behavior for new sessions. Continue to preserve PR #191 audio arbitration, PR #236 inline recovery/Finish honesty, and PR #256 invalid-step rejection.

This slice intentionally does not implement Coach Feed, timer redesign, pinned-step visual overhaul, full structured provider schema, cooking-assistance presentation, or Phase 5 cleanup state. Those remain separate Phase 4/5 work.

## Open items

- Exact-head GitHub CI/E2E still needs to run after the branch is pushed.
- Human Replit validation is deferred to release/batch validation unless Wilson asks for PR-level manual validation. The batch should include Ready Check entry, `Cook anyway`, `Cook silently`, normal generated-step load, induced step-generation recovery/retry, invalid placeholder recovery if practical, and linked Finish copy.
- Local Playwright E2E was not run because this worktree lacked `.env.keys` and a configured `LAICA_LOCAL_SANDBOX_DATABASE_URL`; see EFF-017 and the testing workflow for the accepted lanes.

## Verification

- `npm ci`
- `npx vitest run tests/unit/live-cooking-guest-session.test.tsx tests/unit/provider-boundary-happy-paths.test.ts`
- `npm run test:unit`
- `npm run check`
- `npm run build`
- `git diff --check`

## Stack / base status

- Base refreshed: yes
- Current base: `origin/main` at `381e419d57c28c09bed453a28eae33a9f84546fb`
- Last Replit-validated at: not yet validated
- Notes: started after PR #256 merged as `f40cb1c` and PR #257 closeout merged as `381e419`; local branch is not stacked on any unmerged PR.
