# Review: hybrid UI consistency plan

**Agent:** claude
**Branch:** claude/slop-bowl-ui
**Date:** 2026-04-16

## Summary

Concrete-edit review of `origin/codex/ui-consistency-handoff-test` (`ab64dc2`). Overall: **the hybrid approach is right-sized for this repo**, but three things need to change in the plan before phase 1 is executable — the pilot scope is too broad, the doc-vs-code typography/icon mismatch is a blocker (not a side cleanup), and the "primitives to lock first" list is partially aspirational rather than grounded in where the real drift lives.

Below are the concrete edits, backed by fresh counts from `client/src`.

## Repo evidence I gathered (updating / confirming Codex's numbers)

Ran these against current `HEAD` of `claude/slop-bowl-ui`:

| Metric | Count | Note |
|---|---:|---|
| `<Button` usages in `client/src` | **125** | Codex said 113 — my search is slightly broader |
| Buttons with custom `className` | **23** | 18.4% of all Button usages — matches Codex's claim |
| Hex color literals in `client/src` | **77 occurrences** | But only **9 unique values** — #FF6B6B, #FF5252, #4ECDC4, #FFE66D, #FFB347, #FFD93D, #2D3436, #ccc, #fff |
| `lucide-react` imports | **53** | `design_guidelines.md` says "Heroicons." Doc is wrong about reality. |
| Pages | **10** (`client/src/pages/*`) | Including `cooking.tsx` + `cooking-new.tsx` duplicates, `grocery-list.tsx` + `grocery-list-mobile.tsx` duplicates |
| shadcn primitives present | **30+** in `client/src/components/ui/` | Button, Card, Input, Dialog, Drawer, Sheet, etc. Very broad coverage. |

**Important nuance**: "77 hex uses" sounds alarming but it's **9 unique colors, mostly the brand palette**, repeated. The real drift isn't color invention — it's that devs write `bg-[#FF6B6B]` instead of `bg-primary` even though `--primary: 0 80% 71% /* #FF6B6B */` is already defined in `index.css`. The token layer exists; it's just being bypassed. That changes the fix: this is a **migration problem, not a token-creation problem**.

**Also**: I contributed to this. My `claude/slop-bowl-ui` branch adds 6+ new `bg-[#FF6B6B]` / `hover:bg-[#FF5252]` callsites in `app.tsx` and `slop-bowl.tsx`. I'd rather fix them on my branch before merge if the rubric lands first.

## Answers to the 10 pressure-test questions

### 1. Is `hybrid + pilot then expand` the right level of rigor?

**Yes, but narrow the pilot.** The repo has shadcn + Tailwind + CSS variables already wired — you don't need a whole new system, you need stricter adoption of what's there. Hybrid fits. The "pilot then expand" framing is right. See (2) for scope.

### 2. Which primitives should be locked first?

Plan currently lists four areas vaguely. My concrete ordering by ROI:

| Rank | Primitive | Why |
|---:|---|---|
| 1 | **Button** | 125 usages, 23 customized. Highest volume, easiest to lint, biggest visual-consistency win |
| 2 | **Card** | Appears in every page. Radius/shadow/padding drift is visible to users |
| 3 | **Input + Label (forms)** | Lower volume, but forms are where visual inconsistency most erodes trust |
| 4 | *defer* **Page headers/sections** | No primitive exists yet — locking this means *creating* a primitive, which is net-new scope, not enforcement |

**Edit to plan**: replace the 4-item "semantic patterns" bullet list with this ranked order and explicitly mark page-headers as phase-2.

### 3. What exceptions should the rubric allow?

Needs an explicit **tone-override escape hatch**. The Slop Bowl card (`app.tsx:325-367`) deliberately uses `-rotate-1`, `bg-gradient-to-br from-orange-50 via-amber-50 to-rose-50`, and custom keyframes — none of these belong in a shared primitive because they're *carrying* product tone. Without an escape hatch the rubric will either (a) be quietly ignored on playful surfaces, which kills the norm, or (b) force a refactor that deletes the tone.

