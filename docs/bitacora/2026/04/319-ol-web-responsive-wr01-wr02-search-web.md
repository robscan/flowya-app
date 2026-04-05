# 319 — OL-WEB-RESPONSIVE-001: WR-01 + WR-02 (búsqueda web)

**Fecha:** 2026-04-05  
**Tipo:** Implementación UI/layout web (sin primitives nuevas)

## Contexto

Activación formal del loop **OL-WEB-RESPONSIVE-001** según [PLAN_OL_WEB_RESPONSIVE_COMPONENTS_001_2026-03-28.md](docs/ops/plans/PLAN_OL_WEB_RESPONSIVE_COMPONENTS_001_2026-03-28.md). Primera entrega: **WR-01** (contrato de anchos/viewport) y **WR-02** (superficie de búsqueda web + listados).

## WR-01 — Reglas compartidas

- Nuevo módulo [`lib/web-layout.ts`](lib/web-layout.ts): referencias de viewport (`tabletMin` 768, etc.), `WEB_PANEL_PADDING_H`, `WEB_SEARCH_OVERLAY_MAX_WIDTH` (720 px), helper `webSearchUsesConstrainedPanelWidth`.

## WR-02 — Search web

- [`SearchOverlayWeb.tsx`](components/search/SearchOverlayWeb.tsx): a partir de **768px** de ancho de ventana, el panel de búsqueda se **centra** y limita a **720px** de ancho; por debajo, comportamiento full-width (mobile web).
- [`search-list-card.tsx`](components/design-system/search-list-card.tsx): en **web**, `flexWrap: 'wrap'` en el cluster de chips de ranking para reducir overflow horizontal en viewports estrechos.

## Validación

- `npm run lint`
- `npm run typecheck`

## Estado del loop

Pendientes dentro del mismo OL: sheets (`WR-03`), auth/formularios (`WR-04`), QA multiviewport (`WR-05`) según plan.
