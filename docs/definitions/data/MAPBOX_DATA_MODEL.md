# Datos de lugar (Mapbox) — Qué guardamos y por qué (v0.1)

**Fecha:** 2026-02-07  
**Objetivo:** Si vamos a “aprovechar más datos”, hay que definir **qué** campos se guardan al crear spot para no recalcular y para habilitar futuro (edición, recomendaciones, IA).

---

## 0) Realidad práctica (para alinear expectativas)
- Mapbox Search/Geocoding normalmente te da: nombre, coordenadas, dirección, país/ciudad, y categorías/tipo de lugar.
- Horarios, teléfono, “acepta Apple Pay”, etc. **no están garantizados** en Mapbox (eso suele venir de partners/datasets específicos).  
  → Por eso el modelo debe soportar *enriquecimiento progresivo* con otras fuentes en el futuro.

---

## 1) Dos niveles de data

### A. `spot` (tu entidad)
Lo que Flowya controla: estado (por visitar/visitado), notas, fotos, tags, etc.

### B. `place` (metadata de proveedor)
Lo que viene de Mapbox (o de otra fuente futura). Se guarda como:
- columnas clave (para queries)
- + un `metadata_json` completo (para no perder campos)

---

## 2) Campos recomendados a guardar al crear spot

### Identidad y fuente
- `place_source` (enum): `mapbox`
- `place_id` (string) — id del proveedor
- `place_version` (string opcional) — para migraciones futuras

### Ubicación
- `lng` (float)
- `lat` (float)
- `geohash` (string) o `geometry` (PostGIS si luego quieres)
- `bbox` (json opcional)

### Nombre y tipo
- `title` (string) — editable por el usuario
- `place_name` (string) — nombre original del proveedor
- `place_category` (string) — ej: “Tienda de artículos deportivos”
- `place_subcategory` (string opcional)
- `place_maki` / `icon_key` (string opcional) — para iconografía

### Dirección (guardarla una vez, no reverse geocode en cada open)
- `address_freeform` (string) — “Calle 20 Nte …”
- `address_line1` (string) — calle + número (si existe)
- `postcode` (string)
- `locality` (string) — ciudad/pueblo
- `region` (string) — estado/provincia
- `country` (string)
- `country_code` (string)

### Contexto útil
- `language_hint` (string) — idioma de origen del nombre/dirección
- `external_urls` (json opcional) — web / wikidata / etc si viene

### Raw payload (importantísimo)
- `place_metadata_json` (jsonb) — el payload completo del proveedor

---

## 3) Campos “enriquecibles” (NO bloquear creación si faltan)
- `phone` (string)
- `website` (string)
- `opening_hours` (json)
- `price_level` (int)
- `rating` (float) + `rating_count` (int)
- `payment_methods` (json)

Estos pueden llenarse después vía:
- usuario (edición)
- scraping NO (riesgo/legal)
- integraciones futuras (Foursquare/OTROS)

---

## 4) Recomendación de DB (Supabase)

### Tabla `spots` (mínimo + escalable)
Campos base:
- `id` uuid pk
- `user_id` uuid (RLS)
- `title`
- `status` enum: `to_visit` | `visited`
- `lat`, `lng`
- `address_*` (los de arriba)
- `place_source`, `place_id`
- `place_category`
- `place_metadata_json` jsonb
- `note` text (diario / nota rápida)
- `visited_at` timestamptz (nullable)
- `created_at`, `updated_at`

Indices:
- `(user_id, status)`
- `(user_id, created_at desc)`
- geospatial index si usas PostGIS (futuro)

---

## 5) UX: cómo usar esto en interfaz tipo Apple Maps
- El card del spot puede mostrar:
  - `title`
  - `place_category` (subtítulo)
  - `address_freeform` (si existe)
  - distancia (calculada)
- Y dejar “Diario/Notas” como contenido personal (no “descripción pública”).

