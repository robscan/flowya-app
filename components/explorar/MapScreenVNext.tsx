/**
 * MapScreenVNext — Explorar vNext: MapCore + MapControls + sheet placeholder.
 * Sin Search, SpotCard ni CreateSpot en este PR.
 */

import "@/styles/mapbox-attribution-overrides.css";
import "@/styles/viewport-dvh.css";
import "mapbox-gl/dist/mapbox-gl.css";

import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { LogOut, MapPinPlus, Search, User } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    Linking,
    Platform,
    Pressable,
    StyleSheet,
    Text,
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
import { MapCoreView } from "@/components/explorar/MapCoreView";
import { SHEET_PEEK_HEIGHT, SpotSheet } from "@/components/explorar/SpotSheet";
import { SearchFloating } from "@/components/search";
import type { SearchSection } from "@/components/search";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { DuplicateSpotModal } from "@/components/ui/duplicate-spot-modal";
import { FlowyaBetaModal } from "@/components/ui/flowya-beta-modal";
import { CreateSpotConfirmModal } from "@/components/ui/create-spot-confirm-modal";
import { useToast } from "@/components/ui/toast";
import { AUTH_MODAL_MESSAGES, useAuthModal } from "@/contexts/auth-modal";
import { useSearchControllerV2 } from "@/hooks/search/useSearchControllerV2";
import { useSearchHistory } from "@/hooks/search/useSearchHistory";
import { Colors, Spacing, WebTouchManipulation } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useMapCore } from "@/hooks/useMapCore";
import { featureFlags } from "@/lib/feature-flags";
import {
    blurActiveElement,
    saveFocusBeforeNavigate,
} from "@/lib/focus-management";
import { distanceKm, getMapsDirectionsUrl } from "@/lib/geo-utils";
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
} from "@/lib/map-core/constants";
import {
    getCurrentUserId,
    getPinsForSpots,
    nextPinStatus,
    removePin,
    setPinStatus,
    setSaved,
} from "@/lib/pins";
import { createSpotsStrategyProvider } from "@/core/shared/search/providers/spotsStrategyProvider";
import { onlyVisible } from "@/core/shared/visibility-softdelete";
import { shareSpot } from "@/lib/share-spot";
import { checkDuplicateSpot } from "@/lib/spot-duplicate-check";
import { optimizeSpotImage } from "@/lib/spot-image-optimize";
import { uploadSpotCover } from "@/lib/spot-image-upload";
import {
  recordCreateFromSearchResult,
  recordExternalFetchMetric,
  recordSearchExternalClick,
  recordSearchNoResults,
  recordSearchSpotClick,
  recordSearchStarted,
} from "@/lib/search/metrics";
import { SPOT_LINK_VERSION } from "@/lib/spot-linking/resolveSpotLink";
import {
    addRecentViewedSpotId,
    getRecentViewedSpotIds,
} from "@/lib/storage/recentViewedSpots";
import {
  getMapPinPendingBadges,
  setMapPinPendingBadges,
} from "@/lib/storage/mapPinPendingBadges";
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

type TappedMapFeatureKind = "poi" | "landmark";
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

function classifyTappedFeatureKind(
  layerId?: string,
  props?: Record<string, unknown> | null,
): TappedMapFeatureKind {
  const id = (layerId ?? "").toLowerCase();
  if (id.includes("landmark")) return "landmark";

  const cls =
    typeof props?.class === "string"
      ? props.class.toLowerCase()
      : typeof props?.category === "string"
        ? props.category.toLowerCase()
        : "";
  if (cls.includes("landmark")) return "landmark";
  return "poi";
}

function getTappedFeatureId(
  featureId: unknown,
  props?: Record<string, unknown> | null,
): string | null {
  const candidates: unknown[] = [
    featureId,
    props?.mapbox_id,
    props?.place_id,
    props?.id,
    props?.feature_id,
  ];
  for (const value of candidates) {
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
  }
  return null;
}

