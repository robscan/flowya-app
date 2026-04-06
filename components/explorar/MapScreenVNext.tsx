/**
 * MapScreenVNext — Explorar vNext: MapCore + MapControls + sheet placeholder.
 * Sin Search, SpotCard ni CreateSpot en este PR.
 */

import "@/styles/mapbox-attribution-overrides.css";
import "@/styles/viewport-dvh.css";
import "mapbox-gl/dist/mapbox-gl.css";

import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { X } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import {
    ActivityIndicator,
    Animated,
    Easing,
    Linking,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    useWindowDimensions,
    View,
} from "react-native";
import type { TextStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ClearIconCircle } from "@/components/design-system/clear-icon-circle";
import { ExploreMapStatusRow } from "@/components/design-system/explore-map-status-row";
import { ExploreSearchActionRow } from "@/components/design-system/explore-search-action-row";
import { IconButton } from "@/components/design-system/icon-button";
import { MapPinFilterInline } from "@/components/design-system/map-pin-filter-inline";
import { TagChip } from "@/components/design-system/tag-chip";
import { MapControls } from "@/components/design-system/map-controls";
import {
    type MapPinFilterValue,
} from "@/components/design-system/map-pin-filter";
import type { SpotPinStatus } from "@/components/design-system/map-pins";
import { SearchListCard } from "@/components/design-system/search-list-card";
import { SearchResultCard, type SearchResultCardProps } from "@/components/design-system/search-result-card";
import { TypographyStyles } from "@/components/design-system/typography";
import { CreateSpotNameOverlay } from "@/components/explorar/CreateSpotNameOverlay";
import {
  CountriesSheet,
  type CountriesSheetListDetail,
  type CountriesSheetState,
} from "@/components/explorar/CountriesSheet";
import { EXPLORE_LAYER_Z } from "@/components/explorar/layer-z";
import { MapCoreView } from "@/components/explorar/MapCoreView";
import {
  ExploreWelcomeSheet,
  type ExploreWelcomeSheetState,
  type WelcomeBrowseItem,
} from "@/components/explorar/ExploreWelcomeSheet";
import { SHEET_PEEK_HEIGHT, SpotSheet } from "@/components/explorar/SpotSheet";
import { SearchFloating } from "@/components/search";
import type { SearchSection } from "@/components/search";
import { ImageFullscreenModal } from "@/components/design-system/image-fullscreen-modal";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { DuplicateSpotModal } from "@/components/ui/duplicate-spot-modal";
import { FlowyaBetaModal } from "@/components/ui/flowya-beta-modal";
import { CreateSpotConfirmModal } from "@/components/ui/create-spot-confirm-modal";
import { useSystemStatus } from "@/components/ui/system-status-bar";
import { AUTH_MODAL_MESSAGES, useAuthModal } from "@/contexts/auth-modal";
import { useSearchControllerV2, type UseSearchControllerV2Return } from "@/hooks/search/useSearchControllerV2";
import { useSearchHistory } from "@/hooks/search/useSearchHistory";
import { Colors, Radius, Spacing } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { getCurrentLanguage, getCurrentLocale } from "@/lib/i18n/locale-config";
import { useMapCore } from "@/hooks/useMapCore";
import { featureFlags } from "@/lib/feature-flags";
import {
    blurActiveElement,
    saveFocusBeforeNavigate,
} from "@/lib/focus-management";
import { distanceKm, formatDistanceKm, getMapsDirectionsUrl } from "@/lib/geo-utils";
import { resolveAddress } from "@/lib/mapbox-geocoding";
import {
  applyExploreCameraForPlace,
  applyPlaceReframeCycle,
  placeResultFromSpotForCamera,
} from "@/lib/places/areaFraming";
import { searchPlaces, type PlaceResult } from "@/lib/places/searchPlaces";
import {
  placeResultV2ToLegacy,
  searchPlacesPOI,
  type PlaceResultV2,
} from "@/lib/places/searchPlacesPOI";
import {
  WEB_SHEET_MAX_WIDTH,
  webSearchUsesConstrainedPanelWidth,
} from "@/lib/web-layout";
import {
    FIT_BOUNDS_PADDING,
    FIT_BOUNDS_DURATION_MS,
    FALLBACK_VIEW,
    FLOWYA_MAP_STYLE_DARK,
    FLOWYA_MAP_STYLE_LIGHT,
    GLOBE_ZOOM_INITIAL,
    GLOBE_ZOOM_WORLD,
    INITIAL_BEARING,
    INITIAL_PITCH,
    SPOT_FOCUS_ZOOM,
    getLabelLayerIds,
    getLabelLayerScore,
    SPOTS_ZONA_RADIUS_KM,
    isPointVisibleInViewport,
} from "@/lib/map-core/constants";
import {
    getCurrentUserId,
    getPinsForSpots,
    setPinState,
    setSaved,
    setVisited,
} from "@/lib/pins";
import { createSpotsStrategyProvider } from "@/core/shared/search/providers/spotsStrategyProvider";
import { onlyVisible } from "@/core/shared/visibility-softdelete";
import {
  INITIAL_EXPLORE_RUNTIME_STATE,
  RECENT_MUTATION_TTL_MS,
  exploreRuntimeReducer,
  resolveFilterTransitionPolicy,
  shouldClearSelectedSpotOnFilterChange,
  shouldMarkPendingBadge,
  shouldRestoreSelectionOnSearchClose,
  type ExploreSheetState,
  validateExploreRuntimeState,
} from "@/core/explore/runtime";
import { shareSpot } from "@/lib/share-spot";
import { checkDuplicateSpot, DEFAULT_DUPLICATE_RADIUS_METERS } from "@/lib/spot-duplicate-check";
import { optimizeSpotImage } from "@/lib/spot-image-optimize";
import { uploadSpotCover } from "@/lib/spot-image-upload";
import {
  classifyTappedFeatureKind,
  dedupeExternalPlacesAgainstSpots,
  getDisplayNameForPlace,
  getStablePlaceId,
  getTappedFeatureId,
  getTappedFeatureMaki,
  getTappedFeatureNameByLocale,
  inferTappedKindFromPlace,
  mergeSearchResults,
  filterExploreSearchItemsByTag,
  rankExternalPlacesByIntent,
  type TappedMapFeatureKind,
  resolveTappedSpotMatch,
} from "@/lib/explore/map-screen-orchestration";
import {
  recordCreateFromSearchResult,
  recordExternalFetchMetric,
  recordSearchExternalClick,
  recordSearchNoResults,
  recordSearchSpotClick,
  recordSearchStarted,
} from "@/lib/search/metrics";
import {
  collectVisibleLandmarks,
  mergeEmptyExternalPlaces,
} from "@/lib/search/emptyRecommendations";
import { buildColdStartWorldSections } from "@/lib/search/coldStartWorldRecommendations";
import { EXPLORE_WELCOME_FALLBACK_SPOT_IDS } from "@/lib/search/exploreWelcomeFallbackSpotIds";
import {
  fetchMostVisitedSpots,
  fetchSpotsByIdsForExploreWelcome,
  type FlowyaPopularSpot,
} from "@/lib/search/flowyaPopularSpots";
import {
  recordExploreDecisionCompleted,
  recordExploreDecisionStarted,
  recordExploreSelectionChanged,
} from "@/lib/explore/decision-metrics";
import { shareCountriesCard } from "@/lib/share-countries-card";
import { SPOT_LINK_VERSION } from "@/lib/spot-linking/resolveSpotLink";
import {
    addRecentViewedSpotId,
    getRecentViewedSpotIds,
    loadRecentViewedSpotIdsAsync,
} from "@/lib/storage/recentViewedSpots";
import {
  getMapPinPendingBadges,
  loadMapPinPendingBadgesAsync,
  setMapPinPendingBadges,
} from "@/lib/storage/mapPinPendingBadges";
import {
  getMapPinFilterPreference,
  loadMapPinFilterPreferenceAsync,
  setMapPinFilterPreference,
} from "@/lib/storage/mapPinFilterPreference";
import { computeTravelerPoints } from "@/lib/traveler-levels";
import { supabase } from "@/lib/supabase";
import {
    attachTagToSpot,
    countTagsInSpotIds,
    createOrGetUserTag,
    deleteUserTag,
    detachTagFromSpot,
    fetchPinTagsIndexForSession,
    listUserTags,
    type UserTagRow,
} from "@/lib/tags";

type Spot = {
  id: string;
  title: string;
  description_short: string | null;
  description_long: string | null;
  cover_image_url: string | null;
  address: string | null;
  latitude: number;
  longitude: number;
  saved: boolean;
  visited: boolean;
  link_status?: "linked" | "uncertain" | "unlinked" | null;
  linked_place_id?: string | null;
  linked_place_kind?: "poi" | "landmark" | null;
  linked_maki?: string | null;
  /** Encuadre Mapbox al re-seleccionar spot (mismo criterio que búsqueda). */
  mapbox_bbox?: { west: number; south: number; east: number; north: number } | null;
  mapbox_feature_type?: string | null;
  /** Derivado de saved/visited para map-pins (visited > saved > default). */
  pinStatus?: SpotPinStatus;
  /** OL-EXPLORE-TAGS-001: ids de user_tags (búsqueda / índice en cliente). */
  tagIds?: string[];
};

/** Spots Flowya en filas de lista vacía (mezcla con PlaceResult) — solo IDs reales para conteo de chips. */
function collectSpotIdsFromBrowseEmptyItems(items: (Spot | PlaceResult)[]): Set<string> {
  const ids = new Set<string>();
  for (const item of items) {
    if (!("latitude" in item) || !("title" in item)) continue;
    const id = (item as Spot).id;
    if (typeof id === "string" && id.length > 0 && !id.startsWith("draft_")) ids.add(id);
  }
  return ids;
}

type TappedMapFeatureVisualState = "default" | "to_visit";

type TappedMapFeature = {
  name: string;
  lat: number;
  lng: number;
  kind: TappedMapFeatureKind;
  placeId: string | null;
  maki: string | null;
  visualState: TappedMapFeatureVisualState;
  source: "map_tap" | "search_suggestion";
  bbox?: { west: number; south: number; east: number; north: number };
  featureType?: string | null;
};

/**
 * POI desde tap en mapa no trae bbox en tiles; forward geocode (mismo motor que búsqueda) para persistir mapbox_bbox.
 */
async function resolveFramingForMapTapPoi(poi: TappedMapFeature): Promise<{
  bbox: Spot["mapbox_bbox"];
  featureType: string | null;
}> {
  if (poi.bbox) {
    return { bbox: poi.bbox, featureType: poi.featureType ?? null };
  }
  if (poi.source !== "map_tap") {
    return { bbox: null, featureType: poi.featureType ?? null };
  }
  try {
    const places = await searchPlaces(poi.name, {
      limit: 1,
      proximity: { lat: poi.lat, lng: poi.lng },
    });
    const top = places[0];
    if (top?.bbox) {
      return { bbox: top.bbox, featureType: top.featureType ?? null };
    }
  } catch {
    /* fail-open */
  }
  return { bbox: null, featureType: poi.featureType ?? null };
}

type CountryBucket = {
  key: string;
  label: string;
  count: number;
};

/** Columnas al cargar un spot para mapa + encuadre (fitBounds con mapbox_bbox). */
const SPOT_SELECT_FOR_MAP =
  "id, title, description_short, description_long, cover_image_url, address, latitude, longitude, link_status, linked_place_id, linked_place_kind, linked_maki, mapbox_bbox, mapbox_feature_type";

const COUNTRY_ALIAS_OVERRIDES: Record<string, string> = {
  "united states of america": "US",
  "ee uu": "US",
  "u s a": "US",
  uk: "GB",
  "united kingdom": "GB",
};
const cachedCountryAliasIndexByLocale = new Map<string, Map<string, string>>();
const cachedRegionDisplayByLocale = new Map<string, Intl.DisplayNames | null>();

function normalizeCountryLabel(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.length === 0) return "";
  const normalized = trimmed
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .toLowerCase();
  return normalized
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function normalizeCountryToken(raw: string): string {
  return raw
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[.'’`]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function getRegionDisplay(locale: string): Intl.DisplayNames | null {
  const cached = cachedRegionDisplayByLocale.get(locale);
  if (cached !== undefined) return cached;
  try {
    const display = new Intl.DisplayNames([locale], { type: "region" });
    cachedRegionDisplayByLocale.set(locale, display);
    return display;
  } catch {
    cachedRegionDisplayByLocale.set(locale, null);
    return null;
  }
}

function buildCountryAliasIndex(locale: string): Map<string, string> {
  const cached = cachedCountryAliasIndexByLocale.get(locale);
  if (cached) return cached;
  const alias = new Map<string, string>();
  const indexLocales = [locale, "en"];
  for (let i = 65; i <= 90; i += 1) {
    for (let j = 65; j <= 90; j += 1) {
      const code = `${String.fromCharCode(i)}${String.fromCharCode(j)}`;
      for (const indexLocale of indexLocales) {
        const display = getRegionDisplay(indexLocale);
        if (!display) continue;
        const label = display.of(code);
        if (!label) continue;
        const normalized = normalizeCountryToken(label);
        if (!normalized || normalized === normalizeCountryToken(code)) continue;
        if (normalized.includes("unknown region") || normalized.includes("region desconocida")) continue;
        if (!alias.has(normalized)) alias.set(normalized, code);
      }
    }
  }
  for (const [token, code] of Object.entries(COUNTRY_ALIAS_OVERRIDES)) {
    alias.set(normalizeCountryToken(token), code);
  }
  cachedCountryAliasIndexByLocale.set(locale, alias);
  return alias;
}

function resolveCountryFromToken(raw: string): { key: string; label: string } {
  const normalizedToken = normalizeCountryToken(raw);
  if (!normalizedToken) return { key: "name:unknown", label: normalizeCountryLabel(raw) };
  const locale = getCurrentLanguage();
  const code = buildCountryAliasIndex(locale).get(normalizedToken);
  if (code) {
    const display = getRegionDisplay(getCurrentLocale()) ?? getRegionDisplay(locale);
    const localized = display?.of(code);
    if (localized && normalizeCountryToken(localized) !== normalizeCountryToken(code)) {
      return { key: `iso:${code}`, label: localized };
    }
  }
  return { key: `name:${normalizedToken}`, label: normalizeCountryLabel(raw) };
}

function extractCountryFromSpotAddress(address: string | null | undefined): string | null {
  if (!address) return null;
  const parts = address
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length === 0) return null;
  const candidate = normalizeCountryLabel(parts[parts.length - 1] ?? "");
  if (candidate.length < 2) return null;
  if (/\d/.test(candidate)) return null;
  return candidate;
}

function resolveCountryForSpot(spot: Spot): { key: string; label: string } | null {
  const token = extractCountryFromSpotAddress(spot.address);
  if (!token) return null;
  return resolveCountryFromToken(token);
}

function buildCountryBuckets(spots: Spot[]): CountryBucket[] {
  const buckets = new Map<string, CountryBucket>();
  for (const spot of spots) {
    const resolved = resolveCountryForSpot(spot);
    if (!resolved) continue;
    const key = resolved.key;
    const previous = buckets.get(key);
    if (previous) {
      previous.count += 1;
      continue;
    }
    buckets.set(key, { key, label: resolved.label, count: 1 });
  }
  return [...buckets.values()].sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count;
    return a.label.localeCompare(b.label, "es");
  });
}

function isLinkedUnsavedSpot(spot: Spot): boolean {
  // Guardrail Fase D: si falta linked_place_id, no ocultar para evitar desaparición de lugar.
  return (
    spot.link_status === "linked" &&
    typeof spot.linked_place_id === "string" &&
    spot.linked_place_id.trim().length > 0 &&
    !spot.saved &&
    !spot.visited
  );
}

function isDefaultLinkedPoiSpot(spot: Spot): boolean {
  const hasLinkedPlace =
    typeof spot.linked_place_id === "string" && spot.linked_place_id.trim().length > 0;
  return hasLinkedPlace && !spot.saved && !spot.visited;
}

function isCoreDefaultUnlinkedSpot(spot: Spot): boolean {
  const hasLinkedPlace =
    typeof spot.linked_place_id === "string" && spot.linked_place_id.trim().length > 0;
  return !hasLinkedPlace && !spot.saved && !spot.visited;
}

function hasLinkedPlaceId(spot: Spot | null): boolean {
  if (!spot) return false;
  return typeof spot.linked_place_id === "string" && spot.linked_place_id.trim().length > 0;
}

function resolveAccountDisplayLabel(user: {
  email?: string | null;
  user_metadata?: Record<string, unknown> | null;
} | null): string {
  if (!user) return "usuario";
  const metadata = user.user_metadata ?? {};
  const usernameCandidate =
    metadata.username ??
    metadata.preferred_username ??
    metadata.full_name ??
    metadata.name;
  if (typeof usernameCandidate === "string" && usernameCandidate.trim().length > 0) {
    return usernameCandidate.trim();
  }
  if (typeof user.email === "string" && user.email.trim().length > 0) {
    const email = user.email.trim();
    const [localRaw, domainRaw] = email.split("@");
    if (!localRaw || !domainRaw) return "usuario";
    const domainParts = domainRaw.split(".");
    const hostRaw = domainParts[0] ?? "";
    const tldRaw = domainParts.slice(1).join(".") || "";
    const host =
      hostRaw.length <= 2
        ? `${hostRaw[0] ?? "*"}***`
        : `${hostRaw[0]}***${hostRaw[hostRaw.length - 1]}`;
    const tld =
      tldRaw.length <= 2
        ? `${tldRaw[0] ?? "*"}**`
        : `${tldRaw[0]}**${tldRaw[tldRaw.length - 1]}`;
    return `${localRaw}@${host}.${tld}`;
  }
  return "usuario";
}

const MAPBOX_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_TOKEN ?? "";
const MAP_PIN_CAP = 500;
const SELECTED_PIN_HIT_RADIUS = 24;
const CONTROLS_OVERLAY_BOTTOM = 20;
const CONTROLS_OVERLAY_RIGHT = 16;
const MAP_CONTROL_BUTTON_SIZE = 44;
const COUNTRIES_COUNTER_SIZE = 64;
const COUNTRIES_AND_CONTROLS_GAP = 20;
const COUNTRIES_SLOT_RESERVED = COUNTRIES_COUNTER_SIZE + COUNTRIES_AND_CONTROLS_GAP;
const COUNTRIES_CENTER_ALIGNMENT_OFFSET =
  Math.round((COUNTRIES_COUNTER_SIZE - MAP_CONTROL_BUTTON_SIZE) / 2);
// Debe aproximar el alto real de 2 IconButton + gap para evitar "jump" en primer render.
const MAP_CONTROLS_FALLBACK_HEIGHT = 100;
const FILTER_OVERLAY_TOP = 28;
const TOP_OVERLAY_INSET_X = 16;
const TOP_OVERLAY_INSET_Y = 28;
const BOTTOM_ACTION_ROW_BOTTOM_GUTTER = 16;
const BOTTOM_ACTION_ROW_CLEARANCE = 56;
const FLOWYA_STACK_CLEARANCE = 108;
const FLOWYA_ABOVE_ROW_GAP = 12;
const FLOWYA_ABOVE_PEEK_SHEET_GAP = 12;
/** Alto aproximado de la fila FLOWYA + ExploreCountriesFlowsPill (evitar solape con MapControls en peek). */
const FLOWYA_STATUS_ROW_HEIGHT_ESTIMATE = 48;
/** Separación entre la parte superior de esa fila y el borde inferior de la columna de controles. */
const MAP_CONTROLS_CLEARANCE_ABOVE_FLOWYA_ROW = 10;
/** Ergonomía pulgar: desplaza overlays centrados ligeramente hacia abajo. */
const THUMB_FRIENDLY_CENTER_BIAS = 56;
/** Mantiene separación legible entre subtítulos de estado y el borde del sheet. */
const STATUS_OVER_SHEET_CLEARANCE = 18;
const FILTER_TRIGGER_ESTIMATED_HEIGHT = 56;
const FILTER_OVERLAY_ENTRY_DELAY_MS = 180;
const FILTER_OVERLAY_ENTRY_DURATION_MS = 320;
const FILTER_WAIT_FOR_CAMERA_FALLBACK_MS = 1600;
const FILTER_WAIT_RELEASE_DELAY_MS = 70;
/** Reserva lateral para no invadir la columna de MapControls en pantallas angostas. */
const STATUS_AVOID_CONTROLS_RIGHT = 64;
/** Retardo para priorizar lectura de subtítulos antes de mostrar contador de países. */
const COUNTRIES_OVERLAY_ENTRY_DELAY_MS = 320;
const MAP_CONTROLS_OVERLAY_ENTRY_DELAY_MS = 80;
const FLOWYA_SLOGAN_ENTRY_DELAY_MS = 780;
const FLOWYA_SLOGAN_FADE_IN_MS = 1450;
const FLOWYA_SLOGAN_HOLD_MS = 2400;
const FLOWYA_SLOGAN_FADE_OUT_MS = 980;
const FLOWYA_SLOGAN_RISE_IN_PX = 18;

