# Replit.md

## Overview

Laica is an AI-powered cooking assistant designed to revolutionize meal preparation. It offers features such as AI-driven recipe suggestions based on pantry ingredients, grocery list generation, and interactive, step-by-step cooking guidance with voice and visual feedback. The application prioritizes a mobile-first user experience and aims to simplify the cooking process from planning to plate.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

The application employs a full-stack architecture with distinct client and server components.

### Frontend Architecture
- **Framework**: React with TypeScript, built using Vite.
- **UI Components**: Shadcn/ui, leveraging Radix UI primitives.
- **Styling**: Tailwind CSS with a custom color scheme (coral primary, teal secondary).
- **State Management**: React Query for server-side state.
- **Routing**: Wouter for client-side navigation.
- **Mobile Optimization**: Implemented as a Progressive Web App (PWA) with manifest.json and service worker support.

### Backend Architecture
- **Runtime**: Node.js with TypeScript.
- **Framework**: Express.js.
- **Database**: PostgreSQL, managed with Drizzle ORM.
- **Database Provider**: Neon serverless PostgreSQL.
- **AI Integration**: OpenAI GPT-4o for recipe generation and cooking assistance.
- **Authentication**: Firebase Authentication (Google Sign-in only).
- **Session Management**: Handled by Firebase.

### Evaluation Framework
- **AI Interaction Logging**: Every call to `getRecipeSuggestions`, `getCookingSteps`, and `getCookingAssistance` is logged async to the `ai_interactions` table with full input context and output.
- **Batch Evaluation**: Evaluations are submitted weekly (manually) as OpenAI Batch API jobs using o4-mini as the judge model (50% cost discount vs real-time).
- **Prompt Versioning**: `prompt_versions` table stores all prompt versions per feature. Active version is loaded at request time with 5-minute in-memory cache. Falls back to hardcoded defaults if no DB version exists.
- **Eval Criteria**: Defined in `server/eval-criteria.ts` — edit this file to add/update error modes without touching evaluator logic.
- **Manual Session Workflow**: Triggered by saying "run eval session". No automatic prompt updates — all changes require explicit approval.
- **Admin Endpoints**: Protected by `ADMIN_SECRET` env var via `X-Admin-Secret` header. Registered in `server/admin-routes.ts`.
- **Key Files**: `server/eval-criteria.ts`, `server/evaluator.ts`, `server/prompt-manager.ts`, `server/admin-routes.ts`

### Key Components & Features
- **User Profiling**: Captures cooking skill, dietary needs, time availability, pantry ingredients, and kitchen equipment.
- **Meal Planning**: Provides AI-suggested recipes tailored to user profiles and pantry contents.
- **Live Cooking**: Offers real-time, step-by-step guidance, enhanced with ElevenLabs voice synthesis and visual cues. Includes voice-activated "Ask for Help" and smart audio processing.
- **Grocery List Generation**: Automates shopping list creation, including alternatives.
- **Recipe Suggestions**: AI-powered recommendations based on pantry ingredients.
- **Visual Analysis**: Camera integration for identifying ingredients and equipment.
- **Settings Management**: User profile and preferences updates.
- **Persistent User Data**: All user preferences, pantry contents, and cooking history are saved and tracked per user.
- **Cooking Session Tracking**: Records each cooking session, updating pantry with ingredients used/remaining.
- **Pantry Management**: Users can edit pantry contents at any time, with a feature to reset the entire pantry.

## Secrets Management

Secrets are managed with **dotenvx** for cross-environment portability.

- **On Replit:** Secrets are injected via the Replit Secrets tab as usual. No dotenvx needed.
- **Locally:** The `.env` file is AES-256-GCM encrypted and committed to the repo. Run with `npx @dotenvx/dotenvx run -- npm run dev` to decrypt at runtime.
- `.env.keys` contains the private decryption key and is **never committed** to git.
- The server port is configurable via `PORT` env var (defaults to 5000). Local macOS uses `PORT=3000` since AirPlay occupies 5000.
- Full decision rationale: `product-decisions/001-secrets-management.md`

### Required Environment Variables
- `DATABASE_URL` — Neon PostgreSQL connection string (required, crashes without it)
- `ELEVENLABS_API_KEY` — ElevenLabs text-to-speech (required, crashes without it)
- `OPENAI_API_KEY` — OpenAI GPT-4o for AI features (optional, graceful fallback)
- `ADMIN_SECRET` — Admin endpoint authentication
- `SESSION_SECRET` — Express session signing
- `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_APP_ID` — Firebase client config

## Product Decisions

Significant product and architecture decisions are documented in the `product-decisions/` folder. Check there before making decisions that overlap with prior ones.

## External Dependencies

### AI Services
- **OpenAI GPT-4o**: Primary AI engine for core functionalities like recipe suggestions, cooking guidance, and ingredient analysis.
- **Anthropic Claude**: Used for additional AI capabilities.
- **ElevenLabs**: Provides high-quality text-to-speech synthesis for live cooking guidance.

### Database & Storage
- **Neon PostgreSQL**: Serverless PostgreSQL database solution.
- **Drizzle ORM**: Type-safe ORM for database operations.

### Authentication & Security
- **Firebase Authentication**: Manages user authentication, specifically Google sign-in.

### Development Tools
- **Replit Integration**: Supports built-in development environment features.
- **TypeScript**: Ensures type safety across the application.
- **Vitest**: Used for unit testing.
- **Playwright**: Utilized for end-to-end browser automation testing.

