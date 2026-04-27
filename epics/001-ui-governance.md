# EPIC-001 — UI Consistency & Design Governance

**Status:** Open
**Owner:** Wilson (product direction) / Codex (plan drafting) / Claude (review + pilot-surface feedback)
**Created:** 2026-04-16
**Updated:** 2026-04-17

## One-line summary

Establish a hybrid UI-consistency system — concise style rubric + code-level enforcement — so new features, especially ones with custom designs, follow an agreed-upon governance instead of drifting into ad-hoc styling.

## Context — why this exists

The Slop Bowl feature (see `product-decisions/features/slop-bowl/phase-04-implementation-polish.md`) surfaced how easy it is for a feature branch to introduce bespoke styling that bypasses the tokens and primitives the repo already has. During that implementation, Codex separately drafted a "hybrid UI consistency system" plan. The two threads collided in a productive way: Slop Bowl became a live test case for the rubric, and the rubric became a check on Slop Bowl's drift.

Wilson then decided to park the governance work until Slop Bowl ships, and track it here as the first entry in a new `epics/` system so it doesn't get lost.

### How the repo looks today (evidence, as of 2026-04-16 HEAD `claude/slop-bowl-ui`)

Measured on `client/src`:

| Signal | Count | Note |
|---|---:|---|
| `<Button` usages | **125** | shadcn primitive is widely used |
| Buttons with custom `className` | **23** (18.4%) | Most common drift vector |
| Hex color literals | **77 occurrences** across **9 unique values** | `#FF6B6B`, `#FF5252`, `#4ECDC4`, `#FFE66D`, `#FFB347`, `#FFD93D`, `#2D3436`, `#ccc`, `#fff` — all roughly brand palette, but bypassing the `--primary` / `--secondary` / `--accent` tokens already defined in `index.css` |
| `lucide-react` imports | **53** | Icon library is `lucide-react`, not Heroicons (earlier doc mismatch) |
| shadcn primitives available | **30+** in `client/src/components/ui/` | Button, Card, Input, Dialog, Drawer, Sheet, etc. |
| Pages | 10 | Including `cooking.tsx` + `cooking-new.tsx` (duplicates), `grocery-list.tsx` + `grocery-list-mobile.tsx` (duplicates) |

**Interpretation:** the token layer exists (`--primary: 0 80% 71%; /* #FF6B6B */` etc.), the primitive layer exists (shadcn), and the icon library is settled (lucide). The drift is not "we need to design a system" — it's "devs write `bg-[#FF6B6B]` instead of `bg-primary` even though the token resolves to the same color." This is a **migration and enforcement problem**, not a design problem.

## Scope

### In scope

