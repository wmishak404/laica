# Laica — Design Guidelines

> **Status: canonical living standard.** Visual identity, tokens, surface posture, and mockup-conformance expectations live here. Governance rules (token enforcement, primitive lock order, tone-override convention, scoped-style reuse contract) live in [PD-005](product-decisions/pd-005-ui-governance.md). Historical context: [EFF-001](efforts/effort-001-ui-governance.md) (resolved) and [EFF-012](efforts/effort-012-laica-design-language.md) (resolved).

## Visual Identity

Laica is a warm, capable mobile cooking companion. It should feel food-native and mobile-native, not like a generic AI app, SaaS dashboard, or shadcn demo.

User-facing prose writes the brand as `Laica`, not all-caps `LAICA`, unless a logo asset or legal/artwork context requires otherwise.

Do not repeat the product mark inside ordinary in-app process screens such as setup, planning, selection, cooking, confirmation, or settings flows unless the surface is explicitly acting as a branded entry/sign-in/landing moment. When a surface does display the product mark as a brand object, use the canonical cropped logo asset (`@assets/laica_logo_v1_cropped_1763444931884.png`) rather than recreating a one-off text wordmark in CSS. Text-only `Laica` is acceptable in body copy, headings, metadata, or deliberately documented mockup deviations, but not as a silent replacement for the logo on branded app surfaces.

Favicon, PWA, and app-icon assets use the spatula mark from the `i` in the canonical Laica wordmark as the small-size brand mark. Do not replace these icons with unrelated cooking-tool or chef-hat symbols unless a future accepted brand decision changes the mark.

### Six principles

1. **Cooking companion, not control panel.** Setup, Planning, Cooking, and Post-cook should reduce the user's next decision to a clear action: scan, choose, start, cook, confirm, clean up. Reserve administrative density for Settings and management surfaces.
2. **Food-native, not abstract AI.** Visual motifs come from cooking: camera frames, ingredient chips, kitchen tools, tickets, trays, cooking cues, timers, check marks. Avoid AI tropes (purple-blue gradients, floating orbs, sparkle decoration, chat bubbles as primary metaphor).
3. **Warm energy with restraint.** Coral leads primary actions and active states. Use warm neutrals, charcoal text, and food-adjacent accent colors so coral moments feel intentional. No one-note screens.
4. **Tactile mobile objects.** Camera viewfinders, ingredient chips, full-row choices, Ticket Pass cards, prep trays, cooking-step cards, cleanup prompts feel tangible in one hand. Don't put cards inside cards.
5. **Playful specificity, not noise.** Personality comes from precise wording, object shapes, small stickers/labels, and occasional food-native emoji. Avoid decorative clutter, constant animation, vague hype.
6. **Calm confidence when cooking.** Cooking mode is a different register from Planning — clear, calm, cue-driven, readable while hands and attention are busy.

## Tokens

Brand colors live as CSS variables in `client/src/index.css` and are exposed to Tailwind via `bg-primary`, `text-secondary`, `bg-accent`, etc.

| Token | HSL | Hex | Role |
|---|---|---|---|
| `--primary` | `0 80% 71%` | `#FF6B6B` | Warm coral — primary CTA, active states, highlights |
| `--secondary` | `174 60% 56%` | `#4ECDC4` | Culinary teal — secondary actions, timers, progress |
| `--accent` | `43 100% 71%` | `#FFE66D` | Butter yellow — callouts, small emphasis |
| `--sidebar-background` | `222 14.3% 19.1%` | `#2D3436` | Charcoal — sidebar / dark surfaces |
| `--destructive` | `0 84.2% 60.2%` | — | Standard red for destructive actions |

Hover/shade values in active use: `#FF5252` (primary hover), `#FFB347`, `#FFD93D`. Per PD-005, new code reaches the brand palette via tokens (`bg-primary`, `hover:bg-primary/90`, `bg-accent`) — not hex literals.

### Typography

Loaded in `client/src/index.css`:

```css
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,700;9..144,800&family=Merriweather:wght@400;700&family=Nunito:wght@400;500;600;700;800&family=Patrick+Hand&family=Source+Sans+Pro:wght@400;600&display=swap');
```

Global stack (current accepted state):

- **Body:** Tailwind `font-sans` (system UI per platform).
- **Headings (`h1`–`h6`):** `'SF Pro Display', 'Source Sans Pro', sans-serif`.
- **Recipe titles** (`.recipe-title`): `'Merriweather', serif`.

Mobile-refresh typography pilot (Phase 2.1 + Phase 2.2 returning Settings, Phase 3 Planning):

