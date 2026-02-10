# Bitácora 056 (2026/02) — OL-029: Contract Create Spot Inline Sheet (docs-only)

**Rama:** `chore/explore-quality-2026-02-09`  
**Objetivo:** Documentar contrato canónico para “Create Spot Inline Sheet” (creación futura como sheet sobre el mapa; sin implementación hoy).

---

## 1) Contexto

- Decisión: la creación futura será **inline sheet** sobre el mapa, con control por capas; no se invierte en mejoras de cámara/reload en la ruta actual (OL-028 revertido/DEFERRED).
- Ya existen docs/contracts/EXPLORE_SHEET.md (un solo sheet, modos search/spot) y docs/contracts/SPOT_EDIT_MINI_SHEETS.md (edición por sección, OL-021).

---

## 2) Decisiones en el contrato

- **Entry points:** long-press con coords (prefill) y CTA “Crear spot” sin coords (elegir en mapa).
- **Estados:** closed, open_min (MVP), open_more (opcional).
- **Campos MVP:** name (required), visited (optional toggle), description_short (optional, colapsado).
- **Acciones:** Save (crea spot mínimo y abre ExploreSheet mode=spot en el nuevo) y Cancel (vuelve sin perder contexto).
- **Capas:** Un solo sheet activo; al abrir create inline se oculta/desactiva lo que compita (controles, search UI); sin inventar UI de capas, solo regla.
- **Guardrails:** keyboard-safe, sin overlays frágiles, no multi-stack, datos Mapbox como snapshot (no vivos).

---

## 3) Relación con otros contratos

- **ExploreSheet:** El resultado al guardar abre ExploreSheet en `mode="spot"` (medium) con el nuevo spot.
- **Spot edit mini-sheets (OL-021):** Patrón de edición por sección referenciado para editar el spot después de creado.
- **Mapbox enrichment:** maki y categorías internas como open loops; solo sugerencia/snapshot.

---

## 4) Entregable

- docs/contracts/CREATE_SPOT_INLINE_SHEET.md creado con secciones Purpose, Entry points, Estados, Campos MVP, Acciones, Resultado al guardar, Layers/Visibility, Guardrails, Open loops.
- OPEN_LOOPS: OL-029 marcado DONE (docs-only); link al contract.
