# 393 — Spot covers orphan cleanup deferred

Fecha: 2026-04-26

## Cambio

Se detectó que Supabase bloquea el borrado directo desde `storage.objects`:

> Direct deletion from storage tables is not allowed. Use the Storage API instead.

Por lo tanto, el cleanup de objetos huérfanos del bucket público `spot-covers` queda **diferido**. No se elimina nada desde SQL.

## Alcance

`supabase/migrations/038_spot_covers_orphan_candidates_backup.sql` queda solo como preparación de respaldo/listado de candidatos que no estén referenciados por:

- `public.spot_images.storage_path`
- `public.spot_images.url`
- `public.spots.cover_image_url`

La metadata completa de `storage.objects` se respalda en:

- `public.spot_covers_orphan_delete_038_backup`

## Contexto

Inventario remoto previo:

- `spot-covers`: 103 objetos.
- `spot_images`: 74 filas tras `035` + `036`.
- `cover_only`: 0.
- `orphan_candidate`: 29.

## Qué NO toca

- No toca `spot_images`.
- No toca `spots`.
- No toca `spot_personal_images`.
- No cambia buckets, RLS ni consentimiento.
- No toca objetos referenciados por galería o portada.

## Verificación esperada

Cuando se retome:

- ejecutar backup/listado primero;
- revisar dry-run de paths a borrar;
- borrar mediante Storage API con service role temporal;
- verificar `remaining_orphan_candidates=0`;
- no persistir service role en `.env`.

## Pendiente

- Crear script operativo Storage API con `--dry-run` por defecto.
- Ejecutarlo solo en un micro-scope futuro autorizado.
- Registrar conteos post-cleanup en `MEDIA_STORAGE_INVENTORY_2026-04-26.md`.
