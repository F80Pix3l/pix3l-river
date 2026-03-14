# RIVER Web App

Upload-first AI content pipeline platform for multi-platform video distribution.

## Tech Stack

- React 19 with TypeScript
- Vite for fast development and builds
- Tailwind CSS v4 for styling
- Supabase for authentication, database, and storage

## Local Development Setup

### Prerequisites

- Node.js 18+ and npm
- Supabase account (or local Supabase setup)

### Getting Started

1. Install dependencies:
```bash
npm install
```

2. Set up Supabase:
   - Create a new project at [supabase.com](https://supabase.com)
   - Run the migration in `supabase/migrations/20260314_initial_schema.sql` in your Supabase SQL editor
   - Copy your project URL and anon key from project settings

3. Configure environment variables:
```bash
cp .env.example .env
```
   - Edit `.env` and add your Supabase credentials:
     - `VITE_SUPABASE_URL` - Your Supabase project URL
     - `VITE_SUPABASE_ANON_KEY` - Your Supabase anonymous key

4. Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Available Scripts

- `npm run dev` - Start development server with hot module replacement
- `npm run build` - Build for production (TypeScript compilation + Vite build)
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint

## Project Structure

```
src/
├── components/     # React components (Auth, Dashboard, VideoUpload)
├── contexts/       # React contexts (AuthContext)
├── lib/            # Utility functions and configurations (Supabase client)
├── hooks/          # Custom React hooks
└── assets/         # Static assets
supabase/
└── migrations/     # Database schema migrations
```

## Features

- Email/password authentication
- Drag-and-drop video upload (.mp4, .mov, .avi)
- Upload progress indicator
- Video storage in Supabase Storage
- User-specific video list with status tracking

## Environment Variables

Create a `.env` file in the root directory (see `.env.example` for required variables):
- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anonymous key

## TypeScript

This project uses TypeScript for type safety. All `.tsx` and `.ts` files are type-checked during build.
