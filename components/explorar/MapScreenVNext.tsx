/**
 * MapScreenVNext — Explorar vNext: MapCore + MapControls + sheet placeholder.
 * Sin Search, SpotCard ni CreateSpot en este PR.
 */

import "@/styles/mapbox-attribution-overrides.css";
import "@/styles/viewport-dvh.css";
import "mapbox-gl/dist/mapbox-gl.css";

import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { LogOut, Search, User } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import {
    ActivityIndicator,
    Animated,
    Easing,
    Linking,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    useWindowDimensions,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { IconButton } from "@/components/design-system/icon-button";
import { MapControls } from "@/components/design-system/map-controls";
import {
    MapPinFilter,
    type MapPinFilterValue,
} from "@/components/design-system/map-pin-filter";
import type { SpotPinStatus } from "@/components/design-system/map-pins";
import { ResultRow } from "@/components/design-system/search-list-card";
import { SearchResultCard } from "@/components/design-system/search-result-card";
import { TypographyStyles } from "@/components/design-system/typography";
import { CreateSpotNameOverlay } from "@/components/explorar/CreateSpotNameOverlay";
import { CountriesSheet, type CountriesSheetState } from "@/components/explorar/CountriesSheet";
import { EXPLORE_LAYER_Z } from "@/components/explorar/layer-z";
import { MapCoreView } from "@/components/explorar/MapCoreView";
import { SHEET_PEEK_HEIGHT, SpotSheet } from "@/components/explorar/SpotSheet";
import { SearchFloating } from "@/components/search";
import type { SearchSection } from "@/components/search";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { DuplicateSpotModal } from "@/components/ui/duplicate-spot-modal";
import { FlowyaBetaModal } from "@/components/ui/flowya-beta-modal";
import { CreateSpotConfirmModal } from "@/components/ui/create-spot-confirm-modal";
import { useSystemStatus } from "@/components/ui/system-status-bar";
import { AUTH_MODAL_MESSAGES, useAuthModal } from "@/contexts/auth-modal";
import { useSearchControllerV2 } from "@/hooks/search/useSearchControllerV2";
import { useSearchHistory } from "@/hooks/search/useSearchHistory";
import { Colors, Spacing, WebTouchManipulation } from "@/constants/theme";
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
import { searchPlaces, type PlaceResult } from "@/lib/places/searchPlaces";
import {
  placeResultV2ToLegacy,
  searchPlacesPOI,
  type PlaceResultV2,
} from "@/lib/places/searchPlacesPOI";
import { searchPlacesByCategory } from "@/lib/places/searchPlacesCategory";
import {
    FIT_BOUNDS_PADDING,
    FIT_BOUNDS_DURATION_MS,
    FALLBACK_VIEW,
    FLOWYA_MAP_STYLE_DARK,
    FLOWYA_MAP_STYLE_LIGHT,
    INITIAL_BEARING,
    INITIAL_PITCH,
    SPOT_FOCUS_ZOOM,
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
  evaluateVisitedCountries,
  exploreRuntimeReducer,
  resolveDestinationFilterForStatus,
  shouldClearSelectedSpotOnFilterChange,
  shouldMarkPendingBadge,
  shouldPulseFilterOnStatusTransition,
  shouldRestoreSelectionOnSearchClose,
  shouldSwitchFilterOnStatusTransition,
  type ExploreSheetState,
  validateExploreRuntimeState,
} from "@/core/explore/runtime";
import { shareSpot } from "@/lib/share-spot";
import { checkDuplicateSpot } from "@/lib/spot-duplicate-check";
import { optimizeSpotImage } from "@/lib/spot-image-optimize";
import { uploadSpotCover } from "@/lib/spot-image-upload";
import {
  classifyTappedFeatureKind,
  dedupeExternalPlacesAgainstSpots,
  getStablePlaceId,
  getTappedFeatureId,
  getTappedFeatureMaki,
  inferTappedKindFromPlace,
  mergeSearchResults,
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
  recordExploreDecisionCompleted,
  recordExploreDecisionStarted,
  recordExploreSelectionChanged,
} from "@/lib/explore/decision-metrics";
import { shareCountriesCard } from "@/lib/share-countries-card";
import { SPOT_LINK_VERSION } from "@/lib/spot-linking/resolveSpotLink";
import {
    addRecentViewedSpotId,
    getRecentViewedSpotIds,
} from "@/lib/storage/recentViewedSpots";
import {
  getMapPinPendingBadges,
  setMapPinPendingBadges,
} from "@/lib/storage/mapPinPendingBadges";
import {
  getMapPinFilterPreference,
  setMapPinFilterPreference,
} from "@/lib/storage/mapPinFilterPreference";
import { supabase } from "@/lib/supabase";

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
  /** Derivado de saved/visited para map-pins (visited > saved > default). */
  pinStatus?: SpotPinStatus;
};

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
};

type CountryBucket = {
  key: string;
  label: string;
  count: number;
};

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
const COUNTRIES_AND_CONTROLS_GAP = 12;
const COUNTRIES_SLOT_RESERVED = COUNTRIES_COUNTER_SIZE + COUNTRIES_AND_CONTROLS_GAP;
const COUNTRIES_CENTER_ALIGNMENT_OFFSET =
  Math.round((COUNTRIES_COUNTER_SIZE - MAP_CONTROL_BUTTON_SIZE) / 2);
