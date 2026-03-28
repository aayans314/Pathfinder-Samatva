-- Pathfinder: Supabase schema with RLS

create extension if not exists "pgcrypto";

-- Tables

create table public.users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  bio text,
  target_visa text,
  opt_in_matching boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  title text not null,
  target_date date not null,
  status text not null default 'active'
    check (status in ('active', 'paused', 'completed', 'archived')),
  created_at timestamptz not null default now()
);

create table public.milestones (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid not null references public.goals(id) on delete cascade,
  title text not null,
  description text,
  parent_milestone_id uuid references public.milestones(id) on delete set null,
  status text not null default 'locked'
    check (status in ('locked', 'in_progress', 'completed')),
  order_index integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  milestone_id uuid not null references public.milestones(id) on delete cascade,
  title text not null,
  completed boolean not null default false,
  due_date date,
  created_at timestamptz not null default now()
);

-- Indexes

create index idx_goals_user_id on public.goals(user_id);
create index idx_milestones_goal_id on public.milestones(goal_id);
create index idx_milestones_parent on public.milestones(parent_milestone_id);
create index idx_tasks_milestone_id on public.tasks(milestone_id);

-- RLS

alter table public.users enable row level security;
alter table public.goals enable row level security;
alter table public.milestones enable row level security;
alter table public.tasks enable row level security;

-- Users: own row + opted-in peers
create policy "users_select_own" on public.users
  for select using (auth.uid() = id);

create policy "users_insert_own" on public.users
  for insert with check (auth.uid() = id);

create policy "users_update_own" on public.users
  for update using (auth.uid() = id);

create policy "users_delete_own" on public.users
  for delete using (auth.uid() = id);

create policy "users_select_opted_in" on public.users
  for select using (opt_in_matching = true);

-- Goals: owner only
create policy "goals_select_own" on public.goals
  for select using (auth.uid() = user_id);

create policy "goals_insert_own" on public.goals
  for insert with check (auth.uid() = user_id);

create policy "goals_update_own" on public.goals
  for update using (auth.uid() = user_id);

create policy "goals_delete_own" on public.goals
  for delete using (auth.uid() = user_id);

-- Milestones: via goal owner
create policy "milestones_select_own" on public.milestones
  for select using (
    exists (
      select 1 from public.goals
      where goals.id = milestones.goal_id
        and goals.user_id = auth.uid()
    )
  );

create policy "milestones_insert_own" on public.milestones
  for insert with check (
    exists (
      select 1 from public.goals
      where goals.id = milestones.goal_id
        and goals.user_id = auth.uid()
    )
  );

create policy "milestones_update_own" on public.milestones
  for update using (
    exists (
      select 1 from public.goals
      where goals.id = milestones.goal_id
        and goals.user_id = auth.uid()
    )
  );

create policy "milestones_delete_own" on public.milestones
  for delete using (
    exists (
      select 1 from public.goals
      where goals.id = milestones.goal_id
        and goals.user_id = auth.uid()
    )
  );

-- Tasks: via milestone → goal owner
create policy "tasks_select_own" on public.tasks
  for select using (
    exists (
      select 1 from public.milestones
      join public.goals on goals.id = milestones.goal_id
      where milestones.id = tasks.milestone_id
        and goals.user_id = auth.uid()
    )
  );

create policy "tasks_insert_own" on public.tasks
  for insert with check (
    exists (
      select 1 from public.milestones
      join public.goals on goals.id = milestones.goal_id
      where milestones.id = tasks.milestone_id
        and goals.user_id = auth.uid()
    )
  );

create policy "tasks_update_own" on public.tasks
  for update using (
    exists (
      select 1 from public.milestones
      join public.goals on goals.id = milestones.goal_id
      where milestones.id = tasks.milestone_id
        and goals.user_id = auth.uid()
    )
  );

create policy "tasks_delete_own" on public.tasks
  for delete using (
    exists (
      select 1 from public.milestones
      join public.goals on goals.id = milestones.goal_id
      where milestones.id = tasks.milestone_id
        and goals.user_id = auth.uid()
    )
  );
