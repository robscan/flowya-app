# 327 — SearchListCard: tres filas (título+chevron, contenido, meta) (OL-WEB-RESPONSIVE-001)

**Fecha:** 2026-04-05  
**Tipo:** Design System, layout búsqueda

## Alcance

- [`components/design-system/search-list-card.tsx`](../../../../components/design-system/search-list-card.tsx): el **`ChevronRight`** deja de ser un tercer hijo del `Pressable` (columna derecha del card). Pasa a la **misma fila** que el título (`titleRow`). Subtítulo/CTA y **`rankingChipsCluster`** (distancia, pin, landmark, `#tags`, Etiquetar) quedan en filas inferiores con **ancho completo** de la columna de texto (sin hueco reservado para el chevron).
- **`rankingChipsCluster`:** `flexWrap: 'wrap'` en todas las plataformas; `alignContent: 'flex-start'`.
- Documentación: [`DESIGN_SYSTEM_USAGE.md`](../../../contracts/DESIGN_SYSTEM_USAGE.md) §6.2, [`USER_TAGS_EXPLORE.md`](../../../contracts/USER_TAGS_EXPLORE.md) §6, inventario DS.

## Validación

- `npm run typecheck`
