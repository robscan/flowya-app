# SPOT_SELECTION_SHEET_SIZING — Contrato (Spot selection → Sheet sizing)

**Última actualización:** 2026-02-11  
**Owner:** Explore vNext  
**Status:** ACTIVE (source of truth)

> Fuente de verdad para el comportamiento del SpotSheet según cómo se selecciona el spot.
> Referencias: [EXPLORE_SHEET.md](EXPLORE_SHEET.md), [MOTION_SHEET.md](MOTION_SHEET.md).

---

## Reglas (state machine)

| Entrada | Resultado |
|--------|-----------|
| **1º tap** en un spot (pin en mapa) | Spot seleccionado + **Sheet MEDIUM** |
| **2º tap** en el **mismo** spot (pin o hit area) | **Sheet EXPANDED** (LARGE); no navega |
| **Tap en otro spot** | Nuevo spot seleccionado + **Sheet MEDIUM** |
| **Tap en SearchResultCard** (desde búsqueda) | Spot seleccionado + mapa centra + **Sheet MEDIUM** |
| **onClose** (botón cerrar en sheet) | Spot = null, sheet se desmonta |

## Navegación a detalle

- La navegación a `/spot/[id]` (pantalla de detalle) se hace **solo** desde un CTA explícito dentro del sheet (p. ej. `onOpenDetail` / “Ver detalle”), no desde el 2º tap en el pin.
- Si no existe definición de CTA en DS/contratos, se deja como OPEN LOOP (no inventar UI).

## Pan/zoom del mapa

- Al **pan/zoom** del mapa con spot seleccionado: sheet colapsa a **peek** (collapsed), sin cambiar el spot seleccionado. Ver EXPLORE_SHEET.md.
