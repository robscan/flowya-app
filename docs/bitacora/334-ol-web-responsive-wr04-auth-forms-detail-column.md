# Bitácora 334 — OL-WEB-RESPONSIVE-001 · WR-04 (auth + formularios + detalle)

**Fecha:** 2026-04-11

## Contexto

Secuencia del plan [`PLAN_OL_WEB_RESPONSIVE_COMPONENTS_001_2026-03-28.md`](../ops/plans/PLAN_OL_WEB_RESPONSIVE_COMPONENTS_001_2026-03-28.md): tras WR-01–WR-03, **WR-04** cierra auth modal, create/edit spot web y detalle.

## Cambio

- **`contexts/auth-modal.tsx`:** `maxWidth` del panel alineado con `WEB_MODAL_CARD_MAX_WIDTH` (`lib/web-layout.ts`) en lugar de `400` fijo.
- **`app/create-spot/index.web.tsx`:** columna principal web con `maxWidth: WEB_SHEET_MAX_WIDTH`, centrada (`webMainColumn`).
- **`app/spot/edit/[id].web.tsx`:** misma columna en el `KeyboardAvoidingView` que envuelve el formulario.
- **`components/design-system/spot-detail.tsx`:** en web, `contentContainerStyle` del `ScrollView` con `scrollContentWebColumn` (misma referencia 720px que sheets/overlays).

## Criterio de seguimiento

- Sin overflow horizontal en viewports de referencia; barras fijas del wizard siguen ancladas al contenedor acotado.
- **WR-05:** QA multiviewport (mobile / tablet / desktop) y checklist teclado/CTA según plan.
