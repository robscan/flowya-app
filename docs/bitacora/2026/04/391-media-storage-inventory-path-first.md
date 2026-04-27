# 391 — Media storage inventory + path-first spot_images

Fecha: 2026-04-26

## Cambio

- Se inventarió `spot-covers` contra `spot_images.url` y `spots.cover_image_url`.
- Se creó y aplicó `035_spot_images_path_first_metadata.sql`.
- Se creó y aplicó `036_seed_cover_only_spot_images.sql` para seedear portadas legacy `cover_only` en `spot_images`.
- `spot_images` queda path-first sin romper legacy:
  - `storage_bucket`
  - `storage_path`
  - `width`
  - `height`
  - `blurhash`
  - `thumb_path`
  - `version`
  - `updated_at`
- Se actualiza runtime para escribir `storage_path` en nuevas filas y resolver URLs públicas mediante `getSpotImagePublicUrl()`.

## Evidencia remota

Inventario por objeto único:

- `spot-covers`: 103 objetos.
- `gallery_and_cover`: 19.
- `gallery_only`: 37.
- `cover_only`: 18.
- `orphan_candidate`: 29.

Huérfanos:

- 3 con prefijo de spot visible.
- 26 sin spot correspondiente por prefijo.

Post-migración:

- `spot_images` total: 56.
- `rows_path_first`: 56.
- `rows_without_path`: 0.

Post-seed:

- `seeded_rows`: 18.
- `remaining_cover_only`: 0.

## Criterio

No se borra Storage en este bloque. Los objetos `cover_only` ya fueron seedados a galería; los `orphan_candidate` requieren revisión antes de limpieza. `url` sigue como fallback mientras la app migra consumidores y se prepara CDN/thumbnails.

## Archivos

- `supabase/migrations/035_spot_images_path_first_metadata.sql`
- `supabase/migrations/036_seed_cover_only_spot_images.sql`
- `lib/spot-images.ts`
- `hooks/useSpotGalleryUris.ts`
- `app/spot/edit/[id].web.tsx`
- `components/explorar/MapScreenVNext.tsx`
- `docs/ops/MEDIA_STORAGE_INVENTORY_2026-04-26.md`

## Pendiente

- QA upload/galería en web.
- Revisar candidatos huérfanos antes de cualquier cleanup.
- Regenerar tipos Supabase cuando se acuerde el flujo.
