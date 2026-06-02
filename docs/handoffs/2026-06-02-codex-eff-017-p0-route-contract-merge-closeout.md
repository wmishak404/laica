# EFF-017 P0 route-contract merge closeout

**Agent:** codex
**Branch:** codex/eff-017-p0-route-contract-closeout
**Date:** 2026-06-02
**Initiative:** none
**INIT updated:** n/a

## Summary

PR #120 merged the first accepted EFF-017 phased backlog item after PR #119: provider-light P0 route-contract coverage. This closeout updates the durable Effort state from branch evidence to merged evidence, records Wilson's Replit shell and happy-path smoke validation, and keeps the remaining EFF-017 backlog explicit. Wilson also approved a narrow policy adjustment so future fact-only post-merge evidence closeouts may auto-merge when they record already-observed facts without changing work meaning, ownership, validation authority, or active status.

## Changes

- `efforts/effort-017-environment-parity-and-ci-confidence.md`
  - Changes the P0 route-contract section from branch implementation to PR #120 merge evidence.
  - Adds merge commit `df4e2d563113cdc58c898dd871ccdaaeb0fd5409`.
  - Records GitHub green checks, Wilson's Replit shell pass, and Wilson's scoped Replit happy-path smoke.
  - Keeps Replit-primary and live-provider negative scope explicit.
- `efforts/registry.md`
  - Updates EFF-017's latest signal to the merged PR #120 state.
- `docs/handoffs/2026-06-02-codex-eff-017-p0-route-contract-merge-closeout.md`
  - Adds this merge-closeout handoff.
- `docs/workflows/agent-merge-authority.md`
  - Adds the evidence-closeout auto-merge authority for fact-only post-merge closeouts touching active INIT/Effort files, with conflict checks and hard stops.

## Impact on other agents

EFF-017 remains `In Progress`. The next accepted backlog item is still the provider-light live-cooking smoke with `/api/cooking/steps` stubbed, followed by mocked provider-boundary happy paths, coverage visibility/ratcheting, and UI/accessibility guardrails.

Do not reopen the P0 route-contract item unless PR #120's tests regress or a route is intentionally reactivated. `POST /api/grocery/list` remains unsupported and was covered only as currently disabled.

## Open items

- Continue EFF-017 with the next phased backlog item from the PR #119 audit.
- Live OpenAI output quality, ElevenLabs audio quality, Google linked-account login, production OAuth-domain preflight, admin eval/prompt-versioning workflows, `storage.ts` integration, exhaustive Replit corner cases, and Replit deployment behavior remain outside PR #120.

## Verification

Closeout verification:

- `git diff --check` passed for this docs-only closeout branch.
- Policy-reference search for `Evidence Closeout Auto-Merge Authority` passed.

Merged PR #120 validation already recorded:

- Local Codex: `npm ci`, focused Vitest, `npm run test:unit`, `npm run check`, `npm run build`, and `git diff --check` passed.
- GitHub checks: `unit`, `e2e_guest_smoke`, dependency audit, TruffleHog, and CodeQL checks passed for head `e3f7d1029e301c69b04160fd83a106227b37bf9b`.
- Replit shell: Wilson ran `npm ci && npm run test:unit && npm run check && npm run build`; all passed.
- Replit runtime: Wilson completed the happy-path smoke on the branch; corner cases were not run.

## Stack / base status

- Base refreshed: yes
- Current base: `origin/main` at `df4e2d563113cdc58c898dd871ccdaaeb0fd5409`
- Last Replit-validated at: scoped happy-path smoke on PR #120 branch before merge; full targeted branch pass not run
- Notes: closeout started after PR #120 merged to `main`.
