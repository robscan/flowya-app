# SEARCH_V2 — Contrato mínimo (Explore vNext)

**Fuentes de verdad:**

* `docs/definitions/search/SEARCH_V2.md` (source of truth)
* `docs/contracts/SEARCH_NO_RESULTS_CREATE_CHOOSER.md` (nuevo)
* `docs/ops/CURRENT_STATE.md`

---

## 1) Entry/Exit del modo búsqueda en Explore vNext

* **Entry:** Usuario abre búsqueda desde BottomDock (pill Buscar) o equivalente.
* **Exit:** Cerrar búsqueda (botón close) o selección que lleva a spot/mapa (al seleccionar un item, el mapa centra y el SpotSheet se abre en MEDIUM).

---

## 2) Persistencia del texto y reglas de limpiar

* **Query:** Persistida en `useSearchControllerV2` (`query`, `setQuery`). Threshold de caracteres (p.ej. 3) aplicado en controller para ejecutar búsqueda.
* **Clear "X":** Limpia texto y resultados del controller.

  * En Create Spot paso 1: **selectedPlace se mantiene** (el pin no se quita). (Fuente: defs/search/SEARCH_V2.md + bitácora 031)

---

## 3) Guardrails (qué NO hace)

* **No “auto-crear desde texto”:** Prohibido que un CTA “Crear <query>” dispare geocoding y termine creando una calle homónima o un match textual inesperado.

  * Crear desde Mapbox/place **solo** por selección explícita de un resultado con coordenadas.
  * “Crear spot nuevo” es UGC y usa contexto del mapa (centro del mapa / ubicación), sin resolver texto.
* **“Sin resultados”:** cuando `query >= threshold` y `results.length === 0`, aplicar el contrato `docs/contracts/SEARCH_NO_RESULTS_CREATE_CHOOSER.md`.
* **No duplicar DS:** UI de búsqueda usa componentes canónicos del design system; no crear variantes one-off para Search.

---

## 4) Web vs Native (implementación permitida)

* **Native:** Search vive en sheet/overlay nativo según implementación estable.
* **Web:** Se permite overlay si es **keyboard-safe** y sin espacio blanco/scroll roto.

  * Si se detecta regresión: preferir volver a layout de sheet estable (rollback = revert del PR).

---

## 5) “Sin resultados” (comportamiento canónico)

Cuando `query >= threshold` y `results.length === 0`, el buscador debe seguir el contrato:

* `docs/contracts/SEARCH_NO_RESULTS_CREATE_CHOOSER.md` (nuevo).
