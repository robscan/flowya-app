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

_(OL-022 cerrado 2026-02-09: long-press create spot restaurado en vNext map; ver bitácora 051.)_
_(OL-024 cerrado 2026-02-09: modal confirmación long-press + "No volver a mostrar"; ver bitácora 052.)_
_(OL-025 cerrado 2026-02-09: create-spot prefill coords desde query lat/lng; ver bitácora 053.)_
_(OL-026 cerrado 2026-02-09: create-spot respeta cámara mapLng/mapLat/mapZoom desde query; ver bitácora 054.)_
_(OL-028 cerrado 2026-02-09: navegación create-spot sin reload + sin camera jump sin params; ver bitácora 055.)_

### OL-023 — Categorías internas (taxonomy) alimentadas por maki (opcional)

**Estado:** Pendiente. maki documentado como suggested_category e input futuro en docs/contracts/MAPBOX_PLACE_ENRICHMENT.md.

- Categorías internas aún no existen en el producto.
- Cuando se definan, maki puede alimentar sugerencias o mapeo.