- A documented style rubric (content: what is required, what is recommended, where escape hatches apply)
- Primitive-lock policy: a ranked list of shadcn primitives whose variants/usage patterns are "frozen" first
- A code-level enforcement mechanism (lint rule, PR template, CI check, or combination)
- An escape-hatch convention for tone-forward surfaces (e.g. Slop Bowl card's intentional tilt/gradient/animation)
- A rollout plan: which surfaces adopt first (pilot), which expand later
- Coexistence rules with shadcn defaults (extend-in-place vs parallel system)
- Visual regression approach at the primitive level (if adopted)

### Out of scope

- **Rewriting `design_guidelines.md` to describe an aspirational tone/type system** — Wilson has signaled a future tone refresh ("less generic AI-app looking") but that is a separate workstream, tracked independently. The current governance work locks what is shipping today, not what will eventually replace it.
- **Introducing Storybook or a parallel `design/` component layer** — decided against on cost/benefit
- **Full-page Playwright visual regression** — flaky under auth + time-dependent content; primitive-level snapshots only
- **Codemod to mass-migrate the 23 custom-Button callsites** — deferred; migrate by hand once the lint rule breaks CI on them

## Decisions made so far

Captured across these handoffs (chronological):

1. `docs/handoffs/2026-04-16-codex-ui-consistency-handoff-test.md` — Codex's plan v1 (hybrid + pilot-then-expand)
2. `docs/handoffs/2026-04-16-claude-request-ui-consistency-plan-push.md` — Claude's request to get the plan on origin for review
3. `docs/handoffs/2026-04-16-claude-ui-consistency-review.md` — Claude's concrete-edit review with repo counts
4. `docs/handoffs/2026-04-16-claude-ui-consistency-phase-0-complete.md` — Phase 0 doc reconcile landed

### What's settled

- **Approach is hybrid** — concise rubric + code-level enforcement, not a heavyweight design-system platform
- **Rollout is pilot-then-expand** — one narrow surface first, then widen once the rubric proves itself
- **shadcn coexistence rule: extend in place** — new semantic variants live inside the existing CVA definitions in `client/src/components/ui/*.tsx`, not in a parallel `design/` layer
- **Tone-override escape hatch is required** — without it the rubric will be quietly ignored on playful surfaces (like the Slop Bowl card). Proposed marker: a code comment `// design:tone-override — <reason>` above the customized element
- **Typography / icon / card-radius mismatches between doc and code: fix inside the pilot, not as a separate cleanup track** — done as Phase 0 on 2026-04-16 (`design_guidelines.md` now matches `client/src/index.css` for fonts, `lucide-react` for icons, `rounded-lg` default for cards)
- **Doc follows code for now** — Wilson's explicit call. Future tone/type refresh (moving away from Merriweather + SF Pro / Source Sans Pro, maybe swapping the coral/teal palette) is its own workstream
- **Visual regression: primitive-level only in Phase 1** — full-page snapshots too flaky, primitive × variant snapshots worth the ~30-min setup
- **Slop Bowl card is the canonical "tone-forward surface" test case** — `-rotate-1`, `bg-gradient-to-br from-orange-50 via-amber-50 to-rose-50`, falling-ingredient animation, rotating sticker tagline are the kind of customizations the escape hatch exists to permit

### What's NOT settled (see next section)

- Primitive lock order — Claude's review vs Codex's lean differ on whether page headers belong in Phase 1
- Enforcement mechanism — exact mix of lint rule / PR template / CI check
- Rollout conformance order — does `main` need to be rubric-clean before Phase 2 expands, or can in-flight branches land as they adopt?

## Open questions

### 1. Which primitives are locked first?

**Claude's review recommendation** (ranked by measured drift):

| Rank | Primitive | Why |
|---:|---|---|
| 1 | Button | 125 usages, 18% custom-styled — highest-ROI lock |
| 2 | Card | Every page uses it; radius/shadow drift is visible |
| 3 | Input + Label | Lower volume, but forms are where inconsistency most erodes trust |
| 4 | *defer* Page headers/sections | **No primitive exists yet** — locking this requires *creating* a primitive, which is net-new scope, not enforcement. Move to Phase 2. |

**Codex's v2 lean** (per chat, not yet pushed as of 2026-04-16):

> lock `Button`, `Input`, `Card`, and page headers/sections first, then expand into full cooking/recipes/grocery surfaces once the rubric proves it can guide those primitives cleanly

**Decision needed:** Wilson to pick between (a) page-headers in Phase 1 with a primitive-creation sub-task, or (b) defer page-headers to Phase 2 per Claude's review.

### 2. What does the enforcement stack look like?

Claude proposed (ordered by ROI):

1. ESLint rule that rejects `className` strings matching `/bg-\[#|text-\[#|border-\[#/` — cheap (~2 hours setup via `eslint-plugin-tailwindcss` or custom)
2. PR checklist template in `.github/PULL_REQUEST_TEMPLATE.md` (~15 min)
3. Manual reviewer gate for the first ~2 weeks while muscle memory builds
4. *Defer:* codemod for the 23 custom-Button callsites — small enough to migrate by hand
5. *Defer:* Storybook — overkill until the rubric has shipped

**Decision needed:** Codex to confirm (or propose alternative) in Phase 1 v2 plan.

### 3. Rollout order

- Does `main` need to be rubric-clean before the pilot expands to Phase 2?
- Or can feature branches land if they conform themselves to the rubric, even if `main` still has pre-rubric drift?

Claude's default: **feature branches land if they conform; `main` cleanup is its own PR track**, so in-flight work isn't blocked. But open to Codex's view.

### 4. What's the require-vs-recommend split?

Claude's proposed table (from the review handoff):

| Rule | Require | Recommend |
|---|:-:|:-:|
| No new `bg-[#hex]` / `text-[#hex]` when a token exists | ✅ | |
| No new `<Button className="bg-... text-...">` — use `variant` prop or extend `buttonVariants` | ✅ | |
| All tone overrides carry `// design:tone-override — <reason>` comment | ✅ | |
| Card radius ∈ {`rounded-md`, `rounded-lg`, `rounded-xl`, `rounded-2xl`} | ✅ | |
| Font-family via CSS class, not inline style | | ✅ |
| Prefer shadcn primitive over ad-hoc `<div>` layouts | | ✅ |
| Tone rationale in PR description for new playful surfaces | | ✅ |

**Decision needed:** Codex + Wilson to sign off, amend, or reject.

### 5. Surface taxonomy (tone-forward vs utilitarian)

| Tone-forward (escape hatch expected) | Utilitarian (strict conformance) |
|---|---|
| Planning-choice Slop Bowl card | Settings / profile forms |
| Live cooking "step" screen | Grocery list items |
| Landing / welcome | Cooking history list |
| Approval screen (generated recipe reveal) | Bottom navigation |

**Decision needed:** is this the right split? Reviewer reference, not a hard gate.

## Agent checklist — when to read this epic

Read EPIC-001 before starting any of the following:

- [ ] Adding a **new page or top-level surface** to `client/src/pages/`
- [ ] Creating a **new tone-forward component** with custom animation, tilt, gradient, or non-standard styling
- [ ] Introducing a **hex color literal** in `className` (`bg-[#...]`, `text-[#...]`, `border-[#...]`) — check tokens first
- [ ] Adding custom `className` overrides to a shadcn primitive (`<Button className="bg-... text-...">`, etc.)
- [ ] Changing `client/src/components/ui/*.tsx` — these primitives are the governance boundary
- [ ] Adding a new icon library (or swapping lucide for Heroicons anywhere)
- [ ] Changing fonts in `client/src/index.css` or adding new `@import url(...)` for Google Fonts
- [ ] Writing a feature handoff that describes a new UX pattern

When one of these applies, the handoff for the work **must**:

1. Cite `epics/001-ui-governance.md`
2. State how the change interacts with the epic (conforms / defers / adds new evidence)
3. If the change adds new drift (new hex literals, new custom variants, new tone-forward surfaces), **document it here** in the epic under a new `## YYYY-MM-DD — <summary>` section so the next agent can see it

## Resolution criteria — what "done" looks like

This epic is `Resolved` when all of the following are true:

1. A `product-decisions/PD-005-ui-governance.md` exists with the accepted rubric (require/recommend table, primitive lock order, tone-override convention, rollout plan)
2. The enforcement mechanism is shipped on `main` (at minimum: lint rule or PR template, whichever Phase 1 v2 lands on)
3. At least one pilot surface has completed migration under the rubric (no `bg-[#hex]` violations, escape hatches documented where used)
4. `design_guidelines.md` references the PD and the `epics/001` graduation note
5. This epic file has a final `## YYYY-MM-DD — Resolved` section with a pointer to the PD

At that point, status flips to `Resolved`. Future UI-system concerns (tone refresh, design-system expansion, etc.) get their own epic numbers — EPIC-002, 003, etc.

## Linked artifacts

- Codex plan v1 — `docs/handoffs/2026-04-16-codex-ui-consistency-handoff-test.md` (branch: `origin/codex/ui-consistency-handoff-test`)
- Claude request handoff — `docs/handoffs/2026-04-16-claude-request-ui-consistency-plan-push.md`
- Claude review — `docs/handoffs/2026-04-16-claude-ui-consistency-review.md`
- Phase 0 complete — `docs/handoffs/2026-04-16-claude-ui-consistency-phase-0-complete.md`
- Current design guidelines — `design_guidelines.md` (reconciled to code 2026-04-16)
- Slop Bowl phase-04 decisions (the tone-forward test case) — `product-decisions/features/slop-bowl/phase-04-implementation-polish.md`

## Chronology — how we got here

### 2026-04-16 — Epic created

Captured from the active thread during Slop Bowl implementation:

1. Wilson mentioned Codex was drafting a "hybrid UI consistency system"
2. Claude checked `origin` and all Codex worktrees — no plan on disk yet. Drafted a handoff asking Codex to push WIP so Claude could actually see it before `claude/slop-bowl-ui` merged with unvetted styling
3. Codex pushed `codex/ui-consistency-handoff-test` with the plan v1 — hybrid approach, pilot on app shell + cooking + recipes + grocery, lock Button/Input/Card/page-headers
4. Claude reviewed against fresh repo counts (the evidence table above), produced 8 concrete edits: narrow pilot to app shell + cooking, reorder primitives (Button → Card → Input), defer page headers, add tone-override escape hatch, explicit require/recommend table, extend-in-place via CVA, primitive-level visual tests only, add tone taxonomy
5. Two questions explicitly deferred to Wilson as product calls:
   - Fonts: Inter/DM Serif (per doc at the time) vs Merriweather/Source Sans Pro (per code) — which is the canonical stack?
   - Icons: Heroicons (per doc) vs lucide-react (per code)
6. Wilson decided: **doc follows code** for both — "whatever we have today for now. We can change this later (which I want to in the future to make it less like many AI apps today)"
7. Claude completed Phase 0 — reconciled `design_guidelines.md` to match `index.css` (Merriweather + SF Pro / Source Sans Pro), `lucide-react`, `rounded-lg` default; added a new **Color Palette & Tokens** section and a status banner flagging the future refresh as a separate workstream
8. Codex signaled a v2 lean for Phase 1 (keep pilot narrower; lock Button, Input, Card, and page-headers first) — chat-only, not yet pushed
9. Wilson called to park the governance work until Slop Bowl ships, and asked Claude to document the whole thread as EPIC-001 so it can resume cleanly later. This doc is that record.

## 2026-04-17 — Full-row form selection issue split into EPIC-004

Localhost review surfaced a utilitarian-form problem in the cooking-profile flow: radio-style choices for skill level and weekly time currently behave like bullet lists with small tap targets, even though users visually parse the full row as selectable. That issue is now tracked in `epics/004-selection-controls-tap-targets.md`.

This is useful signal for EPIC-001 because it reinforces two governance points:

- utilitarian surfaces need clearer, more reliable hit areas than the current tiny-dot composition provides
- reusable control patterns for onboarding/settings forms should be treated as consistency primitives, not left as ad-hoc flex rows

## 2026-04-27 — Empty scan feedback consistency issue split into EPIC-007

Live vision testing surfaced another utilitarian-surface consistency gap: some pantry/kitchen scan flows show explicit “nothing detected” feedback, while others silently end or still rely on browser `alert(...)`. That issue now lives in `epics/007-vision-scan-no-detection-feedback.md`.

This adds more evidence to EPIC-001’s broader governance concern:

- utilitarian flows need consistent status/feedback patterns, not a mix of toast, alert, and silent no-op outcomes
- onboarding/profile scan behavior is another reusable interaction pattern that should converge over time instead of drifting screen by screen

## Next steps when work resumes

1. Codex publishes Phase 1 v2 plan (either `codex/ui-consistency-v2` branch or update to the existing `codex/ui-consistency-handoff-test`) incorporating Claude's review + Codex's v2 lean
2. Wilson decides page-headers scope (Phase 1 with primitive creation OR Phase 2 deferred)
3. Claude re-reviews v2 against this issue's evidence
4. One of Claude/Codex lands the enforcement mechanism (lint rule + PR template as starting point)
5. Slop Bowl's 6+ `bg-[#FF6B6B]` / `hover:bg-[#FF5252]` callsites migrate to `bg-primary` / `hover:bg-primary/90` as the first pilot-surface cleanup
6. Epic graduates to `PD-005-ui-governance.md`; this file flips to `Resolved`
