# 222 — P2-006 P0: extracción de orquestación Search/Selection

Fecha: 2026-02-28  
Tipo: avance técnico / OL-P2-006 (P0)

## Contexto

Primer micro-scope de `OL-P2-006`: reducir acoplamiento en `MapScreenVNext` moviendo lógica pura de orquestación a módulo dedicado, sin cambio funcional.

## Implementación

- Nuevo módulo: `lib/explore/map-screen-orchestration.ts`.
- Funciones extraídas desde `MapScreenVNext`:
  - clasificación de POI/landmark,
  - resolución de match spot<->POI,
  - dedupe y ranking de places,
  - merge de resultados de búsqueda,
  - helpers de id estable y tipo de tap.

- `MapScreenVNext` actualizado para consumir el módulo y mantener mismo comportamiento.

## Validación

- `eslint` sobre archivos tocados: OK.
- Sin cambios de UX intencionales en search/map/sheet.

## Resultado

- P0 de P2-006 **avanza** con reducción de lógica embebida en contenedor principal.
- Próximo scope sugerido: segmentación interna de `SpotSheet` (P1).
