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
import { SearchResultCard } from "@/components/design-system/search-result-card";
import { TypographyStyles } from "@/components/design-system/typography";
import { CreateSpotNameOverlay } from "@/components/explorar/CreateSpotNameOverlay";
import { MapCoreView } from "@/components/explorar/MapCoreView";
import { SHEET_PEEK_HEIGHT, SpotSheet } from "@/components/explorar/SpotSheet";
import { SearchFloating } from "@/components/search";
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
import {
    blurActiveElement,
    saveFocusBeforeNavigate,
} from "@/lib/focus-management";
import { distanceKm, getMapsDirectionsUrl } from "@/lib/geo-utils";
import { resolveAddress } from "@/lib/mapbox-geocoding";
import { searchPlaces, type PlaceResult } from "@/lib/places/searchPlaces";
import {
    FIT_BOUNDS_DURATION_MS,
    FALLBACK_VIEW,
    FLOWYA_MAP_STYLE_DARK,
    FLOWYA_MAP_STYLE_LIGHT,
    INITIAL_BEARING,
    INITIAL_PITCH,
    SPOT_FOCUS_ZOOM,
    SPOT_POI_MATCH_TOLERANCE_KM,
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
    addRecentViewedSpotId,
    getRecentViewedSpotIds,
} from "@/lib/storage/recentViewedSpots";
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
  /** Derivado de saved/visited para map-pins (visited > saved > default). */
  pinStatus?: SpotPinStatus;
};

const MAPBOX_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_TOKEN ?? "";
const MAP_PIN_CAP = 500;
const SELECTED_PIN_HIT_RADIUS = 24;
const CONTROLS_OVERLAY_BOTTOM = 16;
const CONTROLS_OVERLAY_RIGHT = 16;
const FILTER_OVERLAY_TOP = 16;
const TOP_OVERLAY_INSET = 16;

