-- profiles table
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  role text not null check (role in ('夫', '妻')),
  created_at timestamptz default now(),
  constraint profiles_user_id_unique unique (user_id)
);

alter table public.profiles enable row level security;

create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = user_id);
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = user_id);
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = user_id);

-- Also allow reading partner's profile (same household)
-- For now, allow all authenticated users to read all profiles
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_authenticated" on public.profiles
  for select using (auth.role() = 'authenticated');

-- shifts table
create table if not exists public.shifts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  shift_type text not null check (shift_type in ('日勤', '夜勤', '明け', '休日')),
  created_at timestamptz default now(),
  constraint shifts_user_date_unique unique (user_id, date)
);

alter table public.shifts enable row level security;

create policy "shifts_select_authenticated" on public.shifts
  for select using (auth.role() = 'authenticated');
create policy "shifts_insert_own" on public.shifts
  for insert with check (auth.uid() = user_id);
create policy "shifts_update_own" on public.shifts
  for update using (auth.uid() = user_id);
create policy "shifts_delete_own" on public.shifts
  for delete using (auth.uid() = user_id);

-- tasks table
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  assignee_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  category text,
  duration_minutes integer,
  date date not null,
  is_completed boolean not null default false,
  frequency text,
  created_at timestamptz default now()
);

alter table public.tasks enable row level security;

create policy "tasks_select_authenticated" on public.tasks
  for select using (auth.role() = 'authenticated');
create policy "tasks_insert_authenticated" on public.tasks
  for insert with check (auth.role() = 'authenticated');
create policy "tasks_update_authenticated" on public.tasks
  for update using (auth.role() = 'authenticated');
create policy "tasks_delete_authenticated" on public.tasks
  for delete using (auth.role() = 'authenticated');

-- Trigger to auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', 'ユーザー'),
    coalesce(new.raw_user_meta_data ->> 'role', '夫')
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();
