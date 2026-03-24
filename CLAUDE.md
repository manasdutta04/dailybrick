# DailyBrick Agent Guide

## Project Summary
- Stack: Next.js 16 + React 19 + TypeScript + Tailwind.
- Host target: Vercel.
- Auth and data backend: Supabase.
- App behavior: daily tasks, auto carry-forward for unfinished tasks, 2-member teams, topic progress tracking, reminder toasts.

## Core Files
- App shell/state orchestration: app/page.tsx
- Supabase API layer: lib/dailybrick-api.ts
- Supabase client setup: lib/supabase.ts
- Shared UI/domain types: lib/types.ts
- Database schema and RLS policies: supabase/schema.sql

## Data Rules To Preserve
- Tasks can be created, toggled, and deleted only by the owner.
- Team size is strictly max 2 members.
- Team members can view each other tasks and progress, but cannot mutate each other tasks.
- Team code must be unique and 10 characters (alphanumeric).
- Pending tasks from previous dates are moved to today automatically for that same owner.

## Team Flow
1. User signs up/signs in with Supabase email/password auth.
2. User creates a team (if none exists).
3. Team owner invites one member by email.
4. Invited user signs in with the same email and is auto-linked to the team.

## Commands
- Install: npm install
- Dev server: npm run dev
- Lint: npm run lint
- Build: npm run build

## Environment Variables
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY

## Setup Notes
1. Create Supabase project.
2. Run SQL from supabase/schema.sql in Supabase SQL editor.
3. Copy .env.example to .env.local and fill values.
4. Start app with npm run dev.

## Implementation Notes For Agents
- Keep UI components as-is where possible; prioritize behavior and data wiring.
- Prefer edits in lib/dailybrick-api.ts for business logic changes.
- Keep authorization enforcement in RLS, not just frontend checks.
- For reminders, keep polling best-effort and non-blocking.
- Avoid adding server-side secrets to client code.
