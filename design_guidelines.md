# Laica AI Cooking Assistant - Design Guidelines

> **Status: current-implementation record.** This document describes what the app *currently uses*, not the long-term target. A future refresh is planned to give Laica a more distinctive visual identity — less generic-AI-app-looking — but that is tracked as a separate workstream. Until that refresh lands, this doc is the source of truth for day-to-day code review and the UI-consistency rubric (see `docs/handoffs/2026-04-16-codex-ui-consistency-handoff-test.md`).

## Design Approach
**System**: shadcn/ui with customization for warm, approachable cooking experience
**Inspiration**: Notion's clean information hierarchy + Instagram's visual recipe presentation + Headspace's friendly, guided experience
**Mobile-First Philosophy**: All layouts designed for thumb-friendly interaction, optimized for one-handed cooking use

## Typography System

Current fonts loaded in `client/src/index.css`:

```css
@import url('https://fonts.googleapis.com/css2?family=Merriweather:wght@400;700&family=Source+Sans+Pro:wght@400;600&display=swap');
```

- **Body**: Tailwind default `font-sans` stack (system UI on each platform) — applied via `body { @apply font-sans; }`
- **Headings** (`h1`–`h6`): `'SF Pro Display', 'Source Sans Pro', sans-serif` — picks up SF Pro natively on macOS/iOS, falls back to Source Sans Pro (loaded from Google Fonts) elsewhere
- **Recipe titles** (`.recipe-title` utility class): `'Merriweather', serif` — used on full recipe-detail surfaces for warmth

**Scale** (Tailwind utility classes in active use):
  - Hero/Recipe Titles: `text-3xl` to `text-4xl`, `font-semibold`, `.recipe-title` (Merriweather)
  - Section Headers: `text-xl` to `text-2xl`, `font-semibold` (SF Pro / Source Sans Pro stack)
  - Body Text: `text-base`, `font-normal` (system sans)
  - Step Numbers: `text-5xl` to `text-6xl`, `font-bold`, subtle opacity
  - Captions/Meta: `text-sm`, `font-medium`

> **Future direction**: Wilson plans to move away from the current Merriweather + SF Pro / Source Sans Pro stack toward a more distinctive type identity. Tracked as a separate workstream; no in-flight changes.

## Color Palette & Tokens

Brand colors live as CSS variables in `client/src/index.css` and are exposed to Tailwind via `bg-primary`, `text-secondary`, `bg-accent`, etc.

| Token | HSL | Hex | Role |
|---|---|---|---|
| `--primary` | `0 80% 71%` | `#FF6B6B` | Warm coral — primary CTA, active states, highlights |
| `--secondary` | `174 60% 56%` | `#4ECDC4` | Culinary teal — secondary actions, timers, progress |
| `--accent` | `43 100% 71%` | `#FFE66D` | Butter yellow — callouts, small emphasis |
| `--sidebar-background` | `222 14.3% 19.1%` | `#2D3436` | Charcoal — sidebar / dark surfaces |
| `--destructive` | `0 84.2% 60.2%` | — | Standard red for destructive actions |

Additional hover/shade values in active use: `#FF5252` (primary hover), `#FFB347`, `#FFD93D` (accent shades).

**Rubric rule (Phase 0):** new code must reach the brand palette via tokens (`bg-primary`, `hover:bg-primary/90`, `bg-accent`) rather than hex literals (`bg-[#FF6B6B]`). Existing hex callsites will migrate incrementally — see the UI-consistency plan for enforcement details.

## Layout System
**Spacing Primitives**: Tailwind units of 3, 4, 6, 8, 12, 16
- Mobile padding: px-4, py-6
- Desktop padding: px-8, py-12
- Card spacing: p-6
- Section gaps: gap-8 to gap-12
- Component spacing: space-y-4, space-y-6

**Container Strategy**:
- Mobile: Full width with px-4 gutters
- Desktop: max-w-6xl centered (when needed for recipe detail views)
- Cards: default shadcn `Card` primitive uses `rounded-lg` with `shadow-sm`. Featured / hero cards (marketing and home sections) use `rounded-xl` with `shadow-sm hover:shadow-md`. Reserve `rounded-2xl` for genuinely hero-sized imagery; avoid arbitrary-value radii (`rounded-[N]`).

## Core Component Library

### Navigation
**Bottom Navigation Bar** (Mobile Primary):
- Fixed bottom bar with 4 icons: Home, Recipes, Pantry, Profile
- Active state: Coral background pill around icon + label
- Icons from Heroicons
- Height: h-16 with safe-area-inset padding

**Top App Bar**:
- Sticky position with backdrop blur
- Search bar (rounded-full) prominently featured
- Voice assistant trigger button (right-aligned, coral accent)

### Recipe Cards
**Featured Recipe Card** (Home Hero):
- Rounded-2xl with image aspect-ratio-[4/3]
- Gradient overlay (bottom) for text readability
- Recipe title (text-2xl, white, DM Serif Display)
- Quick stats row: time, difficulty, servings (icons + text-sm)
- CTA button with backdrop blur effect

