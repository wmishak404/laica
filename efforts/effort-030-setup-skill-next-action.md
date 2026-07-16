# EFF-030 - Setup cooking-skill Next action consistency

**Status:** Resolved
**Owner:** Wilson / Codex / Claude
**Created:** 2026-07-14
**Updated:** 2026-07-16
**Linked Initiatives:** [INIT-001 - Mobile Refresh](../initiatives/INIT-001-mobile-refresh.md)

## One-line summary

Add an explicit bottom Next action to the first-time setup cooking-comfort page while preserving the current full-row skill selection behavior.

## Context

During mobile-browser validation of the setup viewport work, Wilson noted that the `How comfortable are you with cooking?` page advances when the user taps a skill option, but it is the only setup page in this section without the same bottom Back/Next action pattern. Wilson later chose consistency across Setup: the user should select a cooking skill first, then tap the bottom `Next` action to advance.

This follow-up is intentionally separate from the 2026-07 browser-viewport repair branch, which is focused on scroll bounds, camera fit, and avoiding newly introduced setup navigation bugs.

## Scope

### In scope

- Add a bottom Next action beside Back on the cooking-comfort setup page.
- Keep full-row skill choices tappable and visibly selected.
- Make tapping a skill select it without auto-advance; the explicit bottom `Next` action advances after a selection.
- Keep button sizing, typography, and bottom-rail behavior consistent with adjacent setup pages.
- Add focused regression coverage for the chosen interaction.

### Out of scope

- Redesigning the setup skill choices, copy, illustration style, or progress treatment.
- Changing Pantry, Tools, Dietary, or Ready setup behavior except where needed for shared bottom-rail consistency.
- Changing returning Settings cooking-profile edit behavior unless the implementation intentionally reuses the same primitive and needs parity.

## Decisions made so far

- Wilson wants this handled later, not inside the current scroll/camera repair scope.
- The current behavior of tapping an option to proceed is good, but the missing bottom Next action feels inconsistent with the rest of setup.
- 2026-07-16: Wilson chose consistency across Setup: users select one cooking-skill option first, then click the bottom `Next` button. Row tap should not auto-advance.

## Open questions

- Should returning Settings cooking-profile edits adopt the same explicit action pattern later, or should this remain first-time setup only? The current implementation branch keeps returning Settings out of scope.

## Agent checklist

Read this Effort before:

- Changing first-time setup cooking-skill selection behavior.
- Changing setup bottom Back/Next rail consistency.
- Adding or removing auto-advance behavior from setup choice pages.

## Resolution criteria

This Effort is `Resolved` when:

1. The cooking-comfort setup page has an explicit bottom Next action consistent with adjacent setup pages, or Wilson explicitly accepts keeping the current auto-advance-only behavior.
2. The chosen interaction is covered by focused tests.
3. Replit/mobile-browser validation or an accepted deferral is recorded in the PR or handoff.

## 2026-07-14 - Created from setup mobile-browser validation

Wilson observed the inconsistency while validating the setup browser viewport branch: the cooking-comfort page requires tapping the option itself to continue, unlike the surrounding setup pages that expose a bottom Next action.

## 2026-07-16 - Select-then-Next implementation started

Wilson selected the explicit setup-consistency behavior: the first-time setup cooking-skill page should work like the surrounding setup pages. The implementation branch `codex/setup-skill-next-action` removes row-tap auto-advance, shows the bottom `Next` action on step 3, keeps it disabled until a skill is selected, and advances to Dietary only after `Next`.

Focused regression coverage in `tests/unit/user-profiling.test.tsx` now asserts the selected skill stays on the cooking-comfort page, exposes the selected radio state, enables `Next`, and then advances to `Anything I should avoid?` only after the button is tapped. Returning Settings cooking-profile edits, setup copy, skill option design, camera/scroll behavior, navigation IA, provider calls, schema, and Live Cooking behavior remain out of scope.

## 2026-07-16 - Merge-readiness refresh

PR #294/#298 cleared the dependency-audit blocker that originally kept PR #296 draft. The implementation branch was rebased onto current `origin/main` at `d3051cda`; local `npm ci`, `npm audit --audit-level=high`, focused setup Vitest, full unit suite, `npm run check`, `npm run build`, and diff whitespace checks passed after the rebase. Wilson reported the behavior looked great from his own spot check before the rebase. The first ready-for-review GitHub E2E run then exposed a stale Playwright setup helper that still assumed row-tap auto-advance; the branch now updates that helper to tap `Next` after selecting cooking skill. Exact-head GitHub E2E still needs rerun after push, and exact-head Replit/mobile validation remains deferred unless Wilson requests another PR-level smoke.

## 2026-07-16 - Resolved by PR #296

PR #296 merged as `fc973996`, resolving this Effort. First-time setup cooking skill now uses the accepted select-then-Next interaction: row tap selects `Beginner`, `Intermediate`, or `Expert`; the bottom `Next` action stays disabled until a skill is selected; and only `Next` advances to Dietary.

Focused component coverage and the GitHub `e2e_guest_smoke` path now cover the interaction. Wilson spot-checked the behavior before merge and said it looked great. Exact-head GitHub `unit`, `e2e_guest_smoke`, `npm-audit`, `trufflehog_pr`, and CodeQL passed at PR head `06234908` before merge. Human Replit/mobile validation remains deferred to release/batch validation; the production-readiness registry now carries the focused setup regression check.
