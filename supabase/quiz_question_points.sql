-- Add per-question scoring to existing QuizBop data.
-- Run this once in the Supabase SQL Editor.

begin;

alter table public.quiz_items
  add column if not exists points integer;

-- Existing questions receive the standard 10-point value. This also repairs
-- any partial/invalid values before the database constraint is installed.
update public.quiz_items
set points = 10
where points is null or points not in (5, 10, 15);

alter table public.quiz_items
  alter column points set default 10,
  alter column points set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'quiz_items_points_allowed'
      and conrelid = 'public.quiz_items'::regclass
  ) then
    alter table public.quiz_items
      add constraint quiz_items_points_allowed
      check (points in (5, 10, 15));
  end if;
end;
$$;

commit;