**Grid Recipe Cards**:
- Rounded-xl, image aspect-ratio-[3/2]
- Compact info overlay (bottom-aligned)
- Heart icon (save/favorite) top-right
- grid-cols-2 on mobile, grid-cols-3 on desktop

### Live Cooking Mode
**Full-Screen Step Display**:
- Current step number: Massive watermark-style (text-8xl, opacity-10)
- Step instruction: text-xl, center-aligned, max-w-prose
- Timer component: Circular progress indicator (teal accent)
- Navigation: Large previous/next buttons (bottom, h-14)
- Voice indicator: Pulsing animation when assistant is speaking
- Emergency pause button: Top-right, coral background

### Pantry Management
**Ingredient List Items**:
- Checkbox (rounded-md, teal when checked)
- Ingredient name + quantity (text-base)
- Expiry indicator: Color-coded badge (green/yellow/red)
- Swipe actions: Delete (coral) and Edit (teal)

### Forms & Inputs
**Search Bar**:
- rounded-full, h-12
- Prominent on home screen
- Voice input icon (right-side)

**Filter Pills**:
- rounded-full, px-4, h-10
- Active state: coral background
- Horizontal scroll on mobile

### Modals & Overlays
**Voice Assistant Sheet**:
- Bottom sheet (mobile), slide-up animation
- Waveform visualization (teal)
- Suggestion chips below (rounded-full)
- "Listening..." pulsing indicator

## Icons
**Library**: `lucide-react` (53 import sites across `client/src`). Default variant is outline-style; use the same icon at a different size/weight rather than swapping libraries for an emphasis shift.
**Common icons already in use**: `ChefHat`, `Clock`, `Home`, `Settings`, `User`, `MessageCircle`, `Camera`, `Mic` / `MicOff`, `Play` / `Pause`, `Check` / `CheckCircle`, `ArrowLeft` / `ArrowRight`, `Plus`, `Info`, `AlertTriangle`, `Loader2`, `LogOut`, `Bell`, `Calendar`, `Copy`, `Menu`, `MoreVertical`.
**Emoji as iconography**: acceptable on tone-forward surfaces (e.g. 🥣 on the Slop Bowl card, 👨‍🍳 / 👩‍🍳 on the planning-choice card) when the emoji carries product voice better than a lucide glyph would. Use sparingly on utilitarian surfaces.

## Images
**Hero Section** (Home Screen):
- Large featured recipe image at top
- Aspect ratio: 4:3 on mobile, 16:9 on desktop
- Warm, well-lit food photography with shallow depth of field
- Gradient overlay from transparent to black (bottom 40%)

**Recipe Detail Header**:
- Full-width hero image, aspect-ratio-[16/9]
- Professional food photography, bright and appetizing
- Blurred background effect for floating action buttons

**Recipe Grid Images**:
- Square cropped food photos showing finished dish
- Consistent lighting and styling across all images
- High-quality, vibrant colors that complement coral/teal palette

**Pantry Items** (Optional):
- Small thumbnail images (w-12, h-12, rounded-lg) for ingredient recognition

## Screen-Specific Layouts

### Home Dashboard
Status: deferred / aspirational. Per `product-decisions/006-home-and-cook-remain-separate.md`, the current accepted IA keeps **Home** and **Cook** as separate surfaces. Home remains the landing/welcome surface, Cook remains the planning entry, and Cook is disabled until profile setup is complete. The richer dashboard ideas below remain a future direction, not a current implementation requirement.

- Hero featured recipe with image + CTA
- "Quick Start" section: Voice-activated cooking button (prominent, rounded-2xl, coral gradient)
- Horizontal scroll: "Continue Cooking" saved recipes
- Grid: "Recommended for You" (2 columns mobile)
- Categories filter pills (top, horizontal scroll)

### Recipe Detail
- Hero image with back button (top-left, blurred background)
- Title (DM Serif Display, text-3xl)
- Metadata row: time, servings, difficulty badges
- Tabs: Ingredients | Instructions | Tips
- "Start Cooking" FAB (coral, bottom-right, with voice icon)

### Active Cooking View
- Minimal chrome, full focus on current step
- Ingredient checklist (collapsible drawer)
- Timer (always visible, sticky)
- Hands-free mode toggle (voice-only navigation)

### Pantry Screen
- Search/add ingredient bar (top)
- Category tabs: All, Expiring Soon, Shopping List
- Grouped list with section headers
- FAB: Quick add (scan or manual)

## Interaction Patterns
- Swipe gestures: Recipe cards (save/skip), pantry items (edit/delete)
- Pull-to-refresh: Recipe feed
- Long-press: Quick actions menu
- Voice wake word: "Hey Laica" for hands-free control
- Haptic feedback: Step completion, timer alerts, voice recognition start/stop

## Accessibility
- Minimum touch targets: 44x44px
- High contrast text on all image overlays
- Voice control for entire cooking flow
- Large, readable fonts during active cooking
- Clear focus states for keyboard navigation
