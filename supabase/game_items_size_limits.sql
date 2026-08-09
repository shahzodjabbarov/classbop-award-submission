-- Guess The Price — cap stored image sizes.
-- Run this in the Supabase SQL Editor.
--
-- Images are base64-encoded directly into game_matches.thumbnail_url and
-- game_items.payload (see src/pages/GtpBuilder.jsx). The client now rejects
-- files over 1.5MB, but that check is client-side only — any authenticated
-- user could still insert an arbitrarily large row via the REST API and
-- bypass it. This adds the matching limit as a DB constraint (~1.5MB raw
-- image, plus base64/JSON overhead).
--
-- Added NOT VALID: some existing rows already exceed the limit, and
-- validating retroactively would block the whole migration. NOT VALID skips
-- checking current rows but still enforces the constraint on every future
-- insert/update — which is all we need. Existing oversized rows can be
-- cleaned up later and the constraint validated with:
--   alter table public.game_matches validate constraint game_matches_thumbnail_size_limit;
--   alter table public.game_items validate constraint game_items_payload_size_limit;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'game_matches_thumbnail_size_limit'
      and conrelid = 'public.game_matches'::regclass
  ) then
    alter table public.game_matches
    add constraint game_matches_thumbnail_size_limit
    check (thumbnail_url is null or length(thumbnail_url) <= 2200000)
    not valid;
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'game_items_payload_size_limit'
      and conrelid = 'public.game_items'::regclass
  ) then
    alter table public.game_items
    add constraint game_items_payload_size_limit
    check (octet_length(payload::text) <= 2200000)
    not valid;
  end if;
end;
$$;
