# EPIC-004 — Selection controls should be full-row tap targets

**Status:** Open
**Owner:** Wilson (product direction) / Claude (next implementation pass) / Codex (doc capture)
**Created:** 2026-04-17
**Updated:** 2026-04-28

## One-line summary

Onboarding and profile-edit selection menus currently behave like small radio bullets, forcing users to click the dot precisely. Replace them with full-width selectable button/card rows so users can press anywhere in the option area.

## Context — why this exists

Captured from Wilson during localhost review on 2026-04-17:

> When selecting these menus, I have to precisely click the dot to properly select it. Lets make the UI less bullet point and more like a big button that user can press anywhere in that button area.

This feedback came from the cooking-profile flow shown in the screenshot attached to the thread: the current layout reads as a bulleted list, but the actual interaction target is much smaller than the visible row.

### Current implementation (evidence)

In `client/src/components/cooking/user-profiling.tsx`:

- **Step 1 ("What's your cooking skill level?")** at lines 494–505 renders each option as a `RadioGroupItem` with a separate text block beside it, but no pressable wrapper around the full row
- **Step 3 ("How much time do you have to cook each week?")** at lines 541–549 uses the same pattern in a simpler one-line layout

In `client/src/components/cooking/user-settings.tsx`:

- **Cooking Skill Level** at lines 1180–1193 duplicates the onboarding pattern
- **Weekly Cooking Time** at lines 1199–1208 duplicates the onboarding pattern again

In `client/src/components/ui/radio-group.tsx`:

- `RadioGroupItem` is a compact `h-4 w-4` circular control
- The shared primitive is semantically correct, but it does not solve row-level tap targets by itself

**Interpretation:** the current UI is technically a radio group, but functionally it behaves like a tiny control with decorative text next to it. On touch devices and even on desktop, the perceived click target is much larger than the actual reliable click target. This is a form-usability and interaction-design issue, not a copy problem.

## Scope

### In scope

- Make the entire option row clickable/tappable for the single-select menus in onboarding
- Apply the same full-row interaction model to the matching profile-edit controls in settings
- Shift the visual direction from "bullet list" toward "selectable button/card row"
- Preserve radio-group semantics, keyboard navigation, and accessibility
- Define the selected/unselected visual treatment for these utilitarian selection rows
- Decide whether this should be a reusable pattern for future single-select choice lists

### Out of scope

- Rewriting the full onboarding flow or changing step order/copy
- Global visual refresh, palette, or typography work — tracked separately under EPIC-001
- Converting every checkbox or multi-select surface in the app to card-style controls in the same pass
- Replacing the underlying Radix radio primitive with a different control library

## Decisions made so far

- **The full visible option area should be clickable** — not just the dot
- **The UI should feel like a big selectable button/card**, not a bullet-point list
- **This is a utilitarian form-control fix**, not a playful/tone-forward surface experiment
- **Onboarding and settings should stay aligned** — the same profile concepts should not have different hit-area behavior in different screens

## Open questions

### 1. What is the implementation pattern?

Viable options:

- Wrap each option row in a `Label` / row container so the whole row activates the existing `RadioGroupItem`
- Create a reusable higher-level component such as `SelectableOptionCard`
- Extend the shared radio-group pattern with a repo-standard "full-row radio option" composition

Default lean: prefer a reusable composition or helper component, not one-off flex rows duplicated in multiple files.

### 2. How broad should the first pass be?

Minimum target:

- Onboarding step 1 (skill level)
- Onboarding step 3 (weekly time)
- Settings profile equivalents

Possible expansion:

- Similar checkbox rows if the same problem exists there

Default lean: ship the radio-style single-select menus first, then review whether checkbox rows deserve a follow-up epic.

### 3. What selected-state language should the UI use?

Options include:

- Keep a visible radio indicator inside a larger button/card row
- Replace the tiny radio look with a stronger selected border/background plus trailing icon
- Use both: strong row highlight plus the familiar radio indicator

Default lean: keep the radio metaphor for clarity, but make the row styling do most of the work.

### 4. How much visual change is appropriate?

The request clearly asks for "less bullet point" and "more like a big button." The open question is whether that means:

- a subtle full-row pressable list item
- or a more card-like tile with padding, border, and selected-state emphasis

Wilson to confirm if implementation proposals differ meaningfully in density or visual weight.

## Agent checklist — when to read this epic

Read EPIC-004 before starting any of the following:

- [ ] Modifying the onboarding selection rows in `client/src/components/cooking/user-profiling.tsx`
- [ ] Modifying the profile settings selection rows in `client/src/components/cooking/user-settings.tsx`
- [ ] Changing `client/src/components/ui/radio-group.tsx`
- [ ] Creating a reusable full-row radio/selectable-row primitive
- [ ] Reworking how single-select options look and behave in the cooking-profile flow

When one of these applies, cite EPIC-004 in your handoff and note how the change interacts with it (conforms / defers / adds new signal). If the implementation expands beyond the radio-style menus listed above, add a dated note here documenting the broader rollout.

## Resolution criteria — what "done" looks like

This epic is `Resolved` when all of the following are true:

1. In onboarding, users can click/tap anywhere in a skill-level option row to select it
2. In onboarding, users can click/tap anywhere in a weekly-time option row to select it
3. In settings, the matching profile-edit controls use the same full-row interaction model
4. The selected state is visually legible as a button/card choice, not just a tiny filled dot
5. Keyboard and assistive-technology behavior still works correctly for the radio groups
6. A durable implementation note exists in a handoff, feature phase note, or product decision, and this epic has a final `## YYYY-MM-DD — Resolved` section pointing to it

## Linked artifacts

- `client/src/components/cooking/user-profiling.tsx` — onboarding radio-style selection rows
- `client/src/components/cooking/user-settings.tsx` — settings radio-style selection rows
- `client/src/components/ui/radio-group.tsx` — shared primitive currently used by both surfaces
- `epics/001-ui-governance.md` — related governance epic; this issue reinforces utilitarian-form consistency and tap-target quality

## Chronology — how we got here

### 2026-04-17 — Epic created

During localhost review, Wilson flagged that the cooking-profile menu selections require overly precise clicking on the radio dot itself. The visible row reads like a selectable option, but the interaction does not match that expectation. Rather than fold this into EPIC-001's broad governance work, it is tracked here as a focused form-control usability epic so it can be implemented cleanly and then referenced from the wider governance track.

### 2026-04-28 — Mobile refresh expands the full-row pattern

The mobile-refresh setup and planning records apply this pattern beyond the original weekly-time/skill rows. Weekly Cooking Time is being removed, but Cooking Skill, Dietary Restrictions, cuisine chips, Slop Bowl confirmation controls, and post-cook review choices should all use mobile-appropriate full-row or full-chip tap targets rather than tiny radio/checkbox hit areas.

### 2026-04-29 — Phase 2 setup implementation applies full-row profile controls

The Phase 2 setup branch (`codex/mobile-refresh-phase-2-setup`) replaces the onboarding Cooking Skill and Dietary Restrictions controls with full-row mobile selections, and mirrors that interaction model in Settings. Weekly Cooking Time is no longer a setup/settings control, so the original weekly-time tap-target case is removed rather than restyled. Remaining validation before closeout: authenticated Replit smoke for setup/settings touch behavior and keyboard/accessibility spot checks.

## Next steps when work resumes

1. Claude (or another client-owner pass) prototypes a full-row selection style for onboarding step 1 and step 3
2. Reuse the same interaction model in settings so profile editing stays consistent
3. Validate keyboard, focus, and mobile tap behavior
4. Record the accepted pattern in a durable implementation note and resolve this epic
