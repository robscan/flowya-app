# Bitácora 040 (2026/02) — Hotfix UI: clamp description_short a 3 líneas

## Problema

Las descripciones largas (`description_short`) en la card del mapa y en el listado de búsqueda podían ocupar muchas líneas y desbordar o empujar el layout.

## Solución

Limitar la descripción a **máximo 3 líneas** con ellipsis al final (`…`), sin cambiar layout, paddings, tamaños de imagen ni jerarquía visual.

## Componentes

- **SpotCardMapSelection** ([components/design-system/spot-card.tsx](components/design-system/spot-card.tsx)): `<Text>` de `description_short` con `numberOfLines={3}` y `ellipsizeMode="tail"`.
- **SearchResultCard** ([components/design-system/search-result-card.tsx](components/design-system/search-result-card.tsx)): usa `SpotCardMapSelection`, por tanto hereda el clamp (sin cambio adicional).

## QA

- Spot con `description_short` largo: en resultados de búsqueda y en la card del mapa se ven como máximo 3 líneas + "…".
- La altura de la card no crece más allá del recorte; botones/acciones no se desplazan.

## Rollback

Revertir el commit que añade `numberOfLines` y `ellipsizeMode` en el `Text` de la descripción en `spot-card.tsx`.
