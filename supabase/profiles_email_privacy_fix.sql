-- ClassBop / Hagwon Hero — profiles email privacy fix
-- Run this in the Supabase SQL Editor. Safe to re-run.
--
-- Problem: the "Anyone can read profiles" policy (using (true)) let any
-- anon/authenticated API caller run `select * from profiles`, which exposed
-- every user's email address. Verified live via the public REST API with
-- only the anon key — no login required.
--
-- Fix: protect the email column at the Postgres column-privilege level
-- (REVOKE/GRANT), which is enforced regardless of RLS row-visibility policy.
-- The client never needs to read profiles.email back (it reads the logged-in
-- user's email from the Supabase Auth session instead — see
-- src/auth/AuthProvider.jsx), so no role needs SELECT on this column at all.
-- Row visibility can stay public (needed for username lookups and showing
-- other users' display names), since the sensitive column is walled off
-- independently of which rows are visible.
--
-- This also resolves Supabase Security Advisor's "Security Definer View"
-- finding on profiles_public: since email is now protected at the column
-- level, the view no longer needs to bypass RLS and runs as SECURITY INVOKER.

drop policy if exists "Users can read own profile" on public.profiles;
drop policy if exists "Anyone can read profiles" on public.profiles;

create policy "Anyone can read profiles"
on public.profiles
for select
to anon, authenticated
using (true);

revoke select on public.profiles from anon, authenticated;

grant select (id, username, display_name, avatar_url, created_at, updated_at)
on public.profiles to anon, authenticated;

create or replace view public.profiles_public
with (security_invoker = true) as
select id, username, display_name, avatar_url, created_at
from public.profiles;

grant select on public.profiles_public to anon, authenticated;
