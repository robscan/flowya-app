# Plan: POI turístico — datos en DB + migración Supabase

**Estado:** Documentado para ejecutar después (no ejecutar ahora).  
**Prioridad:** Alta (base de datos para turismo).  
**Última actualización:** 2026-02-25

> Objetivo: incorporar metadata turística de POI (incluyendo `maki` y categorías) al modelo de `spots`, con migración segura en Supabase y sin romper flujos actuales.

---

## 1. Objetivo

- Persistir señales turísticas desde Mapbox (y futuras fuentes) en `spots`.
- Dejar lista la base para filtros/ranking turístico y enriquecimiento posterior.
- Mantener compatibilidad con datos actuales (campos nuevos opcionales, backfill progresivo).

---

## 2. Propuesta de datos (MVP)

Agregar en `public.spots`:

- `poi_source text null`  
  Ej: `mapbox`, `wikidata`, `manual`.
- `poi_source_id text null`  
  ID externo del proveedor (ej. mapbox place id).
- `poi_maki text null`  
  Señal cruda Mapbox.
- `poi_categories text[] null`  
  Categorías normalizadas mínimas (tokens).
- `tourism_class text null`  
  Clasificación interna inicial (`attraction`, `nature`, `culture`, `heritage`, `viewpoint`, `other`).
- `is_tourism_poi boolean not null default false`  
  Flag operativo para filtros.
- `poi_raw jsonb null`  
  Snapshot técnico de campos de proveedor relevantes.

Índices recomendados:

- `idx_spots_is_tourism_poi` sobre `(is_tourism_poi)`.
- `idx_spots_tourism_class` sobre `(tourism_class)`.
- `idx_spots_poi_source_id` sobre `(poi_source, poi_source_id)`.
- GIN para `poi_categories` si se usan filtros por categorías.

---

## 3. Estrategia de migración

### Fase A — SQL schema

1. Nueva migración en `supabase/migrations/` para columnas + defaults + índices.
2. `CHECK` opcional para `tourism_class` (lista controlada).
3. Mantener todos los campos nuevos como retrocompatibles.

### Fase B — adaptación app

1. Actualizar tipos TS de `Spot` y mappers de lectura/escritura.
2. Al crear desde POI, guardar `poi_source`, `poi_source_id`, `poi_maki`, `poi_categories`, `is_tourism_poi`.
3. No bloquear creación si faltan categorías/maki.

### Fase C — backfill mínimo

1. Script SQL o job para marcar `is_tourism_poi` en spots con `mapbox_place_id` existente + señales compatibles.
2. Backfill incremental (por lotes) con bitácora.

---

## 4. Reglas de normalización

- `maki` se guarda crudo en `poi_maki`.
- `poi_categories` usa tokens internos estables (sin acoplar UI al nombre de proveedor).
- `tourism_class` se deriva por mapping determinista (`maki/category -> class`).
- Si no hay certeza, usar `tourism_class='other'` e `is_tourism_poi=false`.

---

## 5. Riesgos y mitigación

- Riesgo: taxonomía prematura.  
  Mitigación: MVP corto (6 clases) y mapping versionado.
- Riesgo: datos incompletos en proveedor.  
  Mitigación: campos opcionales + fallback seguro.
- Riesgo: regresión en create/edit.  
  Mitigación: no volver obligatorios los campos nuevos.

---

## 6. DoD / AC

- [ ] Migración Supabase creada y aplicada sin romper tablas actuales.
- [ ] Tipos y mappers app actualizados con campos nuevos.
- [ ] Create-from-POI persiste `maki` + categorías + clase turística cuando exista data.
- [ ] Backfill mínimo ejecutado o planificado por lotes con evidencia.
- [ ] Contratos/documentación actualizados (`MAPBOX_PLACE_ENRICHMENT`, `DATA_MODEL_CURRENT`).
- [ ] Bitácora de cierre.

---

## 7. Referencias

- `docs/contracts/MAPBOX_PLACE_ENRICHMENT.md`
- `docs/contracts/DATA_MODEL_CURRENT.md`
- `docs/contracts/SEARCH_NO_RESULTS_CREATE_CHOOSER.md`
- `docs/definitions/search/SEARCH_INTENTS_RANKING.md`
