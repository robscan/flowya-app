# Inventario de canon — Design System (2026-04)

Fuente barrel: [`components/design-system/index.ts`](../../components/design-system/index.ts). Vitrina web: [`app/design-system.web.tsx`](../../app/design-system.web.tsx). Layout web compartido: [`lib/web-layout.ts`](../../lib/web-layout.ts).

## Excepciones documentadas

| Tema | Nota |
|------|------|
| Fila de chips en `SearchSurface` | No es `TagChip`; estilos propios para filtro de búsqueda. Ver vitrina Etiquetas. |
| `SearchInputV2` en vitrina | Demo embebida en bloque de filtros; runtime en `SearchSurface`. |
| Modales en `../ui/` | `ConfirmModal`, `FlowyaBetaModal` reexportados en barrel; implementación en `components/ui/`. |

## Matriz (archivos en `components/design-system/`)

| Componente / archivo | Barrel | Vitrina web | Uso runtime principal |
|----------------------|--------|-------------|------------------------|
| `activity-summary.tsx` | Sí | Sí | `SearchSurface` |
| `buttons.tsx` | Sí | Sí (`ButtonsShowcase`) | Flujos create/edit/auth |
| `cards.tsx` | Sí | Sí | Patrón contenedor |
| `colors-showcase.tsx` | Sí | Sí | — |
| `clear-icon-circle.tsx` | Sí | Sí | MapPinFilter, búsqueda |
| `explore-flows-badge.tsx` | Sí | Sí | Explore shell |
| `explore-search-action-row.tsx` | Sí | Sí | Banda inferior Explore |
| `flowya-feedback-trigger.tsx` | Sí | Sí | Explore |
| `icon-button.tsx` | Sí | Sí | Sheet, mapa, búsqueda |
| `image-fullscreen-modal.tsx` | Sí | Sí | SpotSheet, galería |
| `image-placeholder.tsx` | Sí | Sí | Create/edit spot |
| `map-controls.tsx` | Sí | Sí | Mapa Explore |
| `map-location-picker.tsx` | Sí | Sí | Create spot |
| `map-pin-filter.tsx` | Sí | Sí | Overlay filtros mapa |
| `map-pin-filter-inline.tsx` | Sí | Sí | Búsqueda Explore |
| `map-pin-filter-menu-option.tsx` | Sí | Sí | Menú 3 opciones (hijo de filtro) |
| `map-pins.tsx` | Sí | Sí (`MapPinsShowcase`) | Mapa |
| `search-launcher-field.tsx` | Sí | Sí | Home Explore |
| `search-list-card.tsx` | Sí | Sí | Resultados búsqueda |
| `search-pill.tsx` | Sí | Sí | Launcher búsqueda |
| `search-result-card.tsx` | Sí | Sí | Adapter spot → lista |
| `sheet-handle.tsx` | Sí | Sí | Sheets (patrón handle) |
| `spot-card.tsx` | Sí | Sí | Selección pin mapa |
| `spot-detail.tsx` | Sí | Sí (`SpotDetailShowcase`) | Detalle lugar |
| `spot-image.tsx` | Sí | Sí | Cards, sheet |
| `tag-chip.tsx` | Sí | Sí | Etiquetas |
| `typography.tsx` | Sí | Sí | — |
| Reexport `ConfirmModal` | Sí | Sí | Auth, logout |
| Reexport `FlowyaBetaModal` | Sí | Sí | Beta |

## Criterio

- **Barrel + runtime Explore/search/sheet:** deben poder inspeccionarse en la vitrina web o documentarse aquí como primitiva interna.
- **Layout web (OL-WEB-RESPONSIVE-001):** anchos máximos alineados con `lib/web-layout.ts` (`WEB_SEARCH_OVERLAY_MAX_WIDTH`, `WEB_SHEET_MAX_WIDTH`, etc.).
