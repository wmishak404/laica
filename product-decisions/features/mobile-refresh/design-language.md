# Mobile Refresh Design Language

**Status:** Draft
**Phase owner:** Wilson
**Date:** 2026-04-29
**Source epic:** [EPIC-012](../../../epics/012-laica-design-language.md)
**Initiative:** [INIT-001 — Mobile Refresh](../../../initiatives/INIT-001-mobile-refresh.md)
**Applies to:** Mobile-refresh Phase 2-5 implementation and visual review

## Goal

Define the target Laica look and feel for the mobile refresh so implementation does not stop at functional UX, generic shadcn composition, or isolated screen polish. This document is the working design-language source for Phase 2 setup polish and the later planning, cooking, and post-cook phases.

## Positioning

Laica is a warm, capable mobile cooking companion. It should feel like it belongs in a kitchen, understands the messiness of home cooking, and helps the user move forward without making every choice feel like a form.

User-facing prose should write the brand as `Laica`, not all-caps `LAICA`, unless a specific logo asset or legal/artwork context requires otherwise.

Laica should not feel like:

- a generic AI chatbot app
- a sterile SaaS dashboard
- a food-delivery clone
- a recipe blog
- a toy app that trades usefulness for cuteness
- a raw shadcn demo with coral buttons

## Core Principles

### 1. Cooking Companion, Not Control Panel

Core cooking flows should feel guided and alive, not like profile administration. Screens should reduce the user's next decision to a clear action: scan, choose, start, cook, confirm, clean up.

Use administrative density only in settings and management surfaces. Setup, Planning, Cooking, and Post-cook should feel like Laica is walking with the user through a cooking moment.

### 2. Food-Native, Not Abstract AI

Visual motifs should come from cooking and pantry behavior: camera frames, ingredient chips, kitchen tools, tickets, trays, cooking cues, timers, check marks, pantry states, and finished-meal moments.

Avoid abstract AI tropes as primary identity: purple-blue gradients, floating orbs, sparkle-only decoration, chat bubbles as the main metaphor, or generic "assistant" panels.

### 3. Warm Energy With Restraint

Coral is the lead brand energy, especially for primary actions and active states. It should not flood every surface. Use warm neutrals, charcoal text, food-adjacent accent colors, and purposeful whitespace so coral moments feel intentional.

Avoid one-note palettes. A screen that is only coral, only beige/cream, only teal, or only dark blue is not the target. Warmth should come from hierarchy, shape, copy, and food-native cues, not color saturation alone.

### 4. Tactile Mobile Objects

Primary objects should feel tangible on a phone: camera viewfinders, ingredient chips, full-row choices, Ticket Pass cards, prep trays, cooking-step cards, and cleanup prompts. A surface can be playful or branded, but it should still feel usable in one hand.

Do not put cards inside cards or style every section as a floating card. Reserve framed objects for things the user can act on or inspect.

### 5. Playful Specificity, Not Noise

Laica can be funny and specific, especially in Slop Bowl and celebratory moments. The personality should come from precise wording, object shapes, small stickers/labels, and the occasional food-native emoji.

Avoid decorative clutter, constant animation, vague hype, or forced enthusiasm. Playfulness should make the app feel more human, not less capable.

### 6. Calm Confidence When Cooking

Cooking mode is a different emotional register from Planning. It should be clear, calm, cue-driven, and readable while the user's hands and attention are busy. Large type, simple controls, strong progress, and sensory cues matter more than decorative personality.

## Visual Exemplars

Text guidance is not enough to reproduce visual taste. The linked mockups below are canonical exemplars for the mobile refresh. Implementations should use these images as visual anchors and cite any deliberate deviations in the handoff.

### Phase 1 Auth

**Asset:** [phase-01-auth.png](../../../docs/assets/mobile-refresh/phase-01-auth.png)

Use this as the reference for:

