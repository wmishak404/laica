# EPIC-012 — LAICA Design Language & Visual Identity

**Status:** In Progress
**Owner:** Wilson / Codex / Claude
**Created:** 2026-04-29
**Updated:** 2026-04-29

## One-line summary

Define LAICA's durable visual language — look, feel, personality, color, typography, imagery, surfaces, and brand behavior — so mobile-refresh implementation does not stop at functional UX or generic component consistency.

## Linked Initiatives

- [INIT-001 — Mobile Refresh](../initiatives/INIT-001-mobile-refresh.md)

## Context

Phase 2 mobile-refresh validation surfaced a planning gap: PR #23 implemented much of the setup behavior, but the screens did not yet feel close enough to the approved visual mockups. The app had UX principles and UI governance, but not a strong enough source of truth for the target LAICA design language.

This epic is distinct from `epics/001-ui-governance.md`:

- EPIC-001 governs consistency and enforcement: tokens, primitives, escape hatches, and avoiding ad hoc styling.
- EPIC-012 defines the visual identity those tokens and primitives should express: LAICA's personality, art direction, layout feel, color mood, typography direction, illustration/photo treatment, and how the app should avoid feeling like a generic AI product.

`design_guidelines.md` is currently a record of the implementation as it exists, not the target design language. This epic should eventually graduate into a durable design-language product decision or a replacement/major revision of that guideline.

## Scope

### In scope

- LAICA's visual personality and design principles beyond UX mechanics
- Universal guidance for color, typography, spacing, density, shape, iconography, imagery, illustration, motion, and branded moments
- Rules for when surfaces should be playful/tone-forward versus quiet/utilitarian
- Phase-by-phase visual expectations for mobile refresh, starting with Phase 2 setup
- How closely implementation must follow mockups before a phase is considered ready
- A practical reviewer checklist for visual acceptance in Replit/manual smoke
- Guidance for translating mockups into reusable tokens and primitives rather than one-off CSS
- Updating `design_guidelines.md` or promoting a new product decision once the target direction is settled

### Out of scope

- Redesigning every legacy page before the mobile-refresh phases reach it
- Replacing shadcn/ui or Tailwind as implementation tools
- Shipping a full component-library platform before the app can move forward
- Treating mockups as pixel-perfect specs when responsive behavior or platform constraints require adaptation
- Implementing code changes directly inside this epic

## Decisions made so far

- The draft mobile-refresh design-language artifact lives at `product-decisions/features/mobile-refresh/design-language.md`.
- The approved mobile-refresh mockups are design inputs, not mood boards.
- Functional behavior alone is not enough for phase readiness when linked mockups exist.
- LAICA should feel warm, capable, food-native, mobile-native, and lightly playful without becoming childish or cluttered.
- LAICA should not feel like a generic AI app, generic SaaS dashboard, or plain shadcn demo.
- Warm/coral remains the leading brand energy for the current mobile refresh, but future palette work should avoid one-note coral-only screens.
- Design implementation should use reusable tokens and component patterns where practical, with deliberate documented exceptions for tone-forward surfaces.
- Phase 2 setup is the first active correction point for this epic.

## Phase 2 starting point

The Phase 2 setup polish pass should use this epic as an active design-language pilot:

- Camera-first setup should feel intentionally LAICA-branded, not like a native camera preview surrounded by ordinary buttons.
- Capture should be the primary visual action; upload/manual/tips should sit in a clear secondary hierarchy.
- Pantry and Kitchen should share the same interaction model while having enough visual distinction to feel like different setup moments.
- Back/escape affordances should feel designed into the setup chrome, not bolted on after the fact.
- Ingredient/equipment chips, progress, selection rows, and confirmation states should carry the warm/coral mobile-refresh direction.
- Any deliberate deviation from the Phase 2 mockup should be documented before merge readiness.

## Phase 3-5 carry-forward

- Phase 3 Planning must redesign the legacy two-card Planning choice toward the planning mockups. Unchanged cards are not Phase 3-ready.
- Phase 3 Ticket Pass should become the canonical proof point for distinctive LAICA recipe suggestions.
- Phase 4 Cooking should define the focused, hands-busy cooking mode personality: calm, legible, cue-driven, and confidence-building.
- Phase 5 Post-cook should define the retention/cleanup personality: light, non-punitive, pantry-aware, and quick to dismiss when needed.