function getTappedFeatureMaki(props?: Record<string, unknown> | null): string | null {
  const candidates: unknown[] = [props?.maki, props?.icon];
  for (const value of candidates) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
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

function resolveTappedSpotMatch(
  spots: Spot[],
  tapped: { lat: number; lng: number; name: string; placeId: string | null },
): Spot | null {
  const stableSpots = spots.filter((s) => !s.id.startsWith("draft_"));

  if (tapped.placeId) {
    const linkedById = stableSpots.find(
      (s) =>
        s.link_status === "linked" &&
        typeof s.linked_place_id === "string" &&
        s.linked_place_id === tapped.placeId,
    );
    if (linkedById) return linkedById;
  }

  const linkedByDistance = stableSpots.find(
    (s) =>
      s.link_status === "linked" &&
      distanceKm(s.latitude, s.longitude, tapped.lat, tapped.lng) <=
        LINKED_TAP_FALLBACK_TOLERANCE_KM,
  );
  if (linkedByDistance) return linkedByDistance;

  const tappedName = normalizeText(tapped.name);
  const closestSemantic = stableSpots
    .map((s) => ({
      spot: s,
      km: distanceKm(s.latitude, s.longitude, tapped.lat, tapped.lng),
      sameName: normalizeText(s.title) === tappedName,
    }))
    .filter(({ km, sameName }) => sameName && km <= 0.03)
    .sort((a, b) => a.km - b.km)[0];
  if (closestSemantic) return closestSemantic.spot;

  return null;
}

const MAPBOX_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_TOKEN ?? "";
const MAP_PIN_CAP = 500;
const SELECTED_PIN_HIT_RADIUS = 24;
const LINKED_TAP_FALLBACK_TOLERANCE_KM = 0.012;
const CONTROLS_OVERLAY_BOTTOM = 16;
const CONTROLS_OVERLAY_RIGHT = 16;
const FILTER_OVERLAY_TOP = 16;
const TOP_OVERLAY_INSET = 16;

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

const TOURISM_KEYWORDS = [
  "museum",
  "monument",
  "historic",
  "landmark",
  "gallery",
  "castle",
  "church",
  "cathedral",
  "park",
  "theatre",
  "theater",
];

const TOURISM_MAKI_HINTS = [
  "museum",
  "monument",
  "castle",
  "theatre",
  "theater",
  "park",
];

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

const COUNTRY_MIN_COVERAGE_RATIO = 0.4;
const NON_COUNTRY_ADDRESS_TOKENS = new Set([
  "centro",
  "downtown",
  "unknown",
  "sin direccion",
  "sin dirección",
  "n/a",
  "na",
]);

function extractCountryFromAddress(address: string | null | undefined): string | null {
  if (!address) return null;
  const parts = address
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length === 0) return null;
  const raw = parts[parts.length - 1];
  const normalized = normalizeText(raw);
  if (!normalized) return null;
  if (NON_COUNTRY_ADDRESS_TOKENS.has(normalized)) return null;
  if (/\d/.test(normalized)) return null;
  if (normalized.length < 2) return null;
  return raw;
}

function computeCountriesCountForSpots(spots: Spot[]): number | null {
  if (spots.length === 0) return 0;
  const countries = spots
    .map((spot) => extractCountryFromAddress(spot.address))
    .filter((value): value is string => Boolean(value));
  if (countries.length === 0) return null;
  const coverage = countries.length / spots.length;
  if (coverage < COUNTRY_MIN_COVERAGE_RATIO) return null;
  return new Set(countries.map((country) => normalizeText(country))).size;
}

function dedupeExternalPlacesAgainstSpots(
  places: PlaceResult[],
  spots: Spot[],
): PlaceResult[] {
  return places.filter((place) => {
    const placeName = normalizeText(place.name);
    return !spots.some((spot) => {
      if (!spot || spot.id.startsWith("draft_")) return false;
      const byLinkedId =
        spot.linked_place_id != null &&
        spot.linked_place_id.length > 0 &&
        spot.linked_place_id === place.id;
      if (byLinkedId) return true;
      const closeEnough =
        distanceKm(spot.latitude, spot.longitude, place.lat, place.lng) <= 0.02;
      if (!closeEnough) return false;
      const spotName = normalizeText(spot.title ?? "");
      return spotName.length > 0 && placeName.length > 0 && spotName === placeName;
    });
  });
}

function inferExternalIntent(place: PlaceResult): "poi_landmark" | "poi" | "place" | "address" {
  const featureType = normalizeText(place.featureType ?? "");
  const maki = normalizeText(place.maki ?? "");
  const categories = (place.categories ?? []).map((item) => normalizeText(item));
  const bag = `${featureType} ${maki} ${categories.join(" ")}`.trim();
  const hasTourismSignal =
    TOURISM_KEYWORDS.some((keyword) => bag.includes(keyword)) ||
    TOURISM_MAKI_HINTS.some((hint) => maki.includes(hint));
  if (hasTourismSignal || featureType.includes("landmark")) return "poi_landmark";
  if (featureType.includes("poi") || maki.length > 0 || categories.length > 0) return "poi";
  if (featureType.includes("address") || featureType.includes("street")) return "address";
  if (
    featureType.includes("place") ||
    featureType.includes("locality") ||
    featureType.includes("district") ||
    featureType.includes("neighborhood") ||
    featureType.includes("postcode") ||
    featureType.includes("region") ||
    featureType.includes("country")
  ) {
    return "place";
  }
  return "place";
}

const COMMERCIAL_KEYWORDS = [
  "tour",
  "tours",
  "ferry",
  "restaurant",
  "hotel",
  "bar",
  "cafe",
  "snorkel",
  "buggy",
  "rental",
  "rent",
  "shop",
  "store",
  "taxi",
  "agency",
  "terminal",
];