- **Setup display:** `Fraunces` — scoped to `.setup-ui .setup-display` and equivalent setup surfaces.
- **Setup body / controls:** `Nunito` — scoped to `.setup-ui .setup-copy`, `.setup-action-label`, etc.
- **Phase 3 Planning display / cards / body:** `Nunito` — use one rounded sans family for page headlines, choice-card titles, short taglines, controls, chips, and dense UI. The generated Phase 3 mockups are the source of truth for this flow.
- **Handwritten micro-accents:** `Patrick Hand` — scoped to tiny doodle scribbles only, not page headings, card titles, body copy, CTAs, safety-critical controls, or extra banners.

Avoid switching the primary title font just to communicate mood. Humor should come from copy, illustration, motion, and composition while primary titles remain in the surface's established type system. If a generated mockup is internally consistent, preserve its grammar before layering additional design principles.

Whether `Fraunces` / `Nunito` graduate to the global stack is an open visual decision (see below).

### Spacing

Tailwind units `3, 4, 6, 8, 12, 16`. Mobile gutters `px-4 py-6`; cards `p-6`; section gaps `gap-8` to `gap-12`; component spacing `space-y-4` / `space-y-6`. Mobile containers full-width with `px-4`; desktop `max-w-6xl` centered when needed.

### Mobile Browser Viewports

The mobile web app runs inside browser chrome, not a native full-screen shell. Browser-mode layout should preserve the accepted app proportions while respecting the smaller visible viewport.

- Short decision surfaces should make the next useful action discoverable in the first visible viewport when practical. Do not make every page smaller; long inventory, settings, scan-review, and cooking-content pages may scroll as long as they start cleanly and the user can tell there is more content.
- Primary next actions should occupy a consistent bottom action lane on short guided flows. Secondary or alternative actions should stay in normal page flow unless they are the single primary continuation.
- Top content must begin below browser chrome on fresh load and after step changes. A user should not need to infer that a hidden title, progress marker, or leading copy exists above the visible viewport.
- Similar text levels should keep the same computed size, weight, and family across related flows. Fit pressure should be solved with shared layout rhythm, content hierarchy, and scoped component changes before one-off font shrinking.
- Scrollports should have one clear owner. Do not let a page scroll past the meaningful end into inert blank space below the final control lane.
- Floating or pinned controls are acceptable only when they improve task continuity. They must not cover headings, content, selected states, or tap targets; if a floating control collides with content, revisit the layout rather than piling on pixel offsets.
- Browser-mode adaptations should be scoped to the affected flow or shared primitive. Avoid broad CSS selectors that silently resize Setup, Planning, Settings, Slop Bowl, Live Cooking, and public/landing surfaces together.
- Validate browser-mode work on an actual phone browser or an accepted equivalent before merge. Desktop Chrome with a mobile viewport is useful for functional smoke, but it is not sufficient visual evidence for address-bar and bottom-browser-chrome behavior.

## Surface Taxonomy

(Mirrors PD-005. Both files keep the same vocabulary; PD-005 governs conformance, this file shapes posture.)

| Posture | Examples | Visual posture |
|---|---|---|
| Tone-forward | Slop Bowl card, Planning entry, Ticket Pass, celebrations | Playful, distinctive, still task-clear |
| Branded utility | Setup, returning Settings (Pantry/Kitchen/Profile), scan review | Warm, focused, mobile-native, mockup-led |
| Utilitarian | Account, grocery list, history list shell, bottom navigation | Quiet, dense enough for repeated use, no unnecessary decoration |
| Focus mode | Active cooking guidance | Calm, large, legible, low clutter |
| Safety/error | Auth errors, rate limits, no-detection feedback | Direct, reassuring, readable; no jokes that obscure action |

## Mockup conformance gate

Linked mockups are **acceptance inputs**, not mood boards. A phase is not visually ready when the primary user surfaces still read as the pre-refresh UI.

Before a mobile-refresh phase merges:

- The reviewer opens the linked exemplar and compares hierarchy, mood, and key controls.
- Deliberate deviations are documented in the handoff and PR description.
- For tone-forward surfaces, the tone-override comment from PD-005 names the customized element.
- For surfaces reusing accepted phase-scoped class names, the reviewer verifies *rendered/computed style* (typography, radius, icon size, hover/active/disabled states), not just class-name reuse.

| Phase | Exemplar |
|---|---|
| Phase 1 Auth | [phase-01-auth.png](docs/assets/mobile-refresh/phase-01-auth.png) |
| Phase 2 Setup | [phase-02-setup.png](docs/assets/mobile-refresh/phase-02-setup.png) |
| Phase 2.2 Returning Settings | [phase-02-2-returning-setup-settings-storyboard.svg](docs/assets/mobile-refresh/phase-02-2-returning-setup-settings-storyboard.svg) |
| Phase 3 Planning | [phase-03-planning-flow.png](docs/assets/mobile-refresh/phase-03-planning-flow.png) |
| Phase 3 Ticket Pass | [phase-03-ticket-pass.png](docs/assets/mobile-refresh/phase-03-ticket-pass.png) |
| Phase 4 Cooking | [phase-04-cooking.png](docs/assets/mobile-refresh/phase-04-cooking.png) |
| Phase 5 Post-cook | [phase-05-post-cook.png](docs/assets/mobile-refresh/phase-05-post-cook.png) |

