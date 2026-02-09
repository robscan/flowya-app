# EXPLORE_SHEET — Contrato mínimo (Explore vNext)

**Fuentes de verdad:** `docs/ops/EXPLORAR_VNEXT_UI.md`, `docs/definitions/contracts/EXPLORE_SHEET.MD`, `docs/ops/CURRENT_STATE.md`.

---

## 1) Estados del sheet (3)

- **`collapsed`** — Barra plegada. En `mode="spot"`: solo header (share + título + cerrar). En `mode="search"`: top bar (input + close en una línea).
- **`medium`** — Altura ajustable; contenido visible + scroll donde aplique.
- **`expanded`** — Altura ajustable mayor; scroll sin doble scroll ni contenido encimado.

Un solo contenedor: **ExploreSheet**.

---

## 2) Modos

- **`mode="search"`** — Contenido de búsqueda (top bar + lista).
- **`mode="spot"`** — Contenido de spot (header + resumen/acciones en medium, más completo en expanded).

---

## 3) Reglas de interacción (solo las definidas en ops/definitions)

- **Pan/zoom del mapa:** con `mode="spot"`, el sheet colapsa a header (sin cambiar el spot seleccionado). _Fuente: EXPLORAR_VNEXT_UI, definitions/EXPLORE_SHEET._
- **Animaciones/drag:** "safe by default"; si hay riesgo de regresión, se prioriza estabilidad. _Fuente: EXPLORAR_VNEXT_UI._
- **Search NO como overlay:** si el overlay rompe scroll/drag o crea espacio blanco, Search no se implementa como overlay. _Fuente: EXPLORAR_VNEXT_UI; alineado con decisión Search dentro del sheet._
- **Keyboard-safe:** con teclado abierto, lista visible y no tapada (safe-area + keyboard). _Fuente: definitions/EXPLORE_SHEET._

> **OPEN LOOP (no inventar):** Reglas detalladas de drag (p.ej. umbrales por estado) no están escritas en ops como contrato; cualquier extensión debe documentarse en ops primero.

---

## 4) Componentes que poseen el estado

- **ExploreSheet** — Contenedor único con `state` y `mode`.
- **MapScreenVNext** — Pantalla Explore vNext (ruta `/`); compone MapCore, filtros, SpotSheet, BottomDock, SearchFloating. _Fuente: CURRENT_STATE, bitácora 047._
- **SearchV2** — Controller y UI de búsqueda (useSearchControllerV2, SearchFloating); integrado en el flujo del sheet, no como overlay independiente.

---

## 5) Principio "no overlay"

Search vive dentro del sheet como `mode="search"`; no hay overlay de búsqueda que genere glitches de scroll/drag ni espacio blanco en swipes. _Fuente: EXPLORAR_VNEXT_UI, definitions/EXPLORE_SHEET._
