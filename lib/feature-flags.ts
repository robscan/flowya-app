/**
 * Feature flags (Phase A scaffolding).
 * Defaults are OFF salvo flags consolidadas de mapa (maki + hideLinkedUnsaved), que van ON por defecto.
 */

function envEnabled(name: string, defaultValue = false): boolean {
  const raw = (process.env[name] ?? '').trim().toLowerCase();
  if (!raw) return defaultValue;
  return raw === 'true';
}

export const featureFlags = {
  linkOnEditSave: envEnabled('EXPO_PUBLIC_FF_LINK_ON_EDIT_SAVE'),
  hideLinkedUnsaved: envEnabled('EXPO_PUBLIC_FF_HIDE_LINKED_UNSAVED', true),
  flowyaPinMakiIcon: envEnabled('EXPO_PUBLIC_FF_FLOWYA_PIN_MAKI_ICON', true),
  mapLandmarkLabels: envEnabled('EXPO_PUBLIC_FF_MAP_LANDMARK_LABELS', true),
  /** ON por defecto: Search Box API devuelve POIs/landmarks; Geocoding v6 solo direcciones. */
  searchExternalPoiResults: envEnabled('EXPO_PUBLIC_FF_SEARCH_EXTERNAL_POI_RESULTS', true),
  searchMixedRanking: envEnabled('EXPO_PUBLIC_FF_SEARCH_MIXED_RANKING'),
  searchExternalDedupe: envEnabled('EXPO_PUBLIC_FF_SEARCH_EXTERNAL_DEDUPE'),
} as const;
