-- Hagwon Hero / Guess The Price RLS setup
-- Run this in Supabase SQL Editor after turning RLS back ON.
--
-- Goal:
-- - Anyone can read public Guess The Price decks and their items.
-- - Anonymous users cannot create, edit, or delete database rows.
-- - Authenticated owners can create/update/delete their own decks/items.
--
-- Important:
-- Keep RLS ON in production. The deck builder must log in with Supabase Auth
-- before publishing, because insert/update/delete policies use auth.uid().

alter table public.game_matches enable row level security;
alter table public.game_items enable row level security;

drop policy if exists "Public can read public game matches" on public.game_matches;
drop policy if exists "Public can read items from public matches" on public.game_items;
drop policy if exists "Authenticated users can create their own matches" on public.game_matches;
drop policy if exists "Authenticated owners can update their own matches" on public.game_matches;
drop policy if exists "Authenticated owners can delete their own matches" on public.game_matches;
drop policy if exists "Authenticated owners can create items for their matches" on public.game_items;
drop policy if exists "Authenticated owners can update items for their matches" on public.game_items;
drop policy if exists "Authenticated owners can delete items for their matches" on public.game_items;

create policy "Public can read public game matches"
on public.game_matches
for select
to anon, authenticated
using (
  is_public = true
  and format_id = 'GUESS_THE_PRICE'
);

create policy "Public can read items from public matches"
on public.game_items
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.game_matches gm
    where gm.id = game_items.match_id
      and gm.is_public = true
      and gm.format_id = 'GUESS_THE_PRICE'
  )
);

create policy "Authenticated users can create their own matches"
on public.game_matches
for insert
to authenticated
with check (
  author_id = auth.uid()
  and format_id = 'GUESS_THE_PRICE'
);

create policy "Authenticated owners can update their own matches"
on public.game_matches
for update
to authenticated
using (author_id = auth.uid())
with check (author_id = auth.uid());

create policy "Authenticated owners can delete their own matches"
on public.game_matches
for delete
to authenticated
using (author_id = auth.uid());

create policy "Authenticated owners can create items for their matches"
on public.game_items
for insert
to authenticated
with check (
  exists (
    select 1
    from public.game_matches gm
    where gm.id = game_items.match_id
      and gm.author_id = auth.uid()
      and gm.format_id = 'GUESS_THE_PRICE'
  )
);

create policy "Authenticated owners can update items for their matches"
on public.game_items
for update
to authenticated
using (
  exists (
    select 1
    from public.game_matches gm
    where gm.id = game_items.match_id
      and gm.author_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.game_matches gm
    where gm.id = game_items.match_id
      and gm.author_id = auth.uid()
  )
);

create policy "Authenticated owners can delete items for their matches"
on public.game_items
for delete
to authenticated
using (
  exists (
    select 1
    from public.game_matches gm
    where gm.id = game_items.match_id
      and gm.author_id = auth.uid()
  )
);
