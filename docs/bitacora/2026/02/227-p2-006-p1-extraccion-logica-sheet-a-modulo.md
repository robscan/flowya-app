# 227 — OL-P2-006 P1: extracción de lógica de sheet a módulo interno

Fecha: 2026-02-28  
Tipo: avance técnico / OL-P2-006 (P1)

## Contexto

Tras validar el sub-scope base (`226`), se continúa P1 con extracción de lógica pura de `SpotSheet` para reducir tamaño/acoplamiento del contenedor.

## Implementación

- Nuevo módulo interno:
  - `components/explorar/spot-sheet/sheet-logic.ts`
- Lógica movida desde `SpotSheet`:
  - `getSheetHeightForState(...)`
  - `resolveNextSheetStateFromGesture(...)`
- `SpotSheet` actualizado para consumir helpers del módulo nuevo.

## Validación

- `npx eslint components/explorar/SpotSheet.tsx components/explorar/spot-sheet/sheet-logic.ts`: OK.
- Sin cambios en contrato externo (`SpotSheetProps`) ni intención de UX.

## Resultado

- P1 avanza con desacople incremental y trazable.
- Próximo paso recomendado: segmentar bloque visual de header/body en subcomponentes internos (mismo archivo o carpeta `spot-sheet/`) conservando props públicas.
