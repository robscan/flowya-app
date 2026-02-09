# Bitácora — Auditoría flujo Eliminar spot (INSERT residual)

**Fecha:** 2026-02-08  
**Tipo:** Debug / Auditoría frontend

---

## Problema reportado

Al eliminar un spot desde la UI (usuario autenticado), aparecía un error de RLS del tipo “new row violates row-level security policy”, como si se intentara **INSERTAR** un spot, cuando la intención es solo hacer UPDATE (soft delete).

## Contexto confirmado

- Supabase RLS está correcto.
- UPDATE spots (soft delete) `update({ is_hidden: true })` funciona en SQL manual.
- INSERT a spots solo permitido para authenticated.
- El mensaje de error suele asociarse a INSERT; por eso se sospechó de un INSERT residual en frontend.

## Auditoría realizada

1. **Búsqueda en todo el repo**
   - `.insert(`, `.upsert(`, `from('spots')` en todos los `.ts`/`.tsx`.
   - **Único INSERT a tabla `spots`:** `app/create-spot/index.web.tsx`, dentro de `handleCreate` (wizard de creación). No se ejecuta desde la pantalla de detalle ni al eliminar.

2. **Flujo completo al tocar “Eliminar Spot”**
   - `SpotDetail` → botón “Eliminar Spot” → `handleDeleteSpotPress` → `setShowDeleteConfirm(true)`.
   - Usuario confirma → `ConfirmModal` `onConfirm` → `handleDeleteConfirm` → `onDeleteSpot?.()` → en `app/spot/[id].web.tsx`: `handleDeleteSpot`.
   - `handleDeleteSpot`: `getUser()` → si no hay user, `openAuthModal` y `return`; si hay user, **solo** `supabase.from('spots').update({ is_hidden: true }).eq('id', spot.id)`; según resultado, toast y `router.back()` o toast de error.
   - No se llama a create-spot, ni a ningún helper que haga insert de spots. Al hacer `router.back()` se vuelve al mapa; `refetchSpots` en el mapa hace **SELECT**, no INSERT.

3. **Otros usos de `spots`**
   - `lib/spot-duplicate-check.ts`: solo SELECT.
   - `lib/spot-image-upload.ts`: storage (upload file), no tabla spots.
   - `lib/pins.ts`: upsert en tabla **pins**, no spots.
   - `components/design-system/spot-detail.tsx`: UPDATE cover_image_url; no INSERT a spots.

## Conclusión

- **No existe INSERT (ni upsert) a `spots` en el flujo de eliminar.**  
- La única mutación en ese flujo es:  
  `update({ is_hidden: true }).eq('id', spot.id)`.

Por tanto, **Supabase/RLS no era el problema** en el sentido de “politica mal configurada”. Si el error “new row violates…” sigue apareciendo al eliminar, es posible que:

- En Postgres/Supabase, la cláusula **WITH CHECK** de la política de **UPDATE** también pueda generar mensajes que mencionen “new row” (la nueva versión de la fila). En ese caso la revisión sería la política RLS de UPDATE, no el frontend.
- O que el error provenga de otro flujo (otra pestaña, otro componente o race) que no sea el handler de eliminar.

## Cambios realizados

- **Código:** No se eliminó ningún INSERT porque no había ninguno en el flujo de delete. Se añadió en `app/spot/[id].web.tsx` un comentario explícito encima de `handleDeleteSpot`: “Soft delete: ÚNICA mutación aquí es UPDATE is_hidden. No hay INSERT ni upsert a spots.”
- **Documentación:** Esta bitácora (`045-audit-delete-flow-no-insert.md`).

## Archivos tocados

| Archivo | Cambio |
|---------|--------|
| `app/spot/[id].web.tsx` | Comentario en `handleDeleteSpot` aclarando que solo se hace UPDATE. |
| `docs/bitacora/2026/02/045-audit-delete-flow-no-insert.md` | Esta bitácora. |

## Confirmación

- Eliminar spot **solo** ejecuta `update({ is_hidden: true }).eq('id', spot.id)`.
- No hay ningún INSERT a `spots` en ese flujo.
- El único INSERT a `spots` del proyecto está en `app/create-spot/index.web.tsx` (`handleCreate`), ajeno al flujo de eliminar.
