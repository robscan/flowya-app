# Plan: OL-SEARCHV2-002 — Optimización API Mapbox con cache híbrida y frescura controlada

Fecha: 2026-03-03  
Estado: Propuesto  
Prioridad: Alta (después de `OL-SEARCHV2-001`)  

## Objetivo

Reducir consumo/costo de APIs externas de búsqueda/geocoding manteniendo calidad de resultados y evitando servir datos obsoletos de forma riesgosa.

## Principios de diseño

1. **SearchV2 como único orquestador** (evitar duplicidad de reglas en pantallas).
2. **Cache-first con revalidación** (no cache eterna).
3. **Fallback progresivo** (consultar externo solo cuando falta información útil).
4. **Observabilidad obligatoria** (sin métricas no hay optimización real).

## Inventario de superficie API (actual)

Fuentes actuales:

1. `searchbox/v1/forward` (`lib/places/searchPlacesPOI.ts`)
2. `searchbox/v1/category/{category}` (`lib/places/searchPlacesCategory.ts`)
3. `search/geocode/v6/forward` (`lib/places/searchPlaces.ts`, `resolvePlaceForCreate`)
4. `search/geocode/v6/reverse` (`lib/mapbox-geocoding.ts`)

Riesgos actuales:

1. Solape de funciones forward (`searchPlaces` vs `resolvePlaceForCreate`).
2. Falta de cache persistente cross-session.
3. Repetición de consultas por viewport/query sin memoria de backend.

## Alcance

### In scope

1. Diseño de cache híbrida (L1 memoria + L2 DB).
2. Reglas de TTL por tipo de dato.
3. Pipeline `stale-while-revalidate`.
4. Consolidación de adapters SearchV2 para reducir rutas redundantes.
5. Métricas de costo/eficacia.

### Out of scope

1. Reemplazo total de Mapbox como proveedor base.
2. Reescritura completa de mapa/estilos.

## Arquitectura propuesta

## 1) Cache por capas

### L1 Runtime cache (cliente)

Uso:

1. Sesión activa, navegación misma pantalla.
2. TTL corto:
   - suggestions/search: 2-5 min
   - empty recommendations: 1-3 min por viewport bucket

Clave sugerida:

- `intent + normalized_query + viewport_bucket + zoom_bucket + pin_filter`

### L2 DB cache (Supabase)

Tablas propuestas:

1. `external_places_cache`
   - `provider` (`mapbox`)
   - `provider_place_id`
   - `name`, `full_name`, `lat`, `lng`, `maki`, `feature_type`, `categories`
   - `first_seen_at`, `last_seen_at`, `expires_at`, `hit_count`
2. `external_query_cache`
   - `provider`
   - `query_hash` + `context_hash` (viewport/intent)
   - `result_place_ids` (array)
   - `created_at`, `expires_at`, `hit_count`

## 2) Frescura y caducidad (anti-datos-viejos)

TTL recomendados:

1. Empty reco/landmarks: 3-7 días
2. POI generales búsqueda: 7-14 días
3. Reverse address snapshot: 30-90 días (si no crítico)

Política:

1. Si `now < expires_at`: servir cache
2. Si `expires_at` vencido:
   - servir stale solo si no hay alternativa y marcar `stale_served=true`
   - disparar refresh async
3. Si refresh falla:
   - mantener stale con límite temporal (grace window)

## 3) Estrategia de consulta

1. `visible landmarks` (costo 0 API) -> prioridad alta
2. L1 cache
3. L2 cache DB
4. API externa (Mapbox)
5. Upsert a cache

## 4) Consolidación de adapters

Acciones:

1. Unificar forward lookups bajo un adapter canónico (evitar doble ruta `searchPlaces`/`resolvePlaceForCreate` cuando sea viable).
2. Mantener `resolveAddress` separado por caso de uso (snapshot de dirección).
3. Remover código no usado tras auditoría.

## 5) Observabilidad/KPIs

Métricas mínimas:

1. `external_api_calls_total` por endpoint
2. `cache_l1_hit_rate`
3. `cache_l2_hit_rate`
4. `stale_served_rate`
5. `results_click_through_rate`
6. `no_results_rate`

Objetivos iniciales:

1. Reducir 30-50% consultas externas por sesión de búsqueda.
2. Mantener o mejorar CTR de recomendaciones.
3. No empeorar `no_results_rate`.

## Riesgos y mitigación

1. Riesgo: datos desactualizados en cache.
   - Mitigación: TTL + SWR + `stale_served` auditado.
2. Riesgo: costos DB suben por escribir demasiado cache.
   - Mitigación: upsert por hash/place_id + límites de write por sesión.
3. Riesgo: complejidad operacional.
   - Mitigación: rollout por etapas con feature flags.
4. Riesgo: términos/licencia del proveedor.
   - Mitigación: revisión legal/ToS antes de ampliar persistencia.

## Plan de ejecución (P0 -> P2)

## P0 (rápido y seguro)

1. Definir contratos de cache + eventos de métrica.
2. Implementar L1 robusta y unificación de claves.
3. Activar logging de consumo por endpoint.

## P1 (valor principal)

1. Crear migraciones para `external_places_cache` y `external_query_cache`.
2. Implementar read-through + write-through en SearchV2.
3. Activar SWR con TTL por tipo.

## P2 (hardening)

1. Limpieza de adapters redundantes.
2. Ajuste fino de TTL/umbrales por métricas reales.
3. Documentar playbook de incidentes (cache stale/API down).

## Criterios de aceptación

1. SearchV2 mantiene resultados relevantes sin regresión UX.
2. Consultas externas por sesión bajan en rango objetivo.
3. Se puede inspeccionar claramente cuándo se sirvió stale.
4. No hay crecimiento descontrolado de cache en DB.

## Referencias

- `docs/contracts/SEARCH_V2.md`
- `docs/contracts/shared/SEARCH_EFFECTS.md`
- `docs/contracts/MAPBOX_PLACE_ENRICHMENT.md`
- `docs/ops/plans/PLAN_SEARCH_V2_POI_FIRST_SAFE_MIGRATION.md`
- `docs/ops/plans/PLAN_POI_TOURISM_DB_SUPABASE_MIGRATION.md`
