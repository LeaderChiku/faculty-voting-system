# Farewell 2026 - College Event Management System

## Overview

A premium mobile-first web application for the "Farewell 2026" college event. Supports Admin, Faculty, and Audience roles with real-time ramp walk control, voting, faculty scoring, and live results.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite (artifacts/farewell-2026)
- **API framework**: Express 5 (artifacts/api-server)
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (for backend)

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── farewell-2026/      # React + Vite frontend (at path /)
│   └── api-server/         # Express API server
├── lib/
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
```

## Authentication

- **Admin**: username=`admin`, password via `ADMIN_PASSWORD` env var (default: `admin123`)
- **Faculty**: Any name + shared password via `FACULTY_PASSWORD` env var (default: `faculty123`). Each faculty member's name is used to track their scores.
- **Audience**: Any username + password via `AUDIENCE_PASSWORD` env var (default: `audience123`)
- Session-based auth via HTTP-only cookies (JSON cookie `auth_session`)

## Scoring Logic

- Faculty score: 1–5 slider
- Score → votes: 1=5, 2=10, 3=15, 4=20, 5=25
- Results: Top 3 by total votes (faculty votes + audience votes)
- Average rating: mean of original 1-5 faculty scores

## Database Schema

- `categories` - Event categories (Mr Farewell, Ms Farewell, etc.)
- `participants` - Participants with name, gender, category, photo
- `audience_votes` - One vote per session per category
- `faculty_scores` - Faculty scoring with converted vote values
- `ramp_walk_state` - Current participant being displayed
- `event_settings` - Voting open/closed, active category

## API Routes

All routes at `/api`:
- `/auth/*` - Login/logout for all 3 roles
- `/categories` - CRUD categories
- `/participants` - CRUD participants
- `/voting/status` - Voting on/off toggle
- `/voting/audience` - Audience vote submission
- `/voting/faculty` - Faculty score submission
- `/rampwalk/current` - Current ramp walk participant
- `/rampwalk/next` - Admin advances ramp walk
- `/results` - Top 3 results
- `/results/all` - All results (admin)

## Running

- Frontend: `pnpm --filter @workspace/farewell-2026 run dev`
- Backend: `pnpm --filter @workspace/api-server run dev`
- DB push: `pnpm --filter @workspace/db run push`
- Codegen: `pnpm --filter @workspace/api-spec run codegen`
