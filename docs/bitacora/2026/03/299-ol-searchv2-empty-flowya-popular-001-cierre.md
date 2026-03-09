# 299 — OL-SEARCHV2-EMPTY-FLOWYA-POPULAR-001: cierre formal

**Fecha:** 2026-03-08  
**Tipo:** Cierre

## Objetivo

Empty-state de búsqueda con sección "Lugares populares en Flowya" (spots más visitados). Implementación completa, migración ejecutada en Supabase, smoke validado.

## Evidencia de cierre

- **RPC:** `get_most_visited_spots` (migración 016) aplicada en Supabase, con k-anonymity `HAVING COUNT(*) >= 3`.
- **Cliente:** `lib/search/flowyaPopularSpots.ts`, `fetchMostVisitedSpots`.
- **UI:** MapScreenVNext — sección "Lugares populares en Flowya" en empty-state (all + query vacía, pocos resultados locales).
- **Plan:** `docs/ops/plans/PLAN_SEARCH_EMPTY_FLOWYA_POPULAR_2026-03-08.md`.

## Rollback

Revertir migración 016 (DROP FUNCTION, DROP INDEX); eliminar `flowyaPopularSpots.ts`; revertir cambios en MapScreenVNext.