- friendly first impression without generic AI-app chrome
- coral-led brand presence with restrained supporting colors
- simple auth hierarchy and uncluttered white space
- logo treatment and top-level Laica personality

Do not copy:

- a plain provider-button page with no branded Laica feeling
- generic gradient hero treatments
- dense explanatory onboarding text before sign-in

### Phase 2 Setup

**Asset:** [phase-02-setup.png](../../../docs/assets/mobile-refresh/phase-02-setup.png)

Use this as the reference for:

- camera-first setup composition
- scan surface as a designed Laica object, not raw native camera UI with buttons attached
- clear primary capture CTA with upload/manual/tips in a secondary hierarchy
- warm/coral onboarding mood
- chip, progress, and profile-choice treatment
- enough chrome for Back/escape without turning setup into a desktop wizard

Do not copy:

- form-first onboarding with camera as an accessory
- stacked generic shadcn cards
- full-screen native camera takeover with no Laica way back
- teal pantry chips when the accepted direction is warm/coral

### Phase 2.2 Returning Setup, Settings, And History IA

**Asset:** [phase-02-2-returning-setup-settings-storyboard.svg](../../../docs/assets/mobile-refresh/phase-02-2-returning-setup-settings-storyboard.svg)

Use this as the reference for:

- Menu as the global returning-user destination surface
- Settings as a calm, utilitarian, mobile-native place to edit Pantry, Kitchen, and Cooking Profile
- History as cooking memory, not account configuration
- separating History from Settings while keeping both visually consistent with mobile refresh
- carrying the Phase 2.1 scan/manual/profile patterns into returning-user edits without making Settings feel like a second onboarding wizard
- preserving the same rendered setup control shapes and typography when setup patterns move into Settings, not only reusing similar class names

Do not copy:

- the old tabbed `Kitchen & Settings` admin page
- a History tab buried inside Settings
- a Settings surface that relies on later visual polish to feel like Laica
- setup-derived controls under a new wrapper without verifying computed radius, font, icon size, active state, and disabled state against the accepted first-time setup surface

### Phase 3 Planning Flow

**Asset:** [phase-03-planning-flow.png](../../../docs/assets/mobile-refresh/phase-03-planning-flow.png)

Use this as the reference for:

- Chef It Up as the primary route
- Slop Bowl as scrappy, funny, and intentionally secondary
- visual hierarchy that makes planning feel native-mobile rather than dashboard-like
- cuisine/time controls that feel tactile and thumb-friendly
- personality that is specific to cooking, not generic assistant UI

Do not copy:

- the legacy two-card Planning choice unchanged
- equal-weight primary/secondary actions when the product direction prioritizes Chef It Up
- percentage-match or generic recommendation-card framing

### Phase 3 Ticket Pass

**Asset:** [phase-03-ticket-pass.png](../../../docs/assets/mobile-refresh/phase-03-ticket-pass.png)

Use this as the reference for:

- Ticket Pass as Laica's signature suggestion object
- tactile recipe cards with a distinct shape and personality
- useful information without generic AI match scoring
- optional enhancement framing that avoids mandatory grocery-list language

Do not copy:

- ordinary recipe cards with `X% match`
- generic AI result lists
- grocery-list pressure as the primary visual story

### Phase 4 Cooking

**Asset:** [phase-04-cooking.png](../../../docs/assets/mobile-refresh/phase-04-cooking.png)

Use this as the reference for:

- calm, focused, hands-busy cooking mode
- large readable instruction hierarchy
- sensory cues and progress as first-class visual elements
- controls that are reachable and obvious without visual noise

Do not copy:

- planning-level playfulness in the middle of active cooking
- dense step lists where the current action gets lost
- decorative motion that competes with the cooking instruction

### Phase 5 Post-Cook

**Asset:** [phase-05-post-cook.png](../../../docs/assets/mobile-refresh/phase-05-post-cook.png)

Use this as the reference for:

