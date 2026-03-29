# 315 — OL-EXPLORE-RESTRUCTURE-001: shell Explore web más accionable

Fecha: 2026-03-29
Tipo: UX / layout / design system (Explore web-first)

## Contexto
Explore necesitaba dejar de sentirse como mapa con overlays dispersos y pasar a una home más accionable desde el primer render web. El objetivo del loop fue cerrar un shell más claro para V1 web-first sin reabrir Search V2 ni rediseñar sheets.

## Cambios aplicados
- **Shell inferior canónico:** input de búsqueda visible en la base y perfil a la derecha dentro de un mismo contenedor.
- **Búsqueda:** el input visible actúa como launcher; al tap abre la búsqueda actual. Placeholder final: `Busca países o lugares`.
- **Filtros superiores:** variante inline centrada arriba; versión responsiva con modo `compact` para anchos pequeños y `wide/auto` para anchos tipo iPhone 12+, incluyendo labels visibles en pantallas más anchas.
- **Jerarquía visual de filtros:** filtros no activos compactados; contador oculto en el filtro activo.
- **Perfil / logout:** acción de cerrar sesión encima del perfil, con ajuste fino de offset para no pelear con la banda inferior.
- **Marca / feedback:** `FLOWYA` queda como trigger secundario de feedback en la banda inferior.
- **Badge de progreso:** nuevo badge `países | flows` en la banda inferior; se integra con estilo de filtro no activo.
- **Badge + estados del shell:** el badge se oculta cuando hay toast visible o cuando se despliega logout.
- **Interacción badge:** tap en `países | flows` abre exactamente el mismo flujo que el KPI de países visitados.
- **Copy visible:** surfaces de producto relevantes migradas de `spot` a `lugar` en textos visibles del flujo Explore/web.
- **Design system:** se canonizaron piezas nuevas del shell en DS en vez de resolverlas como one-offs dentro de `MapScreenVNext`.

## Componentes / archivos clave
- `components/explorar/MapScreenVNext.tsx`
- `components/design-system/search-launcher-field.tsx`
- `components/design-system/explore-search-action-row.tsx`
- `components/design-system/flowya-feedback-trigger.tsx`
- `components/design-system/explore-flows-badge.tsx`
- `components/design-system/map-pin-filter-inline.tsx`
- `components/design-system/map-pin-filter.tsx`
- `app/design-system.web.tsx`
- `components/search/SearchSurface.tsx`

## Decisiones de producto
- `FLOWYA` se mantiene secundario; si hay conflicto con toast o tareas activas, cede primero el badge de `flows`.
- La versión inline con labels visibles no sustituye la compacta; ambas conviven por ancho útil.
- El dominio interno sigue siendo `spot` en rutas/tipos/tablas; el cambio aquí fue de copy visible, no de renombre estructural.

## Validación mínima
- `npx tsc --noEmit`
- QA visual manual sugerida:
  - iPhone SE / anchos pequeños: filtros compactos
  - iPhone 12 Pro o superior: filtros wide con labels visibles
  - toast visible: oculta badge `países | flows`
  - logout abierto: oculta badge `países | flows`
  - tap en badge `países | flows`: abre `Países visitados`

## Resultado
`OL-EXPLORE-RESTRUCTURE-001` queda cerrado a nivel de implementación web-first. El siguiente loop natural es estabilizar consistencia entre viewports y piezas web en `OL-WEB-RESPONSIVE-001`.