const NON_GEO_QUERY_HINTS = [
  "hotel",
  "restaurante",
  "restaurant",
  "bar",
  "cafe",
  "cafeteria",
  "tour",
  "ferry",
  "taxi",
  "museo",
  "museum",
  "playa",
  "beach",
];

function isGeoIntentQuery(query: string): boolean {
  const q = normalizeText(query);
  if (!q) return false;
  const parts = q.split(/\s+/).filter(Boolean);
  if (parts.length > 3) return false;
  if (NON_GEO_QUERY_HINTS.some((hint) => q.includes(hint))) return false;
  return true;
}

function isCommercialSuggestion(place: PlaceResult): boolean {
  const bag = normalizeText(
    `${place.name} ${place.fullName ?? ""} ${place.featureType ?? ""} ${(place.categories ?? []).join(" ")}`,
  );
  return COMMERCIAL_KEYWORDS.some((keyword) => bag.includes(keyword));
}

function rankExternalPlacesByIntent(items: PlaceResult[], query: string): PlaceResult[] {
  const normalizedQuery = normalizeText(query);
  const geoQuery = isGeoIntentQuery(query);
  const hasExactPlace = items.some((item) => {
    const intent = inferExternalIntent(item);
    return intent === "place" && normalizeText(item.name) === normalizedQuery;
  });

  const scoreForIntent = (intent: ReturnType<typeof inferExternalIntent>): number => {
    if (intent === "poi_landmark") return 0;
    if (intent === "place") return 1;
    if (intent === "poi") return 2;
    return 3;
  };

  const ranked = items
    .map((item, idx) => {
      const intent = inferExternalIntent(item);
      let score = scoreForIntent(intent);
      const normalizedName = normalizeText(item.name);
      const exactNameMatch = normalizedName === normalizedQuery;

      if (geoQuery && intent === "place" && exactNameMatch) score -= 2;
      if (intent === "poi" && isCommercialSuggestion(item)) score += geoQuery ? 4 : 2;
      if (geoQuery && intent === "address") score += 2;

      return { item, idx, score };
    })
    .sort((a, b) => (a.score === b.score ? a.idx - b.idx : a.score - b.score))
    .map(({ item }) => item);

  if (geoQuery && hasExactPlace) {
    return ranked.filter((item) => {
      const intent = inferExternalIntent(item);
      if (intent === "place") return true;
      if (intent === "poi_landmark") return true;
      return !isCommercialSuggestion(item);
    });
  }
  return ranked;
}

function getStablePlaceId(place: PlaceResult): string | null {
  const id = place.id?.trim();
  if (!id) return null;
  // IDs sintéticos ("place-<i>-<lng>-<lat>") no deben persistirse como link.
  if (id.startsWith("place-")) return null;
  return id;
}

function inferTappedKindFromPlace(place: PlaceResult): TappedMapFeatureKind {
  return inferExternalIntent(place) === "poi_landmark" ? "landmark" : "poi";
}

/** OL-WOW-F2-001-SEARCH: merge spots + places en lista unificada ordenada por atractivo/interés. */
function mergeSearchResults(
  spots: Spot[],
  places: PlaceResult[],
  query: string,
): (Spot | PlaceResult)[] {
  const deduped = dedupeExternalPlacesAgainstSpots(places, spots);
  const rankedPlaces = rankExternalPlacesByIntent(deduped, query);

  type Entry = { item: Spot | PlaceResult; score: number };
  const entries: Entry[] = [];

  // Spots: pinStatus primero, luego por índice
  spots.forEach((spot, idx) => {
    const hasPin = spot.pinStatus === "to_visit" || spot.pinStatus === "visited";
    const base = hasPin ? 0 : 60;
    entries.push({ item: spot, score: base + idx * 0.001 });
  });

  // Places: poi_landmark > place > poi; comercial penalizado
  rankedPlaces.forEach((place, idx) => {
    const intent = inferExternalIntent(place);
    const commercial = isCommercialSuggestion(place);
    let base = 40;
    if (intent === "poi_landmark") base = 10;
    else if (intent === "place") base = 20;
    else if (intent === "poi") base = commercial ? 50 : 30;
    entries.push({ item: place, score: base + idx * 0.001 });
  });

  return entries.sort((a, b) => a.score - b.score).map((e) => e.item);
}