- light, non-punitive cleanup
- quick pantry update decisions
- warm retention moments that do not feel needy
- clear accept/skip/defer hierarchy

Do not copy:

- heavy forms after cooking
- guilt-driven retention copy
- pantry update surfaces that feel like inventory administration

### Anti-Examples To Avoid Across Phases

- Raw shadcn composition with only coral buttons changed.
- Generic AI-app surfaces: purple-blue gradients, abstract orbs, sparkle wallpaper, chat-first metaphors.
- Website chrome inside core app flows.
- Repeated floating cards for every section.
- One-note color screens that are all coral, all beige, all teal, or all dark blue.
- Hidden or missing Back/escape affordances in focused flows.
- Visual changes that are not traceable to a mockup, token, or documented tone-forward exception.

## Visual System Direction

### Color

- Lead with tokenized coral for primary actions, active states, progress emphasis, and branded moments.
- Use charcoal/dark neutral text for clarity and authority.
- Use warm light surfaces, but avoid making the app read as beige, cream, or washed out.
- Use teal, yellow, green, and food-adjacent accents by role, not as random decoration.
- Avoid purple/blue AI-gradient identity unless a future accepted design direction explicitly chooses it.
- Do not add new hex literals when an existing token can express the intent.

### Typography

- Phase 2.1 setup pilots the mobile-refresh typography direction in setup only: `Fraunces` for expressive setup headings and `Nunito` for setup body, buttons, chips, and controls.
- This is not a global typography rollout yet. Auth, Planning, Cooking, Settings, and other surfaces keep their current typography until their phase-specific pass adopts or revises this direction.
- When a later phase or returning-user surface adopts setup patterns, the implementation must preserve computed typography under that surface's root wrapper. Do not rely on inheritance that only works under `.setup-ui`.
- Headings should be confident, rounded, and readable, with enough personality to feel Laica-branded.
- Do not use hero-scale type inside compact app panels, cards, setup steps, or tool surfaces.
- Recipe names and Ticket Pass surfaces may use a more expressive title treatment if it remains legible.
- Body copy should be plain, direct, and supportive. Avoid feature-explainer text inside the app chrome.

### Shape and Surface

- Use stable, repeatable surface types: camera frame, chip, full-row selection, ticket, prep tray, cue card, bottom action bar.
- Compact cards and controls should stay disciplined; larger radii belong on intentional feature objects, not every container.
- Buttons should have clear command roles. Use icons where the action is familiar: back, close, camera, upload, check, add, save.
- The primary CTA should be visually obvious without requiring explanatory copy.
- Authenticated app pages should not carry a persistent top header. Account, profile, and sign-out access belongs in the bottom menu/account surface so core mobile flows keep vertical space for the task.
- Removing the top header does not mean removing navigation affordance. Authenticated flows need a bottom-menu entry for account/profile/sign-out/feedback access.
- First-time setup may use a compact account menu affordance inside the setup frame while Planning remains locked; this should provide account/feedback/sign-out access without bringing back a page header.
- Setup progress should use one clear top progress treatment, visually closer to the mockup's `1/5` bar, instead of combining brand chips, repeated step pills, and section labels in the same top area.
- Camera controls should feel familiar to mobile camera users: capture as a large circular control inside the camera object, camera on/off as an icon control inside the camera object, and scan tips as a lightweight in-context overlay rather than a separate row.
- Camera utility controls must be visually noticeable without turning into opaque primary CTAs. Prefer smaller translucent circular controls with larger icons; keep capture as a clean shutter control without a camera glyph. Avoid flashlight-like icons for non-flashlight tips.
- Secondary setup actions such as `Upload photos` and `Enter manually` must remain readable on a phone and use consistent type sizing, weight, and font treatment across equivalent actions.
- Secondary setup actions should avoid technical helper labels when the main command is clear. Prefer one clear label over small explanatory subcopy like file-count or delimiter mechanics.
- Kitchen setup can share Pantry's component model while shifting equipment-specific accents toward gray/silver and light wood, especially save actions, item chips, remove controls, and utility icons.

