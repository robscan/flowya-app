/**
 * spots-layer — capa nativa Mapbox para spots en Explorar.
 * Se inserta debajo de la capa POI para que los POIs cubran nuestros pins cuando estén visibles.
 */

import type { Map as MapboxMap } from 'mapbox-gl';

import { Colors } from '@/constants/theme';

import {
  getPoiLayerBeforeId,
  LABEL_MIN_ZOOM,
  MAPBOX_LABEL_STYLE_DARK,
  MAPBOX_LABEL_STYLE_LIGHT,
} from './constants';

export type SpotForLayer = {
  id: string;
  title: string;
  latitude: number;
  longitude: number;
  pinStatus?: 'default' | 'to_visit' | 'visited';
  linkedPlaceId?: string | null;
  linkedMaki?: string | null;
  forceVisible?: boolean;
};

const SOURCE_ID = 'flowya-spots';
const CIRCLES_DEFAULT_UNLINKED_LAYER_ID = 'flowya-spots-circles-default-unlinked';
const CIRCLES_DEFAULT_UNLINKED_SELECTED_LAYER_ID = 'flowya-spots-circles-default-unlinked-selected';
const CIRCLES_SAVED_VISITED_LAYER_ID = 'flowya-spots-circles-saved-visited';
const DEFAULT_PLUS_UNLINKED_LAYER_ID = 'flowya-spots-default-plus-unlinked';
const DEFAULT_PLUS_UNLINKED_SELECTED_LAYER_ID = 'flowya-spots-default-plus-unlinked-selected';
const MAKIS_LAYER_ID = 'flowya-spots-makis';
const LABELS_DEFAULT_UNLINKED_LAYER_ID = 'flowya-spots-labels-default-unlinked';
const LABELS_DEFAULT_UNLINKED_SELECTED_LAYER_ID = 'flowya-spots-labels-default-unlinked-selected';
const LABELS_SAVED_VISITED_LAYER_ID = 'flowya-spots-labels-saved-visited';
const LABEL_FONT_STACK_STRONG = ['Open Sans Bold', 'Arial Unicode MS Bold'];
const DEFAULT_UNLINKED_MIN_ZOOM = 13;

type GeoJSONSource = import('mapbox-gl').GeoJSONSource;
type MapPinSpotTokens = (typeof Colors)['light']['mapPinSpot'];

function buildMakiIconCandidates(maki?: string | null): {
  primary: string;
  alternate: string;
  fallback: string;
} {
  const normalized = (maki ?? '').trim().toLowerCase();
  if (!normalized) {
    return {
      primary: 'marker-15',
      alternate: 'marker-15',
      fallback: 'flowya-fallback-generic',
    };
  }
  const base = normalized.replace(/-(11|15)$/i, '');
  const hasSuffix = /-(11|15)$/i.test(normalized);
  if (hasSuffix) {
    const primary = normalized;
    const alternate = normalized.endsWith('-11') ? `${base}-15` : `${base}-11`;
    return {
      primary,
      alternate,
      fallback: `flowya-fallback-${base}`,
    };
  }
  return {
    primary: `${base}-15`,
    alternate: `${base}-11`,
    fallback: `flowya-fallback-${base}`,
  };
}

function resolveMakiIcon(maki?: string | null, availableImageIds?: Set<string>): string {
  const candidates = buildMakiIconCandidates(maki);
  if (availableImageIds?.has(candidates.primary)) return candidates.primary;
  if (availableImageIds?.has(candidates.alternate)) return candidates.alternate;
  return candidates.fallback;
}

function spotsToGeoJSON(
  spots: SpotForLayer[],
  selectedSpotId: string | null,
  availableImageIds?: Set<string>
): GeoJSON.FeatureCollection<
  GeoJSON.Point,
    {
      id: string;
      title: string;
      pinStatus: string;
      selected: boolean;
      isUnlinkedDefault: boolean;
      makiIcon: string;
      forceVisible: boolean;
    }
> {
  return {
    type: 'FeatureCollection',
    features: spots.map((s) => {
      const status = s.pinStatus ?? 'default';
      const makiIcon = resolveMakiIcon(s.linkedMaki, availableImageIds);
      return {
        type: 'Feature' as const,
        geometry: {
          type: 'Point' as const,
          coordinates: [s.longitude, s.latitude],
        },
        properties: {
          id: s.id,
          title: s.title ?? '',
          pinStatus: status,
          selected: s.id === selectedSpotId,
          isUnlinkedDefault: status === 'default' && !s.linkedPlaceId,
          makiIcon,
          forceVisible: Boolean(s.forceVisible),
        },
      };
    }),
  };
}

