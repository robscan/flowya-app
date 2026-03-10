# 303 — OL-URGENT-CLUSTER-001: clustering Mapbox para pins del mapa

**Fecha:** 2026-03-09  
**Tipo:** Urgente  
**Estado:** Abordado

## Problema

1. **Densidad de pins:** En vista mundial (zoom 1–4), cientos de pins se superponen en regiones densas (México, Centroamérica, Playa del Carmen, etc.), generando ruido visual e iconos ilegibles.
2. **Bug z-index:** Los iconos Maki se dibujan por encima de los círculos; cuando dos spots se solapan, el icono de uno aparece encima del pin del otro.

## Solución implementada

### Clustering Mapbox nativo

- Fuente GeoJSON `flowya-spots` con `cluster: true`, `clusterRadius: 50`, `clusterMaxZoom: 14`.
- Todas las capas de pins individuales excluyen clusters con filtro `['!', ['has', 'point_count']]`.
- Nueva capa `flowya-spots-clusters` (círculos) que muestra clusters con count; clic hace zoom de expansión vía `getClusterExpansionZoom` + `flyTo`.
- Capa `flowya-spots-clusters-count` (símbolo) con número abreviado en cada cluster.

### Constantes

- `lib/map-core/constants.ts`: `CLUSTER_RADIUS = 50`, `CLUSTER_MAX_ZOOM = 14`.
- `constants/theme.ts`: tokens `clusterRadius`, `clusterColor`, `clusterTextSize` en `mapPinSpot`.

### Bug z-index (documentado)

- Posibles enfoques: declutter (`icon-ignore-placement: false`), imagen compuesta. Pendiente validación en sesión posterior.

## Archivos modificados

- `docs/ops/OPEN_LOOPS.md` — añadido OL-URGENT-CLUSTER-001, trazabilidad en Cierres recientes.
- `lib/map-core/constants.ts` — CLUSTER_RADIUS = 50, CLUSTER_MAX_ZOOM = 14.
- `lib/map-core/spots-layer.ts` — fuente con cluster, filtro andNonCluster, capas flowya-spots-clusters y flowya-spots-clusters-count, handler clic (getClusterExpansionZoom + flyTo).
- `constants/theme.ts` — mapPinSpot.cluster { radiusMin, radiusMax, countMax, fill, stroke, textSize } en light y dark.

## Referencias

- Plan: `plan_densidad_pins_mapa_812b2ddb.plan.md`
- Mapbox clustering: https://docs.mapbox.com/mapbox-gl-js/example/cluster/