### Phase 2.1 Setup Pilot Checkpoint

Wilson accepted the Phase 2.1 setup visual direction on 2026-04-30 after the setup conformance, menu/camera-control, welcome-copy, Kitchen-accent, and upload-limit passes. PR #27 merged this pilot into `main` on 2026-05-01.

Carry this forward as design-language signal, not as a mandatory global rollout:

- Setup can use `Fraunces` display type and `Nunito` body/control type as the current mobile-refresh typography pilot.
- Setup should open with friendly direct copy, not an explanatory eyebrow before the primary welcome heading.
- Camera-first surfaces should keep user control visible: camera off by default, camera controls inside the scan object, blank shutter capture, translucent utility controls, and upload/manual paths nearby.
- Warm coral remains the setup progress and primary action anchor; Kitchen can introduce gray/silver and light wood accents only for tool-specific surfaces.
- Technical helper labels should not sit under obvious secondary commands when they make the UI feel more complicated than the task.

### Iconography and Emoji

- Use `lucide-react` as the default icon language.
- Setup choice icons may use small multicolor food/tool/dietary illustrations when the mockup calls for a warmer, less monochrome surface.
- Emoji is allowed on tone-forward surfaces when it carries product voice better than a generic icon. Use it sparingly.
- Settings, auth, errors, and safety-critical flows should prefer clear icons and text over emoji.

### Imagery and Illustration

- Prefer visuals that reveal the actual product state: camera preview, ingredients, tools, tickets, cooking cues, meal state.
- Avoid stock-like, dark, blurred, or purely atmospheric images when the user needs to inspect something.
- Avoid decorative blobs/orbs and abstract backgrounds as a substitute for product-specific visuals.
- Generated food imagery is deferred until a later accepted feature direction.

### Motion

- Motion should clarify state change or add a small moment of delight.
- Avoid constant ambient motion on task surfaces.
- Cooking mode motion should be calm and functional: progress, timers, listening/speaking state, and step transitions.

## Surface Taxonomy

| Surface type | Examples | Visual posture |
|---|---|---|
| Branded utility | Setup, scan review, profile choices | Warm, focused, mobile-native, mockup-led |
| Tone-forward | Planning entry, Slop Bowl, Ticket Pass, celebrations | Playful, distinctive, still task-clear |
| Focus mode | Active cooking guidance | Calm, large, legible, low clutter |
| Utilitarian | Settings, account, admin-like profile edits | Quiet, dense enough for repeated use, no unnecessary decoration |
| Safety/error | Auth errors, rate limits, no-detection feedback | Direct, reassuring, readable, no jokes that obscure action |

## Phase Guidance

### Phase 2 Setup

Phase 2 is the first active pilot for this design language. Before merge:

- Setup-specific typography should use the Phase 2.1 pilot direction: `Fraunces` display headings plus `Nunito` UI/body text, scoped behind setup-only classes such as `.setup-ui`, `.setup-display`, and `.setup-copy`.
- Pantry/Kitchen setup should look like intentional Laica onboarding, not a form with camera buttons.
- Camera preview should be framed as a designed scan surface with an obvious capture action.
- Upload/manual should sit below capture in a secondary hierarchy; tips should move into the camera object as a lightweight overlay.
- Back/escape must be part of the setup chrome.
- Cooking Skill and Dietary Restrictions should feel like full-row mobile choices, not small radio controls.
- Chips should look warm, readable, and tokenized.
- Pantry and Kitchen should share component structure, but Kitchen may shift selected accents toward gray/silver and light wood beige to reflect modern kitchen tools while retaining enough coral to stay within the Laica system.
- Kitchen-specific action buttons, saved-equipment chips, and review/list states should lean gray/silver where possible so the tool page feels distinct from the warmer pantry page without becoming a separate design system.
- Future scan-review chips may need session-state colors or indicators for `new from latest scan`, `already saved/found again`, and normal saved inventory. This should build on the Pantry/Kitchen chip palette without creating a noisy third design system; see [EPIC-014](../../../epics/014-scan-session-diff-and-duplicate-refinement.md).
- `No restrictions` should be visually separated from the rest of the dietary options so users who have nothing to add can choose the default quickly.

