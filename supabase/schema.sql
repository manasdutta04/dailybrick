create extension if not exists pgcrypto;

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  code varchar(10) not null unique,
  owner_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.team_members (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  invited_email text not null,
  role text not null default 'member' check (role in ('owner', 'member')),
  joined_at timestamptz not null default now(),
  unique (team_id, invited_email),
  unique (team_id, user_id)
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  team_id uuid references public.teams(id) on delete set null,
  title text not null,
  topic text,
  due_date date not null default current_date,
  reminder_time time,
  status text not null default 'pending' check (status in ('pending', 'completed')),
  carried_forward boolean not null default false,
  reminder_sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger set_tasks_updated_at
before update on public.tasks
for each row execute function public.set_updated_at();

create or replace function public.check_team_member_limit()
returns trigger
language plpgsql
as $$
declare
  members_count int;
begin
  select count(*) into members_count
  from public.team_members
  where team_id = new.team_id;

  if members_count >= 2 then
    raise exception 'Team member limit reached (max 2)';
  end if;

  return new;
end;
$$;

create trigger enforce_team_member_limit
before insert on public.team_members
for each row execute function public.check_team_member_limit();

create or replace function public.is_team_member(p_team_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.team_members tm
    where tm.team_id = p_team_id
      and tm.user_id = auth.uid()
  );
$$;

create or replace function public.is_team_owner(p_team_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.teams t
    where t.id = p_team_id
      and t.owner_id = auth.uid()
  );
$$;

alter table public.profiles enable row level security;
alter table public.teams enable row level security;
alter table public.team_members enable row level security;
alter table public.tasks enable row level security;

create policy "profiles_select_own"
on public.profiles
for select
using (auth.uid() = user_id);

create policy "profiles_insert_own"
on public.profiles
for insert
with check (auth.uid() = user_id);

create policy "profiles_update_own"
on public.profiles
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "teams_select_member"
on public.teams
for select
using (public.is_team_member(id) or owner_id = auth.uid());

create policy "teams_insert_owner"
on public.teams
for insert
with check (owner_id = auth.uid());

create policy "teams_update_owner"
on public.teams
for update
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

create policy "teams_delete_owner"
on public.teams
for delete
using (owner_id = auth.uid());

create policy "team_members_select_by_team"
on public.team_members
for select
using (public.is_team_member(team_id) or public.is_team_owner(team_id));

create policy "team_members_insert_owner"
on public.team_members
for insert
with check (public.is_team_owner(team_id));

create policy "team_members_update_claim_invite"
on public.team_members
for update
using (
  user_id = auth.uid()
  or (
    user_id is null
    and lower(invited_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  )
  or public.is_team_owner(team_id)
)
with check (
  user_id = auth.uid()
  or public.is_team_owner(team_id)
);

create policy "team_members_delete_owner"
on public.team_members
for delete
using (public.is_team_owner(team_id));

create policy "tasks_select_team_member"
on public.tasks
for select
using (
  user_id = auth.uid()
  or (team_id is not null and public.is_team_member(team_id))
);

create policy "tasks_insert_own"
on public.tasks
for insert
with check (
  user_id = auth.uid()
  and (
    team_id is null
    or public.is_team_member(team_id)
    or public.is_team_owner(team_id)
  )
);

create policy "tasks_update_own"
on public.tasks
for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "tasks_delete_own"
on public.tasks
for delete
using (user_id = auth.uid());
