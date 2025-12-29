# Laica AI Cooking Assistant - Design Guidelines

## Design Approach
**System**: shadcn/ui with customization for warm, approachable cooking experience
**Inspiration**: Notion's clean information hierarchy + Instagram's visual recipe presentation + Headspace's friendly, guided experience
**Mobile-First Philosophy**: All layouts designed for thumb-friendly interaction, optimized for one-handed cooking use

## Typography System
- **Primary Font**: Inter (via Google Fonts) for clean readability
- **Accent Font**: DM Serif Display for recipe titles and warm personality
- **Scale**:
  - Hero/Recipe Titles: text-3xl to text-4xl (DM Serif Display, font-semibold)
  - Section Headers: text-xl to text-2xl (Inter, font-semibold)
  - Body Text: text-base (Inter, font-normal)
  - Step Numbers: text-5xl to text-6xl (DM Serif Display, font-bold, subtle opacity)
  - Captions/Meta: text-sm (Inter, font-medium)

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
- Cards: Rounded-2xl with soft shadows

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
**Library**: Heroicons (outline for default, solid for active states)
**Common Icons**: 
- Chef hat, clock, users (servings), flame (difficulty)
- Microphone, search, bookmark, shopping bag
- Chevrons, check marks, plus/minus

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