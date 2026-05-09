# UI Governance Graduation — EFFORT-001 / EFFORT-012 Resolved

**Agent:** claude
**Branch:** claude/ui-governance-graduation
**Date:** 2026-05-02
**Initiative:** INIT-001
**INIT updated:** yes — Epics & Governance table repointed to PD-005 + design_guidelines.md.

## Summary

EFFORT-001 (UI Consistency & Design Governance) and EFFORT-012 (Laica Design Language & Visual Identity) graduated to durable artifacts. The four-month accumulation of governance rules moved into [`product-decisions/pd-005-ui-governance.md`](../../product-decisions/pd-005-ui-governance.md); visual identity, tokens, surface taxonomy, accepted Phase 2.1 + 2.2 directions, and the seven previously-open visual identity questions moved into [`design_guidelines.md`](../../design_guidelines.md) as the canonical living UI/design standard.

## Reversal of the earlier deferral

The two preceding handoffs bundled in this branch — [Codex's `2026-05-01-codex-phase-2-2-governance-deferral.md`](2026-05-01-codex-phase-2-2-governance-deferral.md) and [Claude's `2026-05-01-claude-governance-deferral-acceptance.md`](2026-05-01-claude-governance-deferral-acceptance.md) — argued for deferring graduation until Phase 3-5 evidence accumulated. Wilson reconsidered with the four concrete drift examples Codex named:

1. `setup-*` class reuse was not enough because accepted setup styles depended on `.setup-ui .setup-*` selector specificity.
2. Capture shutter, camera/video toggle, and help/tips controls rendered as rounded squares instead of circular setup controls.
3. Upload photos / Enter manually typography drifted from first-time setup's `Nunito` / 800 treatment.
4. Future governance must require rendered/computed-style comparison, not just class-name reuse.

Those examples were not a *gap* in the rubric — they were the rubric's last missing rule (the scoped-style reuse contract). The deferral was correct given what was known; the four examples were the maturity signal that justified moving now. Both prior handoffs are bundled here as the decision-making journey.

## Changes

### New
- [`product-decisions/pd-005-ui-governance.md`](../../product-decisions/pd-005-ui-governance.md) — operating model: 5 required rules + 3 recommended, primitive lock order (Button → Card → Input + Label, page-header primitive deferred), surface taxonomy, tone-override convention, coexistence-via-CVA rule, pilot-then-expand rollout, scoped-style reuse contract (rule 5, codifying the Phase 2.2 finding).

### Rewritten
- [`design_guidelines.md`](../../design_guidelines.md) — promoted from "current-implementation record" to canonical living standard. Visual identity (6 principles), tokens (color + typography + spacing), surface taxonomy, mockup conformance gate, accepted Phase 2.1 + 2.2 directions, "Open Visual Decisions" section absorbing EFFORT-012's 7 questions, anti-patterns, review checklist. References PD-005 for governance.

### Resolved
- [`efforts/effort-001-ui-governance.md`](../../efforts/effort-001-ui-governance.md) — `Open` → `Resolved`. Status banner points at PD-005 + design_guidelines.md. Final dated section preserves the four-month chronology and explicitly defers the enforcement-mechanism criterion to a future narrow active epic.
- [`efforts/effort-012-laica-design-language.md`](../../efforts/effort-012-laica-design-language.md) — `In Progress` → `Resolved`. Same pattern; the 7 open visual identity questions migrated to design_guidelines.md "Open Visual Decisions" rather than a new epic, per Wilson's "less but more precise" guidance.

