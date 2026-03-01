# 238 — OL-P3-002.A: reconstrucción de sheet de países con contrato canónico

Fecha: 2026-03-01  
Scope: Explore / mapa / sheet países

## Contexto

La sheet de países acumuló parches incrementales (gestos, alturas, header y anclaje de controles), generando drift respecto a SpotSheet y regresiones intermitentes.

## Decisión

Reconstruir desde cero la sheet de países sobre un componente dedicado (`CountriesSheet`) y formalizar un contrato canónico reutilizable para futuras sheets.

## Implementación

- Se creó `components/explorar/CountriesSheet.tsx`.
- Se eliminó de `MapScreenVNext` la lógica inline legacy de países (mediciones manuales del header/body, `PanResponder`, animación local de `translateY`, render embebido de header/lista).
- `MapScreenVNext` ahora orquesta estado y datos; `CountriesSheet` encapsula drag/snap 3 estados, header canónico (`SpotSheetHeader`), sizing content-aware y `onSheetHeightChange` para overlays/controles.
- Se mantuvo el contrato de búsqueda: snapshot al abrir search y restauración de estado de sheet al cerrar search.

## Resultado esperado

- Comportamiento alineado con SpotSheet en `peek/medium/expanded`.
- Header visible y consistente en `peek`.
- Controles del mapa anclados al borde superior del sheet en `peek/medium`.
- Menos riesgo de bugs silenciosos al eliminar duplicación de lógica.

## Documentación

- Nuevo contrato: `docs/contracts/CANONICAL_BOTTOM_SHEET.md`.
- Índice actualizado: `docs/contracts/INDEX.md`.
