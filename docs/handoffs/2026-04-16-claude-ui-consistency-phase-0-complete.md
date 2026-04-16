# Phase 0 complete — design_guidelines.md reconciled to current code

**Agent:** claude
**Branch:** claude/slop-bowl-ui
**Date:** 2026-04-16

## Summary

Per Wilson's decision — "doc follows code, we can change this later" — reconciled `design_guidelines.md` to match what currently ships. This closes Phase 0 of the UI-consistency plan and clears the way for Codex to draft the Phase 1 rubric (primitive lock + lint + PR template) against an accurate source of truth.

Wilson noted explicitly that he wants a future tone/type refresh to make Laica feel less like generic AI apps. That's tracked as a separate workstream — out of scope for this reconcile.

## Changes

**File:** `design_guidelines.md`

1. **Status banner** at the top: declares this doc a current-implementation record, not the long-term target, and points to the future refresh as a separate workstream.
2. **Typography section** — replaced "Inter + DM Serif Display" with the actual stack:
   - Body: Tailwind default `font-sans` (system UI per platform)
   - Headings: `'SF Pro Display', 'Source Sans Pro', sans-serif`
   - Recipe titles: `Merriweather` via the `.recipe-title` utility class
   - Shows the exact `@import` string from `index.css` so there's no ambiguity.
3. **New "Color Palette & Tokens" section** — documents the CSS variables already defined in `index.css` (coral/teal/butter-yellow/charcoal/destructive) with HSL, hex, and role. Includes the Phase-0 rubric rule: **new code uses tokens (`bg-primary`), not hex literals (`bg-[#FF6B6B]`)**.
4. **Container strategy** — replaced "Cards: rounded-2xl" with the actual shadcn `Card` default (`rounded-lg` + `shadow-sm`) and documented when `rounded-xl` / `rounded-2xl` apply.
5. **Icons section** — replaced "Heroicons" with `lucide-react` (53 import sites), listed the icons actually in use, and added an "emoji as iconography" clause for tone-forward surfaces.
6. **Added future-direction footnote** in the typography section to make the "this will change" intent discoverable in context.

Sections I deliberately did **not** edit:
- Screen-specific layouts (home dashboard, recipe detail, pantry, live cooking) — these are aspirational product-UX descriptions, not code-enforceable. The rubric doesn't depend on them being current-state accurate.
- Layout spacing primitives, accessibility, interaction patterns — already match reality.

## Impact on other agents

**Codex — unblocked for Phase 1.** The rubric can now cite `design_guidelines.md` without contradicting what actually loads. Concretely:

- Font-family lint/review rule can reference the three stacks above.
- Color lint/review rule has a canonical token table to match against.
- Card radius rule has explicit default (`rounded-lg`) + allowlist (`rounded-lg`, `rounded-xl`, `rounded-2xl`) with arbitrary-value radii (`rounded-[N]`) disallowed.
- Icon library is no longer ambiguous — `lucide-react` only.

**Claude (me) — Slop Bowl PR status:** still parked pending Phase 1 landing. My branch has 6+ new `bg-[#FF6B6B]` / `hover:bg-[#FF5252]` callsites that now explicitly violate the Phase 0 rule I just wrote into the guidelines. I will migrate them to `bg-primary` / `hover:bg-primary/90` in the same PR that absorbs Phase 1, or in a small separate cleanup commit before merge to `main` — whichever Codex + Wilson prefer.

## Open items

- **Codex**: draft the Phase 1 plan v2 incorporating (a) narrowed pilot (app shell + cooking only), (b) primitive lock order (Button → Card → Input), (c) tone-override escape hatch (`// design:tone-override — <reason>` marker), (d) require/recommend table, (e) shadcn extend-in-place via CVA, (f) primitive-level visual tests only. All details in `docs/handoffs/2026-04-16-claude-ui-consistency-review.md`.
- **Wilson**: no immediate action. Future tone/type refresh is a separate workstream when ready.

## Verification

```bash
# Doc now matches code — confirm fonts
grep "^@import" client/src/index.css       # Merriweather + Source Sans Pro
grep "font-family" client/src/index.css    # SF Pro Display + Source Sans Pro + Merriweather

# Doc now matches code — confirm icons
grep -rn "heroicons" client/src --include="*.tsx" | wc -l     # 0
grep -rn "lucide-react" client/src --include="*.tsx" | wc -l  # 53

# Tokens exist
grep "primary:\|secondary:\|accent:" client/src/index.css     # --primary/secondary/accent defined
```

All three sanity checks pass as of 2026-04-16.
