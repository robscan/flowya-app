# 211 — Cierre OL-WOW-F2-002 Ranking explicable (micro-señales)

Fecha: 2026-02-28  
Tipo: cierre operativo / OL-WOW-F2-002

## Contexto
OL-WOW-F2-002: señales discretas del porqué del resultado (`cerca`, `guardado`, `landmark`), sin sobrecargar UI.

## Implementación
- **SearchListCard:** props `distanceText`, `isLandmark`, `pinStatus`; chips contextuales (Por visitar / Visitado) en área de ranking signals.
- **MapScreenVNext:** `formatDistanceKm`, `isPlaceLandmark`; pasa señales a ResultRow en SearchDisplayResults.
- Chips con colores `stateToVisit` / `stateSuccess`; mismo estilo que "Lugar destacado" para jerarquía visual coherente.

## Criterios de aceptación
- [x] Señales discretas de porqué del resultado (cerca, guardado, landmark).
- [x] Sin sobrecargar UI ni romper jerarquía visual.
- [x] QA cualitativa: comprensión del ranking en primera lectura.

## Archivos relevantes
- components/design-system/search-list-card.tsx (distanceText, isLandmark, chips)
- components/explorar/MapScreenVNext.tsx (formatDistanceKm, isPlaceLandmark, renderItem)

## Resultado
- OL-WOW-F2-002 cerrado. Micro-señales operativas en listados de búsqueda y Explore.