export function MapScreenVNext() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const { openAuthModal } = useAuthModal();
  const toast = useToast();
  const [spots, setSpots] = useState<Spot[]>([]);
  const [selectedSpot, setSelectedSpot] = useState<Spot | null>(null);
  const [pinFilter, setPinFilter] = useState<MapPinFilterValue>("all");
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
  const [sheetState, setSheetState] = useState<"peek" | "medium" | "expanded">(
    "peek",
  );

  const prevSpotIdsRef = useRef<Set<string>>(new Set());
  const prevSelectedSpotRef = useRef<Spot | null>(null);
  const prevSheetStateRef = useRef<"peek" | "medium" | "expanded">("peek");
  const prevPinFilterRef = useRef<MapPinFilterValue>(pinFilter);
  const lastStatusSpotIdRef = useRef<{
    saved: string | null;
    visited: string | null;
  }>({
    saved: null,
    visited: null,
  });
  const searchFilterRefreshRef = useRef<MapPinFilterValue>(pinFilter);
  const lastSearchStartKeyRef = useRef<string | null>(null);
  const lastNoResultsKeyRef = useRef<string | null>(null);
  const [sheetHeight, setSheetHeight] = useState(SHEET_PEEK_HEIGHT);
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
  /** 3D debe poder usarse también con estilo FLOWYA (no solo Mapbox Standard). */
  const [is3DEnabled, setIs3DEnabled] = useState(true);
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
  }, [selectedSpot]);

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

  const displayedSpots = useMemo(() => {
    if (isPlacingDraftSpot && selectedSpot?.id.startsWith("draft_")) {
      return [selectedSpot];
    }
    const canHideLinkedUnsaved =
      featureFlags.hideLinkedUnsaved && featureFlags.mapLandmarkLabels;
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
    onUserMapGestureStart: () => setSheetState("peek"),
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
    handleToggle3D,
    programmaticFlyTo,
    handleMapPointerDown,
    handleMapPointerMove,
    handleMapPointerUp,
  } = mapCore;
  const queueDeepLinkFocus = useCallback(
    (spot: Spot) => {
      const payload = { id: spot.id, lng: spot.longitude, lat: spot.latitude };
      pendingDeepLinkFocusRef.current = payload;
      if (!mapInstance) return;
      programmaticFlyTo(
        { lng: payload.lng, lat: payload.lat },
        { zoom: SPOT_FOCUS_ZOOM, duration: FIT_BOUNDS_DURATION_MS },
      );
      pendingDeepLinkFocusRef.current = null;
    },
    [mapInstance, programmaticFlyTo],
  );

  useEffect(() => {
    if (!mapInstance) return;
    const pending = pendingDeepLinkFocusRef.current;
    if (!pending) return;
    programmaticFlyTo(
      { lng: pending.lng, lat: pending.lat },
      { zoom: SPOT_FOCUS_ZOOM, duration: FIT_BOUNDS_DURATION_MS },
    );
    pendingDeepLinkFocusRef.current = null;
  }, [mapInstance, programmaticFlyTo]);

  const contextualSelection = useMemo<{ id: string } | null>(() => {
    if (selectedSpot) return { id: selectedSpot.id };
    if (!poiTapped) return null;
    return { id: `poi:${poiTapped.placeId ?? `${poiTapped.lat.toFixed(5)},${poiTapped.lng.toFixed(5)}`}` };
  }, [selectedSpot, poiTapped]);

  const handleReframeContextual = useCallback(() => {
    if (selectedSpot) {
      handleReframeSpot();
      return;
    }
    if (!poiTapped) return;
    programmaticFlyTo(
      { lng: poiTapped.lng, lat: poiTapped.lat },
      { zoom: SPOT_FOCUS_ZOOM, duration: FIT_BOUNDS_DURATION_MS },
    );
  }, [selectedSpot, handleReframeSpot, poiTapped, programmaticFlyTo]);

  const handleReframeContextualAndUser = useCallback(() => {
    if (selectedSpot) {
      handleReframeSpotAndUser();
      return;
    }
    if (!poiTapped) return;
    if (mapInstance && userCoords) {
      try {
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
  ]);

  const handleToggle3DPress = useCallback(() => {
    const next = !is3DEnabled;
    setIs3DEnabled(next);
    handleToggle3D(next);
  }, [is3DEnabled, handleToggle3D]);

  const pinCounts = useMemo(
    () => ({
      saved: spots.filter((s) => s.saved).length,
      visited: spots.filter((s) => s.visited).length,
    }),
    [spots],
  );

  const countriesCountByFilter = useMemo(() => {
    const toVisitSpots = spots.filter((s) => s.pinStatus === "to_visit");
    const visitedSpots = spots.filter((s) => s.pinStatus === "visited");
    return {
      saved: computeCountriesCountForSpots(toVisitSpots),
      visited: computeCountriesCountForSpots(visitedSpots),
    };
  }, [spots]);

  const countriesCountForActiveFilter = useMemo(() => {
    if (pinFilter === "saved") return countriesCountByFilter.saved;
    if (pinFilter === "visited") return countriesCountByFilter.visited;
    return null;
  }, [pinFilter, countriesCountByFilter.saved, countriesCountByFilter.visited]);

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
      const pendingForTarget =
        nextFilter !== "all" ? pendingFilterBadges[nextFilter] : false;
      const pendingSpotId =
        nextFilter === "saved" || nextFilter === "visited"
          ? lastStatusSpotIdRef.current[nextFilter]
          : null;
      setPinFilter(nextFilter);
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
          programmaticFlyTo(
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
      spots,
      programmaticFlyTo,
      updatePendingFilterBadges,
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
    if (prevPinFilterRef.current === pinFilter) return;
    prevPinFilterRef.current = pinFilter;
    if (!selectedSpot) return;
    if (selectedSpot.id.startsWith("draft_")) return;
    if (!filteredSpots.some((s) => s.id === selectedSpot.id)) {
      setSelectedSpot(null);
      setSheetState("peek");
      setSheetHeight(SHEET_PEEK_HEIGHT);
    }
  }, [pinFilter, filteredSpots, selectedSpot]);

  // Sincronizar selectedSpot con versión fresca de filteredSpots (ej. tras refetch o edición)
  useEffect(() => {
    if (!selectedSpot?.id) return;
    const fresh = filteredSpots.find((s) => s.id === selectedSpot.id);
    if (fresh && fresh !== selectedSpot) {
      setSelectedSpot(fresh);
    }
  }, [filteredSpots, selectedSpot]);

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
    if (pinFilter !== "all") return defaultSpotsForEmpty;
    return mergeSearchResults(defaultSpotsForEmpty, nearbyPlacesEmpty, "");
  }, [pinFilter, defaultSpotsForEmpty, nearbyPlacesEmpty]);

  /** isEmpty con saved/visited: dos grupos "Spots en la zona" (radio fijo) y "Spots en el mapa", ordenados por distancia. */
  const defaultSectionsForEmpty = useMemo<SearchSection<Spot | PlaceResult>[]>(() => {
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
  }, [pinFilter, mapInstance, filteredSpots, userCoords]);

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
    }
    if (!searchV2.isLoading && searchV2.results.length === 0) {
      if (lastNoResultsKeyRef.current !== q) {
        lastNoResultsKeyRef.current = q;
        recordSearchNoResults();
      }
    }
  }, [searchV2.isOpen, searchV2.query, searchV2.isLoading, searchV2.results.length]);

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
      setSheetState("medium"); // OL-057: entry from SearchResultCard always opens sheet MEDIUM (no peek)
      recordSearchSpotClick();
      addRecentViewedSpotId(spot.id);
      searchHistory.addCompletedQuery(searchV2.query);
      programmaticFlyTo(
        { lng: spot.longitude, lat: spot.latitude },
        { zoom: SPOT_FOCUS_ZOOM, duration: FIT_BOUNDS_DURATION_MS },
      );
    });
  }, [programmaticFlyTo, searchHistory, searchV2]);

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
  }, [selectedSpot]);

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
  }, [params.spotId, params.sheet, router, queueDeepLinkFocus]);

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
  }, [params.created, spots, router, queueDeepLinkFocus]);

  /** Encuadrar cámara en spot cuando volvemos de edit (spotId) o create (created). Usa programmaticFlyTo para no colapsar el sheet. */
  useEffect(() => {
    const deepLinkSpotId = params.spotId ?? params.created;
    if (!deepLinkSpotId || !mapInstance || !selectedSpot || selectedSpot.id !== deepLinkSpotId)
      return;
    programmaticFlyTo(
      { lng: selectedSpot.longitude, lat: selectedSpot.latitude },
      { zoom: SPOT_FOCUS_ZOOM, duration: FIT_BOUNDS_DURATION_MS }
    );
  }, [params.spotId, params.created, mapInstance, selectedSpot, programmaticFlyTo]);

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
    [searchV2],
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
        setSelectedSpot(existingSpot);
        setPoiTapped(null);
        setSheetState("medium");
        programmaticFlyTo(
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
      setSheetState("medium");
      programmaticFlyTo(
        { lng: place.lng, lat: place.lat },
        { zoom: SPOT_FOCUS_ZOOM, duration: FIT_BOUNDS_DURATION_MS }
      );
    },
    [searchV2, spots, programmaticFlyTo],
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
            setSelectedSpot(match);
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
            setSheetState("medium");
          }
          return;
        }
      } catch {
        /* ignore query errors */
      }
    },
    [isPlacingDraftSpot, mapInstance, spots],
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
      toast.show(insertError.message ?? "No se pudo crear el spot", { type: "error" });
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
    [selectedSpot, draftCoverUri, requireAuthOrModal, refetchSpots, searchV2, toast, setDuplicateModal],
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
      asToVisit: boolean,
      targetSheetState: "medium" | "expanded" = "medium",
    ) => {
      const poi = poiTapped;
      if (!poi) return;
      const shouldTrackCreateFromSearch = poi.source === "search_suggestion";
      let didAttemptPersist = false;
      if (!(await requireAuthOrModal(AUTH_MODAL_MESSAGES.createSpot))) return;
      let created = false;
      if (asToVisit) {
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
          toast.show(insertError.message ?? "No se pudo crear el spot", { type: "error" });
          return;
        }
        const newId = inserted?.id;
        if (!newId) {
          if (shouldTrackCreateFromSearch) recordCreateFromSearchResult(false);
          toast.show("No se pudo guardar el lugar. Intenta de nuevo.", { type: "error" });
          return;
        }
        if (asToVisit) {
          const savedState = await setSaved(newId, true);
          if (savedState == null) {
            toast.show("Se creó el lugar, pero no se pudo marcar como Por visitar. Intenta de nuevo.", {
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
        toast.show("No se pudo guardar el lugar. Intenta de nuevo.", { type: "error" });
      } finally {
        setPoiSheetLoading(false);
        if (asToVisit && !created) {
          resetPoiTappedVisualState(poi);
        }
      }
    },
    [poiTapped, requireAuthOrModal, refetchSpots, resetPoiTappedVisualState, toast],
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
          toast.show(insertError.message ?? "No se pudo crear el spot", { type: "error" });
          return;
        }
        const newId = inserted?.id;
        if (!newId) {
          toast.show("No se pudo guardar el lugar. Intenta de nuevo.", { type: "error" });
          return;
        }
        const result = await shareSpot(newId, poi.name);
        if (result.copied) toast.show("Link copiado", { type: "success" });
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
        toast.show("No se pudo guardar el lugar. Intenta de nuevo.", { type: "error" });
      } finally {
        setPoiSheetLoading(false);
      }
  }, [poiTapped, requireAuthOrModal, refetchSpots, toast]);

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
        programmaticFlyTo(
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
        programmaticFlyTo(
          { lng: spot.longitude, lat: spot.latitude },
          { zoom: SPOT_FOCUS_ZOOM, duration: 600 },
        );
      })();
    },
    [spots, programmaticFlyTo],
  );

  const SKIP_CREATE_SPOT_CONFIRM_KEY = "flowya_create_spot_skip_confirm";

  /** Paso 0: CTA (+) abre overlay "Nombre del spot"; al confirmar → draft. */
  const handleOpenCreateSpot = useCallback(async () => {
    if (!(await requireAuthOrModal(AUTH_MODAL_MESSAGES.createSpot))) return;
    blurActiveElement();
    setCreateSpotPendingCoords(getFallbackCoords());
    setCreateSpotInitialName(undefined);
    setCreateSpotNameOverlayOpen(true);
  }, [requireAuthOrModal, getFallbackCoords]);

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
    if (wasOpen && !searchV2.isOpen) {
      const prev = prevSelectedSpotRef.current;
      if (prev != null && selectedSpot === null) {
        setSelectedSpot(prev);
        setSheetState(prevSheetStateRef.current);
      }
      prevSelectedSpotRef.current = null;
    }
  }, [searchV2.isOpen, selectedSpot]);

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
    pinFilter === "visited"
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
  /** OL-WOW-F2-001-SEARCH: pinFilter=all → merge spots+places; saved/visited → solo spots con reorden viewport. */
  const searchDisplayResults = useMemo<(Spot | PlaceResult)[]>(() => {
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
  }, [pinFilter, searchV2.results, searchV2.query, placeSuggestions, mapInstance, viewportNonce]);
  const searchResultSections = useMemo<SearchSection<Spot>[]>(() => {
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
  }, [pinFilter, searchDisplayResults, mapInstance, viewportNonce]);

  /** Guardrail Search V2: al cambiar filtro saved/visited/all, re-ejecutar query activa para evitar resultados stale cross-filter. */
  useEffect(() => {
    if (searchFilterRefreshRef.current === pinFilter) return;
    searchFilterRefreshRef.current = pinFilter;
    if (!searchIsOpen) return;
    const q = searchQuery.trim();
    if (q.length < 3) return;
    setSearchQuery(searchQuery);
  }, [pinFilter, searchIsOpen, searchQuery, setSearchQuery]);

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
        setSelectedSpot(spot);
        setSheetState("medium");
      }
    },
    [selectedSpot?.id, setSheetState],
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
    saveFocusBeforeNavigate();
    blurActiveElement();
    (router.push as (href: string) => void)(`/spot/${selectedSpot.id}`);
  }, [selectedSpot, router]);

  const handleProfilePress = useCallback(async () => {
    if (!(await requireAuthOrModal(AUTH_MODAL_MESSAGES.profile))) return;
    setShowLogoutOption((prev) => !prev);
  }, [requireAuthOrModal]);

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
      if (result.copied) toast.show("Link copiado", { type: "success" });
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
    async (spot: Spot) => {
      if (spot.id.startsWith("draft_")) return;
      const userId = await getCurrentUserId();
      if (!userId) {
        openAuthModal({
          message: AUTH_MODAL_MESSAGES.savePin,
          onSuccess: () => handleSavePin(spot),
        });
        return;
      }
      const current =
        spot.pinStatus === "to_visit" || spot.pinStatus === "visited"
          ? spot.pinStatus
          : null;
      if (current === "visited") {
        const ok = await removePin(spot.id);
        if (ok) {
          if (lastStatusSpotIdRef.current.saved === spot.id) {
            lastStatusSpotIdRef.current.saved = null;
          }
          if (lastStatusSpotIdRef.current.visited === spot.id) {
            lastStatusSpotIdRef.current.visited = null;
          }
          updatePendingFilterBadges((prev) => ({ ...prev, visited: false }));
          updateSpotPinState(spot.id, { saved: false, visited: false });
          toast.show("Pin quitado", { type: "success" });
        }
      } else {
        const next = nextPinStatus(current);
        const newStatus = await setPinStatus(spot.id, next);
        if (newStatus) {
          const nextState =
            newStatus === "to_visit"
              ? { saved: true, visited: false }
              : { saved: false, visited: true };
          const destinationFilter: Exclude<MapPinFilterValue, "all"> =
            newStatus === "to_visit" ? "saved" : "visited";
          lastStatusSpotIdRef.current[destinationFilter] = spot.id;
          if (destinationFilter === "visited") {
            // Al subir de "Por visitar" a "Visitado", ya no es candidato del filtro saved.
            if (lastStatusSpotIdRef.current.saved === spot.id) {
              lastStatusSpotIdRef.current.saved = null;
            }
          }
          if (pinFilter === "all") {
            updatePendingFilterBadges((prev) => ({
              ...prev,
              [destinationFilter]: true,
            }));
          } else if (pinFilter !== destinationFilter) {
            // Caso puntual de transición entre filtros:
            // no hacer zoom-out global; mantener continuidad enfocando el spot mutado.
            setPinFilter(destinationFilter);
            if (mapInstance) {
              programmaticFlyTo(
                { lng: spot.longitude, lat: spot.latitude },
                { zoom: SPOT_FOCUS_ZOOM, duration: FIT_BOUNDS_DURATION_MS },
              );
            }
          } else if (pinFilter === destinationFilter) {
            setPinFilterPulseNonce((n) => n + 1);
          }
          updateSpotPinState(spot.id, nextState);
          setSheetState("medium");
          toast.show(
            newStatus === "to_visit" ? "Por visitar" : "Visitado",
            { type: "success" },
          );
        }
      }
    },
    [
      toast,
      openAuthModal,
      updateSpotPinState,
      pinFilter,
      mapInstance,
      programmaticFlyTo,
      updatePendingFilterBadges,
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

  const dockBottomOffset = 12;
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
        onLoad={onMapLoad}
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
      {!createSpotNameOverlayOpen && !searchV2.isOpen ? (
        <View style={[styles.filterOverlay, { top: FILTER_OVERLAY_TOP + insets.top, pointerEvents: "box-none" }]}>
          <View style={[styles.filterRowWrap, { pointerEvents: "box-none" }]}>
            <MapPinFilter
              value={pinFilter}
              onChange={(next) => handlePinFilterChange(next, { reframe: true })}
              counts={pinCounts}
              pendingValues={pendingFilterBadges}
              pulseNonce={pinFilterPulseNonce}
            />
          </View>
        </View>
      ) : null}
      {!createSpotNameOverlayOpen && !searchV2.isOpen ? (
        <View
          style={[
            styles.profileOverlay,
            {
              top: TOP_OVERLAY_INSET + insets.top,
              left: TOP_OVERLAY_INSET + insets.left,
            },
            { pointerEvents: "box-none" },
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
      {!createSpotNameOverlayOpen &&
      !searchV2.isOpen &&
      isAuthUser &&
      (pinFilter === "saved" || pinFilter === "visited") ? (
        <View
          style={[
            styles.countriesOverlay,
            { left: TOP_OVERLAY_INSET + insets.left },
          ]}
          pointerEvents="none"
        >
          <View
            style={[
              styles.countriesCircle,
              {
                backgroundColor:
                  colorScheme === "dark"
                    ? "rgba(29,29,31,0.78)"
                    : "rgba(255,255,255,0.78)",
                borderColor: Colors[colorScheme ?? "light"].borderSubtle,
              },
            ]}
          >
            <Text
              style={[
                styles.countriesValue,
                {
                  color:
                    pinFilter === "saved"
                      ? Colors[colorScheme ?? "light"].stateToVisit
                      : Colors[colorScheme ?? "light"].stateSuccess,
                },
              ]}
            >
              {countriesCountForActiveFilter == null ? "—" : String(countriesCountForActiveFilter)}
            </Text>
            <Text style={[styles.countriesLabel, { color: Colors[colorScheme ?? "light"].textSecondary }]}>
              Países
            </Text>
          </View>
        </View>
      ) : null}
      {!createSpotNameOverlayOpen && !searchV2.isOpen ? (
        <View
          style={[
            styles.createSpotOverlay,
            {
              top: TOP_OVERLAY_INSET + insets.top,
              right: CONTROLS_OVERLAY_RIGHT + insets.right,
            },
            { pointerEvents: "box-none" },
          ]}
        >
          <IconButton
            variant="default"
            onPress={() => {
              prevSelectedSpotRef.current = selectedSpot;
              prevSheetStateRef.current = sheetState;
              searchV2.setOpen(true);
            }}
            accessibilityLabel="Buscar spots"
          >
            <Search size={24} color={Colors[colorScheme ?? "light"].text} strokeWidth={2} />
          </IconButton>
        </View>
      ) : null}
      {!createSpotNameOverlayOpen && !searchV2.isOpen && sheetState !== "expanded" ? (
        <View
          style={[
            styles.controlsOverlay,
            {
              pointerEvents: "box-none",
              right: CONTROLS_OVERLAY_RIGHT + insets.right,
              bottom: (selectedSpot != null || poiTapped != null)
                ? CONTROLS_OVERLAY_BOTTOM + sheetHeight
                : dockBottomOffset + insets.bottom,
              flexDirection: "column",
              gap: Spacing.sm,
            },
          ]}
        >
          <MapControls
            map={mapInstance}
            onLocate={handleLocate}
            selectedSpot={contextualSelection}
            onReframeSpot={handleReframeContextual}
            onReframeSpotAndUser={handleReframeContextualAndUser}
            hasUserLocation={userCoords != null}
            onViewWorld={handleViewWorld}
            activeMapControl={activeMapControl}
            show3DToggle
            is3DEnabled={is3DEnabled}
            onToggle3D={handleToggle3DPress}
          />
          {selectedSpot == null && poiTapped == null ? (
            <IconButton
              variant="default"
              onPress={handleOpenCreateSpot}
              accessibilityLabel="Crear spot"
            >
              <MapPinPlus size={24} color={Colors[colorScheme ?? "light"].text} strokeWidth={2} />
            </IconButton>
          ) : null}
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
        resultsOverride={searchDisplayResults}
        resultSections={searchResultSections}
        placeSuggestions={pinFilter === "all" ? [] : placeSuggestions}
        onCreateFromPlace={handleCreateFromPlace}
        activitySummary={{
          isVisible: false,
          visitedPlacesCount: pinCounts.visited,
          pendingPlacesCount: pinCounts.saved,
          visitedCountriesCount: countriesCountByFilter.visited,
          isLoading: false,
        }}
        renderItem={(item: Spot | PlaceResult) => {
          if ("title" in item && "latitude" in item) {
            return (
              <SearchResultCard
                spot={item}
                onPress={() => searchV2.onSelect(item)}
              />
            );
          }
          return (
            <ResultRow
              title={(item as PlaceResult).name}
              subtitle={(item as PlaceResult).fullName}
              onPress={() => handleCreateFromPlace(item as PlaceResult)}
              accessibilityLabel={`Ver: ${(item as PlaceResult).name}`}
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
      {/* CONTRATO: Sheet disabled while search open; ocultar cuando flujo de creación (CreateSpotNameOverlay) activo */}
      {(selectedSpot != null || poiTapped != null) &&
      !searchV2.isOpen &&
      !createSpotNameOverlayOpen ? (
        <SpotSheet
          spot={selectedSpot}
          poi={poiTapped}
          onClose={() => {
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
          onSavePin={selectedSpot ? () => handleSavePin(selectedSpot) : undefined}
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
          onPoiPorVisitar={() => handleCreateSpotFromPoi(true)}
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
              void handleCreateSpotFromPoi(false, "expanded");
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
    zIndex: 10,
  },
  filterRowWrap: {
    position: "relative",
    zIndex: 20,
    ...Platform.select({ android: { elevation: 4 } }),
  },
  profileOverlay: {
    position: "absolute",
    left: TOP_OVERLAY_INSET,
    zIndex: 12,
  },
  profileTopRow: {
    flexDirection: "column",
    alignItems: "flex-start",
  },
  countriesOverlay: {
    position: "absolute",
    top: "50%",
    transform: [{ translateY: -32 }],
    zIndex: 6,
  },
  createSpotOverlay: {
    position: "absolute",
    right: CONTROLS_OVERLAY_RIGHT,
    zIndex: 11,
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
    zIndex: 10,
  },
  flowyaLabelWrap: {
    position: "absolute",
    zIndex: 5,
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