export function MapScreenVNext() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const { openAuthModal } = useAuthModal();
  const toast = useToast();
  const [spots, setSpots] = useState<Spot[]>([]);
  const [selectedSpot, setSelectedSpot] = useState<Spot | null>(null);
  const [pinFilter, setPinFilter] = useState<MapPinFilterValue>("all");
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
  const [isPlacingDraftSpot, setIsPlacingDraftSpot] = useState(false);
  const [draftCoverUri, setDraftCoverUri] = useState<string | null>(null);
  const [showBetaModal, setShowBetaModal] = useState(false);
  /** 3D debe poder usarse también con estilo FLOWYA (no solo Mapbox Standard). */
  const [is3DEnabled, setIs3DEnabled] = useState(true);
  /** Tap en POI de Mapbox (no spot Flowya): mostrar sheet Agregar spot / Por visitar. */
  const [poiTapped, setPoiTapped] = useState<{
    name: string;
    lat: number;
    lng: number;
  } | null>(null);
  /** Modal duplicado: Ver spot | Crear otro | Cerrar (2 pasos). */
  const [duplicateModal, setDuplicateModal] = useState<{
    existingTitle: string;
    existingSpotId: string;
    onCreateAnyway: () => void | Promise<void>;
  } | null>(null);
  const openFromSearchRef = useRef(false);
  const appliedSpotIdFromParamsRef = useRef<string | null>(null);
  const appliedCreatedIdRef = useRef<string | null>(null);

  const params = useLocalSearchParams<{ spotId?: string; sheet?: string; created?: string }>();

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
        "id, title, description_short, description_long, cover_image_url, address, latitude, longitude",
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
    const base =
      filteredSpots.length > MAP_PIN_CAP
        ? filteredSpots.slice(0, MAP_PIN_CAP)
        : filteredSpots;
    if (selectedSpot?.id.startsWith("draft_")) return [...base, selectedSpot];
    /** POI match: spot puede estar filtrado (ej. Visitados pero spot Por visitar). Incluir selectedSpot para mostrar pin y coherencia sheet↔mapa. */
    if (selectedSpot && !base.some((s) => s.id === selectedSpot.id)) {
      return [...base, selectedSpot];
    }
    return base;
  }, [filteredSpots, selectedSpot, isPlacingDraftSpot]);

  const onLongPressHandlerRef = useRef<
    (coords: { lat: number; lng: number }) => void
  >(() => {});
  const onPinClickHandlerRef = useRef<(spot: Spot) => void>(() => {});
  /** No centrar en usuario cuando volvemos de edit/create; fallback URL evita race con params. */
  const skipCenterOnUser =
    !!(params.spotId || params.created) ||
    (typeof window !== "undefined" && /[?&](spotId|created)=/.test(window.location?.search ?? ""));

  const mapCore = useMapCore(selectedSpot, {
    onLongPress: (coords) => onLongPressHandlerRef.current?.(coords),
    skipCenterOnUser,
    // CONTRATO map->peek: pan/zoom mapa colapsa sheet a peek (EXPLORE_SHEET §4)
    onUserMapGestureStart: () => setSheetState("peek"),
    enableLandmarkLabels: true,
    isDarkStyle: colorScheme === "dark",
    spots: displayedSpots
      .filter((s) => !s.id.startsWith("draft_"))
      .map((s) => ({
        id: s.id,
        title: s.title,
        latitude: s.latitude,
        longitude: s.longitude,
        pinStatus: s.pinStatus,
      })),
    selectedSpotId: selectedSpot?.id ?? null,
    onPinClick: (spot) => onPinClickHandlerRef.current?.(spot),
    is3DEnabled,
  });
  const {
    mapInstance,
    userCoords,
    zoom,
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
  }, [filteredSpots, selectedSpot?.id]);

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
    getFilters: () => pinFilter,
  });

  const searchHistory = useSearchHistory();

  /** Sugerencias Mapbox cuando isNoResults y query >= 3 (para crear spot en lugar con contexto visible). */
  useEffect(() => {
    const q = searchV2.query.trim();
    const isNoResults =
      searchV2.isOpen &&
      q.length >= 3 &&
      searchV2.results.length === 0 &&
      !searchV2.isLoading;
    if (!isNoResults) {
      setPlaceSuggestions([]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        if (!mapInstance) return;
        const c = mapInstance.getCenter();
        const b = mapInstance.getBounds();
        const results = await searchPlaces(q, {
          limit: 6,
          proximity: { lat: c.lat, lng: c.lng },
          bbox: b
            ? {
                west: b.getWest(),
                south: b.getSouth(),
                east: b.getEast(),
                north: b.getNorth(),
              }
            : undefined,
        });
        if (!cancelled) setPlaceSuggestions(results);
      } catch {
        if (!cancelled) setPlaceSuggestions([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [
    searchV2.isOpen,
    searchV2.query,
    searchV2.results.length,
    searchV2.isLoading,
    mapInstance,
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
      setSheetState("medium"); // OL-057: entry from SearchResultCard always opens sheet MEDIUM (no peek)
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
      appliedSpotIdFromParamsRef.current = spotId;
      setPinFilter("all"); // so spot is in filteredSpots and the sync effect doesn't clear selection
      setSelectedSpot(spot);
      setSheetState(targetState); // extended → expanded, medium → medium
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
  }, [params.spotId, params.sheet, router]);

  /** Post-create intake: created=<id> → select spot, open sheet expanded, then clean params. Preserva comportamiento Create Spot original (Explorar + SpotSheet extended). */
  useEffect(() => {
    const createdId = params.created;
    if (!createdId) return;
    if (appliedCreatedIdRef.current === createdId) return;

    const applyCreated = (spot: Spot) => {
      appliedCreatedIdRef.current = createdId;
      setPinFilter("all");
      setSelectedSpot(spot);
      setSheetState("expanded");
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
  }, [params.created, spots, router]);

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
      searchV2.setOpen(false);
      setSelectedSpot(null);
      setPoiTapped({ name: place.name, lat: place.lat, lng: place.lng });
      setSheetState("medium");
      programmaticFlyTo(
        { lng: place.lng, lat: place.lat },
        { zoom: SPOT_FOCUS_ZOOM, duration: FIT_BOUNDS_DURATION_MS }
      );
    },
    [searchV2, programmaticFlyTo],
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
          // CONTRATO SPOT_SHEET_CONTENT_RULES: match en spots (lista completa) para evitar falsos negativos cuando filtro oculta spot
          const match = spots.find(
            (s) => !s.id.startsWith("draft_") && distanceKm(s.latitude, s.longitude, lat, lng) <= SPOT_POI_MATCH_TOLERANCE_KM
          );
          if (match) {
            setSelectedSpot(match);
            setSheetState("medium");
            setPoiTapped(null);
          } else {
            setSelectedSpot(null);
            setPoiTapped({ name: name.trim(), lat, lng });
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

  /** Crear spot desde POI tocado (tap en mapa). asToVisit = también añadir a "Por visitar". targetSheetState = estado del sheet tras crear (por defecto medium). skipDuplicateCheck = cuando usuario confirmó "Crear otro" en modal. */
  const handleCreateSpotFromPoi = useCallback(
    async (
      asToVisit: boolean,
      targetSheetState: "medium" | "expanded" = "medium",
      skipDuplicateCheck = false,
    ) => {
      const poi = poiTapped;
      if (!poi) return;
      if (!(await requireAuthOrModal(AUTH_MODAL_MESSAGES.createSpot))) return;
      setPoiSheetLoading(true);
      if (!skipDuplicateCheck) {
        const duplicateResult = await checkDuplicateSpot(poi.name, poi.lat, poi.lng);
        if (duplicateResult.duplicate) {
          setPoiSheetLoading(false);
          setDuplicateModal({
            existingTitle: duplicateResult.existingTitle,
            existingSpotId: duplicateResult.existingSpotId,
            onCreateAnyway: () => handleCreateSpotFromPoi(asToVisit, targetSheetState, true),
          });
          return;
        }
      }
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
        setPoiSheetLoading(false);
        toast.show(insertError.message ?? "No se pudo crear el spot", { type: "error" });
        return;
      }
      const newId = inserted?.id;
      if (!newId) {
        setPoiSheetLoading(false);
        return;
      }
      if (asToVisit) {
        await setSaved(newId, true);
      }
      const pinMap = await getPinsForSpots([newId]);
      const state = pinMap.get(newId);
      const created: Spot = {
        ...(inserted as Omit<Spot, "saved" | "visited" | "pinStatus">),
        cover_image_url: inserted?.cover_image_url ?? null,
        saved: state?.saved ?? false,
        visited: state?.visited ?? false,
        pinStatus: state?.visited ? "visited" : state?.saved ? "to_visit" : "default",
      };
      setSpots((prev) => (prev.some((s) => s.id === created.id) ? prev : [...prev, created]));
      setSelectedSpot(created);
      setPoiTapped(null);
      setSheetState(targetSheetState);
      refetchSpots();
      setPoiSheetLoading(false);
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
    },
    [poiTapped, requireAuthOrModal, refetchSpots, setDuplicateModal],
  );

  /** Crear spot desde POI y compartir. skipDuplicateCheck = cuando usuario confirmó "Crear otro" en modal. */
  const handleCreateSpotFromPoiAndShare = useCallback(
    async (skipDuplicateCheck = false) => {
      const poi = poiTapped;
      if (!poi) return;
      if (!(await requireAuthOrModal(AUTH_MODAL_MESSAGES.createSpot))) return;
      setPoiSheetLoading(true);
      if (!skipDuplicateCheck) {
        const duplicateResult = await checkDuplicateSpot(poi.name, poi.lat, poi.lng);
        if (duplicateResult.duplicate) {
          setPoiSheetLoading(false);
          setDuplicateModal({
            existingTitle: duplicateResult.existingTitle,
            existingSpotId: duplicateResult.existingSpotId,
            onCreateAnyway: () => handleCreateSpotFromPoiAndShare(true),
          });
          return;
        }
      }
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
    };
    if (user?.id && !user.is_anonymous) {
      insertPayload.user_id = user.id;
    }
    const { data: inserted, error: insertError } = await supabase
      .from("spots")
      .insert(insertPayload)
      .select("id, title")
      .single();
    if (insertError) {
      setPoiSheetLoading(false);
      toast.show(insertError.message ?? "No se pudo crear el spot", { type: "error" });
      return;
    }
    const newId = inserted?.id;
    if (!newId) {
      setPoiSheetLoading(false);
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
      saved: state?.saved ?? false,
      visited: state?.visited ?? false,
      pinStatus: state?.visited ? "visited" : state?.saved ? "to_visit" : "default",
    };
    setSpots((prev) => (prev.some((s) => s.id === created.id) ? prev : [...prev, created]));
    setSelectedSpot(created);
    setPoiTapped(null);
    setPoiSheetLoading(false);
    setSheetState("medium");
    refetchSpots();
  }, [poiTapped, requireAuthOrModal, refetchSpots, toast, setDuplicateModal]);

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
    searchV2.stage === "viewport"
      ? "En esta zona"
      : searchV2.stage === "expanded"
        ? "Cerca de aquí"
        : "En todo el mapa";

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
          updateSpotPinState(spot.id, nextState);
          toast.show(
            newStatus === "to_visit" ? "Por visitar" : "Visitado",
            { type: "success" },
          );
        }
      }
    },
    [toast, openAuthModal, updateSpotPinState],
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
              : poiTapped != null && selectedSpot == null
                ? { lat: poiTapped.lat, lng: poiTapped.lng }
                : null
        }
        previewPinLabel={
          selectedSpot?.id.startsWith("draft_")
            ? selectedSpot.title ?? null
            : createSpotNameOverlayOpen
              ? createSpotNameValue
              : poiTapped != null && selectedSpot == null
                ? poiTapped.name
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
              onChange={setPinFilter}
              counts={pinCounts}
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
            selectedSpot={selectedSpot}
            onReframeSpot={handleReframeSpot}
            onReframeSpotAndUser={handleReframeSpotAndUser}
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
      <SearchFloating<Spot>
        controller={searchV2}
        defaultItems={defaultSpots}
        recentQueries={searchHistory.recentQueries}
        recentViewedItems={recentViewedSpots}
        insets={{ top: insets.top, bottom: insets.bottom }}
        pinFilter={pinFilter}
        pinCounts={pinCounts}
        onPinFilterChange={setPinFilter}
        placeSuggestions={placeSuggestions}
        onCreateFromPlace={handleCreateFromPlace}
        renderItem={(spot) => (
          <SearchResultCard
            spot={spot}
            savePinState={
              spot.pinStatus === "to_visit"
                ? "toVisit"
                : spot.pinStatus === "visited"
                  ? "visited"
                  : "default"
            }
            onPress={() => searchV2.onSelect(spot)}
          />
        )}
        stageLabel={stageLabel}
        scope="explorar"
        getItemKey={(s) => s.id}
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
