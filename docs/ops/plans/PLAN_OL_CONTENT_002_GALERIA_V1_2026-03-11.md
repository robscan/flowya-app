# OL-CONTENT-002 — Galería v1 (scope acotado)

**Fecha:** 2026-03-11  
**Estado:** Plan guardado para ejecución posterior  
**Scope:** Solo galería multi-foto. Seguridad y clima **deprecados/postponed**.

---

## 1. Objetivo

Extender el modelo de **una portada** a **colección ordenada de imágenes** por spot, manteniendo `cover_image_url` como fallback y compatibilidad con el diseño actual.

---

## 2. Modelo de datos

### 2.1 Nueva tabla `spot_images`

| Columna      | Tipo        | Restricciones                                |
| ------------ | ----------- | -------------------------------------------- |
| `id`         | uuid        | PK, default gen_random_uuid()                |
| `spot_id`    | uuid        | FK → spots.id, NOT NULL                      |
| `url`        | text        | NOT NULL (URL pública Supabase Storage)      |
| `sort_order` | int         | NOT NULL, default 0 (orden de visualización) |
| `created_at` | timestamptz | default now()                                |

**Índices:** `spot_id` (búsqueda por spot).

### 2.2 `spots.cover_image_url`

- **Se mantiene.** Es la portada canónica.
- **Regla de derivación:** Si hay filas en `spot_images`, `cover_image_url` = URL de la primera (sort_order ASC).
- **Migración de datos:** Opcional; fallback funciona sin migración.

### 2.3 Límite de imágenes por spot

- **Propuesta:** máx. 8–12 imágenes por spot.

---

## 3. Storage (Supabase)

- **Paths:** `{spotId}/gallery/{uuid}.jpg`. Bucket `spot-covers` existente.
- **Optimización:** Reutilizar `optimizeSpotImage`.

---

## 4. Superficies de UI afectadas

| Superficie | Cambio |
|------------|--------|
| SpotSheet | Hero: grid 2–3 celdas si >1 imagen; tap abre fullscreen. |
| SpotDetail | Mismo patrón. |
| Create Spot | Multi-select imágenes; subir a `spot_images`. |
| Edit Spot | Añadir/quitar/reordenar; sync cover. |

---

## 5. Componentes

- **SpotImageGrid** (nuevo): grid 2–3 celdas, onImagePress.
- **ImageFullscreenModal** (extender): `uris[]`, `initialIndex`, paginación.

---

## 6. Lib / API

- `listSpotImages`, `addSpotImage`, `removeSpotImage`, `reorderSpotImages`, `syncCoverFromFirstImage`.

---

## 7. No-negociables

- Mantener `cover_image_url` como fallback.
- Sin romper fallback actual.

---

## 8. Alcance explícitamente fuera

- Seguridad (país/región): deprecado.
- Clima ("mejor época"): postponed.
- Enrichment externo: no en 002.
