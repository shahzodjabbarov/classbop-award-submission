-- ClassBop Google auth fix
-- Run this in Supabase SQL Editor if Google OAuth flashes/logs out and no new auth user is created.
-- It makes the auth trigger safe for Google users, who do not provide a custom username.

alter table public.profiles
add column if not exists email text;

alter table public.profiles
add column if not exists display_name text not null default 'Teacher';

alter table public.profiles
add column if not exists avatar_url text;

alter table public.profiles
add column if not exists created_at timestamptz not null default now();

alter table public.profiles
add column if not exists updated_at timestamptz not null default now();

-- Do not let profile creation block Supabase Auth user creation.
-- The trigger below still tries to create a username automatically.
alter table public.profiles
alter column username drop not null;

create unique index if not exists profiles_username_unique_idx
on public.profiles (username)
where username is not null;

create or replace function public.generate_profile_username(seed text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  base text;
  candidate text;
  suffix text;
  i integer;
  adjective text;
  noun text;
  adjectives text[] := array[
    'sunny', 'melon', 'bouncy', 'zesty', 'cozy', 'sparkly',
    'tiny', 'happy', 'golden', 'clever', 'peachy', 'jolly'
  ];
  nouns text[] := array[
    'classbop', 'sprout', 'cloud', 'mango', 'otter', 'bean',
    'panda', 'turtle', 'waffle', 'noodle', 'pickle', 'moon'
  ];
begin
  base := lower(regexp_replace(coalesce(seed, ''), '[^a-zA-Z0-9_]', '', 'g'));
  base := left(base, 12);

  if base = ''
    or length(base) < 4
    or base !~ '^[a-z0-9_]+$'
    or base ~ '^[0-9_]+$'
    or base in ('admin', 'administrator', 'api', 'auth', 'google', 'login', 'logout', 'profile', 'classbop', 'root', 'signup', 'support', 'teacher', 'test', 'user')
  then
    adjective := adjectives[1 + floor(random() * array_length(adjectives, 1))::int];
    noun := nouns[1 + floor(random() * array_length(nouns, 1))::int];
    base := adjective || '_' || noun;
  end if;

  for i in 1..60 loop
    suffix := (100 + floor(random() * 9900)::int)::text;
    candidate := left(base || suffix, 20);

    if candidate ~ '^[a-z0-9_]{4,20}$'
      and candidate !~ '^[0-9_]+$'
      and not exists (select 1 from public.profiles where username = candidate)
    then
      return candidate;
    end if;

    adjective := adjectives[1 + floor(random() * array_length(adjectives, 1))::int];
    noun := nouns[1 + floor(random() * array_length(nouns, 1))::int];
    base := adjective || '_' || noun;
  end loop;

  return 'classbop_' || replace(left(gen_random_uuid()::text, 8), '-', '');
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_username text;
  profile_name text;
begin
  profile_name := coalesce(
    nullif(new.raw_user_meta_data->>'display_name', ''),
    nullif(new.raw_user_meta_data->>'full_name', ''),
    nullif(new.raw_user_meta_data->>'name', ''),
    split_part(coalesce(new.email, 'Teacher'), '@', 1),
    'Teacher'
  );

  requested_username := lower(
    regexp_replace(
      coalesce(new.raw_user_meta_data->>'username', ''),
      '[^a-zA-Z0-9_]',
      '',
      'g'
    )
  );

  if requested_username = ''
    or requested_username !~ '^[a-z0-9_]{4,20}$'
    or requested_username ~ '^[0-9_]+$'
    or requested_username in ('admin', 'administrator', 'api', 'auth', 'google', 'login', 'logout', 'profile', 'classbop', 'root', 'signup', 'support', 'teacher', 'test', 'user')
    or exists (select 1 from public.profiles where username = requested_username)
  then
    requested_username := public.generate_profile_username(profile_name || ' ' || coalesce(new.email, ''));
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
    profile_name,
    requested_username,
    null
  )
  on conflict (id) do update
  set
    email = excluded.email,
    display_name = coalesce(nullif(public.profiles.display_name, ''), excluded.display_name),
    username = coalesce(public.profiles.username, excluded.username),
    avatar_url = coalesce(public.profiles.avatar_url, excluded.avatar_url),
    updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();