function dedupePlaceResults(items: PlaceResult[]): PlaceResult[] {
  const seen = new Set<string>();
  const out: PlaceResult[] = [];
  for (const item of items) {
    const key = `${item.id}:${item.name.trim().toLowerCase()}:${item.lat.toFixed(
      5,
    )}:${item.lng.toFixed(5)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

/** OL-WOW-F2-002: inferir landmark desde maki/categories/featureType. */
function isPlaceLandmark(place: PlaceResult): boolean {
  const maki = (place.maki ?? "").toLowerCase();
  const ft = (place.featureType ?? "").toLowerCase();
  const cats = (place.categories ?? []).map((c) => String(c).toLowerCase());
  const landmarkTokens = ["landmark", "monument", "museum", "religious", "historic"];
  if (ft.includes("landmark")) return true;
  if (landmarkTokens.some((t) => maki.includes(t))) return true;
  if (cats.some((c) => landmarkTokens.some((t) => c.includes(t)))) return true;
  return false;
}

export function MapScreenVNext() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const { openAuthModal } = useAuthModal();
  const toast = useSystemStatus();
  const suppressToastRef = useRef(false);
  /** Solo para toast de cambio de filtro: evitar solapar con sheet en expanded (se actualiza más abajo en el render). */
  const filterChangeToastSuppressedRef = useRef(false);
  const [spots, setSpots] = useState<Spot[]>([]);
  const [selectedSpot, setSelectedSpot] = useState<Spot | null>(null);
  const [runtimeState, dispatchRuntimeIntent] = useReducer(
    exploreRuntimeReducer,
    INITIAL_EXPLORE_RUNTIME_STATE,
    (initial) => ({
      ...initial,
      pinFilter: getMapPinFilterPreference(),
    }),
  );
  const pinFilter = runtimeState.pinFilter;
  const sheetState = runtimeState.sheetState;
  const recentlyMutatedSpotId = runtimeState.recentlyMutatedSpotId;
  const recentMutationUntil = runtimeState.recentMutationUntil;
  const setPinFilter = useCallback((nextFilter: MapPinFilterValue) => {
    dispatchRuntimeIntent({
      type: "EXPLORE_RUNTIME/SET_PIN_FILTER",
      filter: nextFilter,
    });
  }, []);
  const setSheetState = useCallback((nextState: ExploreSheetState) => {
    dispatchRuntimeIntent({
      type: "EXPLORE_RUNTIME/SET_SHEET_STATE",
      sheetState: nextState,
    });
  }, []);
  const setRecentMutation = useCallback(
    (spotId: string, originFilter: MapPinFilterValue) => {
      dispatchRuntimeIntent({
        type: "EXPLORE_RUNTIME/SET_RECENT_MUTATION",
        spotId,
        until: Date.now() + RECENT_MUTATION_TTL_MS,
        originFilter,
      });
    },
    [],
  );
  const clearRecentMutation = useCallback(() => {
    dispatchRuntimeIntent({ type: "EXPLORE_RUNTIME/CLEAR_RECENT_MUTATION" });
  }, []);
  const [pendingFilterBadges, setPendingFilterBadges] = useState<{
    saved: boolean;
    visited: boolean;
  }>(() => getMapPinPendingBadges());
  const [recentViewedIds, setRecentViewedIds] = useState<string[]>(() => getRecentViewedSpotIds());
  const updatePendingFilterBadges = useCallback(
    (
      updater: (prev: { saved: boolean; visited: boolean }) => {
        saved: boolean;
        visited: boolean;
      },
    ) => {
      setPendingFilterBadges((prev) => {
        const next = updater(prev);
        setMapPinPendingBadges(next);
        return next;
      });
    },
    [],
  );
  const [, setPinFilterPulseNonce] = useState(0);
  const [isAuthUser, setIsAuthUser] = useState(false);
  const [userTags, setUserTags] = useState<UserTagRow[]>([]);
  const [pinTagIndex, setPinTagIndex] = useState<Record<string, string[]>>({});
  const [selectedTagFilterId, setSelectedTagFilterId] = useState<string | null>(null);
  const [tagFilterEditMode, setTagFilterEditMode] = useState(false);
  const [tagDeleteConfirm, setTagDeleteConfirm] = useState<{ id: string; name: string } | null>(null);
  const [tagDeleteBusy, setTagDeleteBusy] = useState(false);
  const [tagAssignSpot, setTagAssignSpot] = useState<Spot | null>(null);
  const [tagAssignInput, setTagAssignInput] = useState("");
  const [tagAssignSaving, setTagAssignSaving] = useState(false);
  const [showLogoutOption, setShowLogoutOption] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const countriesOverlayEntry = useRef(new Animated.Value(0)).current;
  const filterOverlayEntry = useRef(new Animated.Value(0)).current;
  const sloganEntryOpacity = useRef(new Animated.Value(0)).current;
  const sloganEntryTranslateY = useRef(new Animated.Value(FLOWYA_SLOGAN_RISE_IN_PX)).current;
  const sloganEntryAnimationRef = useRef<Animated.CompositeAnimation | null>(null);
  const [showEntrySlogan, setShowEntrySlogan] = useState(true);
  const filterOverlayHasAnimatedInRef = useRef(false);
  const [isFilterWaitingForCamera, setIsFilterWaitingForCamera] = useState(true);
  const filterWaitActiveRef = useRef(true);
  const filterWaitFallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const globeEntryMotionPlayedRef = useRef(false);
  const globeEntryMotionInFlightRef = useRef(false);
  const globeEntryMotionDelayRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isGlobeEntryMotionSettled, setIsGlobeEntryMotionSettled] = useState(false);

  useEffect(() => {
    sloganEntryAnimationRef.current?.stop();
    sloganEntryOpacity.setValue(0);
    sloganEntryTranslateY.setValue(FLOWYA_SLOGAN_RISE_IN_PX);
    setShowEntrySlogan(true);
    const sequence = Animated.sequence([
      Animated.delay(FLOWYA_SLOGAN_ENTRY_DELAY_MS),
      Animated.parallel([
        Animated.timing(sloganEntryOpacity, {
          toValue: 1,
          duration: FLOWYA_SLOGAN_FADE_IN_MS,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: Platform.OS !== "web",
        }),
        Animated.timing(sloganEntryTranslateY, {
          toValue: 0,
          duration: FLOWYA_SLOGAN_FADE_IN_MS,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: Platform.OS !== "web",
        }),
      ]),
      Animated.delay(FLOWYA_SLOGAN_HOLD_MS),
      Animated.timing(sloganEntryOpacity, {
        toValue: 0,
        duration: FLOWYA_SLOGAN_FADE_OUT_MS,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: Platform.OS !== "web",
      }),
    ]);
    sloganEntryAnimationRef.current = sequence;
    sequence.start(({ finished }) => {
      if (!finished) return;
      setShowEntrySlogan(false);
    });
    return () => {
      sloganEntryAnimationRef.current?.stop();
      sloganEntryAnimationRef.current = null;
      sloganEntryOpacity.stopAnimation();
      sloganEntryTranslateY.stopAnimation();
    };
  }, [sloganEntryOpacity, sloganEntryTranslateY]);

  const dismissEntrySlogan = useCallback(() => {
    sloganEntryAnimationRef.current?.stop();
    sloganEntryAnimationRef.current = null;
    sloganEntryOpacity.stopAnimation();
    sloganEntryTranslateY.stopAnimation();
    sloganEntryOpacity.setValue(0);
    sloganEntryTranslateY.setValue(FLOWYA_SLOGAN_RISE_IN_PX);
    setShowEntrySlogan(false);
  }, [sloganEntryOpacity, sloganEntryTranslateY]);

  const [pinFilterStorageReady, setPinFilterStorageReady] = useState(
    () => Platform.OS === "web",
  );

  useEffect(() => {
    if (!pinFilterStorageReady) return;
    setMapPinFilterPreference(pinFilter);
  }, [pinFilter, pinFilterStorageReady]);

  useEffect(() => {
    if (Platform.OS === "web") return;
    let cancelled = false;
    void (async () => {
      try {
        const pf = await loadMapPinFilterPreferenceAsync();
        if (!cancelled) setPinFilter(pf);
      } catch {
        // Si falla lectura de storage, habilitar persistencia con valor en memoria.
      } finally {
        if (!cancelled) setPinFilterStorageReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [setPinFilter]);

  useEffect(() => {
    if (Platform.OS === "web") return;
    let cancelled = false;
    void loadMapPinPendingBadgesAsync().then((badges) => {
      if (!cancelled) setPendingFilterBadges(badges);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (Platform.OS === "web") return;
    let cancelled = false;
    void loadRecentViewedSpotIdsAsync().then((ids) => {
      if (!cancelled) setRecentViewedIds(ids);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const pushRecentViewedSpotId = useCallback((spotId: string) => {
    addRecentViewedSpotId(spotId);
    if (Platform.OS === "web") {
      setRecentViewedIds(getRecentViewedSpotIds());
    } else {
      void loadRecentViewedSpotIdsAsync().then(setRecentViewedIds);
    }
  }, []);

  const prevSpotIdsRef = useRef<Set<string>>(new Set());
  const prevSelectedSpotRef = useRef<Spot | null>(null);
  const prevSheetStateRef = useRef<ExploreSheetState>("peek");
  const prevPinFilterRef = useRef<MapPinFilterValue>(pinFilter);
  const preserveOutOfFilterSelectionSpotIdRef = useRef<string | null>(null);
  /** Deep link / post-edit: mantener filtro activo; si el spot no encaja, preservar selección (no forzar Todos). */
  const ensureSpotVisibleWithActiveFilter = useCallback(
    (spot: Spot) => {
      const matches =
        pinFilter === "all" ||
        (pinFilter === "saved" && spot.saved) ||
        (pinFilter === "visited" && spot.visited) ||
        isCoreDefaultUnlinkedSpot(spot);
      if (!matches) {
        preserveOutOfFilterSelectionSpotIdRef.current = spot.id;
        setRecentMutation(spot.id, pinFilter);
      }
    },
    [pinFilter, setRecentMutation],
  );
  const lastStatusSpotIdRef = useRef<{
    saved: string | null;
    visited: string | null;
  }>({
    saved: null,
    visited: null,
  });
  const searchFilterRefreshRef = useRef<MapPinFilterValue>(pinFilter);
  const searchTagFilterRefreshRef = useRef<string | null>(null);
  /** OL-WOW-F2-003: ref para evitar acceder a searchV2 antes de inicialización. */
  const searchIsOpenRef = useRef(false);
  const countriesSheetBeforeSearchRef = useRef<{
    wasOpen: boolean;
    state: CountriesSheetState;
  } | null>(null);
  const countriesSheetPrevSelectionRef = useRef<{
    spot: Spot | null;
    poi: TappedMapFeature | null;
  } | null>(null);
  const countriesOverlayDelayRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSearchStartKeyRef = useRef<string | null>(null);
  const lastNoResultsKeyRef = useRef<string | null>(null);
  const [sheetHeight, setSheetHeight] = useState(SHEET_PEEK_HEIGHT);
  const [countriesSheetHeight, setCountriesSheetHeight] = useState(0);
  const [showCreateSpotConfirmModal, setShowCreateSpotConfirmModal] =
    useState(false);
  const [pendingCreateSpotCoords, setPendingCreateSpotCoords] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  /** Paso 0 Create Spot: overlay "Nombre del spot" (todas las entradas pasan por aquí). */
  const [createSpotNameOverlayOpen, setCreateSpotNameOverlayOpen] = useState(false);
  const [createSpotPendingCoords, setCreateSpotPendingCoords] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [createSpotInitialName, setCreateSpotInitialName] = useState<string | undefined>(undefined);
  /** Valor actual del input en Paso 0 (para label del pin de preview). */
  const [createSpotNameValue, setCreateSpotNameValue] = useState("");
  const [placeSuggestions, setPlaceSuggestions] = useState<PlaceResult[]>([]);
  const [isSearchColdStartBootstrapActive, setIsSearchColdStartBootstrapActive] = useState(true);
  /** Tras el primer `refetchSpots` (éxito o error): deja de forzar cold-start mundial para no tapar datos locales. */
  const [spotsLoadSettled, setSpotsLoadSettled] = useState(false);
  const [flowyaPopularSpots, setFlowyaPopularSpots] = useState<FlowyaPopularSpot[]>([]);
  const coldStartSeedRef = useRef<number>(Math.floor(Math.random() * 1_000_000_000));
  const deactivateSearchColdStartBootstrap = useCallback(() => {
    setIsSearchColdStartBootstrapActive((prev) => (prev ? false : prev));
  }, []);
  const visitedSpotCoords = useMemo(
    () =>
      spots
        .filter((s) => s.visited)
        .map((s) => ({ lat: s.latitude, lng: s.longitude })),
    [spots],
  );
  const coldStartWorldSections = useMemo<SearchSection<Spot | PlaceResult>[]>(
    () =>
      buildColdStartWorldSections(coldStartSeedRef.current, {
        excludeNearVisitedSpots: visitedSpotCoords,
      }) as SearchSection<Spot | PlaceResult>[],
    [visitedSpotCoords],
  );
  /** Empty-state local: sin fallback externo; solo visibles del mapa para costo controlado. */
  const nearbyPlacesEmpty = useMemo<PlaceResult[]>(() => [], []);
  const [isPlacingDraftSpot, setIsPlacingDraftSpot] = useState(false);
  const [draftCoverUri, setDraftCoverUri] = useState<string | null>(null);
  const [showBetaModal, setShowBetaModal] = useState(false);
  const [quickDescSpot, setQuickDescSpot] = useState<Spot | null>(null);
  const [quickDescValue, setQuickDescValue] = useState("");
  const [quickDescSaving, setQuickDescSaving] = useState(false);
  const quickDescBackdropGuardUntilRef = useRef(0);
  const wasCreateSpotOverlayOpenRef = useRef(false);

  const clearFilterWaitFallbackTimer = useCallback(() => {
    if (filterWaitFallbackTimerRef.current) {
      clearTimeout(filterWaitFallbackTimerRef.current);
      filterWaitFallbackTimerRef.current = null;
    }
  }, []);

  const suspendFilterUntilCameraSettles = useCallback(
    (fallbackMs = FILTER_WAIT_FOR_CAMERA_FALLBACK_MS) => {
      filterWaitActiveRef.current = true;
      setIsFilterWaitingForCamera(true);
      clearFilterWaitFallbackTimer();
      filterWaitFallbackTimerRef.current = setTimeout(() => {
        filterWaitActiveRef.current = false;
        setIsFilterWaitingForCamera(false);
        filterWaitFallbackTimerRef.current = null;
      }, fallbackMs);
    },
    [clearFilterWaitFallbackTimer],
  );

  useEffect(() => {
    return () => {
      clearFilterWaitFallbackTimer();
    };
  }, [clearFilterWaitFallbackTimer]);

  /** 3D siempre activo (sin toggle). */
  const is3DEnabled = true;
  /** Tap en POI de Mapbox (no spot Flowya): mostrar sheet Agregar spot / Por visitar. */
  const [poiTapped, setPoiTapped] = useState<TappedMapFeature | null>(null);
  /** Ciclo encuadre mismo POI (contextual ↔ zoom general); independiente de useMapCore.reframeCycle. */
  const poiReframeCycleRef = useRef(0);
  /** Modal duplicado: Ver spot | Crear otro | Cerrar (2 pasos). */
  const [duplicateModal, setDuplicateModal] = useState<{
    existingTitle: string;
    existingSpotId: string;
    onCreateAnyway: () => void | Promise<void>;
  } | null>(null);
  const openFromSearchRef = useRef(false);
  const appliedSpotIdFromParamsRef = useRef<string | null>(null);
  const appliedCreatedIdRef = useRef<string | null>(null);
  const viewportRefreshNonceRef = useRef<number>(-1);
  const runtimeInvariant = useMemo(
    () => validateExploreRuntimeState(runtimeState),
    [runtimeState],
  );

  useEffect(() => {
    if (__DEV__ && !runtimeInvariant.ok) {
      console.warn(`[ExploreRuntime] invariant failed: ${runtimeInvariant.reason}`);
    }
  }, [runtimeInvariant]);

  const params = useLocalSearchParams<{ spotId?: string; sheet?: string; created?: string }>();
  const deepLinkCenterLockRef = useRef(
    Boolean(
      params.spotId ||
        params.created ||
        (typeof window !== "undefined" &&
          /[?&](spotId|created)=/.test(window.location?.search ?? "")),
    ),
  );
  const pendingDeepLinkFocusRef = useRef<Spot | null>(null);

  useEffect(() => {
    if (params.spotId || params.created) {
      deepLinkCenterLockRef.current = true;
    }
  }, [params.spotId, params.created]);

  /** Sync createSpotNameValue cuando abre/cierra Paso 0. */
  useEffect(() => {
    if (createSpotNameOverlayOpen) {
      setCreateSpotNameValue(createSpotInitialName?.trim() ?? "");
    } else {
      setCreateSpotNameValue("");
    }
  }, [createSpotNameOverlayOpen, createSpotInitialName]);

  useEffect(() => {
    const loadInitialAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsAuthUser(!!user && !user.is_anonymous);
    };
    loadInitialAuth();
    // Evitar async dentro del callback (AbortError con navigator.locks/Supabase). Usar session síncrona.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session?.user) {
          setIsAuthUser(!session.user.is_anonymous);
        } else {
          setIsAuthUser(false);
        }
      }
    );
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!isAuthUser) {
      setUserTags([]);
      setPinTagIndex({});
      setSelectedTagFilterId(null);
      setTagAssignSpot(null);
      setTagAssignInput("");
      setTagAssignSaving(false);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const [tags, index] = await Promise.all([listUserTags(), fetchPinTagsIndexForSession()]);
        if (!cancelled) {
          setUserTags(tags);
          setPinTagIndex(index);
        }
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isAuthUser]);

  const invalidateSpotIdRef = useRef<((spotId: string) => void) | null>(null);

  const refetchSpots = useCallback(async () => {
    try {
      const { data } = await supabase
        .from("spots")
        .select(SPOT_SELECT_FOR_MAP)
        .eq("is_hidden", false);
      const list = (data ?? []) as Omit<
        Spot,
        "saved" | "visited" | "pinStatus"
      >[];
      const pinMap = await getPinsForSpots(list.map((s) => s.id));
      const withPins: Spot[] = list.map((s) => {
        const state = pinMap.get(s.id);
        const saved = state?.saved ?? false;
        const visited = state?.visited ?? false;
        return {
          ...s,
          saved,
          visited,
          pinStatus: visited
            ? "visited"
            : saved
              ? "to_visit"
              : ("default" as SpotPinStatus),
        };
      });

      const visible = onlyVisible(withPins as (Spot & { isHidden?: boolean })[]);
      const nextIds = new Set(visible.map((s) => s.id));
      const prevIds = prevSpotIdsRef.current;
      const disappeared = [...prevIds].filter((id) => !nextIds.has(id));

      prevSpotIdsRef.current = nextIds;

      for (const id of disappeared) {
        invalidateSpotIdRef.current?.(id);
      }

      if (
        selectedSpot &&
        selectedSpot.id &&
        disappeared.includes(selectedSpot.id)
      ) {
        setSelectedSpot(null);
        setSheetState("peek");
      }

      setSpots(visible);

      void (async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user || user.is_anonymous) return;
          const [tags, index] = await Promise.all([listUserTags(), fetchPinTagsIndexForSession()]);
          setUserTags(tags);
          setPinTagIndex(index);
        } catch {
          /* ignore */
        }
      })();

      return visible;
    } catch {
      return [];
    } finally {
      setSpotsLoadSettled(true);
    }
  }, [selectedSpot, setSheetState]);

  /** Una fila + pins: actualiza lista y selección sin refetch masivo (rendimiento tras ediciones). */
  const mergeSpotFromDbById = useCallback(async (spotId: string): Promise<"merged" | "missing" | "error" | "skipped"> => {
    if (spotId.startsWith("draft_")) return "skipped";
    const { data, error } = await supabase
      .from("spots")
      .select(SPOT_SELECT_FOR_MAP)
      .eq("id", spotId)
      .eq("is_hidden", false)
      .single();
    if (error) return "error";
    if (!data) return "missing";
    const pinMap = await getPinsForSpots([spotId]);
    const state = pinMap.get(spotId);
    const saved = state?.saved ?? false;
    const visited = state?.visited ?? false;
    const spot: Spot = {
      ...(data as Omit<Spot, "saved" | "visited" | "pinStatus">),
      saved,
      visited,
      pinStatus: visited ? "visited" : saved ? "to_visit" : "default",
    };
    const visible = onlyVisible([spot as Spot & { isHidden?: boolean }]);
    if (visible.length === 0) return "missing";
    const merged = visible[0];
    setSpots((prev) => {
      const idx = prev.findIndex((s) => s.id === spotId);
      if (idx === -1) return [...prev, merged];
      const next = [...prev];
      next[idx] = merged;
      return next;
    });
    setSelectedSpot((prev) => (prev?.id === spotId ? merged : prev));
    return "merged";
  }, []);

  const lastFocusFullRefetchAtRef = useRef(0);
  const MIN_FOCUS_FULL_REFETCH_MS = 8000;

  useFocusEffect(
    useCallback(() => {
      const now = Date.now();
      const elapsed = now - lastFocusFullRefetchAtRef.current;
      const recent =
        lastFocusFullRefetchAtRef.current > 0 &&
        elapsed < MIN_FOCUS_FULL_REFETCH_MS;
      if (recent) {
        const id = selectedSpot?.id;
        if (id && !id.startsWith("draft_")) {
          void (async () => {
            const mergeResult = await mergeSpotFromDbById(id);
            if (mergeResult === "error") return;
            if (mergeResult !== "missing") return;
            // Si el spot ya no existe/está oculto tras una edición o delete rápidos, reconciliar el estado local completo.
            lastFocusFullRefetchAtRef.current = now;
            await refetchSpots();
          })();
        } else {
          lastFocusFullRefetchAtRef.current = now;
          void refetchSpots();
        }
        return () => {};
      }
      lastFocusFullRefetchAtRef.current = now;
      void refetchSpots();
      return () => {};
    }, [refetchSpots, mergeSpotFromDbById, selectedSpot?.id]),
  );

  const filteredSpots = useMemo(() => {
    if (pinFilter === "all") return spots;
    if (pinFilter === "saved") return spots.filter((s) => s.saved);
    return spots.filter((s) => s.visited);
  }, [spots, pinFilter]);

  const spotsWithTagIds = useMemo(
    () =>
      filteredSpots.map((s) => ({
        ...s,
        tagIds: pinTagIndex[s.id] ?? [],
      })),
    [filteredSpots, pinTagIndex],
  );
  const spotsAllWithTagIds = useMemo(
    () =>
      spots.map((s) => ({
        ...s,
        tagIds: pinTagIndex[s.id] ?? [],
      })),
    [spots, pinTagIndex],
  );
  const isRecentMutationActive = Boolean(
    recentlyMutatedSpotId && recentMutationUntil && recentMutationUntil > Date.now(),
  );
  const recentMutationSpot = useMemo(
    () =>
      isRecentMutationActive && recentlyMutatedSpotId
        ? spots.find((spot) => spot.id === recentlyMutatedSpotId) ?? null
        : null,
    [isRecentMutationActive, recentlyMutatedSpotId, spots],
  );
  const [countriesDrilldown, setCountriesDrilldown] = useState<{
    key: string;
    label: string;
  } | null>(null);
  const countryDrilldownItems = useMemo(() => {
    if (!countriesDrilldown) return [];
    return filteredSpots.filter((spot) => {
      const resolved = resolveCountryForSpot(spot);
      return resolved?.key === countriesDrilldown.key;
    });
  }, [countriesDrilldown, filteredSpots]);

  const displayedSpots = useMemo(() => {
    if (isPlacingDraftSpot && selectedSpot?.id.startsWith("draft_")) {
      return [selectedSpot];
    }
    const canHideLinkedUnsaved =
      pinFilter !== "all" &&
      featureFlags.hideLinkedUnsaved &&
      featureFlags.mapLandmarkLabels;
    const scopeByFilter =
      pinFilter === "all"
        ? spots
        : [
            ...filteredSpots,
            ...spots.filter((spot) => isCoreDefaultUnlinkedSpot(spot)),
          ].filter((spot, index, arr) => arr.findIndex((it) => it.id === spot.id) === index);
    const visibilityFiltered = canHideLinkedUnsaved
      ? scopeByFilter.filter((s) => !isLinkedUnsavedSpot(s))
      : scopeByFilter;
    // Filtro "Todos": no mostrar defaults derivados de POI (vinculados); solo Flowya default sin link.
    const allFilterWithoutLinkedDefaults =
      pinFilter === "all"
        ? visibilityFiltered.filter((s) => !isDefaultLinkedPoiSpot(s))
        : visibilityFiltered;
    const base =
      allFilterWithoutLinkedDefaults.length > MAP_PIN_CAP
        ? allFilterWithoutLinkedDefaults.slice(0, MAP_PIN_CAP)
        : allFilterWithoutLinkedDefaults;
    if (selectedSpot?.id.startsWith("draft_")) return [...base, selectedSpot];
    /**
     * POI match: incluir selectedSpot si está fuera de filtro.
     * Guardrail: no reinsertar selectedSpot si está oculto por regla linked+unsaved.
     */
    const isPreservedSelection =
      selectedSpot != null &&
      preserveOutOfFilterSelectionSpotIdRef.current === selectedSpot.id;
    let result = base;
    if (
      pinFilter === "all" &&
      selectedSpot &&
      !(canHideLinkedUnsaved && isLinkedUnsavedSpot(selectedSpot)) &&
      (!isDefaultLinkedPoiSpot(selectedSpot) || isPreservedSelection) &&
      !base.some((s) => s.id === selectedSpot.id)
    ) {
      result = [...base, selectedSpot];
    }
    if (!recentMutationSpot || result.some((s) => s.id === recentMutationSpot.id)) {
      return result;
    }
    const shouldKeepLinkedDefaultOnlyWhileSelected =
      isDefaultLinkedPoiSpot(recentMutationSpot) &&
      selectedSpot?.id !== recentMutationSpot.id;
    if (shouldKeepLinkedDefaultOnlyWhileSelected) {
      return result;
    }
    return [...result, recentMutationSpot];
  }, [filteredSpots, selectedSpot, isPlacingDraftSpot, pinFilter, recentMutationSpot, spots]);

  const forceVisibleSpotIds = useMemo(() => {
    const ids = new Set<string>();
    if (selectedSpot && !selectedSpot.id.startsWith("draft_")) {
      ids.add(selectedSpot.id);
    }
    if (
      recentMutationSpot &&
      (!isDefaultLinkedPoiSpot(recentMutationSpot) || selectedSpot?.id === recentMutationSpot.id)
    ) {
      ids.add(recentMutationSpot.id);
    }
    return ids;
  }, [selectedSpot, recentMutationSpot]);

  const isSelectedSpotHiddenOnMap = Boolean(
    selectedSpot &&
      !selectedSpot.id.startsWith("draft_") &&
      !displayedSpots.some((s) => s.id === selectedSpot.id),
  );

  const onLongPressHandlerRef = useRef<
    (coords: { lat: number; lng: number }) => void
  >(() => {});
  const onPinClickHandlerRef = useRef<(spot: Spot) => void>(() => {});
  const collapseCountriesSheetOnMapGestureRef = useRef<() => void>(() => {});
  const collapseExploreWelcomeOnMapGestureRef = useRef<() => void>(() => {});
  const hasActivePoiSelection = poiTapped != null && selectedSpot == null;
  const hasLinkedSelection = hasLinkedPlaceId(selectedSpot);
  const shouldSuppressMapboxPoiLabels = Boolean(
    hasActivePoiSelection || hasLinkedSelection || isSelectedSpotHiddenOnMap,
  );
  // Mantener labels de spots Flowya al seleccionar un spot para evitar "apagón" visual del resto.
  const shouldShowFlowyaSpotLabels = !hasActivePoiSelection;
  const resolveEffectivePinStatus = useCallback(
    (status: SpotPinStatus | undefined): SpotPinStatus => {
      return status ?? "default";
    },
    [],
  );
  const mapCore = useMapCore(selectedSpot, {
    onLongPress: (coords) => onLongPressHandlerRef.current?.(coords),
    // CONTRATO map->peek: pan/zoom mapa colapsa sheet a peek (EXPLORE_SHEET §4)
    onUserMapGestureStart: () => {
      if (globeEntryMotionDelayRef.current != null) {
        clearTimeout(globeEntryMotionDelayRef.current);
        globeEntryMotionDelayRef.current = null;
      }
      globeEntryMotionPlayedRef.current = true;
      globeEntryMotionInFlightRef.current = false;
      setIsGlobeEntryMotionSettled(true);
      deactivateSearchColdStartBootstrap();
      setSheetState("peek");
      collapseCountriesSheetOnMapGestureRef.current?.();
      collapseExploreWelcomeOnMapGestureRef.current?.();
    },
    enableLandmarkLabels:
      featureFlags.mapLandmarkLabels && !shouldSuppressMapboxPoiLabels,
    isDarkStyle: colorScheme === "dark",
    spots: displayedSpots
      .filter((s) => !s.id.startsWith("draft_"))
      .map((s) => ({
        id: s.id,
        title: s.title,
        latitude: s.latitude,
        longitude: s.longitude,
        pinStatus: resolveEffectivePinStatus(s.pinStatus),
        linkedPlaceId: s.linked_place_id ?? null,
        linkedMaki: s.linked_maki ?? null,
        forceVisible: forceVisibleSpotIds.has(s.id),
      })),
    selectedSpotId: selectedSpot?.id ?? null,
    onPinClick: (spotForLayer) => {
      const fullSpot = displayedSpots.find((s) => s.id === spotForLayer.id);
      if (fullSpot) onPinClickHandlerRef.current?.(fullSpot);
    },
    is3DEnabled,
    showMakiIcon: featureFlags.flowyaPinMakiIcon,
    showSpotLabels: shouldShowFlowyaSpotLabels,
    pinFilter,
    selectedSpotCameraFraming: selectedSpot
      ? {
          bbox: selectedSpot.mapbox_bbox ?? undefined,
          featureType: selectedSpot.mapbox_feature_type ?? null,
          maki: selectedSpot.linked_maki ?? null,
        }
      : null,
  });
  const {
    mapInstance,
    userCoords,
    zoom,
    viewportNonce,
    activeMapControl,
    selectedPinScreenPos,
    mapRootRef,
    onMapLoad,
    handleLocate,
    handleReframeSpot,
    handleViewWorld,
    programmaticFlyTo,
    handleMapPointerDown,
    handleMapPointerMove,
    handleMapPointerUp,
  } = mapCore;

  useEffect(() => {
    if (!filterWaitActiveRef.current) return;
    filterWaitActiveRef.current = false;
    clearFilterWaitFallbackTimer();
    const id = setTimeout(() => {
      setIsFilterWaitingForCamera(false);
    }, FILTER_WAIT_RELEASE_DELAY_MS);
    return () => clearTimeout(id);
  }, [viewportNonce, clearFilterWaitFallbackTimer]);

  useEffect(() => {
    if (!globeEntryMotionInFlightRef.current) return;
    globeEntryMotionInFlightRef.current = false;
    setIsGlobeEntryMotionSettled(true);
  }, [viewportNonce]);

  /** OL-WOW-F2-005 act: no programmaticFlyTo durante create/edit/placing. */
  const flyToUnlessActMode = useCallback(
    (center: { lng: number; lat: number }, options?: { zoom?: number; duration?: number }) => {
      if (createSpotNameOverlayOpen || isPlacingDraftSpot) return;
      suspendFilterUntilCameraSettles();
      programmaticFlyTo(center, options);
    },
    [createSpotNameOverlayOpen, isPlacingDraftSpot, programmaticFlyTo, suspendFilterUntilCameraSettles],
  );

  const handleMapLoadWithFilterDelay = useCallback(
    (e: Parameters<typeof onMapLoad>[0]) => {
      suspendFilterUntilCameraSettles();
      onMapLoad(e);
    },
    [onMapLoad, suspendFilterUntilCameraSettles],
  );

  const shouldSkipGlobeEntryMotion = Boolean(
    params.spotId ||
      params.created ||
      selectedSpot != null ||
      poiTapped != null ||
      searchIsOpenRef.current ||
      createSpotNameOverlayOpen,
  );

  useEffect(() => {
    if (!mapInstance) return;
    if (globeEntryMotionPlayedRef.current) return;
    if (shouldSkipGlobeEntryMotion) {
      globeEntryMotionPlayedRef.current = true;
      setIsGlobeEntryMotionSettled(true);
      return;
    }

    globeEntryMotionDelayRef.current = setTimeout(() => {
      if (
        globeEntryMotionPlayedRef.current ||
        shouldSkipGlobeEntryMotion ||
        !mapInstance
      ) {
        globeEntryMotionPlayedRef.current = true;
        return;
      }
      globeEntryMotionPlayedRef.current = true;
      globeEntryMotionInFlightRef.current = true;
      suspendFilterUntilCameraSettles();
      try {
        const center = mapInstance.getCenter();
        // Usar fly programático canónico para no disparar handlers de gesto de usuario
        // que desactivan el bootstrap de sugerencias globales en cold-start.
        programmaticFlyTo(
          { lng: center.lng, lat: center.lat },
          { zoom: GLOBE_ZOOM_WORLD, duration: FIT_BOUNDS_DURATION_MS },
        );
      } catch {
        globeEntryMotionInFlightRef.current = false;
        setIsGlobeEntryMotionSettled(true);
      }
    }, 160);

    return () => {
      if (globeEntryMotionDelayRef.current != null) {
        clearTimeout(globeEntryMotionDelayRef.current);
        globeEntryMotionDelayRef.current = null;
      }
    };
  }, [
    mapInstance,
    programmaticFlyTo,
    shouldSkipGlobeEntryMotion,
    suspendFilterUntilCameraSettles,
  ]);

  /** Misma heurística que useMapCore reframe + búsqueda (fitBounds si hay mapbox_bbox). */
  const focusCameraOnSpot = useCallback(
    (spot: Spot) => {
      if (!mapInstance) return;
      suspendFilterUntilCameraSettles();
      applyExploreCameraForPlace(
        mapInstance,
        placeResultFromSpotForCamera(spot, {
          bbox: spot.mapbox_bbox ?? undefined,
          featureType: spot.mapbox_feature_type ?? null,
          maki: spot.linked_maki ?? null,
        }),
        flyToUnlessActMode,
      );
    },
    [mapInstance, flyToUnlessActMode, suspendFilterUntilCameraSettles],
  );

  const queueDeepLinkFocus = useCallback(
    (spot: Spot) => {
      pendingDeepLinkFocusRef.current = spot;
      if (!mapInstance) return;
      focusCameraOnSpot(spot);
      pendingDeepLinkFocusRef.current = null;
    },
    [mapInstance, focusCameraOnSpot],
  );

  useEffect(() => {
    if (!mapInstance) return;
    const pending = pendingDeepLinkFocusRef.current;
    if (!pending) return;
    focusCameraOnSpot(pending);
    pendingDeepLinkFocusRef.current = null;
  }, [mapInstance, focusCameraOnSpot]);

  const contextualSelection = useMemo<{ id: string } | null>(() => {
    if (selectedSpot) return { id: selectedSpot.id };
    if (!poiTapped) return null;
    return { id: `poi:${poiTapped.placeId ?? `${poiTapped.lat.toFixed(5)},${poiTapped.lng.toFixed(5)}`}` };
  }, [selectedSpot, poiTapped]);

  const poiReframeCycleKey = useMemo(
    () =>
      poiTapped
        ? `${poiTapped.placeId ?? ""}:${poiTapped.lat}:${poiTapped.lng}`
        : "",
    [poiTapped],
  );

  useEffect(() => {
    poiReframeCycleRef.current = 0;
  }, [poiReframeCycleKey]);

  const handleReframeContextual = useCallback(() => {
    if (selectedSpot) {
      suspendFilterUntilCameraSettles();
      handleReframeSpot();
      return;
    }
    if (!poiTapped || !mapInstance) return;
    suspendFilterUntilCameraSettles();
    const poiAsPlace: PlaceResult = {
      id: poiTapped.placeId ?? "poi",
      name: poiTapped.name,
      lat: poiTapped.lat,
      lng: poiTapped.lng,
      bbox: poiTapped.bbox,
      source: "mapbox",
      maki: poiTapped.maki ?? undefined,
      featureType: poiTapped.featureType ?? undefined,
    };
    const step = poiReframeCycleRef.current;
    applyPlaceReframeCycle(mapInstance, poiAsPlace, step, flyToUnlessActMode);
    poiReframeCycleRef.current = (step + 1) % 2;
  }, [
    selectedSpot,
    handleReframeSpot,
    poiTapped,
    flyToUnlessActMode,
    suspendFilterUntilCameraSettles,
    mapInstance,
  ]);


  const pinCounts = useMemo(
    () => ({
      saved: spots.filter((s) => s.saved).length,
      visited: spots.filter((s) => s.visited).length,
    }),
    [spots],
  );

  const countriesBucketsByFilter = useMemo(() => {
    const toVisitSpots = spots.filter((s) => s.pinStatus === "to_visit");
    const visitedSpots = spots.filter((s) => s.pinStatus === "visited");
    return {
      saved: buildCountryBuckets(toVisitSpots),
      visited: buildCountryBuckets(visitedSpots),
    };
  }, [spots]);
  /** Mismo criterio que contadores del mapa y CountriesSheet (`buildCountryBuckets` / KPIs). */
  const travelerPoints = useMemo(
    () =>
      computeTravelerPoints(countriesBucketsByFilter.visited.length, pinCounts.visited),
    [countriesBucketsByFilter.visited, pinCounts.visited],
  );

  const countriesFilterForActiveCounter = pinFilter === "visited" ? "visited" : "saved";

  useEffect(() => {
    updatePendingFilterBadges((prev) => {
      let next = prev;
      if (prev.saved && pinCounts.saved === 0) {
        lastStatusSpotIdRef.current.saved = null;
        next = { ...next, saved: false };
      }
      if (prev.visited && pinCounts.visited === 0) {
        lastStatusSpotIdRef.current.visited = null;
        next = { ...next, visited: false };
      }
      return next;
    });
  }, [pinCounts.saved, pinCounts.visited, updatePendingFilterBadges]);

  /** `toastMessage` sustituye el copy por defecto al cambiar filtro (p. ej. pastilla países | flows). */
  const handlePinFilterChange = useCallback(
    (nextFilter: MapPinFilterValue, options?: { reframe?: boolean; toastMessage?: string }) => {
      const currentFilter = pinFilter;
      if (nextFilter === currentFilter) return;
      const pendingForTarget =
        nextFilter !== "all" ? pendingFilterBadges[nextFilter] : false;
      const pendingSpotId =
        nextFilter === "saved" || nextFilter === "visited"
          ? lastStatusSpotIdRef.current[nextFilter]
          : null;
      setPinFilter(nextFilter);
      if (nextFilter === "all") {
        setSelectedTagFilterId(null);
        setTagFilterEditMode(false);
      }
      const fromAll = currentFilter === "all";
      const filterToast: Record<MapPinFilterValue, string> = fromAll
        ? {
            all: "Descubre y planea tu próximo viaje.",
            saved: "Empieza marcando lugares para tu próxima ruta.",
            visited: "Registra tus memorias y construye tu mapa personal.",
          }
        : {
            all: "Volviste a Todos.",
            saved: "Sigues en Por visitar: organiza y prepara tus lugares.",
            visited: "Sigues en Visitados: registra tus memorias.",
          };
      if (!suppressToastRef.current && !filterChangeToastSuppressedRef.current) {
        const toastBody =
          options?.toastMessage !== undefined ? options.toastMessage : filterToast[nextFilter];
        if (toastBody.length > 0) {
          toast.show(toastBody, { type: "success", replaceVisible: true });
        }
      }
      if (pendingForTarget && nextFilter !== "all") {
        updatePendingFilterBadges((prev) => ({ ...prev, [nextFilter]: false }));
      }

      if (options?.reframe === false) return;
      if (nextFilter === "all") return;
      const target = spots.filter((s) => (nextFilter === "saved" ? s.saved : s.visited));

      const pendingSpot =
        target.length > 0 && pendingForTarget && pendingSpotId
          ? target.find((s) => s.id === pendingSpotId) ?? null
          : null;
      if (pendingSpot) {
        setSelectedSpot(pendingSpot);
        setSheetState("medium");
        if (mapInstance) {
          flyToUnlessActMode(
            { lng: pendingSpot.longitude, lat: pendingSpot.latitude },
            { zoom: SPOT_FOCUS_ZOOM, duration: FIT_BOUNDS_DURATION_MS },
          );
        }
        return;
      }
      // Cambio manual de filtro: no mover cámara automáticamente (evita zoom-out inesperado).
    },
    [
      pendingFilterBadges,
      mapInstance,
      pinFilter,
      spots,
      flyToUnlessActMode,
      updatePendingFilterBadges,
      toast,
      setPinFilter,
      setSheetState,
      setSelectedTagFilterId,
      setTagFilterEditMode,
    ],
  );

  const defaultSpots = useMemo(() => {
    const ref = userCoords ?? {
      latitude: FALLBACK_VIEW.latitude,
      longitude: FALLBACK_VIEW.longitude,
    };
    return [...filteredSpots]
      .sort(
        (a, b) =>
          distanceKm(ref.latitude, ref.longitude, a.latitude, a.longitude) -
          distanceKm(ref.latitude, ref.longitude, b.latitude, b.longitude),
      )
      .slice(0, 10);
  }, [filteredSpots, userCoords]);

  /** Solo deseleccionar cuando el usuario cambia el filtro y el spot pasa a estar fuera. NO deseleccionar en tap POI cross-filter (Por visitar↔Visitados). */
  useEffect(() => {
    const prevFilter = prevPinFilterRef.current;
    const pinFilterChanged = prevFilter !== pinFilter;
    prevPinFilterRef.current = pinFilter;
    if (pinFilterChanged) {
      setTagFilterEditMode(false);
    }
    const shouldClearSelection = shouldClearSelectedSpotOnFilterChange({
      prevFilter,
      nextFilter: pinFilter,
      hasSelectedSpot: Boolean(selectedSpot),
      isDraftSpot: Boolean(selectedSpot?.id.startsWith("draft_")),
      isSelectedVisibleInNextFilter: Boolean(
        selectedSpot &&
          (filteredSpots.some((s) => s.id === selectedSpot.id) ||
            (pinFilter !== "all" && isCoreDefaultUnlinkedSpot(selectedSpot))),
      ),
    });
    const isPreservedSelection =
      selectedSpot != null &&
      preserveOutOfFilterSelectionSpotIdRef.current === selectedSpot.id;
    if (isPreservedSelection) return;
    if (shouldClearSelection) {
      setSelectedSpot(null);
      setSheetState("peek");
      setSheetHeight(SHEET_PEEK_HEIGHT);
    }
  }, [pinFilter, filteredSpots, selectedSpot, setSheetState]);

  // Sincronizar selectedSpot con versión fresca de filteredSpots (ej. tras refetch o edición)
  useEffect(() => {
    if (!selectedSpot?.id) return;
    const fresh = filteredSpots.find((s) => s.id === selectedSpot.id);
    if (fresh && fresh !== selectedSpot) {
      setSelectedSpot(fresh);
    }
  }, [filteredSpots, selectedSpot]);

  // Si el spot seleccionado deja de cumplir el filtro activo por un toggle explícito, cerrar sheet.
  useEffect(() => {
    if (!selectedSpot) return;
    if (selectedSpot.id.startsWith("draft_")) return;
    if (pinFilter === "all") return;
    const isRecentSelection =
      recentlyMutatedSpotId === selectedSpot.id &&
      recentMutationUntil != null &&
      recentMutationUntil > Date.now();
    if (isRecentSelection) return;
    const stillInActiveFilter =
      filteredSpots.some((spot) => spot.id === selectedSpot.id) ||
      isCoreDefaultUnlinkedSpot(selectedSpot);
    if (stillInActiveFilter) return;
    if (preserveOutOfFilterSelectionSpotIdRef.current === selectedSpot.id) return;
    setSelectedSpot(null);
    setSheetState("peek");
    setSheetHeight(SHEET_PEEK_HEIGHT);
  }, [
    pinFilter,
    filteredSpots,
    selectedSpot,
    setSheetState,
    recentlyMutatedSpotId,
    recentMutationUntil,
  ]);

  useEffect(() => {
    if (!selectedSpot) {
      preserveOutOfFilterSelectionSpotIdRef.current = null;
      return;
    }
    if (
      preserveOutOfFilterSelectionSpotIdRef.current != null &&
      preserveOutOfFilterSelectionSpotIdRef.current !== selectedSpot.id
    ) {
      preserveOutOfFilterSelectionSpotIdRef.current = null;
    }
  }, [selectedSpot]);

  useEffect(() => {
    if (!recentlyMutatedSpotId || !recentMutationUntil) return;
    const remaining = recentMutationUntil - Date.now();
    if (remaining <= 0) {
      clearRecentMutation();
      return;
    }
    const timer = setTimeout(() => {
      clearRecentMutation();
    }, remaining);
    return () => clearTimeout(timer);
  }, [recentlyMutatedSpotId, recentMutationUntil, clearRecentMutation]);

  useEffect(() => {
    if (!recentlyMutatedSpotId) return;
    if (!selectedSpot) return;
    if (selectedSpot.id === recentlyMutatedSpotId) return;
    clearRecentMutation();
  }, [selectedSpot, recentlyMutatedSpotId, clearRecentMutation]);

  const spotsProvider = useMemo(
    () =>
      createSpotsStrategyProvider({
        getFilteredSpots: () => spotsWithTagIds,
        getAllSpotsForSearch: () => spotsAllWithTagIds,
        getBbox: () => {
          if (!mapInstance) return null;
          try {
            const b = mapInstance.getBounds();
            if (!b) return null;
            return {
              west: b.getWest(),
              south: b.getSouth(),
              east: b.getEast(),
              north: b.getNorth(),
            };
          } catch {
            return null;
          }
        },
        getZoom: () => zoom,
      }),
    [spotsWithTagIds, spotsAllWithTagIds, mapInstance, zoom],
  );

  const searchV2 = useSearchControllerV2<Spot>({
    mode: "spots",
    isToggleable: true,
    defaultOpen: false,
    provider: spotsProvider,
    getBbox: () => {
      if (!mapInstance) return null;
      try {
        const b = mapInstance.getBounds();
        if (!b) return null;
        return {
          west: b.getWest(),
          south: b.getSouth(),
          east: b.getEast(),
          north: b.getNorth(),
        };
      } catch {
        return null;
      }
    },
    getFilters: () => ({
      pinFilter,
      hasVisited: pinCounts.visited > 0,
      tagId: selectedTagFilterId,
    }),
  });

  /**
   * Contrato teclado/foco:
   * Paso 0 (Nombre del spot) y Search son mutuamente excluyentes.
   * Si Paso 0 se abre, Search se cierra y se libera foco activo para evitar teclados empalmados.
   */
  useEffect(() => {
    const isOpening = createSpotNameOverlayOpen && !wasCreateSpotOverlayOpenRef.current;
    wasCreateSpotOverlayOpenRef.current = createSpotNameOverlayOpen;
    if (!isOpening) return;
    if (searchV2.isOpen) searchV2.setOpen(false);
    if (quickDescSpot) {
      setQuickDescSpot(null);
      setQuickDescValue("");
    }
    // Keyboard ownership transfer: blur solo una vez al abrir Paso 0.
    // Evita cerrar teclado durante escritura por re-renders del input.
    blurActiveElement();
  }, [createSpotNameOverlayOpen, quickDescSpot, searchV2]);

  /** OL-WOW-F2-003: sync ref para toast solo en dropdown (handlePinFilterChange se define antes de searchV2). */
  useEffect(() => {
    searchIsOpenRef.current = searchV2.isOpen;
  }, [searchV2.isOpen]);

  /** isEmpty: spots dentro de SPOTS_ZONA_RADIUS_KM del centro del mapa (independiente del zoom). */
  const defaultSpotsForEmpty = useMemo(() => {
    if (!searchV2.isOpen || !mapInstance) return defaultSpots;
    try {
      const center = mapInstance.getCenter();
      const inZona = filteredSpots
        .filter(
          (s) =>
            distanceKm(center.lat, center.lng, s.latitude, s.longitude) <= SPOTS_ZONA_RADIUS_KM,
        )
        .sort(
          (a, b) =>
            distanceKm(center.lat, center.lng, a.latitude, a.longitude) -
            distanceKm(center.lat, center.lng, b.latitude, b.longitude),
        )
        .slice(0, 10);
      return inZona;
    } catch {
      return defaultSpots;
    }
  }, [
    searchV2.isOpen,
    mapInstance,
    filteredSpots,
    defaultSpots,
  ]);

  /** SearchV2 ASAP: fuente primaria en empty-state = landmarks visibles del viewport (sin costo API). */
  const visibleLandmarksEmpty = useMemo<PlaceResult[]>(() => {
    void viewportNonce; // fuerza recálculo tras moveend para reflejar landmarks visibles actuales
    const q = searchV2.query.trim();
    const canUseVisibleLandmarks =
      searchV2.isOpen && q.length === 0 && pinFilter === "all" && mapInstance != null;
    if (!canUseVisibleLandmarks || !mapInstance) return [];
    return collectVisibleLandmarks(mapInstance);
  }, [searchV2.isOpen, searchV2.query, pinFilter, mapInstance, viewportNonce]);

  /**
   * Cold-start mundial (bitácora 289): «Países populares» + «Lugares populares» (`coldStartWorldRecommendations`),
   * sin anclar a la posición por defecto del mapa. Se muestra mientras no hay datos locales listos o mientras
   * `isSearchColdStartBootstrapActive` (desactiva por gesto mapa, query, selección, Mi ubicación / Ver mundo).
   * Visitados cercanos se filtran en `buildColdStartWorldRecommendations`.
   *
   * Fallback temporal hasta listados UGC — retirada planificada: OL-EXPLORE-COLD-START-RETIRE-001.
   */
  const useExploreColdStartFallback =
    pinFilter === "all" &&
    countriesDrilldown == null &&
    (isSearchColdStartBootstrapActive || !spotsLoadSettled);

  const shouldShowColdStartWorldEmpty =
    searchV2.isOpen &&
    searchV2.query.trim().length === 0 &&
    useExploreColdStartFallback;

  const defaultItemsForEmpty = useMemo<(Spot | PlaceResult)[]>(() => {
    if (shouldShowColdStartWorldEmpty) return [];
    const isCountryDrilldownActive =
      searchV2.isOpen && countriesDrilldown != null && searchV2.query.trim().length === 0;
    if (isCountryDrilldownActive) return countryDrilldownItems;
    if (pinFilter !== "all") return defaultSpotsForEmpty;
    const externalPlaces = mergeEmptyExternalPlaces(
      visibleLandmarksEmpty,
      nearbyPlacesEmpty,
      filteredSpots,
    );
    return mergeSearchResults(defaultSpotsForEmpty, externalPlaces, "");
  }, [
    searchV2.isOpen,
    searchV2.query,
    countriesDrilldown,
    countryDrilldownItems,
    shouldShowColdStartWorldEmpty,
    pinFilter,
    defaultSpotsForEmpty,
    visibleLandmarksEmpty,
    nearbyPlacesEmpty,
    filteredSpots,
  ]);

  /** isEmpty con saved/visited: dos grupos "Spots en la zona" (radio fijo) y "Spots en el mapa", ordenados por distancia. */
  /** OL-SEARCHV2-EMPTY-FLOWYA-POPULAR-001: cuando all + pocos resultados locales, sección "Lugares populares en Flowya". */
  const defaultSectionsForEmpty = useMemo<SearchSection<Spot | PlaceResult>[]>(() => {
    if (shouldShowColdStartWorldEmpty) return coldStartWorldSections;
    const isCountryDrilldownActive =
      searchV2.isOpen && countriesDrilldown != null && searchV2.query.trim().length === 0;
    if (isCountryDrilldownActive) {
      if (countryDrilldownItems.length === 0) return [];
      return [
        {
          id: "country-drilldown",
          title: `Lugares en ${countriesDrilldown.label}`,
          items: countryDrilldownItems,
        },
      ];
    }
    if (pinFilter === "all") {
      const localCount =
        defaultSpotsForEmpty.length + visibleLandmarksEmpty.length + nearbyPlacesEmpty.length;
      const fewLocalResults = localCount < 4;
      if (fewLocalResults) {
        const flowyaNotVisited = flowyaPopularSpots.filter((s) => !s.visited);
        const porVisitar = spots.filter((s) => s.saved);
        const deLaZona = defaultSpotsForEmpty;
        const merged: (Spot | PlaceResult)[] = [];
        const seen = new Set<string>();
        for (const s of [...flowyaNotVisited, ...porVisitar, ...deLaZona]) {
          const id = s.id;
          if (!seen.has(id)) {
            seen.add(id);
            merged.push(s);
          }
        }
        const items = merged.slice(0, 10);
        if (items.length > 0) {
          return [
            {
              id: "flowya-popular",
              title: "Lugares populares en Flowya",
              items,
            },
          ];
        }
      }
      return [];
    }
    if (pinFilter !== "saved" && pinFilter !== "visited") return [];
    if (!mapInstance || filteredSpots.length === 0) return [];
    try {
      const center = mapInstance.getCenter();
      const ref = userCoords ?? { latitude: FALLBACK_VIEW.latitude, longitude: FALLBACK_VIEW.longitude };
      const nearby = filteredSpots
        .filter(
          (s) =>
            distanceKm(center.lat, center.lng, s.latitude, s.longitude) <= SPOTS_ZONA_RADIUS_KM,
        )
        .sort(
          (a, b) =>
            distanceKm(ref.latitude, ref.longitude, a.latitude, a.longitude) -
            distanceKm(ref.latitude, ref.longitude, b.latitude, b.longitude),
        );
      const inWorld = filteredSpots
        .filter(
          (s) =>
            distanceKm(center.lat, center.lng, s.latitude, s.longitude) > SPOTS_ZONA_RADIUS_KM,
        )
        .sort(
          (a, b) =>
            distanceKm(ref.latitude, ref.longitude, a.latitude, a.longitude) -
            distanceKm(ref.latitude, ref.longitude, b.latitude, b.longitude),
        );
      const sections: SearchSection<Spot | PlaceResult>[] = [];
      if (nearby.length > 0) sections.push({ id: "nearby", title: "Lugares en la zona", items: nearby });
      if (inWorld.length > 0) sections.push({ id: "world", title: "Lugares en el mapa", items: inWorld });
      return sections;
    } catch {
      return [];
    }
  }, [
    searchV2.isOpen,
    searchV2.query,
    shouldShowColdStartWorldEmpty,
    coldStartWorldSections,
    countriesDrilldown,
    countryDrilldownItems,
    pinFilter,
    mapInstance,
    filteredSpots,
    userCoords,
    flowyaPopularSpots,
    defaultSpotsForEmpty,
    visibleLandmarksEmpty,
    nearbyPlacesEmpty,
    spots,
  ]);

  /**
   * Filtro por chip de etiqueta en listados "vacíos" (sin query ≥3): defaultItems/defaultSections
   * se construyen solo con filteredSpots y no pasaban por searchDisplayResultsWithTag.
   */
  const defaultItemsForEmptyTagged = useMemo(
    () => filterExploreSearchItemsByTag(defaultItemsForEmpty, selectedTagFilterId, pinTagIndex),
    [defaultItemsForEmpty, selectedTagFilterId, pinTagIndex],
  );
  const defaultSectionsForEmptyTagged = useMemo(() => {
    if (selectedTagFilterId == null) return defaultSectionsForEmpty;
    return defaultSectionsForEmpty
      .map((sec) => ({
        ...sec,
        items: filterExploreSearchItemsByTag(sec.items, selectedTagFilterId, pinTagIndex),
      }))
      .filter((sec) => sec.items.length > 0);
  }, [defaultSectionsForEmpty, selectedTagFilterId, pinTagIndex]);

  /**
   * Sheet bienvenida: cold-start mundial mientras `useExploreColdStartFallback`; luego RPC/IDs.
   * Si Flowya queda vacío (p. ej. fetch pausado al buscar, o RPC vacío), seguir mostrando seeds de inicio — OL-EXPLORE-COLD-START-RETIRE-001.
   */
  const welcomeExploreListItems = useMemo<WelcomeBrowseItem[]>(() => {
    const flattenColdStart = (): WelcomeBrowseItem[] => {
      const flat: WelcomeBrowseItem[] = [];
      for (const sec of coldStartWorldSections) {
        for (const it of sec.items) {
          flat.push(it as PlaceResult);
        }
      }
      return flat;
    };
    if (useExploreColdStartFallback) return flattenColdStart();
    const flowya = flowyaPopularSpots as WelcomeBrowseItem[];
    if (flowya.length > 0) return flowya;
    return flattenColdStart();
  }, [useExploreColdStartFallback, coldStartWorldSections, flowyaPopularSpots]);

  const welcomeSheetBrowseSectionTitle =
    useExploreColdStartFallback || flowyaPopularSpots.length === 0
      ? "Sugerencias para empezar"
      : "Lugares populares en Flowya";

  const searchHistory = useSearchHistory();

  /** OL-WOW-F2-001-SEARCH: fetch Mapbox cuando query >= 3 con Todos o Por visitar/Visitados (misma mezcla que Todos). */
  useEffect(() => {
    const q = searchV2.query.trim();
    const shouldFetchExternal =
      searchV2.isOpen &&
      q.length >= 3 &&
      (pinFilter === "all" || pinFilter === "saved" || pinFilter === "visited") &&
      !searchV2.isLoading;
    if (!shouldFetchExternal) {
      setPlaceSuggestions([]);
      return;
    }
    let cancelled = false;
    (async () => {
      const startedAt = Date.now();
      try {
        const baseOpts: {
          limit: number;
          proximity?: { lat: number; lng: number };
          bbox?: { west: number; south: number; east: number; north: number };
        } = {
          limit: 6,
        };
        if (mapInstance) {
          try {
            const c = mapInstance.getCenter();
            const b = mapInstance.getBounds();
            baseOpts.proximity = { lat: c.lat, lng: c.lng };
            baseOpts.bbox = b
              ? {
                  west: b.getWest(),
                  south: b.getSouth(),
                  east: b.getEast(),
                  north: b.getNorth(),
                }
              : undefined;
          } catch {
            // fallback seguro: mantener búsqueda global sin bbox
          }
        }
        const fetchExternal = async (
          opts: typeof baseOpts,
        ): Promise<PlaceResult[]> => {
          if (featureFlags.searchExternalPoiResults) {
            const external = await searchPlacesPOI(q, opts);
            return external.map((item: PlaceResultV2) => placeResultV2ToLegacy(item));
          }
          return searchPlaces(q, opts);
        };
        let results: PlaceResult[];
        results = await fetchExternal(baseOpts);
        if (results.length === 0 && baseOpts.bbox) {
          // Si no hay match local, reintentar global para permitir búsquedas fuera del viewport actual.
          results = await fetchExternal({ limit: baseOpts.limit });
        }
        if (featureFlags.searchExternalDedupe) {
          results = dedupeExternalPlacesAgainstSpots(results, searchV2.results);
        }
        if (featureFlags.searchExternalDedupe) {
          results = dedupePlaceResults(results);
        }
        if (featureFlags.searchMixedRanking) {
          results = rankExternalPlacesByIntent(results, q);
        }
        recordExternalFetchMetric(Date.now() - startedAt, false);
        if (!cancelled) setPlaceSuggestions(results);
      } catch {
        recordExternalFetchMetric(Date.now() - startedAt, true);
        if (!cancelled) setPlaceSuggestions([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [
    searchV2.isOpen,
    searchV2.query,
    searchV2.isLoading,
    searchV2.results,
    pinFilter,
    mapInstance,
  ]);

  useEffect(() => {
    const q = searchV2.query.trim().toLowerCase();
    if (q.length > 0 && isSearchColdStartBootstrapActive) {
      deactivateSearchColdStartBootstrap();
    }
    if (!searchV2.isOpen || q.length < 3) return;
    if (lastSearchStartKeyRef.current !== q) {
      lastSearchStartKeyRef.current = q;
      recordSearchStarted();
      recordExploreDecisionStarted({
        source: "search",
        pinFilter,
        hasSelection: selectedSpot != null || poiTapped != null,
      });
    }
    if (!searchV2.isLoading && searchV2.results.length === 0) {
      if (lastNoResultsKeyRef.current !== q) {
        lastNoResultsKeyRef.current = q;
        recordSearchNoResults();
      }
    }
  }, [
    searchV2.isOpen,
    searchV2.query,
    searchV2.isLoading,
    searchV2.results.length,
    isSearchColdStartBootstrapActive,
    deactivateSearchColdStartBootstrap,
    pinFilter,
    selectedSpot,
    poiTapped,
  ]);

  /** OL-SEARCHV2-EMPTY-FLOWYA-POPULAR-001: empty-state del buscador o sheet inicial Explore (misma fuente RPC). */
  const fetchPopularForWelcomeExplore = useMemo(
    () =>
      selectedSpot == null &&
      poiTapped == null &&
      !searchV2.isOpen &&
      pinFilter === "all" &&
      isGlobeEntryMotionSettled,
    [selectedSpot, poiTapped, searchV2.isOpen, pinFilter, isGlobeEntryMotionSettled],
  );

  useEffect(() => {
    const shouldFetch =
      pinFilter === "all" &&
      !useExploreColdStartFallback &&
      countriesDrilldown == null &&
      ((searchV2.isOpen && searchV2.query.trim().length === 0) || fetchPopularForWelcomeExplore);
    if (!shouldFetch) {
      /** No vacar al pausar fetch (p. ej. query en buscador): al volver al sheet bienvenida sigue habiendo datos o cold-start en UI. */
      if (useExploreColdStartFallback) {
        setFlowyaPopularSpots([]);
      }
      return;
    }
    let cancelled = false;
    (async () => {
      const fromRpc = await fetchMostVisitedSpots(10);
      if (cancelled) return;
      if (fromRpc.length > 0) {
        setFlowyaPopularSpots(fromRpc);
        return;
      }
      const fromManual = await fetchSpotsByIdsForExploreWelcome(
        EXPLORE_WELCOME_FALLBACK_SPOT_IDS,
      );
      if (!cancelled) setFlowyaPopularSpots(fromManual);
    })();
    return () => {
      cancelled = true;
    };
  }, [
    searchV2.isOpen,
    searchV2.query,
    pinFilter,
    useExploreColdStartFallback,
    countriesDrilldown,
    fetchPopularForWelcomeExplore,
  ]);

  const recentViewedSpots = useMemo(() => {
    return recentViewedIds
      .map((id) => spots.find((s) => s.id === id))
      .filter((s): s is Spot => s != null);
  }, [spots, recentViewedIds]);

  const refreshTagsAfterPinChange = useCallback(async () => {
    try {
      const [tags, index] = await Promise.all([listUserTags(), fetchPinTagsIndexForSession()]);
      setUserTags(tags);
      setPinTagIndex(index);
    } catch {
      /* ignore */
    }
  }, []);

  const handleCloseTagAssignModal = useCallback(() => {
    setTagAssignSpot(null);
    setTagAssignInput("");
    setTagAssignSaving(false);
  }, []);

  /** Sheet: chip de etiqueta → buscador en Por visitar o Visitados (según el spot) con filtro por esa etiqueta; chips solo existen en esos modos. */
  const handleSheetTagChipPress = useCallback(
    (tagId: string) => {
      const spot = selectedSpot;
      setPinFilter(spot?.visited === true ? "visited" : "saved");
      setSelectedTagFilterId(tagId);
      setTagFilterEditMode(false);
      searchV2.setOpen(true);
    },
    [setPinFilter, searchV2, selectedSpot],
  );

  const handleSheetEtiquetarFromSheet = useCallback(() => {
    if (!selectedSpot || selectedSpot.id.startsWith("draft_")) return;
    setTagAssignSpot(selectedSpot);
    setTagAssignInput("");
  }, [selectedSpot]);

  const handleDetachTagFromAssignSpot = useCallback(
    async (tagId: string) => {
      if (!tagAssignSpot) return;
      setTagAssignSaving(true);
      try {
        await detachTagFromSpot(tagAssignSpot.id, tagId);
        await refreshTagsAfterPinChange();
        searchV2.invalidateSpotId(tagAssignSpot.id);
      } finally {
        setTagAssignSaving(false);
      }
    },
    [tagAssignSpot, refreshTagsAfterPinChange, searchV2],
  );

  const handleCreateAndAttachTag = useCallback(async () => {
    if (!tagAssignSpot) return;
    const name = tagAssignInput.trim();
    if (!name) return;
    const spotTitle = tagAssignSpot.title;
    const spotId = tagAssignSpot.id;
    setTagAssignSaving(true);
    try {
      const row = await createOrGetUserTag(name);
      await attachTagToSpot(spotId, row.id);
      await refreshTagsAfterPinChange();
      searchV2.invalidateSpotId(spotId);
      setTagAssignSpot(null);
      setTagAssignInput("");
      if (!suppressToastRef.current) {
        toast.show(`Etiqueta creada en «${spotTitle}»`, { type: "success", replaceVisible: true });
      }
    } catch {
      if (!suppressToastRef.current) {
        toast.show("No se pudo guardar la etiqueta. Inténtalo de nuevo.", { type: "error" });
      }
    } finally {
      setTagAssignSaving(false);
    }
  }, [tagAssignSpot, tagAssignInput, refreshTagsAfterPinChange, searchV2, toast]);

  const handleRequestDeleteUserTag = useCallback((tagId: string, tagName: string) => {
    setTagDeleteConfirm({ id: tagId, name: tagName });
  }, []);

  const handleConfirmDeleteUserTag = useCallback(async () => {
    if (!tagDeleteConfirm) return;
    setTagDeleteBusy(true);
    try {
      await deleteUserTag(tagDeleteConfirm.id);
      if (selectedTagFilterId === tagDeleteConfirm.id) setSelectedTagFilterId(null);
      await refreshTagsAfterPinChange();
      if (!suppressToastRef.current) {
        toast.show(`Etiqueta «${tagDeleteConfirm.name}» eliminada`, { type: "success", replaceVisible: true });
      }
      setTagDeleteConfirm(null);
      setTagFilterEditMode(false);
    } catch {
      if (!suppressToastRef.current) {
        toast.show("No se pudo eliminar la etiqueta.", { type: "error" });
      }
    } finally {
      setTagDeleteBusy(false);
    }
  }, [tagDeleteConfirm, selectedTagFilterId, refreshTagsAfterPinChange, toast]);

  useEffect(() => {
    if (!searchV2.isOpen) {
      setTagFilterEditMode(false);
    }
  }, [searchV2.isOpen]);

  useEffect(() => {
    searchV2.setOnSelect((spot: Spot) => {
      deactivateSearchColdStartBootstrap();
      openFromSearchRef.current = true;
      searchV2.setOpen(false);
      setPoiTapped(null);
      setSelectedSpot(spot);
      recordExploreSelectionChanged({
        entityType: "spot",
        selectionState: "selected",
        fromFilter: pinFilter,
        toFilter: pinFilter,
      });
      setSheetState("medium"); // OL-057: entry from SearchResultCard always opens sheet MEDIUM (no peek)
      recordSearchSpotClick();
      pushRecentViewedSpotId(spot.id);
      searchHistory.addCompletedQuery(searchV2.query);
      /** Desde buscador: encuadre coherente con mapbox_bbox / tipo de feature (no zoom fijo 17). */
      focusCameraOnSpot(spot);
    });
  }, [
    searchHistory,
    searchV2,
    setSheetState,
    pinFilter,
    deactivateSearchColdStartBootstrap,
    focusCameraOnSpot,
    pushRecentViewedSpotId,
  ]);

  useEffect(() => {
    invalidateSpotIdRef.current = searchV2.invalidateSpotId;
    return () => {
      invalidateSpotIdRef.current = null;
    };
  }, [searchV2.invalidateSpotId]);

  /** OL-057: Force sheet MEDIUM when spot was selected from search (avoids collapsed on first paint). */
  useEffect(() => {
    if (selectedSpot && openFromSearchRef.current) {
      openFromSearchRef.current = false;
      setSheetState("medium");
    }
  }, [selectedSpot, setSheetState]);

  /** Deep link intake: spotId + sheet=extended|medium → select spot, open sheet in that state, then clean params. See docs/contracts/DEEP_LINK_SPOT.md.
   * Siempre fetch desde DB para tener coords actualizadas (ej. tras editar ubicación). */
  useEffect(() => {
    const spotId = params.spotId;
    const sheetParam = params.sheet;
    const targetState =
      sheetParam === "extended"
        ? "expanded"
        : sheetParam === "medium"
          ? "medium"
          : null;
    if (!spotId || targetState === null) return;
    if (appliedSpotIdFromParamsRef.current === spotId) return;

    const applySpot = (spot: Spot) => {
      deepLinkCenterLockRef.current = true;
      appliedSpotIdFromParamsRef.current = spotId;
      ensureSpotVisibleWithActiveFilter(spot);
      setSelectedSpot(spot);
      setSheetState(targetState); // extended → expanded, medium → medium
      queueDeepLinkFocus(spot);
      pushRecentViewedSpotId(spot.id);
      setSpots((prev) =>
        prev.some((s) => s.id === spot.id) ? prev : [...prev, spot],
      );
      // Defer URL cleanup so React commits state first; avoids sheet flashing
      setTimeout(() => {
        (router.replace as (href: string) => void)("/(tabs)");
      }, 0);
    };

    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("spots")
        .select(SPOT_SELECT_FOR_MAP)
        .eq("id", spotId)
        .eq("is_hidden", false)
        .single();
      if (cancelled) return;
      if (error || !data) {
        appliedSpotIdFromParamsRef.current = spotId;
        (router.replace as (href: string) => void)("/(tabs)");
        return;
      }
      if (cancelled) return;
      const pinMap = await getPinsForSpots([data.id]);
      const state = pinMap.get(data.id);
      const saved = state?.saved ?? false;
      const visited = state?.visited ?? false;
      const spot: Spot = {
        ...(data as Omit<Spot, "saved" | "visited" | "pinStatus">),
        saved,
        visited,
        pinStatus: visited ? "visited" : saved ? "to_visit" : "default",
      };
      if (cancelled) return;
      applySpot(spot);
    })();
    return () => {
      cancelled = true;
    };
  }, [
    params.spotId,
    params.sheet,
    router,
    queueDeepLinkFocus,
    setSheetState,
    ensureSpotVisibleWithActiveFilter,
    pushRecentViewedSpotId,
  ]);

  /** Post-create intake: created=<id> → select spot, open sheet expanded, then clean params. Preserva comportamiento Create Spot original (Explorar + SpotSheet extended). */
  useEffect(() => {
    const createdId = params.created;
    if (!createdId) return;
    if (appliedCreatedIdRef.current === createdId) return;

    const applyCreated = (spot: Spot) => {
      deepLinkCenterLockRef.current = true;
      appliedCreatedIdRef.current = createdId;
      ensureSpotVisibleWithActiveFilter(spot);
      setSelectedSpot(spot);
      setSheetState("expanded");
      queueDeepLinkFocus(spot);
      pushRecentViewedSpotId(spot.id);
      setTimeout(() => {
        (router.replace as (href: string) => void)("/(tabs)");
      }, 0);
    };

    const fromList = spots.find((s) => s.id === createdId);
    if (fromList) {
      applyCreated(fromList);
      return;
    }

    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("spots")
        .select(SPOT_SELECT_FOR_MAP)
        .eq("id", createdId)
        .eq("is_hidden", false)
        .single();
      if (cancelled) return;
      if (error || !data) {
        appliedCreatedIdRef.current = createdId;
        (router.replace as (href: string) => void)("/(tabs)");
        return;
      }
      if (cancelled) return;
      const pinMap = await getPinsForSpots([data.id]);
      const state = pinMap.get(data.id);
      const saved = state?.saved ?? false;
      const visited = state?.visited ?? false;
      const spot: Spot = {
        ...(data as Omit<Spot, "saved" | "visited" | "pinStatus">),
        saved,
        visited,
        pinStatus: visited ? "visited" : saved ? "to_visit" : "default",
      };
      if (cancelled) return;
      setSpots((prev) =>
        prev.some((s) => s.id === spot.id) ? prev : [...prev, spot],
      );
      applyCreated(spot);
    })();
    return () => {
      cancelled = true;
    };
  }, [
    params.created,
    spots,
    router,
    queueDeepLinkFocus,
    setSheetState,
    ensureSpotVisibleWithActiveFilter,
    pushRecentViewedSpotId,
  ]);

  /** Helper único: si no hay sesión abre modal y devuelve false; si hay sesión devuelve true. */
  const requireAuthOrModal = useCallback(
    async (message: string): Promise<boolean> => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || user.is_anonymous) {
        openAuthModal({ message });
        return false;
      }
      return true;
    },
    [openAuthModal],
  );

  /** Coordenadas por defecto: centro del mapa, ubicación usuario o fallback. */
  const getFallbackCoords = useCallback((): { lat: number; lng: number } => {
    if (mapInstance) {
      try {
        const c = mapInstance.getCenter();
        return { lat: c.lat, lng: c.lng };
      } catch {
        return {
          lat: userCoords?.latitude ?? FALLBACK_VIEW.latitude,
          lng: userCoords?.longitude ?? FALLBACK_VIEW.longitude,
        };
      }
    }
    return {
      lat: userCoords?.latitude ?? FALLBACK_VIEW.latitude,
      lng: userCoords?.longitude ?? FALLBACK_VIEW.longitude,
    };
  }, [mapInstance, userCoords]);

  /** Flujo canónico crear spot: draft en mapa → sheet (nombre + ubicación + imagen). Todas las entradas (dock +, long-press, search sin resultados) usan este flujo. */
  const startDraftCreateSpot = useCallback(
    (coords: { lat: number; lng: number }, title: string = "Nuevo lugar") => {
      const draft: Spot = {
        id: `draft_${Date.now()}`,
        title: title.trim() || "Nuevo lugar",
        description_short: null,
        description_long: null,
        cover_image_url: null,
        address: null,
        latitude: coords.lat,
        longitude: coords.lng,
        saved: false,
        visited: false,
        pinStatus: "default",
      };
      searchV2.setOpen(false);
      setSelectedSpot(draft);
      setSheetState("medium");
      setIsPlacingDraftSpot(true);
    },
    [searchV2, setSheetState],
  );

  /** "Crear spot nuevo aquí" (solo UGC): centro del mapa o ubicación actual. Sin resolver texto. */
  const handleCreateFromNoResults = useCallback(async () => {
    if (!(await requireAuthOrModal(AUTH_MODAL_MESSAGES.createSpot))) return;
    const { lat, lng } = getFallbackCoords();
    const title = searchV2.query.trim() || "Nuevo lugar";
    searchV2.setOpen(false);
    setCreateSpotPendingCoords({ lat, lng });
    setCreateSpotInitialName(title);
    setCreateSpotNameOverlayOpen(true);
  }, [requireAuthOrModal, searchV2, getFallbackCoords]);

  /** Lugar sugerido en búsqueda: mostrar POI sheet (card medium con Por visitar) y encuadrar mapa en el lugar. */
  /** Para world-seeds: usar siempre coords del seed (evita que "Taj Mahal" lleve a hotel homónimo). */
  const handleCreateFromPlace = useCallback(
    async (place: PlaceResult) => {
      deactivateSearchColdStartBootstrap();
      const targetPlace = place;
      const stablePlaceId = getStablePlaceId(targetPlace);
      searchV2.setOpen(false);
      const existingSpot = resolveTappedSpotMatch(spots, {
        lat: targetPlace.lat,
        lng: targetPlace.lng,
        name: targetPlace.name,
        placeId: stablePlaceId,
      });
      if (existingSpot) {
        recordExploreDecisionStarted({
          source: "search",
          pinFilter,
          hasSelection: true,
        });
        setSelectedSpot(existingSpot);
        setPoiTapped(null);
        recordExploreSelectionChanged({
          entityType: "spot",
          selectionState: "selected",
          fromFilter: pinFilter,
          toFilter: pinFilter,
        });
        setSheetState("medium");
        suspendFilterUntilCameraSettles();
        applyExploreCameraForPlace(
          mapInstance,
          {
            id: existingSpot.id,
            name: existingSpot.title,
            lat: existingSpot.latitude,
            lng: existingSpot.longitude,
            bbox: existingSpot.mapbox_bbox ?? undefined,
            source: "mapbox",
            maki: existingSpot.linked_maki ?? undefined,
            featureType: existingSpot.mapbox_feature_type ?? undefined,
          },
          flyToUnlessActMode,
        );
        return;
      }
      setSelectedSpot(null);
      recordSearchExternalClick();
      const displayName = getDisplayNameForPlace(targetPlace) || targetPlace.name;
      setPoiTapped({
        name: displayName,
        lat: targetPlace.lat,
        lng: targetPlace.lng,
        kind: inferTappedKindFromPlace(targetPlace),
        placeId: stablePlaceId,
        maki: targetPlace.maki ?? null,
        visualState: "default",
        source: "search_suggestion",
        bbox: targetPlace.bbox,
        featureType: targetPlace.featureType ?? null,
      });
      recordExploreSelectionChanged({
        entityType: "poi",
        selectionState: "selected",
        fromFilter: pinFilter,
        toFilter: pinFilter,
      });
      setSheetState("medium");
      suspendFilterUntilCameraSettles();
      applyExploreCameraForPlace(mapInstance, targetPlace, flyToUnlessActMode);
    },
    [
      deactivateSearchColdStartBootstrap,
      searchV2,
      spots,
      flyToUnlessActMode,
      setSheetState,
      pinFilter,
      mapInstance,
      suspendFilterUntilCameraSettles,
    ],
  );

  /** Paridad con filas del buscador en empty state (spot Flowya vs lugar Mapbox). */
  const handleWelcomeBrowseItemPress = useCallback(
    (item: WelcomeBrowseItem) => {
      if (!("lat" in item)) {
        searchV2.onSelect(item as Spot);
        return;
      }
      void handleCreateFromPlace(item as PlaceResult);
    },
    [searchV2, handleCreateFromPlace],
  );

  /** Tap en mapa: draft placement (mover pin) o detección de POI (SpotSheet si ya existe, SpotSheet modo POI si no). */
  const handleMapClick = useCallback(
    (e: { lngLat: { lat: number; lng: number }; point?: { x: number; y: number } }) => {
      if (isPlacingDraftSpot) {
        setSelectedSpot((prev) => {
          if (!prev || !prev.id.startsWith("draft_")) return prev;
          const { lngLat } = e;
          if (!lngLat) return prev;
          return { ...prev, latitude: lngLat.lat, longitude: lngLat.lng };
        });
        return;
      }
      if (!mapInstance || !e.point) return;
      try {
        const labelLayers = getLabelLayerIds(mapInstance);
        const point: [number, number] = [e.point.x, e.point.y];
        let features = labelLayers.length > 0
          ? mapInstance.queryRenderedFeatures(point, { layers: labelLayers })
          : mapInstance.queryRenderedFeatures(point);
        if (labelLayers.length > 0 && features.length === 0) {
          features = mapInstance.queryRenderedFeatures(point);
        }
        const lang = getCurrentLanguage();
        const hasLocaleField = (p: Record<string, unknown>) =>
          (lang && typeof p[`name_${lang}`] === "string" && String(p[`name_${lang}`]).trim()) ||
          (typeof p.name_en === "string" && p.name_en.trim());
        /** Preferir feature con name_es/name_en y capas label (place-label*, poi-label*). */
        const layerScore = (f: (typeof features)[0]) =>
          getLabelLayerScore(typeof f.layer?.id === "string" ? f.layer.id : "");
        const score = (c: { props: Record<string, unknown>; f: (typeof features)[0] }) =>
          (hasLocaleField(c.props) ? 10 : 0) + layerScore(c.f);
        let best: { f: (typeof features)[0]; props: Record<string, unknown>; name: string; lng: number; lat: number } | null = null;
        for (const f of features) {
          const props = f.properties as Record<string, unknown> | undefined;
          if (!props) continue;
          const name =
            getTappedFeatureNameByLocale(props) ||
            (typeof props.title === "string" && props.title.trim());
          if (!name) continue;
          const geom = f.geometry;
          if (geom?.type !== "Point" || !Array.isArray(geom.coordinates)) continue;
          const [lng, lat] = geom.coordinates;
          if (typeof lat !== "number" || typeof lng !== "number") continue;
          const candidate = { f, props, name: name.trim(), lng, lat };
          if (!best || score(candidate) > score(best)) best = candidate;
        }
        if (best) {
          const { f, props, name, lng, lat } = best;
          const tappedFeatureId = getTappedFeatureId(f.id, props);
          const match = resolveTappedSpotMatch(spots, {
            lat,
            lng,
            name,
            placeId: tappedFeatureId,
          });
          const kind = classifyTappedFeatureKind(f.layer?.id, props);
          const matchBelongsToActiveFilter =
            pinFilter === "all" ||
            (pinFilter === "saved" ? Boolean(match?.saved) : Boolean(match?.visited));
          if (match && matchBelongsToActiveFilter) {
            recordExploreDecisionStarted({
              source: "map",
              pinFilter,
              hasSelection: true,
            });
            setSelectedSpot(match);
            recordExploreSelectionChanged({
              entityType: "spot",
              selectionState: "selected",
              fromFilter: pinFilter,
              toFilter: pinFilter,
            });
            setSheetState("medium");
            setPoiTapped(null);
          } else {
            setSelectedSpot(null);
            setPoiTapped({
              name,
              lat,
              lng,
              kind,
              placeId: tappedFeatureId,
              maki: getTappedFeatureMaki(props),
              visualState: "default",
              source: "map_tap",
            });
            recordExploreSelectionChanged({
              entityType: "poi",
              selectionState: "selected",
              fromFilter: pinFilter,
              toFilter: pinFilter,
            });
            setSheetState("medium");
          }
        }
      } catch {
        /* ignore query errors */
      }
    },
    [isPlacingDraftSpot, mapInstance, spots, setSheetState, pinFilter],
  );

  useEffect(() => {
    searchV2.setOnCreate(handleCreateFromNoResults);
  }, [searchV2, handleCreateFromNoResults]);

  /** Crear spot mínimo desde BORRADOR. skipDuplicateCheck = cuando usuario confirmó "Crear otro" en modal. */
  const handleCreateSpotFromDraft = useCallback(
    async (skipDuplicateCheck = false) => {
      const draft = selectedSpot;
      if (!draft || !draft.id.startsWith("draft_")) return;
      if (!(await requireAuthOrModal(AUTH_MODAL_MESSAGES.createSpot))) return;
      const titleToUse = draft.title?.trim() || "Nuevo lugar";
      if (!skipDuplicateCheck) {
        const duplicateResult = await checkDuplicateSpot(
          titleToUse,
          draft.latitude,
          draft.longitude,
          DEFAULT_DUPLICATE_RADIUS_METERS,
          { address: draft.address },
        );
        if (duplicateResult.duplicate) {
          setDuplicateModal({
            existingTitle: duplicateResult.existingTitle,
            existingSpotId: duplicateResult.existingSpotId,
            onCreateAnyway: () => handleCreateSpotFromDraft(true),
          });
          return;
        }
      }
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const insertPayload: Record<string, unknown> = {
      title: draft.title?.trim() || "Nuevo lugar",
      description_short: null,
      description_long: null,
      latitude: draft.latitude,
      longitude: draft.longitude,
      address: null,
    };
    if (user?.id && !user.is_anonymous) {
      insertPayload.user_id = user.id;
    }
    const { data: inserted, error: insertError } = await supabase
      .from("spots")
      .insert(insertPayload)
      .select("id, title, description_short, description_long, cover_image_url, address, latitude, longitude")
      .single();
    if (insertError) {
      if (!suppressToastRef.current) toast.show(insertError.message ?? "Ups, no se pudo crear el lugar. Prueba de nuevo.", { type: "error" });
      return;
    }
    const newId = inserted?.id;
    if (!newId) return;
    let coverUrl: string | null = null;
    if (draftCoverUri) {
      try {
        const res = await fetch(draftCoverUri);
        if (res.ok) {
          const blob = await res.blob();
          const optimized = await optimizeSpotImage(blob);
          const toUpload = optimized.ok ? optimized.blob : optimized.fallbackBlob;
          if (toUpload) {
            coverUrl = await uploadSpotCover(newId, toUpload);
            if (coverUrl) {
              await supabase.from("spots").update({ cover_image_url: coverUrl }).eq("id", newId);
            }
          }
        }
      } catch {
        /* fallback silencioso */
      }
    }
    const pinMap = await getPinsForSpots([newId]);
    const state = pinMap.get(newId);
    const created: Spot = {
      ...(inserted as Omit<Spot, "saved" | "visited" | "pinStatus">),
      cover_image_url: coverUrl ?? inserted?.cover_image_url ?? null,
      saved: state?.saved ?? false,
      visited: state?.visited ?? false,
      pinStatus: state?.visited ? "visited" : state?.saved ? "to_visit" : "default",
    };
    // Añadir a spots de forma síncrona para que el efecto (selectedSpot debe estar en filteredSpots) no borre la selección antes de que refetchSpots termine.
    setSpots((prev) => (prev.some((s) => s.id === created.id) ? prev : [...prev, created]));
    setSelectedSpot(created);
    setSheetState("medium");
    setIsPlacingDraftSpot(false);
    setDraftCoverUri(null);
    searchV2.setOpen(false);
    void refreshTagsAfterPinChange();

    /** Reverse geocoding una vez: generar dirección y guardarla en DB (no bloquea al usuario). */
    resolveAddress(draft.latitude, draft.longitude).then((address) => {
      if (!address) return;
      supabase
        .from("spots")
        .update({ address })
        .eq("id", newId)
        .then(({ error }) => {
          if (!error) {
            setSelectedSpot((prev) =>
              prev?.id === newId && prev ? { ...prev, address } : prev,
            );
          }
        });
    });
    },
    [
      selectedSpot,
      draftCoverUri,
      requireAuthOrModal,
      refreshTagsAfterPinChange,
      searchV2,
      toast,
      setDuplicateModal,
      setSheetState,
    ],
  );

  const [poiSheetLoading, setPoiSheetLoading] = useState(false);
  const [fullscreenImageUri, setFullscreenImageUri] = useState<string | null>(null);
  const resetPoiTappedVisualState = useCallback((poi: TappedMapFeature) => {
    setPoiTapped((prev) => {
      if (!prev) return prev;
      const sameFeature =
        prev.name === poi.name && prev.lat === poi.lat && prev.lng === poi.lng;
      if (!sameFeature) return prev;
      return { ...prev, visualState: "default" };
    });
  }, []);

  /** Crear spot desde POI tocado (tap en mapa). Flujo de planificación: no bloquea por anti-duplicado. */
  const handleCreateSpotFromPoi = useCallback(
    async (
      initialStatus?: "to_visit" | "visited",
      targetSheetState: "medium" | "expanded" = "medium",
    ) => {
      const poi = poiTapped;
      if (!poi) return;
      const shouldTrackCreateFromSearch = poi.source === "search_suggestion";
      let didAttemptPersist = false;
      if (!(await requireAuthOrModal(AUTH_MODAL_MESSAGES.createSpot))) return;
      let created = false;
      if (initialStatus === "to_visit") {
        setPoiTapped((prev) =>
          prev
            ? {
                ...prev,
                visualState: "to_visit",
              }
            : prev,
        );
      }
      setPoiSheetLoading(true);
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        didAttemptPersist = true;
        const framing = await resolveFramingForMapTapPoi(poi);
        const insertPayload: Record<string, unknown> = {
          title: poi.name,
          description_short: null,
          description_long: null,
          latitude: poi.lat,
          longitude: poi.lng,
          address: null,
          link_status: poi.placeId ? "linked" : "unlinked",
          linked_place_id: poi.placeId,
          linked_place_kind: poi.placeId ? poi.kind : null,
          linked_maki: poi.placeId ? poi.maki : null,
          linked_at: poi.placeId ? new Date().toISOString() : null,
          link_version: poi.placeId ? SPOT_LINK_VERSION : null,
          mapbox_bbox: framing.bbox,
          mapbox_feature_type: framing.featureType,
        };
        if (user?.id && !user.is_anonymous) {
          insertPayload.user_id = user.id;
        }
        const { data: inserted, error: insertError } = await supabase
          .from("spots")
          .insert(insertPayload)
          .select(
            "id, title, description_short, description_long, cover_image_url, address, latitude, longitude, link_status, linked_place_id, linked_place_kind, linked_maki, mapbox_bbox, mapbox_feature_type",
          )
          .single();
        if (insertError) {
          if (shouldTrackCreateFromSearch) recordCreateFromSearchResult(false);
          if (!suppressToastRef.current) toast.show(insertError.message ?? "Ups, no se pudo crear el lugar. Prueba de nuevo.", { type: "error" });
          return;
        }
        const newId = inserted?.id;
        if (!newId) {
          if (shouldTrackCreateFromSearch) recordCreateFromSearchResult(false);
          if (!suppressToastRef.current) toast.show("Ups, no se pudo guardar. ¿Intentas de nuevo?", { type: "error" });
          return;
        }
        if (initialStatus === "to_visit") {
          const savedState = await setSaved(newId, true);
          if (savedState == null) {
            if (!suppressToastRef.current) toast.show("Se creó el lugar, pero no se pudo agregar a Por visitar. Prueba otra vez.", {
              type: "error",
            });
          }
        } else if (initialStatus === "visited") {
          const visitedState = await setVisited(newId, true);
          if (visitedState == null) {
            if (!suppressToastRef.current) toast.show("Se creó el lugar, pero no se pudo marcar como visitado. Prueba otra vez.", {
              type: "error",
            });
          }
        }
        const pinMap = await getPinsForSpots([newId]);
        const state = pinMap.get(newId);
        const createdSpot: Spot = {
          ...(inserted as Omit<Spot, "saved" | "visited" | "pinStatus">),
          cover_image_url: inserted?.cover_image_url ?? null,
          saved: state?.saved ?? false,
          visited: state?.visited ?? false,
          pinStatus: state?.visited ? "visited" : state?.saved ? "to_visit" : "default",
        };
        created = true;
        if (shouldTrackCreateFromSearch) recordCreateFromSearchResult(true);
        setSpots((prev) => (prev.some((s) => s.id === createdSpot.id) ? prev : [...prev, createdSpot]));
        setSelectedSpot(createdSpot);
        setPoiTapped(null);
        setSheetState(targetSheetState);
        void refreshTagsAfterPinChange();
        resolveAddress(poi.lat, poi.lng).then((address) => {
          if (!address) return;
          supabase
            .from("spots")
            .update({ address })
            .eq("id", newId)
            .then(({ error }) => {
              if (!error) {
                setSelectedSpot((prev) =>
                  prev?.id === newId && prev ? { ...prev, address } : prev,
                );
              }
            });
        });
      } catch {
        if (shouldTrackCreateFromSearch && didAttemptPersist) {
          recordCreateFromSearchResult(false);
        }
        if (!suppressToastRef.current) toast.show("Ups, no se pudo guardar. ¿Intentas de nuevo?", { type: "error" });
      } finally {
        setPoiSheetLoading(false);
        if (initialStatus === "to_visit" && !created) {
          resetPoiTappedVisualState(poi);
        }
      }
    },
    [
      poiTapped,
      requireAuthOrModal,
      refreshTagsAfterPinChange,
      resetPoiTappedVisualState,
      toast,
      setSheetState,
    ],
  );

  /** Crear spot desde POI y compartir. Flujo de planificación: no bloquea por anti-duplicado. */
  const handleCreateSpotFromPoiAndShare = useCallback(
    async () => {
      const poi = poiTapped;
      if (!poi) return;
      if (!(await requireAuthOrModal(AUTH_MODAL_MESSAGES.createSpot))) return;
      setPoiSheetLoading(true);
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        const framing = await resolveFramingForMapTapPoi(poi);
        const insertPayload: Record<string, unknown> = {
          title: poi.name,
          description_short: null,
          description_long: null,
          latitude: poi.lat,
          longitude: poi.lng,
          address: null,
          link_status: poi.placeId ? "linked" : "unlinked",
          linked_place_id: poi.placeId,
          linked_place_kind: poi.placeId ? poi.kind : null,
          linked_maki: poi.placeId ? poi.maki : null,
          linked_at: poi.placeId ? new Date().toISOString() : null,
          link_version: poi.placeId ? SPOT_LINK_VERSION : null,
          mapbox_bbox: framing.bbox,
          mapbox_feature_type: framing.featureType,
        };
        if (user?.id && !user.is_anonymous) {
          insertPayload.user_id = user.id;
        }
        const { data: inserted, error: insertError } = await supabase
          .from("spots")
          .insert(insertPayload)
          .select("id, title, link_status, linked_place_id, linked_place_kind, linked_maki, mapbox_bbox, mapbox_feature_type")
          .single();
        if (insertError) {
          if (!suppressToastRef.current) toast.show(insertError.message ?? "Ups, no se pudo crear el lugar. Prueba de nuevo.", { type: "error" });
          return;
        }
        const newId = inserted?.id;
        if (!newId) {
          if (!suppressToastRef.current) toast.show("Ups, no se pudo guardar. ¿Intentas de nuevo?", { type: "error" });
          return;
        }
        const result = await shareSpot(newId, poi.name);
        if (result.copied) if (!suppressToastRef.current) toast.show("Enlace copiado", { type: "success" });
        const pinMap = await getPinsForSpots([newId]);
        const state = pinMap.get(newId);
        const created: Spot = {
          id: newId,
          title: poi.name,
          description_short: null,
          description_long: null,
          cover_image_url: null,
          address: null,
          latitude: poi.lat,
          longitude: poi.lng,
          link_status: (inserted?.link_status as Spot["link_status"]) ?? (poi.placeId ? "linked" : "unlinked"),
          linked_place_id: inserted?.linked_place_id ?? poi.placeId,
          linked_place_kind:
            (inserted?.linked_place_kind as Spot["linked_place_kind"]) ?? (poi.placeId ? poi.kind : null),
          linked_maki: inserted?.linked_maki ?? poi.maki ?? null,
          mapbox_bbox: (inserted as { mapbox_bbox?: Spot["mapbox_bbox"] })?.mapbox_bbox ?? poi.bbox ?? null,
          mapbox_feature_type:
            (inserted as { mapbox_feature_type?: string | null })?.mapbox_feature_type ?? poi.featureType ?? null,
          saved: state?.saved ?? false,
          visited: state?.visited ?? false,
          pinStatus: state?.visited ? "visited" : state?.saved ? "to_visit" : "default",
        };
        setSpots((prev) => (prev.some((s) => s.id === created.id) ? prev : [...prev, created]));
        setSelectedSpot(created);
        setPoiTapped(null);
        setSheetState("medium");
        void refreshTagsAfterPinChange();
      } catch {
        if (!suppressToastRef.current) toast.show("Ups, no se pudo guardar. ¿Intentas de nuevo?", { type: "error" });
      } finally {
        setPoiSheetLoading(false);
      }
  }, [poiTapped, requireAuthOrModal, refreshTagsAfterPinChange, toast, setSheetState]);

  /** Ver spot existente (desde modal duplicado): abre sheet MEDIUM con pin seleccionado. */
  const handleViewExistingSpot = useCallback(
    (spotId: string) => {
      setPoiTapped(null);
      const fromList = spots.find((s) => s.id === spotId);
      if (fromList) {
        ensureSpotVisibleWithActiveFilter(fromList);
        setSelectedSpot(fromList);
        setSheetState("medium");
        pushRecentViewedSpotId(fromList.id);
        focusCameraOnSpot(fromList);
        return;
      }
      (async () => {
        const { data, error } = await supabase
          .from("spots")
          .select(SPOT_SELECT_FOR_MAP)
          .eq("id", spotId)
          .eq("is_hidden", false)
          .single();
        if (error || !data) return;
        const pinMap = await getPinsForSpots([data.id]);
        const state = pinMap.get(data.id);
        const spot: Spot = {
          ...(data as Omit<Spot, "saved" | "visited" | "pinStatus">),
          saved: state?.saved ?? false,
          visited: state?.visited ?? false,
          pinStatus: state?.visited ? "visited" : state?.saved ? "to_visit" : "default",
        };
        setSpots((prev) => (prev.some((s) => s.id === spot.id) ? prev : [...prev, spot]));
        ensureSpotVisibleWithActiveFilter(spot);
        setSelectedSpot(spot);
        setSheetState("medium");
        pushRecentViewedSpotId(spot.id);
        focusCameraOnSpot(spot);
      })();
    },
    [spots, focusCameraOnSpot, setSheetState, ensureSpotVisibleWithActiveFilter, pushRecentViewedSpotId],
  );

  const patchSpotSearchMetadata = useCallback(
    (spotId: string, patch: Partial<Pick<Spot, "cover_image_url" | "description_short">>) => {
      setSpots((prev) => prev.map((s) => (s.id === spotId ? { ...s, ...patch } : s)));
      setSelectedSpot((prev) => (prev?.id === spotId ? { ...prev, ...patch } : prev));
      invalidateSpotIdRef.current?.(spotId);
    },
    [],
  );

  const pickImageBlobFromWeb = useCallback(async (): Promise<Blob | null> => {
    if (Platform.OS !== "web" || typeof document === "undefined") return null;
    return await new Promise<Blob | null>((resolve) => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      input.style.position = "fixed";
      input.style.left = "-9999px";
      let settled = false;
      const finalize = (blob: Blob | null) => {
        if (settled) return;
        settled = true;
        input.onchange = null;
        input.oncancel = null;
        input.remove();
        resolve(blob);
      };
      input.onchange = () => {
        const file = input.files?.[0];
        finalize(file instanceof Blob ? file : null);
      };
      input.oncancel = () => finalize(null);
      document.body.appendChild(input);
      input.click();
      window.setTimeout(() => finalize(null), 30000);
    });
  }, []);

  const handleQuickAddImageFromSearch = useCallback(
    async (spot: Spot) => {
      if (!isAuthUser && !(await requireAuthOrModal(AUTH_MODAL_MESSAGES.editSpot))) return;
      try {
        let sourceBlob: Blob | null = null;
        if (Platform.OS === "web") {
          sourceBlob = await pickImageBlobFromWeb();
          if (!sourceBlob) return;
        } else {
          const ImagePicker = await import("expo-image-picker");
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.85,
          });
          if (result.canceled || !result.assets?.[0]) return;
          const asset = result.assets[0] as (typeof result.assets)[number] & { file?: Blob };
          if (asset.file instanceof Blob) {
            sourceBlob = asset.file;
          } else if (asset.uri) {
            const res = await fetch(asset.uri);
            if (!res.ok) {
              if (!suppressToastRef.current) {
                toast.show("No se pudo leer la imagen seleccionada.", { type: "error" });
              }
              return;
            }
            sourceBlob = await res.blob();
          }
        }

        if (!sourceBlob) {
          if (!suppressToastRef.current) {
            toast.show("No se detectó una imagen válida para subir.", { type: "error" });
          }
          return;
        }

        const optimized = await optimizeSpotImage(sourceBlob);
        const toUpload = optimized.ok ? optimized.blob : optimized.fallbackBlob;
        if (!toUpload) {
          if (!suppressToastRef.current) toast.show("No se pudo procesar la imagen.", { type: "error" });
          return;
        }
        const coverUrl = await uploadSpotCover(spot.id, toUpload);
        if (!coverUrl) {
          if (!suppressToastRef.current) toast.show("No se pudo subir la imagen.", { type: "error" });
          return;
        }
        const { error } = await supabase
          .from("spots")
          .update({ cover_image_url: coverUrl })
          .eq("id", spot.id);
        if (error) {
          if (!suppressToastRef.current) toast.show("No se pudo guardar la imagen.", { type: "error" });
          return;
        }
        patchSpotSearchMetadata(spot.id, { cover_image_url: coverUrl });
        if (!suppressToastRef.current) toast.show("Imagen agregada.", { type: "success", replaceVisible: true });
      } catch {
        if (!suppressToastRef.current) toast.show("No se pudo completar la carga de imagen.", { type: "error" });
      }
    },
    [isAuthUser, patchSpotSearchMetadata, pickImageBlobFromWeb, requireAuthOrModal, toast],
  );

  const handleQuickEditDescriptionOpen = useCallback((spot: Spot) => {
    if (createSpotNameOverlayOpen) return;
    quickDescBackdropGuardUntilRef.current = Date.now() + 350;
    setQuickDescSpot(spot);
    setQuickDescValue(spot.description_short?.trim() ?? "");
  }, [createSpotNameOverlayOpen]);

  const handleQuickEditDescriptionClose = useCallback(() => {
    if (quickDescSaving) return;
    setQuickDescSpot(null);
    setQuickDescValue("");
  }, [quickDescSaving]);

  const handleQuickEditDescriptionBackdropPress = useCallback(() => {
    if (Date.now() < quickDescBackdropGuardUntilRef.current) return;
    handleQuickEditDescriptionClose();
  }, [handleQuickEditDescriptionClose]);

  const handleQuickEditDescriptionSave = useCallback(async () => {
    if (!quickDescSpot) return;
    if (!(await requireAuthOrModal(AUTH_MODAL_MESSAGES.editSpot))) return;
    const nextValue = quickDescValue.trim();
    const currentValue = quickDescSpot.description_short?.trim() ?? "";
    if (nextValue === currentValue) {
      handleQuickEditDescriptionClose();
      return;
    }
    setQuickDescSaving(true);
    try {
      const { error } = await supabase
        .from("spots")
        .update({ description_short: nextValue.length > 0 ? nextValue : null })
        .eq("id", quickDescSpot.id);
      if (error) {
        if (!suppressToastRef.current) toast.show("No se pudo guardar la descripción.", { type: "error" });
        return;
      }
      patchSpotSearchMetadata(quickDescSpot.id, {
        description_short: nextValue.length > 0 ? nextValue : null,
      });
      if (!suppressToastRef.current) toast.show("Descripción actualizada.", { type: "success", replaceVisible: true });
      setQuickDescSpot(null);
      setQuickDescValue("");
    } finally {
      setQuickDescSaving(false);
    }
  }, [
    handleQuickEditDescriptionClose,
    patchSpotSearchMetadata,
    quickDescSpot,
    quickDescValue,
    requireAuthOrModal,
    toast,
  ]);

  const SKIP_CREATE_SPOT_CONFIRM_KEY = "flowya_create_spot_skip_confirm";

  const handleMapLongPress = useCallback(
    async (coords: { lat: number; lng: number }) => {
      if (!(await requireAuthOrModal(AUTH_MODAL_MESSAGES.createSpot))) return;
      setSelectedSpot(null);
      searchV2.setOpen(false);
      blurActiveElement();
      const skipConfirm =
        typeof localStorage !== "undefined" &&
        localStorage.getItem(SKIP_CREATE_SPOT_CONFIRM_KEY) === "true";
      if (skipConfirm) {
        setCreateSpotPendingCoords(coords);
        setCreateSpotInitialName(undefined);
        setCreateSpotNameOverlayOpen(true);
      } else {
        setPendingCreateSpotCoords(coords);
        setShowCreateSpotConfirmModal(true);
      }
    },
    [requireAuthOrModal, searchV2],
  );
  useEffect(() => {
    onLongPressHandlerRef.current = handleMapLongPress;
  }, [handleMapLongPress]);

  // CONTRATO: Search full-screen — al cerrar Search, restaurar sheetState+selectedSpot si no fueron modificados
  const wasSearchOpenRef = useRef(searchV2.isOpen);
  useEffect(() => {
    const wasOpen = wasSearchOpenRef.current;
    wasSearchOpenRef.current = searchV2.isOpen;
    const prev = prevSelectedSpotRef.current;
    const shouldRestoreSelection = shouldRestoreSelectionOnSearchClose({
      wasSearchOpen: wasOpen,
      isSearchOpen: searchV2.isOpen,
      hasPreviousSelection: prev != null,
      hasCurrentSelection: selectedSpot != null || poiTapped != null,
    });
    if (shouldRestoreSelection && prev != null) {
      setSelectedSpot(prev);
      setSheetState(prevSheetStateRef.current);
      prevSelectedSpotRef.current = null;
    }
    if (wasOpen && !searchV2.isOpen) {
      setShowFilteredResultsOnEmpty(false);
      const countriesSnapshot = countriesSheetBeforeSearchRef.current;
      countriesSheetBeforeSearchRef.current = null;
      if (
        countriesSnapshot?.wasOpen &&
        !createSpotNameOverlayOpen &&
        sheetState === "peek" &&
        (pinFilter === "saved" || pinFilter === "visited")
      ) {
        setCountriesSheetState(countriesSnapshot.state);
        setCountriesSheetOpen(true);
      }
    }
  }, [
    searchV2.isOpen,
    selectedSpot,
    poiTapped,
    setSheetState,
    createSpotNameOverlayOpen,
    sheetState,
    pinFilter,
  ]);

  const handleCreateSpotConfirm = useCallback(
    (dontShowAgain: boolean) => {
      if (pendingCreateSpotCoords === null) return;
      if (dontShowAgain && typeof localStorage !== "undefined") {
        localStorage.setItem(SKIP_CREATE_SPOT_CONFIRM_KEY, "true");
      }
      setCreateSpotPendingCoords(pendingCreateSpotCoords);
      setCreateSpotInitialName(undefined);
      setCreateSpotNameOverlayOpen(true);
      setPendingCreateSpotCoords(null);
      setShowCreateSpotConfirmModal(false);
    },
    [pendingCreateSpotCoords],
  );

  const handleCreateSpotConfirmCancel = useCallback(() => {
    setPendingCreateSpotCoords(null);
    setShowCreateSpotConfirmModal(false);
  }, []);

  /** Cerrar Paso 0 (tap fuera): sin side effects, vuelve al mapa. */
  const handleCloseCreateSpotNameOverlay = useCallback(() => {
    blurActiveElement();
    setCreateSpotNameOverlayOpen(false);
    setCreateSpotPendingCoords(null);
    setCreateSpotInitialName(undefined);
  }, []);

  /** Confirmar nombre en Paso 0 → continuar al draft con ese nombre. */
  const onConfirmCreateSpotName = useCallback(
    (name: string) => {
      if (!createSpotPendingCoords) return;
      startDraftCreateSpot(createSpotPendingCoords, name.trim() || "Nuevo lugar");
      setCreateSpotNameOverlayOpen(false);
      setCreateSpotPendingCoords(null);
      setCreateSpotInitialName(undefined);
    },
    [createSpotPendingCoords, startDraftCreateSpot],
  );

  const stageLabel =
    countriesDrilldown && searchV2.isOpen
      ? countriesDrilldown.label
      : pinFilter === "visited"
      ? "Cerca de aquí"
      : pinFilter === "saved"
        ? "En esta zona"
        : searchV2.stage === "viewport"
          ? "En esta zona"
          : searchV2.stage === "expanded"
            ? "Cerca de aquí"
            : "En todo el mapa";
  const searchIsOpen = searchV2.isOpen;
  const searchQuery = searchV2.query;
  const setSearchQuery = searchV2.setQuery;
  useEffect(() => {
    if (searchIsOpen) return;
    if (countriesDrilldown == null) return;
    setCountriesDrilldown(null);
  }, [searchIsOpen, countriesDrilldown]);
  useEffect(() => {
    if (countriesDrilldown == null) return;
    const normalizedQuery = normalizeCountryToken(searchQuery);
    if (normalizedQuery.length === 0) return;
    if (normalizedQuery === normalizeCountryToken(countriesDrilldown.label)) return;
    setCountriesDrilldown(null);
  }, [searchQuery, countriesDrilldown]);

  const showCountriesCounter =
    !createSpotNameOverlayOpen &&
    !searchIsOpen &&
    isAuthUser &&
    sheetState === "peek" &&
    (pinFilter === "saved" || pinFilter === "visited");
  const [countriesOverlayMounted, setCountriesOverlayMounted] = useState(showCountriesCounter);
  const [countriesOverlayAnchorMode, setCountriesOverlayAnchorMode] = useState<
    "center-group" | "center-mid" | "bottom"
  >("center-group");
  const [countriesOverlayFilter, setCountriesOverlayFilter] = useState<"saved" | "visited">(
    countriesFilterForActiveCounter,
  );
  const [countriesSheetOpen, setCountriesSheetOpen] = useState(false);
  const [countriesSheetListView, setCountriesSheetListView] = useState<CountriesSheetListDetail | null>(
    null,
  );
  const [countriesMapSnapshot, setCountriesMapSnapshot] = useState<string | null>(null);
  const [isCountriesShareInFlight, setIsCountriesShareInFlight] = useState(false);
  const [showFilteredResultsOnEmpty, setShowFilteredResultsOnEmpty] = useState(false);
  const isCountriesShareInFlightRef = useRef(false);
  const countriesSheetForcedFilterRef = useRef<"saved" | "visited" | null>(null);
  /** Pin al abrir (o tras último cambio con sheet abierto); si el usuario cambia el filtro, se suelta `forcedFilter`. */
  const countriesSheetPinAnchorRef = useRef<MapPinFilterValue | null>(null);
  const lastCountriesShareAtRef = useRef(0);
  const countriesShareConsumedRef = useRef(false);
  const showCountriesCounterBubble = showCountriesCounter && !countriesSheetOpen;
  const entrySloganOccludedByOverlay =
    searchV2.isOpen ||
    countriesSheetOpen ||
    ((selectedSpot != null || poiTapped != null) &&
      (sheetState === "medium" || sheetState === "expanded"));
  const [countriesSheetState, setCountriesSheetState] = useState<CountriesSheetState>("expanded");
  /** Por filtro de pin Por visitar / Visitados: abierto + peek|medium|expanded al volver de Todos o al cambiar de filtro. */
  const countriesSheetPersistRef = useRef<{
    saved: { open: boolean; state: CountriesSheetState };
    visited: { open: boolean; state: CountriesSheetState };
  }>({
    saved: { open: false, state: "expanded" },
    visited: { open: false, state: "expanded" },
  });
  const countriesSheetOpenRef = useRef(countriesSheetOpen);
  const countriesSheetStateRef = useRef(countriesSheetState);
  const prevPinFilterForCountriesRef = useRef(pinFilter);
  countriesSheetOpenRef.current = countriesSheetOpen;
  countriesSheetStateRef.current = countriesSheetState;
  const [welcomeSheetState, setWelcomeSheetState] = useState<ExploreWelcomeSheetState>("medium");
  const [welcomeSheetHeight, setWelcomeSheetHeight] = useState(0);
  /** Al ocultar el sheet inicial (búsqueda, países, etc.) guardamos peek/medium para restaurar al volver. */
  const prevWelcomeSheetStateRef = useRef<ExploreWelcomeSheetState>("medium");
  const prevExploreWelcomeVisibleRef = useRef(false);
  /** Antes: se silenciaban todos los toasts con CountriesSheet en expanded; eso ocultaba feedback (p. ej. pin) sin relación con el sheet. */
  suppressToastRef.current = false;
  /** Actualizar aquí (no al final del render) para que coincida con sheet expanded antes de handlers/eventos. */
  const isSpotSheetVisibleForToast = selectedSpot != null || poiTapped != null;
  const showExploreWelcomeForToast =
    !createSpotNameOverlayOpen &&
    !searchV2.isOpen &&
    !countriesSheetOpen &&
    selectedSpot == null &&
    poiTapped == null &&
    pinFilter === "all" &&
    isGlobeEntryMotionSettled;
  filterChangeToastSuppressedRef.current =
    (sheetState === "expanded" && isSpotSheetVisibleForToast) ||
    (countriesSheetOpen && countriesSheetState === "expanded") ||
    (showExploreWelcomeForToast && welcomeSheetState === "expanded");

  useEffect(() => {
    if (entrySloganOccludedByOverlay) dismissEntrySlogan();
  }, [entrySloganOccludedByOverlay, dismissEntrySlogan]);

  const countriesBucketsForOverlay =
    countriesOverlayFilter === "saved"
      ? countriesBucketsByFilter.saved
      : countriesBucketsByFilter.visited;
  const countriesOverlayScheme = (colorScheme === "dark" ? "dark" : "light") as "light" | "dark";
  const countriesOverlayColors = Colors[countriesOverlayScheme];
  const countriesCounterBackgroundColor =
    countriesOverlayFilter === "saved"
      ? countriesOverlayColors.countriesCounterToVisitBackground
      : countriesOverlayColors.countriesCounterVisitedBackground;
  const countriesCounterBorderColor =
    countriesOverlayFilter === "saved"
      ? countriesOverlayColors.countriesCounterToVisitBorder
      : countriesOverlayColors.countriesCounterVisitedBorder;
  const countriesCountForOverlay = countriesBucketsForOverlay.length;
  const countriesPlacesCountForOverlay = useMemo(
    () => countriesBucketsForOverlay.reduce((total, country) => total + country.count, 0),
    [countriesBucketsForOverlay],
  );
  const countriesWorldPercentageForOverlay = useMemo(
    () => Math.round((countriesCountForOverlay / 195) * 100),
    [countriesCountForOverlay],
  );
  const countriesSnapshotSignature = useMemo(
    () =>
      `${countriesOverlayFilter}|${countriesBucketsForOverlay
        .map((item) => `${item.key}:${item.count}`)
        .join(",")}`,
    [countriesOverlayFilter, countriesBucketsForOverlay],
  );

  /** Mismo criterio que `buildCountryBuckets` / buckets del sheet (no el pinFilter del mapa). */
  const countriesSheetOverlaySpotsPool = useMemo(
    () =>
      countriesOverlayFilter === "saved"
        ? spots.filter((s) => s.pinStatus === "to_visit")
        : spots.filter((s) => s.pinStatus === "visited"),
    [spots, countriesOverlayFilter],
  );

  const countriesSheetDetailBaseSpots = useMemo(() => {
    if (!countriesSheetListView) return [];
    if (countriesSheetListView.kind === "all_places") {
      return countriesSheetOverlaySpotsPool;
    }
    return countriesSheetOverlaySpotsPool.filter((spot) => {
      const resolved = resolveCountryForSpot(spot);
      return resolved?.key === countriesSheetListView.key;
    });
  }, [countriesSheetListView, countriesSheetOverlaySpotsPool]);

  const countriesSheetDetailSpots = useMemo(
    () =>
      filterExploreSearchItemsByTag(countriesSheetDetailBaseSpots, selectedTagFilterId, pinTagIndex),
    [countriesSheetDetailBaseSpots, selectedTagFilterId, pinTagIndex],
  );

  const countriesSheetDetailTagSpotIds = useMemo(() => {
    if (!countriesSheetListView) return new Set<string>();
    return new Set(countriesSheetDetailBaseSpots.map((s) => s.id));
  }, [countriesSheetListView, countriesSheetDetailBaseSpots]);

  const countriesSheetDetailTagFilterOptions = useMemo(() => {
    if (!isAuthUser || !countriesSheetListView) return [];
    return countTagsInSpotIds(userTags, countriesSheetDetailTagSpotIds, pinTagIndex).map((tc) => ({
      id: tc.tag.id,
      name: tc.tag.name,
      count: tc.count,
    }));
  }, [isAuthUser, countriesSheetListView, userTags, countriesSheetDetailTagSpotIds, pinTagIndex]);

  useEffect(() => {
    if (!isAuthUser || countriesSheetListView == null) return;
    if (selectedTagFilterId == null) return;
    const stillValid = countriesSheetDetailTagFilterOptions.some((o) => o.id === selectedTagFilterId);
    if (!stillValid) setSelectedTagFilterId(null);
  }, [
    isAuthUser,
    countriesSheetListView,
    countriesSheetDetailTagFilterOptions,
    selectedTagFilterId,
  ]);

  useEffect(() => {
    let isCancelled = false;
    const cleanup = () => {
      isCancelled = true;
      if (countriesOverlayDelayRef.current) {
        clearTimeout(countriesOverlayDelayRef.current);
        countriesOverlayDelayRef.current = null;
      }
    };
    const animateIn = () => {
      if (countriesOverlayDelayRef.current) {
        clearTimeout(countriesOverlayDelayRef.current);
      }
      countriesOverlayDelayRef.current = setTimeout(() => {
        if (isCancelled) return;
        countriesOverlayEntry.setValue(0);
        Animated.timing(countriesOverlayEntry, {
          toValue: 1,
          duration: 220,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }).start();
      }, COUNTRIES_OVERLAY_ENTRY_DELAY_MS);
    };
    const animateOut = (onEnd?: () => void) => {
      if (countriesOverlayDelayRef.current) {
        clearTimeout(countriesOverlayDelayRef.current);
        countriesOverlayDelayRef.current = null;
      }
      Animated.timing(countriesOverlayEntry, {
        toValue: 2,
        duration: 160,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: false,
      }).start(({ finished }) => {
        if (!finished || isCancelled) return;
        onEnd?.();
      });
    };

    countriesOverlayEntry.stopAnimation();

    if (!showCountriesCounterBubble) {
      if (!countriesOverlayMounted) return cleanup;
      animateOut(() => setCountriesOverlayMounted(false));
      return cleanup;
    }

    if (!countriesOverlayMounted) {
      setCountriesOverlayMounted(true);
      setCountriesOverlayFilter(countriesFilterForActiveCounter);
      animateIn();
      return cleanup;
    }

    if (countriesOverlayFilter !== countriesFilterForActiveCounter) {
      animateOut(() => {
        setCountriesOverlayFilter(countriesFilterForActiveCounter);
        animateIn();
      });
      return cleanup;
    }

    animateIn();
    return cleanup;
  }, [
    showCountriesCounterBubble,
    countriesOverlayMounted,
    countriesOverlayFilter,
    countriesFilterForActiveCounter,
    countriesOverlayEntry,
  ]);

  useEffect(() => {
    if (showCountriesCounter || countriesSheetForcedFilterRef.current != null) return;
    setCountriesSheetOpen(false);
    setCountriesSheetListView(null);
    setCountriesSheetHeight(0);
    setCountriesDrilldown(null);
  }, [showCountriesCounter]);
  useEffect(() => {
    if (countriesSheetOpen) return;
    countriesSheetForcedFilterRef.current = null;
    countriesShareConsumedRef.current = false;
    countriesSheetPinAnchorRef.current = null;
  }, [countriesSheetOpen]);
  /**
   * Si el usuario cambia Todos / Por visitar / Visitados con el sheet de países abierto,
   * el ref `forcedFilter` (p. ej. tras pastilla flows + pin aún no alineado) no debe anular el mapa.
   */
  useEffect(() => {
    if (!countriesSheetOpen) {
      countriesSheetPinAnchorRef.current = null;
      return;
    }
    const anchor = countriesSheetPinAnchorRef.current;
    if (anchor === null) {
      countriesSheetPinAnchorRef.current = pinFilter;
      return;
    }
    if (anchor !== pinFilter) {
      countriesSheetForcedFilterRef.current = null;
      countriesSheetPinAnchorRef.current = pinFilter;
    }
  }, [pinFilter, countriesSheetOpen]);
  useEffect(() => {
    if (!countriesSheetOpen) return;
    const targetFilter = countriesSheetForcedFilterRef.current ?? countriesFilterForActiveCounter;
    if (countriesOverlayFilter === targetFilter) return;
    setCountriesOverlayFilter(targetFilter);
    setCountriesSheetListView(null);
  }, [countriesSheetOpen, countriesOverlayFilter, countriesFilterForActiveCounter]);
  useEffect(() => {
    if (!countriesSheetOpen) return;
    // Guardrail de calidad: forzar snapshot fresco al abrir/cambiar dataset antes de compartir.
    setCountriesMapSnapshot(null);
  }, [countriesSheetOpen, countriesSnapshotSignature]);
  useEffect(() => {
    collapseCountriesSheetOnMapGestureRef.current = () => {
      if (!countriesSheetOpen) return;
      setCountriesSheetState("peek");
    };
  }, [countriesSheetOpen]);

  useEffect(() => {
    if (pinFilter !== "saved" && pinFilter !== "visited") return;
    const key = pinFilter === "visited" ? "visited" : "saved";
    countriesSheetPersistRef.current[key] = {
      open: countriesSheetOpen,
      state: countriesSheetState,
    };
  }, [pinFilter, countriesSheetOpen, countriesSheetState]);

  useEffect(() => {
    const prev = prevPinFilterForCountriesRef.current;
    if (prev === pinFilter) return;

    if (prev === "saved" || prev === "visited") {
      const prevKey = prev === "visited" ? "visited" : "saved";
      countriesSheetPersistRef.current[prevKey] = {
        open: countriesSheetOpenRef.current,
        state: countriesSheetStateRef.current,
      };
    }
    prevPinFilterForCountriesRef.current = pinFilter;

    if (pinFilter === "saved" || pinFilter === "visited") {
      const key = pinFilter === "visited" ? "visited" : "saved";
      const snap = countriesSheetPersistRef.current[key];
      setCountriesOverlayFilter(key);
      setCountriesSheetOpen(snap.open);
      setCountriesSheetState(snap.state);
      if (!snap.open) {
        setCountriesSheetListView(null);
        setCountriesSheetHeight(0);
      }
    } else {
      setCountriesSheetOpen(false);
      setCountriesSheetListView(null);
      setCountriesSheetHeight(0);
    }
  }, [pinFilter]);

  const openCountriesSheetForFilter = useCallback((
    targetFilter: "saved" | "visited",
    options?: { requireMounted?: boolean },
  ) => {
    if (options?.requireMounted && !countriesOverlayMounted) return;
    countriesSheetForcedFilterRef.current =
      targetFilter === countriesFilterForActiveCounter ? null : targetFilter;
    countriesSheetPrevSelectionRef.current = {
      spot: selectedSpot,
      poi: poiTapped,
    };
    // Contrato de capas/sheets: no apilar sheets. CountriesSheet reemplaza SpotSheet activa.
    setCountriesOverlayFilter(targetFilter);
    setSelectedSpot(null);
    setPoiTapped(null);
    setSheetState("peek");
    setSheetHeight(SHEET_PEEK_HEIGHT);
    setIsPlacingDraftSpot(false);
    setDraftCoverUri(null);
    const persistKey = targetFilter === "visited" ? "visited" : "saved";
    setCountriesSheetState(countriesSheetPersistRef.current[persistKey].state);
    setCountriesSheetOpen(true);
    setCountriesSheetListView(null);
  }, [countriesOverlayMounted, countriesFilterForActiveCounter, poiTapped, selectedSpot, setSheetState]);

  const handleCountriesCounterPress = useCallback(() => {
    openCountriesSheetForFilter(countriesOverlayFilter, { requireMounted: true });
  }, [countriesOverlayFilter, openCountriesSheetForFilter]);

  const handleVisitedCountriesPress = useCallback(async () => {
    const allowed = await requireAuthOrModal("Inicia sesión para ver tus países visitados.");
    if (!allowed) return;
    // Paridad con el contador flotante del mapa: el sheet debe abrir con el mismo criterio que el filtro
    // superior (Visitados / Por visitar). La pastilla refleja países visitados + flows: activar «Visitados»
    // si el usuario estaba en Todos o Por visitar, para no perder contexto respecto al contador.
    if (pinFilter !== "visited") {
      handlePinFilterChange("visited", {
        reframe: false,
        /** Sin toast: el sheet de países (a menudo expanded) ya comunica el contexto. */
        toastMessage: "",
      });
    }
    openCountriesSheetForFilter("visited");
  }, [handlePinFilterChange, openCountriesSheetForFilter, pinFilter, requireAuthOrModal]);

  const handleCountriesSheetClose = useCallback(() => {
    countriesSheetForcedFilterRef.current = null;
    setCountriesSheetListView(null);
    setCountriesSheetOpen(false);
    const snapshot = countriesSheetPrevSelectionRef.current;
    countriesSheetPrevSelectionRef.current = null;
    if (!snapshot) return;
    if (snapshot.spot != null) {
      setSelectedSpot(snapshot.spot);
      setPoiTapped(null);
      setSheetState("peek");
      return;
    }
    if (snapshot.poi != null) {
      setSelectedSpot(null);
      setPoiTapped(snapshot.poi);
      setSheetState("peek");
    }
  }, [setSheetState]);

  const openSearchPreservingCountriesSheet = useCallback(() => {
    if (createSpotNameOverlayOpen) return;
    setShowFilteredResultsOnEmpty(false);
    setCountriesSheetListView(null);
    countriesSheetBeforeSearchRef.current = {
      wasOpen: countriesSheetOpen,
      state: countriesSheetState,
    };
    countriesSheetPrevSelectionRef.current = null;
    if (countriesSheetOpen) setCountriesSheetOpen(false);
    prevSelectedSpotRef.current = selectedSpot;
    prevSheetStateRef.current = sheetState;
    blurActiveElement();
    searchV2.setOpen(true);
  }, [createSpotNameOverlayOpen, countriesSheetOpen, countriesSheetState, selectedSpot, sheetState, searchV2]);

  const handleCountriesKpiPress = useCallback(() => {
    if (!countriesSheetOpen) return;
    setCountriesSheetState("expanded");
  }, [countriesSheetOpen]);

  const handleCountriesSpotsKpiPress = useCallback(() => {
    if (createSpotNameOverlayOpen) return;
    setCountriesDrilldown(null);
    setShowFilteredResultsOnEmpty(false);
    if (!countriesSheetOpen) {
      openCountriesSheetForFilter(countriesOverlayFilter, { requireMounted: true });
    }
    setCountriesSheetListView({ kind: "all_places" });
    setCountriesSheetState("expanded");
  }, [
    createSpotNameOverlayOpen,
    countriesSheetOpen,
    countriesOverlayFilter,
    openCountriesSheetForFilter,
    setCountriesSheetState,
  ]);

  const handleCountryDetailBack = useCallback(() => {
    setCountriesSheetListView(null);
  }, []);

  const handleCountryDetailSpotPress = useCallback(
    (spot: Spot) => {
      deactivateSearchColdStartBootstrap();
      openFromSearchRef.current = true;
      countriesSheetPrevSelectionRef.current = null;
      countriesSheetForcedFilterRef.current = null;
      setCountriesSheetListView(null);
      setCountriesSheetOpen(false);
      setPoiTapped(null);
      setSelectedSpot(spot);
      recordExploreSelectionChanged({
        entityType: "spot",
        selectionState: "selected",
        fromFilter: pinFilter,
        toFilter: pinFilter,
      });
      setSheetState("medium");
      pushRecentViewedSpotId(spot.id);
      focusCameraOnSpot(spot);
    },
    [
      deactivateSearchColdStartBootstrap,
      focusCameraOnSpot,
      pinFilter,
      pushRecentViewedSpotId,
      setSheetState,
    ],
  );

  const handleCountryBucketPress = useCallback(
    (country: CountryBucket) => {
      setCountriesDrilldown(null);
      setCountriesSheetListView({ kind: "country", key: country.key, label: country.label });
      setCountriesSheetState("expanded");
    },
    [setCountriesSheetState],
  );
  const handleCountriesSheetShare = useCallback(async () => {
    if (countriesShareConsumedRef.current) return;
    const now = Date.now();
    // Web sometimes emits a second press/click around share flows.
    // Keep a longer cooldown to guarantee a single outbound share action.
    if (now - lastCountriesShareAtRef.current < 6000) return;
    if (isCountriesShareInFlightRef.current) return;
    if (!countriesMapSnapshot) {
      if (!suppressToastRef.current) {
        toast.show("Preparando imagen del mapa… intenta de nuevo en un momento.", {
          type: "default",
          replaceVisible: true,
        });
      }
      return;
    }
    isCountriesShareInFlightRef.current = true;
    countriesShareConsumedRef.current = true;
    setIsCountriesShareInFlight(true);
    lastCountriesShareAtRef.current = now;
    const title =
      countriesOverlayFilter === "saved" ? "Países por visitar" : "Países visitados";
    const accentColor =
      countriesOverlayFilter === "saved"
        ? Colors[colorScheme ?? "light"].stateToVisit
        : Colors[colorScheme ?? "light"].stateSuccess;
    try {
      const result = await shareCountriesCard({
        title,
        countriesCount: countriesCountForOverlay,
        spotsCount: countriesPlacesCountForOverlay,
        worldPercentage: countriesWorldPercentageForOverlay,
        accentColor,
        mapSnapshotDataUrl: countriesMapSnapshot,
        items: countriesBucketsForOverlay,
      });
      if (result.shared) return;
      if (result.downloaded) {
        if (!suppressToastRef.current) {
          toast.show("Imagen guardada en tu computadora.", { type: "success", replaceVisible: true });
        }
        return;
      }
      if (result.copied) {
        if (!suppressToastRef.current) toast.show("Resumen copiado al portapapeles.", { type: "success", replaceVisible: true });
        return;
      }
      if (!suppressToastRef.current) toast.show("No se pudo compartir en este dispositivo.", {
        type: "default",
        replaceVisible: true,
      });
    } finally {
      setTimeout(() => {
        isCountriesShareInFlightRef.current = false;
        countriesShareConsumedRef.current = false;
        setIsCountriesShareInFlight(false);
      }, 1200);
    }
  }, [
    countriesOverlayFilter,
    countriesBucketsForOverlay,
    countriesCountForOverlay,
    countriesMapSnapshot,
    countriesPlacesCountForOverlay,
    countriesWorldPercentageForOverlay,
    colorScheme,
    toast,
  ]);

  const handleCountriesMapCountryPress = useCallback(
    (_countryCode: string, bounds: [[number, number], [number, number]]) => {
      if (!mapInstance) return;
      setCountriesSheetState("peek");
      try {
        suspendFilterUntilCameraSettles();
        mapInstance.fitBounds(bounds, {
          padding: FIT_BOUNDS_PADDING,
          duration: FIT_BOUNDS_DURATION_MS,
        });
      } catch {
        // noop
      }
    },
    [mapInstance, suspendFilterUntilCameraSettles],
  );

  /** OL-WOW-F2-001-SEARCH: Todos y Por visitar/Visitados → merge spots (filtrados por estrategia) + Mapbox como en Todos. */
  const searchDisplayResults = useMemo<(Spot | PlaceResult)[]>(() => {
    const mergeLikeAllMode =
      pinFilter === "all" || pinFilter === "saved" || pinFilter === "visited";
    const normalizedQuery = normalizeCountryToken(searchV2.query);
    const isCountryDrilldownQuery =
      countriesDrilldown != null &&
      searchV2.isOpen &&
      normalizedQuery.length > 0 &&
      normalizedQuery === normalizeCountryToken(countriesDrilldown.label);
    if (isCountryDrilldownQuery) {
      if (mergeLikeAllMode) {
        return mergeSearchResults(countryDrilldownItems, placeSuggestions, searchV2.query);
      }
      return countryDrilldownItems;
    }
    const viewportTick = viewportNonce;
    if (mergeLikeAllMode) {
      return mergeSearchResults(searchV2.results, placeSuggestions, searchV2.query);
    }
    if (viewportTick < 0) return searchV2.results;
    if (!mapInstance) return searchV2.results;
    if (searchV2.results.length <= 1) return searchV2.results;
    try {
      const center = mapInstance.getCenter();
      return [...searchV2.results].sort(
        (a, b) =>
          distanceKm(center.lat, center.lng, a.latitude, a.longitude) -
          distanceKm(center.lat, center.lng, b.latitude, b.longitude),
      );
    } catch {
      return searchV2.results;
    }
  }, [
    countriesDrilldown,
    countryDrilldownItems,
    pinFilter,
    searchV2.isOpen,
    searchV2.results,
    searchV2.query,
    placeSuggestions,
    mapInstance,
    viewportNonce,
  ]);

  /** Spots filtrados por chip de etiqueta cuando la query corta no dispara la estrategia (searchV2.results vacío). */
  const searchDisplayResultsWithTag = useMemo(
    () => filterExploreSearchItemsByTag(searchDisplayResults, selectedTagFilterId, pinTagIndex),
    [searchDisplayResults, selectedTagFilterId, pinTagIndex],
  );

  const tagLabelById = useMemo(() => {
    const m = new Map<string, string>();
    for (const t of userTags) m.set(t.id, t.name);
    return m;
  }, [userTags]);

  const renderCountryDetailItem = useCallback(
    (row: SearchResultCardProps["spot"]) => {
      const spot = row as Spot;
      const distanceText: string | null =
        userCoords != null
          ? formatDistanceKm(
              distanceKm(userCoords.latitude, userCoords.longitude, spot.latitude, spot.longitude),
            )
          : null;
      const isVisitedFilter = countriesOverlayFilter === "visited";
      const descriptionShort = spot.description_short?.trim() ?? "";
      const hasDescriptionShort = descriptionShort.length > 0;
      const hasCoverImage = Boolean(spot.cover_image_url && spot.cover_image_url.trim().length > 0);
      const tagIds = spot.tagIds ?? pinTagIndex[spot.id] ?? [];
      const tagChips = tagIds.map((id) => ({
        id,
        label: tagLabelById.get(id) ?? id,
      }));
      const quickActions = [
        ...(isAuthUser
          ? [
              {
                id: `add-tag-${spot.id}`,
                label: "Etiquetar",
                kind: "add_tag" as const,
                onPress: () => {
                  setTagAssignSpot(spot);
                  setTagAssignInput("");
                },
                accessibilityLabel: `Etiquetar ${spot.title}`,
              },
            ]
          : []),
        ...(isVisitedFilter
          ? [
              ...(!hasCoverImage
                ? [
                    {
                      id: `add-image-${spot.id}`,
                      label: "Agregar imagen",
                      kind: "add_image" as const,
                      onPress: () => handleQuickAddImageFromSearch(spot),
                      accessibilityLabel: `Agregar imagen a ${spot.title}`,
                    },
                  ]
                : []),
              ...(!hasDescriptionShort
                ? [
                    {
                      id: `edit-desc-${spot.id}`,
                      label: "Escribir nota breve",
                      kind: "edit_description" as const,
                      onPress: () => handleQuickEditDescriptionOpen(spot),
                      accessibilityLabel: `Escribir una nota breve sobre ${spot.title}`,
                    },
                  ]
                : []),
            ]
          : []),
      ];
      return (
        <SearchResultCard
          spot={spot}
          onPress={() => handleCountryDetailSpotPress(spot)}
          distanceText={distanceText}
          subtitleOverride={isVisitedFilter ? (hasDescriptionShort ? descriptionShort : null) : undefined}
          quickActions={quickActions}
          tagChips={isAuthUser && tagChips.length > 0 ? tagChips : undefined}
        />
      );
    },
    [
      countriesOverlayFilter,
      handleCountryDetailSpotPress,
      handleQuickAddImageFromSearch,
      handleQuickEditDescriptionOpen,
      isAuthUser,
      pinTagIndex,
      tagLabelById,
      userCoords,
    ],
  );

  /** Chips de etiqueta en SpotSheet (ids desde pinTagIndex). */
  const sheetSpotTagChips = useMemo(() => {
    if (!selectedSpot || !isAuthUser || selectedSpot.id.startsWith("draft_")) return undefined;
    const ids = pinTagIndex[selectedSpot.id] ?? [];
    return ids.map((id) => ({ id, label: tagLabelById.get(id) ?? id }));
  }, [selectedSpot, isAuthUser, pinTagIndex, tagLabelById]);

  /** Etiquetas guardadas que aún no están en el spot (sin duplicar # en ambas secciones). */
  const tagModalAvailableToAdd = useMemo(() => {
    if (!tagAssignSpot) return [];
    const onSpot = new Set(pinTagIndex[tagAssignSpot.id] ?? []);
    const q = tagAssignInput.trim().toLowerCase();
    let list = userTags.filter((t) => !onSpot.has(t.id));
    if (q) list = list.filter((t) => t.name.toLowerCase().includes(q));
    return list.slice(0, 24);
  }, [tagAssignInput, userTags, tagAssignSpot, pinTagIndex]);

  const tagModalAddButtonLabel = useMemo(() => {
    const t = tagAssignInput.trim();
    if (!t) return "Crear";
    const match = userTags.some((u) => u.name.toLowerCase() === t.toLowerCase());
    return match ? "Añadir" : "Crear";
  }, [tagAssignInput, userTags]);

  /**
   * Pool de spots para contar etiquetas en chips: alineado a la lista vacía en Todos (curada),
   * no a todo `filteredSpots`, para que (N) coincida con las filas al activar el chip.
   */
  const spotIdsForTagFilterCounts = useMemo(() => {
    if (pinFilter === "saved" || pinFilter === "visited") {
      return new Set(filteredSpots.map((s) => s.id));
    }
    if (pinFilter !== "all") {
      return new Set(filteredSpots.map((s) => s.id));
    }
    if (searchV2.query.trim().length > 0) {
      return new Set(filteredSpots.map((s) => s.id));
    }
    if (showFilteredResultsOnEmpty) {
      return new Set(filteredSpots.map((s) => s.id));
    }
    /** Alineado a SearchSurface: si hay secciones con ítems, solo esas filas; si no, lista plana defaultItems. */
    const hasSectionRows = defaultSectionsForEmpty.some((s) => s.items.length > 0);
    const flat: (Spot | PlaceResult)[] = hasSectionRows
      ? defaultSectionsForEmpty.flatMap((s) => s.items)
      : defaultItemsForEmpty;
    const fromBrowse = collectSpotIdsFromBrowseEmptyItems(flat);
    if (fromBrowse.size > 0) return fromBrowse;
    return new Set(filteredSpots.map((s) => s.id));
  }, [
    pinFilter,
    filteredSpots,
    searchV2.query,
    showFilteredResultsOnEmpty,
    defaultItemsForEmpty,
    defaultSectionsForEmpty,
  ]);

  /** Chips de etiqueta en el buscador: solo las que tienen ≥1 spot en el pool del filtro de pin actual. */
  const spotTagFilterOptions = useMemo(() => {
    if (!isAuthUser) return [];
    return countTagsInSpotIds(userTags, spotIdsForTagFilterCounts, pinTagIndex).map((tc) => ({
      id: tc.tag.id,
      name: tc.tag.name,
      count: tc.count,
    }));
  }, [isAuthUser, userTags, spotIdsForTagFilterCounts, pinTagIndex]);

  /** Si el chip activo deja de tener ≥1 spot en el pool (p. ej. quitaste la etiqueta al último spot), limpiar filtro para no dejar lista vacía sin fila de chips. */
  useEffect(() => {
    if (!isAuthUser) return;
    if (selectedTagFilterId == null) return;
    const stillValid = spotTagFilterOptions.some((o) => o.id === selectedTagFilterId);
    if (!stillValid) {
      setSelectedTagFilterId(null);
      setTagFilterEditMode(false);
    }
  }, [isAuthUser, spotTagFilterOptions, selectedTagFilterId]);

  const kpiSpotsSearchResults = useMemo<(Spot | PlaceResult)[]>(() => {
    if (!showFilteredResultsOnEmpty) return searchDisplayResultsWithTag;
    if (!searchV2.isOpen || searchV2.query.trim().length > 0) return searchDisplayResultsWithTag;
    if (pinFilter !== "saved" && pinFilter !== "visited") return searchDisplayResultsWithTag;
    if (!mapInstance || filteredSpots.length <= 1) {
      return filterExploreSearchItemsByTag(filteredSpots, selectedTagFilterId, pinTagIndex);
    }
    try {
      const center = mapInstance.getCenter();
      const sorted = [...filteredSpots].sort(
        (a, b) =>
          distanceKm(center.lat, center.lng, a.latitude, a.longitude) -
          distanceKm(center.lat, center.lng, b.latitude, b.longitude),
      );
      return filterExploreSearchItemsByTag(sorted, selectedTagFilterId, pinTagIndex);
    } catch {
      return filterExploreSearchItemsByTag(filteredSpots, selectedTagFilterId, pinTagIndex);
    }
  }, [
    showFilteredResultsOnEmpty,
    searchDisplayResultsWithTag,
    searchV2.isOpen,
    searchV2.query,
    pinFilter,
    mapInstance,
    filteredSpots,
    selectedTagFilterId,
    pinTagIndex,
  ]);
  const searchResultSections = useMemo<SearchSection<Spot | PlaceResult>[]>(() => {
    const normalizedQuery = normalizeCountryToken(searchV2.query);
    const isCountryDrilldownQuery =
      countriesDrilldown != null &&
      searchV2.isOpen &&
      normalizedQuery.length > 0 &&
      normalizedQuery === normalizeCountryToken(countriesDrilldown.label);
    if (isCountryDrilldownQuery) {
      if (countryDrilldownItems.length === 0) return [];
      return [
        {
          id: "country-query-drilldown",
          title: `Lugares en ${countriesDrilldown.label}`,
          items: countryDrilldownItems,
        },
      ];
    }
    const viewportTick = viewportNonce;
    if (viewportTick < 0) return [];
    if (pinFilter !== "saved" && pinFilter !== "visited") return [];
    if (searchDisplayResultsWithTag.length === 0) return [];
    if (!mapInstance) return [];
    try {
      const center = mapInstance.getCenter();
      const nearby = searchDisplayResultsWithTag.filter((spot) => {
        const lat = "latitude" in spot ? spot.latitude : (spot as PlaceResult).lat;
        const lng = "longitude" in spot ? spot.longitude : (spot as PlaceResult).lng;
        return distanceKm(center.lat, center.lng, lat, lng) <= SPOTS_ZONA_RADIUS_KM;
      });
      const inWorld = searchDisplayResultsWithTag.filter((spot) => {
        const lat = "latitude" in spot ? spot.latitude : (spot as PlaceResult).lat;
        const lng = "longitude" in spot ? spot.longitude : (spot as PlaceResult).lng;
        return distanceKm(center.lat, center.lng, lat, lng) > SPOTS_ZONA_RADIUS_KM;
      });
      const sections: SearchSection<Spot | PlaceResult>[] = [];
      if (nearby.length > 0) {
        sections.push({ id: "nearby", title: "Lugares en la zona", items: nearby });
      }
      if (inWorld.length > 0) {
        sections.push({ id: "world", title: "Lugares en el mapa", items: inWorld });
      }
      return sections;
    } catch {
      return [];
    }
  }, [
    countriesDrilldown,
    countryDrilldownItems,
    pinFilter,
    searchV2.isOpen,
    searchV2.query,
    searchDisplayResultsWithTag,
    mapInstance,
    viewportNonce,
  ]);

  /** Guardrail Search V2: al cambiar filtro saved/visited/all, re-ejecutar query activa para evitar resultados stale cross-filter. */
  useEffect(() => {
    if (searchFilterRefreshRef.current === pinFilter) return;
    searchFilterRefreshRef.current = pinFilter;
    if (!searchIsOpen) return;
    const q = searchQuery.trim();
    if (q.length < 3) return;
    setSearchQuery(searchQuery);
  }, [pinFilter, searchIsOpen, searchQuery, setSearchQuery]);

  /** Mismo guardrail al cambiar filtro por tag. */
  useEffect(() => {
    if (searchTagFilterRefreshRef.current === selectedTagFilterId) return;
    searchTagFilterRefreshRef.current = selectedTagFilterId;
    if (!searchIsOpen) return;
    const q = searchQuery.trim();
    if (q.length < 3) return;
    setSearchQuery(searchQuery);
  }, [selectedTagFilterId, searchIsOpen, searchQuery, setSearchQuery]);

  useEffect(() => {
    if (!searchV2.isOpen) return;
    if (!showFilteredResultsOnEmpty) return;
    if (searchV2.query.trim().length > 0) setShowFilteredResultsOnEmpty(false);
  }, [searchV2.isOpen, searchV2.query, showFilteredResultsOnEmpty]);

  /** Reordenar resultados por viewport al terminar navegación de mapa (moveend). */
  useEffect(() => {
    if (pinFilter !== "saved" && pinFilter !== "visited") return;
    if (viewportRefreshNonceRef.current === viewportNonce) return;
    viewportRefreshNonceRef.current = viewportNonce;
    if (!searchIsOpen) return;
    const q = searchQuery.trim();
    if (q.length < 3) return;
    setSearchQuery(searchQuery);
  }, [viewportNonce, pinFilter, searchIsOpen, searchQuery, setSearchQuery]);

  const handlePinClick = useCallback(
    (spot: Spot) => {
      if (selectedSpot?.id === spot.id) {
        setSheetState("expanded");
      } else {
        recordExploreDecisionStarted({
          source: "map",
          pinFilter,
          hasSelection: true,
        });
        setPoiTapped(null);
        setSelectedSpot(spot);
        recordExploreSelectionChanged({
          entityType: "spot",
          selectionState: "selected",
          fromFilter: pinFilter,
          toFilter: pinFilter,
        });
        setSheetState("medium");
      }
    },
    [selectedSpot?.id, setSheetState, pinFilter],
  );

  useEffect(() => {
    onPinClickHandlerRef.current = handlePinClick;
  }, [handlePinClick]);

  const handleSelectedPinTap = useCallback(() => {
    if (!selectedSpot) return;
    setSheetState("expanded");
  }, [selectedSpot, setSheetState]);

  const handleSheetOpenDetail = useCallback(() => {
    if (!selectedSpot) return;
    recordExploreDecisionCompleted({
      outcome: "opened_detail",
      pinFilter,
    });
    saveFocusBeforeNavigate();
    blurActiveElement();
    (router.push as (href: string) => void)(`/spot/${selectedSpot.id}`);
  }, [selectedSpot, router, pinFilter]);

  const handleProfilePress = useCallback(async () => {
    if (!(await requireAuthOrModal(AUTH_MODAL_MESSAGES.profile))) return;
    const { data: { user } } = await supabase.auth.getUser();
    const accountLabel = resolveAccountDisplayLabel(user);
    const nextShowLogoutOption = !showLogoutOption;
    setShowLogoutOption(nextShowLogoutOption);
    // Hint contextual: solo cuando se abre la opción de logout estando autenticado.
    if (nextShowLogoutOption) {
      if (!suppressToastRef.current) toast.show(`Hola ${accountLabel}.`, { type: "default", replaceVisible: true });
    }
  }, [requireAuthOrModal, showLogoutOption, toast]);

  const handleLogoutPress = useCallback(() => {
    setShowLogoutConfirm(true);
  }, []);

  const handleLogoutConfirm = useCallback(async () => {
    setShowLogoutConfirm(false);
    setShowLogoutOption(false);
    await supabase.auth.signOut();
  }, []);

  const handleShare = useCallback(
    async (spot: Spot) => {
      if (spot.id.startsWith("draft_")) return;
      const result = await shareSpot(spot.id, spot.title);
      if (result.copied) if (!suppressToastRef.current) toast.show("Link copiado", { type: "success" });
    },
    [toast],
  );

  const updateSpotPinState = useCallback(
    (spotId: string, next: { saved: boolean; visited: boolean }) => {
      const pinStatus: SpotPinStatus = next.visited
        ? "visited"
        : next.saved
          ? "to_visit"
          : "default";
      setSpots((prev) =>
        prev.map((s) =>
          s.id === spotId
            ? { ...s, saved: next.saved, visited: next.visited, pinStatus }
            : s,
        ),
      );
      setSelectedSpot((prev) =>
        prev?.id === spotId
          ? prev
            ? { ...prev, saved: next.saved, visited: next.visited, pinStatus }
            : null
          : prev,
      );
    },
    [],
  );

  const handleSavePin = useCallback(
    async (
      spot: Spot,
      targetStatus?:
        | "to_visit"
        | "visited"
        | "clear_to_visit"
        | "clear_visited",
    ) => {
      if (spot.id.startsWith("draft_")) return;
      const userId = await getCurrentUserId();
      if (!userId) {
        openAuthModal({
          message: AUTH_MODAL_MESSAGES.savePin,
          onSuccess: () => handleSavePin(spot, targetStatus),
        });
        return;
      }
      const currentSaved = Boolean(spot.saved ?? (spot.pinStatus === "to_visit"));
      const currentVisited = Boolean(spot.visited ?? (spot.pinStatus === "visited"));
      const currentState = { saved: currentSaved, visited: currentVisited };
      let requestedState = currentState;
      switch (targetStatus) {
        case "to_visit":
          requestedState = { saved: true, visited: false };
          break;
        case "visited":
          requestedState = { saved: false, visited: true };
          break;
        case "clear_to_visit":
          requestedState = { saved: false, visited: currentVisited };
          break;
        case "clear_visited":
          requestedState = { saved: currentSaved, visited: false };
          break;
        default:
          requestedState = currentVisited
            ? { saved: false, visited: false }
            : { saved: true, visited: false };
          break;
      }
      const normalizedState = requestedState.visited
        ? { saved: false, visited: true }
        : { saved: requestedState.saved, visited: false };
      if (
        normalizedState.saved === currentState.saved &&
        normalizedState.visited === currentState.visited
      ) {
        return;
      }
      const nextState = await setPinState(spot.id, normalizedState);
      if (!nextState) return;
      const nextPinStatus: SpotPinStatus = nextState.visited
        ? "visited"
        : nextState.saved
          ? "to_visit"
          : "default";
      const nextSpotSelection: Spot = {
        ...spot,
        saved: nextState.saved,
        visited: nextState.visited,
        pinStatus: nextPinStatus,
      };
      const isExplicitClearAction =
        targetStatus === "clear_to_visit" || targetStatus === "clear_visited";
      if (isExplicitClearAction && !nextState.saved && !nextState.visited) {
        preserveOutOfFilterSelectionSpotIdRef.current = spot.id;
      } else if (preserveOutOfFilterSelectionSpotIdRef.current === spot.id) {
        preserveOutOfFilterSelectionSpotIdRef.current = null;
      }

      const transition = resolveFilterTransitionPolicy({
        currentFilter: pinFilter,
        nextSaved: nextState.saved,
        nextVisited: nextState.visited,
        policy: "sticky",
      });

      if (!nextState.saved && !nextState.visited) {
        if (lastStatusSpotIdRef.current.saved === spot.id) {
          lastStatusSpotIdRef.current.saved = null;
        }
        if (lastStatusSpotIdRef.current.visited === spot.id) {
          lastStatusSpotIdRef.current.visited = null;
        }
        updatePendingFilterBadges((prev) => ({ ...prev, saved: false, visited: false }));
      } else if (transition.ctaTargetFilter && transition.ctaTargetFilter !== "all") {
        const destinationFilter = transition.ctaTargetFilter;
        lastStatusSpotIdRef.current[destinationFilter] = spot.id;
        if (destinationFilter === "visited" && lastStatusSpotIdRef.current.saved === spot.id) {
          lastStatusSpotIdRef.current.saved = null;
        }
        if (shouldMarkPendingBadge({ currentFilter: pinFilter })) {
          updatePendingFilterBadges((prev) => ({
            ...prev,
            [destinationFilter]: true,
          }));
        }
      }
      if (transition.shouldPulse) {
        setPinFilterPulseNonce((n) => n + 1);
      }

      updateSpotPinState(spot.id, nextState);
      setSelectedSpot(nextSpotSelection);
      setRecentMutation(spot.id, pinFilter);
      if (mapInstance && !isPointVisibleInViewport(mapInstance, spot.longitude, spot.latitude)) {
        flyToUnlessActMode(
          { lng: spot.longitude, lat: spot.latitude },
          { zoom: SPOT_FOCUS_ZOOM, duration: FIT_BOUNDS_DURATION_MS },
        );
      }
      const outcome = nextState.visited
        ? "visited"
        : nextState.saved
          ? "saved"
          : "dismissed";
      recordExploreDecisionCompleted({ outcome, pinFilter });
      setSheetState("medium");
      if (!suppressToastRef.current && !filterChangeToastSuppressedRef.current) {
        const toastText =
          outcome === "visited"
            ? "Marcado como visitado."
            : outcome === "saved"
              ? "Agregado a Por visitar."
              : "Estado actualizado.";
        toast.show(toastText, { type: "success", replaceVisible: true });
      }
    },
    [
      toast,
      openAuthModal,
      updateSpotPinState,
      pinFilter,
      mapInstance,
      flyToUnlessActMode,
      updatePendingFilterBadges,
      setRecentMutation,
      setSheetState,
    ],
  );

  useFocusEffect(
    useCallback(() => {
      if (!mapInstance) return;
      const id = requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          try {
            mapInstance.resize();
          } catch {
            // ignore
          }
        });
      });
      return () => cancelAnimationFrame(id);
    }, [mapInstance]),
  );

  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  /** Paridad con ExploreWelcomeSheet / sheets inferiores en web (tablet+): ancho máximo centrado. */
  const webConstrainedFlowyaLayout =
    Platform.OS === "web" && webSearchUsesConstrainedPanelWidth(windowWidth);
  const topFiltersAvailableWidth =
    windowWidth - insets.left - insets.right - TOP_OVERLAY_INSET_X * 2;
  const dockBottomOffset = 12;
  const isSpotSheetVisible = selectedSpot != null || poiTapped != null;
  const isCountriesSheetVisible = countriesSheetOpen;
  const showExploreWelcomeSheet =
    !createSpotNameOverlayOpen &&
    !searchV2.isOpen &&
    !countriesSheetOpen &&
    selectedSpot == null &&
    poiTapped == null &&
    pinFilter === "all" &&
    isGlobeEntryMotionSettled;

  useEffect(() => {
    collapseExploreWelcomeOnMapGestureRef.current = () => {
      if (!showExploreWelcomeSheet) return;
      setWelcomeSheetState("peek");
    };
  }, [showExploreWelcomeSheet]);

  useEffect(() => {
    if (showExploreWelcomeSheet) {
      prevWelcomeSheetStateRef.current = welcomeSheetState;
    }
  }, [showExploreWelcomeSheet, welcomeSheetState]);

  useEffect(() => {
    if (showExploreWelcomeSheet && !prevExploreWelcomeVisibleRef.current) {
      setWelcomeSheetState(prevWelcomeSheetStateRef.current);
    }
    prevExploreWelcomeVisibleRef.current = showExploreWelcomeSheet;
  }, [showExploreWelcomeSheet]);

  const isShellBlockedByOverlay = createSpotNameOverlayOpen || searchV2.isOpen;
  const mapControlsHeight = MAP_CONTROLS_FALLBACK_HEIGHT;
  const areMapControlsVisible =
    !isShellBlockedByOverlay &&
    sheetState !== "expanded" &&
    (!isCountriesSheetVisible || countriesSheetState !== "expanded") &&
    (!showExploreWelcomeSheet || welcomeSheetState !== "expanded");
  const isBottomActionRowVisible =
    !isShellBlockedByOverlay &&
    !isSpotSheetVisible &&
    !isCountriesSheetVisible &&
    !showExploreWelcomeSheet;
  const isFlowyaFeedbackVisible =
    !isShellBlockedByOverlay &&
    !isCountriesSheetVisible &&
    (!isSpotSheetVisible || sheetState === "peek") &&
    (!showExploreWelcomeSheet || welcomeSheetState === "peek");
  const logoutPopoverBottomOffset = BOTTOM_ACTION_ROW_CLEARANCE + 4;
  const shouldShowFlowsBadge =
    isFlowyaFeedbackVisible && !toast.hasVisibleMessages && !showLogoutOption;
  const [mapControlsOverlayMounted, setMapControlsOverlayMounted] = useState(false);
  const mapControlsOverlayEntry = useRef(
    new Animated.Value(0),
  ).current;
  const mapControlsOverlayDelayRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const filterDefaultTop = FILTER_OVERLAY_TOP + insets.top;
  const filterEstimatedHeight = 56;
  const filterMinimumTop = insets.top + 4;
  // Canonical parity: la fila inline de filtros conserva este anclaje respecto a SpotSheet.
  // CountriesSheet no modifica este anclaje para evitar divergencias UX.
  const filterAnchorSheetHeight = isSpotSheetVisible
    ? sheetHeight
    : showExploreWelcomeSheet
      ? welcomeSheetHeight
      : 0;
  const filterAnchorSheetTop = windowHeight - filterAnchorSheetHeight;
  const filterTop = filterAnchorSheetHeight > 0
    ? Math.min(filterDefaultTop, filterAnchorSheetTop - filterEstimatedHeight - 8)
    : filterDefaultTop;
  const sloganTop = Math.max(
    insets.top + TOP_OVERLAY_INSET_Y + 40,
    Math.max(filterMinimumTop, filterTop) + FILTER_TRIGGER_ESTIMATED_HEIGHT + 48,
  );
  const shouldShowInlineTopFilters =
    !isShellBlockedByOverlay &&
    isGlobeEntryMotionSettled &&
    !isFilterWaitingForCamera &&
    filterTop >= filterMinimumTop;
  const bottomActionRowBottomOffset = BOTTOM_ACTION_ROW_BOTTOM_GUTTER + insets.bottom;
  const flowyaBottomOffset = isSpotSheetVisible
    ? sheetHeight + FLOWYA_ABOVE_PEEK_SHEET_GAP
    : showExploreWelcomeSheet
      ? welcomeSheetHeight + FLOWYA_ABOVE_PEEK_SHEET_GAP
      : bottomActionRowBottomOffset + BOTTOM_ACTION_ROW_CLEARANCE + FLOWYA_ABOVE_ROW_GAP;
  const filterOverlayAnimatedStyle = useMemo(
    () => ({
      opacity: filterOverlayEntry,
      transform: [
        {
          translateY: filterOverlayEntry.interpolate({
            inputRange: [0, 1],
            outputRange: [-8, 0],
          }),
        },
      ],
    }),
    [filterOverlayEntry],
  );
  const mapControlsOverlayAnimatedStyle = useMemo(
    () => ({
      opacity: mapControlsOverlayEntry.interpolate({
        inputRange: [0, 1, 2],
        outputRange: [0, 1, 0],
      }),
      transform: [
        {
          translateX: mapControlsOverlayEntry.interpolate({
            inputRange: [0, 1, 2],
            outputRange: [8, 0, -8],
          }),
        },
      ],
    }),
    [mapControlsOverlayEntry],
  );
  const controlsBottomOffsetBase =
    isSpotSheetVisible
      ? CONTROLS_OVERLAY_BOTTOM + sheetHeight
      : isCountriesSheetVisible
        ? CONTROLS_OVERLAY_BOTTOM + countriesSheetHeight
        : showExploreWelcomeSheet
          ? CONTROLS_OVERLAY_BOTTOM + welcomeSheetHeight
          : dockBottomOffset + insets.bottom;
  /** En peek, subir la columna de controles para que no se superponga a la pastilla países|flows. */
  const mapControlsLiftAboveFlowyaStatusRow =
    isFlowyaFeedbackVisible &&
    ((isSpotSheetVisible && sheetState === "peek") ||
      (showExploreWelcomeSheet && welcomeSheetState === "peek"))
      ? FLOWYA_ABOVE_PEEK_SHEET_GAP +
        FLOWYA_STATUS_ROW_HEIGHT_ESTIMATE +
        MAP_CONTROLS_CLEARANCE_ABOVE_FLOWYA_ROW -
        CONTROLS_OVERLAY_BOTTOM
      : 0;
  const controlsBottomOffset = controlsBottomOffsetBase + mapControlsLiftAboveFlowyaStatusRow;
  const shouldUseCenteredOverlayColumn =
    !isSpotSheetVisible && !isCountriesSheetVisible && !showExploreWelcomeSheet;
  const shouldCenterCountriesAndControls = shouldUseCenteredOverlayColumn;
  const shouldCenterCountriesWithPeekSheet =
    !isCountriesSheetVisible &&
    ((isSpotSheetVisible && sheetState === "peek") ||
      (showExploreWelcomeSheet && welcomeSheetState === "peek"));
  const centeredGroupHeight =
    COUNTRIES_COUNTER_SIZE + COUNTRIES_AND_CONTROLS_GAP + mapControlsHeight;
  const centeredGroupTop = Math.max(
    insets.top + TOP_OVERLAY_INSET_Y,
    Math.round(windowHeight * 0.5 - centeredGroupHeight * 0.5 + THUMB_FRIENDLY_CENTER_BIAS),
  );
  const controlsTopOffset = centeredGroupTop + COUNTRIES_SLOT_RESERVED;
  const controlsCenteredBottom = Math.max(
    dockBottomOffset + insets.bottom,
    windowHeight - controlsTopOffset - mapControlsHeight,
  );
  const controlsResolvedBottom = shouldUseCenteredOverlayColumn
    ? controlsCenteredBottom
    : controlsBottomOffset;
  const countriesBottomOffset =
    controlsBottomOffset + mapControlsHeight + COUNTRIES_AND_CONTROLS_GAP;
  const countriesCenterTopByAnchorMode =
    countriesOverlayAnchorMode === "center-group"
      ? centeredGroupTop
      : Math.max(
          insets.top + TOP_OVERLAY_INSET_Y,
          Math.round(windowHeight * 0.5 - COUNTRIES_COUNTER_SIZE * 0.5 + THUMB_FRIENDLY_CENTER_BIAS),
        );
  const countriesCenteredBottom = Math.max(
    dockBottomOffset + insets.bottom,
    windowHeight - countriesCenterTopByAnchorMode - COUNTRIES_COUNTER_SIZE,
  );
  const countriesResolvedBottom =
    countriesOverlayAnchorMode === "bottom" ? countriesBottomOffset : countriesCenteredBottom;
  useEffect(() => {
    if (!showCountriesCounterBubble) return;
    const nextMode: "center-group" | "center-mid" | "bottom" = shouldCenterCountriesAndControls
      ? "center-group"
      : shouldCenterCountriesWithPeekSheet
        ? "center-mid"
        : "bottom";
    setCountriesOverlayAnchorMode((current) => (current === nextMode ? current : nextMode));
  }, [
    showCountriesCounterBubble,
    shouldCenterCountriesAndControls,
    shouldCenterCountriesWithPeekSheet,
  ]);

  const handleLocateWithFilterDelay = useCallback(async () => {
    deactivateSearchColdStartBootstrap();
    suspendFilterUntilCameraSettles();
    const result = await handleLocate();
    if (result.status === "moved") return;
    if (result.status === "denied") {
      toast.show(
        "Activa ubicación para este sitio en tu navegador y vuelve a intentar.",
        { type: "default" },
      );
      return;
    }
    if (result.status === "timeout" || result.status === "unavailable") {
      toast.show("No pudimos obtener tu ubicación. Intenta de nuevo.", { type: "error" });
    }
  }, [deactivateSearchColdStartBootstrap, handleLocate, suspendFilterUntilCameraSettles, toast]);

  const handleViewWorldWithFilterDelay = useCallback(() => {
    deactivateSearchColdStartBootstrap();
    suspendFilterUntilCameraSettles();
    handleViewWorld();
  }, [deactivateSearchColdStartBootstrap, handleViewWorld, suspendFilterUntilCameraSettles]);

  useEffect(() => {
    if (!shouldShowInlineTopFilters) {
      filterOverlayEntry.stopAnimation();
      filterOverlayEntry.setValue(0);
      return;
    }
    filterOverlayEntry.stopAnimation();
    filterOverlayEntry.setValue(0);
    const delay = filterOverlayHasAnimatedInRef.current ? 0 : FILTER_OVERLAY_ENTRY_DELAY_MS;
    Animated.timing(filterOverlayEntry, {
      toValue: 1,
      duration: FILTER_OVERLAY_ENTRY_DURATION_MS,
      delay,
      easing: Easing.out(Easing.bezier(0.22, 1, 0.36, 1)),
      useNativeDriver: Platform.OS !== "web",
    }).start(({ finished }) => {
      if (!finished) return;
      filterOverlayHasAnimatedInRef.current = true;
    });
  }, [shouldShowInlineTopFilters, filterOverlayEntry]);

  useEffect(() => {
    if (isBottomActionRowVisible && isAuthUser) return;
    setShowLogoutOption(false);
  }, [isBottomActionRowVisible, isAuthUser]);

  useEffect(() => {
    let isCancelled = false;
    const clearDelay = () => {
      if (mapControlsOverlayDelayRef.current) {
        clearTimeout(mapControlsOverlayDelayRef.current);
        mapControlsOverlayDelayRef.current = null;
      }
    };
    const animateIn = () => {
      clearDelay();
      mapControlsOverlayDelayRef.current = setTimeout(() => {
        if (isCancelled) return;
        mapControlsOverlayEntry.setValue(0);
        Animated.timing(mapControlsOverlayEntry, {
          toValue: 1,
          duration: 220,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: Platform.OS !== "web",
        }).start();
      }, MAP_CONTROLS_OVERLAY_ENTRY_DELAY_MS);
    };
    const animateOut = (onEnd?: () => void) => {
      clearDelay();
      Animated.timing(mapControlsOverlayEntry, {
        toValue: 2,
        duration: 160,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: Platform.OS !== "web",
      }).start(({ finished }) => {
        if (!finished || isCancelled) return;
        onEnd?.();
      });
    };

    mapControlsOverlayEntry.stopAnimation();

    if (!areMapControlsVisible) {
      if (!mapControlsOverlayMounted) return () => {
        isCancelled = true;
        clearDelay();
      };
      animateOut(() => {
        if (isCancelled) return;
        setMapControlsOverlayMounted(false);
        mapControlsOverlayEntry.setValue(0);
      });
      return () => {
        isCancelled = true;
        clearDelay();
      };
    }

    if (!mapControlsOverlayMounted) {
      setMapControlsOverlayMounted(true);
      animateIn();
      return () => {
        isCancelled = true;
        clearDelay();
      };
    }

    animateIn();
    return () => {
      isCancelled = true;
      clearDelay();
    };
  }, [
    areMapControlsVisible,
    mapControlsOverlayMounted,
    mapControlsOverlayEntry,
  ]);

  useEffect(() => {
    const isSpotSheetVisible = selectedSpot != null || poiTapped != null;
    const isCountriesSheetVisible = countriesSheetOpen;
    const areMapControlsVisible =
      !isShellBlockedByOverlay &&
      sheetState !== "expanded" &&
      (!isCountriesSheetVisible || countriesSheetState !== "expanded") &&
      (!showExploreWelcomeSheet || welcomeSheetState !== "expanded");
    /** Con buscador abierto el sheet sigue en estado pero no es visible: no sumar su alto al toast. */
    const bottom =
      searchV2.isOpen
        ? dockBottomOffset + insets.bottom
        : isSpotSheetVisible
          ? CONTROLS_OVERLAY_BOTTOM + sheetHeight + STATUS_OVER_SHEET_CLEARANCE
          : isCountriesSheetVisible
            ? CONTROLS_OVERLAY_BOTTOM + countriesSheetHeight + STATUS_OVER_SHEET_CLEARANCE
            : bottomActionRowBottomOffset +
              (isBottomActionRowVisible && isFlowyaFeedbackVisible
                ? BOTTOM_ACTION_ROW_CLEARANCE + FLOWYA_ABOVE_ROW_GAP
                : isBottomActionRowVisible
                  ? BOTTOM_ACTION_ROW_CLEARANCE
                  : isFlowyaFeedbackVisible
                    ? FLOWYA_STACK_CLEARANCE
                    : 0);
    toast.setAnchor({
      placement: "bottom-left",
      left: TOP_OVERLAY_INSET_X + insets.left,
      bottom,
      right: areMapControlsVisible
        ? CONTROLS_OVERLAY_RIGHT + insets.right + STATUS_AVOID_CONTROLS_RIGHT
        : insets.right,
    });
    return () => {
      toast.resetAnchor();
    };
  }, [
    toast,
    selectedSpot,
    poiTapped,
    sheetHeight,
    countriesSheetHeight,
    countriesSheetOpen,
    insets.left,
    insets.right,
    insets.bottom,
    dockBottomOffset,
    bottomActionRowBottomOffset,
    createSpotNameOverlayOpen,
    searchV2.isOpen,
    isShellBlockedByOverlay,
    isBottomActionRowVisible,
    isFlowyaFeedbackVisible,
    sheetState,
    countriesSheetState,
    showExploreWelcomeSheet,
    welcomeSheetState,
  ]);

  if (!MAPBOX_TOKEN) {
    return (
      <View style={[styles.mapScreenRoot, styles.placeholder]}>
        <Text style={styles.placeholderText}>
          Set EXPO_PUBLIC_MAPBOX_TOKEN for the map.
        </Text>
      </View>
    );
  }

  const mapStyle =
    colorScheme === "dark" ? FLOWYA_MAP_STYLE_DARK : FLOWYA_MAP_STYLE_LIGHT;

  const hasDeepLinkBootIntent = Boolean(params.spotId || params.created);
  const initialCameraZoom = hasDeepLinkBootIntent
    ? FALLBACK_VIEW.zoom
    : GLOBE_ZOOM_INITIAL;
  const initialViewState = is3DEnabled
    ? {
        ...FALLBACK_VIEW,
        zoom: initialCameraZoom,
        pitch: INITIAL_PITCH,
        bearing: INITIAL_BEARING,
      }
    : { ...FALLBACK_VIEW, zoom: initialCameraZoom };

  const selectedSpotOverlayState: "default" | "to_visit" | "visited" =
    resolveEffectivePinStatus(selectedSpot?.pinStatus) === "visited"
      ? "visited"
      : resolveEffectivePinStatus(selectedSpot?.pinStatus) === "to_visit"
        ? "to_visit"
        : "default";

  return (
    <View
      ref={mapRootRef as React.RefObject<View>}
      style={styles.mapScreenRoot}
      {...(Platform.OS === "web" && { className: "map-screen-root-dvh" })}
    >
      <MapCoreView
        mapboxAccessToken={MAPBOX_TOKEN}
        mapStyle={mapStyle}
        mapLanguage={getCurrentLanguage() === "es" ? "es" : "en"}
        initialViewState={initialViewState}
        onLoad={handleMapLoadWithFilterDelay}
        onPointerDown={handleMapPointerDown}
        onPointerMove={handleMapPointerMove}
        onPointerUp={handleMapPointerUp}
        spots={displayedSpots}
        selectedSpotId={selectedSpot?.id ?? null}
        userCoords={userCoords}
        zoom={zoom}
        onPinClick={(spotForLayer) => {
          const s = displayedSpots.find((x) => x.id === spotForLayer.id);
          if (s) handlePinClick(s);
        }}
        styleMap={styles.map}
        onClick={handleMapClick}
        previewPinCoords={
          selectedSpot?.id.startsWith("draft_")
            ? { lat: selectedSpot.latitude, lng: selectedSpot.longitude }
            : createSpotNameOverlayOpen && createSpotPendingCoords
              ? createSpotPendingCoords
              : isSelectedSpotHiddenOnMap && selectedSpot != null
                ? { lat: selectedSpot.latitude, lng: selectedSpot.longitude }
                : poiTapped != null && selectedSpot == null
                  ? { lat: poiTapped.lat, lng: poiTapped.lng }
                : null
        }
        previewPinState={
          isSelectedSpotHiddenOnMap && selectedSpot != null
            ? selectedSpotOverlayState
            : poiTapped != null && selectedSpot == null
              ? poiTapped.visualState
              : "default"
        }
        previewPinLabel={
          selectedSpot?.id.startsWith("draft_")
            ? selectedSpot.title ?? null
            : createSpotNameOverlayOpen
              ? createSpotNameValue
              : isSelectedSpotHiddenOnMap && selectedSpot != null
                ? null
                : poiTapped != null && selectedSpot == null
                  ? null
                  : null
        }
      />
      {selectedSpot && selectedPinScreenPos ? (
        <Pressable
          style={[
            styles.selectedPinHitArea,
            {
              left:
                Math.round(selectedPinScreenPos.x) - SELECTED_PIN_HIT_RADIUS,
              top: Math.round(selectedPinScreenPos.y) - SELECTED_PIN_HIT_RADIUS,
            },
          ]}
          onPress={handleSelectedPinTap}
          accessibilityLabel={`Expandir ficha de ${selectedSpot.title}`}
          accessibilityRole="button"
        />
      ) : null}
      {shouldShowInlineTopFilters ? (
        <Animated.View
          style={[
            styles.filterOverlay,
            { top: Math.max(filterMinimumTop, filterTop), pointerEvents: 'box-none' },
            filterOverlayAnimatedStyle,
          ]}
        >
          <View style={[styles.filterRowWrap, { pointerEvents: 'box-none' }]}>
            <MapPinFilterInline
              value={pinFilter}
              onChange={(next) => handlePinFilterChange(next, { reframe: true })}
              counts={pinCounts}
              layout="auto"
              availableWidth={topFiltersAvailableWidth}
            />
          </View>
        </Animated.View>
      ) : null}
      {showEntrySlogan &&
      !createSpotNameOverlayOpen &&
      !entrySloganOccludedByOverlay &&
      !(showExploreWelcomeSheet && welcomeSheetState !== "peek") ? (
        <Animated.View
          style={[
            styles.sloganOverlay,
            { top: sloganTop, pointerEvents: 'none' },
            { opacity: sloganEntryOpacity },
            { transform: [{ translateY: sloganEntryTranslateY }] },
          ]}
        >
          <Text style={[TypographyStyles.heading2, styles.sloganText]}>
            <Text style={styles.sloganLineLight}>
              {"SIGUE LO QUE\n"}
            </Text>
            <Text style={styles.sloganLineStrong}>TE MUEVE</Text>
          </Text>
        </Animated.View>
      ) : null}
      {isBottomActionRowVisible ? (
        <View
          style={[
            styles.bottomActionRowOverlay,
            {
              left: TOP_OVERLAY_INSET_X + insets.left,
              right: TOP_OVERLAY_INSET_X + insets.right,
              bottom: bottomActionRowBottomOffset,
              pointerEvents: "box-none",
            },
          ]}
        >
          <ExploreSearchActionRow
            onSearchPress={openSearchPreservingCountriesSheet}
            onProfilePress={handleProfilePress}
            onLogoutPress={handleLogoutPress}
            showLogoutAction={showLogoutOption && isAuthUser}
            logoutPopoverBottomOffset={logoutPopoverBottomOffset}
            isAuthUser={isAuthUser}
            searchPlaceholder="Busca países o lugares"
            accessibilityLabel="Buscar países o lugares"
            profileAccessibilityLabel="Cuenta"
          />
        </View>
      ) : null}
      {showExploreWelcomeSheet ? (
        <ExploreWelcomeSheet
          visible
          state={welcomeSheetState}
          onStateChange={setWelcomeSheetState}
          onSheetHeightChange={setWelcomeSheetHeight}
          onSearchPress={openSearchPreservingCountriesSheet}
          onProfilePress={handleProfilePress}
          onLogoutPress={handleLogoutPress}
          showLogoutAction={showLogoutOption && isAuthUser}
          isAuthUser={isAuthUser}
          logoutPopoverBottomOffset={logoutPopoverBottomOffset}
          browseSectionTitle={welcomeSheetBrowseSectionTitle}
          browseItems={welcomeExploreListItems}
          onBrowseItemPress={handleWelcomeBrowseItemPress}
          userCoords={userCoords}
          bottomOffset={dockBottomOffset + insets.bottom}
          forceColorScheme={countriesOverlayScheme}
        />
      ) : null}
      <CountriesSheet
        visible={countriesSheetOpen}
        title={countriesOverlayFilter === "saved" ? "Países por visitar" : "Países visitados"}
        filterMode={countriesOverlayFilter}
        state={countriesSheetState}
        forceColorScheme={countriesOverlayScheme}
        items={countriesBucketsForOverlay}
        worldPercentage={countriesWorldPercentageForOverlay}
        summaryCountriesCount={countriesCountForOverlay}
        summaryPlacesCount={countriesPlacesCountForOverlay}
        onCountriesKpiPress={handleCountriesKpiPress}
        onSpotsKpiPress={handleCountriesSpotsKpiPress}
        onStateChange={setCountriesSheetState}
        onClose={handleCountriesSheetClose}
        onShare={handleCountriesSheetShare}
        shareDisabled={isCountriesShareInFlight || !countriesMapSnapshot}
        onItemPress={handleCountryBucketPress}
        onSheetHeightChange={setCountriesSheetHeight}
        onMapSnapshotChange={setCountriesMapSnapshot}
        onMapCountryPress={handleCountriesMapCountryPress}
        countryDetail={countriesSheetListView}
        onCountryDetailBack={handleCountryDetailBack}
        countryDetailSpots={countriesSheetDetailSpots}
        renderCountryDetailItem={renderCountryDetailItem}
        countryDetailTagFilterOptions={
          isAuthUser ? countriesSheetDetailTagFilterOptions : undefined
        }
        selectedCountryDetailTagFilterId={
          isAuthUser && countriesSheetListView != null ? selectedTagFilterId : null
        }
        onCountryDetailTagFilterChange={
          isAuthUser && countriesSheetListView != null ? setSelectedTagFilterId : undefined
        }
        onPlacesListScopeChange={setCountriesSheetListView}
      />
      {countriesOverlayMounted ? (
        <Animated.View
          style={[
            styles.countriesOverlay,
            { right: CONTROLS_OVERLAY_RIGHT + insets.right },
            { bottom: countriesResolvedBottom },
            {
              opacity: countriesOverlayEntry.interpolate({
                inputRange: [0, 1, 2],
                outputRange: [0, 1, 0],
              }),
              transform: [
                {
                  translateX: countriesOverlayEntry.interpolate({
                    inputRange: [0, 1, 2],
                    outputRange: [8, 0, -8],
                  }),
                },
              ],
            },
            { pointerEvents: 'box-none' as const },
          ]}
        >
          <View style={styles.countriesOverlayStack}>
            <Pressable
              onPress={handleCountriesCounterPress}
              style={({ pressed }) => [
                styles.countriesCircle,
                {
                  backgroundColor: countriesCounterBackgroundColor,
                  borderColor: countriesCounterBorderColor,
                },
                pressed && styles.countriesCirclePressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel={
                countriesOverlayFilter === "saved"
                  ? "Abrir sheet de países por visitar"
                  : "Abrir sheet de países visitados"
              }
            >
              <Text
                style={[
                  styles.countriesValue,
                  {
                    color:
                      countriesOverlayFilter === "saved"
                        ? countriesOverlayColors.stateToVisit
                        : countriesOverlayColors.stateSuccess,
                  },
                ]}
              >
                {countriesCountForOverlay == null ? "—" : String(countriesCountForOverlay)}
              </Text>
              <Text style={[styles.countriesLabel, { color: countriesOverlayColors.textSecondary }]}>
                Países
              </Text>
            </Pressable>
            <Pressable
              onPress={handleCountriesSpotsKpiPress}
              style={({ pressed }) => [
                styles.countriesCircle,
                styles.countriesSpotsCircle,
                {
                  backgroundColor: countriesCounterBackgroundColor,
                  borderColor: countriesCounterBorderColor,
                  opacity: pressed ? 0.88 : 1,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Ver todos los lugares del filtro en el sheet"
            >
              <Text
                style={[
                  styles.countriesValue,
                  {
                    color:
                      countriesOverlayFilter === "saved"
                        ? countriesOverlayColors.stateToVisit
                        : countriesOverlayColors.stateSuccess,
                  },
                ]}
              >
                {String(countriesPlacesCountForOverlay)}
              </Text>
              <Text style={[styles.countriesLabel, { color: countriesOverlayColors.textSecondary }]}>
                lugares
              </Text>
            </Pressable>
          </View>
        </Animated.View>
      ) : null}
      {mapControlsOverlayMounted ? (
        <Animated.View
          style={[
            styles.controlsOverlay,
            {
              right:
                CONTROLS_OVERLAY_RIGHT + insets.right + COUNTRIES_CENTER_ALIGNMENT_OFFSET,
              bottom: controlsResolvedBottom,
              flexDirection: "column",
              gap: Spacing.sm,
              pointerEvents: areMapControlsVisible ? 'box-none' : 'none',
            },
            mapControlsOverlayAnimatedStyle,
          ]}
        >
          <MapControls
            map={mapInstance}
            onLocate={handleLocateWithFilterDelay}
            selectedSpot={contextualSelection}
            onReframeSpot={handleReframeContextual}
            onViewWorld={handleViewWorldWithFilterDelay}
            activeMapControl={activeMapControl}
          />
        </Animated.View>
      ) : null}
      {isFlowyaFeedbackVisible ? (
        <View
          style={[
            styles.flowyaStatusRow,
            webConstrainedFlowyaLayout && styles.flowyaStatusRowWebHost,
            {
              bottom: flowyaBottomOffset,
              pointerEvents: "box-none",
              ...(webConstrainedFlowyaLayout
                ? { left: 0, right: 0 }
                : {
                    left: TOP_OVERLAY_INSET_X + insets.left,
                    right: TOP_OVERLAY_INSET_X + insets.right,
                  }),
            },
          ]}
        >
          <View
            style={
              webConstrainedFlowyaLayout
                ? styles.flowyaStatusRowWebInner
                : styles.flowyaStatusRowInnerStretch
            }
          >
            <ExploreMapStatusRow
              onFlowyaPress={() => setShowBetaModal(true)}
              flowsBadge={
                shouldShowFlowsBadge
                  ? {
                      countriesCount: countriesBucketsByFilter.visited.length,
                      flowsPoints: travelerPoints,
                      onPress: handleVisitedCountriesPress,
                      accessibilityLabel: "Abrir países visitados",
                    }
                  : null
              }
            />
          </View>
        </View>
      ) : null}
      <FlowyaBetaModal
        visible={showBetaModal}
        onClose={() => setShowBetaModal(false)}
      />
      {showLogoutOption && isAuthUser && selectedSpot == null ? (
        <Pressable
          style={[StyleSheet.absoluteFill, { zIndex: 11 }]}
          onPress={() => setShowLogoutOption(false)}
          accessibilityLabel="Cerrar"
          accessibilityRole="button"
        />
      ) : null}
      <CreateSpotNameOverlay
        visible={createSpotNameOverlayOpen}
        initialName={createSpotInitialName}
        onConfirm={onConfirmCreateSpotName}
        onDismiss={handleCloseCreateSpotNameOverlay}
        onValueChange={setCreateSpotNameValue}
      />
      {/* CONTRATO: Search Fullscreen Overlay — overlay cubre todo; zIndex alto; al cerrar llama controller.setOpen(false) */}
      <SearchFloating<Spot | PlaceResult>
        controller={searchV2 as UseSearchControllerV2Return<Spot | PlaceResult>}
        defaultItems={defaultItemsForEmptyTagged}
        defaultItemSections={defaultSectionsForEmptyTagged}
        recentQueries={searchHistory.recentQueries}
        recentViewedItems={recentViewedSpots}
        insets={{ top: insets.top, bottom: insets.bottom }}
        pinFilter={pinFilter}
        pinCounts={pinCounts}
        onPinFilterChange={(next) => handlePinFilterChange(next, { reframe: false })}
        tagFilterOptions={
          isAuthUser && (pinFilter === "saved" || pinFilter === "visited")
            ? spotTagFilterOptions
            : undefined
        }
        selectedTagFilterId={
          isAuthUser && (pinFilter === "saved" || pinFilter === "visited")
            ? selectedTagFilterId
            : undefined
        }
        onTagFilterChange={
          isAuthUser && (pinFilter === "saved" || pinFilter === "visited")
            ? setSelectedTagFilterId
            : undefined
        }
        tagFilterEditMode={
          isAuthUser && (pinFilter === "saved" || pinFilter === "visited") ? tagFilterEditMode : false
        }
        onTagFilterEnterEditMode={
          isAuthUser && (pinFilter === "saved" || pinFilter === "visited")
            ? () => setTagFilterEditMode(true)
            : undefined
        }
        onTagFilterExitEditMode={
          isAuthUser && (pinFilter === "saved" || pinFilter === "visited")
            ? () => setTagFilterEditMode(false)
            : undefined
        }
        onRequestDeleteUserTag={
          isAuthUser && (pinFilter === "saved" || pinFilter === "visited")
            ? handleRequestDeleteUserTag
            : undefined
        }
        resultsOverride={kpiSpotsSearchResults}
        resultSections={searchResultSections}
        resultsSummaryLabel={
          searchV2.query.trim().length >= 3 && kpiSpotsSearchResults.length > 0
            ? `${kpiSpotsSearchResults.length} resultados de «${searchV2.query.trim()}»`
            : undefined
        }
        showResultsOnEmpty={showFilteredResultsOnEmpty}
        placeSuggestions={
          pinFilter === "all" || pinFilter === "saved" || pinFilter === "visited" ? [] : placeSuggestions
        }
        onCreateFromPlace={handleCreateFromPlace}
        renderItem={(item: Spot | PlaceResult) => {
          const distanceText: string | null =
            userCoords != null
              ? (() => {
                  if ("title" in item && "latitude" in item) {
                    const spot = item as Spot;
                    const km = distanceKm(userCoords.latitude, userCoords.longitude, spot.latitude, spot.longitude);
                    return formatDistanceKm(km);
                  }
                  const place = item as PlaceResult;
                  const km = distanceKm(userCoords.latitude, userCoords.longitude, place.lat, place.lng);
                  return formatDistanceKm(km);
                })()
              : null;
          if ("title" in item && "latitude" in item) {
            const spot = item as Spot;
            const isVisitedFilter = pinFilter === "visited";
            const descriptionShort = spot.description_short?.trim() ?? "";
            const hasDescriptionShort = descriptionShort.length > 0;
            const hasCoverImage = Boolean(spot.cover_image_url && spot.cover_image_url.trim().length > 0);
            const tagIds = spot.tagIds ?? pinTagIndex[spot.id] ?? [];
            const tagChips = tagIds.map((id) => ({
              id,
              label: tagLabelById.get(id) ?? id,
            }));
            const quickActions = [
              ...(isAuthUser
                ? [
                    {
                      id: `add-tag-${spot.id}`,
                      label: "Etiquetar",
                      kind: "add_tag" as const,
                      onPress: () => {
                        setTagAssignSpot(spot);
                        setTagAssignInput("");
                      },
                      accessibilityLabel: `Etiquetar ${spot.title}`,
                    },
                  ]
                : []),
              ...(isVisitedFilter
                ? [
                    ...(!hasCoverImage
                      ? [
                          {
                            id: `add-image-${spot.id}`,
                            label: "Agregar imagen",
                            kind: "add_image" as const,
                            onPress: () => handleQuickAddImageFromSearch(spot),
                            accessibilityLabel: `Agregar imagen a ${spot.title}`,
                          },
                        ]
                      : []),
                    ...(!hasDescriptionShort
                      ? [
                          {
                            id: `edit-desc-${spot.id}`,
                            label: "Escribir nota breve",
                            kind: "edit_description" as const,
                            onPress: () => handleQuickEditDescriptionOpen(spot),
                            accessibilityLabel: `Escribir una nota breve sobre ${spot.title}`,
                          },
                        ]
                      : []),
                  ]
                : []),
            ];
            return (
              <SearchResultCard
                spot={item}
                onPress={() => searchV2.onSelect(item)}
                distanceText={distanceText}
                subtitleOverride={
                  isVisitedFilter ? (hasDescriptionShort ? descriptionShort : null) : undefined
                }
                quickActions={quickActions}
                tagChips={isAuthUser && tagChips.length > 0 ? tagChips : undefined}
              />
            );
          }
          const place = item as PlaceResult;
          const isLandmark = isPlaceLandmark(place);
          return (
            <SearchListCard
              title={place.name}
              subtitle={place.fullName}
              distanceText={distanceText}
              isLandmark={isLandmark}
              maki={place.maki ?? undefined}
              onPress={() => handleCreateFromPlace(place)}
              accessibilityLabel={`Ver: ${place.name}`}
            />
          );
        }}
        stageLabel={stageLabel}
        scope="explorar"
        getItemKey={(item) => {
          if ("id" in item && typeof (item as Spot).id === "string") return (item as Spot).id;
          const p = item as PlaceResult;
          return p.id ?? `place-${p.lat}-${p.lng}`;
        }}
      />
      {tagAssignSpot ? (
        <Modal
          visible
          transparent
          animationType="fade"
          onRequestClose={handleCloseTagAssignModal}
        >
          <View
            style={[
              styles.tagAssignModalRoot,
              { paddingTop: Math.max(insets.top, 16) + 12 },
            ]}
          >
            <Pressable style={styles.tagAssignModalBackdrop} onPress={handleCloseTagAssignModal} />
            <View
                style={[
                  styles.tagAssignModalCard,
                  {
                    backgroundColor: Colors[colorScheme ?? "light"].backgroundElevated,
                    borderColor: Colors[colorScheme ?? "light"].borderSubtle,
                  },
                ]}
              >
              <View style={styles.tagAssignModalHeaderRow}>
                <View style={styles.tagAssignModalHeaderTitles}>
                  <Text
                    style={[styles.tagAssignModalEyebrow, { color: Colors[colorScheme ?? "light"].textSecondary }]}
                  >
                    Etiquetar
                  </Text>
                  <Text
                    style={[styles.tagAssignModalSpotTitle, { color: Colors[colorScheme ?? "light"].text }]}
                    numberOfLines={3}
                  >
                    {tagAssignSpot.title}
                  </Text>
                </View>
                <IconButton
                  variant="default"
                  selected
                  onPress={handleCloseTagAssignModal}
                  accessibilityLabel="Cerrar"
                >
                  <X size={24} color={Colors[colorScheme ?? "light"].text} strokeWidth={2} />
                </IconButton>
              </View>
              <ScrollView
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
                showsVerticalScrollIndicator
                style={styles.tagAssignModalScroll}
                contentContainerStyle={[
                  styles.tagAssignModalScrollContent,
                  { paddingBottom: Math.max(insets.bottom, 12) + 16 },
                ]}
              >
                {(pinTagIndex[tagAssignSpot.id] ?? []).length > 0 ? (
                  <View style={styles.tagAssignModalChipsWrap}>
                    {(pinTagIndex[tagAssignSpot.id] ?? []).map((tid) => (
                      <TagChip
                        key={tid}
                        label={tagLabelById.get(tid) ?? tid}
                        showHash
                        disabled={tagAssignSaving}
                        onRemove={() => void handleDetachTagFromAssignSpot(tid)}
                      />
                    ))}
                  </View>
                ) : null}
                <View style={styles.tagAssignModalInlineRow}>
                  <View style={styles.tagAssignModalInputWrap}>
                    <TextInput
                      value={tagAssignInput}
                      onChangeText={setTagAssignInput}
                      placeholder="Nueva etiqueta"
                      placeholderTextColor={
                        colorScheme === "dark" ? "rgba(235,235,245,0.58)" : "rgba(60,60,67,0.72)"
                      }
                      style={[
                        styles.tagAssignModalInputInline,
                        {
                          color: Colors[colorScheme ?? "light"].text,
                          borderColor: Colors[colorScheme ?? "light"].border,
                          backgroundColor: Colors[colorScheme ?? "light"].background,
                          paddingRight: tagAssignInput.length > 0 ? 40 : 12,
                        },
                      ]}
                      editable={!tagAssignSaving}
                      autoCorrect={false}
                      autoCapitalize="sentences"
                    />
                    {tagAssignInput.length > 0 ? (
                      <View style={styles.tagAssignModalInputClearWrap} pointerEvents="box-none">
                        <ClearIconCircle
                          onPress={() => setTagAssignInput("")}
                          accessibilityLabel="Limpiar campo"
                          iconColor={Colors[colorScheme ?? "light"].textSecondary}
                          backgroundColor={Colors[colorScheme ?? "light"].text}
                        />
                      </View>
                    ) : null}
                  </View>
                  <Pressable
                    onPress={() => void handleCreateAndAttachTag()}
                    disabled={tagAssignSaving || tagAssignInput.trim().length === 0}
                    style={[
                      styles.tagAssignModalCrearBtn,
                      {
                        backgroundColor:
                          tagAssignSaving || tagAssignInput.trim().length === 0
                            ? Colors[colorScheme ?? "light"].borderSubtle
                            : Colors[colorScheme ?? "light"].primary,
                      },
                    ]}
                  >
                    <Text style={styles.tagAssignModalCrearBtnText}>{tagModalAddButtonLabel}</Text>
                  </Pressable>
                </View>
                {tagModalAvailableToAdd.length > 0 ? (
                  <View style={styles.tagAssignModalChipsWrap}>
                    {tagModalAvailableToAdd.map((t) => (
                      <TagChip
                        key={t.id}
                        label={t.name}
                        showHash
                        visualVariant="suggested"
                        disabled={tagAssignSaving}
                        onPress={() => setTagAssignInput(t.name)}
                        accessibilityLabel={`Usar «${t.name}» en el campo; confirma con ${tagModalAddButtonLabel}`}
                      />
                    ))}
                  </View>
                ) : null}
              </ScrollView>
            </View>
          </View>
        </Modal>
      ) : null}
      {quickDescSpot ? (
        <View
          style={[
            styles.quickEditDescOverlay,
            { paddingTop: Math.max(insets.top, 16) + 8, pointerEvents: 'box-none' },
          ]}
        >
          <Pressable
            style={styles.quickEditDescBackdrop}
            onPress={handleQuickEditDescriptionBackdropPress}
            accessibilityLabel="Cerrar editor de descripción"
          />
          <View
            style={[
              styles.quickEditDescCard,
              {
                backgroundColor: Colors[colorScheme ?? "light"].backgroundElevated,
                borderColor: Colors[colorScheme ?? "light"].borderSubtle,
              },
            ]}
          >
            <Text style={[styles.quickEditDescTitle, { color: Colors[colorScheme ?? "light"].text }]}>
              Descripción corta
            </Text>
            <TextInput
              value={quickDescValue}
              onChangeText={setQuickDescValue}
              placeholder={`Escribe una nota personal breve sobre ${quickDescSpot.title}.`}
              placeholderTextColor={Colors[colorScheme ?? "light"].textSecondary}
              style={[
                styles.quickEditDescInput,
                {
                  color: Colors[colorScheme ?? "light"].text,
                  borderColor: Colors[colorScheme ?? "light"].borderSubtle,
                  backgroundColor: Colors[colorScheme ?? "light"].background,
                },
              ]}
              editable={!quickDescSaving}
              multiline
              maxLength={180}
              autoFocus
            />
            <View style={styles.quickEditDescActions}>
              <Pressable
                style={[
                  styles.quickEditDescButton,
                  { borderColor: Colors[colorScheme ?? "light"].borderSubtle },
                ]}
                onPress={handleQuickEditDescriptionClose}
                disabled={quickDescSaving}
              >
                <Text
                  style={[
                    styles.quickEditDescButtonText,
                    { color: Colors[colorScheme ?? "light"].textSecondary },
                  ]}
                >
                  Cancelar
                </Text>
              </Pressable>
              <Pressable
                style={[
                  styles.quickEditDescButton,
                  styles.quickEditDescButtonPrimary,
                  { backgroundColor: Colors[colorScheme ?? "light"].primary },
                ]}
                onPress={handleQuickEditDescriptionSave}
                disabled={quickDescSaving}
              >
                {quickDescSaving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={[styles.quickEditDescButtonText, { color: "#fff" }]}>Guardar</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      ) : null}
      {/* CONTRATO: Sheet disabled while search open; ocultar cuando flujo de creación (CreateSpotNameOverlay) activo */}
      {(selectedSpot != null || poiTapped != null) &&
      !searchV2.isOpen &&
      !createSpotNameOverlayOpen ? (
        <SpotSheet
          spot={selectedSpot}
          poi={poiTapped}
          displayTitleOverride={null}
          onClose={() => {
            recordExploreDecisionCompleted({
              outcome: "dismissed",
              pinFilter,
            });
            recordExploreSelectionChanged({
              entityType: poiTapped != null && selectedSpot == null ? "poi" : "spot",
              selectionState: "cleared",
              fromFilter: pinFilter,
              toFilter: pinFilter,
            });
            setSelectedSpot(null);
            setPoiTapped(null);
            setSheetState("peek");
            setSheetHeight(SHEET_PEEK_HEIGHT);
            setIsPlacingDraftSpot(false);
            setDraftCoverUri(null);
          }}
          onOpenDetail={handleSheetOpenDetail}
          state={sheetState}
          onSheetHeightChange={setSheetHeight}
          onShare={selectedSpot ? () => handleShare(selectedSpot) : undefined}
          onSavePin={
            selectedSpot
              ? (targetStatus) => handleSavePin(selectedSpot, targetStatus)
              : undefined
          }
          pinFilter={pinFilter}
          userCoords={userCoords ?? undefined}
          isAuthUser={isAuthUser}
          onDirections={
            selectedSpot
              ? (s) => Linking.openURL(getMapsDirectionsUrl(s.latitude, s.longitude))
              : undefined
          }
          onEdit={
            selectedSpot
              ? (spotId) => {
                  blurActiveElement();
                  (router.push as (href: string) => void)(
                    `/spot/edit/${spotId}`,
                  );
                }
              : undefined
          }
          isPlacingDraftSpot={isPlacingDraftSpot}
          onConfirmPlacement={() => setIsPlacingDraftSpot(false)}
          onDraftBackToPlacing={() => setIsPlacingDraftSpot(true)}
          draftCoverUri={draftCoverUri}
          onDraftCoverChange={setDraftCoverUri}
          onCreateSpot={handleCreateSpotFromDraft}
          onPoiPorVisitar={() => handleCreateSpotFromPoi("to_visit")}
          onPoiVisitado={() => handleCreateSpotFromPoi("visited")}
          onPoiShare={handleCreateSpotFromPoiAndShare}
          poiLoading={poiSheetLoading}
          onImagePress={
            selectedSpot?.cover_image_url
              ? (uri) => setFullscreenImageUri(uri)
              : undefined
          }
          sheetTagChips={sheetSpotTagChips}
          onSheetTagChipPress={isAuthUser ? handleSheetTagChipPress : undefined}
          onSheetEtiquetarPress={
            isAuthUser && selectedSpot != null && !selectedSpot.id.startsWith("draft_")
              ? handleSheetEtiquetarFromSheet
              : undefined
          }
          onStateChange={(newState) => {
            if (
              newState === "expanded" &&
              poiTapped != null &&
              selectedSpot == null &&
              !poiSheetLoading
            ) {
              setSheetState("expanded");
              const autoStatusForFilter =
                pinFilter === "saved"
                  ? "to_visit"
                  : pinFilter === "visited"
                    ? "visited"
                    : undefined;
              void handleCreateSpotFromPoi(autoStatusForFilter, "expanded");
            } else {
              setSheetState(newState);
            }
          }}
        />
      ) : null}
      <ImageFullscreenModal
        visible={fullscreenImageUri != null}
        uri={fullscreenImageUri}
        onClose={() => setFullscreenImageUri(null)}
      />
      <ConfirmModal
        visible={showLogoutConfirm}
        title="¿Cerrar sesión?"
        confirmLabel="Cerrar sesión"
        cancelLabel="Cancelar"
        variant="destructive"
        onConfirm={handleLogoutConfirm}
        onCancel={() => {
          setShowLogoutConfirm(false);
          setShowLogoutOption(false);
        }}
      />
      <ConfirmModal
        visible={tagDeleteConfirm != null}
        title="¿Eliminar etiqueta?"
        message={
          tagDeleteConfirm
            ? `Se quitará «#${tagDeleteConfirm.name}» de tu inventario y de todos los spots donde esté asignada.`
            : undefined
        }
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        variant="destructive"
        confirmDisabled={tagDeleteBusy}
        cancelDisabled={tagDeleteBusy}
        onConfirm={() => void handleConfirmDeleteUserTag()}
        onCancel={() => {
          if (!tagDeleteBusy) setTagDeleteConfirm(null);
        }}
      />
      <CreateSpotConfirmModal
        visible={showCreateSpotConfirmModal}
        onConfirm={handleCreateSpotConfirm}
        onCancel={handleCreateSpotConfirmCancel}
      />
      {duplicateModal ? (
        <DuplicateSpotModal
          visible={true}
          existingTitle={duplicateModal.existingTitle}
          existingSpotId={duplicateModal.existingSpotId}
          onViewSpot={() => handleViewExistingSpot(duplicateModal.existingSpotId)}
          onCreateAnyway={duplicateModal.onCreateAnyway}
          onClose={() => setDuplicateModal(null)}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  mapScreenRoot: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    ...Platform.select({
      web: { width: "100%" },
      default: {},
    }),
  },
  map: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  selectedPinHitArea: {
    position: "absolute",
    width: SELECTED_PIN_HIT_RADIUS * 2,
    height: SELECTED_PIN_HIT_RADIUS * 2,
    zIndex: 10,
    backgroundColor: "transparent",
  },
  filterOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    top: FILTER_OVERLAY_TOP,
    alignItems: "center",
    zIndex: EXPLORE_LAYER_Z.FILTER,
  },
  filterRowWrap: {
    position: "relative",
    zIndex: 30,
    ...Platform.select({ android: { elevation: 14 } }),
  },
  bottomActionRowOverlay: {
    position: "absolute",
    zIndex: EXPLORE_LAYER_Z.TOP_ACTIONS,
    alignItems: "center",
  },
  countriesOverlay: {
    position: "absolute",
    zIndex: 8,
  },
  countriesOverlayStack: {
    flexDirection: "column",
    alignItems: "center",
    gap: 8,
  },
  controlsOverlay: {
    position: "absolute",
    right: CONTROLS_OVERLAY_RIGHT,
    zIndex: EXPLORE_LAYER_Z.MAP_CONTROLS,
  },
  flowyaStatusRow: {
    position: "absolute",
    zIndex: EXPLORE_LAYER_Z.FLOWYA_LABEL,
  },
  flowyaStatusRowWebHost: {
    alignItems: "center",
  },
  flowyaStatusRowWebInner: {
    width: "100%",
    maxWidth: WEB_SHEET_MAX_WIDTH,
  },
  flowyaStatusRowInnerStretch: {
    width: "100%",
  },
  sloganOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: EXPLORE_LAYER_Z.TOP_ACTIONS,
    paddingHorizontal: 24,
  },
  sloganText: {
    color: "#FFFFFF",
    fontSize: 32,
    lineHeight: 32,
    letterSpacing: 0.6,
    textAlign: "center",
    textShadow: "0px 1px 6px rgba(0,0,0,0.28)",
  } as TextStyle,
  sloganLineLight: {
    fontWeight: "300",
  },
  sloganLineStrong: {
    fontWeight: "700",
  },
  countriesCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      web: {
        boxShadow: "0 4px 12px rgba(0,0,0,0.18)",
      },
      default: {},
    }),
  },
  countriesCirclePressed: {
    opacity: 0.86,
  },
  countriesValue: {
    fontSize: 18,
    fontWeight: "700",
    lineHeight: 20,
  },
  countriesLabel: {
    fontSize: 10,
    fontWeight: "600",
    lineHeight: 12,
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginTop: 2,
  },
  countriesSpotsCircle: {
    width: 64,
    height: 64,
  },
  quickEditDescOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 70,
    justifyContent: "flex-start",
    alignItems: "center",
    padding: 20,
  },
  quickEditDescBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.32)",
  },
  quickEditDescCard: {
    width: "100%",
    maxWidth: 460,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 10,
  },
  quickEditDescTitle: {
    fontSize: 20,
    fontWeight: "700",
    lineHeight: 24,
  },
  quickEditDescInput: {
    minHeight: 98,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    lineHeight: 20,
    textAlignVertical: "top",
  },
  quickEditDescActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
    marginTop: 4,
  },
  quickEditDescButton: {
    minHeight: 40,
    minWidth: 96,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
  },
  quickEditDescButtonPrimary: {
    borderWidth: 0,
  },
  quickEditDescButtonText: {
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 18,
  },
  tagAssignModalRoot: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  tagAssignModalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  tagAssignModalCard: {
    width: "100%",
    maxWidth: 460,
    maxHeight: "85%",
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    paddingBottom: 16,
    zIndex: 1,
  },
  tagAssignModalHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 16,
  },
  tagAssignModalHeaderTitles: {
    flex: 1,
    minWidth: 0,
  },
  tagAssignModalScroll: {
    maxHeight: 440,
  },
  tagAssignModalScrollContent: {
    gap: 20,
  },
  tagAssignModalChipsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    alignItems: "center",
  },
  tagAssignModalEyebrow: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.3,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  tagAssignModalSpotTitle: {
    fontSize: 22,
    fontWeight: "700",
    lineHeight: 28,
  },
  tagAssignModalInlineRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    width: "100%",
  },
  tagAssignModalInputWrap: {
    flex: 1,
    minWidth: 0,
    position: "relative",
  },
  tagAssignModalInputClearWrap: {
    position: "absolute",
    right: 6,
    top: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  tagAssignModalInputInline: {
    width: "100%",
    minWidth: 0,
    borderWidth: 1,
    borderRadius: Radius.pill,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === "ios" ? 12 : 10,
    fontSize: 15,
  },
  tagAssignModalCrearBtn: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 999,
    flexShrink: 0,
  },
  tagAssignModalCrearBtnText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 15,
  },
  placeholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#eee",
  },
  placeholderText: {
    color: "#333",
    fontSize: 14,
  },
});

/*
 * CONTRATO: Search Fullscreen Overlay — Checklist manual:
 * - Tap pin => medium (o expanded si mismo pin)
 * - Drag peek<->medium<->expanded OK
 * - X en SpotSheet => cierra total (selectedSpot null)
 * - Map pan en medium/expanded => peek
 * - Abrir Search => sheet no se renderiza (no captura gestos)
 * - Cerrar Search => vuelve al estado anterior exacto
 */