## Visual System Direction

### Color

- Lead with tokenized coral for primary actions, active states, progress emphasis, branded moments.
- Charcoal/dark neutral text for clarity.
- Warm light surfaces, but avoid screens that read entirely beige/cream/coral/teal/dark-blue.
- Teal, yellow, green, food-adjacent accents by role, not random decoration.
- No purple/blue AI-gradient identity unless a future accepted decision picks it.

### Shape and surface

- Repeatable surface types: camera frame, chip, full-row selection, ticket, prep tray, cue card, bottom action bar.
- Compact cards stay disciplined; larger radii belong on intentional feature objects.
- Buttons have clear command roles; the primary CTA is visually obvious without explanatory copy.
- Pantry/status chips should use icon and color, not extra status words, when the state is otherwise obvious. Current Phase 3.2 pantry-confirmation grammar: pending/removable additions are coral chips with a `+` and right-side `X`; saved pantry facts are green chips with a checkmark only and no visible `Saved` label. If a saved fact is tapped where deletion would be ambiguous, reveal brief inline direction to Pantry Settings instead of deleting it in place.
- Setup and returning Settings Pantry/Kitchen inventory review uses the same state grammar: saved items are green checked chips, recently-added manual/scan items are coral `+` chips with an `X`, and found-again scan matches remain green checked chips with a quiet latest-scan emphasis plus scan outcome copy. This state is client-side and clears on setup Continue or successful Settings save.
- Authenticated app pages do not carry a persistent top header (per PD-009). Account, profile, and sign-out access live in the bottom menu/account surface.
- Durable cross-functional navigation surfaces, including the bottom nav and app menu/account drawer, require explicit Wilson approval before adding, removing, renaming, reordering, or changing auth-mode visibility for actions.
- Setup progress uses one clear top progress treatment (`1/N` bar style), not stacked brand chips + step pills + section labels.
- Camera utility controls inside the camera object: large circular capture, smaller translucent circular toggles for camera on/off and tips. No flashlight-like icons for non-flashlight tips. Capture is a clean shutter without a camera glyph.
- Secondary setup actions (`Upload photos`, `Enter manually`) keep consistent type sizing and weight across equivalent surfaces. No technical helper labels under obvious commands.
- Kitchen-specific surfaces shift accents toward gray/silver and light wood for tool-specific actions, chips, save buttons, and item icons; coral progress is preserved.

### Iconography and emoji

- `lucide-react` is the default icon language.
- Setup choice icons may use small multicolor food/tool/dietary illustrations when the mockup calls for warmer, less monochrome surfaces.
- Emoji is allowed on tone-forward surfaces when it carries product voice better than a generic icon. Use sparingly; avoid in Settings, auth, errors, safety-critical flows.

### Imagery and illustration

- Prefer visuals that reveal product state: camera preview, ingredients, tools, tickets, cooking cues, meal state.
- Phase 3 Ticket Pass suggestions should reserve a clear image/illustration slot as part of the ticket object; do not collapse them into generic text cards. Phase 3 may use a designed placeholder while Phase 3.1 owns the actual recipe imagery direction.
- Avoid stock-like, dark, blurred, or atmospheric images when the user needs to inspect.
- Avoid decorative blobs/orbs and abstract backgrounds as substitutes for product-specific visuals.
- Actual recipe imagery is deferred to Phase 3.1. If AI-generated imagery is introduced there, it should be async/cached and must not block the initial recipe-suggestion reveal.

### Motion

- Motion clarifies state change or adds a small moment of delight.
- Provenance/state-change flashes should be visible on the filled surface when the user needs to know exactly what changed; avoid relying on a thin border-only pulse for small chips or glanceable cards.
- No constant ambient motion on task surfaces.
- Cooking-mode motion stays calm and functional: progress, timers, listening/speaking state, step transitions.

## Accepted Phase Directions

### Phase 2.1 setup pilot — accepted (PR #27, 2026-05-01)

Setup uses `Fraunces` display + `Nunito` body/control type, scoped to `.setup-ui` and friends. Cream/coral phone-flow shell. Designed scan viewfinder with camera off by default. Camera/tips controls inside the scan object as small translucent circles. Blank shutter capture. Single top progress bar. Peer-level upload/manual actions. Multicolor setup-choice illustrations. `No restrictions` isolated from other dietary choices. Kitchen accents shift toward gray/silver/light-wood while progress stays coral. Setup-only — does not change global app typography or shared shadcn primitives.

