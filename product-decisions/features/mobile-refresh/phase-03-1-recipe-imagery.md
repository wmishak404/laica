# Mobile Refresh Phase 3.1 — Recipe Imagery Slots

**Status:** Planned
**Document kind:** Feature Phase Record
**Phase owner:** Wilson
**Date:** 2026-05-05
**Initiative:** [INIT-001 — Mobile Refresh](../../../initiatives/INIT-001-mobile-refresh.md)
**Builds on:** [Phase 3 Planning](phase-03-planning.md)

## Goal

Add real recipe imagery or illustration to the Ticket Pass and Prep Tray without slowing the first recipe-suggestion reveal.

## Phase 3 Contract

Phase 3 reserves generated-image slots now:

- Featured Ticket Pass ticket has a recipe image slot.
- Compact alternate tickets have smaller recipe image slots.
- Prep Tray has a larger recipe image slot for the selected recipe.
- Empty image slots render a designed placeholder, not a missing/broken image state.

## Phase 3.1 Scope

- Decide the accepted imagery direction: generated food image, custom illustration, recipe-type illustration library, or hybrid.
- Add the image-generation/fetching pipeline only after the Ticket Pass is already usable.
- Hydrate `imageUrl` into existing recipe objects when imagery is available.
- Cache generated images so refreshes and back/forward navigation do not repeatedly incur cost or latency.
- Define fallback behavior for failed generation, slow generation, moderation failures, and missing image URLs.

## Speed Requirement

Recipe suggestions must appear as soon as the recipe response is ready. Image generation must be async/cached and must not block:

- viewing recipe suggestions
- selecting a ticket
- opening Prep Tray
- starting Cook mode

## Acceptance Criteria

- Ticket Pass and Prep Tray image placeholders are replaced by real imagery when `imageUrl` is available.
- Placeholders remain polished and stable when imagery is unavailable or still loading.
- The layout does not shift when images hydrate.
- Image generation/fetch failures do not block recipe selection or cooking.
- Replit validation covers fast suggestion reveal, image hydration/fallback, refresh suggestions, and Prep Tray display.
