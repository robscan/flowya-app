# MEDIA_STORAGE_INVENTORY_2026-04-26

**Estado:** evidencia remota post-034 / post-035  
**Ambiente:** Supabase remoto vinculado  
**Alcance:** bucket `spot-covers`, `public.spot_images`, `public.spots.cover_image_url`

---

## Resumen

El inventario confirma que `spot-covers` contiene objetos válidos, portadas legacy y candidatos huérfanos. No se eliminó ningún objeto.

Conteo actual:

| Métrica | Valor |
|---|---:|
| Objetos en `spot-covers` | 103 |
| Filas `spot_images` | 56 |
| Paths distintos en `spot_images` | 56 |
| Spots con `cover_image_url` | 37 |
| Paths distintos en `cover_image_url` | 37 |

Clasificación por objeto único inicial:

| Clasificación | Objetos | Bytes aprox. | Interpretación |
|---|---:|---:|---|
| `gallery_and_cover` | 19 | 12.5 MB | Imagen de galería que también es portada actual |
| `gallery_only` | 37 | 24.4 MB | Imagen de galería, no portada |
| `cover_only` | 18 | 11.5 MB | Portada legacy sin fila en galería |
| `orphan_candidate` | 29 | 18.9 MB | No referenciada por galería ni portada |

Detalle de huérfanos:

| Tipo | Objetos | Bytes aprox. |
|---|---:|---:|
| Prefijo coincide con spot visible | 3 | 1.4 MB |
| Sin spot correspondiente por prefijo | 26 | 17.4 MB |

---

## Decisiones

1. **No borrar objetos en esta fase.** Los 29 candidatos huérfanos pueden venir de pruebas, spots eliminados históricamente, portadas reemplazadas o uploads incompletos.
2. **`cover_only` no es huérfano.** Son portadas legacy usadas por `spots.cover_image_url`. Pueden seedearse a galería en un micro-scope posterior si se quiere unificar experiencia.
3. **Path-first queda aplicado para `spot_images`.** La migración `035_spot_images_path_first_metadata.sql` agrega campos y backfill sin eliminar `url`.

---

## Migración aplicada

Archivo:

- `supabase/migrations/035_spot_images_path_first_metadata.sql`
- `supabase/migrations/036_seed_cover_only_spot_images.sql`

Efecto:

- agrega `storage_bucket`;
- agrega `storage_path`;
- agrega `width`, `height`, `blurhash`, `thumb_path`;
- agrega `version`;
- agrega `updated_at`;
- backfill de `storage_path` desde URL pública Supabase;
- índices por `(spot_id, sort_order, created_at)` y `(storage_bucket, storage_path)`.

Verificación remota:

| Métrica | Valor |
|---|---:|
| `spot_images` total | 56 |
| filas path-first (`storage_bucket='spot-covers'` y `storage_path not null`) | 56 |
| filas sin path | 0 |

### Seed `cover_only` aplicado

La migración `036` creó filas de galería para portadas legacy sin galería existente.

Verificación remota:

| Métrica | Valor |
|---|---:|
| `seeded_rows` | 18 |
| `remaining_cover_only` | 0 |

Estado resultante:

- toda portada pública referenciada por `spots.cover_image_url` también existe ahora en `spot_images`;
- `cover_image_url` se mantiene como cache/compatibilidad;
- no se borró ningún objeto de Storage.

---

## Canon runtime

Regla nueva:

- consumidores deben resolver imagen pública con helper path-first;
- `storage_path` + `storage_bucket` ganan cuando existen;
- `url` queda como fallback legacy.

Código:

- `lib/spot-images.ts`
  - `SpotImageRow` incluye metadata path-first;
  - `getSpotImagePublicUrl(row)`;
  - inserts de galería escriben `url`, `storage_bucket` y `storage_path`;
  - `syncCoverFromGallery()` usa helper path-first;
  - delete de galería borra por `storage_path` si existe.
- `hooks/useSpotGalleryUris.ts`
- `app/spot/edit/[id].web.tsx`
- `components/explorar/MapScreenVNext.tsx`

---

## Próximos micro-scopes

1. **Cleanup huérfanos pendiente:** no ejecutar ahora. Supabase bloquea borrado directo desde `storage.objects`; cuando se retome, usar Storage API con service role temporal y respaldo previo de metadata. `038_spot_covers_orphan_candidates_backup.sql` queda solo como preparación de backup/listado, no como delete.
2. **Thumbnails:** definir generación de `thumb_path`, `width`, `height`, `blurhash`.
3. **CDN/helper central:** si se introduce CDN, cambiar helper sin migrar datos.
4. **Tipos Supabase:** regenerar tipos cuando el flujo de tipos quede acordado.

---

## Qué NO tocar

- No borrar `spot-covers`.
- No borrar objetos referenciados por `spot_images` o `spots.cover_image_url`.
- No remover `spot_images.url`.
- No cambiar buckets públicos/privados.
- No tocar `spot_personal_images`.
- No cambiar consentimiento de fotos.
