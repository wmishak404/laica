# Slop Bowl UI — PR draft body

**Target:** `claude/slop-bowl-ui` → `main`
**Agent:** claude
**Date:** 2026-04-16

---

## Summary

- Ships the client for the Slop Bowl feature — a zero-decision cooking path that auto-generates one bowl from the user's pantry and takes them straight to approval → cooking.
- Adds a new **planning-choice entry screen** (Slop Bowl vs "Chef it up!") that fronts both the new zero-decision flow and the existing manual meal-planning flow.
- Reconciles `design_guidelines.md` to match what currently loads in `client/src/index.css` (Phase 0 of the separate UI-governance workstream). This is a doc-only follow-up triggered during this work; no product behavior changes.

## What's in this PR

### Slop Bowl client flow (`client/src/components/cooking/slop-bowl.tsx`, `client/src/lib/openai.ts`, `client/src/pages/app.tsx`)
- 4-state flow: `pantry-check` → `generating` → `approval` → `feedback`
- Read-only pantry check — edits happen via the profile settings page (single source of truth)
- 20-phrase loading-message pool with no-consecutive-repeats random rotation
- Calls `POST /api/recipes/slop-bowl` (ships on `codex/slop-bowl-api`)
- Passes `pantryIngredientsUsed` + `kitchenEquipment` into `POST /api/cooking/steps` for context-aware step generation (Phase 3 enrichment)

### Planning-choice entry screen (`client/src/pages/app.tsx`)
- Two-card layout: **Slop Bowl** (playful — tilted card, gradient bg, falling-ingredient animation, rotating sticker tagline) and **Chef it up!** (rotating man/woman chef emoji)
- Aligned card layout — both cards share an `h-14` icon slot, `flex-1` centered text block, and button pinned to the bottom so titles and CTAs line up regardless of tagline length
- Back from manual-planning step 1 now returns to this choice screen instead of jumping to profile

### Visual polish (`client/src/index.css`)
- Custom `slop-ingredient-fall` and `slop-wobble` keyframes for the Slop Bowl card

### Docs
- `product-decisions/features/slop-bowl/phase-04-implementation-polish.md` — records all UX/copy/visual decisions from this round (planning-choice design, tagline iterations, chef emoji rotation, back-button behavior, etc.)
- `design_guidelines.md` — reconciled to match current code (Merriweather + SF Pro / Source Sans Pro, lucide-react, `rounded-lg` default). Future tone/type refresh is flagged as a separate workstream.

## What's **not** in this PR (deferred, by design)

- **Hex → token migration**: this branch adds ~6 new `bg-[#FF6B6B]` / `hover:bg-[#FF5252]` callsites. They visually match the existing `--primary` token; migration to `bg-primary` is deferred to the UI-governance workstream (phase 1 lint rule) so the cleanup can happen across the whole repo at once.
- **Local dev DB strategy**: schema drift (`cooking_sessions.recipe_snapshot`) prevented full local validation; Replit is the canonical validation environment for this PR. Fix is tracked as a separate workstream.
- **Grocery-list "Generate" copy refresh**: dormant feature, kept out of this branch to preserve focus.

## Dependencies

- `codex/slop-bowl-api` (PR: TBD) must be on `main` for the generation and cooking-steps-enrichment paths to work end-to-end.
- Branches have **zero file overlap** — they can merge to `main` in either order.

## Test plan

Replit validation (all against the merged `main` once both branches land):

- [ ] Sign in with Firebase (Google)
- [ ] From home, tap "Plan a meal" → planning-choice screen renders with both cards aligned; sticker tagline and chef emoji vary on reload
- [ ] Tap **Slop Bowl** → pantry-check shows current pantry; "Edit pantry in profile" link navigates correctly; "This looks right" advances to generating
- [ ] Generating screen rotates loading messages with no visible repeats
- [ ] Approval screen renders the generated bowl; "Start cooking" advances
- [ ] Cooking steps are generated with pantry + equipment context (verify step text references actual ingredients)
- [ ] Session persists (visible in history)
- [ ] Feedback submission writes successfully
- [ ] ElevenLabs TTS plays a step when triggered
- [ ] Tap **Chef it up!** → existing manual planning flow still works; **Back** from step 1 returns to the planning-choice screen (not the profile)

## References

- Decision record: `product-decisions/features/slop-bowl/phase-04-implementation-polish.md`
- Codex's server handoff: `docs/handoffs/2026-04-10-codex-slop-bowl-api.md`
- My pre-integration handoff: `docs/handoffs/2026-04-10-claude-slop-bowl-replit-merge.md`

🤖 Generated with [Claude Code](https://claude.com/claude-code)