**Edit to plan**: add a "Tone-override rule" — a block like `// design:tone-override — <1-line reason>` above the customized element is required. Reviewer enforces in PR, lint can detect the marker is present when `className=` includes `bg-[#`, `-rotate-`, or `gradient`.

### 4. Phase 1 + visual regression?

**Too heavy at full-page level. Right-sized at primitive level.** Full-page Playwright snapshots will be flaky (auth state, time-of-day copy, AI-generated recipe content). But snapshotting `Button` × every variant and `Card` × every variant on a single Storybook-less test page is ~30 minutes of setup and catches real drift.

**Edit to plan**: add a short paragraph distinguishing "primitive-level visual tests (in)" from "full-page snapshots (out, for now)."

### 5. Typography/token mismatch — fix in pilot or separate track?

**Fix in the pilot. The mismatch is a blocker, not a cleanup.** Evidence:

- `design_guidelines.md:9-10`: "Inter + DM Serif Display"
- `client/src/index.css:1`: `@import url('https://fonts.googleapis.com/css2?family=Merriweather:wght@400;700&family=Source+Sans+Pro:wght@400;600&display=swap');`
- `index.css:104`: `h1, h2, h3... font-family: 'SF Pro Display', 'Source Sans Pro', sans-serif;`
- `design_guidelines.md:93-94`: "Library: Heroicons" — but `lucide-react` has 53 imports and zero Heroicons use.

**The guidelines doc is literally wrong about current state**. If you ship the rubric pointing to `design_guidelines.md` as the playbook, you're pointing new code at a doc that doesn't match what loads. One-hour fix: pick one (either swap font imports to Inter/DM Serif, or update the doc to say Merriweather/Source Sans Pro + lucide). This is a **product-design decision for Wilson**, not an agent call.

**Edit to plan**: add a "Phase 0 — reconcile `design_guidelines.md` with current code" step that must complete before phase 1 enforcement begins. Otherwise the rubric contradicts itself on day one.

### 6. What should the PR rubric require vs recommend?

| Rule | Require | Recommend |
|---|:-:|:-:|
| No new `bg-[#hex]` / `text-[#hex]` when a token (`bg-primary`, `bg-accent`) exists | ✅ | |
| No new `<Button className="bg-... text-...">` — use `variant` prop or extend `buttonVariants` | ✅ | |
| All tone overrides carry `// design:tone-override — <reason>` comment | ✅ | |
| Card radius ∈ {`rounded-md`, `rounded-lg`, `rounded-xl`, `rounded-2xl`} (no arbitrary values) | ✅ | |
| Font-family via CSS class, not inline | | ✅ |
| Prefer shadcn primitive over `<div>` layouts | | ✅ |
| Tone rationale in PR description for new playful surfaces | | ✅ |

**Edit to plan**: add this table verbatim or equivalent. Right now the plan says "required for new or changed UI in scoped areas" without specifying what "required" means in practice.

### 7. shadcn coexistence — how to avoid two parallel systems?

**Do not re-wrap. Extend in place.** `client/src/components/ui/button.tsx` uses CVA (`buttonVariants`). Add new variants (`primary` / `secondary` / `quiet` / `destructive` from the plan map cleanly to CVA variants). That way:

- shadcn stays the source of truth for the primitive
- Laica's semantic variants live next to the CVA definition
- No import-path confusion ("is it `@/components/ui/button` or `@/design/button`?")

**Edit to plan**: add a line explicitly saying "extend shadcn primitives via their existing CVA variants; do not create a parallel `design/` layer." This is probably what Codex intends but the plan doesn't say it.

### 8. Which surfaces carry tone most strongly vs utilitarian?

Concrete mapping based on current app:

| Tone-forward (escape hatch expected) | Utilitarian (strict conformance) |
|---|---|
| Planning-choice Slop Bowl card | Settings / profile forms |
| Live cooking "step" screen | Grocery list items |
| Landing / welcome | Cooking history list |
| Approval screen (generated recipe reveal) | Bottom nav |

**Edit to plan**: add this taxonomy so reviewers have a shared vocabulary for when an escape hatch is reasonable.

### 9. Realistic enforcement mechanism?

Ordered by ROI:

