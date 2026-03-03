# 274 — Follow-up: labels visibles para spots core default en filtros activos

Fecha: 2026-03-02  
Tipo: Follow-up UX/runtime en mapa  
Área: `components/explorar/MapScreenVNext.tsx`

## Contexto

Tras el cierre de la política Sticky Context (bitácora 273), persistía un caso:

- en `Por visitar` / `Visitados`, al seleccionar un spot core en estado `default` (fuera del subconjunto del filtro), los letreros de otros spots podían desaparecer.

## Causa

La visibilidad de labels `default` dependía del gating por zoom.  
En contexto filtrado, el spot core `default` estaba visible por excepción de producto, pero sus labels seguían acoplados al gating normal y podían apagarse.

## Ajuste aplicado

- En mapeo de spots hacia capa Mapbox (`MapScreenVNext -> useMapCore`), se marca `forceVisible=true` también para spots core `default` cuando `pinFilter !== all`.
- Esto alinea círculo + label en contexto de planificación:
  - si el spot core `default` se muestra en filtro activo, su label también se mantiene visible.

## Resultado esperado

- En filtros `saved`/`visited`, los spots core `default` visibles para planificación no pierden label al seleccionar uno.
- Se conserva el objetivo UX: permitir asignación por lote sin perder contexto visual.
