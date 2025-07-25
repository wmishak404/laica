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
3. **Live Cooking** (`live-cooking.tsx`): Provides step-by-step cooking guidance with visual/audio feedback
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
  - `SESSION_SECRET`: Session encryption key
  - `ISSUER_URL`: Replit OAuth configuration

The app includes progressive web app features with offline capability considerations and mobile-optimized UI components. The cooking interface is specifically designed for hands-free operation with voice commands and visual feedback during active cooking sessions.