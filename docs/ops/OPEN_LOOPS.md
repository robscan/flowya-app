# OPEN_LOOPS — Flowya (alcance activo)

**Fecha:** 2026-02-09

> Este archivo define el alcance diario del chat.
> El objetivo es **vaciar esta lista** para dar por cerrada la sesión.
> Los loops cerrados NO permanecen aquí.

---

## Loops activos

### OL-021 — Spot edit by section (mini-sheets)

**Estado:** Contrato listo (docs/contracts/SPOT_EDIT_MINI_SHEETS.md). Implementación pendiente.

- Patrón: SpotSheet principal + SubSheet modal (1 nivel max) por sección "Editar".
- MVP secciones: (1) Detalles (tel/web), (2) Categoría + etiquetas.
- Guardrails: keyboard-safe, no overlays frágiles, no multi-stack; cancelar vuelve al sheet anterior.

---

### Cerrados hoy (2026-02-09)

_(OL-022 cerrado 2026-02-09: long-press create spot restaurado en vNext map; ver bitácora 051.)_
_(OL-024 cerrado 2026-02-09: modal confirmación long-press + "No volver a mostrar"; ver bitácora 052.)_
_(OL-025 cerrado 2026-02-09: create-spot prefill coords desde query lat/lng; ver bitácora 053.)_
_(OL-026 cerrado 2026-02-09: create-spot respeta cámara mapLng/mapLat/mapZoom desde query; ver bitácora 054.)_
_(OL-029 cerrado 2026-02-09: contrato Create Spot Inline Sheet en docs/contracts/CREATE_SPOT_INLINE_SHEET.md; ver bitácora 056.)_
_(OL-030 cerrado 2026-02-09: índice canónico de contratos en docs/contracts/INDEX.md; ver bitácora 057.)_
_(OL-031 cerrado 2026-02-09: open loops hygiene + current state alignment; ver bitácora 058.)_
_(OL-037 cerrado 2026-02-09: motion spec para ExploreSheet en docs/contracts/MOTION_SHEET.md; ver bitácora 062.)_
_(OL-044 cerrado 2026-02-09: drag handle affordance en ExploreSheet/SpotSheet/SearchFloating; DS SheetHandle; ver bitácora 063.)_
_(OL-036 cerrado 2026-02-09: drag + snap 3 estados (collapsed/medium/expanded) SpotSheet según MOTION_SHEET; ver bitácora 064.)_
_(OL-046 cerrado 2026-02-09: collapsed anchor content-aware (medida dragArea); ver bitácora 065.)_
_(OL-039 cerrado 2026-02-09: Search tap-block; no renderizar SpotSheet cuando search abierto; ver bitácora 066.)_

### OL-028 — No reload + no camera jump (DEFERRED)

**Estado:** Revertido. No prioritario; creación será inline sheet + control por capas; no se retomará esta ruta por ahora.

- Intento: router.push con params object (SPA) + quitar tryCenterOnUser cuando sin params. Pruebas V1/V2/V3 fallaron.

### OL-023 — Categorías internas (taxonomy) alimentadas por maki (opcional)

**Estado:** Pendiente. maki documentado como suggested_category e input futuro en docs/contracts/MAPBOX_PLACE_ENRICHMENT.md.

- Categorías internas aún no existen en el producto.
- Cuando se definan, maki puede alimentar sugerencias o mapeo.
