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

## Recent Updates

### V1 Launch Preparation (January 31, 2025)
- **Skip to Meal Planning**: Added prominent button for returning users to bypass setup steps and jump straight to meal planning
- **Prominent No Preferences Option**: Created dedicated blue highlighted section in cuisine selection with clear "No Preferences - Surprise Me!" button
- **Simplified Cooking Flow**: Removed scheduling options - all cooking sessions now start immediately for streamlined V1 experience
- **Testing Framework**: Implemented comprehensive unit and E2E testing with Vitest and Playwright for quality assurance