### Repointed
- [`efforts/registry.md`](../../efforts/registry.md) — 001 and 012 rows show Resolved status, 2026-05-02 date, pointer to graduated artifact.
- [`efforts/README.md`](../../efforts/README.md) — 001 and 012 dropped from active read list. New "UI governance and visual standards" section points at PD-005 + design_guidelines.md before any UI work.
- [`product-decisions/README.md`](../../product-decisions/README.md) — PD-005 added to taxonomy table.
- [`AGENTS.md`](../../AGENTS.md) and [`CLAUDE.md`](../../CLAUDE.md) — new "UI governance" section above active Efforts list; 001 and 012 lines removed from active Efforts list.
- [`initiatives/INIT-001-mobile-refresh.md`](../../initiatives/INIT-001-mobile-refresh.md) — Epics & Governance table column renamed `Reference`; PD-005 and design_guidelines.md replace EFFORT-001 / EFFORT-012 rows.
- [`product-decisions/features/mobile-refresh/pd-design-language.md`](../../product-decisions/features/mobile-refresh/pd-design-language.md) — `Status: Superseded` banner pointing at design_guidelines.md. Retained as Phase 2.x design-language evidence.

### Bundled (history preserved on main)
- [`2026-05-01-codex-phase-2-2-governance-deferral.md`](2026-05-01-codex-phase-2-2-governance-deferral.md) — copied from `origin/codex/phase-2-2-governance-deferral-handoff`. Codex's original deferral argument with the 4 concrete drift examples.
- [`2026-05-01-claude-governance-deferral-acceptance.md`](2026-05-01-claude-governance-deferral-acceptance.md) — copied from `origin/claude/mystifying-hertz-7c2418`. Claude's acceptance with trigger conditions for the (now-executed) closeout.

## Impact on other agents

- **UI work going forward.** Read [PD-005](../../product-decisions/pd-005-ui-governance.md) and [`design_guidelines.md`](../../design_guidelines.md) before adding new pages, tone-forward components, hex-literal styling, primitive overrides, font/icon changes, or scoped-class reuse on a new wrapper. The triggers replicate the former EFFORT-001 / EFFORT-012 agent checklists.
- **No active EFFORT-001 / EFFORT-012.** Don't append dated entries to those files. New design-language signal goes directly into `design_guidelines.md` — update the "Open Visual Decisions" section inline as Phase 3-5 evidence lands. New governance rules go into PD-005 by amendment or a follow-up PD.
- **Enforcement mechanism still pending.** ESLint rule + PR-template gate is an open follow-up captured in PD-005. File a narrow active epic when work begins.
- **Codex's local WIP backup.** The `/private/tmp/...` files Codex archived during the deferral were not used as input for PD-005. PD-005 was written fresh from EFFORT-001 source content. The WIP backup can be discarded if it has not already been claimed by `/private/tmp` cleanup.

## Open items

- ESLint rule + PR-template gate — file a narrow active epic when work begins.
- Migrate Slop Bowl's `bg-[#FF6B6B]` / `hover:bg-[#FF5252]` callsites to `bg-primary` / `hover:bg-primary/90` as the first pilot-surface cleanup once enforcement lands.
- Phase 3-5 visual decisions land inline in `design_guidelines.md` "Open Visual Decisions" as evidence accumulates.

## Verification

Docs-only branch — no source code changes.

- `git diff --stat origin/main...claude/ui-governance-graduation` should show only governance / PD / epic / INIT / AGENTS / CLAUDE / `design_guidelines.md` / `docs/handoffs/` files.
- `grep -n "efforts/effort-001-ui-governance\|efforts/effort-012-laica-design-language" AGENTS.md CLAUDE.md initiatives/INIT-001-mobile-refresh.md efforts/README.md product-decisions/README.md` should return no live triggers (resolved/registry pointers in `efforts/registry.md` are expected and correct).
- `npm run check` and `npm run build` pass (no code paths changed).

## Stack / base status

- Base refreshed: yes
- Current base: `origin/main` at `41dbfda` (post-PR-#32 post-merge-closeout-rule, post-npm-audit refresh)
- Last Replit-validated at: not applicable — docs-only branch with no runtime impact
- Notes: Branched fresh from `origin/main` after Phase 2.2 (#30), Phase 2.2 closeout (#31), and post-merge-closeout-rule (#32) merged. Not stacked on any other branch.