## Open questions

1. What is the target typography direction after the current Merriweather / SF Pro / Source Sans Pro implementation?
2. Should the current coral/teal/yellow palette be refined, expanded, or replaced for the durable LAICA identity?
3. What are the canonical visual motifs for LAICA: camera frame, ticket, pantry chip, cooking cue, chef companion, or something else?
4. How playful should LAICA be by surface type: setup, planning, cooking, settings, errors, feedback, and empty states?
5. What kind of imagery belongs in the app: real food photography, generated food images, illustration, emoji, icon-led UI, or a hybrid?
6. Which mockup elements are hard requirements versus directional examples?
7. What should the final design-language artifact be: a new product decision, a revised `design_guidelines.md`, or both?

## Agent checklist — when to read this epic

Read EPIC-012 before starting any of the following:

- [ ] Implementing or polishing any mobile-refresh Phase 2-5 screen
- [ ] Translating a mockup into code
- [ ] Changing colors, typography, radius, shadows, spacing density, icon style, imagery, illustration, or motion
- [ ] Creating a new tone-forward surface or branded UI moment
- [ ] Deciding whether a phase is visually ready to merge
- [ ] Updating `design_guidelines.md` or UI-governance rules that affect look and feel
- [ ] Writing a handoff that claims visual conformance or defers visual polish

When one of these applies, the handoff for the work must:

1. Cite this epic.
2. State whether the work conforms, defers, or adds new evidence.
3. Include any intentional visual deviations from linked mockups.
4. Note whether the visual change is reusable system direction or a one-off phase exception.

## Resolution criteria — what "done" looks like

This epic is `Resolved` when all of the following are true:

1. A durable LAICA design-language artifact exists, either as a product decision, revised `design_guidelines.md`, or both.
2. The artifact defines visual personality, color direction, typography direction, imagery/illustration approach, surface taxonomy, and mockup-conformance expectations.
3. EPIC-001's governance/enforcement plan knows how to enforce or review the accepted design language.
4. At least one mobile-refresh phase, starting with Phase 2 setup, has been implemented and validated against the accepted design language.
5. Phase handoff templates or PR validation notes include visual conformance as an explicit review item.
6. This epic has a final dated resolution note with links to the accepted artifact and merged pilot implementation.

## Linked artifacts

- `product-decisions/features/mobile-refresh/design-language.md` — draft target design language for mobile refresh
- `design_guidelines.md` — current implementation record, not yet target identity
- `epics/001-ui-governance.md` — consistency and enforcement companion epic
- `epics/005-testing-strategy-and-acceptance-criteria.md` — validation companion epic
- `initiatives/INIT-001-mobile-refresh.md` — living Mobile Refresh initiative hub
- `product-decisions/features/mobile-refresh/README.md` — mobile-refresh phase index and mockup conformance gate
- `product-decisions/features/mobile-refresh/phase-02-setup.md` — first active correction point
- `docs/handoffs/2026-04-29-codex-mobile-refresh-ui-conformance-plan.md`

## Chronology

### 2026-04-29 — Epic created from Phase 2 design gap

Wilson clarified that "design principles" means more than UX principles: LAICA needs a universal design system and guidance for visual identity, look and feel, colors, personality, and the aesthetic direction behind the mockups. This epic records that work and makes Phase 2 setup the first active place to apply it.

### 2026-04-29 — Draft mobile-refresh design language added

Codex added `product-decisions/features/mobile-refresh/design-language.md` as the first concrete design-language artifact. It is draft-status and intended to guide Phase 2 setup polish immediately while keeping final typography, palette, motif, and imagery decisions open for Wilson review.

### 2026-04-29 — Phase 2 privacy and trust feedback added

Wilson's PR #23 setup testing added design-language evidence that camera-first does not mean camera-forced. Phase 2 setup should present camera as an explicit opt-in capability, keep manual entry visually equal to upload for privacy-sensitive users, show a clear scanning/processing animation after capture/upload, avoid intrusive pantry language, and build Back/escape into the setup chrome. This reinforces that LAICA's visual language needs to communicate user control and trust, not only warmth and playfulness.