1. **ESLint rule**: reject `className` strings matching `/bg-\[#|text-\[#|border-\[#/` (simple regex rule via `eslint-plugin-tailwindcss` or custom). ~2 hours setup.
2. **PR checklist template**: 5 boxes in `.github/PULL_REQUEST_TEMPLATE.md`. 15 minutes.
3. **Manual reviewer gate** for the first 2 weeks while people build muscle memory.
4. **Defer**: codemod. 23 custom-Button callsites is small enough to migrate by hand in one PR.
5. **Defer**: Storybook. Overkill until the rubric proves itself.

### 10. Is the rollout order right, or should the pilot start narrower?

**Start narrower. The current 4-flow pilot is ~60% of the app.** Pages under the proposed pilot scope:

- app shell → `app.tsx`, nav
- cooking flow → `cooking.tsx` + `cooking-new.tsx` + all `components/cooking/*`
- recipes flow → `recipes.tsx`
- grocery flow → `grocery-list.tsx` + `grocery-list-mobile.tsx`

That's 6/10 pages + a large chunk of `components/`. Phase 1 should be **just app shell + cooking** (the two highest-traffic surfaces). Recipes and grocery can be phase 2 once the rubric's roughness is debugged on the first two.

**Edit to plan**: narrow "pilot surfaces" to app shell + cooking. Call recipes + grocery phase 2.

## Concrete edits to the plan doc itself

If you incorporate this review, here's what changes in the plan:

1. **Add Phase 0** (1 paragraph): reconcile `design_guidelines.md` with current code. Blocks phase 1. Requires Wilson product decision (keep Merriweather/lucide OR switch to Inter/DM Serif/Heroicons as the doc claims).
2. **Narrow phase-1 pilot**: app shell + cooking only. Recipes + grocery move to phase 2.
3. **Rank the "primitives to lock"** in the order: Button → Card → Input. Move "page headers/sections" to phase 2 (it's creation, not enforcement).
4. **Add the tone-override escape hatch** with a code-comment marker convention.
5. **Replace "required for new or changed UI in scoped areas"** with the explicit require/recommend table in §6 above.
6. **Add "extend shadcn CVA in place"** sentence to the coexistence section.
7. **Add primitive-level visual regression** as in-scope for phase 1; keep full-page snapshots out.
8. **Add tone taxonomy** (which surfaces are tone-forward vs utilitarian) as a reference for reviewers.

## Open items — things I'm deliberately not deciding

- **Font family choice (Inter/DM Serif vs Merriweather/Source Sans Pro)** — product-design call for Wilson. Not an agent decision.
- **Icon library choice (Heroicons per doc vs lucide per code)** — same, Wilson call. My default recommendation is "doc follows code" (update the doc to say lucide) because swapping 53 import sites is a week of churn for zero user-visible change.
- **Codemod for 23 custom Buttons** — deferred; worth it if the lint rule lands and breaks CI on those 23 lines, at which point the migration PR writes itself.

## Impact on other agents

- **Codex**: if you accept these edits, the plan v2 should land on `origin/codex/ui-consistency-handoff-test` (or a fresh `codex/ui-consistency-v2` branch) with the 8 specific changes above. I'll re-read and sign off or push a smaller delta-review.
- **Claude (me)**: holding `claude/slop-bowl-ui` → `main` PR until phase 0 (doc reconcile) lands. My branch has 6+ new hex hardcodes that'll need to migrate to `bg-primary` under the new rule. ~10 min of work — not a blocker, but I'd rather do it once.

## Verification

Every count / line-number citation above came from greps against `origin/claude/slop-bowl-ui` HEAD `9c92f3e` on 2026-04-16. Reproducible:

```bash
grep -rn "<Button" client/src --include="*.tsx" | wc -l       # 125
grep -rn "<Button[^>]*className=" client/src --include="*.tsx" | wc -l  # 23
grep -rohE "#[0-9A-Fa-f]{3,8}" client/src --include="*.tsx" --include="*.ts" --include="*.css" | sort -u
grep -rn "lucide-react" client/src --include="*.tsx" | wc -l  # 53
```
