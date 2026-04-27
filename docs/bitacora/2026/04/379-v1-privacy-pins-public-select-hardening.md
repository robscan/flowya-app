# 379 — V1 privacy pins public select hardening

**Fecha:** 2026-04-26  
**Tipo:** seguridad / RLS / V1 release gate  
**Estado:** aplicado en Supabase remoto `flowya-v0`

## Contexto

Durante la introspección V1 se detectó que `public.pins` tenía una policy pública:

- `pins_select_public`
- `USING true`

Esto permitía lectura directa de relaciones usuario–spot (`user_id`, `spot_id`, `saved`, `visited`) desde API pública si el cliente consultaba la tabla.

La app no necesita lectura pública directa de `pins`:

- los flujos personales usan `getCurrentUserId()` y filtran por `user_id`;
- la recomendación pública agregada usa `public.get_most_visited_spots()` con k-anonymity (`HAVING count(*) >= 3`);
- no se debe exponer relación individual usuario–spot para V1 tiendas/web.

## Cambio

Se agregó y aplicó:

- `supabase/migrations/033_pins_remove_public_select.sql`

La migración:

- habilita RLS en `public.pins`;
- elimina `pins_select_public`;
- recrea `pins SELECT own` solo para `authenticated`;
- documenta que agregados públicos deben pasar por RPC k-anónima.

## Verificación

`pg_policies` remoto después de aplicar:

- `pins_delete_authenticated` — `authenticated`
- `pins_insert_authenticated` — `authenticated`
- `pins SELECT own` — `authenticated`
- `pins_update_authenticated` — `authenticated`

`pins_select_public` ya no existe.

Prueba REST anónima:

```text
GET /rest/v1/pins?select=id,spot_id,saved,visited&limit=5
→ 200 []
```

RPC agregada:

- `public.get_most_visited_spots(int)` conserva grants para `anon` y `authenticated`.

## Riesgo mitigado

Se reduce exposición pública de comportamiento personal de usuarios antes de web/tiendas.

## Pendientes

- Actualizar `DATA_MODEL_CURRENT.md` con estado real post-introspección.
- Mantener `get_most_visited_spots` como única fuente pública agregada mientras no exista decisión de producto para datos sociales.
- Añadir smoke test RLS/security en checklist V1.