// Debe aproximar el alto real de 2 IconButton + gap para evitar "jump" en primer render.
const MAP_CONTROLS_FALLBACK_HEIGHT = 100;
const FILTER_OVERLAY_TOP = 28;
const TOP_OVERLAY_INSET = 28;
/** Ergonomía pulgar: desplaza overlays centrados ligeramente hacia abajo. */
const THUMB_FRIENDLY_CENTER_BIAS = 56;
/** Evita superposición entre subtítulos de estado y marca FLOWYA. */
const FLOWYA_LABEL_CLEARANCE = 60;
/** Mantiene separación legible entre subtítulos de estado y el borde del sheet. */
const STATUS_OVER_SHEET_CLEARANCE = 18;
const FILTER_TRIGGER_ESTIMATED_HEIGHT = 56;
const FILTER_MENU_ESTIMATED_HEIGHT = 210;
const FILTER_MENU_GAP = 8;
const FILTER_OVERLAY_ENTRY_DELAY_MS = 180;
const FILTER_OVERLAY_ENTRY_DURATION_MS = 320;
const FILTER_WAIT_FOR_CAMERA_FALLBACK_MS = 1600;
const FILTER_WAIT_RELEASE_DELAY_MS = 70;
/** Reserva lateral para no invadir la columna de MapControls en pantallas angostas. */
const STATUS_AVOID_CONTROLS_RIGHT = 64;
/** Retardo para priorizar lectura de subtítulos antes de mostrar contador de países. */
const COUNTRIES_OVERLAY_ENTRY_DELAY_MS = 320;

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
  const [pendingFilterBadges, setPendingFilterBadges] = useState<{
    saved: boolean;
    visited: boolean;
  }>(() => getMapPinPendingBadges());
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
  const [pinFilterPulseNonce, setPinFilterPulseNonce] = useState(0);
  const [isAuthUser, setIsAuthUser] = useState(false);
  const [showLogoutOption, setShowLogoutOption] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const countriesOverlayEntry = useRef(new Animated.Value(0)).current;
  const filterOverlayEntry = useRef(new Animated.Value(0)).current;
  const filterOverlayHasAnimatedInRef = useRef(false);
  const [isFilterWaitingForCamera, setIsFilterWaitingForCamera] = useState(true);
  const filterWaitActiveRef = useRef(true);
  const filterWaitFallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setMapPinFilterPreference(pinFilter);
  }, [pinFilter]);

  const prevSpotIdsRef = useRef<Set<string>>(new Set());
  const prevSelectedSpotRef = useRef<Spot | null>(null);
  const prevSheetStateRef = useRef<ExploreSheetState>("peek");
  const prevPinFilterRef = useRef<MapPinFilterValue>(pinFilter);
  const lastStatusSpotIdRef = useRef<{
    saved: string | null;
    visited: string | null;
  }>({
    saved: null,
    visited: null,
  });
  const searchFilterRefreshRef = useRef<MapPinFilterValue>(pinFilter);
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
  /** OL-WOW-F2-001-EMPTY: POIs por categoría cuando isEmpty (query vacía, pinFilter=all). */
  const [nearbyPlacesEmpty, setNearbyPlacesEmpty] = useState<PlaceResult[]>([]);
  const [isPlacingDraftSpot, setIsPlacingDraftSpot] = useState(false);
  const [draftCoverUri, setDraftCoverUri] = useState<string | null>(null);
  const [showBetaModal, setShowBetaModal] = useState(false);
  const [quickDescSpot, setQuickDescSpot] = useState<Spot | null>(null);
  const [quickDescValue, setQuickDescValue] = useState("");
  const [quickDescSaving, setQuickDescSaving] = useState(false);

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
  const pendingDeepLinkFocusRef = useRef<{
    id: string;
    lng: number;
    lat: number;
  } | null>(null);

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

  const invalidateSpotIdRef = useRef<((spotId: string) => void) | null>(null);

  const refetchSpots = useCallback(async () => {
    const { data } = await supabase
      .from("spots")
      .select(
        "id, title, description_short, description_long, cover_image_url, address, latitude, longitude, link_status, linked_place_id, linked_place_kind, linked_maki",
      )
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

    const visible = onlyVisible(withPins);
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
    return visible;
  }, [selectedSpot, setSheetState]);

  useFocusEffect(
    useCallback(() => {
      refetchSpots();
      return () => {};
    }, [refetchSpots]),
  );

  const filteredSpots = useMemo(() => {
    if (pinFilter === "all") return spots;
    if (pinFilter === "saved") return spots.filter((s) => s.saved);
    return spots.filter((s) => s.visited);
  }, [spots, pinFilter]);
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
    const visibilityFiltered = canHideLinkedUnsaved
      ? filteredSpots.filter((s) => !isLinkedUnsavedSpot(s))
      : filteredSpots;
    const base =
      visibilityFiltered.length > MAP_PIN_CAP
        ? visibilityFiltered.slice(0, MAP_PIN_CAP)
        : visibilityFiltered;
    if (selectedSpot?.id.startsWith("draft_")) return [...base, selectedSpot];
    /**
     * POI match: incluir selectedSpot si está fuera de filtro.
     * Guardrail: no reinsertar selectedSpot si está oculto por regla linked+unsaved.
     */
    if (
      pinFilter === "all" &&
      selectedSpot &&
      !(canHideLinkedUnsaved && isLinkedUnsavedSpot(selectedSpot)) &&
      !base.some((s) => s.id === selectedSpot.id)
    ) {
      return [...base, selectedSpot];
    }
    return base;
  }, [filteredSpots, selectedSpot, isPlacingDraftSpot, pinFilter]);

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
  const hasLinkedSelection = hasLinkedPlaceId(selectedSpot);
  const shouldSuppressMapboxPoiLabels = Boolean(poiTapped || hasLinkedSelection || isSelectedSpotHiddenOnMap);
  const shouldShowFlowyaSpotLabels = selectedSpot == null && poiTapped == null;
  const resolveEffectivePinStatus = useCallback(
    (status: SpotPinStatus | undefined): SpotPinStatus => {
      if (pinFilter === "saved") return "to_visit";
      if (pinFilter === "visited") return "visited";
      return status ?? "default";
    },
    [pinFilter],
  );
  /** No centrar en usuario durante intake de deep link (incluye geoloc tardía). */
  const skipCenterOnUser = deepLinkCenterLockRef.current;

  const mapCore = useMapCore(selectedSpot, {
    onLongPress: (coords) => onLongPressHandlerRef.current?.(coords),
    skipCenterOnUser,
    shouldCenterOnUser: () => !deepLinkCenterLockRef.current,
    // CONTRATO map->peek: pan/zoom mapa colapsa sheet a peek (EXPLORE_SHEET §4)
    onUserMapGestureStart: () => {
      setSheetState("peek");
      collapseCountriesSheetOnMapGestureRef.current?.();
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
        linkedMaki: s.linked_maki ?? null,
      })),
    selectedSpotId: selectedSpot?.id ?? null,
    onPinClick: (spot) => onPinClickHandlerRef.current?.(spot),
    is3DEnabled,
    showMakiIcon: featureFlags.flowyaPinMakiIcon,
    showSpotLabels: shouldShowFlowyaSpotLabels,
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
    handleReframeSpotAndUser,
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

  const queueDeepLinkFocus = useCallback(
    (spot: Spot) => {
      const payload = { id: spot.id, lng: spot.longitude, lat: spot.latitude };
      pendingDeepLinkFocusRef.current = payload;
      if (!mapInstance) return;
      flyToUnlessActMode(
        { lng: payload.lng, lat: payload.lat },
        { zoom: SPOT_FOCUS_ZOOM, duration: FIT_BOUNDS_DURATION_MS },
      );
      pendingDeepLinkFocusRef.current = null;
    },
    [mapInstance, flyToUnlessActMode],
  );

  useEffect(() => {
    if (!mapInstance) return;
    const pending = pendingDeepLinkFocusRef.current;
    if (!pending) return;
    flyToUnlessActMode(
      { lng: pending.lng, lat: pending.lat },
      { zoom: SPOT_FOCUS_ZOOM, duration: FIT_BOUNDS_DURATION_MS },
    );
    pendingDeepLinkFocusRef.current = null;
  }, [mapInstance, flyToUnlessActMode]);

  const contextualSelection = useMemo<{ id: string } | null>(() => {
    if (selectedSpot) return { id: selectedSpot.id };
    if (!poiTapped) return null;
    return { id: `poi:${poiTapped.placeId ?? `${poiTapped.lat.toFixed(5)},${poiTapped.lng.toFixed(5)}`}` };
  }, [selectedSpot, poiTapped]);

  const handleReframeContextual = useCallback(() => {
    if (selectedSpot) {
      suspendFilterUntilCameraSettles();
      handleReframeSpot();
      return;
    }
    if (!poiTapped) return;
    flyToUnlessActMode(
      { lng: poiTapped.lng, lat: poiTapped.lat },
      { zoom: SPOT_FOCUS_ZOOM, duration: FIT_BOUNDS_DURATION_MS },
    );
  }, [selectedSpot, handleReframeSpot, poiTapped, flyToUnlessActMode, suspendFilterUntilCameraSettles]);

  const handleReframeContextualAndUser = useCallback(() => {
    if (selectedSpot) {
      suspendFilterUntilCameraSettles();
      handleReframeSpotAndUser();
      return;
    }
    if (!poiTapped) return;
    if (mapInstance && userCoords) {
      try {
        suspendFilterUntilCameraSettles();
        mapInstance.fitBounds(
          [
            [poiTapped.lng, poiTapped.lat],
            [userCoords.longitude, userCoords.latitude],
          ],
          { padding: FIT_BOUNDS_PADDING, duration: FIT_BOUNDS_DURATION_MS },
        );
        return;
      } catch {
        // fallback a encuadre simple en POI
      }
    }
    handleReframeContextual();
  }, [
    selectedSpot,
    handleReframeSpotAndUser,
    poiTapped,
    mapInstance,
    userCoords,
    handleReframeContextual,
    suspendFilterUntilCameraSettles,
  ]);


  const pinCounts = useMemo(
    () => ({
      saved: spots.filter((s) => s.saved).length,
      visited: spots.filter((s) => s.visited).length,
    }),
    [spots],
  );

  const countriesSummaryByFilter = useMemo(() => {
    const toVisitSpots = spots.filter((s) => s.pinStatus === "to_visit");
    const visitedSpots = spots.filter((s) => s.pinStatus === "visited");
    return {
      saved: evaluateVisitedCountries(toVisitSpots),
      visited: evaluateVisitedCountries(visitedSpots),
    };
  }, [spots]);
  const countriesBucketsByFilter = useMemo(() => {
    const toVisitSpots = spots.filter((s) => s.pinStatus === "to_visit");
    const visitedSpots = spots.filter((s) => s.pinStatus === "visited");
    return {
      saved: buildCountryBuckets(toVisitSpots),
      visited: buildCountryBuckets(visitedSpots),
    };
  }, [spots]);

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

  const handlePinFilterChange = useCallback(
    (nextFilter: MapPinFilterValue, options?: { reframe?: boolean }) => {
      const currentFilter = pinFilter;
      if (nextFilter === currentFilter) return;
      const pendingForTarget =
        nextFilter !== "all" ? pendingFilterBadges[nextFilter] : false;
      const pendingSpotId =
        nextFilter === "saved" || nextFilter === "visited"
          ? lastStatusSpotIdRef.current[nextFilter]
          : null;
      setPinFilter(nextFilter);
      const fromAll = currentFilter === "all";
      const filterToast: Record<MapPinFilterValue, string> = fromAll
        ? {
            all: "Descubre y planea tu próximo viaje.",
            saved: "Empieza marcando lugares para tu próxima ruta.",
            visited: "Registra tus memorias y construye tu mapa personal.",
          }
        : {
            all: "Volviste a Todos.",
            saved: "Sigues en Por visitar: organiza y prepara tus spots.",
            visited: "Sigues en Visitados: registra tus memorias.",
          };
      if (!suppressToastRef.current) {
        toast.show(filterToast[nextFilter], { type: "success", replaceVisible: true });
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
    prevPinFilterRef.current = pinFilter;
    const shouldClearSelection = shouldClearSelectedSpotOnFilterChange({
      prevFilter,
      nextFilter: pinFilter,
      hasSelectedSpot: Boolean(selectedSpot),
      isDraftSpot: Boolean(selectedSpot?.id.startsWith("draft_")),
      isSelectedVisibleInNextFilter: Boolean(
        selectedSpot && filteredSpots.some((s) => s.id === selectedSpot.id),
      ),
    });
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
    const stillInActiveFilter = filteredSpots.some((spot) => spot.id === selectedSpot.id);
    if (stillInActiveFilter) return;
    setSelectedSpot(null);
    setSheetState("peek");
    setSheetHeight(SHEET_PEEK_HEIGHT);
  }, [pinFilter, filteredSpots, selectedSpot, setSheetState]);

  const spotsProvider = useMemo(
    () =>
      createSpotsStrategyProvider({
        getFilteredSpots: () => filteredSpots,
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
    [filteredSpots, mapInstance, zoom],
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
    getFilters: () => ({ pinFilter, hasVisited: pinCounts.visited > 0 }),
  });

  /**
   * Contrato teclado/foco:
   * Paso 0 (Nombre del spot) y Search son mutuamente excluyentes.
   * Si Paso 0 se abre, Search se cierra y se libera foco activo para evitar teclados empalmados.
   */
  useEffect(() => {
    if (!createSpotNameOverlayOpen) return;
    if (searchV2.isOpen) searchV2.setOpen(false);
    if (quickDescSpot) {
      setQuickDescSpot(null);
      setQuickDescValue("");
    }
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

  /** OL-WOW-F2-001-EMPTY: isEmpty merge spots + POIs por categoría cuando pinFilter=all. */
  const defaultItemsForEmpty = useMemo<(Spot | PlaceResult)[]>(() => {
    const isCountryDrilldownActive =
      searchV2.isOpen && countriesDrilldown != null && searchV2.query.trim().length === 0;
    if (isCountryDrilldownActive) return countryDrilldownItems;
    if (pinFilter !== "all") return defaultSpotsForEmpty;
    return mergeSearchResults(defaultSpotsForEmpty, nearbyPlacesEmpty, "");
  }, [
    searchV2.isOpen,
    searchV2.query,
    countriesDrilldown,
    countryDrilldownItems,
    pinFilter,
    defaultSpotsForEmpty,
    nearbyPlacesEmpty,
  ]);

  /** isEmpty con saved/visited: dos grupos "Spots en la zona" (radio fijo) y "Spots en el mapa", ordenados por distancia. */
  const defaultSectionsForEmpty = useMemo<SearchSection<Spot | PlaceResult>[]>(() => {
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
      if (nearby.length > 0) sections.push({ id: "nearby", title: "Spots en la zona", items: nearby });
      if (inWorld.length > 0) sections.push({ id: "world", title: "Spots en el mapa", items: inWorld });
      return sections;
    } catch {
      return [];
    }
  }, [
    searchV2.isOpen,
    searchV2.query,
    countriesDrilldown,
    countryDrilldownItems,
    pinFilter,
    mapInstance,
    filteredSpots,
    userCoords,
  ]);

  const searchHistory = useSearchHistory();

  /** OL-WOW-F2-001-SEARCH: fetch placeSuggestions siempre cuando query >= 3 y pinFilter=all. */
  useEffect(() => {
    const q = searchV2.query.trim();
    const shouldFetchExternal =
      searchV2.isOpen &&
      q.length >= 3 &&
      pinFilter === "all" &&
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

  /**
   * OL-WOW-F2-001-EMPTY: fetch POIs SOLO al abrir search (isEmpty, pinFilter=all).
   * NO en pan/zoom: evita muchas consultas. Usuario cierra search → ve mapa → abre search → fetch.
   */
  useEffect(() => {
    const q = searchV2.query.trim();
    const shouldFetchEmpty =
      searchV2.isOpen && q.length === 0 && pinFilter === "all";
    if (!shouldFetchEmpty) {
      setNearbyPlacesEmpty([]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const baseOpts: {
          limit: number;
          proximity?: { lat: number; lng: number };
          bbox?: { west: number; south: number; east: number; north: number };
        } = { limit: 8 };
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
            /* fallback: global search */
          }
        }
        // attraction + museum en paralelo para más landmarks (monumentos, museos, etc.)
        const [attractionResults, museumResults] = await Promise.all([
          searchPlacesByCategory("attraction", baseOpts),
          searchPlacesByCategory("museum", { ...baseOpts, limit: 6 }),
        ]);
        if (cancelled) return;
        const seen = new Set<string>();
        const merged: PlaceResult[] = [];
        for (const p of [...attractionResults, ...museumResults]) {
          if (seen.has(p.id)) continue;
          seen.add(p.id);
          merged.push(p);
        }
        const deduped = dedupeExternalPlacesAgainstSpots(merged, filteredSpots);
        setNearbyPlacesEmpty(deduped);
      } catch {
        if (!cancelled) setNearbyPlacesEmpty([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [searchV2.isOpen, searchV2.query, pinFilter, mapInstance, filteredSpots]);

  useEffect(() => {
    const q = searchV2.query.trim().toLowerCase();
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
    pinFilter,
    selectedSpot,
    poiTapped,
  ]);

  const recentViewedSpots = useMemo(() => {
    const ids = getRecentViewedSpotIds();
    return ids
      .map((id) => spots.find((s) => s.id === id))
      .filter((s): s is Spot => s != null);
  }, [spots]);

  useEffect(() => {
    searchV2.setOnSelect((spot: Spot) => {
      openFromSearchRef.current = true;
      searchV2.setOpen(false);
      setSelectedSpot(spot);
      recordExploreSelectionChanged({
        entityType: "spot",
        selectionState: "selected",
        fromFilter: pinFilter,
        toFilter: pinFilter,
      });
      setSheetState("medium"); // OL-057: entry from SearchResultCard always opens sheet MEDIUM (no peek)
      recordSearchSpotClick();
      addRecentViewedSpotId(spot.id);
      searchHistory.addCompletedQuery(searchV2.query);
      /** OL-WOW-F2-005 inspect: centrar solo si spot no visible en viewport. */
      /** OL-WOW-F2-005 act: no flyTo durante create/edit/placing. */
      if (mapInstance && !isPointVisibleInViewport(mapInstance, spot.longitude, spot.latitude)) {
        flyToUnlessActMode(
          { lng: spot.longitude, lat: spot.latitude },
          { zoom: SPOT_FOCUS_ZOOM, duration: FIT_BOUNDS_DURATION_MS },
        );
      }
    });
  }, [mapInstance, flyToUnlessActMode, searchHistory, searchV2, setSheetState, pinFilter]);

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
      setPinFilter("all"); // so spot is in filteredSpots and the sync effect doesn't clear selection
      setSelectedSpot(spot);
      setSheetState(targetState); // extended → expanded, medium → medium
      queueDeepLinkFocus(spot);
      addRecentViewedSpotId(spot.id);
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
        .select(
          "id, title, description_short, description_long, cover_image_url, address, latitude, longitude",
        )
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
  }, [params.spotId, params.sheet, router, queueDeepLinkFocus, setPinFilter, setSheetState]);

  /** Post-create intake: created=<id> → select spot, open sheet expanded, then clean params. Preserva comportamiento Create Spot original (Explorar + SpotSheet extended). */
  useEffect(() => {
    const createdId = params.created;
    if (!createdId) return;
    if (appliedCreatedIdRef.current === createdId) return;

    const applyCreated = (spot: Spot) => {
      deepLinkCenterLockRef.current = true;
      appliedCreatedIdRef.current = createdId;
      setPinFilter("all");
      setSelectedSpot(spot);
      setSheetState("expanded");
      queueDeepLinkFocus(spot);
      addRecentViewedSpotId(spot.id);
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
        .select(
          "id, title, description_short, description_long, cover_image_url, address, latitude, longitude",
        )
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
  }, [params.created, spots, router, queueDeepLinkFocus, setPinFilter, setSheetState]);

  /** Encuadrar cámara en spot cuando volvemos de edit (spotId) o create (created). OL-WOW-F2-005 act: no flyTo durante create/placing. */
  useEffect(() => {
    const deepLinkSpotId = params.spotId ?? params.created;
    if (!deepLinkSpotId || !mapInstance || !selectedSpot || selectedSpot.id !== deepLinkSpotId)
      return;
    flyToUnlessActMode(
      { lng: selectedSpot.longitude, lat: selectedSpot.latitude },
      { zoom: SPOT_FOCUS_ZOOM, duration: FIT_BOUNDS_DURATION_MS }
    );
  }, [params.spotId, params.created, mapInstance, selectedSpot, flyToUnlessActMode]);

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
    (coords: { lat: number; lng: number }, title: string = "Nuevo spot") => {
      const draft: Spot = {
        id: `draft_${Date.now()}`,
        title: title.trim() || "Nuevo spot",
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
    const title = searchV2.query.trim() || "Nuevo spot";
    searchV2.setOpen(false);
    setCreateSpotPendingCoords({ lat, lng });
    setCreateSpotInitialName(title);
    setCreateSpotNameOverlayOpen(true);
  }, [requireAuthOrModal, searchV2, getFallbackCoords]);

  /** Lugar sugerido en búsqueda: mostrar POI sheet (card medium con Por visitar) y encuadrar mapa en el lugar. */
  const handleCreateFromPlace = useCallback(
    (place: PlaceResult) => {
      const stablePlaceId = getStablePlaceId(place);
      searchV2.setOpen(false);
      const existingSpot = resolveTappedSpotMatch(spots, {
        lat: place.lat,
        lng: place.lng,
        name: place.name,
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
        flyToUnlessActMode(
          { lng: existingSpot.longitude, lat: existingSpot.latitude },
          { zoom: SPOT_FOCUS_ZOOM, duration: FIT_BOUNDS_DURATION_MS }
        );
        return;
      }
      setSelectedSpot(null);
      recordSearchExternalClick();
      setPoiTapped({
        name: place.name,
        lat: place.lat,
        lng: place.lng,
        kind: inferTappedKindFromPlace(place),
        placeId: stablePlaceId,
        maki: place.maki ?? null,
        visualState: "default",
        source: "search_suggestion",
      });
      recordExploreSelectionChanged({
        entityType: "poi",
        selectionState: "selected",
        fromFilter: pinFilter,
        toFilter: pinFilter,
      });
      setSheetState("medium");
      flyToUnlessActMode(
        { lng: place.lng, lat: place.lat },
        { zoom: SPOT_FOCUS_ZOOM, duration: FIT_BOUNDS_DURATION_MS }
      );
    },
    [searchV2, spots, flyToUnlessActMode, setSheetState, pinFilter],
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
        const features = mapInstance.queryRenderedFeatures(e.point);
        for (const f of features) {
          const props = f.properties;
          if (!props) continue;
          const name =
            (typeof props.name === "string" && props.name.trim()) ||
            (typeof props.name_en === "string" && props.name_en.trim()) ||
            (typeof props.title === "string" && props.title.trim());
          if (!name) continue;
          const geom = f.geometry;
          if (geom?.type !== "Point" || !Array.isArray(geom.coordinates)) continue;
          const [lng, lat] = geom.coordinates;
          if (typeof lat !== "number" || typeof lng !== "number") continue;
          const tappedFeatureId = getTappedFeatureId(
            f.id,
            props as Record<string, unknown>,
          );
          const match = resolveTappedSpotMatch(spots, {
            lat,
            lng,
            name: name.trim(),
            placeId: tappedFeatureId,
          });
          if (match) {
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
          const kind = classifyTappedFeatureKind(f.layer?.id, props as Record<string, unknown>);
          setSelectedSpot(null);
          setPoiTapped({
              name: name.trim(),
              lat,
              lng,
            kind,
            placeId: tappedFeatureId,
            maki: getTappedFeatureMaki(props as Record<string, unknown>),
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
          return;
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
      const titleToUse = draft.title?.trim() || "Nuevo spot";
      if (!skipDuplicateCheck) {
        const duplicateResult = await checkDuplicateSpot(titleToUse, draft.latitude, draft.longitude);
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
      title: draft.title?.trim() || "Nuevo spot",
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
    refetchSpots();

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
              prev?.id === newId ? { ...prev, address } : prev,
            );
          }
        });
    });
    },
    [selectedSpot, draftCoverUri, requireAuthOrModal, refetchSpots, searchV2, toast, setDuplicateModal, setSheetState],
  );

  const [poiSheetLoading, setPoiSheetLoading] = useState(false);
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
        };
        if (user?.id && !user.is_anonymous) {
          insertPayload.user_id = user.id;
        }
        const { data: inserted, error: insertError } = await supabase
          .from("spots")
          .insert(insertPayload)
          .select(
            "id, title, description_short, description_long, cover_image_url, address, latitude, longitude, link_status, linked_place_id, linked_place_kind, linked_maki",
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
        refetchSpots();
        resolveAddress(poi.lat, poi.lng).then((address) => {
          if (!address) return;
          supabase
            .from("spots")
            .update({ address })
            .eq("id", newId)
            .then(({ error }) => {
              if (!error) {
                setSelectedSpot((prev) =>
                  prev?.id === newId ? { ...prev, address } : prev,
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
    [poiTapped, requireAuthOrModal, refetchSpots, resetPoiTappedVisualState, toast, setSheetState],
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
        };
        if (user?.id && !user.is_anonymous) {
          insertPayload.user_id = user.id;
        }
        const { data: inserted, error: insertError } = await supabase
          .from("spots")
          .insert(insertPayload)
          .select("id, title, link_status, linked_place_id, linked_place_kind, linked_maki")
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
          saved: state?.saved ?? false,
          visited: state?.visited ?? false,
          pinStatus: state?.visited ? "visited" : state?.saved ? "to_visit" : "default",
        };
        setSpots((prev) => (prev.some((s) => s.id === created.id) ? prev : [...prev, created]));
        setSelectedSpot(created);
        setPoiTapped(null);
        setSheetState("medium");
        refetchSpots();
      } catch {
        if (!suppressToastRef.current) toast.show("Ups, no se pudo guardar. ¿Intentas de nuevo?", { type: "error" });
      } finally {
        setPoiSheetLoading(false);
      }
  }, [poiTapped, requireAuthOrModal, refetchSpots, toast, setSheetState]);

  /** Ver spot existente (desde modal duplicado): abre sheet MEDIUM con pin seleccionado. */
  const handleViewExistingSpot = useCallback(
    (spotId: string) => {
      setPoiTapped(null);
      const fromList = spots.find((s) => s.id === spotId);
      if (fromList) {
        setPinFilter("all");
        setSelectedSpot(fromList);
        setSheetState("medium");
        addRecentViewedSpotId(fromList.id);
        flyToUnlessActMode(
          { lng: fromList.longitude, lat: fromList.latitude },
          { zoom: SPOT_FOCUS_ZOOM, duration: 600 },
        );
        return;
      }
      (async () => {
        const { data, error } = await supabase
          .from("spots")
          .select("id, title, description_short, description_long, cover_image_url, address, latitude, longitude")
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
        setPinFilter("all");
        setSelectedSpot(spot);
        setSheetState("medium");
        addRecentViewedSpotId(spot.id);
        flyToUnlessActMode(
          { lng: spot.longitude, lat: spot.latitude },
          { zoom: SPOT_FOCUS_ZOOM, duration: 600 },
        );
      })();
    },
    [spots, flyToUnlessActMode, setPinFilter, setSheetState],
  );

  const patchSpotSearchMetadata = useCallback(
    (spotId: string, patch: Partial<Pick<Spot, "cover_image_url" | "description_short">>) => {
      setSpots((prev) => prev.map((s) => (s.id === spotId ? { ...s, ...patch } : s)));
      setSelectedSpot((prev) => (prev?.id === spotId ? { ...prev, ...patch } : prev));
      invalidateSpotIdRef.current?.(spotId);
    },
    [],
  );

  const handleQuickAddImageFromSearch = useCallback(
    async (spot: Spot) => {
      if (!(await requireAuthOrModal(AUTH_MODAL_MESSAGES.editSpot))) return;
      try {
        const ImagePicker = await import("expo-image-picker");
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.85,
        });
        if (result.canceled || !result.assets?.[0]?.uri) return;
        const res = await fetch(result.assets[0].uri);
        if (!res.ok) {
          if (!suppressToastRef.current) toast.show("No se pudo leer la imagen seleccionada.", { type: "error" });
          return;
        }
        const blob = await res.blob();
        const optimized = await optimizeSpotImage(blob);
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
    [patchSpotSearchMetadata, requireAuthOrModal, toast],
  );

  const handleQuickEditDescriptionOpen = useCallback((spot: Spot) => {
    setQuickDescSpot(spot);
    setQuickDescValue(spot.description_short?.trim() ?? "");
  }, []);

  const handleQuickEditDescriptionClose = useCallback(() => {
    if (quickDescSaving) return;
    setQuickDescSpot(null);
    setQuickDescValue("");
  }, [quickDescSaving]);

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
      startDraftCreateSpot(createSpotPendingCoords, name.trim() || "Nuevo spot");
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
  const [countriesMapSnapshot, setCountriesMapSnapshot] = useState<string | null>(null);
  const [isCountriesShareInFlight, setIsCountriesShareInFlight] = useState(false);
  const [showFilteredResultsOnEmpty, setShowFilteredResultsOnEmpty] = useState(false);
  const isCountriesShareInFlightRef = useRef(false);
  const lastCountriesShareAtRef = useRef(0);
  const countriesShareConsumedRef = useRef(false);
  const showCountriesCounterBubble = showCountriesCounter && !countriesSheetOpen;
  const [countriesSheetState, setCountriesSheetState] = useState<CountriesSheetState>("expanded");
  suppressToastRef.current = countriesSheetOpen && countriesSheetState === "expanded";
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
    if (showCountriesCounter) return;
    setCountriesSheetOpen(false);
    setCountriesSheetHeight(0);
    setCountriesDrilldown(null);
  }, [showCountriesCounter]);
  useEffect(() => {
    if (countriesSheetOpen) return;
    countriesShareConsumedRef.current = false;
  }, [countriesSheetOpen]);
  useEffect(() => {
    if (!countriesSheetOpen) return;
    if (countriesOverlayFilter === countriesFilterForActiveCounter) return;
    setCountriesOverlayFilter(countriesFilterForActiveCounter);
  }, [countriesSheetOpen, countriesOverlayFilter, countriesFilterForActiveCounter]);
  useEffect(() => {
    collapseCountriesSheetOnMapGestureRef.current = () => {
      if (!countriesSheetOpen) return;
      setCountriesSheetState("peek");
    };
  }, [countriesSheetOpen]);

  const handleCountriesCounterPress = useCallback(() => {
    if (!countriesOverlayMounted) return;
    countriesSheetPrevSelectionRef.current = {
      spot: selectedSpot,
      poi: poiTapped,
    };
    // Contrato de capas/sheets: no apilar sheets. CountriesSheet reemplaza SpotSheet activa.
    setSelectedSpot(null);
    setPoiTapped(null);
    setSheetState("peek");
    setSheetHeight(SHEET_PEEK_HEIGHT);
    setIsPlacingDraftSpot(false);
    setDraftCoverUri(null);
    setCountriesSheetState("medium");
    setCountriesSheetOpen(true);
  }, [countriesOverlayMounted, poiTapped, selectedSpot, setSheetState]);

  const handleCountriesSheetClose = useCallback(() => {
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
    setShowFilteredResultsOnEmpty(true);
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
    searchV2.setQuery("");
  }, [createSpotNameOverlayOpen, countriesSheetOpen, countriesSheetState, selectedSpot, sheetState, searchV2]);

  const handleCountryBucketPress = useCallback(
    (country: CountryBucket) => {
      setCountriesDrilldown({ key: country.key, label: country.label });
      openSearchPreservingCountriesSheet();
      searchV2.setQuery(country.label);
      if (!suppressToastRef.current) toast.show(`Mostrando lugares en ${country.label}.`, {
        type: "success",
        replaceVisible: true,
      });
    },
    [openSearchPreservingCountriesSheet, searchV2, toast],
  );
  const handleCountriesSheetShare = useCallback(async () => {
    if (countriesShareConsumedRef.current) return;
    const now = Date.now();
    // Web sometimes emits a second press/click around share flows.
    // Keep a longer cooldown to guarantee a single outbound share action.
    if (now - lastCountriesShareAtRef.current < 6000) return;
    if (isCountriesShareInFlightRef.current) return;
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

  /** OL-WOW-F2-001-SEARCH: pinFilter=all → merge spots+places; saved/visited → solo spots con reorden viewport. */
  const searchDisplayResults = useMemo<(Spot | PlaceResult)[]>(() => {
    const normalizedQuery = normalizeCountryToken(searchV2.query);
    const isCountryDrilldownQuery =
      countriesDrilldown != null &&
      searchV2.isOpen &&
      normalizedQuery.length > 0 &&
      normalizedQuery === normalizeCountryToken(countriesDrilldown.label);
    if (isCountryDrilldownQuery) {
      if (pinFilter === "all") {
        return mergeSearchResults(countryDrilldownItems, placeSuggestions, searchV2.query);
      }
      return countryDrilldownItems;
    }
    const viewportTick = viewportNonce;
    if (pinFilter === "all") {
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
  const kpiSpotsSearchResults = useMemo<(Spot | PlaceResult)[]>(() => {
    if (!showFilteredResultsOnEmpty) return searchDisplayResults;
    if (!searchV2.isOpen || searchV2.query.trim().length > 0) return searchDisplayResults;
    if (pinFilter !== "saved" && pinFilter !== "visited") return searchDisplayResults;
    if (!mapInstance || filteredSpots.length <= 1) return filteredSpots;
    try {
      const center = mapInstance.getCenter();
      return [...filteredSpots].sort(
        (a, b) =>
          distanceKm(center.lat, center.lng, a.latitude, a.longitude) -
          distanceKm(center.lat, center.lng, b.latitude, b.longitude),
      );
    } catch {
      return filteredSpots;
    }
  }, [
    showFilteredResultsOnEmpty,
    searchDisplayResults,
    searchV2.isOpen,
    searchV2.query,
    pinFilter,
    mapInstance,
    filteredSpots,
  ]);
  const searchResultSections = useMemo<SearchSection<Spot>[]>(() => {
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
    if (searchDisplayResults.length === 0) return [];
    if (!mapInstance) return [];
    try {
      const center = mapInstance.getCenter();
      const nearby = searchDisplayResults.filter((spot) => {
        const lat = "latitude" in spot ? spot.latitude : (spot as PlaceResult).lat;
        const lng = "longitude" in spot ? spot.longitude : (spot as PlaceResult).lng;
        return distanceKm(center.lat, center.lng, lat, lng) <= SPOTS_ZONA_RADIUS_KM;
      });
      const inWorld = searchDisplayResults.filter((spot) => {
        const lat = "latitude" in spot ? spot.latitude : (spot as PlaceResult).lat;
        const lng = "longitude" in spot ? spot.longitude : (spot as PlaceResult).lng;
        return distanceKm(center.lat, center.lng, lat, lng) > SPOTS_ZONA_RADIUS_KM;
      });
      const sections: SearchSection<Spot>[] = [];
      if (nearby.length > 0) {
        sections.push({ id: "nearby", title: "Spots en la zona", items: nearby });
      }
      if (inWorld.length > 0) {
        sections.push({ id: "world", title: "Spots en el mapa", items: inWorld });
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
    searchDisplayResults,
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

      const hasDestination = nextState.saved || nextState.visited;
      const destinationFilter = hasDestination
        ? resolveDestinationFilterForStatus(nextState.visited ? "visited" : "to_visit")
        : null;

      if (!hasDestination) {
        if (lastStatusSpotIdRef.current.saved === spot.id) {
          lastStatusSpotIdRef.current.saved = null;
        }
        if (lastStatusSpotIdRef.current.visited === spot.id) {
          lastStatusSpotIdRef.current.visited = null;
        }
        updatePendingFilterBadges((prev) => ({ ...prev, saved: false, visited: false }));
      } else if (destinationFilter) {
        lastStatusSpotIdRef.current[destinationFilter] = spot.id;
        if (destinationFilter === "visited" && lastStatusSpotIdRef.current.saved === spot.id) {
          lastStatusSpotIdRef.current.saved = null;
        }
        if (shouldMarkPendingBadge({ currentFilter: pinFilter })) {
          updatePendingFilterBadges((prev) => ({
            ...prev,
            [destinationFilter]: true,
          }));
        } else if (
          shouldSwitchFilterOnStatusTransition({
            currentFilter: pinFilter,
            destinationFilter,
          })
        ) {
          setPinFilter(destinationFilter);
          if (mapInstance && !isPointVisibleInViewport(mapInstance, spot.longitude, spot.latitude)) {
            flyToUnlessActMode(
              { lng: spot.longitude, lat: spot.latitude },
              { zoom: SPOT_FOCUS_ZOOM, duration: FIT_BOUNDS_DURATION_MS },
            );
          }
        } else if (
          shouldPulseFilterOnStatusTransition({
            currentFilter: pinFilter,
            destinationFilter,
          })
        ) {
          setPinFilterPulseNonce((n) => n + 1);
        }
      }

      updateSpotPinState(spot.id, nextState);
      const outcome = nextState.visited
        ? "visited"
        : nextState.saved
          ? "saved"
          : "dismissed";
      recordExploreDecisionCompleted({ outcome, pinFilter });
      setSheetState("medium");
      if (!suppressToastRef.current) {
        const toastText =
          outcome === "visited"
            ? "¡Marcado como visitado!"
            : outcome === "saved"
              ? "Agregado a Por visitar"
              : "Listo, ya no está en tu lista";
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
      setPinFilter,
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

  const { height: windowHeight } = useWindowDimensions();
  const dockBottomOffset = 12;
  const isSpotSheetVisible = selectedSpot != null || poiTapped != null;
  const isCountriesSheetVisible = countriesSheetOpen;
  const [mapControlsHeight, setMapControlsHeight] = useState(MAP_CONTROLS_FALLBACK_HEIGHT);
  const areMapControlsVisible =
    !createSpotNameOverlayOpen &&
    !searchV2.isOpen &&
    sheetState !== "expanded" &&
    (!isCountriesSheetVisible || countriesSheetState !== "expanded");
  const filterDefaultTop = FILTER_OVERLAY_TOP + insets.top;
  const filterEstimatedHeight = 56;
  const filterMinimumTop = insets.top + 4;
  // Canonical parity: dropdown de filtros sigue el comportamiento de SpotSheet.
  // CountriesSheet no modifica este anclaje para evitar divergencias UX.
  const filterAnchorSheetHeight = isSpotSheetVisible ? sheetHeight : 0;
  const filterAnchorSheetTop = windowHeight - filterAnchorSheetHeight;
  const filterTop = filterAnchorSheetHeight > 0
    ? Math.min(filterDefaultTop, filterAnchorSheetTop - filterEstimatedHeight - 8)
    : filterDefaultTop;
  const availableSpaceAboveFilter = filterTop - (insets.top + 4);
  const availableSpaceBelowFilter =
    filterAnchorSheetHeight > 0
      ? filterAnchorSheetTop - (filterTop + FILTER_TRIGGER_ESTIMATED_HEIGHT)
      : windowHeight - insets.bottom - (filterTop + FILTER_TRIGGER_ESTIMATED_HEIGHT);
  const shouldOpenFilterMenuUp =
    availableSpaceAboveFilter >= FILTER_MENU_ESTIMATED_HEIGHT + FILTER_MENU_GAP &&
    availableSpaceBelowFilter < FILTER_MENU_ESTIMATED_HEIGHT + FILTER_MENU_GAP;
  const shouldShowFilterDropdown =
    !createSpotNameOverlayOpen &&
    !searchV2.isOpen &&
    !isFilterWaitingForCamera &&
    filterTop >= filterMinimumTop;
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
  const controlsBottomOffset =
    isSpotSheetVisible
      ? CONTROLS_OVERLAY_BOTTOM + sheetHeight
      : isCountriesSheetVisible
        ? CONTROLS_OVERLAY_BOTTOM + countriesSheetHeight
        : dockBottomOffset + insets.bottom;
  const shouldUseCenteredOverlayColumn = !isSpotSheetVisible && !isCountriesSheetVisible;
  const shouldCenterCountriesAndControls = shouldUseCenteredOverlayColumn;
  const shouldCenterCountriesWithPeekSheet =
    isSpotSheetVisible && sheetState === "peek" && !isCountriesSheetVisible;
  const centeredGroupHeight =
    COUNTRIES_COUNTER_SIZE + COUNTRIES_AND_CONTROLS_GAP + mapControlsHeight;
  const centeredGroupTop = Math.max(
    insets.top + TOP_OVERLAY_INSET,
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
          insets.top + TOP_OVERLAY_INSET,
          Math.round(windowHeight * 0.5 - COUNTRIES_COUNTER_SIZE * 0.5 + THUMB_FRIENDLY_CENTER_BIAS),
        );
  const countriesCenteredBottom = Math.max(
    dockBottomOffset + insets.bottom,
    windowHeight - countriesCenterTopByAnchorMode - COUNTRIES_COUNTER_SIZE,
  );
  const countriesResolvedBottom =
    countriesOverlayAnchorMode === "bottom" ? countriesBottomOffset : countriesCenteredBottom;
  const handleControlsOverlayLayout = useCallback((event: any) => {
    const nextHeight = Math.round(event?.nativeEvent?.layout?.height ?? 0);
    if (nextHeight <= 0) return;
    setMapControlsHeight((current) => (Math.abs(current - nextHeight) >= 2 ? nextHeight : current));
  }, []);

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

  const handleLocateWithFilterDelay = useCallback(() => {
    suspendFilterUntilCameraSettles();
    handleLocate();
  }, [handleLocate, suspendFilterUntilCameraSettles]);

  const handleViewWorldWithFilterDelay = useCallback(() => {
    suspendFilterUntilCameraSettles();
    handleViewWorld();
  }, [handleViewWorld, suspendFilterUntilCameraSettles]);

  useEffect(() => {
    if (!shouldShowFilterDropdown) {
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
  }, [shouldShowFilterDropdown, filterOverlayEntry]);

  useEffect(() => {
    const isFlowyaLabelVisible = !createSpotNameOverlayOpen && !searchV2.isOpen;
    const isSpotSheetVisible = selectedSpot != null || poiTapped != null;
    const isCountriesSheetVisible = countriesSheetOpen;
    const areMapControlsVisible =
      !createSpotNameOverlayOpen &&
      !searchV2.isOpen &&
      sheetState !== "expanded" &&
      (!isCountriesSheetVisible || countriesSheetState !== "expanded");
    const bottom =
      isSpotSheetVisible
        ? CONTROLS_OVERLAY_BOTTOM + sheetHeight + STATUS_OVER_SHEET_CLEARANCE
        : isCountriesSheetVisible
          ? CONTROLS_OVERLAY_BOTTOM + countriesSheetHeight + STATUS_OVER_SHEET_CLEARANCE
        : dockBottomOffset + insets.bottom + (isFlowyaLabelVisible ? FLOWYA_LABEL_CLEARANCE : 0);
    toast.setAnchor({
      placement: "bottom-left",
      left: TOP_OVERLAY_INSET + insets.left,
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
    createSpotNameOverlayOpen,
    searchV2.isOpen,
    sheetState,
    countriesSheetState,
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

  const initialViewState = is3DEnabled
    ? { ...FALLBACK_VIEW, pitch: INITIAL_PITCH, bearing: INITIAL_BEARING }
    : FALLBACK_VIEW;

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
        initialViewState={initialViewState}
        onLoad={handleMapLoadWithFilterDelay}
        onPointerDown={handleMapPointerDown}
        onPointerMove={handleMapPointerMove}
        onPointerUp={handleMapPointerUp}
        spots={displayedSpots}
        selectedSpotId={selectedSpot?.id ?? null}
        userCoords={userCoords}
        zoom={zoom}
        onPinClick={handlePinClick}
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
      {shouldShowFilterDropdown ? (
        <Animated.View
          pointerEvents="box-none"
          style={[
            styles.filterOverlay,
            { top: Math.max(filterMinimumTop, filterTop) },
            filterOverlayAnimatedStyle,
          ]}
        >
          <View pointerEvents="box-none" style={styles.filterRowWrap}>
            <MapPinFilter
              value={pinFilter}
              onChange={(next) => handlePinFilterChange(next, { reframe: true })}
              counts={pinCounts}
              pendingValues={pendingFilterBadges}
              pulseNonce={pinFilterPulseNonce}
              menuPlacement={shouldOpenFilterMenuUp ? "up" : "down"}
              hideActiveCount={showCountriesCounterBubble}
            />
          </View>
        </Animated.View>
      ) : null}
      {!createSpotNameOverlayOpen && !searchV2.isOpen ? (
        <View
          pointerEvents="box-none"
          style={[
            styles.profileOverlay,
            {
              top: TOP_OVERLAY_INSET + insets.top,
              left: TOP_OVERLAY_INSET + insets.left,
            },
          ]}
        >
          <View style={styles.profileTopRow}>
            <IconButton
              variant="default"
              onPress={handleProfilePress}
              accessibilityLabel="Cuenta"
            >
              <User
                size={24}
                color={isAuthUser ? Colors[colorScheme ?? "light"].primary : Colors[colorScheme ?? "light"].text}
                strokeWidth={2}
              />
            </IconButton>
          </View>
          {showLogoutOption && isAuthUser ? (
            <View style={styles.logoutButtonWrap}>
              <Pressable
                style={({ pressed }) => [
                  styles.logoutButtonFloating,
                  pressed && styles.logoutButtonFloatingPressed,
                ]}
                onPress={handleLogoutPress}
                accessibilityLabel="Cerrar sesión"
                accessibilityRole="button"
              >
                <LogOut size={24} color={Colors[colorScheme ?? "light"].stateError} strokeWidth={2} />
              </Pressable>
            </View>
          ) : null}
        </View>
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
        shareDisabled={isCountriesShareInFlight}
        onItemPress={handleCountryBucketPress}
        onSheetHeightChange={setCountriesSheetHeight}
        onMapSnapshotChange={setCountriesMapSnapshot}
        onMapCountryPress={handleCountriesMapCountryPress}
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
          ]}
          pointerEvents="box-none"
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
              accessibilityLabel="Abrir lista de spots del filtro activo"
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
                spots
              </Text>
            </Pressable>
          </View>
        </Animated.View>
      ) : null}
      {!createSpotNameOverlayOpen && !searchV2.isOpen ? (
        <View
          pointerEvents="box-none"
          style={[
            styles.createSpotOverlay,
            {
              top: TOP_OVERLAY_INSET + insets.top,
              right: CONTROLS_OVERLAY_RIGHT + insets.right,
            },
          ]}
        >
          <IconButton
            variant="default"
            onPress={openSearchPreservingCountriesSheet}
            accessibilityLabel="Buscar spots"
          >
            <Search size={24} color={Colors[colorScheme ?? "light"].text} strokeWidth={2} />
          </IconButton>
        </View>
      ) : null}
      {areMapControlsVisible ? (
        <View
          pointerEvents="box-none"
          onLayout={handleControlsOverlayLayout}
          style={[
            styles.controlsOverlay,
            {
              right:
                CONTROLS_OVERLAY_RIGHT + insets.right + COUNTRIES_CENTER_ALIGNMENT_OFFSET,
              bottom: controlsResolvedBottom,
              flexDirection: "column",
              gap: Spacing.sm,
            },
          ]}
        >
          <MapControls
            map={mapInstance}
            onLocate={handleLocateWithFilterDelay}
            selectedSpot={contextualSelection}
            onReframeSpot={handleReframeContextual}
            onReframeSpotAndUser={handleReframeContextualAndUser}
            hasUserLocation={userCoords != null}
            onViewWorld={handleViewWorldWithFilterDelay}
            activeMapControl={activeMapControl}
          />
        </View>
      ) : null}
      {!createSpotNameOverlayOpen && !searchV2.isOpen ? (
        <Pressable
          style={[styles.flowyaLabelWrap, { left: TOP_OVERLAY_INSET + insets.left, bottom: dockBottomOffset + insets.bottom }, WebTouchManipulation]}
          onPress={() => setShowBetaModal(true)}
          accessibilityLabel="FLOWYA Beta"
        >
          {({ pressed }) => (
            <Text
              style={[
                TypographyStyles.heading2,
                { color: Colors[colorScheme ?? "light"].text, opacity: pressed ? 0.7 : 1 },
              ]}
            >
              FLOWYA
            </Text>
          )}
        </Pressable>
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
        controller={searchV2}
        defaultItems={defaultItemsForEmpty}
        defaultItemSections={defaultSectionsForEmpty}
        recentQueries={searchHistory.recentQueries}
        recentViewedItems={recentViewedSpots}
        insets={{ top: insets.top, bottom: insets.bottom }}
        pinFilter={pinFilter}
        pinCounts={pinCounts}
        onPinFilterChange={(next) => handlePinFilterChange(next, { reframe: false })}
        resultsOverride={kpiSpotsSearchResults}
        resultSections={searchResultSections}
        showResultsOnEmpty={showFilteredResultsOnEmpty}
        placeSuggestions={pinFilter === "all" ? [] : placeSuggestions}
        onCreateFromPlace={handleCreateFromPlace}
        activitySummary={{
          isVisible: false,
          visitedPlacesCount: pinCounts.visited,
          pendingPlacesCount: pinCounts.saved,
          visitedCountriesCount: countriesSummaryByFilter.visited.count,
          isLoading: false,
        }}
        renderItem={(item: Spot | PlaceResult) => {
          const ref = userCoords ?? { latitude: FALLBACK_VIEW.latitude, longitude: FALLBACK_VIEW.longitude };
          if ("title" in item && "latitude" in item) {
            const spot = item as Spot;
            const km = distanceKm(ref.latitude, ref.longitude, spot.latitude, spot.longitude);
            const distanceText = formatDistanceKm(km);
            const isVisitedFilter = pinFilter === "visited";
            const descriptionShort = spot.description_short?.trim() ?? "";
            const hasDescriptionShort = descriptionShort.length > 0;
            const hasCoverImage = Boolean(spot.cover_image_url && spot.cover_image_url.trim().length > 0);
            const quickActions = isVisitedFilter
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
                          label: "Agregar una descripción corta",
                          kind: "edit_description" as const,
                          onPress: () => handleQuickEditDescriptionOpen(spot),
                          accessibilityLabel: `Agregar una descripción corta a ${spot.title}`,
                        },
                      ]
                    : []),
                ]
              : [];
            return (
              <SearchResultCard
                spot={item}
                onPress={() => searchV2.onSelect(item)}
                distanceText={distanceText}
                subtitleOverride={
                  isVisitedFilter ? (hasDescriptionShort ? descriptionShort : null) : undefined
                }
                quickActions={quickActions}
              />
            );
          }
          const place = item as PlaceResult;
          const km = distanceKm(ref.latitude, ref.longitude, place.lat, place.lng);
          const distanceText = formatDistanceKm(km);
          const isLandmark = isPlaceLandmark(place);
          return (
            <ResultRow
              title={place.name}
              subtitle={place.fullName}
              distanceText={distanceText}
              isLandmark={isLandmark}
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
      {quickDescSpot ? (
        <View
          style={[
            styles.quickEditDescOverlay,
            { paddingTop: Math.max(insets.top, 16) + 8 },
          ]}
          pointerEvents="box-none"
        >
          <Pressable
            style={styles.quickEditDescBackdrop}
            onPress={handleQuickEditDescriptionClose}
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
              placeholder={`Agrega una descripción breve para ${quickDescSpot.title}`}
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
              ? (spotId) =>
                  (router.push as (href: string) => void)(`/spot/edit/${spotId}`)
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
          onStateChange={(newState) => {
            if (
              newState === "expanded" &&
              poiTapped != null &&
              selectedSpot == null &&
              !poiSheetLoading
            ) {
              setSheetState("expanded");
              void handleCreateSpotFromPoi(undefined, "expanded");
            } else {
              setSheetState(newState);
            }
          }}
        />
      ) : null}
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
  profileOverlay: {
    position: "absolute",
    left: TOP_OVERLAY_INSET,
    zIndex: EXPLORE_LAYER_Z.TOP_ACTIONS,
  },
  profileTopRow: {
    flexDirection: "column",
    alignItems: "flex-start",
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
  createSpotOverlay: {
    position: "absolute",
    right: CONTROLS_OVERLAY_RIGHT,
    zIndex: EXPLORE_LAYER_Z.TOP_ACTIONS,
  },
  logoutButtonWrap: {
    marginTop: 8,
  },
  logoutButtonFloating: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
  },
  logoutButtonFloatingPressed: {
    opacity: 0.85,
  },
  controlsOverlay: {
    position: "absolute",
    right: CONTROLS_OVERLAY_RIGHT,
    zIndex: EXPLORE_LAYER_Z.MAP_CONTROLS,
  },
  flowyaLabelWrap: {
    position: "absolute",
    zIndex: EXPLORE_LAYER_Z.FLOWYA_LABEL,
    alignSelf: "flex-start",
    padding: 8,
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
