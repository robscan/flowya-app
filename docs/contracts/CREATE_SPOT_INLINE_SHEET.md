# CREATE_SPOT_INLINE_SHEET — Contrato (creación inline sobre mapa)

**Fuentes de verdad:** docs/ops/*, docs/contracts/*. Contrato canónico para la creación futura como **inline sheet** sobre el mapa; control por capas. No implementación hoy.

**Relación:** [EXPLORE_SHEET.md](EXPLORE_SHEET.md) (un solo sheet, modos), [SPOT_EDIT_MINI_SHEETS.md](SPOT_EDIT_MINI_SHEETS.md) (patrón edición por sección, OL-021).

---

## A) Purpose / Scope

- Crear spot **desde el mapa** en un sheet que se abre sobre Explore (inline), sin navegar a pantalla full-screen.
- MVP: formulario mínimo en sheet; resultado = spot creado y ExploreSheet en modo spot mostrando el nuevo spot.
- No reemplaza el wizard actual de create-spot hasta que se implemente; este contrato fija el diseño acordado.

---

## B) Entry points

- **Long-press con coords:** Usuario hace long-press en el mapa; se abren confirmación (si aplica) y luego el inline sheet con coords prefilled (lat/lng del punto).
- **CTA “Crear spot” sin coords:** Desde búsqueda u otro CTA sin posición; el sheet abre y debe pedir al usuario **elegir ubicación en el mapa** (tap o similar) antes de habilitar guardado.

---

## C) Estados

- **`closed`** — Sheet no visible; mapa/ExploreSheet en estado previo.
- **`open_min`** — Sheet abierto en modo MVP: campos mínimos visibles (name, visited opcional, description_short colapsado si aplica).
- **`open_more`** — (Opcional) Sheet con más campos o secciones expandidas; solo si cabe sin inventar UI. Si no se define aún, no implementar.

---

## D) Campos MVP

- **`name`** — Requerido. Título del spot.
- **`visited`** — Opcional; toggle (ej. “Ya lo visité”). Puede mapear a pin state o atributo del spot según modelo.
- **`description_short`** — Opcional; colapsado por defecto; solo si el usuario quiere ampliar.

Coords (lat/lng) vienen del entry point (long-press o selección en mapa). No se piden en el formulario; se obtienen del contexto.

---

## E) Acciones

- **Save:** Crea spot mínimo con los datos del formulario + coords; cierra el inline sheet y abre ExploreSheet en `mode="spot"` (medium) mostrando el nuevo spot.
- **Cancel:** Cierra el inline sheet y vuelve al estado anterior (search sheet o spot sheet) **sin perder contexto** (misma búsqueda, mismo spot seleccionado si había).

---

## F) Resultado al guardar

- Se crea el spot (insert mínimo en backend).
- ExploreSheet pasa a `mode="spot"` con el nuevo spot seleccionado, estado **medium**.
- El mapa puede recentrar en el nuevo pin según decisión de producto (no obligatorio en contrato).

---

## G) Layers / Visibility

- **Regla:** Un solo sheet activo a la vez; sin multi-stack.
- Al abrir el Create Spot Inline Sheet:
  - Se oculta o se desactiva lo que compita por foco: controles de mapa que queden debajo, search UI abierta, etc., según implementación (capas).
- No se inventa UI de capas aquí; solo se establece que la visibilidad se controla por capas y que solo un sheet está activo.

---

## H) Guardrails

- **Keyboard-safe:** Con teclado abierto, el sheet se ajusta; contenido no tapado.
- **Sin overlays frágiles:** Sheet estable (scroll/drag predecible).
- **No multi-stack:** Un solo nivel de sheet de creación; cancelar/save cierra y vuelve al contexto previo.
- **No dependencia de datos “vivos”:** Mapbox enrichment (maki, address, etc.) es snapshot en creación; no re-sincronización posterior. Ver [MAPBOX_PLACE_ENRICHMENT.md](MAPBOX_PLACE_ENRICHMENT.md).

---

## I) Open loops

- **Categorías internas:** Aún no existen; maki solo como sugerencia. Ver OL-023 y [MAPBOX_PLACE_ENRICHMENT.md](MAPBOX_PLACE_ENRICHMENT.md).
- **Edición post-creación:** El patrón de edición por sección (mini-sheets) queda definido en OL-021 y [SPOT_EDIT_MINI_SHEETS.md](SPOT_EDIT_MINI_SHEETS.md); el spot recién creado podrá editarse con ese patrón cuando se implemente.
