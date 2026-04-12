# 346 — OL-CONTENT-002 fase 1: `spot_images`, Storage gallery, lib

**Fecha:** 2026-04-12  
**Tipo:** Implementación — galería v1 (fundamentos)

## Contexto

Loop activo **OL-CONTENT-002** ([`PLAN_OL_CONTENT_002_GALERIA_V1_2026-03-11.md`](../../ops/plans/PLAN_OL_CONTENT_002_GALERIA_V1_2026-03-11.md)).

## Entregado

1. **`supabase/migrations/024_spot_images.sql`** — Tabla `spot_images` (FK `spots` ON DELETE CASCADE), índice por `spot_id`, RLS: SELECT abierto (como `spots`), escrituras solo si `spots.user_id = auth.uid()`.
2. **`supabase/migrations/025_storage_spot_gallery_owner.sql`** — Políticas Storage en bucket `spot-covers` para rutas `{spotId}/gallery/*.(jpg|jpeg)`; dueño del spot; tres segmentos (sin subcarpetas extra).
3. **`lib/spot-images.ts`** — API cliente: listar, insertar fila (tope 12), borrar fila + borrado best-effort en Storage vía URL pública, reordenar, `syncCoverFromGallery` (portada = primera por `sort_order` solo si hay imágenes).
4. **`lib/spot-image-upload.ts`** — `uploadSpotGalleryImage(spotId, blob)`.

## Siguiente

- UI: grid en SpotSheet / detalle, modal fullscreen multi-imagen, flujos crear/editar según plan §4–§5.

## Trazabilidad GitHub

- Merge conjunto galería web + cierre OL (incluye trabajo de esta fase): [**PR #138**](https://github.com/robscan/flowya-app/pull/138) (2026-04-12).
- Cierre operativo y paridad nativa: [`347`](347-ol-content-002-cierre-web-galeria-paridad-deferida.md). Índice PR: [`349`](349-indice-trazabilidad-pr-130-139-2026-04.md).

## Aplicar migraciones

Ejecutar en el proyecto Supabase correspondiente (local/prod) el pipeline habitual de migraciones; no sustituye revisión de políticas en entorno real.
