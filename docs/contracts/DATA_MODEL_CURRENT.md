# DATA_MODEL_CURRENT

**Estado:** CURRENT
**Última verificación:** 2026-04-26; alineación geo runtime 2026-05-04
**Fuente de evidencia:** [`SUPABASE_INTROSPECTION_RESULTS_2026-04-26.md`](../ops/SUPABASE_INTROSPECTION_RESULTS_2026-04-26.md) + SQL operativo [`SUPABASE_INTROSPECTION_SQL.md`](../ops/SUPABASE_INTROSPECTION_SQL.md) + migraciones/verificadores geo `040`-`042` y bitácoras [`409`](../bitacora/2026/04/409-geo-core-040-applied-verified.md), [`410`](../bitacora/2026/04/410-geo-seed-041-applied-verified.md), [`411`](../bitacora/2026/04/411-user-geo-marks-042-applied-verified.md).
**Uso:** contrato vivo para cerrar `OL-DATA-MODEL-INTROSPECTION-001` y decidir migraciones V1 sin asumir que migraciones locales o tipos viejos representan el remoto.

> Nota: este documento no sustituye contratos especializados de perfil, fotos, búsqueda, mapa o tags. Resume el esquema real mínimo y sus implicaciones.

---

## 1. Evidencia y alcance

La introspección 2026-04-26 cubre tablas públicas críticas, Storage, RLS/policies relevantes, índices y conteos. La base real ya no coincide con la versión documentada de 2026-02-25.

Tablas revisadas:

- `spots`
- `pins`
- `profiles`
- `spot_images`
- `spot_personal_images`
- `user_tags`
- `pin_tags`
- `feedback`
- `geo_countries`
- `geo_regions`
- `geo_cities`
- `geo_aliases`
- `geo_external_refs`
- `user_geo_marks`

Conteos observados:

| Tabla | Filas |
|---|---:|
| `spots` | 312 |
| `pins` | 225 |
| `spot_images` | 74 |
| `spot_personal_images` | 0 |
| `profiles` | 4 |
| `user_tags` | 2 |
| `pin_tags` | 38 |
| `feedback` | 0 |
| `geo_countries` | 4 tras seed `041` |
| `geo_regions` | 2 tras seed `041` |
| `geo_cities` | 3 tras seed `041` |
| `geo_aliases` | 21 tras seed `041` |
| `geo_external_refs` | 19 tras seed `041` |
| `user_geo_marks` | 0 tras migración `042` |

---

## 2. Tablas actuales

### 2.1 `spots`

**Rol:** entidad pública/base de lugar. Debe mantenerse como tabla caliente y estable, no como contenedor de todo el contexto turístico.

Columnas reales:

- `id`
- `title`
- `description_short`
- `description_long`
- `latitude`
- `longitude`
- `cover_image_url`
- `created_at`
- `updated_at`
- `address`
- `is_hidden`
- `user_id`
- `link_status`
- `link_score`
- `linked_place_id`
- `linked_place_kind`
- `linked_maki`
- `linked_at`
- `link_version`
- `mapbox_feature_type`
- `mapbox_bbox`

Datos observados:

- 312 spots.
- 312 con `user_id`.
- 2 hidden, 310 visibles.
- 116 con `mapbox_bbox`.
- 18 `mapbox_bbox` no contienen el punto del spot.

No existen aún:

- `country_code`
- `region_code`
- `city_name`
- `coordinate_source`
- `created_from`
- `place_snapshot`
- `is_public`

Regla vigente:

- `is_hidden=false` opera hoy como lectura pública de facto por `spots_select_public`.
- No existe `is_public`; no asumir privacidad granular en `spots`.
- `mapbox_bbox` no es confiable si no contiene el punto `latitude/longitude`; gana el punto.
- `spots` no debe ser fuente canonica de pais/region/ciudad. La identidad geo V1 vive en `geo_*`; ver [`GEO_IDENTITY_DEDUP_V1.md`](GEO_IDENTITY_DEDUP_V1.md).
- `coordinate_source` y `created_from` son campos validos de procedencia para `spots`; `country_code`, `region_code` y `city_name` solo pueden existir como cache derivado si una migracion futura lo justifica.

