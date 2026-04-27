# SUPABASE_INTROSPECTION_RESULTS_2026-04-26

**Estado:** evidencia recibida desde `Archive 2.zip` y verificada parcialmente con Supabase CLI remoto el 2026-04-26.  
**Uso:** insumo para cerrar `OL-DATA-MODEL-INTROSPECTION-001` y ajustar el plan V1 antes de implementar.

---

## Resumen ejecutivo

La introspección confirma que la base real no debe asumirse desde migraciones ni contratos antiguos. Hay cuatro hallazgos de alta prioridad:

1. **P0 cámara/bbox confirmado:** 18 de 116 `mapbox_bbox` no contienen las coordenadas del spot y apuntan a otros países/ciudades. Ejemplos detectados: spots en Mérida/Panamá/Costa Rica con bbox de Europa, Asia, Nueva Orleans o Colombia. Esto explica reencuadres como “Mérida → Nueva Orleans”.
2. **Riesgo privacidad/release en `pins` resuelto operativamente:** existía policy `pins_select_public` con `USING true`. Hay 225 relaciones de pins de 3 usuarios sobre 222 spots. Se aplicó migración `033_pins_remove_public_select.sql`: lectura directa pública deshabilitada; owner-read queda para `authenticated`; agregados públicos deben ir por RPC k-anónima.
3. **Media pública legacy resuelta como base path-first:** la introspección inicial mostró `spot_images.url` con URL completa y sin `storage_path`. Se aplicó `035_spot_images_path_first_metadata.sql` y luego `036_seed_cover_only_spot_images.sql`; ahora 74/74 filas tienen `storage_bucket='spot-covers'` y `storage_path`, manteniendo `url` como fallback legacy.
4. **Storage no totalmente reconciliado:** inventario posterior muestra `spot-covers` con 103 objetos. Tras seed `036`, no quedan `cover_only`; siguen 29 `orphan_candidate` que no deben borrarse sin revisión.

---

## Conteos

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

`spot_personal_images` sin resultados es esperado con la evidencia actual: la tabla existe, pero está vacía.

Todos los `spots` tienen `user_id`; no hay spots legacy sin owner en la muestra actual. Hay 2 spots ocultos y 310 visibles.

---

## Esquema real relevante

### `spots`

Columnas reales actuales: `id`, `title`, `description_short`, `description_long`, `latitude`, `longitude`, `cover_image_url`, `created_at`, `updated_at`, `address`, `is_hidden`, `user_id`, `link_status`, `link_score`, `linked_place_id`, `linked_place_kind`, `linked_maki`, `linked_at`, `link_version`, `mapbox_feature_type`, `mapbox_bbox`.

No existen aún: `country_code`, `region_code`, `city_name`, `coordinate_source`, `created_from`, `place_snapshot`, `is_public`.

### `pins`

Columnas reales: `id`, `spot_id`, `user_id`, `status`, `created_at`, `saved`, `visited`.

No existe `updated_at`; el SQL operativo fue corregido.

Evidencia 2026-04-26:

- `to_visit`: 69 filas (`saved=true`, `visited=false`).
- `visited`: 156 filas (`saved=false`, `visited=true`).
- No se observaron combinaciones inconsistentes en producción.
- Decisión V1: `saved`/`visited` son fuente de verdad exclusiva; `status` queda como legacy derivado. Migración preparada: `037_pins_status_derived_guard.sql`.

### Media

`spot_images`: `id`, `spot_id`, `url`, `storage_bucket`, `storage_path`, `width`, `height`, `blurhash`, `thumb_path`, `version`, `sort_order`, `created_at`, `updated_at`.  
`spot_personal_images`: `id`, `spot_id`, `user_id`, `storage_path`, `sort_order`, `created_at`.

No existen en tablas actuales: `visibility` en `spot_images`; `width`, `height`, `blurhash`, `thumb_path` existen pero aún no se poblan.

---

## Storage

Buckets:

| Bucket | Público | Objetos | Tamaño aprox. |
|---|---:|---:|---:|
| `spot-covers` | sí | 103 | 67.4 MB aprox. |
| `spot-personal` | no | 0 | 0 |
| `profile-avatars` | sí | 1 | 593 KB |

Observación: `spot-covers` tiene objetos referenciados por galería, portadas legacy y candidatos huérfanos. No borrar; primero revisar inventario.

Cruce adicional por CLI:

- 74 objetos coinciden con filas de `spot_images`.
- 37 objetos coinciden con `spots.cover_image_url`.
- 0 objetos quedan como `cover_only`.
- 29 objetos no coinciden ni con galería ni portada actuales.

---

## Coordenadas y bbox

Resumen recibido:

| Métrica | Valor |
|---|---:|
| coordenadas faltantes | 0 |
| coordenadas inválidas | 0 |
| spots con `mapbox_bbox` | 116 |
| `bbox` array[4] | 0 |
| `bbox` objeto `{west,east,south,north}` | 116 |
| bbox contiene punto | 98 |
| bbox no contiene punto | 18 |

El resultado `array[4] = 0` no es malo por sí mismo: el formato real es objeto JSON `{west,east,north,south}`. El problema es semántico: varios objetos bbox no contienen el punto del spot.

Ejemplos visibles en la muestra:

