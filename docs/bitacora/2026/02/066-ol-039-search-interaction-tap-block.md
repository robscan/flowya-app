# Bitácora 066 (2026/02) — OL-039: SearchFloating tap block tras cambios de sheet gesture

**Rama:** `chore/explore-quality-2026-02-09`  
**Objetivo:** Restaurar interacción en Search (input, resultados) cuando Search está abierto en `/`.

---

## Diagnóstico

- Tras añadir `GestureHandlerRootView` y SpotSheet con RNGH Pan gesture, al abrir Search los taps no llegaban al input ni a la lista (tap-block / overlay fantasma).
- Causa: SpotSheet se renderiza cuando `selectedSpot != null` y en el árbol va **después** de SearchFloating. Aunque SearchFloating tiene zIndex 15 y SpotSheet 8, el árbol de gesture handler (RNGH) o el orden de hermanos podía hacer que el sheet o su contenedor interceptara eventos cuando Search estaba abierto.

## Fix aplicado (mínimo)

- **MapScreenVNext:** No renderizar SpotSheet cuando Search está abierto.
  - Condición de render: `selectedSpot != null && !searchV2.isOpen`.
  - Así, con Search abierto no hay SpotSheet en el árbol → no hay capa que intercepte taps. Al cerrar Search, SpotSheet vuelve a montarse si hay spot seleccionado.

- Sin tocar SearchFloating, zIndex ni GestureHandlerRootView.

- OPEN_LOOPS: OL-039 DONE (QA: input focus, typing, tap en resultados ok; SpotSheet sigue draggable al cerrar Search).
