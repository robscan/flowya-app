/**
 * spots-layer — capa nativa Mapbox para spots en Explorar.
 * Se inserta debajo de la capa POI para que los POIs cubran nuestros pins cuando estén visibles.
 */

import type { Map as MapboxMap } from 'mapbox-gl';

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
  linkedMaki?: string | null;
};

const SOURCE_ID = 'flowya-spots';
const CIRCLES_LAYER_ID = 'flowya-spots-circles';
const DEFAULT_PLUS_LAYER_ID = 'flowya-spots-default-plus';
const MAKIS_LAYER_ID = 'flowya-spots-makis';
const LABELS_LAYER_ID = 'flowya-spots-labels';
const LABEL_FONT_STACK_STRONG = ['Open Sans Bold', 'Arial Unicode MS Bold'];

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

function resolveMakiIcon(
  maki?: string | null,
  availableImageIds?: Set<string>
): string {
  const candidates = buildMakiIconCandidates(maki);
  if (availableImageIds?.has(candidates.primary)) return candidates.primary;
  if (availableImageIds?.has(candidates.alternate)) return candidates.alternate;
  return candidates.fallback;
}

function spotsToGeoJSON(
  spots: SpotForLayer[],
  selectedSpotId: string | null,
  zoom: number,
  availableImageIds?: Set<string>
): GeoJSON.FeatureCollection<
  GeoJSON.Point,
  {
    id: string;
    title: string;
    pinStatus: string;
    selected: boolean;
    makiIcon: string;
  }
> {
  return {
    type: 'FeatureCollection',
    features: spots.map((s) => {
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
          pinStatus: s.pinStatus ?? 'default',
          selected: s.id === selectedSpotId,
          makiIcon,
        },
      };
    }),
  };
}

/** Colores para círculos por pinStatus (Mapbox expressions). */
const circleColorExpression: [string, ...unknown[]] = [
  'match',
  ['get', 'pinStatus'],
  'to_visit',
  '#e6862b',
  'visited',
  '#34c759',
  '#9CB2C8', // default (Flowya own spot without filters)
];

/** Colores para dark mode. */
const circleColorExpressionDark: [string, ...unknown[]] = [
  'match',
  ['get', 'pinStatus'],
  'to_visit',
  '#ff9f0a',
  'visited',
  '#30d158',
  '#9CB2C8', // default (Flowya own spot without filters)
];

const circleStrokeColorExpression: [string, ...unknown[]] = [
  'match',
  ['get', 'pinStatus'],
  'default',
  '#1A2330',
  'rgba(255,255,255,0.95)',
];

const circleStrokeColorExpressionDark: [string, ...unknown[]] = [
  'match',
  ['get', 'pinStatus'],
  'default',
  '#0E1520',
  'rgba(0,0,0,0.5)',
];

function buildLabelTextColorExpression(defaultColor: string, fallbackColor: string): [string, ...unknown[]] {
  return ['match', ['get', 'pinStatus'], 'default', defaultColor, fallbackColor];
}

function buildLabelHaloColorExpression(defaultHaloColor: string, fallbackHaloColor: string): [string, ...unknown[]] {
  return ['match', ['get', 'pinStatus'], 'default', defaultHaloColor, fallbackHaloColor];
}

function buildLabelHaloWidthExpression(defaultHaloWidth: number, fallbackHaloWidth: number): [string, ...unknown[]] {
  return ['match', ['get', 'pinStatus'], 'default', defaultHaloWidth, fallbackHaloWidth];
}

type GeoJSONSource = import('mapbox-gl').GeoJSONSource;

