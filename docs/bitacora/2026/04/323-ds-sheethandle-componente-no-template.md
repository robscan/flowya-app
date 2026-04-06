# 323 — SheetHandle en Componentes (taxonomía DS) (OL-WEB-RESPONSIVE-001)

**Fecha:** 2026-04-05  
**Tipo:** Vitrina Design System, TOC, inventario

## Alcance

- **`SheetHandle`** es **componente** (affordance de arrastre para sheets), no plantilla de pantalla.
- **Vitrina:** sección movida del grupo **Templates** al grupo **Componentes**, inmediatamente antes del encabezado «Templates».
- **Ancla:** `ds-sheet` → **`ds-comp-sheet-handle`** (enlaces antiguos a `ds-sheet` deben actualizarse).
- **TOC:** [`components/design-system/ds-toc-nav.tsx`](../../../../components/design-system/ds-toc-nav.tsx) — entrada en Componentes; retirada de Templates.
- **Inventario:** [`docs/ops/analysis/DS_CANON_INVENTORY_2026-04.md`](../../ops/analysis/DS_CANON_INVENTORY_2026-04.md) — capas + matriz `sheet-handle.tsx`.

## Validación

- `npm run typecheck`

## Convención (a partir de esta bitácora)

- Con cada ajuste de producto/DS solicitado: actualizar **bitácora** + **`docs/ops/OPEN_LOOPS.md`** (trazabilidad OL-WEB-RESPONSIVE-001).
