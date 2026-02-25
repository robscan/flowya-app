# PR (listo para abrir cuando se indique)

**Estado:** DEPRECATED / ARCHIVED (draft histórico; movido desde `docs/ops/deliverables` el 2026-02-25)

**Rama:** `fix/ol-056-to-ol-061-spot-sheet-search` → `main`

---

## Título

fix(spot|search): OL-056..061 spot sheet state machine + Search UX + contrato

---

## Descripción

Cierra OL-056 a OL-061 en una sola rama. Commits incrementales por OL.

### Cambios

- **OL-056** — Spot selection state machine: 1º tap → Sheet MEDIUM, 2º tap mismo spot → EXPANDED (no navegar). Fix bug “3er spot” invisible (SpotSheet: reset de entrada solo en transición sin spot → con spot).
- **OL-057** — SearchResultCard abre SpotSheet en MEDIUM; confirmado, sin efecto que degrade a peek.
- **OL-058** — SpotSheet padding bottom / safe area en estado collapsed (evita corte visual).
- **OL-059** — Gap entre ítems en “Vistos recientemente” (web + native), tokens Spacing.sm.
- **OL-060** — No mostrar empty states cuando no hay recientes/resultados; secciones “Cercanos” y recientes solo si tienen datos.
- **OL-061** — Contrato `docs/contracts/SPOT_SELECTION_SHEET_SIZING.md`; actualización OPEN_LOOPS, CURRENT_STATE, bitácora 080.

### Docs

- `docs/contracts/SPOT_SELECTION_SHEET_SIZING.md` (nuevo)
- `docs/contracts/INDEX.md`
- `docs/ops/OPEN_LOOPS.md` (cerrados OL-056..061)
- `docs/ops/CURRENT_STATE.md`
- `docs/bitacora/2026/02/080-ol-056-a-ol-061-spot-sheet-search.md`

### Validación

- Web + mobile: 1º tap MEDIUM, 2º tap mismo EXPANDED, tap otro MEDIUM; desde SearchResultCard → MEDIUM; sheet peek sin corte; recientes con gap; sin empty cuando no hay datos.

### Recomendación

- **Incluir en este PR:** todo lo anterior (listo para merge).
- **No incluir / guardrails:** OL-050 (shrink/glitch), OL-053 (drag vs scroll), OL-054 (layering contract), OL-055 (deploy) quedan abiertos; tratar en PRs o sesiones posteriores.
