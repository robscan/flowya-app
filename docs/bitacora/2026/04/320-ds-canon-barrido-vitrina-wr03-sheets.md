# 320 — Barrido Design System + WR-03 sheets web (OL-WEB-RESPONSIVE-001)

**Fecha:** 2026-04-05  
**Tipo:** Inventario DS, vitrina web, tokens layout, sheets responsive

## Alcance

1. **Inventario canon:** [`docs/ops/analysis/DS_CANON_INVENTORY_2026-04.md`](../../../ops/analysis/DS_CANON_INVENTORY_2026-04.md) — matriz archivo / barrel / vitrina / runtime + excepciones (SearchSurface vs TagChip).
2. **Vitrina web** [`app/design-system.web.tsx`](../../../../app/design-system.web.tsx): secciones nuevas — Layout WR-01 (`lib/web-layout`), SearchResultCard / ActivitySummary, SheetHandle / SpotCard / CardsShowcase / MapPinFilterMenuOption, ImageFullscreenModal demo.
3. **Tokens:** [`lib/web-layout.ts`](../../../../lib/web-layout.ts) — `WEB_SHEET_MAX_WIDTH`, `WEB_MODAL_CARD_MAX_WIDTH`; modal niveles en CountriesSheet usa constante compartida.
4. **WR-03:** [`SpotSheet.tsx`](../../../../components/explorar/SpotSheet.tsx) y [`CountriesSheet.tsx`](../../../../components/explorar/CountriesSheet.tsx) — en web ≥768px ancho, sheet centrado con ancho máximo 720px (misma referencia que overlay búsqueda).

## Validación

- `npm run lint` (warnings preexistentes en otros archivos)
- `npm run typecheck`

## Siguiente

- Continuar OL-WEB-RESPONSIVE-001: auth modal / create-edit web / QA multiviewport según plan.
