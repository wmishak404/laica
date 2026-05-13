# PD-005: UI Governance Operating Model

**Date:** 2026-05-02
**Status:** Accepted
**Decision maker:** Wilson
**Type:** Governance
**Scope:** Global
**Applies when:** Adding UI surfaces, custom styling, primitive changes, token changes, or scoped-class reuse.
**Supersedes:** [EFF-001](../efforts/effort-001-ui-governance.md) (graduated)

## Related Initiatives

- [INIT-001 — Mobile Refresh](../initiatives/INIT-001-mobile-refresh.md)

## Context

Slop Bowl, Phase 2.1 setup, and Phase 2.2 returning Settings each surfaced the same drift class: feature work bypasses tokens (`bg-[#FF6B6B]` instead of `bg-primary`), overrides shadcn primitives without `variant`, and reuses phase-scoped utility classes without preserving the specificity contract that makes them render correctly. The token, primitive, and icon layers are settled — the drift is enforcement, not design.

EFF-001 accumulated the rubric across Slop Bowl and mobile-refresh phases. Phase 2.2 added the last rule (scoped-style reuse must verify *computed* style, not just class-name reuse). The rubric is content-complete and graduates here. Visual targets (palette, typography, surface posture) live in [`design_guidelines.md`](../design_guidelines.md); this PD is the operating model only.

## Decision

### Required rules

| Rule | Why |
|---|---|
| No `bg-[#hex]` / `text-[#hex]` / `border-[#hex]` when a token resolves to the same value | Brand tokens exist in `client/src/index.css`; hex literals defeat the rest of the system |
| No `<Button className="bg-... text-...">` overrides — extend `buttonVariants` in `client/src/components/ui/button.tsx` instead | The variant system is where new Button modes belong; `className` overrides drift silently |
| All tone-forward overrides carry a `// design:tone-override — <reason>` comment above the customized element | Without an explicit marker the rubric is ignored on playful surfaces (Slop Bowl card is the canonical example) |
| Card radius ∈ `{rounded-md, rounded-lg, rounded-xl, rounded-2xl}` — no `rounded-[N]` arbitrary-value radii | Keeps card shape coherent across utility, branded, and tone-forward surfaces |
| Reused phase-scoped utility classes (e.g. `setup-*`) must verify rendered/computed style on the destination surface, not assume class-name reuse is sufficient | Phase 2.2 returning Settings inherited `setup-*` class names under a different root wrapper; the accepted CSS depended on `.setup-ui .setup-*` selector specificity, so shadcn Button utilities overrode setup typography and round camera-control shapes. Same class name ≠ same computed style. |

### Recommended rules

- Prefer shadcn primitives over ad-hoc `<div>` layouts.
- Set font-family via CSS class, not inline style.
- Tone rationale belongs in the PR description for new tone-forward surfaces.
- For provenance or state-change animation that must tell the user what changed, verify the cue is perceptible on the rendered surface. A fill/background change on the affected chip/card is preferred over a border-only pulse when the surface is small or glanceable.

### Primitive lock order

Locked in this order (highest measured drift first):

1. Button — 125 usages, 18% custom-styled at graduation
2. Card
3. Input + Label
4. Page header / section primitive — **deferred**; no primitive exists yet, locking it requires creating one

`client/src/components/ui/*.tsx` is the governance boundary. Changes there require explicit review against this PD.

### Surface taxonomy

| Posture | Examples | Conformance |
|---|---|---|
| Tone-forward | Slop Bowl card, Planning entry, Ticket Pass, celebrations, landing | Escape hatch expected; tone-override comment required |
| Branded utility | Setup, scan review, profile choices | Warm, focused, mockup-led; strict on rules 1-2, expressive within accepted direction |
| Utilitarian | Settings, account, grocery list, history, bottom navigation | Strict conformance; no escape hatch by default |
| Focus mode | Active cooking guidance | Calm, legible; lower visual personality than Planning |
| Safety/error | Auth errors, rate limits, no-detection feedback | Direct, reassuring; no jokes |

