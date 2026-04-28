-- 040_geo_core_tables.sql
--
-- Additive geo identity foundation for Flowya V1.
--
-- Scope:
-- - countries, regions and cities as canonical territorial entities;
-- - aliases and external references for multilingual search and provider reconciliation;
-- - RLS enabled with public read access only for active metadata;
-- - no seeds, no backfill, no spots mutation, no Storage operation.
--
-- Rollback sketch if this has not been consumed by runtime/user data:
--   drop table if exists public.geo_external_refs;
--   drop table if exists public.geo_aliases;
--   drop table if exists public.geo_cities;
--   drop table if exists public.geo_regions;
--   drop table if exists public.geo_countries;
--   drop function if exists public.geo_set_updated_at();
--
-- If runtime/user data already depends on geo_* rows, use is_active=false and a follow-up
-- migration instead of dropping tables.

create table if not exists public.geo_countries (
  id uuid primary key default gen_random_uuid(),
  iso2 text not null,
  iso3 text,
  name_es text not null,
  name_en text not null,
  slug text not null,
  centroid_latitude double precision,
  centroid_longitude double precision,
  bbox jsonb,
  source text not null default 'flowya_curated',
  source_updated_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint geo_countries_iso2_unique unique (iso2),
  constraint geo_countries_iso3_unique unique (iso3),
  constraint geo_countries_slug_unique unique (slug),
  constraint geo_countries_iso2_format check (iso2 ~ '^[A-Z]{2}$'),
  constraint geo_countries_iso3_format check (iso3 is null or iso3 ~ '^[A-Z]{3}$'),
  constraint geo_countries_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint geo_countries_centroid_pair check (
    (centroid_latitude is null and centroid_longitude is null)
    or (centroid_latitude is not null and centroid_longitude is not null)
  ),
  constraint geo_countries_latitude_range check (
    centroid_latitude is null or centroid_latitude between -90 and 90
  ),
  constraint geo_countries_longitude_range check (
    centroid_longitude is null or centroid_longitude between -180 and 180
  )
);

create table if not exists public.geo_regions (
  id uuid primary key default gen_random_uuid(),
  country_id uuid not null references public.geo_countries(id) on delete restrict,
  region_code text,
  name_es text not null,
  name_en text not null,
  slug text not null,
  region_type text not null default 'region',
  centroid_latitude double precision,
  centroid_longitude double precision,
  bbox jsonb,
  source text not null default 'flowya_curated',
  source_updated_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint geo_regions_country_code_unique unique (country_id, region_code),
  constraint geo_regions_country_slug_unique unique (country_id, slug),
  constraint geo_regions_region_type_check check (
    region_type in ('state', 'province', 'region', 'district', 'territory', 'other')
  ),
  constraint geo_regions_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint geo_regions_centroid_pair check (
    (centroid_latitude is null and centroid_longitude is null)
    or (centroid_latitude is not null and centroid_longitude is not null)
  ),
  constraint geo_regions_latitude_range check (
    centroid_latitude is null or centroid_latitude between -90 and 90
  ),
  constraint geo_regions_longitude_range check (
    centroid_longitude is null or centroid_longitude between -180 and 180
  )
);

create table if not exists public.geo_cities (
  id uuid primary key default gen_random_uuid(),
  country_id uuid not null references public.geo_countries(id) on delete restrict,
  region_id uuid references public.geo_regions(id) on delete restrict,
  official_name text not null,
  name_es text not null,
  name_en text not null,
  slug text not null,
  city_type text not null default 'city',
  centroid_latitude double precision,
  centroid_longitude double precision,
  bbox jsonb,
  population_bucket text,
  source text not null default 'flowya_curated',
  source_updated_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint geo_cities_city_type_check check (
    city_type in ('city', 'town', 'village', 'locality', 'island_town', 'other')
  ),
  constraint geo_cities_population_bucket_check check (
    population_bucket is null
    or population_bucket in ('lt_10k', '10k_50k', '50k_250k', '250k_1m', '1m_5m', 'gt_5m')
  ),
  constraint geo_cities_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint geo_cities_centroid_pair check (
    (centroid_latitude is null and centroid_longitude is null)
    or (centroid_latitude is not null and centroid_longitude is not null)
  ),
  constraint geo_cities_latitude_range check (
    centroid_latitude is null or centroid_latitude between -90 and 90
  ),
  constraint geo_cities_longitude_range check (
    centroid_longitude is null or centroid_longitude between -180 and 180
  )
);

create unique index if not exists geo_cities_country_region_slug_unique
  on public.geo_cities(
    country_id,
    coalesce(region_id, '00000000-0000-0000-0000-000000000000'::uuid),
    slug
  );

create table if not exists public.geo_aliases (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id uuid not null,
  locale text,
  name text not null,
  normalized_name text not null,
  source text not null default 'flowya_curated',
  is_primary boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint geo_aliases_entity_type_check check (
    entity_type in ('country', 'region', 'city', 'area')
  ),
  constraint geo_aliases_locale_format check (
    locale is null or locale ~ '^[a-z]{2}(-[A-Z]{2})?$'
  ),
  constraint geo_aliases_name_nonblank check (btrim(name) <> ''),
  constraint geo_aliases_normalized_name_nonblank check (btrim(normalized_name) <> '')
);

