# Bitácora 083 (2026/02) — Fase 0 Análisis crítico Explorar

## Resumen

- Ejecutada Fase 0 del plan PLAN_EXPLORE_V1_STRANGLER.md.
- Entry principal: `app/(tabs)/index.web.tsx` → MapScreenVNext; native es placeholder.
- Map core: `lib/map-core/constants.ts` + `hooks/useMapCore.ts`; MapCoreView presentacional.
- Search: overlay web (SearchOverlayWeb), sheet native; useSearchControllerV2 + spotsStrategy.
- Create spot: long-press → /create-spot; sin resultados → draft inline en SpotSheet.
- Soft delete: is_hidden en queries y mutación; columna posiblemente fuera de migraciones explícitas.
- Estado: useState en MapScreenVNext; sin zustand; duplicación selectedSpot/spots/bbox.
- Bugs priorizados: P0 teclado mobile, P1 soft delete inconsistente, P2 create spot (resuelto user_id; pendiente resolvePlaceForCreate).
- Radix/shadcn: modales y sheet actuales son React Native Modal/Reanimated; V3 usará primitives.
- Extraction map: core/shared/search, core/shared/visibility-softdelete, core/explore.
- Legacy: MapScreenV0, mapaV0, getPinsForSpotsLegacy candidatos a borrar con V3.
- No blockers for Phase 1 contracts.