### 2.2 `pins`

**Rol:** relación usuario-spot y estado personal.

Columnas reales:

- `id`
- `spot_id`
- `user_id`
- `status`
- `created_at`
- `saved`
- `visited`

Datos observados:

- 225 pins.
- 3 usuarios distintos.
- 222 spots con pin.
- No existe `updated_at`.

Regla vigente:

- `saved`/`visited` son los campos operativos usados por Explore.
- V1 usa estados exclusivos: si `visited=true`, entonces `saved=false`.
- `status` es legacy/compatibilidad y debe derivarse de `saved`/`visited` (`visited` > `saved`).
- Migración propuesta/preparada: `037_pins_status_derived_guard.sql` normaliza writes futuros y rechaza filas sin pin real.
- `pins_select_public` fue removido por migración `033`; lectura directa pública anónima debe devolver `[]`.

### 2.3 `spot_images`

**Rol:** galería pública/compartible de spots.

Columnas reales:

- `id`
- `spot_id`
- `url`
- `storage_bucket`
- `storage_path`
- `width`
- `height`
- `blurhash`
- `thumb_path`
- `version`
- `sort_order`
- `created_at`
- `updated_at`

Datos observados:

- 74 filas tras seed de portadas legacy.
- 74/74 guardan URL pública completa como legacy.
- 74/74 tienen `storage_bucket='spot-covers'` y `storage_path`.

Regla vigente:

- `storage_path` + `storage_bucket` son canon path-first.
- `url` es fallback legacy tolerado para V1.
- No borrar objetos de Storage sin inventario, porque hay objetos no reconciliados.

### 2.4 `spot_personal_images`

**Rol:** fotos privadas/personales por usuario.

Columnas reales:

- `id`
- `spot_id`
- `user_id`
- `storage_path`
- `sort_order`
- `created_at`

Datos observados:

- 0 filas.
- Bucket `spot-personal` existe y es privado.

Regla vigente:

- Owner-only + signed URLs.
- Buen patrón para privacidad por usuario, pero no resuelve privacidad por foto en una galería pública existente.
- `user_id` no muestra FK visible a `auth.users`; evaluar FK no destructiva.

### 2.5 `profiles`

**Rol:** perfil del usuario y preferencias base.

Contrato principal:

- [`PROFILE_AUTH_CONTRACT_CURRENT.md`](PROFILE_AUTH_CONTRACT_CURRENT.md)
- [`PHOTO_SHARING_CONSENT.md`](PHOTO_SHARING_CONSENT.md)

Punto relevante para media:

- Avatar ya sigue patrón sano de path-first (`avatar_storage_path`), a imitar en media pública.
- `share_photos_with_world` define el destino por defecto de uploads de fotos de spot: público (`spot_images`/`spot-covers`) o privado (`spot_personal_images`/`spot-personal`).

### 2.6 `user_tags` y `pin_tags`

**Rol:** taxonomía personal y asignación a lugares/pins.

Contrato principal:

- [`USER_TAGS_EXPLORE.md`](USER_TAGS_EXPLORE.md)

Datos observados:

- `user_tags`: 2.
- `pin_tags`: 38.

Regla vigente:

- Tags son owner-only.
- El filtro y selección múltiple se apoyan en estos datos.
- No convertir tags personales en campos de `spots`.

### 2.7 `feedback`

**Rol:** feedback básico.

Datos observados:

- 0 filas.

Sin implicación para el plan DB/media/geografía V1.

### 2.8 `geo_countries`, `geo_regions`, `geo_cities`

**Rol:** identidad territorial canónica. Países, regiones y ciudades no son `spots`; se leen como metadata activa y se usan para enrutar Search/GeoSheet sin crear lugares duplicados.

Contrato principal:

- [`GEO_IDENTITY_DEDUP_V1.md`](GEO_IDENTITY_DEDUP_V1.md)

