-- ClassBop auth/profile setup
-- Run this in Supabase SQL Editor after enabling Auth providers.
-- Safe to run even if public.profiles already exists.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text not null default 'Teacher',
  username text unique,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_username_format check (
    username is null
    or (
      username = lower(username)
      and username ~ '^[a-z0-9_]{3,20}$'
    )
  )
);

alter table public.profiles
add column if not exists email text;

alter table public.profiles
add column if not exists display_name text not null default 'Teacher';

alter table public.profiles
add column if not exists updated_at timestamptz not null default now();

alter table public.profiles
add column if not exists avatar_url text;

alter table public.profiles
add column if not exists created_at timestamptz not null default now();

update public.profiles
set display_name = coalesce(nullif(display_name, ''), username, 'Teacher')
where display_name is null or display_name = '';

update public.profiles p
set email = u.email
from auth.users u
where p.id = u.id
  and p.email is null;

create unique index if not exists profiles_username_unique_idx
on public.profiles (username)
where username is not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_username_format'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
    add constraint profiles_username_format check (
      username is null
      or (
        username = lower(username)
        and username ~ '^[a-z0-9_]{3,20}$'
      )
    );
  end if;
end;
$$;

alter table public.profiles enable row level security;

drop policy if exists "Anyone can read profiles" on public.profiles;
drop policy if exists "Users can read own profile" on public.profiles;
drop policy if exists "Users can insert their own profile" on public.profiles;
drop policy if exists "Users can update their own profile" on public.profiles;

-- NOTE: profiles.email must never be readable by anon/authenticated (see
-- supabase/profiles_email_privacy_fix.sql for the full rationale/history).
-- Row visibility is public (needed for username lookups and showing other
-- users' display names), but the email column itself is walled off below at
-- the Postgres column-privilege level, independent of row-level policy.
create policy "Anyone can read profiles"
on public.profiles
for select
to anon, authenticated
using (true);

revoke select on public.profiles from anon, authenticated;

grant select (id, username, display_name, avatar_url, created_at, updated_at)
on public.profiles to anon, authenticated;

create policy "Users can insert their own profile"
on public.profiles
for insert
to authenticated
with check (id = auth.uid());

create policy "Users can update their own profile"
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_username text;
begin
  requested_username := lower(
    regexp_replace(
      coalesce(new.raw_user_meta_data->>'username', ''),
      '[^a-zA-Z0-9_]',
      '',
      'g'
    )
  );

  if requested_username = ''
    or requested_username !~ '^[a-z0-9_]{3,20}$'
    or exists (select 1 from public.profiles where username = requested_username)
  then
    requested_username := null;
  end if;

  insert into public.profiles (
    id,
    email,
    display_name,
    username,
    avatar_url
  )
  values (
    new.id,
    new.email,
    coalesce(
      nullif(new.raw_user_meta_data->>'display_name', ''),
      nullif(new.raw_user_meta_data->>'full_name', ''),
      'Teacher'
    ),
    requested_username,
    null
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

-- Safe public read surface: exposes only non-sensitive columns so the app
-- can show usernames/avatars for other users without exposing email.
create or replace view public.profiles_public
with (security_invoker = true) as
select id, username, display_name, avatar_url, created_at
from public.profiles;

grant select on public.profiles_public to anon, authenticated;

create or replace function public.is_username_available(candidate text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    lower(candidate) ~ '^[a-z0-9_]{3,20}$'
    and not exists (
      select 1
      from public.profiles
      where username = lower(candidate)
    );
$$;

grant execute on function public.is_username_available(text) to anon, authenticated;
