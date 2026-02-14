/**
 * MapScreenVNext — Explorar vNext: MapCore + MapControls + sheet placeholder.
 * Sin Search, SpotCard ni CreateSpot en este PR.
 */

import "@/styles/mapbox-attribution-overrides.css";
import "@/styles/viewport-dvh.css";
import "mapbox-gl/dist/mapbox-gl.css";

import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
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

import { MapControls } from "@/components/design-system/map-controls";
import {
    MapPinFilter,
    type MapPinFilterValue,
} from "@/components/design-system/map-pin-filter";
import type { SpotPinStatus } from "@/components/design-system/map-pins";
import { SearchResultCard } from "@/components/design-system/search-result-card";
import { BottomDock, DOCK_HEIGHT } from "@/components/explorar/BottomDock";
import { MapCoreView } from "@/components/explorar/MapCoreView";
import { SHEET_PEEK_HEIGHT, SpotSheet } from "@/components/explorar/SpotSheet";
import { SearchFloating } from "@/components/search";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { CreateSpotConfirmModal } from "@/components/ui/create-spot-confirm-modal";
import { useToast } from "@/components/ui/toast";
import { AUTH_MODAL_MESSAGES, useAuthModal } from "@/contexts/auth-modal";
import { useSearchControllerV2 } from "@/hooks/search/useSearchControllerV2";
import { useSearchHistory } from "@/hooks/search/useSearchHistory";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useMapCore } from "@/hooks/useMapCore";
import {
    blurActiveElement,
    saveFocusBeforeNavigate,
} from "@/lib/focus-management";
import { distanceKm, getMapsDirectionsUrl } from "@/lib/geo-utils";
import { FALLBACK_VIEW } from "@/lib/map-core/constants";
import {
    getCurrentUserId,
    getPinsForSpots,
    setSaved,
    setVisited,
} from "@/lib/pins";
import { createMapboxGeocodingProvider } from "@/core/shared/search";
import { createSpotsStrategyProvider } from "@/core/shared/search/providers/spotsStrategyProvider";
import { onlyVisible } from "@/core/shared/visibility-softdelete";
import { shareSpot } from "@/lib/share-spot";
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
  const [sheetHeight, setSheetHeight] = useState(SHEET_PEEK_HEIGHT);
  const [showCreateSpotConfirmModal, setShowCreateSpotConfirmModal] =
    useState(false);
  const [pendingCreateSpotCoords, setPendingCreateSpotCoords] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [isPlacingDraftSpot, setIsPlacingDraftSpot] = useState(false);
  const [draftCoverUri, setDraftCoverUri] = useState<string | null>(null);
  const openFromSearchRef = useRef(false);

  useEffect(() => {
    const updateAuth = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setIsAuthUser(!!user && !user.is_anonymous);
    };
    updateAuth();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      updateAuth();
    });
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

  const onLongPressHandlerRef = useRef<
    (coords: { lat: number; lng: number }) => void
  >(() => {});
  const mapCore = useMapCore(selectedSpot, {
    onLongPress: (coords) => onLongPressHandlerRef.current?.(coords),
    skipCenterOnUser: false,
    // CONTRATO map->peek: pan/zoom mapa colapsa sheet a peek (EXPLORE_SHEET §4)
    onUserMapGestureStart: () => setSheetState("peek"),
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
    handleMapPointerDown,
    handleMapPointerMove,
    handleMapPointerUp,
  } = mapCore;

  const filteredSpots = useMemo(() => {
    if (pinFilter === "all") return spots;
    if (pinFilter === "saved") return spots.filter((s) => s.saved);
    return spots.filter((s) => s.visited);
  }, [spots, pinFilter]);

  const pinCounts = useMemo(
    () => ({
      saved: spots.filter((s) => s.saved).length,
      visited: spots.filter((s) => s.visited).length,
    }),
    [spots],
  );

  const displayedSpots = useMemo(() => {
    const base =
      filteredSpots.length > MAP_PIN_CAP
        ? filteredSpots.slice(0, MAP_PIN_CAP)
        : filteredSpots;
    if (selectedSpot?.id.startsWith("draft_")) return [...base, selectedSpot];
    return base;
  }, [filteredSpots, selectedSpot]);

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

  useEffect(() => {
    if (!selectedSpot) return;
    if (selectedSpot.id.startsWith("draft_")) return;
    if (!filteredSpots.some((s) => s.id === selectedSpot.id)) {
      setSelectedSpot(null);
      setSheetState("peek");
      setSheetHeight(SHEET_PEEK_HEIGHT);
    }
  }, [pinFilter, filteredSpots, selectedSpot]);

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

  const geocoding = useMemo(() => createMapboxGeocodingProvider(), []);

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
      if (mapInstance) {
        mapInstance.flyTo({
          center: [spot.longitude, spot.latitude],
          zoom: 15,
          duration: 800,
        });
      }
    });
  }, [mapInstance, searchHistory, searchV2]);

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

  /** Micro-scope 2: "Crear spot nuevo aquí" → draft local (solo si autenticado). Contrato SEARCH_NO_RESULTS_CREATE_CHOOSER. */
  const handleCreateFromNoResults = useCallback(async () => {
    if (!(await requireAuthOrModal(AUTH_MODAL_MESSAGES.createSpot))) return;
    const q = searchV2.query.trim();
    let lat: number;
    let lng: number;
    let title = q || "Nuevo spot";

    const getFallbackCoords = (): { lat: number; lng: number } => {
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
    };

    if (q.length >= 3) {
      try {
        const viewport =
          mapInstance &&
          (() => {
            try {
              const c = mapInstance.getCenter();
              const b = mapInstance.getBounds();
              return {
                center: { lat: c.lat, lng: c.lng },
                zoom,
                bounds: b
                  ? {
                      west: b.getWest(),
                      south: b.getSouth(),
                      east: b.getEast(),
                      north: b.getNorth(),
                    }
                  : undefined,
              };
            } catch {
              return undefined;
            }
          })();

        const resolved = await geocoding.resolvePlaceForCreate({
          query: q,
          viewport: viewport ?? undefined,
        });
        if (resolved) {
          lat = resolved.coords.lat;
          lng = resolved.coords.lng;
          title = resolved.title ?? q;
        } else {
          const fallback = getFallbackCoords();
          lat = fallback.lat;
          lng = fallback.lng;
        }
      } catch {
        const fallback = getFallbackCoords();
        lat = fallback.lat;
        lng = fallback.lng;
      }
    } else {
      const fallback = getFallbackCoords();
      lat = fallback.lat;
      lng = fallback.lng;
    }

    const draft: Spot = {
      id: `draft_${Date.now()}`,
      title,
      description_short: null,
      description_long: null,
      cover_image_url: null,
      address: null,
      latitude: lat,
      longitude: lng,
      saved: false,
      visited: false,
      pinStatus: "default",
    };
    searchV2.setOpen(false);
    setSelectedSpot(draft);
    setSheetState("medium");
    setIsPlacingDraftSpot(true);
  }, [mapInstance, userCoords, searchV2, requireAuthOrModal, geocoding, zoom]);

  /** Micro-scope 3 (tap-to-move): tap en mapa en modo "Ajustar ubicación" mueve el pin al punto tocado. */
  const handleMapClick = useCallback(
    (e: { lngLat: { lat: number; lng: number } }) => {
      if (!isPlacingDraftSpot) return;
      setSelectedSpot((prev) => {
        if (!prev || !prev.id.startsWith("draft_")) return prev;
        const { lngLat } = e;
        if (!lngLat) return prev;
        return { ...prev, latitude: lngLat.lat, longitude: lngLat.lng };
      });
    },
    [isPlacingDraftSpot],
  );

  useEffect(() => {
    searchV2.setOnCreate(handleCreateFromNoResults);
  }, [searchV2, handleCreateFromNoResults]);

  /** Crear spot mínimo desde BORRADOR: insert + cover si hay imagen; luego abrir sheet EXTENDED con el spot creado. */
  const handleCreateSpotFromDraft = useCallback(async () => {
    const draft = selectedSpot;
    if (!draft || !draft.id.startsWith("draft_")) return;
    if (!(await requireAuthOrModal(AUTH_MODAL_MESSAGES.createSpot))) return;
    const insertPayload = {
      title: draft.title?.trim() || "Nuevo spot",
      description_short: null,
      description_long: null,
      latitude: draft.latitude,
      longitude: draft.longitude,
      address: null,
    };
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
    setSelectedSpot(created);
    setSheetState("expanded");
    setIsPlacingDraftSpot(false);
    setDraftCoverUri(null);
    searchV2.setOpen(false);
    refetchSpots();
  }, [
    selectedSpot,
    draftCoverUri,
    requireAuthOrModal,
    refetchSpots,
    searchV2,
    toast,
  ]);

  const SKIP_CREATE_SPOT_CONFIRM_KEY = "flowya_create_spot_skip_confirm";

  const navigateToCreateSpotWithCoords = useCallback(
    (coords: { lat: number; lng: number }) => {
      let query = `lat=${coords.lat}&lng=${coords.lng}`;
      if (mapInstance) {
        try {
          const center = mapInstance.getCenter();
          const mapZoom = mapInstance.getZoom();
          query += `&mapLng=${center.lng}&mapLat=${center.lat}&mapZoom=${mapZoom}`;
          const bearing = mapInstance.getBearing();
          const pitch = mapInstance.getPitch();
          if (bearing !== 0) query += `&mapBearing=${bearing}`;
          if (pitch !== 0) query += `&mapPitch=${pitch}`;
        } catch {
          // ignore
        }
      }
      (router.push as (href: string) => void)(`/create-spot?${query}`);
    },
    [router, mapInstance],
  );

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
        navigateToCreateSpotWithCoords(coords);
      } else {
        setPendingCreateSpotCoords(coords);
        setShowCreateSpotConfirmModal(true);
      }
    },
    [requireAuthOrModal, searchV2, navigateToCreateSpotWithCoords],
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
      navigateToCreateSpotWithCoords(pendingCreateSpotCoords);
      setPendingCreateSpotCoords(null);
      setShowCreateSpotConfirmModal(false);
    },
    [pendingCreateSpotCoords, navigateToCreateSpotWithCoords],
  );

  const handleCreateSpotConfirmCancel = useCallback(() => {
    setPendingCreateSpotCoords(null);
    setShowCreateSpotConfirmModal(false);
  }, []);

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
      const nextState = await setSaved(spot.id, !spot.saved);
      if (nextState) {
        updateSpotPinState(spot.id, nextState);
        toast.show(nextState.saved ? "Guardado" : "Quitado de guardados", {
          type: "success",
        });
      } else {
        updateSpotPinState(spot.id, { saved: false, visited: false });
        toast.show("Quitado de guardados", { type: "success" });
      }
    },
    [toast, openAuthModal, updateSpotPinState],
  );

  const handleMarkVisited = useCallback(
    async (spot: Spot) => {
      if (spot.id.startsWith("draft_")) return;
      const userId = await getCurrentUserId();
      if (!userId) {
        openAuthModal({
          message: AUTH_MODAL_MESSAGES.savePin,
          onSuccess: () => handleMarkVisited(spot),
        });
        return;
      }
      const nextState = await setVisited(spot.id, !spot.visited);
      if (nextState) {
        updateSpotPinState(spot.id, nextState);
        toast.show(nextState.visited ? "Marcado como visitado" : "Desmarcado", {
          type: "success",
        });
      } else {
        updateSpotPinState(spot.id, { saved: false, visited: false });
        toast.show("Desmarcado", { type: "success" });
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
    colorScheme === "dark"
      ? "mapbox://styles/mapbox/dark-v11"
      : "mapbox://styles/mapbox/light-v11";

  const showDock = selectedSpot == null && !searchV2.isOpen;
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
        initialViewState={FALLBACK_VIEW}
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
      <View style={[styles.filterOverlay, { pointerEvents: "box-none" }]}>
        <View style={[styles.filterRowWrap, { pointerEvents: "box-none" }]}>
          <MapPinFilter
            value={pinFilter}
            onChange={setPinFilter}
            counts={pinCounts}
          />
        </View>
      </View>
      {!searchV2.isOpen && sheetState !== "expanded" ? (
        <View
          style={[
            styles.controlsOverlay,
            {
              pointerEvents: "box-none",
              bottom:
                CONTROLS_OVERLAY_BOTTOM +
                (selectedSpot ? sheetHeight : DOCK_HEIGHT + 12),
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
          />
        </View>
      ) : null}
      {selectedSpot == null ? (
        <BottomDock
          onOpenSearch={() => {
            prevSelectedSpotRef.current = selectedSpot;
            prevSheetStateRef.current = sheetState;
            searchV2.setOpen(true);
          }}
          onProfilePress={handleProfilePress}
          isAuthUser={isAuthUser}
          dockVisible={showDock}
          bottomOffset={dockBottomOffset}
          insets={{ bottom: insets.bottom }}
          showLogoutPopover={showLogoutOption && isAuthUser}
          onLogoutPress={handleLogoutPress}
        />
      ) : null}
      {showLogoutOption && isAuthUser && selectedSpot == null ? (
        <Pressable
          style={[StyleSheet.absoluteFill, { zIndex: 11 }]}
          onPress={() => setShowLogoutOption(false)}
          accessibilityLabel="Cerrar"
          accessibilityRole="button"
        />
      ) : null}
      {/* CONTRATO: Search Fullscreen Overlay — overlay cubre todo; zIndex alto; al cerrar llama controller.setOpen(false) */}
      <SearchFloating<Spot>
        controller={searchV2}
        defaultItems={defaultSpots}
        recentQueries={searchHistory.recentQueries}
        recentViewedItems={recentViewedSpots}
        insets={{ top: insets.top, bottom: insets.bottom }}
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
      {/* CONTRATO: Sheet disabled while search open — SpotSheet NO renderiza cuando searchV2.isOpen; al cerrar se restaura sheetState+selectedSpot */}
      {selectedSpot != null && !searchV2.isOpen ? (
        <SpotSheet
          spot={selectedSpot}
          onClose={() => {
            // CONTRATO X dismiss: cierra sheet completamente (selectedSpot=null); no snap a peek
            setSelectedSpot(null);
            setSheetState("peek");
            setSheetHeight(SHEET_PEEK_HEIGHT);
            setIsPlacingDraftSpot(false);
            setDraftCoverUri(null);
          }}
          onOpenDetail={handleSheetOpenDetail}
          state={sheetState}
          onStateChange={setSheetState}
          onSheetHeightChange={setSheetHeight}
          onShare={() => handleShare(selectedSpot)}
          onSavePin={() => handleSavePin(selectedSpot)}
          onMarkVisited={() => handleMarkVisited(selectedSpot)}
          userCoords={userCoords ?? undefined}
          isAuthUser={isAuthUser}
          onDirections={(s) =>
            Linking.openURL(getMapsDirectionsUrl(s.latitude, s.longitude))
          }
          onEdit={(spotId) =>
            (router.push as (href: string) => void)(`/spot/${spotId}?edit=1`)
          }
          isPlacingDraftSpot={isPlacingDraftSpot}
          onConfirmPlacement={() => setIsPlacingDraftSpot(false)}
          onDraftBackToPlacing={() => setIsPlacingDraftSpot(true)}
          draftCoverUri={draftCoverUri}
          onDraftCoverChange={setDraftCoverUri}
          onCreateSpot={handleCreateSpotFromDraft}
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
  controlsOverlay: {
    position: "absolute",
    right: CONTROLS_OVERLAY_RIGHT,
    zIndex: 10,
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