Columnas reales mínimas:

- `geo_countries`: `id`, `iso2`, `iso3`, `name_es`, `name_en`, `slug`, `centroid_latitude`, `centroid_longitude`, `bbox`, `source`, `source_updated_at`, `is_active`, `created_at`, `updated_at`.
- `geo_regions`: `id`, `country_id`, `region_code`, `name_es`, `name_en`, `slug`, `region_type`, `centroid_latitude`, `centroid_longitude`, `bbox`, `source`, `source_updated_at`, `is_active`, `created_at`, `updated_at`.
- `geo_cities`: `id`, `country_id`, `region_id`, `official_name`, `name_es`, `name_en`, `slug`, `city_type`, `centroid_latitude`, `centroid_longitude`, `bbox`, `population_bucket`, `source`, `source_updated_at`, `is_active`, `created_at`, `updated_at`.

Datos observados tras seed `041`:

- `geo_countries`: 4 (`MX`, `US`, `CR`, `PA`).
- `geo_regions`: 2 (`MX-ROO`, `MX-YUC`).
- `geo_cities`: 3 (`merida`, `holbox`, `san-jose`).

Regla vigente:

- RLS permite lectura a `anon` y `authenticated` solo cuando `is_active=true`.
- Runtime nativo lee estas tablas desde `lib/geo/search.ts`; si falta env de Supabase o falla la consulta, devuelve `[]`.
- `bbox` se valida antes de encuadrar mapa; si no es válido, se puede usar centroide; si tampoco hay centroide, la UI muestra "Mapa pendiente".
- El seed es deliberadamente pequeño para QA. No asumir cobertura mundial ni búsqueda global completa.
- No usar `supabase db push` hasta reconciliar historial remoto de migraciones; las migraciones `040`-`042` se aplicaron con `npx supabase db query --linked --file ...`.

### 2.9 `geo_aliases` y `geo_external_refs`

**Rol:** recuperación multidioma y reconciliación con proveedores para entidades geo, sin convertir Mapbox ni texto libre en fuente única de verdad.

Columnas reales mínimas:

- `geo_aliases`: `id`, `entity_type`, `entity_id`, `locale`, `name`, `normalized_name`, `source`, `is_primary`, `is_active`, `created_at`, `updated_at`.
- `geo_external_refs`: `id`, `entity_type`, `entity_id`, `provider`, `provider_ref`, `provider_kind`, `confidence`, `source_updated_at`, `is_active`, `created_at`, `updated_at`.

Datos observados tras seed `041`:

- `geo_aliases`: 21.
- `geo_external_refs`: 19.

Regla vigente:

- `entity_type` admite `country|region|city|area`; `area` está reservado para futuro y no tiene tabla activa.
- `entity_id` es polimórfico por diseño; la integridad se controla por tooling/runtime hasta justificar tablas separadas.
- Search nativo usa aliases para scoring local acento-insensible y ordena por score, peso de tipo (`country` > `region` > `city`) y título.
- No crear entidades geo desde query cruda ni desde el primer resultado de proveedor sin selección/seed controlado.

### 2.10 `user_geo_marks`

**Rol:** relación owner-only usuario-entidad geo. Es el equivalente conceptual de `pins`, pero para país/región/ciudad/futura área.

Columnas reales:

- `id`
- `user_id`
- `entity_type`
- `entity_id`
- `saved`
- `visited`
- `created_at`
- `updated_at`

Datos observados tras migración `042`:

- 0 filas iniciales.

Regla vigente:

- Unique `(user_id, entity_type, entity_id)`.
- RLS owner-only para `select/insert/update/delete` con `authenticated`.
- `visited=true` normaliza `saved=false`.
- No se permiten filas sin `saved` ni `visited`.
- `saveUserGeoMark()` hace upsert idempotente; `deleteUserGeoMark()` borra solo la marca del usuario autenticado.
- Guardar o visitar una entidad geo nunca escribe en `spots` ni en `pins`.

---

## 3. Storage actual

