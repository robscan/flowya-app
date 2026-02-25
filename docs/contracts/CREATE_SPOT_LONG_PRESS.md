# CREATE_SPOT_LONG_PRESS — Contrato

**Estado:** ACTIVE (implementado MS-A)  
**Relación:** OL-P0-003, `docs/ops/plans/PLAN_EXPLORE_AJUSTES_MAP_SEARCH.md`

---

## Reglas canónicas

| Regla | Detalle |
|-------|---------|
| **Trigger único** | Long-press de un solo dedo o mouse; sin arrastre |
| **Tiempo mínimo** | 3000 ms (`LONG_PRESS_MS`) |
| **Umbral arrastre** | Si el puntero se mueve > 10 px, cancelar |
| **Multi-touch** | No iniciar long-press si hay más de un puntero activo |
| **Gestos mapa** | Pan, zoom, pinch no deben activar create spot |

---

## Archivos

- `hooks/useMapCore.ts` — handleMapPointerDown, handleMapPointerMove, handleMapPointerUp
- `lib/map-core/constants.ts` — LONG_PRESS_MS, LONG_PRESS_DRAG_THRESHOLD_PX
