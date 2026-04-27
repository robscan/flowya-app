# PLAN_DATA_MODEL_MEDIA_GEO_V1

**Fecha:** 2026-04-26  
**Estado:** plan seguro posterior a introspección; no aplicar migraciones sin aprobación explícita  
**Base:** [`DATA_MODEL_CURRENT.md`](../../contracts/DATA_MODEL_CURRENT.md), [`SUPABASE_INTROSPECTION_RESULTS_2026-04-26.md`](../SUPABASE_INTROSPECTION_RESULTS_2026-04-26.md), [`EXPLORE_STABILITY_MEDIA_DB_AUDIT.md`](../EXPLORE_STABILITY_MEDIA_DB_AUDIT.md)

---

## Objetivo

Preparar FLOWYA V1 para web y tiendas sin convertir `spots` en una tabla gigante ni introducir deuda de privacidad/media. El plan separa cuatro frentes:

1. estabilidad crítica de datos actuales;
2. canon media path-first;
3. campos mínimos seguros para `spots`;
4. contexto país/región/ciudad por lotes.

---

## Principios

- `spots` debe ser una tabla caliente: identidad, coordenadas, owner, visibilidad, linking y snapshot mínimo.
- Media debe ser path-first, pero compatible con URLs legacy.
- Datos territoriales pesados no van en `spots`.
- Batch/manual-curated primero; APIs en tiempo real solo cuando el producto lo justifique.
- Cada migración debe ser aditiva, reversible o con mitigación, y respetar RLS.
- No limpiar Storage ni metadata sin inventario previo.

---

## Fase 0 — Cierre de evidencia

**Estado:** en curso.

DoD:

- [`DATA_MODEL_CURRENT.md`](../../contracts/DATA_MODEL_CURRENT.md) actualizado con introspección 2026-04-26.
- `OPEN_LOOPS.md` apunta a este plan y a la evidencia real.
- SQL de introspección queda como referencia operativa, no como paso manual disperso.

No tocar:

- migraciones remotas;
- RLS;
- Storage cleanup.

---

## Fase 1 — P0 datos existentes

Micro-scopes:

1. Aplicar o descartar `034_spots_invalid_mapbox_bbox_cleanup.sql` con respaldo y QA.
2. Inventariar los 29 objetos de `spot-covers` no reconciliados.
3. Aplicar/verificar `037_pins_status_derived_guard.sql` para cerrar `pins.status` como legacy derivado.

DoD:

- ningún spot conocido puede reencuadrar a país equivocado por `mapbox_bbox`;
- Storage queda clasificado en `gallery`, `cover`, `orphan_candidate`, `unknown`;
- `pins.status` queda documentado y protegido como legacy derivado de `saved`/`visited`.

Pruebas:

- SQL select de bbox inválidos antes/después;
- QA “Gran Parque La Pancha”;
- anon REST para `pins` sigue `200 []`;
- galería pública no pierde imágenes.
- SQL `pins` confirma cero drift entre `status`, `saved` y `visited`.

---

## Fase 2 — Media path-first V1

**Estado 2026-04-26:** base aplicada para `spot_images`; portadas legacy `cover_only` seedadas a galería; limpieza Storage y thumbnails siguen pendientes. Ver inventario [`MEDIA_STORAGE_INVENTORY_2026-04-26.md`](../MEDIA_STORAGE_INVENTORY_2026-04-26.md).

Migración aplicada, aditiva:

- `spot_images.storage_path text null`
- `spot_images.storage_bucket text null default 'spot-covers'`
- `spot_images.width integer null`
- `spot_images.height integer null`
- `spot_images.blurhash text null`
- `spot_images.thumb_path text null`
- `spot_images.updated_at timestamptz null`

Opcional posterior:

- `spot_images.version integer not null default 1`

Backfill aplicado:

- extraer path desde URLs públicas Supabase existentes;
- mantener `url` como legacy hasta que todos los consumidores usen helper.

Helper canónico:

- `getSpotPublicImageUrl(row)`:
  - si `storage_path`: construir URL desde bucket/CDN;
  - si no: usar `url` legacy;
  - futura extensión: thumbnails/transforms/version.

Runtime aplicado:

- `lib/spot-images.ts` expone `getSpotImagePublicUrl(row)`;
- nuevas filas de galería escriben `url`, `storage_bucket` y `storage_path`;
- consumidores principales resuelven URL con helper path-first.