### Phase 2.2 returning Settings — accepted (PR #30, 2026-05-01, validated at `dc59796`)

Menu is the global returning-user destination surface. Settings owns Pantry/Kitchen/Profile edits; History is a separate cooking-memory surface. Returning Settings reuses the setup look/feel foundation: setup-scoped display/body typography, the setup `NativeCamera` object inline with camera off by default, setup-style upload/manual buttons, setup scanning state, setup chips/list surfaces, setup profile choice rows. Returning Settings is calmer and edit-led, not a different product from setup. Bottom nav is icon-only.

**Implementation guardrail.** Reusing `setup-*` class names alone does not preserve the setup look — the accepted CSS depends on `.setup-ui .setup-*` selector specificity, which a new wrapper does not provide. Either render under a wrapper that carries the specificity contract, or extract a shared component/style primitive. Visual review verifies *computed* typography, radius, icon size, hover/active/disabled state on the destination surface. (Codified in PD-005 rule 5.)

## Open Visual Decisions

These are the unresolved identity questions. Edit this section inline as Phase 3-5 lands evidence; do not file a separate epic unless one of them grows into its own multi-phase concern.

1. **Setup typography globalization.** Whether `Fraunces` / `Nunito` graduates from setup-scoped to the global mobile-refresh typography. Pending Phase 3-5 evidence.
2. **Palette refinement.** Whether coral/teal/yellow stays, expands, or is replaced for the durable Laica identity.
3. **Canonical motif set.** Which visual motifs become signature Laica objects: camera frame, Ticket Pass, prep tray, pantry chip, cooking cue, chef companion.
4. **Playfulness by surface.** How playful Laica should feel by surface type (setup vs Planning vs Cooking vs Settings vs errors vs empty states).
5. **Imagery approach.** Current signal: Ticket Pass reserves an image slot with a Phase 3 placeholder; actual recipe illustration/generated imagery belongs to Phase 3.1 and should be async/cached if generated.
6. **Mockup hardness.** Which mockup elements are hard requirements vs directional examples.
7. **Post-cook scan-session chip states.** Setup/Settings now use the accepted green saved/found-again and coral recently-added inventory chip grammar. Future Phase 5 post-cook rescan labels (`Already saved`, `Found again`, `New`) should build on that grammar without reintroducing a separate chip language.

## Anti-patterns

- Raw shadcn composition with only coral buttons changed.
- Generic AI-app surfaces: purple-blue gradients, abstract orbs, sparkle wallpaper, chat-first metaphors.
- Website chrome inside core app flows.
- Repeated floating cards for every section.
- One-note color screens (all coral, all beige, all teal, all dark blue).
- Hidden or missing Back/escape affordances in focused flows.
- Visual changes not traceable to a mockup, token, or documented tone-forward exception.
- Hex color literals (`bg-[#FF6B6B]`) when a token resolves to the same value.
- Custom `<Button className="...">` overrides instead of extending `buttonVariants`.
- Reusing phase-scoped utility classes without verifying computed style on the destination surface.
- Browser-fit changes that apply through broad global selectors instead of scoped wrappers or shared primitives.
- Mobile browser pages that scroll into inert blank space after the final meaningful content or control lane.

## Review checklist

Before a feature or phase is marked visually ready:

- Reviewer opened the linked exemplar (if a phase mockup exists).
- Primary screen visibly matches the exemplar's hierarchy and mood.
- Any visible product mark is appropriate to the surface and uses the canonical logo asset, or the handoff documents why text-only brand treatment is intentional.
- Screen feels like Laica, not generic AI/SaaS/shadcn.
- Primary action is unmistakable; secondary actions don't compete with it.
- Back/escape paths are visible from focused flows.
- Color usage has a clear role; no one-note saturation.
- Type sizes appropriate to the surface; no oversized hero type inside compact panels.
- Icons, emoji, imagery, and motion serve product meaning.
- Repeated patterns are reusable or documented as intentional one-offs.
- Mobile browser review covers a fresh load and a step change: top content is not hidden under browser chrome, primary continuation is discoverable where practical, and the scroll endpoint stops at meaningful content rather than inert blank space.
- For surfaces reusing phase-scoped class names: rendered control comparison done (typography, radius, icon size, hover/active/disabled states) — not just class-name reuse.
- Handoff names any deliberate deviation from the mockup or governance rule.
- Tone-forward overrides carry the `// design:tone-override — <reason>` comment from PD-005.

## Accessibility

- Minimum touch targets: 44x44px.
- High contrast text on all image overlays.
- Voice control across the cooking flow.
- Large, readable fonts during active cooking.
- Clear focus states for keyboard navigation.