create unique index if not exists geo_aliases_unique
  on public.geo_aliases(entity_type, entity_id, coalesce(locale, 'und'), normalized_name);

create index if not exists geo_aliases_lookup_idx
  on public.geo_aliases(normalized_name, entity_type)
  where is_active = true;

create table if not exists public.geo_external_refs (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id uuid not null,
  provider text not null,
  provider_ref text not null,
  provider_kind text,
  confidence numeric,
  source_updated_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint geo_external_refs_entity_type_check check (
    entity_type in ('country', 'region', 'city', 'area')
  ),
  constraint geo_external_refs_provider_nonblank check (btrim(provider) <> ''),
  constraint geo_external_refs_provider_ref_nonblank check (btrim(provider_ref) <> ''),
  constraint geo_external_refs_confidence_range check (
    confidence is null or (confidence >= 0 and confidence <= 1)
  ),
  constraint geo_external_refs_unique unique (provider, provider_ref, entity_type)
);

create index if not exists geo_external_refs_entity_idx
  on public.geo_external_refs(entity_type, entity_id)
  where is_active = true;

create index if not exists geo_regions_country_idx
  on public.geo_regions(country_id);

create index if not exists geo_cities_country_idx
  on public.geo_cities(country_id);

create index if not exists geo_cities_region_idx
  on public.geo_cities(region_id)
  where region_id is not null;

create or replace function public.geo_set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists geo_countries_set_updated_at_trigger on public.geo_countries;
create trigger geo_countries_set_updated_at_trigger
  before update on public.geo_countries
  for each row
  execute function public.geo_set_updated_at();

drop trigger if exists geo_regions_set_updated_at_trigger on public.geo_regions;
create trigger geo_regions_set_updated_at_trigger
  before update on public.geo_regions
  for each row
  execute function public.geo_set_updated_at();

drop trigger if exists geo_cities_set_updated_at_trigger on public.geo_cities;
create trigger geo_cities_set_updated_at_trigger
  before update on public.geo_cities
  for each row
  execute function public.geo_set_updated_at();

drop trigger if exists geo_aliases_set_updated_at_trigger on public.geo_aliases;
create trigger geo_aliases_set_updated_at_trigger
  before update on public.geo_aliases
  for each row
  execute function public.geo_set_updated_at();

drop trigger if exists geo_external_refs_set_updated_at_trigger on public.geo_external_refs;
create trigger geo_external_refs_set_updated_at_trigger
  before update on public.geo_external_refs
  for each row
  execute function public.geo_set_updated_at();

alter table public.geo_countries enable row level security;
alter table public.geo_regions enable row level security;
alter table public.geo_cities enable row level security;
alter table public.geo_aliases enable row level security;
alter table public.geo_external_refs enable row level security;

drop policy if exists "geo_countries_select_active" on public.geo_countries;
create policy "geo_countries_select_active" on public.geo_countries
  for select
  to anon, authenticated
  using (is_active = true);

drop policy if exists "geo_regions_select_active" on public.geo_regions;
create policy "geo_regions_select_active" on public.geo_regions
  for select
  to anon, authenticated
  using (is_active = true);

drop policy if exists "geo_cities_select_active" on public.geo_cities;
create policy "geo_cities_select_active" on public.geo_cities
  for select
  to anon, authenticated
  using (is_active = true);

drop policy if exists "geo_aliases_select_active" on public.geo_aliases;
create policy "geo_aliases_select_active" on public.geo_aliases
  for select
  to anon, authenticated
  using (is_active = true);

drop policy if exists "geo_external_refs_select_active" on public.geo_external_refs;
create policy "geo_external_refs_select_active" on public.geo_external_refs
  for select
  to anon, authenticated
  using (is_active = true);

comment on table public.geo_countries is
  'Canonical Flowya country metadata. Countries are not spots.';
comment on table public.geo_regions is
  'Canonical Flowya region/state/province metadata. Regions are not spots.';
comment on table public.geo_cities is
  'Canonical Flowya city/locality metadata. Cities are not spots.';
comment on table public.geo_aliases is
  'Multilingual and alternate names for geo entities. Polymorphic entity_id integrity is enforced by curated admin tooling until split tables are justified.';
comment on table public.geo_external_refs is
  'Provider references for geo reconciliation. Polymorphic entity_id integrity is enforced by curated admin tooling until split tables are justified.';

comment on column public.geo_countries.iso2 is
  'ISO 3166-1 alpha-2 country code; primary natural key for countries in V1.';
comment on column public.geo_regions.region_code is
  'ISO 3166-2 or Flowya-curated regional code when no stable external code exists.';
comment on column public.geo_cities.region_id is
  'Nullable because some countries/city seeds may not have a confirmed region at ingestion time.';
comment on column public.geo_aliases.entity_id is
  'References geo_countries/geo_regions/geo_cities/future geo_areas according to entity_type; no database FK because this table is intentionally polymorphic.';
comment on column public.geo_external_refs.entity_id is
  'References geo_countries/geo_regions/geo_cities/future geo_areas according to entity_type; no database FK because this table is intentionally polymorphic.';
