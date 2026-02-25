# 119 — Explore mapa FLOWYA-only (toggle de versiones eliminado)

Fecha: 2026-02-25

## Contexto

Se confirmó decisión de producto: Explore trabajará únicamente con estilo FLOWYA (Mapbox Studio).
El toggle de versiones de mapa (Standard vs FLOWYA) quedó deprecado y se removió del código operativo.

## Cambios aplicados

- Se eliminó la bifurcación de estilos en Explore VNext.
  - `MapScreenVNext` ahora usa siempre `FLOWYA_MAP_STYLE_LIGHT` / `FLOWYA_MAP_STYLE_DARK`.
- Se removieron constantes y helpers de la ruta Standard que ya no se usan.
  - `MAP_STYLE_STANDARD`, `USE_CORE_MAP_STYLES`, `MAP_BASEMAP_THEME`.
  - `hideCommercialPOIsViaConfig`, `enable3DBuildingsAndObjects`, `applyWaterAndGreenspaceColors`.
- Se simplificó `useMapCore` retirando la opción `useCoreMapStyles` y su rama condicional.
- Se simplificó `MapCoreView` removiendo `mapConfig` (sin config basemap runtime).
- El control 3D permanece activo y funcional en FLOWYA.

## Documentación alineada

- `docs/ops/CURRENT_STATE.md`: decisión FLOWYA-only agregada.
- `docs/ops/OPEN_LOOPS.md`: nota de decisión vigente agregada.
- `docs/ops/plans/PLAN_POI_TAP_MAPBOX_STANDARD_3D.md`: marcado como `DEPRECATED` (histórico).
- `docs/ops/plans/PLAN_EXPLORE_AJUSTES_MAP_SEARCH.md`: referencias ajustadas para FLOWYA-only.

## Verificación

- `npm run -s lint` ejecutado.
- Resultado: fallos preexistentes no relacionados al cambio (`duplicate-spot-modal` y dos warnings previos en `MapScreenVNext`).

## Resultado

Explore queda en ruta única de mapa FLOWYA, sin toggle de versión, con menor complejidad y menor riesgo de divergencia entre ramas de estilo.
