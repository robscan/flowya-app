# 228 — OL-P2-006 P1: segmentación de header en SpotSheet

Fecha: 2026-02-28  
Tipo: avance técnico / OL-P2-006 (P1)

## Contexto

Continuación de P1 tras `227`: se segmenta la capa visual del header para reducir tamaño de `SpotSheet` sin cambiar API pública.

## Implementación

- Nuevo subcomponente interno:
  - `components/explorar/spot-sheet/SpotSheetHeader.tsx`
- `SpotSheet` ahora delega el render de:
  - handle,
  - controles laterales (share/back/close),
  - título y badge draft,
  - callbacks de layout (`onDragAreaLayout`, `onHeaderLayout`).
- Se mantiene la misma lógica de cierre para draft (confirm modal) y spot normal.

## Validación

- `npx eslint components/explorar/SpotSheet.tsx components/explorar/spot-sheet/SpotSheetHeader.tsx components/explorar/spot-sheet/sheet-logic.ts`: OK.
- Sin cambios en `SpotSheetProps` ni en contratos de interacción.

## Resultado

- `SpotSheet` reduce responsabilidad de presentación en bloque header.
- P1 avanza con segmentación incremental y sin cambios UX intencionales.
