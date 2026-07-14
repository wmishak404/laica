# EFF-030 - Setup cooking-skill Next action consistency

**Status:** Open
**Owner:** Wilson / Codex / Claude
**Created:** 2026-07-14
**Updated:** 2026-07-14
**Linked Initiatives:** [INIT-001 - Mobile Refresh](../initiatives/INIT-001-mobile-refresh.md)

## One-line summary

Add an explicit bottom Next action to the first-time setup cooking-comfort page while preserving the current full-row skill selection behavior.

## Context

During mobile-browser validation of the setup viewport work, Wilson noted that the `How comfortable are you with cooking?` page advances when the user taps a skill option, but it is the only setup page in this section without the same bottom Back/Next action pattern. The immediate-selection behavior is useful, but the missing Next action is inconsistent with Pantry, Tools, Dietary, and Ready setup pages.

This follow-up is intentionally separate from the 2026-07 browser-viewport repair branch, which is focused on scroll bounds, camera fit, and avoiding newly introduced setup navigation bugs.

## Scope

### In scope

- Add a bottom Next action beside Back on the cooking-comfort setup page.
- Keep full-row skill choices tappable and visibly selected.
- Decide whether tapping a skill should still auto-advance, or whether selecting a skill should enable the explicit Next button.
- Keep button sizing, typography, and bottom-rail behavior consistent with adjacent setup pages.
- Add focused regression coverage for the chosen interaction.

### Out of scope

- Redesigning the setup skill choices, copy, illustration style, or progress treatment.
- Changing Pantry, Tools, Dietary, or Ready setup behavior except where needed for shared bottom-rail consistency.
- Changing returning Settings cooking-profile edit behavior unless the implementation intentionally reuses the same primitive and needs parity.

## Decisions made so far

- Wilson wants this handled later, not inside the current scroll/camera repair scope.
- The current behavior of tapping an option to proceed is good, but the missing bottom Next action feels inconsistent with the rest of setup.

## Open questions

- Should tapping a cooking skill still auto-advance, or should it only select the skill and require Next?
- If auto-advance remains, should Next appear as a secondary consistency affordance or only after a selection is made?
- Should returning Settings cooking-profile edits adopt the same explicit action pattern, or is this first-time setup only?

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