### Phase 2.2 Returning Setup, Settings, And History IA

- Menu should be the global returning-user destination surface for Settings, History, Feedback, Account, and Sign out.
- Settings should stay utilitarian but inherit the Phase 2.1 setup language where it manages the same concepts: designed scan object, peer scan/upload/manual actions, warm Pantry chips, gray/silver Kitchen accents, and full-row profile choices.
- Returning Pantry/Kitchen/Profile should reuse the first-time setup component language wherever the underlying task is the same; flow wrappers may differ, but scan/upload/manual/profile controls should not drift into separate products.
- The visual difference between first-time setup and returning Settings should come from intent, not a new aesthetic: setup is guided/progress-led, while Settings is edit/review/save-led. Typography, camera object, action hierarchy, chips, and choice rows should remain recognizably the same system.
- Settings should not include History. History is its own memory surface and should feel warmer and more meal-oriented than account configuration.
- The Phase 2.2 storyboard is a conformance input. If implementation misses the storyboard's hierarchy or mood, treat that as phase work, not a later polish ticket.
- PR #30 merged this bridge as the second accepted mobile-refresh visual proof point after Phase 2.1 setup. Future phases should treat the Phase 2.2 Menu, Settings, and History shell as accepted IA/design context rather than reintroducing legacy Settings tabs.

### Phase 3 Planning

- Planning entry should no longer look like the legacy two-card choice.
- Chef It Up should be the primary path; Slop Bowl should be scrappy, funny, and clearly secondary.
- Ticket Pass should become the signature recipe-suggestion object.
- Recipe suggestions should not look like generic AI match cards.

### Phase 4 Cooking

- Cooking guidance should privilege legibility, focus, and confidence.
- Visual personality should be calmer than Planning.
- Controls must be reachable and obvious in a hands-busy context.
- Sensory cues and progress should be visually central.

### Phase 5 Post-Cook

- Cleanup should feel lightweight and non-punitive.
- Pantry update moments should be quick to accept, skip, or defer.
- Retention moments should be warm and specific without sounding needy.

## Review Checklist

Before a mobile-refresh phase is marked ready:

- Has the reviewer opened the linked visual exemplar for the phase?
- Does the primary screen visibly match the linked mockup's hierarchy and mood?
- Does the screen feel like Laica, not generic AI/SaaS/shadcn?
- Is the primary action unmistakable?
- Are secondary actions available without competing with the primary action?
- Are back/escape paths visible where users can enter a focused flow?
- Does the color usage have a clear role and avoid one-note saturation?
- Are type sizes appropriate to the surface, not oversized by habit?
- Are icons, emoji, imagery, and motion serving product meaning?
- Are repeated patterns reusable or documented as intentional one-offs?
- Does the handoff state any deliberate visual deviation from the mockup?

## Relationship to Other Docs

- EPIC-012 owns the open design-language work and tracks unresolved identity decisions.
- EPIC-001 owns implementation governance and enforcement once the direction is accepted.
- `design_guidelines.md` remains the current-implementation record until this draft graduates.
- Phase records own surface-specific acceptance criteria.

## Open Decisions

- Whether the Phase 2.1 setup typography pilot becomes the global mobile-refresh typography direction or stays setup-specific.
- Whether the coral/teal/yellow palette is refined or replaced.
- Canonical motif set: camera frame, Ticket Pass, prep tray, pantry chip, cooking cue, or another visual object.
- How much illustration versus real/generated food imagery belongs in the app.
- Whether this draft graduates into a top-level product decision, a rewritten `design_guidelines.md`, or both.
