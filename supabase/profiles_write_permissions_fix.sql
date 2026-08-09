-- ClassBop / Hagwon Hero — profiles write permission fix
-- Run this in the Supabase SQL Editor. Safe to re-run.
--
-- Problem: "permission denied for table profiles" when saving the profile
-- (e.g. updating the profile picture). Two things interact:
--   1. profiles_email_privacy_fix.sql revoked SELECT on public.profiles and
--      re-granted it column-by-column, leaving profiles.email unreadable by
--      anon/authenticated (by design).
--   2. The client saved profiles via upserts whose payload included `email`.
--      PostgREST compiles an upsert to
--        insert ... on conflict (id) do update set email = excluded.email, ...
--      and Postgres requires SELECT privilege on every column referenced in
--      the DO UPDATE expressions — including via EXCLUDED. With no SELECT
--      grant on email, the whole statement fails with
--      "permission denied for table profiles".
--
-- The client no longer sends `email` (see src/pages/CompleteProfile.jsx,
-- src/pages/AuthPage.jsx, src/pages/AuthCallback.jsx,
-- src/auth/AuthProvider.jsx) — the handle_new_user trigger fills it in
-- server-side. This script makes the write grants match that contract
-- explicitly, so client writes work regardless of what earlier revokes ran,
-- and email is now walled off from client WRITES as well as reads.
--
-- The security-definer functions (handle_new_user, is_username_available,
-- the Google claim function) run as the table owner and are unaffected.
--
-- NOTE: if the client ever needs to write a NEW profiles column, it must be
-- added to the column lists below or writes will fail again.

revoke insert, update, delete on public.profiles from anon, authenticated;

grant insert (id, display_name, username, avatar_url)
on public.profiles to authenticated;

-- `id` stays in the update grant: PostgREST upserts put every payload column
-- (id included) in the DO UPDATE SET list. RLS (`with check (id = auth.uid())`)
-- still prevents touching anyone else's row.
grant update (id, display_name, username, avatar_url)
on public.profiles to authenticated;
