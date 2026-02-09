# SEARCH_V2 — Contrato mínimo (Explore vNext)

**Fuentes de verdad:** `docs/definitions/search/SEARCH_V2.md`, `docs/ops/EXPLORAR_VNEXT_UI.md`, `docs/ops/CURRENT_STATE.md`.

---

## 1) Entry/exit del modo búsqueda en Explore vNext

- **Entry:** Usuario abre búsqueda desde BottomDock (pill Buscar) o equivalente; el sheet muestra contenido de búsqueda (`mode="search"`).
- **Exit:** Cerrar búsqueda (botón close en top bar) o selección que lleva a spot/mapa; el sheet puede pasar a `mode="spot"` o colapsar según diseño actual.

_Implementación actual: SearchFloating en MapScreenVNext; controller useSearchControllerV2; setOpen/isOpen._

---

## 2) Persistencia del texto y reglas de limpiar

- **Query:** Persistida en el controller (`query`, `setQuery`). Threshold de caracteres (p.ej. 3) aplicado en controller para ejecutar búsqueda.
- **Clear "x" dentro del input:** Limpia el texto de búsqueda y resultados; en Create Spot paso 1, **selectedPlace se mantiene** (el pin no se quita). _Fuente: definitions/search/SEARCH_V2.md (bitácora 031)._

---

## 3) Guardrails (qué NO hace)

- **No overlay:** Search no se implementa como overlay si rompe scroll/drag o crea espacio blanco; vive dentro del sheet. _Fuente: ops/EXPLORAR_VNEXT_UI._
- **No duplicar DS:** UI de búsqueda usa componentes canónicos del design system; no crear variantes one-off para Search. _Fuente: ops y COMPONENT_LIBRARY_POLICY._