Seed aplicado:

- `036_seed_cover_only_spot_images.sql` crea filas de galería para 18 portadas legacy;
- verificación: `seeded_rows=18`, `remaining_cover_only=0`;
- `cover_image_url` queda como cache/compatibilidad.

DoD:

- subir imagen refresca UI inmediatamente;
- galería, portada, búsqueda y cards consumen la misma resolución;
- privadas siguen usando `spot_personal_images.storage_path` + signed URLs;
- no se expone `spot-personal` públicamente.

---

## Fase 3 — Campos mínimos seguros en `spots`

Campos candidatos:

- `coordinate_source text null`
- `created_from text null`
- `country_code text null`
- `region_code text null`
- `city_name text null`

Checks sugeridos:

- `coordinate_source`: `map_tap|search_result|edit_manual|photo_exif|import|unknown`
- `created_from`: `map|search|poi|photo|manual|import|unknown`

Decisión abierta:

- `place_snapshot jsonb` en `spots` vs tabla relacionada `spot_place_snapshots`.

Recomendación:

- Para V1, agregar campos escalares mínimos solo si se usan en filtros/counters/cache.
- Para snapshot completo de proveedor, preferir tabla relacionada si crecerá con payloads o versiones.

DoD:

- ningún campo nuevo duplica datos de tablas territoriales;
- creación y edición escriben `coordinate_source`/`created_from` de forma consistente;
- si se guardan país/región/ciudad, se define fuente y fallback.

---

## Fase 4 — Contexto territorial batch

Modelo conceptual:

- `geo_countries`
- `geo_regions`
- `geo_cities`
- `geo_context_entries`

Categorías:

- información importante;
- visa;
- transporte;
- salud;
- dinero;
- clima;
- emergencias.

Nivel recomendado:

| Categoría | Nivel primario | Notas |
|---|---|---|
| Visa | país | puede variar por nacionalidad del usuario; V1 debe mostrar copy general/disclaimer |
| Transporte | ciudad/región | aeropuertos y rideshare son locales; país solo como resumen |
| Lado de conducción | país | dato estable |
| Salud/vacunas | país/región | requiere fuente y fecha |
| Dinero/divisa | país | divisa estable; tasas en tiempo real fuera de V1 |
| Clima | ciudad/región | histórico/promedio batch; clima actual por API futura |
| Emergencias | país/ciudad | números nacionales + contactos locales si hay fuente |

Proceso:

1. definir fuentes y licencia;
2. cargar país primero;
3. enriquecer ciudades/regiones por lotes;
4. exponer UI progresiva, no bloquear mapa/listados.

DoD:

- datos tienen `source`, `source_updated_at` y `freshness`;
- UI no mezcla datos no verificados con facts críticos;
- no hay dependencia online en tiempo real para abrir Explore.

---

## Fase 5 — Nativo fotos/ubicación/metadata

Viabilidad:

- Expo puede leer/seleccionar assets y pedir permisos.
- EXIF GPS depende de permisos, plataforma, privacidad del usuario y metadata disponible.
- Crear spots desde galería es viable, pero debe ser opt-in explícito.

Recomendación:

1. V1 tiendas: permisos claros, upload estable, sin creación automática desde EXIF.
2. V1.1: leer metadata local si está disponible y mostrar confirmación.
3. V2: crear spots desde galería por lote con revisión antes de guardar.

Riesgos:

- privacidad de ubicación;
- permisos App Store/Play Store;
- fotos sin EXIF;
- coordenadas antiguas o editadas;
- expectativas de que FLOWYA “lea todo” sin explicar.

---

## Qué NO tocar

- No mover visa/transporte/salud/dinero/clima/emergencias a `spots`.
- No eliminar `spot_images.url` hasta tener backfill/helper/QA.
- No publicar `spot-personal`.
- No limpiar Storage sin inventario.
- No agregar PostGIS/`pg_trgm` antes de necesidad real.
- No cambiar RLS de lectura/escritura sin SQL de verificación.
- No abrir Fluir ni Recordar como parte de este plan.

---

## Próxima decisión recomendada

Antes de nuevos campos:

1. cerrar Fase 0 como completada;
2. decidir si aplicamos `034` de bbox;
3. crear micro-scope de media path-first aditivo;
4. diseñar migración mínima de `spots` solo para `coordinate_source`/`created_from` y quizá país/región/ciudad si se confirma uso en UI V1.