| Bucket | Público | Objetos | Tamaño aprox. | Uso |
|---|---:|---:|---:|---|
| `spot-covers` | sí | 81 | post-cleanup huérfanos 2026-04-27 | Portadas y galería pública legacy/path-first |
| `spot-personal` | no | 0 | 0 | Fotos personales privadas |
| `profile-avatars` | sí | 1 | 593 KB | Avatar público por path |

Cruce observado:

- 74 objetos coinciden con `spot_images`.
- 37 objetos coinciden con `spots.cover_image_url`.
- 29 objetos no coinciden con galería ni portada actual.
- 0 objetos quedan como `cover_only` tras seed `036`.

Decisión vigente:

- No limpiar objetos Storage todavía.
- Primero inventariar path, fila origen, spot asociado y edad.
- Supabase Storage sigue siendo proveedor V1.

---

## 4. RLS y privacidad

Estado observado:

- RLS habilitado en tablas públicas críticas.
- `spots_select_public` permite lectura de spots no ocultos.
- `pins_select_public` fue removido por migración `033`.
- `spot_images_select_all` permite lectura pública de galería.
- `spot_personal_images` queda owner-only.

Invariantes V1:

- No exponer `pins` por lectura pública directa.
- `geo_*` expone solo metadata activa; no incluye estado personal.
- `user_geo_marks` es owner-only y no debe alimentar agregados públicos sin contrato explícito.
- No exponer `spot-personal` con URLs públicas.
- No hacer hard delete de spots.
- No cambiar RLS sin SQL de verificación y rollback/mitigación.
- Si se agrega `is_public`, debe ser migración explícita con backfill y decisión de producto; no asumir que ya existe.

---

## 5. Índices y escalabilidad

Índices existentes relevantes:

- `pins_user_spot_unique`
- `idx_pins_visited_spot_id`
- `idx_spots_link_status`
- `idx_spots_linked_place_id`
- `spots_visible_linked_exact_unique_039`
- índices únicos/lookup de `geo_countries`, `geo_regions`, `geo_cities`, `geo_aliases`, `geo_external_refs`
- índices `user_geo_marks_user_idx`, `user_geo_marks_entity_idx`, `user_geo_marks_user_visited_idx`
- `idx_spot_images_spot_id`
- `idx_spot_personal_images_spot_id`
- `idx_spot_personal_images_user_id`
- índices de tags por usuario/slug/tag

Extensiones:

- `pgcrypto`
- `uuid-ossp`

No existen:

- PostGIS
- `pg_trgm`

Recomendación:

- V1 no necesita PostGIS para 312 spots.
- Antes de crecer, agregar índices por acceso real:
  - `spots(user_id, is_hidden)` si se consultan por owner/visibilidad.
  - `spots(updated_at)` o `spots(created_at)` si hay listados recientes.
  - `spot_images(spot_id, sort_order)` para galería ordenada.
  - búsqueda geo server-side/RPC si el seed crece y el filtrado local de `lib/geo/search.ts` deja de ser suficiente.
  - futuros índices de `country_code`, `region_code`, `city_id` solo si esos campos se agregan como cache derivado.

---

## 6. Decisiones para nuevos campos

### 6.1 Qué sí puede vivir en `spots`

Solo campos calientes, estables y necesarios para pintar/filtrar rápido:

- Identidad básica: título, descripción corta/larga.
- Coordenadas.
- Owner y visibilidad base.
- Portada derivada/cache legacy.
- Snapshot mínimo de origen/lugar si se aprueba:
  - `coordinate_source`
  - `created_from`
  - `country_code`
  - `region_code`
  - `city_name`
  - `place_snapshot` o tabla relacionada, pendiente de decisión.

### 6.2 Qué no debe vivir en `spots`

No agregar como columnas directas:

- visa
- transporte
- aeropuertos
- Uber/InDrive/taxi
- lado de conducción
- salud/vacunas/enfermedades
- divisa/dinero ampliado
- clima
- contactos de emergencia
- metadata histórica de APIs
- variantes de imágenes
- privacidad por foto
- tags personales
- acciones masivas o historial

