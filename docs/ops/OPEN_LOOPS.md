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

### OL-022 — Long press create spot no dispara en vNext map

**Estado:** Bug registrado. Pendiente diagnóstico y fix.

- En Explore vNext (MapScreenVNext), long press en el mapa no abre flujo de crear spot (sí funciona desde Search CTA).
- Requiere reproducción y corrección para paridad con v0.

---

### OL-023 — Categorías internas (taxonomy) alimentadas por maki (opcional)

**Estado:** Pendiente. maki documentado como suggested_category e input futuro en docs/contracts/MAPBOX_PLACE_ENRICHMENT.md.

- Categorías internas aún no existen en el producto.
- Cuando se definan, maki puede alimentar sugerencias o mapeo.
