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

## Version History

### v1.0 - Kitchen & Settings Refactor (December 2025)

**Accepted Milestones:**

1. **Settings Page Tab Structure Refactor**
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