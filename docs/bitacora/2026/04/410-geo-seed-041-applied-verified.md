# 410 — Geo seed 041 applied and verified

**Fecha:** 2026-04-28
**Rama:** `codex/geo-seed-041-initial-scope`
**OL relacionado:** `OL-DATA-MODEL-INTROSPECTION-001`, `OL-GEO-CANON-001`

## Contexto

Tras aplicar y verificar `040`, producto autorizo avanzar con un seed geo minimo para QA de Search/GeoSheet, sin cargar un mundo completo ni tocar `spots`.

## Alcance aplicado

Se aplico `supabase/migrations/041_geo_seed_initial_scope.sql` via:

```bash
npx supabase db query --linked --file supabase/migrations/041_geo_seed_initial_scope.sql
```

No se uso `supabase db push`.

## Seed remoto

### Paises

- `MX` — Mexico
- `US` — United States / Estados Unidos
- `CR` — Costa Rica
- `PA` — Panama

### Regiones

- `MX-ROO` — Quintana Roo
- `MX-YUC` — Yucatan

### Ciudades/localidades

- `MX / MX-YUC / merida` — Merida
- `MX / MX-ROO / holbox` — Holbox, `city_type='island_town'`
- `CR / san-jose` — San Jose

Decision sobre Holbox:

- Entra temporalmente como `geo_cities.city_type='island_town'` porque `geo_areas` sigue diferido.
- No se crea `geo_areas`.
- No se crea ni modifica ningun `spot`.

## Verificacion

Se corrio [`GEO_SEED_041_VERIFY_2026-04-28.sql`](../../ops/GEO_SEED_041_VERIFY_2026-04-28.sql).

Resultado: todos los checks pasaron.

| Check | Resultado |
|---|---|
| Seed countries | `passed=true` |
| Seed regions | `passed=true` |
| Seed cities | `passed=true` |
| Seed counts | `passed=true` |
| `spots` sin cambio vs bitacora `405` | `313` total / `304` visibles |

Conteos:

| Tabla/ref | Count |
|---|---:|
| `geo_countries` | 4 |
| `geo_regions` | 2 |
| `geo_cities` | 3 |
| `geo_aliases` | 21 |
| `geo_external_refs` | 19 |

Nota aliases:

- Variantes con/sin acento comparten `normalized_name` y se colapsan por el unique index de `geo_aliases`.
- Por eso el conteo final es 21, no 26 inputs conceptuales.

## Alcance excluido

- No seed mundial.
- No backfill.
- No cleanup.
- No cambios en `spots` ni `pins`.
- No `user_geo_marks`.
- No Storage.
- No Search runtime conectado a `geo_*` todavia.

## Rollback

Mientras no exista consumo runtime ni relaciones usuario:

```sql
delete from public.geo_external_refs
where provider = 'flowya'
   or (provider = 'iso' and provider_ref in ('MX', 'MEX', 'US', 'USA', 'CR', 'CRI', 'PA', 'PAN', 'MX-ROO', 'MX-YUC'));

delete from public.geo_aliases
where source = 'flowya_seed_041';

delete from public.geo_cities
where source = 'flowya_seed_041';

delete from public.geo_regions
where source = 'flowya_seed_041';

delete from public.geo_countries
where source = 'flowya_seed_041';
```

Si ya hay consumo runtime/usuario, no borrar directo: usar `is_active=false` o migracion correctiva.

## Proximo paso recomendado

Preparar `042_user_geo_marks` owner-only antes de permitir guardar pais/region/ciudad desde UI. Search/GeoSheet puede empezar a leer `geo_*` en un micro-scope aparte, pero guardar entidades geo requiere `user_geo_marks`.
