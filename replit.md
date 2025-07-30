# Replit.md

## Overview

This is a full-stack web application called "Laica" - an AI-powered cooking assistant. The application helps users with meal planning, recipe suggestions based on their pantry ingredients, grocery list generation, and provides live cooking guidance through step-by-step instructions. The app is designed with a mobile-first approach and features voice/visual interaction during cooking sessions.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

The application follows a modern full-stack architecture with separate client and server directories:

### Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **UI Components**: Shadcn/ui component library with Radix UI primitives
- **Styling**: Tailwind CSS with custom color scheme (coral primary, teal secondary)
- **State Management**: React Query (@tanstack/react-query) for server state
- **Routing**: Wouter for client-side routing
- **Mobile Optimization**: Progressive Web App (PWA) with manifest.json and service worker support

### Backend Architecture
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon serverless PostgreSQL
- **AI Integration**: OpenAI GPT-4o for recipe suggestions and cooking assistance
- **Authentication**: Dual authentication system (Replit OAuth + local auth with bcrypt)
- **Session Management**: PostgreSQL-backed sessions with connect-pg-simple

## Key Components

### User Workflow Components
1. **User Profiling** (`user-profiling.tsx`): Collects cooking skill, dietary restrictions, available time, pantry ingredients, and kitchen equipment
2. **Meal Planning** (`meal-planning.tsx`): Suggests recipes based on user profile and preferences
3. **Live Cooking** (`live-cooking.tsx`): Provides step-by-step cooking guidance with enhanced voice synthesis via ElevenLabs and visual feedback
4. **Grocery List Generation** (`grocery-list-generator.tsx`): Creates smart shopping lists with alternatives

### Core Features
- **Recipe Suggestions**: AI-powered recommendations based on pantry ingredients
- **Visual Analysis**: Camera integration for ingredient and equipment identification
- **Cooking Steps**: Progressive cooking guidance with timer and visual cues
- **Grocery Lists**: Automated shopping list generation with price estimates
- **Settings Management**: User profile updates and preferences

## Data Flow

1. **User Registration/Login**: Users can register locally or use Replit OAuth
2. **Profile Creation**: New users complete a profiling questionnaire about cooking skills, dietary needs, and available ingredients
3. **Recipe Discovery**: AI analyzes user profile and pantry to suggest suitable recipes
4. **Meal Planning**: Users select recipes and schedule cooking times
5. **Live Cooking**: Real-time guidance with step progression, visual feedback, and Q&A support
6. **Grocery Management**: Automatic list generation for missing ingredients

## External Dependencies

### AI Services
- **OpenAI GPT-4o**: Primary AI engine for recipe suggestions, cooking guidance, and ingredient analysis
- **Anthropic Claude**: Secondary AI service (@anthropic-ai/sdk) for additional AI capabilities
- **ElevenLabs**: High-quality text-to-speech synthesis for enhanced live cooking voice guidance

### Database & Storage
- **Neon PostgreSQL**: Serverless PostgreSQL database
- **Drizzle ORM**: Type-safe database operations
- **connect-pg-simple**: PostgreSQL session store

### Authentication & Security
- **Replit OAuth**: External authentication provider
- **bcrypt**: Password hashing for local authentication
- **express-session**: Session management

### Development Tools
- **Replit Integration**: Built-in development environment support with cartographer and runtime error overlay
- **TypeScript**: Full type safety across frontend and backend
- **ESBuild**: Production bundling for server code

## Deployment Strategy

The application is designed for Replit deployment with:

- **Development Mode**: Uses Vite dev server with HMR
- **Production Build**: 
  - Frontend: Vite builds to `dist/public`
  - Backend: ESBuild bundles server to `dist/index.js`
- **Database**: Uses DATABASE_URL environment variable for Neon connection
- **Environment Variables**: 
  - `DATABASE_URL`: PostgreSQL connection string
  - `OPENAI_API_KEY`: OpenAI API access
  - `ELEVENLABS_API_KEY`: ElevenLabs text-to-speech API access
  - `SESSION_SECRET`: Session encryption key
  - `ISSUER_URL`: Replit OAuth configuration

The app includes progressive web app features with offline capability considerations and mobile-optimized UI components. The cooking interface is specifically designed for hands-free operation with high-quality voice synthesis (ElevenLabs with browser TTS fallback), voice commands, and visual feedback during active cooking sessions.

## Recent Changes (Latest Update)

### Enhanced Voice Interface & Live Cooking Experience (January 2025)
- **ElevenLabs Voice Integration**: Integrated ElevenLabs API for professional-quality text-to-speech during cooking sessions
- **Voice Settings**: Added configurable voice stability and clarity controls in live cooking settings
- **Dual TTS System**: Implemented ElevenLabs as primary TTS with browser speechSynthesis as fallback
- **API Infrastructure**: 
  - New backend endpoints: `/api/speech/synthesize` and `/api/speech/voices`
  - Client library: `client/src/lib/elevenlabs.ts` for audio handling
  - Server integration: `server/elevenlabs.ts` with ElevenLabsClient
- **UI Enhancements**: Added voice quality toggle and real-time speaking indicators in cooking interface
- **Performance**: Uses Turbo v2.5 model for optimal balance of quality and latency
- **Demo Mode Handling**: Implemented graceful rate limit handling that redirects users to home page with demo notification instead of error messages
- **Fallback Systems**: ElevenLabs TTS automatically falls back to browser speech synthesis when API limits are reached
- **Hands-Free Voice Interface (Completed January 25, 2025)**:
  - Voice-based "Ask for Help" system with advanced silence detection
  - Smart audio processing: 1.5-second initial delay before silence detection begins
  - Automatic question processing after 1 second of silence (natural conversation flow)
  - Eliminated audio feedback loops - removed assistant voice during recording to prevent contamination
  - Proper cancel functionality - "Cancel" button truly cancels without processing
  - Enhanced mute controls with visual feedback (green when on, red when muted)
  - Contextual AI responses that reference current cooking step and preview upcoming steps
  - Real-time audio level monitoring with debug logging for troubleshooting
  - Mobile-optimized interface with large, accessible control buttons
- **Cost Optimization System (Completed January 30, 2025)**:
  - Smart recording controls: 30-second max recording time with 1-second minimum validation
  - Real-time recording duration indicator with cost estimates (shows ~$0.0001 per second)
  - Audio preprocessing and compression: automatic silence trimming, resampling to 16kHz mono, and format optimization
  - Compression typically achieves 30-50% size reduction while maintaining transcription quality
  - Usage analytics and rate limiting: tracks daily (10 min), weekly (50 min), and monthly (200 min) limits
  - Usage statistics display in settings panel showing current consumption vs. limits
  - Automatic usage limit enforcement prevents overage with graceful error messages
  - localStorage-based usage tracking with automatic daily/weekly/monthly counter resets
  - **Audio Feedback Fix**: Removed all assistant voice responses during recording to prevent contamination of user speech input
  - **Voice Interface Reliability Fixes (January 30, 2025)**:
    * Fixed caption timeout issue by adding 800ms delay before audio playback to ensure captions display fully
    * Improved silence detection: increased threshold to 1.5 seconds and lowered sensitivity for better speech recognition
    * Fixed Cancel button to truly cancel recordings instead of processing them - sets processing flag before stopping recorder
    * Added comprehensive logging for debugging voice recording states and silence detection