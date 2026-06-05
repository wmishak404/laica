# EFF-017 PR #138 Merge Closeout

**Agent:** codex
**Branch:** codex/eff-017-pr138-closeout
**Date:** 2026-06-05
**Initiative:** none
**INIT updated:** n/a

## Summary

PR #138 is merged, and the deterministic EFF-017 backlog now has a durable post-merge record on top of fresh `origin/main`. The closeout keeps EFF-017 `In Progress`: the merged PR materially improves deterministic linked-user browser coverage, UI/accessibility guardrails, and coverage visibility, but it does not settle the larger CI-primary policy, OAuth preflight operation, live-provider canary, coverage-threshold, or workflow-doc alignment questions.

## Changes

- `efforts/effort-017-environment-parity-and-ci-confidence.md`
  Appends the PR #138 merge evidence, scoped Replit human-smoke result, Replit shell package-firewall blocker, explicit negative scope, and the decision not to close or split EFF-017 yet.
- `efforts/registry.md`
  Refreshes EFF-017's searchable last signal to the PR #138 merge and remaining active work.
- `docs/handoffs/2026-06-05-codex-eff-017-pr138-merge-closeout.md`
  Records this docs-only closeout for future agents.

## Evidence Preserved

- PR #138 merged as `823b0758824e55bca6de5d203de5b841ba91843f`.
- GitHub CI passed at PR head `b252588aa7498d8949e0b0559c6b8b51c3abd00c`, including `unit`, `e2e_guest_smoke`, dependency audit, secret scan, and CodeQL.
- Wilson completed scoped Replit human smoke on the PR runtime content: Google sign-in, one recipe suggestion round, Live Cooking guidance, and Slop Bowl were green.
- Replit shell install/check/build stayed blocked: `npm ci` hit the Replit package firewall with `403 Forbidden` for `es5-ext@0.10.64`, so `tsc` and `vite` were unavailable afterward.
- Replit env sanity confirmed `VITE_LAICA_DEV_AUTH_BROWSER` was unset.
- The font inconsistency observed during Replit smoke is intentionally out of this EFF-017 closeout because it is being handled in another window.

## Impact on other agents

Future EFF-017 work should resume from policy and lane decisions, not from adding another first deterministic smoke. Treat the merged deterministic coverage as provider-light confidence: linked dev-auth browser behavior is covered with a real Firebase ID token and disposable Neon persistence, while full Google popup/linking, live providers, production OAuth authorized-domain state, Replit deployment behavior, and exhaustive corner cases remain outside the routine CI proof.

## Open items

- Decide whether and how CI becomes the primary correctness gate with explicit exceptions.
- Configure and run the OAuth-start preflight lane; PR #138 did not prove production authorized-domain state.
- Decide live OpenAI/Vision/ElevenLabs canary scope and keep it separate from default PR CI unless explicitly accepted.
- Decide coverage baseline, threshold, and ratchet policy before making coverage blocking.
- Reconcile `AGENTS.md`, ADR-0001, and `docs/workflows/testing-and-acceptance.md` if validation authority changes.
- Resolve the Replit package-firewall blocker for `es5-ext@0.10.64` or change the install path before relying on Replit shell check/build evidence.

## Verification

- `git diff --check` passed on the working-tree diff before staging.

Replit validation is not required for this closeout branch because it only records already-observed post-merge evidence and does not change code, config, product behavior, security/privacy posture, or validation policy.

## Stack / base status

- Base refreshed: yes
- Current base: `origin/main` at `823b0758824e55bca6de5d203de5b841ba91843f`
- Last Replit-validated at: PR #138 runtime content had scoped human smoke completed; Replit shell check/build remained blocked by package firewall
- Notes: this branch started from the PR #138 merge commit for post-merge closeout only.
