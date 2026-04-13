# 349 — Índice de trazabilidad: PR #130–#139 (2026-04-05 → 2026-04-12)

**Fecha:** 2026-04-12  
**Tipo:** Ops / trazabilidad (mapeo merge GitHub ↔ bitácora y contratos)

Tabla de merges recientes a `main` y su documentación canónica en repo. Los números **#130–#139** son **pull requests de GitHub** (no confundir con entradas antiguas de bitácora `130`–`132` en `docs/bitacora/2026/02/`).

| PR | Fecha merge | Título (resumen) | Documentación en repo |
|----|-------------|------------------|------------------------|
| [#130](https://github.com/robscan/flowya-app/pull/130) | 2026-04-11 | Contratos: runtime responsive Search y Sheets Explore | [`SEARCH_RUNTIME_RULES.md`](../../contracts/explore/SEARCH_RUNTIME_RULES.md), [`EXPLORE_SHEET.md`](../../contracts/EXPLORE_SHEET.md). Detalle § abajo. |
| [#131](https://github.com/robscan/flowya-app/pull/131) | 2026-04-11 | Storage: guardrails escritura `spot-covers` | Migración `supabase/migrations/022_storage_spot_covers_owner_write_guardrails.sql`. Detalle § abajo. |
| [#132](https://github.com/robscan/flowya-app/pull/132) | 2026-04-11 | Explore: reconciliar spot borrado en refresh rápido | Follow-up de [`317`](317-followup-explore-focus-refresh-error-vs-missing.md); ver § abajo. |
| [#133](https://github.com/robscan/flowya-app/pull/133) | 2026-04-11 | ExploreChromeShell, layout chrome, WR-04 | [`331`](331-explore-chrome-shell-ds-unificacion.md) |
| [#134](https://github.com/robscan/flowya-app/pull/134) | 2026-04-11 | Sheet países: etiquetas, listado, sidebar, restauración | [`333`](333-explore-countries-sheet-restore-after-spot-close.md), [`328`](328-countries-sheet-detalle-pais.md) (contexto), [`330`](330-explore-countries-toasts-filtros-layout-ds-cierre.md) (DS relacionado) |
| [#135](https://github.com/robscan/flowya-app/pull/135) | 2026-04-11 | Fix clip sidebar KPI↔lugares | [`337`](337-explore-desktop-sidebar-clip-kpi-lugares-overflow.md) |
| [#136](https://github.com/robscan/flowya-app/pull/136) | 2026-04-12 | Docs WR-05 + bitácora 341 | [`342`](342-merge-pr-136-wr05-docs-rama.md), [`341`](341-rama-feat-wr05-sidebar-transitions.md) |
| [#137](https://github.com/robscan/flowya-app/pull/137) | 2026-04-12 | Sidebar `setPadding`, mini-mapa países, cierre OL-WEB-RESPONSIVE-001 | [`345`](345-ol-web-responsive-cierre-sidebar-mapa-paises-docs.md) |
| [#138](https://github.com/robscan/flowya-app/pull/138) | 2026-04-12 | OL-CONTENT-002: galería web, `spot_images`, cierre OL | [`346`](346-ol-content-002-fase1-spot-images-db-lib.md), [`347`](347-ol-content-002-cierre-web-galeria-paridad-deferida.md) |
| [#139](https://github.com/robscan/flowya-app/pull/139) | 2026-04-12 | Pins sheet, letrero, animación entrada globo | [`348`](348-merge-pr139-explore-pins-sheet-y-globo-entrada.md) |

## PR #130 (solo docs)

- **Archivos:** `docs/contracts/explore/SEARCH_RUNTIME_RULES.md`, `docs/contracts/EXPLORE_SHEET.md`.
- **Propósito:** Alinear contratos con runtime responsive (Search overlay / sheets Explore) tras WR-01/02 y shell unificado.

## PR #131 (Storage)

- **Archivo:** `supabase/migrations/022_storage_spot_covers_owner_write_guardrails.sql`.
- **Propósito:** Políticas de escritura en bucket `spot-covers` para reducir sobrescritura cruzada no autorizada (dueño del spot).

## PR #132 (Explore / foco)

- **Archivo principal:** `components/explorar/MapScreenVNext.tsx`.
- **Propósito:** En refresh por foco rápido, reconciliar correctamente cuando el spot fue **eliminado** en backend (no tratar como error transitorio ni missing genérico de la misma forma). Complementa la línea de [`317`](317-followup-explore-focus-refresh-error-vs-missing.md) y el PR [#123](https://github.com/robscan/flowya-app/pull/123).

## Referencia

- Esta bitácora: `docs/bitacora/2026/04/349-indice-trazabilidad-pr-130-139-2026-04.md`
- **Continuación (PR #140, OL-PRIVACY / OL-SECURITY):** [`352`](352-indice-trazabilidad-pr-140-ol-privacy-ol-security-2026-04.md) → **PR #141–#142:** [`355`](355-indice-trazabilidad-pr-141-142-2026-04.md)
- Estado operativo: [`docs/ops/OPEN_LOOPS.md`](../../ops/OPEN_LOOPS.md)
