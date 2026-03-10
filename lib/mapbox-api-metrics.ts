/**
 * Instrumentación temporal para investigación OL-SEARCHV2-002.
 * Registrar llamadas a APIs Mapbox para cuantificar consumo.
 *
 * Uso: llamar recordMapboxApiCall() justo antes de cada fetch a Mapbox.
 * Inspección: getMapboxApiMetricsSnapshot(). En dev con EXPO_PUBLIC_DEBUG_MAPBOX_METRICS=true
 * también en globalThis.__flowyaMapboxApiMetrics (acotado a debug para minimizar superficie).
 *
 * Referencia: docs/ops/investigation/OL_SEARCHV2_002_API_INVENTORY_2026-03-09.md
 */

export type MapboxEndpoint =
  | 'geocode/v6/reverse'
  | 'geocode/v6/forward'
  | 'searchbox/v1/forward'
  | 'searchbox/v1/category';

export type MapboxApiCaller =
  | 'resolveAddress'
  | 'reverseGeocode'
  | 'resolvePlaceNameAtCoords'
  | 'resolvePlaceForCreate'
  | 'searchPlaces'
  | 'searchPlacesPOI'
  | 'searchPlacesByCategory'
  | 'resolveSpotLink';

export type MapboxApiMetricsState = {
  total: number;
  byEndpoint: Record<MapboxEndpoint, number>;
  byCaller: Record<string, number>;
  lastCall: { endpoint: MapboxEndpoint; caller: string; at: string } | null;
  updatedAt: string | null;
};

const ENDPOINTS: MapboxEndpoint[] = [
  'geocode/v6/reverse',
  'geocode/v6/forward',
  'searchbox/v1/forward',
  'searchbox/v1/category',
];

const initialState = (): MapboxApiMetricsState => ({
  total: 0,
  byEndpoint: ENDPOINTS.reduce((acc, e) => ({ ...acc, [e]: 0 }), {} as Record<MapboxEndpoint, number>),
  byCaller: {},
  lastCall: null,
  updatedAt: null,
});

const state = initialState();

function exposeToGlobal(): void {
  if (
    typeof globalThis === 'undefined' ||
    process.env.EXPO_PUBLIC_DEBUG_MAPBOX_METRICS !== 'true'
  ) {
    return;
  }
  try {
    (globalThis as Record<string, unknown>).__flowyaMapboxApiMetrics = {
      ...state,
      byEndpoint: { ...state.byEndpoint },
      byCaller: { ...state.byCaller },
    };
  } catch {
    // ignore
  }
}

/**
 * Registrar una llamada a API Mapbox.
 * Llamar justo antes del fetch para medir consumo en sesiones de prueba.
 */
export function recordMapboxApiCall(
  endpoint: MapboxEndpoint,
  caller: MapboxApiCaller | string
): void {
  state.total += 1;
  state.byEndpoint[endpoint] = (state.byEndpoint[endpoint] ?? 0) + 1;
  state.byCaller[caller] = (state.byCaller[caller] ?? 0) + 1;
  state.lastCall = { endpoint, caller, at: new Date().toISOString() };
  state.updatedAt = new Date().toISOString();
  exposeToGlobal();

  if (__DEV__ && process.env.EXPO_PUBLIC_DEBUG_MAPBOX_METRICS === 'true') {
    console.debug('[mapbox-api]', { endpoint, caller, total: state.total });
  }
}

export function getMapboxApiMetricsSnapshot(): MapboxApiMetricsState {
  return {
    ...state,
    byEndpoint: { ...state.byEndpoint },
    byCaller: { ...state.byCaller },
  };
}

export function resetMapboxApiMetrics(): void {
  Object.assign(state, initialState());
  exposeToGlobal();
}
