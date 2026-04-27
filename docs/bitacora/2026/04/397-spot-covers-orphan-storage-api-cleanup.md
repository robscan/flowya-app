# 397 — Cleanup Storage API de huérfanos en spot-covers

Fecha: 2026-04-27

## Contexto

El cleanup de 29 candidatos huérfanos en `spot-covers` quedó diferido al cierre 394 porque Supabase bloquea el borrado directo de objetos desde SQL. El usuario pidió cerrar el pendiente.

## Alcance

- Bucket: `spot-covers`.
- Fuente de candidatos: backup/listado `038_spot_covers_orphan_candidates_backup.sql`.
- Método de borrado: Supabase Storage API vía CLI (`supabase --experimental storage rm`).
- No se borraron objetos referenciados por `spot_images.storage_path`, `spot_images.url` ni `spots.cover_image_url`.
- No se tocó `spot-personal`.
- No se guardó service role en `.env`, docs, scripts ni commits.

## Precheck

- `038` ejecutado como respaldo/listado remoto.
- Backup/listado: 29 filas.
- Bytes aproximados respaldados: 18,882,765.
- Recompute antes de borrar: `remaining_orphan_candidates=29`.

## Ejecución

Se borraron 29 objetos exactos por Storage API, todos con path `{spotId}/cover.jpg` y listados en `spot_covers_orphan_delete_038_backup`.

## Postcheck

- `spot_covers_objects=81`.
- `remaining_orphan_candidates=0`.
- `spot_images_path_first=81`.
- `spots_with_cover_url=42`.

## Tooling agregado

Se agrega helper operativo:

- `scripts/supabase/delete-spot-covers-orphans.mjs`

El helper es `--dry-run` por defecto, revalida referencias y requiere `SUPABASE_SERVICE_ROLE_KEY` temporal solo para `--execute`.

## Rollback

No hay rollback automático de Storage. La metadata previa queda respaldada en `public.spot_covers_orphan_delete_038_backup`; restaurar objetos requeriría re-subir archivos desde backup externo si existiera.
