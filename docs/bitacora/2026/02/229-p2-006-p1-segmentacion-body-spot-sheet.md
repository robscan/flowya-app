# 229 — OL-P2-006 P1: segmentación de body en SpotSheet

Fecha: 2026-02-28  
Tipo: avance técnico / OL-P2-006 (P1)

## Contexto

Tras segmentar header (`228`), se segmenta el bloque body de `SpotSheet` para seguir reduciendo responsabilidades del contenedor.

## Implementación

Archivo afectado:
- `components/explorar/SpotSheet.tsx`

Cambios aplicados:
- Nuevo subcomponente interno `SpotSheetBody`.
- `SpotSheetBody` concentra:
  - render de contenido condicional (POI / draft placing / spot normal),
  - variante medium/expanded,
  - uso de `SheetBodyPanel` con/sin scroll.
- `SpotSheet` principal ahora delega render del body a `SpotSheetBody`.

## Validación

- `npx eslint components/explorar/SpotSheet.tsx components/explorar/spot-sheet/SpotSheetHeader.tsx components/explorar/spot-sheet/sheet-logic.ts`: OK.
- Sin cambios en contrato público de `SpotSheet`.

## Resultado

- P1 avanza con separación de presentación y menor acoplamiento interno.
- Próximo paso: smoke final P1 y cierre operativo si no hay regresiones.