function buildCircleColorExpression(tokens: MapPinSpotTokens): [string, ...unknown[]] {
  return [
    'match',
    ['get', 'pinStatus'],
    'to_visit',
    tokens.toVisit.fill,
    'visited',
    tokens.visited.fill,
    tokens.default.fill,
  ];
}

function buildCircleStrokeColorExpression(tokens: MapPinSpotTokens): [string, ...unknown[]] {
  const selectedMatch: [string, ...unknown[]] = [
    'match',
    ['get', 'pinStatus'],
    'to_visit',
    tokens.selected.toVisitStroke,
    'visited',
    tokens.selected.visitedStroke,
    tokens.selected.defaultStroke,
  ];
  const unselectedMatch: [string, ...unknown[]] = [
    'match',
    ['get', 'pinStatus'],
    'to_visit',
    tokens.toVisit.stroke,
    'visited',
    tokens.visited.stroke,
    tokens.default.stroke,
  ];
  return ['case', ['get', 'selected'], selectedMatch, unselectedMatch];
}

function buildLabelTextColorExpression(defaultColor: string, fallbackColor: string): [string, ...unknown[]] {
  return ['match', ['get', 'pinStatus'], 'default', defaultColor, fallbackColor];
}

function buildLabelHaloColorExpression(defaultHaloColor: string, fallbackHaloColor: string): [string, ...unknown[]] {
  return ['match', ['get', 'pinStatus'], 'default', defaultHaloColor, fallbackHaloColor];
}

function buildLabelHaloWidthExpression(defaultHaloWidth: number, fallbackHaloWidth: number): [string, ...unknown[]] {
  return ['match', ['get', 'pinStatus'], 'default', defaultHaloWidth, fallbackHaloWidth];
}

function defaultUnlinkedVisibilityByZoomOrForce(): [string, ...unknown[]] {
  return [
    'any',
    ['>=', ['zoom'], DEFAULT_UNLINKED_MIN_ZOOM],
    ['==', ['get', 'forceVisible'], true],
  ];
}

function filterDefaultUnlinked(selected: boolean): [string, ...unknown[]] {
  const base: [string, ...unknown[]] = [
    'all',
    ['==', ['get', 'pinStatus'], 'default'],
    ['==', ['get', 'isUnlinkedDefault'], true],
    ['==', ['get', 'selected'], selected],
  ];
  if (selected) return base;
  return [...base, defaultUnlinkedVisibilityByZoomOrForce()];
}

function filterSavedVisited(): [string, ...unknown[]] {
  return ['in', ['get', 'pinStatus'], ['literal', ['to_visit', 'visited']]];
}

function setLayerMinZoom(map: MapboxMap, layerId: string, minzoom: number) {
  map.setLayerZoomRange(layerId, minzoom, 24);
}

const LABEL_LAYER_IDS = [
  LABELS_DEFAULT_UNLINKED_LAYER_ID,
  LABELS_DEFAULT_UNLINKED_SELECTED_LAYER_ID,
  LABELS_SAVED_VISITED_LAYER_ID,
] as const;

