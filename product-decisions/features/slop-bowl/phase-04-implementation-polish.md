# Slop Bowl Phase 4 — Implementation Polish & UX Decisions

**Status:** Accepted
**Phase owner:** Wilson
**Date:** 2026-04-16

## Goal

Capture the UX, copy, and visual decisions made during `claude/slop-bowl-ui` implementation and Replit validation, so the planning-choice screen and Slop Bowl flow have a documented rationale beyond commit messages.

## Context

Phase 3 locked the API contract and simplified the bowl concept. The UI branch (`claude/slop-bowl-ui`) turned that contract into a shipping surface. Along the way, several decisions emerged from Replit validation rounds that weren't in the original spec — the planning-choice entry screen, visual tone for the Slop Bowl card, Back-button semantics, and various copy refinements. This doc records them before the PR to `main`.

## Decisions

### 1. Planning-choice entry screen

When a user enters the planning phase, they see **two cards** side-by-side:

- **Slop Bowl** — zero-decision path
- **Chef it up!** — manual planning (cuisine, time, suggestions)

Rationale: the Slop Bowl feature needs a discoverable entry point without displacing the existing manual-planning flow. Two cards frame the user's choice as a deliberate fork — "decide, or don't" — rather than burying Slop Bowl behind a toggle.

Back navigation from manual planning step 1 returns to this choice screen (not to the profile/pantry page, which was the old behavior).

### 2. Slop Bowl card — "playful personality" visual direction

Wilson picked **Direction 2: Playful personality** (over "subtle" and "very shiny" alternatives). The card carries tonal weight through:

- `-rotate-1` tilt (un-tilts on hover)
- Gradient background: orange-50 → amber-50 → rose-50
- Coral `#FF6B6B` accent border
- Low-opacity scattered pantry emojis (🧀 🍝 🌶️ 🥫)
- Falling-ingredient animation — 🍖 🥦 🍚 🍅 drop into the 🥣 bowl on a loop (replaced an earlier rising-steam animation; "adding to the bowl" is the correct metaphor since users are assembling a meal)
- Wobble animation on the bowl emoji on hover

The tone is "fun, not chaotic" — the card telegraphs that Slop Bowl is a light-hearted path without implying the output will be bad food.

### 3. Rotating sticker taglines

A small rotated sticker in the card's top-right corner displays one of four taglines, picked randomly on each visit to the choice screen:

- `MAKE GOOD SLOP`
- `LESS BRAIN POWER`
- `NO RULES`
- `FLAVOR ROULETTE`

Stable across re-renders while the choice screen is visible (via `useMemo` keyed on `showPlanningChoice`). Rejected: `CHEF'S GAMBLE` and other options that read as pessimistic about the food quality.

### 4. Slop Bowl tagline

Final body copy under the title: **"Zero decisions. Laica will plan for you."**

Iteration history:
- `"Zero decisions. Maximum chaos."` — rejected; "chaos" was read as discouraging
- `"Laica will plan for you."` — too soft on its own, lost the zero-decisions hook
- `"Zero decisions. Laica will plan for you."` — accepted; keeps the decision-fatigue promise while reassuring that Laica is doing the work

### 5. Chef It Up! card

Title iterations:
- `"Plan your meal"` → `"Something more specific"` → `"Chef it up!"` (accepted)

`"Chef it up!"` fits on one line on mobile, matches the playful voice, and contrasts cleanly with "Slop Bowl".

Icon: replaced the monochrome `ClipboardList` lucide icon with a **rotating chef emoji** — `👨‍🍳` / `👩‍🍳` at the default yellow Unicode tone. Yellow is race-neutral by convention and keeps the rotation focused on gender balance without implying a specific ethnicity. Picks on each visit to the choice screen.

(An earlier 18-emoji matrix across all five Fitzpatrick skin tones was rejected in favor of the simpler two-variant gender flip.)

### 6. Layout alignment across both cards

Both cards share the same vertical skeleton so titles, taglines, and primary buttons align:

- `h-14` fixed-height icon wrapper (top)
- `flex-1 flex flex-col justify-center` text block (middle, centers vertically in remaining space)
- Primary button pinned to the bottom

This survives taglines of different lengths without breaking alignment.

### 7. Pantry-check is read-only inside Slop Bowl

The pantry-check step shows the user's pantry ingredients as **non-interactive badges**. To edit, users tap **"Edit pantry in profile"** which navigates to the existing profile settings page.

Rationale: avoids duplicating pantry-edit UI inside the Slop Bowl flow. Edits happen in one place (profile) — the single source of truth — and any change there is reflected next time the user enters Slop Bowl.

### 8. Generation loading state

- Loading-message pool expanded from 8 to 20 phrases
- Picker does a **no-consecutive-repeats random pick** (not round-robin) so the feed feels alive across multiple visits without back-to-back duplicates
- Initial index is randomized per generation, not always starting at 0

### 9. Button hierarchy on generated-bowl screens

On the approval screen and feedback screen:

- **"Plan your own meal instead"** and **"Skip and just surprise me"** were promoted from tiny gray underlined text-links to **full-width primary buttons** matching the main CTA styling
- Secondary copy change: **"Generate another bowl"** → **"Recommend another bowl"** (softens the "the system is grinding" tone toward "here's a suggestion")

## Deferred — explicit non-decisions

These surfaced during the work and are flagged as separate workstreams, not handled on this branch:

- **Local dev DB strategy** — ad-hoc local Neon was found to be 3+ weeks behind `main`'s schema (`cooking_sessions.recipe_snapshot` missing). A proper strategy — likely personal Neon + ephemeral branches per worktree — needs its own product-decision doc. Not a Slop Bowl blocker; Replit is the validation environment for this PR.
- **Grocery-list "Generate" copy refresh** — the grocery-list feature surfaced during Replit review but is currently dormant. Kept out of this branch to preserve branch focus.
- **Rename `onBackToProfile` → `onBack`** in `meal-planning.tsx` — prop name is stale after decision #1 but behavior is correct. Low-priority cleanup for a later branch.

## Source decisions

- Replit validation feedback from Wilson over 2026-04-10 → 2026-04-16
- "Structured workstreams over nested decision threads" — the local dev DB question was explicitly split off rather than allowed to block this feature (see `memory/feedback_structured_workstreams.md`)

## Impact

- **Shipped** on `claude/slop-bowl-ui` — no server changes needed for any of these decisions (all client-side polish on top of phase-3 API contract)
- **PR-ready** once Replit end-to-end test passes (depends on `codex/slop-bowl-api` being live for the generation/cooking-steps paths)
- **Handoff note**: Codex's branch is unaffected by this doc
