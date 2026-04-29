# Replit.md

## Overview
Laica is an AI-powered cooking assistant designed to simplify meal preparation from planning to plating. It provides AI-driven recipe suggestions based on pantry ingredients, generates grocery lists, and offers interactive, step-by-step cooking guidance with both voice and visual feedback. The application is optimized for a mobile-first user experience, aiming to revolutionize how users interact with their kitchens.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture
The application utilizes a full-stack architecture with distinct client and server components, prioritizing a mobile-first user experience.

### Frontend
-   **Framework**: React with TypeScript, built using Vite.
-   **UI Components**: Shadcn/ui, based on Radix UI primitives.
-   **Styling**: Tailwind CSS with a custom color scheme (coral primary, teal secondary).
-   **State Management**: React Query for server-side state.
-   **Routing**: Wouter for client-side navigation.
-   **Mobile Optimization**: Progressive Web App (PWA) with manifest.json and service worker support.

### Backend
-   **Runtime**: Node.js with TypeScript.
-   **Framework**: Express.js.
-   **Database**: PostgreSQL, managed with Drizzle ORM, hosted on Neon serverless PostgreSQL.
-   **AI Integration**: OpenAI GPT-4o for recipe generation and cooking assistance.
-   **Authentication**: Firebase Authentication (Google Sign-in only) with server-side ID token verification using `firebase-admin`. Authentication is stateless.
-   **Rate Limiting**: Per-user and per-IP token-bucket limits for AI/vision/speech routes and feedback submissions.
-   **AI Privacy**: User input is sanitized before reaching OpenAI, and sensitive data is redacted from AI interaction logs.
-   **Cooking Session Ownership**: Middleware ensures authenticated users own the cooking sessions they modify.
-   **AI Interaction Logging**: All AI calls are logged asynchronously with full context for evaluation.
-   **Prompt Management**: Prompt versions are stored in a database and cached, with fallback to hardcoded defaults.
-   **Admin Endpoints**: Protected by an `ADMIN_SECRET` environment variable.

### Key Features
-   **User Profiling**: Captures cooking skill, dietary needs, time availability, pantry ingredients, and kitchen equipment.
-   **Meal Planning**: AI-suggested recipes tailored to user profiles and pantry contents.
-   **Live Cooking**: Real-time, step-by-step guidance with ElevenLabs voice synthesis and visual cues, including voice-activated "Ask for Help".
-   **Grocery List Generation**: Automated shopping list creation with alternatives.
-   **Visual Analysis**: Camera integration for identifying ingredients and equipment.
-   **Persistent User Data**: All user preferences, pantry contents, and cooking history are saved and synced across devices via the central PostgreSQL database.
-   **Cooking Session Tracking**: Records cooking sessions, updating pantry contents.
-   **Pantry Management**: Allows users to edit or reset pantry contents.
-   **Session Persistence**: Meal planning and cooking sessions persist locally via localStorage, with robust validation and auto-expiration.
-   **Cooking History**: A dedicated tab displays chronological cooking history with recipe details and delete functionality.

### Secrets Management
Secrets are managed with `dotenvx` for cross-environment portability, decrypting `.env` files at runtime using a `DOTENV_PRIVATE_KEY`. Full rationale in `product-decisions/001-secrets-management.md`.

### Required Environment Variables
-   `DATABASE_URL` — Neon PostgreSQL connection string (required, crashes without it).
-   `ELEVENLABS_API_KEY` — ElevenLabs TTS (required, crashes without it).
-   `OPENAI_API_KEY` — OpenAI GPT-4o (optional, graceful fallback).
-   `ADMIN_SECRET` — Admin endpoint auth via `X-Admin-Secret` header.
-   `SESSION_SECRET` — Express session signing.
-   `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_APP_ID` — Firebase client config.
-   `FIREBASE_SERVICE_ACCOUNT_JSON` — Firebase Admin service account JSON for server-side ID token verification (required for any authenticated API). `FIREBASE_SERVICE_ACCOUNT_BASE64` is accepted as an alternative; `FIREBASE_PROJECT_ID` may be set explicitly to override the project ID derived from the service account.
-   `RATE_LIMIT_*` — Optional overrides for per-user rate-limit thresholds (e.g. `RATE_LIMIT_RECIPE_HOUR`, `RATE_LIMIT_VISION_DAY`). See `server/rate-limit.ts` for the full list and defaults.
-   `DOTENV_PRIVATE_KEY` — dotenvx decryption key. Replit Secret in production; lives in `.env.keys` (gitignored) locally.
-   `PORT` — Server port (defaults to 5000; local macOS uses 3000 because AirPlay holds 5000).

