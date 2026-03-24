# DailyBrick

DailyBrick is a daily task tracker with Supabase auth, team collaboration (max 2 members), topic progress tracking, and scheduled task reminders.

## Features

- Email/password auth via Supabase.
- Daily tasks: add, complete/uncomplete, delete.
- Auto carry-forward: unfinished tasks from previous days are moved to today.
- Team mode:
	- Create team.
	- Invite one member by email.
	- Unique 10-character team code.
	- View teammate tasks and progress.
	- Members cannot modify each other's tasks.
- Topic progress percentages (e.g. 20%, 80%).
- Toast reminders for scheduled task time.

## Tech Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- Supabase (Auth + Postgres)

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Create local env file from example:

```bash
cp .env.example .env.local
```

3. Fill in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

4. In Supabase SQL editor, run:

`supabase/schema.sql`

This creates all tables, triggers, RLS policies, and helper functions.

5. Run dev server:

```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000)

## Deploy to Vercel

1. Import repo in Vercel.
2. Add the same env vars (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) in Vercel Project Settings.
3. Deploy.

## Important Files

- `app/page.tsx`: app shell + auth session + snapshot loading + reminder polling.
- `lib/dailybrick-api.ts`: Supabase operations and business logic.
- `lib/supabase.ts`: Supabase client initialization.
- `lib/types.ts`: shared domain types.
- `supabase/schema.sql`: database schema + RLS.
- `CLAUDE.md`: agent guidance for future changes.