### Coexistence with shadcn

Extend in place via CVA definitions inside `client/src/components/ui/*.tsx`. Do not create a parallel `design/` component layer. New semantic variants attach to the existing primitive.

### Rollout model

Pilot-then-expand: one narrow surface adopts the rubric first, then it widens once the rubric proves itself. Feature branches land if they conform; `main` cleanup is its own track. In-flight branches are not blocked by drift on `main`.

## When to read this PD

Before any of the following, read this PD and `design_guidelines.md`:

- Adding a new page or top-level surface to `client/src/pages/`
- Creating a new tone-forward component with custom animation, tilt, gradient, or non-standard styling
- Introducing a hex color literal in `className`
- Adding custom `className` overrides to a shadcn primitive
- Changing `client/src/components/ui/*.tsx`
- Adding a new icon library or changing fonts in `client/src/index.css`
- Reusing phase-scoped utility classes outside their original root wrapper
- Adding a new provenance/state-change animation such as a flash, pulse, or corrected-item highlight
- Writing a feature handoff that describes a new UX pattern

The handoff and PR description must state how the change interacts with this PD (conforms / uses escape hatch / adds new evidence).

## Rationale

The token, primitive, and icon layers already exist. A heavier design-system platform would route around the drift, not fix it. Five required rules are short enough for a reviewer to memorize and dense enough to catch every drift class observed in Slop Bowl, Phase 2.1, and Phase 2.2.

Rule 5 (scoped-style reuse contract) is the only rule added after EFF-001 was filed. Phase 2.2's returning-Settings drift proved that visual conformance cannot be inferred from class-name reuse when the accepted CSS depends on selector specificity from a wrapper the destination surface does not provide.

## Alternatives considered

| Alternative | Why not chosen |
|---|---|
| Keep EFF-001 active alongside PD-005 | Duplicates governance content; bloats agent reading and risks drift between the two surfaces |
| Wait for Phase 3-5 evidence before graduating | Phase 2.2 added the last rule; further phase evidence applies the rubric rather than redefines it |
| Ship enforcement mechanism before graduating | Enforcement is implementation; the operating model is durable independently. Linking them delays the PD without changing what it says. |
| Mass codemod the 23 custom-Button callsites | Small enough to migrate by hand once the lint rule breaks CI on them |
| Storybook or parallel design-system platform | Overkill against measured drift; tokens + primitives + escape hatch is sufficient |

## Consequences

- EFF-001 flips to `Resolved` with a pointer to this PD; the historical chronology is preserved in the Effort file.
- [`design_guidelines.md`](../design_guidelines.md) is the canonical living UI/design standard. It references this PD for governance rules.
- Enforcement mechanism is tracked by [EFF-015](../efforts/effort-015-ui-governance-enforcement.md). The first enforcement slice is the PR-template reviewer gate for tone overrides, scoped-style reuse, mockup conformance, visible provenance cues, and validation-scope hygiene. EFF-015 remains open until the ESLint rule also rejects `className` matching `/bg-\[#|text-\[#|border-\[#/` and proves CI fails on a deliberate hex-literal test.
- AGENTS.md and CLAUDE.md active read lists drop EFF-001 and replace it with PD-005 + `design_guidelines.md`.
- INIT-001 governance references repoint to this PD.

## Open follow-ups

- [EFF-015](../efforts/effort-015-ui-governance-enforcement.md) — PR-template reviewer gate plus ESLint rule rejecting hex literals in `className`. The template can ship first; the enforcement-mechanism criterion deferred from EFF-001 closes only after the lint gate also lands.
- Slop Bowl visual/token cleanup is no longer tracked as an active Effort; INIT-001 Phase 3.1 owns remaining Slop Bowl design alignment while EFF-015 owns enforcement.