export function setupSpotsLayer(
  map: MapboxMap,
  spots: SpotForLayer[],
  selectedSpotId: string | null,
  _zoom: number,
  isDark: boolean,
  showMakiIcon: boolean,
  showLabels: boolean,
  onPinClickBySpotId: (spotId: string) => void
): void {
  try {
    const availableImageIds = new Set(map.listImages());
    const data = spotsToGeoJSON(spots, selectedSpotId, availableImageIds);
    const beforeId = getPoiLayerBeforeId(map);
    const palette = isDark ? Colors.dark.mapPinSpot : Colors.light.mapPinSpot;
    const circleColorExpression = buildCircleColorExpression(palette);
    const circleStrokeColorExpression = buildCircleStrokeColorExpression(palette);

    const addCircleInteractivity = (layerId: string) => {
      map.on('click', layerId, (e) => {
        const f = e.features?.[0];
        const id = f?.properties?.id;
        if (typeof id === 'string') onPinClickBySpotId(id);
      });
      map.on('mouseenter', layerId, () => {
        map.getCanvas().style.cursor = 'pointer';
      });
      map.on('mouseleave', layerId, () => {
        map.getCanvas().style.cursor = '';
      });
    };

    if (!map.getSource(SOURCE_ID)) {
      map.addSource(SOURCE_ID, { type: 'geojson', data });
    } else {
      (map.getSource(SOURCE_ID) as GeoJSONSource).setData(data);
    }

    if (!map.getLayer(CIRCLES_DEFAULT_UNLINKED_LAYER_ID)) {
      map.addLayer(
        {
          id: CIRCLES_DEFAULT_UNLINKED_LAYER_ID,
          type: 'circle',
          source: SOURCE_ID,
          filter: filterDefaultUnlinked(false),
          paint: {
            'circle-radius': palette.unselected.radius,
            'circle-color': palette.default.fill,
            'circle-stroke-width': palette.unselected.strokeWidth,
            'circle-stroke-color': palette.default.stroke,
            'circle-emissive-strength': 1,
          },
        },
        beforeId
      );
      addCircleInteractivity(CIRCLES_DEFAULT_UNLINKED_LAYER_ID);
    }
    if (map.getLayer(CIRCLES_DEFAULT_UNLINKED_LAYER_ID)) {
      map.setFilter(CIRCLES_DEFAULT_UNLINKED_LAYER_ID, filterDefaultUnlinked(false));
      map.setPaintProperty(CIRCLES_DEFAULT_UNLINKED_LAYER_ID, 'circle-radius', palette.unselected.radius);
      map.setPaintProperty(CIRCLES_DEFAULT_UNLINKED_LAYER_ID, 'circle-color', palette.default.fill);
      map.setPaintProperty(CIRCLES_DEFAULT_UNLINKED_LAYER_ID, 'circle-stroke-width', palette.unselected.strokeWidth);
      map.setPaintProperty(CIRCLES_DEFAULT_UNLINKED_LAYER_ID, 'circle-stroke-color', palette.default.stroke);
      setLayerMinZoom(map, CIRCLES_DEFAULT_UNLINKED_LAYER_ID, 0);
    }

    if (!map.getLayer(CIRCLES_DEFAULT_UNLINKED_SELECTED_LAYER_ID)) {
      map.addLayer(
        {
          id: CIRCLES_DEFAULT_UNLINKED_SELECTED_LAYER_ID,
          type: 'circle',
          source: SOURCE_ID,
          filter: filterDefaultUnlinked(true),
          paint: {
            'circle-radius': palette.selected.radius,
            'circle-color': palette.default.fill,
            'circle-stroke-width': palette.selected.strokeWidth,
            'circle-stroke-color': palette.selected.defaultStroke,
            'circle-emissive-strength': 1,
          },
        },
        beforeId
      );
      addCircleInteractivity(CIRCLES_DEFAULT_UNLINKED_SELECTED_LAYER_ID);
    }
    if (map.getLayer(CIRCLES_DEFAULT_UNLINKED_SELECTED_LAYER_ID)) {
      map.setFilter(CIRCLES_DEFAULT_UNLINKED_SELECTED_LAYER_ID, filterDefaultUnlinked(true));
      map.setPaintProperty(CIRCLES_DEFAULT_UNLINKED_SELECTED_LAYER_ID, 'circle-radius', palette.selected.radius);
      map.setPaintProperty(CIRCLES_DEFAULT_UNLINKED_SELECTED_LAYER_ID, 'circle-color', palette.default.fill);
      map.setPaintProperty(
        CIRCLES_DEFAULT_UNLINKED_SELECTED_LAYER_ID,
        'circle-stroke-width',
        palette.selected.strokeWidth
      );
      map.setPaintProperty(
        CIRCLES_DEFAULT_UNLINKED_SELECTED_LAYER_ID,
        'circle-stroke-color',
        palette.selected.defaultStroke
      );
      setLayerMinZoom(map, CIRCLES_DEFAULT_UNLINKED_SELECTED_LAYER_ID, 0);
    }

    if (!map.getLayer(CIRCLES_SAVED_VISITED_LAYER_ID)) {
      map.addLayer(
        {
          id: CIRCLES_SAVED_VISITED_LAYER_ID,
          type: 'circle',
          source: SOURCE_ID,
          filter: filterSavedVisited(),
          paint: {
            'circle-radius': [
              'case',
              ['get', 'selected'],
              palette.selected.radius,
              palette.unselected.radius,
            ],
            'circle-color': circleColorExpression,
            'circle-stroke-width': [
              'case',
              ['get', 'selected'],
              palette.selected.strokeWidth,
              palette.unselected.strokeWidth,
            ],
            'circle-stroke-color': circleStrokeColorExpression,
            'circle-emissive-strength': 1,
          },
        },
        beforeId
      );
      addCircleInteractivity(CIRCLES_SAVED_VISITED_LAYER_ID);
    }
    if (map.getLayer(CIRCLES_SAVED_VISITED_LAYER_ID)) {
      map.setFilter(CIRCLES_SAVED_VISITED_LAYER_ID, filterSavedVisited());
      map.setPaintProperty(CIRCLES_SAVED_VISITED_LAYER_ID, 'circle-color', circleColorExpression);
      map.setPaintProperty(CIRCLES_SAVED_VISITED_LAYER_ID, 'circle-stroke-color', circleStrokeColorExpression);
      map.setPaintProperty(CIRCLES_SAVED_VISITED_LAYER_ID, 'circle-radius', [
        'case',
        ['get', 'selected'],
        palette.selected.radius,
        palette.unselected.radius,
      ]);
      map.setPaintProperty(CIRCLES_SAVED_VISITED_LAYER_ID, 'circle-stroke-width', [
        'case',
        ['get', 'selected'],
        palette.selected.strokeWidth,
        palette.unselected.strokeWidth,
      ]);
      setLayerMinZoom(map, CIRCLES_SAVED_VISITED_LAYER_ID, 0);
    }

    if (!map.getLayer(DEFAULT_PLUS_UNLINKED_LAYER_ID)) {
      map.addLayer(
        {
          id: DEFAULT_PLUS_UNLINKED_LAYER_ID,
          type: 'symbol',
          source: SOURCE_ID,
          filter: filterDefaultUnlinked(false),
          layout: {
            'text-field': '+',
            'text-size': palette.unselected.plusTextSize,
            'text-font': ['literal', LABEL_FONT_STACK_STRONG],
            'text-allow-overlap': true,
            'text-ignore-placement': true,
            'text-anchor': 'center',
          },
          paint: {
            'text-color': palette.default.plusText,
            'text-halo-color': palette.default.plusHalo,
            'text-halo-width': palette.default.plusHaloWidth,
          },
        },
        beforeId
      );
    }
    if (map.getLayer(DEFAULT_PLUS_UNLINKED_LAYER_ID)) {
      map.setFilter(DEFAULT_PLUS_UNLINKED_LAYER_ID, filterDefaultUnlinked(false));
      map.setLayoutProperty(DEFAULT_PLUS_UNLINKED_LAYER_ID, 'text-size', palette.unselected.plusTextSize);
      map.setPaintProperty(DEFAULT_PLUS_UNLINKED_LAYER_ID, 'text-color', palette.default.plusText);
      map.setPaintProperty(DEFAULT_PLUS_UNLINKED_LAYER_ID, 'text-halo-color', palette.default.plusHalo);
      map.setPaintProperty(DEFAULT_PLUS_UNLINKED_LAYER_ID, 'text-halo-width', palette.default.plusHaloWidth);
      setLayerMinZoom(map, DEFAULT_PLUS_UNLINKED_LAYER_ID, 0);
    }

    if (!map.getLayer(DEFAULT_PLUS_UNLINKED_SELECTED_LAYER_ID)) {
      map.addLayer(
        {
          id: DEFAULT_PLUS_UNLINKED_SELECTED_LAYER_ID,
          type: 'symbol',
          source: SOURCE_ID,
          filter: filterDefaultUnlinked(true),
          layout: {
            'text-field': '+',
            'text-size': palette.selected.plusTextSize,
            'text-font': ['literal', LABEL_FONT_STACK_STRONG],
            'text-allow-overlap': true,
            'text-ignore-placement': true,
            'text-anchor': 'center',
          },
          paint: {
            'text-color': palette.default.plusText,
            'text-halo-color': palette.default.plusHalo,
            'text-halo-width': palette.default.plusHaloWidth,
          },
        },
        beforeId
      );
    }
    if (map.getLayer(DEFAULT_PLUS_UNLINKED_SELECTED_LAYER_ID)) {
      map.setFilter(DEFAULT_PLUS_UNLINKED_SELECTED_LAYER_ID, filterDefaultUnlinked(true));
      map.setLayoutProperty(
        DEFAULT_PLUS_UNLINKED_SELECTED_LAYER_ID,
        'text-size',
        palette.selected.plusTextSize
      );
      map.setPaintProperty(DEFAULT_PLUS_UNLINKED_SELECTED_LAYER_ID, 'text-color', palette.default.plusText);
      map.setPaintProperty(
        DEFAULT_PLUS_UNLINKED_SELECTED_LAYER_ID,
        'text-halo-color',
        palette.default.plusHalo
      );
      map.setPaintProperty(
        DEFAULT_PLUS_UNLINKED_SELECTED_LAYER_ID,
        'text-halo-width',
        palette.default.plusHaloWidth
      );
      setLayerMinZoom(map, DEFAULT_PLUS_UNLINKED_SELECTED_LAYER_ID, 0);
    }

    if (showMakiIcon) {
      if (!map.getLayer(MAKIS_LAYER_ID)) {
        map.addLayer(
          {
            id: MAKIS_LAYER_ID,
            type: 'symbol',
            source: SOURCE_ID,
            filter: filterSavedVisited(),
            layout: {
              'icon-image': ['get', 'makiIcon'],
              'icon-size': [
                'case',
                ['get', 'selected'],
                palette.selected.makiIconSize,
                palette.unselected.makiIconSize,
              ],
              'text-allow-overlap': true,
              'icon-allow-overlap': true,
              'icon-ignore-placement': true,
              'icon-anchor': 'center',
            },
          },
          beforeId
        );
      }
      if (map.getLayer(MAKIS_LAYER_ID)) {
        map.setFilter(MAKIS_LAYER_ID, filterSavedVisited());
        map.setLayoutProperty(MAKIS_LAYER_ID, 'icon-size', [
          'case',
          ['get', 'selected'],
          palette.selected.makiIconSize,
          palette.unselected.makiIconSize,
        ]);
      }
    } else if (map.getLayer(MAKIS_LAYER_ID)) {
      map.removeLayer(MAKIS_LAYER_ID);
    }

    const labelStyle = isDark ? MAPBOX_LABEL_STYLE_DARK : MAPBOX_LABEL_STYLE_LIGHT;
    const strongLabelHaloColor = isDark ? 'rgba(0,0,0,0.34)' : 'rgba(255,255,255,0.55)';
    const textSizeExpression: [string, ...unknown[]] = [
      'case',
      ['get', 'selected'],
      labelStyle.textSize + palette.selected.labelSizeDelta,
      labelStyle.textSize,
    ];
    const textOffsetExpression: [string, ...unknown[]] = [
      'case',
      ['get', 'selected'],
      ['literal', [0, palette.selected.labelOffsetY]],
      ['literal', [0, palette.unselected.labelOffsetY]],
    ];
    const textFontExpression: [string, ...unknown[]] = ['literal', LABEL_FONT_STACK_STRONG];
    const textColorExpression = buildLabelTextColorExpression(palette.default.labelText, labelStyle.textColor);
    const textHaloColorExpression = buildLabelHaloColorExpression(
      palette.default.labelHalo,
      strongLabelHaloColor
    );
    const textHaloWidthExpression = buildLabelHaloWidthExpression(palette.default.labelHaloWidth, 1.15);

    const applyLabelLayerStyle = (layerId: string) => {
      map.setLayoutProperty(layerId, 'text-size', textSizeExpression);
      map.setLayoutProperty(layerId, 'text-offset', textOffsetExpression);
      map.setLayoutProperty(layerId, 'text-font', textFontExpression);
      map.setPaintProperty(layerId, 'text-color', textColorExpression);
      map.setPaintProperty(layerId, 'text-halo-color', textHaloColorExpression);
      map.setPaintProperty(layerId, 'text-halo-width', textHaloWidthExpression);
      map.setLayoutProperty(layerId, 'visibility', showLabels ? 'visible' : 'none');
    };

    if (!map.getLayer(LABELS_DEFAULT_UNLINKED_LAYER_ID)) {
      map.addLayer(
        {
          id: LABELS_DEFAULT_UNLINKED_LAYER_ID,
          type: 'symbol',
          source: SOURCE_ID,
          minzoom: LABEL_MIN_ZOOM,
          filter: filterDefaultUnlinked(false),
          layout: {
            'text-field': ['get', 'title'],
            'text-size': textSizeExpression,
            'text-anchor': 'top',
            'text-offset': textOffsetExpression,
            'text-max-width': 10,
            'text-font': textFontExpression,
            visibility: showLabels ? 'visible' : 'none',
          },
          paint: {
            'text-color': textColorExpression,
            'text-halo-color': textHaloColorExpression,
            'text-halo-width': textHaloWidthExpression,
          },
        },
        beforeId
      );
    }
    if (map.getLayer(LABELS_DEFAULT_UNLINKED_LAYER_ID)) {
      map.setFilter(LABELS_DEFAULT_UNLINKED_LAYER_ID, filterDefaultUnlinked(false));
      applyLabelLayerStyle(LABELS_DEFAULT_UNLINKED_LAYER_ID);
      setLayerMinZoom(map, LABELS_DEFAULT_UNLINKED_LAYER_ID, LABEL_MIN_ZOOM);
    }

    if (!map.getLayer(LABELS_DEFAULT_UNLINKED_SELECTED_LAYER_ID)) {
      map.addLayer(
        {
          id: LABELS_DEFAULT_UNLINKED_SELECTED_LAYER_ID,
          type: 'symbol',
          source: SOURCE_ID,
          minzoom: LABEL_MIN_ZOOM,
          filter: filterDefaultUnlinked(true),
          layout: {
            'text-field': ['get', 'title'],
            'text-size': textSizeExpression,
            'text-anchor': 'top',
            'text-offset': textOffsetExpression,
            'text-max-width': 10,
            'text-font': textFontExpression,
            visibility: showLabels ? 'visible' : 'none',
          },
          paint: {
            'text-color': textColorExpression,
            'text-halo-color': textHaloColorExpression,
            'text-halo-width': textHaloWidthExpression,
          },
        },
        beforeId
      );
    }
    if (map.getLayer(LABELS_DEFAULT_UNLINKED_SELECTED_LAYER_ID)) {
      map.setFilter(LABELS_DEFAULT_UNLINKED_SELECTED_LAYER_ID, filterDefaultUnlinked(true));
      applyLabelLayerStyle(LABELS_DEFAULT_UNLINKED_SELECTED_LAYER_ID);
      setLayerMinZoom(map, LABELS_DEFAULT_UNLINKED_SELECTED_LAYER_ID, LABEL_MIN_ZOOM);
    }

    if (!map.getLayer(LABELS_SAVED_VISITED_LAYER_ID)) {
      map.addLayer(
        {
          id: LABELS_SAVED_VISITED_LAYER_ID,
          type: 'symbol',
          source: SOURCE_ID,
          minzoom: LABEL_MIN_ZOOM,
          filter: filterSavedVisited(),
          layout: {
            'text-field': ['get', 'title'],
            'text-size': textSizeExpression,
            'text-anchor': 'top',
            'text-offset': textOffsetExpression,
            'text-max-width': 10,
            'text-font': textFontExpression,
            visibility: showLabels ? 'visible' : 'none',
          },
          paint: {
            'text-color': textColorExpression,
            'text-halo-color': textHaloColorExpression,
            'text-halo-width': textHaloWidthExpression,
          },
        },
        beforeId
      );
    }
    if (map.getLayer(LABELS_SAVED_VISITED_LAYER_ID)) {
      map.setFilter(LABELS_SAVED_VISITED_LAYER_ID, filterSavedVisited());
      applyLabelLayerStyle(LABELS_SAVED_VISITED_LAYER_ID);
      setLayerMinZoom(map, LABELS_SAVED_VISITED_LAYER_ID, LABEL_MIN_ZOOM);
    }
  } catch {
    // ignore style/layer errors
  }
}

export function updateSpotsLayerData(
  map: MapboxMap,
  spots: SpotForLayer[],
  selectedSpotId: string | null,
  _zoom: number,
  showLabels: boolean
): void {
  try {
    const source = map.getSource(SOURCE_ID) as GeoJSONSource | undefined;
    if (source) {
      const availableImageIds = new Set(map.listImages());
      source.setData(spotsToGeoJSON(spots, selectedSpotId, availableImageIds));
    }
    for (const layerId of LABEL_LAYER_IDS) {
      if (map.getLayer(layerId)) {
        map.setLayoutProperty(layerId, 'visibility', showLabels ? 'visible' : 'none');
      }
    }
  } catch {
    // ignore
  }
}
