# EFF-035 merge closeout

**Agent:** codex
**Branch:** `codex/eff-035-closeout`
**Date:** 2026-07-29
**Initiative:** INIT-001
**INIT updated:** yes
**Resolves blocked handoff:** none

## Summary

PR #347 merged the accepted first-time setup scroll correction into `main` and mechanically resolves EFF-035. The closeout updates the Effort, active read list, registries, INIT resume point, Phase 2.1 history, and production-push validation breadcrumb so future agents start from the merged state rather than the former in-progress branch.

## Changes

- Mark EFF-035 `Resolved`, append its final merge/validation evidence, remove it from `efforts/README.md`, and update `efforts/registry.md`.
- Update INIT-001 and `initiatives/registry.md` with PR #347's merge, the resolved Effort, and the non-viewport resume boundary.
- Record the merged outcome in the Phase 2.1 setup history.
- Update the production validation registry from pending branch to merged/pending production push.

## Impact on other agents

- Do not resume `codex/desktop-setup-scroll`; PR #347 is merged.
- Preserve `.setup-scroll-body` as the one bounded first-time setup content scroller while the outer root remains locked.
- Start future INIT-001 or Effort work from fresh `origin/main` and use live PR/Effort status to select non-viewport scope.

## Open items

- The next production push should run the focused Pantry/optional Tools check at constrained desktop height, `390x844`, `412x915`, and one short mobile/landscape height.
- Physical keyboard-open and increased-text-size behavior remains unvalidated. New regression evidence may justify new scope; it does not keep EFF-035 active.

## Verification

- Parent PR: #347
- Parent final head: `2788a9585e6155ebe1282f00300de5bfe095ac12`
- Merge commit: `736ee6bdc1eece81558d04c0c45daf5a184e86b2`
- Final-head GitHub unit/typecheck/build, schema-backed guest plus linked Playwright smoke, dependency audit, secret scan, and CodeQL passed.
- Direct-shell Replit loaded the final head without Replit Agent and repeated the short `1024x600` and `390x844` scroll fingerprint after the full implementation-head desktop/mobile matrix.
- Wilson validated desktop and mobile and reported that the result looks great.
- Replit validation: completed at parent final head `2788a9585e6155ebe1282f00300de5bfe095ac12`; not required for this docs-only factual closeout.
- `git diff --check origin/main...HEAD` must pass before the closeout PR opens.

## Stack / base status

- Base refreshed: yes
- Current base: `origin/main` at `736ee6bdc1eece81558d04c0c45daf5a184e86b2`
- Last Replit-validated at: parent final head `2788a9585e6155ebe1282f00300de5bfe095ac12`
- Notes: the closeout branch starts from the PR #347 merge commit and contains documentation-only factual updates.
