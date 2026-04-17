---
title: Slop Bowl — Replit merge & validation handoff
date: 2026-04-10
agent: claude
status: ready-for-validation
---

# Slop Bowl — Replit merge & validation handoff

## Context

Slop Bowl feature is split across two feature branches with zero file overlap. Both are pushed to `origin`. To validate end-to-end on Replit, both branches need to be merged together inside the Replit workspace.

We deferred local validation because of an unrelated schema drift on the local dev DB (`cooking_sessions.recipe_snapshot` missing from commit `c0994f3` on 2026-03-16). The local dev DB strategy is now its own separate workstream — see "Open items" below.

## Branch boundary

| Branch | Owner | Files touched | Purpose |
|---|---|---|---|
| `claude/slop-bowl-ui` | Claude | `client/src/components/cooking/slop-bowl.tsx`, `client/src/components/cooking/live-cooking.tsx`, `client/src/pages/app.tsx`, `client/src/lib/openai.ts` | UI: planning choice screen, 4-state Slop Bowl flow, cooking-step enrichment wiring, read-only pantry-check linking to profile settings |
| `codex/slop-bowl-api` | Codex | `server/openai.ts`, `server/routes.ts` | Server: `POST /api/recipes/slop-bowl` route, phase-3 simplified bowl response shape, enriched `POST /api/cooking/steps` accepting optional `{ ingredients, equipment, description }` |

**Zero file overlap** — confirmed by diffing the two branches. Merging them is conflict-free; verified locally on a throwaway `integration/slop-bowl-local` branch (3 server files merged, +327/-36, no conflicts).

## How to merge & test in Replit

```bash
# In the Replit shell, after manually pulling latest from GitHub:
git fetch origin
git checkout claude/slop-bowl-ui
git merge origin/codex/slop-bowl-api
# Should complete cleanly. If you see conflicts, stop and report — we expect none.
npm install   # safe even if no dep changes
npm run dev   # Replit Secrets are injected automatically — no dotenvx needed
```

This merge stays on the `claude/slop-bowl-ui` branch in Replit only. Don't push the merge commit back — each agent owns their own branch on `origin` and the merge is a Replit-local validation step.

## Acceptance test

1. Sign in via Google
2. Land on planning → see "What are we cooking today?" with two cards: **Slop Bowl** + **Plan your meal**
3. Tap **Slop Bowl** → pantry-check shows ingredients **read-only** (no add/remove badges)
4. Tap **Edit pantry in profile** → navigates to the user settings page
5. Make a pantry edit there, save, navigate back, re-enter Slop Bowl → updated pantry appears in the badges
6. Tap **This looks right** → generation screen with rotating loading messages
7. Approval screen renders with cuisine, difficulty, cookTime, fusion badge if applicable, green pantry-match badges, amber missing-ingredient badges
8. Tap **Try something else** → feedback screen → enter `"less spicy, more Asian"` → tap **Generate another bowl** → verify the new recipe avoids the previous one
9. Tap **Let's cook this!** → LiveCooking renders → open DevTools Network tab → confirm `POST /api/cooking/steps` request body includes `recipeName`, `ingredients`, `equipment`, `description` (not just `recipeName`)
10. Cooking steps should reference specific ingredients from the bowl, not generic phrases like "add the protein"

## After validation

- **If everything passes:** open two PRs (`claude/slop-bowl-ui` → `main`, `codex/slop-bowl-api` → `main`) for human review and merge to `main`.
- **If issues found:** report findings, owning agent fixes on their branch, pushes, you re-pull in Replit and re-merge with `git merge origin/<other-branch>`, then re-test.

## Open items

- **Local dev DB strategy** — deferred to separate track. The current ad-hoc local Neon was found to be 3+ weeks behind `main`'s schema. A proper strategy (likely personal Neon account with ephemeral branches per worktree) needs its own product-decision doc and implementation work. Not a Slop Bowl blocker.
