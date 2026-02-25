# Bitácora 101 (2026/02) — Plan Ajustes Explore: Mapa + Búsqueda

**Fecha:** 2026-02-14

**Objetivo:** Documentar plan maestro de ajustes acordados para mapa y búsqueda en Explorar. Ejecución por micro-scopes con revisión tras cada uno.

---

## 1. Documentos creados/actualizados

| Documento | Acción |
|-----------|--------|
| `docs/ops/plans/PLAN_EXPLORE_AJUSTES_MAP_SEARCH.md` | **Nuevo.** Plan con MS-A a MS-E, riesgos, mitigaciones, DoD. |
| `docs/contracts/CREATE_SPOT_LONG_PRESS.md` | **Nuevo.** Contrato reglas long-press (OL-P0-003). |
| `docs/ops/OPEN_LOOPS.md` | OL-P0-003: añadido plan de ejecución (MS-A). OL-PLAN-EXPLORE: nuevo loop con referencia al plan. |
| `docs/ops/CURRENT_STATE.md` | Añadida referencia al plan documentado (post-P0). |
| `docs/contracts/INDEX.md` | Añadido CREATE_SPOT_LONG_PRESS. |

---

## 2. Micro-scopes documentados

| MS | Título | Riesgo |
|----|--------|--------|
| MS-A | Long-press solo un dedo (OL-P0-003) | Bajo |
| MS-B | Pin visible en Paso 0 | Bajo |
| MS-C | POIs/landmarks en mapa | Medio |
| MS-D | Colores agua y zonas verdes | Bajo |
| MS-E | Búsqueda POIs en sin-resultados | Medio |

---

## 3. Criterio de ejecución

- Un MS por PR.
- Revisión y confirmación usuario tras cada MS antes de continuar.
- Plan prioritario: después de P0 (soft delete, create spot mínimo).
