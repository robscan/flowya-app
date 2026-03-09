# Plan: Empty-state con Lugares Populares en Flowya

**Fecha:** 2026-03-08  
**Estado:** Implementado  
**Prioridad:** Alta (Experiencia de búsqueda)  
**Loop:** OL-SEARCHV2-EMPTY-FLOWYA-POPULAR-001

---

## Contexto

- **Plan deprecado:** PLAN_SEARCH_EMPTY_SPOTS_VIEWPORT_ZOOM_THRESHOLD_2026-03-07 — viewport vs radius por zoom. Descartado: más complejidad y queries sin beneficio claro; no conocemos intención de búsqueda.
- **Alternativa:** Reutilizar paradigma de cold-start ("Lugares populares") con datos propios: spots ordenados por visitas en Flowya (pins.visited).
- **Bitácora 289:** "se omite Populares en Flowya por no tener backend agregado en esta fase" — ahora implementado.

---

## Cambios técnicos aplicados

### 1. Backend: RPC Supabase

**Archivo:** [supabase/migrations/016_rpc_get_most_visited_spots.sql](../../supabase/migrations/016_rpc_get_most_visited_spots.sql)

- Función `get_most_visited_spots(p_limit int DEFAULT 10)`
- SECURITY DEFINER para agregar entre usuarios
- Retorna spots ordenados por visit_count (pins.visited = true)
- Índice `idx_pins_visited_spot_id` para rendimiento

### 2. Cliente: módulo de datos

**Archivo:** [lib/search/flowyaPopularSpots.ts](../../lib/search/flowyaPopularSpots.ts)

- `fetchMostVisitedSpots(limit?)` — llama RPC, enriquece con `getPinsForSpots`, retorna `FlowyaPopularSpot[]`
- Retorna `[]` si falla (fail-safe)

### 3. Integración en MapScreenVNext

**Archivo:** [components/explorar/MapScreenVNext.tsx](../../components/explorar/MapScreenVNext.tsx)

- Estado `flowyaPopularSpots`
- useEffect: fetch cuando `all + query vacía + !cold start`
- Sección "Lugares populares en Flowya" en empty-state cuando pocos resultados locales (< 4) y `flowyaPopularSpots.length > 0`

---

## Criterios de aceptación / QA

1. RPC `get_most_visited_spots` devuelve spots ordenados por visit_count descendente.
2. En empty-state (all + query vacía, pocos/ningún resultado local), aparece sección "Lugares populares en Flowya".
3. Si RPC devuelve vacío o falla: fallback a defaultItems actual (defaultSpots + landmarks).
4. Cold-start mantiene semillas (países/lugares populares).
5. Sin regresiones en saved/visited ni en búsquedas con query escrita.

---

## Rollback

- Revertir migración 016 (DROP FUNCTION, DROP INDEX).
- Eliminar `lib/search/flowyaPopularSpots.ts`.
- Revertir cambios en MapScreenVNext (import, state, effect, defaultSectionsForEmpty).