export function setupSpotsLayer(
  map: MapboxMap,
  spots: SpotForLayer[],
  selectedSpotId: string | null,
  zoom: number,
  isDark: boolean,
  showMakiIcon: boolean,
  showLabels: boolean,
  onPinClickBySpotId: (spotId: string) => void
): void {
  try {
    const availableImageIds = new Set(map.listImages());
    const data = spotsToGeoJSON(spots, selectedSpotId, zoom, availableImageIds);
    const beforeId = getPoiLayerBeforeId(map);

    if (!map.getSource(SOURCE_ID)) {
      map.addSource(SOURCE_ID, { type: 'geojson', data });
    } else {
      (map.getSource(SOURCE_ID) as GeoJSONSource).setData(data);
    }

    if (!map.getLayer(CIRCLES_LAYER_ID)) {
      map.addLayer(
        {
          id: CIRCLES_LAYER_ID,
          type: 'circle',
          source: SOURCE_ID,
          paint: {
            'circle-radius': [
              'case',
              ['get', 'selected'],
              12,
              8,
            ],
            'circle-color': isDark ? circleColorExpressionDark : circleColorExpression,
            'circle-stroke-width': [
              'case',
              ['get', 'selected'],
              2.5,
              1.5,
            ],
            'circle-stroke-color': isDark ? circleStrokeColorExpressionDark : circleStrokeColorExpression,
            'circle-emissive-strength': 1,
          },
        },
        beforeId
      );

      map.on('click', CIRCLES_LAYER_ID, (e) => {
        const f = e.features?.[0];
        const id = f?.properties?.id;
        if (typeof id === 'string') onPinClickBySpotId(id);
      });
      map.on('mouseenter', CIRCLES_LAYER_ID, () => {
        map.getCanvas().style.cursor = 'pointer';
      });
      map.on('mouseleave', CIRCLES_LAYER_ID, () => {
        map.getCanvas().style.cursor = '';
      });
    }

    if (!map.getLayer(DEFAULT_PLUS_LAYER_ID)) {
      map.addLayer(
        {
          id: DEFAULT_PLUS_LAYER_ID,
          type: 'symbol',
          source: SOURCE_ID,
          layout: {
            'text-field': '+',
            'text-size': [
              'case',
              ['get', 'selected'],
              16,
              14,
            ],
            'text-font': ['literal', LABEL_FONT_STACK_STRONG],
            'text-allow-overlap': true,
            'text-ignore-placement': true,
            'text-anchor': 'center',
          },
          paint: {
            'text-color': '#131A24',
            'text-halo-color': 'rgba(255,255,255,0.25)',
            'text-halo-width': 0.8,
          },
          filter: ['==', ['get', 'pinStatus'], 'default'],
        },
        beforeId
      );
    }

    if (showMakiIcon) {
      if (!map.getLayer(MAKIS_LAYER_ID)) {
        map.addLayer(
          {
            id: MAKIS_LAYER_ID,
            type: 'symbol',
            source: SOURCE_ID,
            layout: {
              // Resolved icon id (real sprite if available, otherwise flowya fallback id).
              'icon-image': ['get', 'makiIcon'],
              'icon-size': [
                'case',
                ['get', 'selected'],
                0.95,
                0.8,
              ],
              'text-allow-overlap': true,
              'icon-allow-overlap': true,
              'icon-ignore-placement': true,
              'icon-anchor': 'center',
            },
            filter: ['in', ['get', 'pinStatus'], ['literal', ['to_visit', 'visited']]],
          },
          beforeId
        );
      }
    } else if (map.getLayer(MAKIS_LAYER_ID)) {
      map.removeLayer(MAKIS_LAYER_ID);
    }

    const labelStyle = isDark ? MAPBOX_LABEL_STYLE_DARK : MAPBOX_LABEL_STYLE_LIGHT;
    const strongLabelHaloColor = isDark ? 'rgba(0,0,0,0.34)' : 'rgba(255,255,255,0.55)';
    const textSizeExpression: [string, ...unknown[]] = [
      'case',
      ['get', 'selected'],
      labelStyle.textSize + 1,
      labelStyle.textSize,
    ];
    // Pin seleccionado crece; el offset acompaña para mantener separación visual estable.
    const textOffsetExpression: [string, ...unknown[]] = [
      'case',
      ['get', 'selected'],
      ['literal', [0, 1.08]],
      ['literal', [0, 0.94]],
    ];
    const textFontExpression: [string, ...unknown[]] = [
      'literal',
      LABEL_FONT_STACK_STRONG,
    ];
    const textColorExpression = buildLabelTextColorExpression('#A6BFD8', labelStyle.textColor);
    const textHaloColorExpression = buildLabelHaloColorExpression('rgba(15, 26, 41, 0.88)', strongLabelHaloColor);
    const textHaloWidthExpression = buildLabelHaloWidthExpression(0.62, 1.15);
    if (!map.getLayer(LABELS_LAYER_ID)) {
      map.addLayer(
        {
          id: LABELS_LAYER_ID,
          type: 'symbol',
          source: SOURCE_ID,
          minzoom: LABEL_MIN_ZOOM,
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
    } else {
      map.setLayoutProperty(LABELS_LAYER_ID, 'text-size', textSizeExpression);
      map.setLayoutProperty(LABELS_LAYER_ID, 'text-offset', textOffsetExpression);
      map.setLayoutProperty(LABELS_LAYER_ID, 'text-font', textFontExpression);
      map.setPaintProperty(LABELS_LAYER_ID, 'text-color', textColorExpression);
      map.setPaintProperty(LABELS_LAYER_ID, 'text-halo-color', textHaloColorExpression);
      map.setPaintProperty(LABELS_LAYER_ID, 'text-halo-width', textHaloWidthExpression);
      map.setLayoutProperty(LABELS_LAYER_ID, 'visibility', showLabels ? 'visible' : 'none');
    }
  } catch {
    // ignore style/layer errors
  }
}

export function updateSpotsLayerData(
  map: MapboxMap,
  spots: SpotForLayer[],
  selectedSpotId: string | null,
  zoom: number,
  showLabels: boolean
): void {
  try {
    const source = map.getSource(SOURCE_ID) as GeoJSONSource | undefined;
    if (source) {
      const availableImageIds = new Set(map.listImages());
      source.setData(spotsToGeoJSON(spots, selectedSpotId, zoom, availableImageIds));
    }
    if (map.getLayer(LABELS_LAYER_ID)) {
      map.setLayoutProperty(LABELS_LAYER_ID, 'visibility', showLabels ? 'visible' : 'none');
    }
  } catch {
    // ignore
  }
}
