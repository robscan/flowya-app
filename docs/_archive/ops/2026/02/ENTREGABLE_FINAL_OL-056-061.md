# Entregable final — OL-056 a OL-061 + QA + estilo

**Estado:** DEPRECATED / ARCHIVED (entregable histórico; movido desde `docs/ops/deliverables` el 2026-02-25)

**Fecha:** 2026-02-11  
**Rama:** `fix/ol-056-to-ol-061-spot-sheet-search`

---

## 1) Plan numerado + ejecución completa

| OL | Objetivo | Estado |
|----|----------|--------|
| **OL-056** | Spot selection state machine: 1º tap MEDIUM, 2º tap mismo spot EXPANDED (no navegar); fix 3er spot invisible | Hecho (commit) |
| **OL-057** | SearchResultCard abre Sheet MEDIUM; no degradar a peek | Hecho (commit + fix QA en working copy) |
| **OL-058** | Sheet collapsed: padding bottom + safe area; sheet “un poco más arriba” | Hecho (commit + fix QA en working copy) |
| **OL-059** | Gap entre items “Vistos recientemente” | Hecho (commit) |
| **OL-060** | No mostrar empty cuando no hay recientes/resultados | Hecho (commit) |
| **OL-061** | Contrato SPOT_SELECTION_SHEET_SIZING + OPEN_LOOPS, CURRENT_STATE, bitácora | Hecho (commit) |

**Extras post-QA (en working copy, sin commit):**
- OL-057: ref + `useEffect` para forzar MEDIUM al abrir desde búsqueda (evita sheet colapsado en primer paint).
- OL-058: `bottomOffset` para subir sheet colapsado; `paddingBottom` aumentado (24 + insets).
- **Estilo pill:** Filtros (Todos/Guardados/Visitados) y botones (Guardar, Visitado, Cómo llegar, Editar) + `Radius.pill` en theme y DS (buttons, DESIGN_SYSTEM_USAGE).

---

## 2) Commits incrementales por OL

```
a3cf1ab chore: PR draft OL-056..061 (título + descripción; no abrir hasta indicar)
3204b2e docs: OL-061 contrato Spot selection → Sheet sizing + OPEN_LOOPS/CURRENT_STATE/bitácora
f617f1b fix(search): OL-060 no mostrar empty cuando no hay recientes/resultados
e8c0399 fix(search): OL-059 gap entre items Vistos recientemente
71dc818 fix(spot): OL-058 SpotSheet padding bottom / safe area en collapsed
b882b6a fix(search): OL-057 SearchResultCard opens SpotSheet in MEDIUM
dca4dda fix(spot): OL-056 spot selection state machine + 3er spot visible
```

**Pendiente de commit (recomendado):**
- 1 commit: `fix(spot|search): QA OL-057 sheet MEDIUM desde search + OL-058 sheet más arriba y padding`
- 1 commit: `style(ui): pill para filtros y botones + Radius.pill en theme y DS`

---

## 3) Docs actualizados

| Doc | Contenido |
|-----|-----------|
| **docs/contracts/SPOT_SELECTION_SHEET_SIZING.md** | Nuevo: 1º tap MEDIUM, 2º tap mismo EXPANDED, cambio spot MEDIUM, SearchResultCard MEDIUM. |
| **docs/contracts/INDEX.md** | Entrada del nuevo contrato. |
| **docs/contracts/DESIGN_SYSTEM_USAGE.md** | Uso de `Radius.pill` para chips/filtros (actualizado con cambios de estilo). |
| **docs/ops/OPEN_LOOPS.md** | Sección “Cerrados hoy (OL-056..061)” con notas. |
| **docs/ops/CURRENT_STATE.md** | “Ahora mismo” + historial OL-056..061. |
| **docs/bitacora/2026/02/080-ol-056-a-ol-061-spot-sheet-search.md** | Resumen por OL, commits, pruebas. |
| **docs/_archive/ops/2026/02/PR_DRAFT_ol-056-061.md** | Título y descripción listos para abrir PR. |

---

## 4) Recomendación final

### Qué SÍ alcanza para un PR (hoy)

- **Rama única** con todo lo anterior (tras commitear los fixes de QA y el estilo pill):
  - OL-056..061 completos.
  - Fixes QA: sheet MEDIUM desde búsqueda (OL-057), sheet colapsado más arriba y más padding (OL-058).
  - Estilo pill: filtros mapa + botones del sheet + `Radius.pill` en theme y DS.
- **Título sugerido:** `fix(spot|search): OL-056..061 spot sheet state machine + Search UX + QA + estilo pill`
- **Descripción:** Usar la de `PR_DRAFT_ol-056-061.md` y añadir: “QA: OL-057 sheet MEDIUM desde search; OL-058 sheet más arriba y padding. Estilo: filtros y botones pill (Radius.pill), DS actualizado.”

### Qué NO (guardrails)

- **No incluir en este PR:** OL-050 (shrink/glitch), OL-053 (drag vs scroll), OL-054 (layering contract), OL-055 (deploy). Tratarlos en PRs o sesiones aparte.
- **No abrir PR** hasta que decidas; el draft está en `docs/_archive/ops/2026/02/PR_DRAFT_ol-056-061.md`.
- **Regla de commits:** Incluir en el mismo commit todos los archivos de un mismo cambio lógico (p. ej. QA OL-057/058 juntos; estilo pill en otro).

---

## Checklist pre-push (regla commits-completos)

- [ ] Cambios de QA (MapScreenVNext, SpotSheet) en un commit con mensaje claro.
- [ ] Cambios de estilo (theme, map-pin-filter, SpotSheet, buttons, DESIGN_SYSTEM_USAGE) en otro commit.
- [ ] `git status` sin archivos del mismo cambio lógico fuera del commit.