## External Dependencies

### AI Services
-   **OpenAI GPT-4o**: Core AI for recipe suggestions, cooking guidance, and ingredient analysis.
-   **Anthropic Claude**: Used for additional AI capabilities.
-   **ElevenLabs**: High-quality text-to-speech synthesis.

### Database & Storage
-   **Neon PostgreSQL**: Serverless PostgreSQL database.
-   **Drizzle ORM**: Type-safe ORM for database interactions.

### Authentication & Security
-   **Firebase Authentication**: Manages user authentication, specifically Google sign-in.
-   **firebase-admin**: Server-side SDK used to verify Firebase ID tokens via `verifyIdToken`, replacing the prior unverified JWT decode. Required for all authenticated API routes.

### Development Tools
-   **TypeScript**: Ensures type safety.
-   **Vitest**: Unit testing framework.
-   **Playwright**: End-to-end browser automation testing.

### Multi-Agent Collaboration
-   **AGENTS.md / CLAUDE.md**: Workflow rules and stack constraints for all coding agents (Codex, Claude, Replit). Replit agent is the only one that merges to main and deploys; local agents work on feature branches and open PRs.
-   **docs/adr/**: Architecture Decision Records.
-   **docs/handoffs/**: Cross-agent coordination notes (e.g. PR #21 handoff at `docs/handoffs/2026-04-28-codex-mobile-refresh-phase-0-security.md`).

## Version History

### v1 — Mobile Refresh Phase 0: Security (April 2026, PR #21)
Backend security hardening shipped as the foundation for the mobile refresh.

1.  **Verified Firebase ID tokens** — replaced unverified JWT decode with `firebase-admin` `verifyIdToken` in `server/firebaseAuth.ts`. Server now requires `FIREBASE_SERVICE_ACCOUNT_JSON` (or base64 variant) and rejects forged or expired tokens with `401 Invalid Firebase token`.
2.  **Per-user + per-IP rate limiting** — new `server/rate-limit.ts` adds token-bucket limits to all cost-bearing routes: recipe gen, slop bowl, cooking steps, ingredient alternatives, vision analyze, ElevenLabs TTS, Whisper transcribe, voices list, and IP-only limits on feedback. Tunable via `RATE_LIMIT_*` env vars; in-memory and per-process (multi-instance scaling needs a shared store).
3.  **AI privacy hardening** — new `server/ai-privacy.ts` strips prompt-injection markers (`###`, `<|...|>`, `[INST]`, `[SYSTEM]`) from user input before it reaches OpenAI, and redacts emails, JWT/long tokens, and Firebase UIDs from `ai_interactions` log writes. Log strings capped at 2KB per field, 20KB per row.
4.  **Cooking session ownership middleware** — `requireCookingSessionOwnership` verifies the authenticated user owns the session row before any `PUT`, `DELETE`, or `POST /complete` handler executes. Prevents cross-user session manipulation via guessed/leaked session IDs.
5.  **Body-size limits** — Express JSON and urlencoded parsers capped at 1 MB globally; vision endpoint uses a dedicated parser allowing larger image payloads.
6.  **Test coverage** — added `tests/unit/firebase-auth.test.ts` and `tests/unit/phase0-security-routes.test.ts`.
7.  **Validation** — Replit smoke-tested: 15/15 protected routes return 401 without auth; forged Bearer tokens rejected with `Invalid Firebase token`; full signed-in flows (vision pantry scan, slop bowl gen, cooking steps gen, session start, ElevenLabs TTS) returned 200 with no false rate-limit lockouts.

### v0 — Initial Stable Release (January 2026)
Settings tab restructure (Pantry / Equipment / Profile / History), multi-image upload with HEIC + compression, tag-style ingredient/equipment display, reset functionality, tab-specific saves, mobile camera UX cleanup, dynamic copyright year, transcription box pin/unpin UX, cross-device profile sync (database as source of truth), stateless Firebase auth, meal-planning + cooking session localStorage persistence with auto-expiration, cooking history tab with `recipeSnapshot` JSONB column and undo-capable deletes.