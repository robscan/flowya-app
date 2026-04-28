-- 042_user_geo_marks.sql
--
-- Owner-only relationship between users and canonical geo entities.
--
-- Scope:
-- - user can mark a country/region/city/future area as saved or visited;
-- - pins remain only for spots;
-- - no runtime connection in this migration;
-- - no backfill from spots/pins;
-- - no public aggregate/progress RPC.
--
-- Rollback sketch:
--   If there is no productive usage, drop table public.user_geo_marks and
--   function public.normalize_user_geo_mark_state().
--   If already consumed by runtime/user data, keep table and remove consumers or
--   use a corrective migration; do not hard-delete user state without backup.

create table if not exists public.user_geo_marks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  entity_type text not null,
  entity_id uuid not null,
  saved boolean not null default false,
  visited boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_geo_marks_entity_type_check check (
    entity_type in ('country', 'region', 'city', 'area')
  ),
  constraint user_geo_marks_user_entity_unique unique (user_id, entity_type, entity_id),
  constraint user_geo_marks_has_state check (saved = true or visited = true)
);

create index if not exists user_geo_marks_user_idx
  on public.user_geo_marks(user_id);

create index if not exists user_geo_marks_entity_idx
  on public.user_geo_marks(entity_type, entity_id);

create index if not exists user_geo_marks_user_visited_idx
  on public.user_geo_marks(user_id, entity_type, visited)
  where visited = true;

create or replace function public.normalize_user_geo_mark_state()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.saved := coalesce(new.saved, false);
  new.visited := coalesce(new.visited, false);

  if new.visited = true then
    new.saved := false;
  end if;

  if new.saved = false and new.visited = false then
    raise exception 'user_geo_marks rows must have saved=true or visited=true';
  end if;

  if tg_op = 'UPDATE' then
    new.updated_at := now();
  end if;

  return new;
end;
$$;

drop trigger if exists user_geo_marks_normalize_state_trigger on public.user_geo_marks;
create trigger user_geo_marks_normalize_state_trigger
  before insert or update of saved, visited
  on public.user_geo_marks
  for each row
  execute function public.normalize_user_geo_mark_state();

alter table public.user_geo_marks enable row level security;

drop policy if exists "user_geo_marks_select_own" on public.user_geo_marks;
create policy "user_geo_marks_select_own" on public.user_geo_marks
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "user_geo_marks_insert_own" on public.user_geo_marks;
create policy "user_geo_marks_insert_own" on public.user_geo_marks
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "user_geo_marks_update_own" on public.user_geo_marks;
create policy "user_geo_marks_update_own" on public.user_geo_marks
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "user_geo_marks_delete_own" on public.user_geo_marks;
create policy "user_geo_marks_delete_own" on public.user_geo_marks
  for delete
  to authenticated
  using (auth.uid() = user_id);

comment on table public.user_geo_marks is
  'Owner-only saved/visited relationship between users and canonical geo entities. Pins remain spot-only.';
comment on column public.user_geo_marks.entity_type is
  'country, region, city or future area. Used with entity_id to point at geo_*; polymorphic by design.';
comment on column public.user_geo_marks.entity_id is
  'References geo_countries/geo_regions/geo_cities/future geo_areas according to entity_type; integrity is enforced by runtime/admin tooling until split tables are justified.';
comment on column public.user_geo_marks.saved is
  'User saved/wants-to-visit this geo entity. If visited=true, saved is normalized to false.';
comment on column public.user_geo_marks.visited is
  'User visited this geo entity. visited=true wins over saved=true.';
comment on function public.normalize_user_geo_mark_state() is
  'Normalizes user_geo_marks saved/visited state, keeps visited exclusive and rejects rows without a state.';
