# Bitácora 080 (2026/02) — OL-056 a OL-061: Spot sheet state machine + Search UX

**Fecha:** 2026-02-11  
**Rama:** `fix/ol-056-to-ol-061-spot-sheet-search`  
**Objetivo:** Cerrar OL-056..061 en una sola rama con commits incrementales; contrato y docs; PR preparado (no abierto).

---

## Resumen

| OL    | Descripción breve | Commit | Pruebas mínimas |
|-------|-------------------|--------|------------------|
| OL-056 | Spot selection state machine; 2º tap → EXPANDED (no navegar); fix 3er spot invisible | `fix(spot): OL-056 spot selection state machine + 3er spot visible` | Web/mobile: 1º tap MEDIUM, 2º tap mismo EXPANDED, tap otro MEDIUM |
| OL-057 | SearchResultCard abre Sheet MEDIUM | `fix(search): OL-057 SearchResultCard opens SpotSheet in MEDIUM` | Web/mobile: tocar card desde búsqueda → sheet MEDIUM |
| OL-058 | SpotSheet padding bottom / safe area en collapsed | `fix(spot): OL-058 SpotSheet padding bottom / safe area en collapsed` | Web/mobile: sheet en peek sin corte inferior |
| OL-059 | Gap entre items “Vistos recientemente” | `fix(search): OL-059 gap entre items Vistos recientemente` | Web/mobile: 2+ recientes con separación visible |
| OL-060 | No mostrar empty cuando no hay recientes/resultados | `fix(search): OL-060 no mostrar empty cuando no hay recientes/resultados` | Web/mobile: sin secciones vacías ni empty states de recientes |
| OL-061 | Contrato SPOT_SELECTION_SHEET_SIZING + OPEN_LOOPS/CURRENT_STATE/bitácora | (incluido en docs del commit final) | Revisión docs |

---

## Cambios por archivo

- **components/explorar/SpotSheet.tsx:** Reset de entrada solo sin-spot→con-spot; spot A→B no resetea (fix 3er spot invisible). Padding bottom con safe area (insets.bottom).
- **components/explorar/MapScreenVNext.tsx:** handlePinClick 2º tap mismo spot → setSheetState('expanded'); handleSelectedPinTap → setSheetState('expanded'). Comentario OL-057 en setOnSelect.
- **components/search/SearchOverlayWeb.tsx:** Gap recientes (recentListWrap); Cercanos solo si defaultItems.length > 0; recientes solo si hay datos, sin empty.
- **components/search/SearchFloatingNative.tsx:** Mismo criterio que web (gap + secciones condicionales).
- **docs/contracts/SPOT_SELECTION_SHEET_SIZING.md:** Nuevo contrato (1º tap MEDIUM, 2º tap mismo EXPANDED, cambio spot MEDIUM, SearchResultCard MEDIUM).
- **docs/contracts/INDEX.md:** Entrada SPOT_SELECTION_SHEET_SIZING.
- **docs/ops/OPEN_LOOPS.md:** Cerrados hoy OL-056..061.
- **docs/ops/CURRENT_STATE.md:** Ahora mismo + historial OL-056..061.

---

## Pruebas ejecutadas (mínimas)

- **OL-056:** 1º tap pin → sheet MEDIUM; 2º tap mismo pin → sheet EXPANDED (no navega); tap otro pin → sheet MEDIUM con nuevo spot; secuencia A→B→C sin sheet invisible.
- **OL-057:** Búsqueda abierta → tocar SearchResultCard → overlay cierra, sheet MEDIUM con spot.
- **OL-058:** Sheet en peek con safe area (simulador/viewport) sin corte inferior.
- **OL-059:** Query 1–2 chars con recientes → gap visible entre cards.
- **OL-060:** Query vacía sin cercanos → no sección Cercanos; pre-search sin recientes → no secciones recientes; query ≥3 sin resultados → CTA Crear visible.

---

## Seguimiento

- PR listo para abrir cuando se indique (título y descripción en PR_DRAFT más abajo o en mensaje de cierre).
- Guardrails: OL-050, OL-053, OL-054, OL-055 siguen abiertos; no incluidos en este PR.
