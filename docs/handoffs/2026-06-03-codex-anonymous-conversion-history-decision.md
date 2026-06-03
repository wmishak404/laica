# Anonymous Conversion History Decision

**Agent:** codex
**Branch:** codex/anonymous-conversion-history-docs
**Date:** 2026-06-03
**Initiative:** [INIT-003 - Anonymous Trial and Account Upgrade](../../initiatives/INIT-003-anonymous-trial-and-account-upgrade.md)
**INIT updated:** yes

## Summary

Wilson clarified the next anonymous-to-linked account mental model: the user should not think they have an anonymous account. They started without an account, and signing up with Google should preserve the setup and cooking work they choose to carry forward.

The accepted near-term rule is conversion-gated durability. The first promotion slice should preserve user-consented Pantry, Kitchen, and Cooking Profile state. It should not bulk- or background-import every completed anonymous cook into durable History. A future Phase 5/promotion path may save a current guest cook or selected cook state only through an explicit conversion/save moment, after cleanup/taste/History semantics are designed.

## Changes

- `product-decisions/pd-012-public-anonymous-trial-and-account-upgrade.md`
  - Added the 2026-06-03 conversion-history clarification.
  - Refined the Phase 5 returning-user rule from simple no-retro-import to conversion-gated durability.
  - Added rationale against turning every guest cook into a long-lived migration obligation.
- `initiatives/INIT-003-anonymous-trial-and-account-upgrade.md`
  - Updated the current resume point with the first-promotion scope.
  - Added a chronology note for the conversion-gated guest History decision.
- `product-decisions/features/mobile-refresh/pd-phase-05-post-cook.md`
  - Mirrored the Phase 5 constraint so future History/cleanup/taste work keeps the guest boundary coherent.
- `initiatives/registry.md`
  - Updated INIT-003's latest signal.

## Implementation Guidance

- Keep this phase Google-only.
- Build the guest `Sign up` / `Save progress` path as a real Firebase anonymous-to-Google promotion/linking flow, not just a copy change.
- Ask before merging guest Pantry/Kitchen/Cooking Profile into an existing Google account; never silently overwrite linked account data.
- Do not add automatic guest History import in the first promotion slice.
- If saving the current cook at conversion becomes urgent, design it as an explicit user-consented save moment and document the cleanup/taste/History behavior before implementation.

## Validation

- Docs-only update.
- `git diff --check` passed.

## Stack / Base Status

- Base refreshed: no, this was a small docs branch created from the current detached worktree state.
- Last Replit-validated at: not required for docs-only decision capture.
