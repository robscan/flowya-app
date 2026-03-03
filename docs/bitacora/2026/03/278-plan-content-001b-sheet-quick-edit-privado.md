# 278 — Plan de integración en sheet: quick edit privado (`OL-CONTENT-001.B`)

Fecha: 2026-03-03  
Tipo: Planificación UX/runtime  
Área: `explore/spot-sheet/search`

## Decisión aplicada

Se integra la edición accesible en SpotSheet/Search dentro de `OL-CONTENT-001` con subfases:

- `001.A` foundation privado por usuario.
- `001.B` quick edit en sheet/listado:
  - imagen pública,
  - nota breve privada,
  - “por qué importa” privado.
- `001.C` QA/cierre.

## Guardrail clave

Las notas privadas de diario no deben escribir en `spots.description_short/long` (campos globales del spot); deben persistir en capa user-owned. La imagen de portada sí permanece pública.

## Evidencia documental

- `docs/ops/OPEN_LOOPS.md` actualizado con orden `001.A -> 001.B -> 001.C` antes de batch/tags.
- plan dedicado:
  - `docs/ops/plans/PLAN_OL_CONTENT_001_B_SHEET_QUICK_EDIT_PRIVATE_NOTES_2026-03-03.md`.