- `Gran Parque La Pancha` en Mérida tiene bbox en Nueva Orleans.
- Spots de Mérida tienen bbox en Europa.
- Spots de Panamá tienen bbox en Filipinas/España/Alemania.
- `Chiquilá` tiene bbox en Colombia.

Conclusión: el plan P0 debe sanitizar bbox existente y prevenir persistencia futura de bbox incoherente.

---

## RLS / privacidad

Todas las tablas públicas críticas tienen RLS habilitado.

Puntos a revisar antes de V1:

1. `spots_select_public` permite leer spots no ocultos. Falta columna `is_public`; por ahora “no oculto” equivale a público.
2. `pins_select_public` permitía leer todos los pins. Evidencia previa: 225 pins, 3 usuarios distintos, 222 spots con pin. **Acción aplicada:** `033_pins_remove_public_select.sql` elimina esa policy y recrea `pins SELECT own` para `authenticated`.
3. `spot_images_select_all` permite lectura pública de galería, consistente con bucket público, pero depende de consentimiento/copy de fotos públicas.
4. `spot_personal_images` es owner-only y bucket `spot-personal` privado; correcto como base.
5. `spot_personal_images.user_id` no tiene FK visible a `auth.users`, a diferencia de `pin_tags` y `user_tags`. Conviene decidir si agregar FK no destructiva.

---

## Índices y escalabilidad

Índices existentes relevantes:

- `pins_user_spot_unique`
- `idx_pins_visited_spot_id`
- `idx_spots_link_status`
- `idx_spots_linked_place_id`
- `idx_spot_images_spot_id`
- `idx_spot_personal_images_spot_id`
- `idx_spot_personal_images_user_id`
- índices de tags por user/slug/tag

No hay PostGIS ni `pg_trgm`; extensiones instaladas: `pgcrypto`, `uuid-ossp`.

Para V1 no hace falta PostGIS si la escala sigue baja, pero antes de crecer conviene definir índices para:

- `spots(user_id, is_hidden)`
- `spots(created_at/updated_at)` si hay listados frecuentes
- geografía futura por `country_code`, `region_code`, `city_id`
- media por `(spot_id, sort_order)`

---

## Errores de introspección corregidos

1. `spot_personal_images` sin filas: no es error; tabla vacía.
2. `pins.updated_at`: no existe. SQL corregido para ordenar por `p.created_at`.
3. Fences Markdown: el SQL Editor no acepta `````sql` ni `````; ejecutar solo el contenido SQL.
4. `pin_tags.pin_id`: no existe. SQL corregido a `count(distinct spot_id)`.
5. `supabase_migrations.schema_migrations`: no está visible en este ambiente. SQL corregido a descubrimiento por `information_schema.tables`.

---

## Implicaciones para el plan final

### Resolver primero

1. P0 cámara/bbox: sanitize read + write, limpieza/migración no destructiva de bbox incoherentes.
2. Media refresh/picker: corregir flujo UX sin esperar migración mayor.
3. Actualizar `DATA_MODEL_CURRENT.md` con esta evidencia.
4. Inventariar 29 objetos Storage no mapeados antes de cualquier limpieza.

### Mitigación aplicada 2026-04-26

1. Se añadió helper puro `sanitizeCameraBBoxForPoint()` para validar bbox finito y exigir que contenga el punto del spot/lugar.
2. Se añadió resolvedor por título + proximidad para intentar recuperar bbox confiable cuando falta o fue rechazado.
3. `applyExploreCameraForPlace()` y `placeResultFromSpotForCamera()` ignoran bbox incoherentes; si fallan, la cámara vuelve al punto real o a fallback contextual para parques/atracciones sin geometría confiable.
4. Creación desde POI y Edit Spot web solo persisten bbox saneado; al cambiar ubicación se limpia bbox/tipo stale antes de reconstruir metadata.
5. Edit Spot web puede reparar al re-guardar sin mover coordenadas: si el bbox actual falta o no contiene el punto, intenta resolverlo por título + proximidad; si no puede, limpia bbox.
6. Se aplicó `034_spots_invalid_mapbox_bbox_cleanup.sql` en remoto como backfill no destructivo: crea backup RLS y limpia solo `mapbox_bbox`/`mapbox_feature_type` incoherentes.
7. Verificación post-aplicación por SQL Editor: 17 filas respaldadas, 98 bbox restantes, 0 bbox inválidos.
8. Evidencia: bitácoras `380` y `383`; `npm run test:regression`, `npm run typecheck` y `npm run lint` pasan en la rama de trabajo (`lint` con warnings existentes, sin errores).

### Cierre aplicado durante auditoría

1. `033_pins_remove_public_select.sql` aplicada en remoto.
2. Verificación `pg_policies`: `pins_select_public` ya no existe; `pins SELECT own` queda limitado a `authenticated`.
3. Verificación REST anónima: `GET /rest/v1/pins?select=id,spot_id,saved,visited&limit=5` responde `200 []`.
4. RPC pública `get_most_visited_spots` sigue disponible para agregados k-anónimos.

### Después

1. Media canon path-first con compatibilidad legacy.
2. Campos mínimos en `spots`: no agregar contexto territorial pesado.
3. Geo context batch en tablas separadas.
4. Hardening App Store/web: permisos, auth, observabilidad, costos API, builds.