### Multi-Agent Collaboration
- **AGENTS.md**: Root-level instructions for all AI coding agents (Codex, Claude, Replit). Defines workflow rules, stack constraints, and handoff protocol.
- **CLAUDE.md**: Claude-specific override instructions (extends AGENTS.md).
- **.codex/environments/environment.toml**: Codex local environment config (Node 20, setup commands).
- **.env.example**: Lists all required env var names without values for local agent setup.
- **.nvmrc**: Pins Node.js version to 20.
- **docs/adr/**: Architecture Decision Records (ADR-0001: Replit as primary, local agents as contributors).
- **docs/handoffs/**: Agent handoff notes and cross-agent coordination logs.
- **docs/workflows/**: Workflow documentation for each agent role.
- **Key rule**: Replit agent is the ONLY one that merges to main and deploys. Local agents (Codex/Claude) work on feature branches and open PRs.

## Version History

### v0 - Initial Stable Release (January 2026)

**Core Features:**

1. **Settings Page Tab Structure**
   - Split "My Kitchen" tab into two separate tabs: "Pantry" and "Equipment"
   - Removed "Notifications" tab entirely
   - Final structure: Pantry | Equipment | Profile (3 tabs)

2. **Settings UI Aligned with Onboarding Flow**
   - Pantry tab UI exactly matches onboarding Step 4
   - Equipment tab UI exactly matches onboarding Step 5
   - Consistent helper text, labels, and input guidance across both flows

3. **Multiple Image Upload Support**
   - Both Pantry and Equipment sections support uploading multiple images at once
   - Includes image compression and HEIC format support
   - Sequential processing with progress indication

4. **Tag-Style Display for Ingredients/Equipment**
   - Items displayed as styled tags with individual remove buttons (×)
   - Replaced previous gray box display style
   - Consistent with onboarding flow appearance

5. **Reset Functionality**
   - "Reset Pantry" button clears all ingredients
   - "Reset Equipment" button clears all equipment
   - Confirmation prompts before clearing

6. **Tab-Specific Save Functionality**
   - "Back to Planning" and "Save Changes" buttons moved to bottom of each tab card
   - Each tab saves only its own data independently
   - Users stay on Settings page after saving (no navigation redirect)

7. **Data Model Update**
   - RecipeRecommendation uses "recipeName" field (database Recipe model retains "name" field)

8. **Branding Update**
   - Updated app logo to laica_logo_v1_cropped across header, landing page, and welcome screen

9. **Removed Redundant Take Photo Buttons**
   - Removed standalone "Take Photo" buttons from Pantry and Equipment sections
   - Applies to both onboarding flow (Steps 4 & 5) and Settings page
   - "Upload Images" button on mobile already provides "Take Photo" option via browser submenu
   - Desktop users upload files directly (no camera capture needed)

10. **Dynamic Copyright Year**
    - Footer copyright now displays current UTC year dynamically
    - Automatically updates each year

11. **Transcription Box UX Improvements**
    - 100% opacity black background matching Pro Tips box for readability
    - Pin/unpin toggle button at top-right corner
    - Pinned: Textbox sticks to bottom of screen
    - Unpinned: Textbox floats with content (not sticky)
    - Full expanded text always visible regardless of pin state
    - Swipe down to unpin, swipe up to pin (mobile)
    - Preference persists across cooking steps and sessions via localStorage

12. **Cross-Device Profile Sync**
    - User profile (pantry, equipment, preferences) saves to central PostgreSQL database
    - Data syncs across all devices (mobile, desktop, tablets) for the same user
    - Database is the ONLY source of truth - no localStorage caching
    - React Query provides in-memory caching for session performance
    - Failed saves show user-friendly error toast notifications

13. **Stateless Firebase Authentication**
    - Authentication now fully relies on Firebase ID tokens (stateless)
    - No server-side session storage required - survives server restarts
    - Tokens are automatically refreshed before each auth check
    - 401 responses handled gracefully without throwing errors
    - Firebase's onAuthStateChanged is the source of truth for auth state

14. **Meal Planning Session Persistence**
    - Meal planning state (step, preferences, recommendations, selected meal) saved to localStorage
    - Auto-resumes where user left off without prompts
    - Sessions auto-expire after 24 hours
    - Robust validation prevents crashes from malformed/stale data
    - Session clears when user starts cooking

15. **Cooking Session Persistence**
    - Cooking state (current step, timer, recipe info) saved to localStorage
    - Auto-resumes cooking session if user returns to same recipe within 4 hours
    - Sessions for different recipes are preserved when switching
    - Session clears on completion or when navigating back to planning
    - Robust validation prevents crashes from malformed/stale data

16. **Cooking History Tab**
    - Fourth tab in Kitchen & Settings (Pantry | Equipment | Profile | History)
    - Shows chronological list (newest first) of all past cooking sessions
    - Sessions recorded at recipe selection time, not just on completion
    - `recipeSnapshot` JSONB column stores full recipe details (cookTime, difficulty, cuisine, isFusion, missingIngredients, steps) at session start
    - Cards match the recipe selection UI (same style, badges, layout)
    - Click to expand: shows ingredients and numbered steps with sticky title header
    - Date/time displayed on each collapsed card
    - Single delete with 5-second undo toast before permanent removal
    - "Delete All History" via three-dot menu with confirmation dialog
    - All deletes are hard deletes from the database, user-ownership verified on backend
    - Data strictly filtered by authenticated user — no cross-user data access