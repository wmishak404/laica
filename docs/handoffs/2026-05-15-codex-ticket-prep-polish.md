# Ticket Pass / Prep Tray Visual Polish

**Agent:** codex
**Branch:** `codex/mobile-refresh-phase-3-1-ticket-prep-polish`
**Date:** 2026-05-15
**Initiative:** INIT-001
**INIT updated:** yes

## Summary

This branch prepares the next narrow Phase 3.1 runtime slice after PR #76 merged: Ticket Pass and Prep Tray now read more like tactile Laica objects while preserving the functional contracts Wilson called out. Recipe order still stays stable, the selected ticket expands in place, recipe-name main/supporting splitting remains display-only, and existing `imageUrl` slots/placeholders stay in place for a later async imagery slice.

## Changes

- `client/src/components/cooking/meal-planning.tsx`
  - Adds visible `Ticket #N` markers to suggestion tickets without changing generated order or selection state.
  - Reuses the existing recipe-name split helper for the Prep Tray title while preserving the stored `recipeName`.
  - Adds a small Prep Tray `Ready ticket` marker and a clearer title/meta/description grouping.
- `client/src/index.css`
  - Strengthens Ticket Pass stack/object language, selected/compact ticket hierarchy, image placeholder framing, and compact-row density.
  - Reworks the Prep Tray as one tactile tray object with a stronger image panel and divided ingredient sections instead of nested card-like blocks.
- `tests/unit/meal-planning.test.tsx`
  - Adds a focused guard that selecting an alternate keeps ticket order stable and preserves display-only split names through Prep Tray and final meal selection.
- `product-decisions/features/mobile-refresh/pd-phase-03-1-recipe-imagery.md`
  - Records this slice, updates the Ticket Pass drift row, and clarifies that async/generated imagery remains deferred.
- `initiatives/INIT-001-mobile-refresh.md`
  - Updates active branch/current resume context, validation state, and chronology for this branch.

## Impact on other agents

Keep follow-up Phase 3.1 work split by the existing slices. This branch does not change Planning entry, Slop Bowl pantry-check alignment, Setup/Settings inventory chip states, Chef It Up staple behavior, backend/API contracts, or Phase 5 labels. The next runtime slice can either perform authenticated visual closeout review or start async/cached imagery, but it should not treat this visual polish as an image-generation implementation.

## Stack / base status

- Base refreshed: yes
- Current base: `origin/main` at `f5f7d1d7920068c30a0f4014903022806bc2aa73`
- Last Replit-validated at: not yet validated
- Notes: started fresh after PR #76 merged; no lower-stack branch remains open for this slice.

## Open items

- Replit/manual validation must cover authenticated recipe suggestion reveal, selecting tickets 1/2/3 without reordering, Prep Tray layout for the selected ticket, and placeholder stability with no `imageUrl`.
- Compare Ticket Pass and Prep Tray against `docs/assets/mobile-refresh/phase-03-ticket-pass.png` for hierarchy, density, ticket object language, compact row readability, image-slot placement, and no layout shift.
- Async/generated imagery, caching, failure fallback, moderation fallback, and image hydration timing remain deferred to a later Phase 3.1 slice.

## Verification

- `npm ci`
- `npx vitest run tests/unit/meal-planning.test.tsx`
- `npm run check`
- `npm run build`
- `git diff --check`
- `PORT=3000 npx @dotenvx/dotenvx run -- npm run dev`, then local in-app browser smoke to `http://127.0.0.1:3000` confirmed the app loaded the unauthenticated Laica welcome screen. Authenticated Ticket Pass / Prep Tray visual validation remains Replit-only/manual for this branch.

## Replit Refresh

```bash
git fetch origin && (git switch codex/mobile-refresh-phase-3-1-ticket-prep-polish || git switch --track origin/codex/mobile-refresh-phase-3-1-ticket-prep-polish) && git pull --ff-only origin codex/mobile-refresh-phase-3-1-ticket-prep-polish
```
