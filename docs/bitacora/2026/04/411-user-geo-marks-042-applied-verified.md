# 411 — User geo marks 042 applied and verified

**Fecha:** 2026-04-28
**Rama:** `codex/geo-user-marks-042`
**OL relacionado:** `OL-DATA-MODEL-INTROSPECTION-001`, `OL-GEO-CANON-001`

## Contexto

Despues de aplicar `040` y `041`, Flowya ya tiene identidad geo canonica y seed minimo. Antes de permitir guardar paises/regiones/ciudades desde UI, faltaba una relacion owner-only equivalente a `pins`, pero para entidades geo.

## Alcance aplicado

Se aplico `supabase/migrations/042_user_geo_marks.sql` via:

```bash
npx supabase db query --linked --file supabase/migrations/042_user_geo_marks.sql
```

No se uso `supabase db push`.

## Resultado remoto

Se creo `public.user_geo_marks` con:

- `user_id` owner;
- `entity_type`: `country|region|city|area`;
- `entity_id`;
- `saved`;
- `visited`;
- unique `(user_id, entity_type, entity_id)`;
- RLS enabled;
- policies owner-only `select/insert/update/delete` para `authenticated`;
- trigger `user_geo_marks_normalize_state_trigger`;
- funcion `normalize_user_geo_mark_state()`;
- indices de usuario, entidad y usuario+visited.

Regla de estado:

- `visited=true` normaliza `saved=false`;
- no se permiten filas sin `saved` ni `visited`.

## Verificacion

Se corrio [`USER_GEO_MARKS_042_VERIFY_2026-04-28.sql`](../../ops/USER_GEO_MARKS_042_VERIFY_2026-04-28.sql).

Resultado: todos los checks pasaron.

| Check | Resultado |
|---|---|
| Tabla existe + RLS | `passed=true` |
| Policies owner-only | `passed=true` |
| Indices requeridos | `passed=true` |
| Trigger normalize state | `passed=true` |
| Cero filas tras `042` | `passed=true` |
| `spots` sin cambio vs bitacora `405` | `313` total / `304` visibles |

Tambien se corrio:

```bash
npx supabase db lint --linked --fail-on error
```

Resultado: no schema errors.

## Alcance excluido

- No runtime UI.
- No Search/GeoSheet conectado a guardar geo.
- No backfill desde `spots`/`pins`.
- No agregados publicos ni progreso Passport.
- No Storage.
- No hard delete.

## Riesgos controlados

- `entity_id` es polimorfico y no tiene FK real. Esto sigue el contrato `geo_aliases`/`geo_external_refs`: integridad por runtime/admin tooling hasta justificar tablas separadas.
- La tabla esta vacia tras migracion; no hay impacto en usuarios actuales ni web.

## Rollback

Si no existe uso productivo:

```sql
drop table if exists public.user_geo_marks;
drop function if exists public.normalize_user_geo_mark_state();
```

Si ya existe uso runtime/usuario, no borrar sin backup; retirar consumidores o migrar estado explicitamente.

## Proximo paso recomendado

Con `040` + `041` + `042`, ya se puede planear el primer micro-scope runtime seguro:

- Search lee `geo_*` como resultados geo;
- tap abre `GeoSheet`;
- guardar/visitar escribe `user_geo_marks`;
- no crear `spots` para pais/region/ciudad.