Estos datos deben vivir en tablas relacionadas por país/región/ciudad o por media.

### 6.3 Datos derivados de APIs

Persistir al crear/editar solo snapshot mínimo útil y auditable:

- `linked_place_id`
- `linked_place_kind`
- `linked_maki`
- `mapbox_feature_type`
- `mapbox_bbox` saneado
- `address`
- país/región/ciudad si el origen es confiable

Enriquecer después:

- datos territoriales batch
- contexto de viaje
- thumbnails/blurhash/dimensiones
- alias/canonical names de búsqueda

---

## 7. Modelo vigente para contexto país/región/ciudad

Para V1/web/tiendas, preferir datos duros por lotes y versionados sobre APIs en tiempo real.

Tablas vigentes:

- `geo_countries`
- `geo_regions`
- `geo_cities`
- `geo_aliases`
- `geo_external_refs`
- `user_geo_marks`

Pendiente/no implementado:

- `geo_areas`: reservado por contrato; Holbox vive temporalmente como `geo_cities.city_type='island_town'`.
- `geo_context_entries`: futuro contenido editorial por scope (`country|region|city|area`) para visa/transporte/salud/dinero/clima/emergencias.
- FKs directas desde `spots` a `geo_*`: no existen.
- Passport/progreso geo: no hay agregado público ni cálculo canónico desde `user_geo_marks` todavía.

Principio:

- `spots` referencia o cachea geografía solo cuando una migración futura lo justifique; no define identidad territorial.
- El contexto se consulta por scope territorial cuando la UI lo necesita.
- Clima actual/alertas dinámicas pueden integrarse después por API/cache, no en V1 como dependencia crítica.

---

## 8. OPEN LOOPS

1. **Aplicar/verificar `037_pins_status_derived_guard.sql`.** Cierra drift `pins.status` como legacy derivado.
2. **Storage orphan inventory.** Clasificar 29 objetos no reconciliados antes de limpiar.
3. **Geo fields en `spots`.** Decidir si V1 agrega `country_code`, `region_code`, `city_name`, `coordinate_source`, `created_from`.
4. **`place_snapshot`.** Decidir JSONB en `spots` vs tabla `spot_place_snapshots`.
5. **FK no destructiva para `spot_personal_images.user_id`.** Evaluar impacto RLS.
6. **`is_public`.** Decidir si V1 necesita privacidad explícita de spot o si `is_hidden` basta.
7. **Índices nuevos.** Crear solo con query plan/uso real.
8. **Aliases/canonical names.** Evaluar después de QA de búsqueda si se requiere tabla/campo para recuperación editorial.

---

## 9. Qué NO tocar sin plan aprobado

- No hard delete de spots.
- No eliminar objetos de Storage.
- No cambiar RLS de `spots`, `spot_images`, `spot_personal_images`, `pins` o `user_geo_marks` sin verificación.
- No mover visa/transporte/salud/dinero/clima/emergencias a columnas de `spots`.
- No migrar URLs completas a paths sin compatibilidad legacy.
- No agregar PostGIS o `pg_trgm` como reacción inmediata a problemas V1 sin evidencia de escala.

---

## Referencias

- [`EXPLORE_STABILITY_MEDIA_DB_AUDIT.md`](../ops/EXPLORE_STABILITY_MEDIA_DB_AUDIT.md)
- [`SUPABASE_INTROSPECTION_RESULTS_2026-04-26.md`](../ops/SUPABASE_INTROSPECTION_RESULTS_2026-04-26.md)
- [`OPEN_LOOPS.md`](../ops/OPEN_LOOPS.md)
- [`MAP_FRAMING_UX.md`](MAP_FRAMING_UX.md)
- [`PHOTO_SHARING_CONSENT.md`](PHOTO_SHARING_CONSENT.md)
- [`PROFILE_AUTH_CONTRACT_CURRENT.md`](PROFILE_AUTH_CONTRACT_CURRENT.md)
- [`USER_TAGS_EXPLORE.md`](USER_TAGS_EXPLORE.md)
