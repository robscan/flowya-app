# CHECKLIST_QA_F3_003_OBSERVABILIDAD_MINIMA

**Fecha:** 2026-02-28  
**Objetivo:** validar que la observabilidad mínima de decisiones UX funciona sin sobreinstrumentación.

---

## Eventos a validar

1. `explore_decision_started`
- Se registra al iniciar búsqueda con query >= 3 (source `search`).
- Se registra al iniciar selección desde mapa (source `map`).

2. `explore_selection_changed`
- `selected` al seleccionar `spot` o `poi`.
- `cleared` al cerrar sheet y limpiar selección.

3. `explore_decision_completed`
- `saved` al marcar Por visitar.
- `visited` al marcar Visitado.
- `dismissed` al cerrar sheet o quitar pin visitado.
- `opened_detail` al abrir detalle del spot.

---

## Verificaciones técnicas

- Snapshot global disponible en `globalThis.__flowyaExploreDecisionMetrics`.
- `elapsedMs` se calcula sin errores cuando hay `started` previo.
- Sin errores de runtime ni warnings nuevos en consola.
- Sin degradación visible en interacción de mapa/search/sheet.

---

## Criterio de pase

- Todos los eventos clave aparecen con payload válido.
- No se detecta sobrecosto perceptible en recorridos base.
- Evidencia registrada en bitácora de cierre F3-003.
