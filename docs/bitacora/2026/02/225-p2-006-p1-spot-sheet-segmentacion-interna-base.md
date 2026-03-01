# 225 — OL-P2-006 P1: segmentación interna base de SpotSheet

Fecha: 2026-02-28  
Tipo: avance técnico / OL-P2-006 (P1)

## Contexto

Se inicia P1 de `OL-P2-006` para reducir complejidad interna de `SpotSheet` sin cambiar contrato externo ni UX.

## Implementación

Archivo afectado:
- `components/explorar/SpotSheet.tsx`

Cambios aplicados (sin cambio funcional):
- Extracción de lógica de estado/gesto a helpers puros:
  - `getSheetHeightForState(...)`
  - `resolveNextSheetStateFromGesture(...)`
- Extracción de contenedor reusable para body:
  - `SheetBodyPanel` (gestiona variante con/ sin scroll).
- Unificación de render de contenido medium/expanded con `renderBodyContent()` para eliminar duplicación estructural.

## Validación

- `npx eslint components/explorar/SpotSheet.tsx`: OK.
- Contrato externo `SpotSheetProps` se mantiene sin cambios.

## Riesgo y control

- Riesgo principal: regresión de render condicional medium/expanded.
- Mitigación: smoke dirigido de sheet (peek/medium/expanded, draft, POI, scroll overflow) antes de marcar P1 como cerrado.
