import '@/styles/mapbox-attribution-overrides.css';
import '@/styles/viewport-dvh.css';
import 'mapbox-gl/dist/mapbox-gl.css';

import { useFocusEffect, useIsFocused } from '@react-navigation/native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LogOut, Search, User, X } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import { ButtonPrimary } from '@/components/design-system/buttons';
import { MapCoreView } from '@/components/explorar/MapCoreView';
import { IconButton } from '@/components/design-system/icon-button';
import { ImageFullscreenModal } from '@/components/design-system/image-fullscreen-modal';
import { MapControls } from '@/components/design-system/map-controls';
import {
    MapPinFilter,
    type MapPinFilterValue,
} from '@/components/design-system/map-pin-filter';
import type { SpotPinStatus } from '@/components/design-system/map-pins';
import { SearchResultCard } from '@/components/design-system/search-result-card';
import { SpotCard } from '@/components/design-system/spot-card';
import { TypographyStyles } from '@/components/design-system/typography';
import { SearchInputV2, SearchResultsListV2 } from '@/components/search';
import { ConfirmModal } from '@/components/ui/confirm-modal';
import { CreateSpotConfirmModal } from '@/components/ui/create-spot-confirm-modal';
import { FlowyaBetaModal } from '@/components/ui/flowya-beta-modal';
import { useToast } from '@/components/ui/toast';
import { Colors, Radius, Spacing, WebTouchManipulation } from '@/constants/theme';
import { AUTH_MODAL_MESSAGES, useAuthModal } from '@/contexts/auth-modal';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useMapCore } from '@/hooks/useMapCore';
import { useSearchControllerV2 } from '@/hooks/search/useSearchControllerV2';
import { useSearchHistory } from '@/hooks/search/useSearchHistory';
import { blurActiveElement, getAndClearSavedFocus, saveFocusBeforeNavigate } from '@/lib/focus-management';
import { distanceKm } from '@/lib/geo-utils';
import {
  FALLBACK_VIEW,
  FIT_BOUNDS_DURATION_MS,
  SPOT_FOCUS_ZOOM,
} from '@/lib/map-core/constants';
import { resolvePlaceForCreate } from '@/lib/mapbox-geocoding';
import { getCurrentUserId, getPinsForSpotsLegacy, nextPinStatus, removePin, setPinStatus } from '@/lib/pins';
import { createSpotsStrategy } from '@/lib/search/spotsStrategy';
import { shareSpot } from '@/lib/share-spot';
import { addRecentViewedSpotId, getRecentViewedSpotIds } from '@/lib/storage/recentViewedSpots';
import { supabase } from '@/lib/supabase';

type Spot = {
  id: string;
  title: string;
  description_short: string | null;
  cover_image_url: string | null;
  latitude: number;
  longitude: number;
  /** Estado del pin del usuario para este spot (por visitar / visitado). */
  pinStatus?: SpotPinStatus;
};

const MAPBOX_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_TOKEN ?? '';

/** Cap de pins en mapa (guardrail S2: evitar miles de markers). */
const MAP_PIN_CAP = 500;

export function MapScreenV0() {
  const router = useRouter();
  const params = useLocalSearchParams<{ created?: string }>();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [spots, setSpots] = useState<Spot[]>([]);
  const [selectedSpot, setSelectedSpot] = useState<Spot | null>(null);
  const [fullscreenImageUri, setFullscreenImageUri] = useState<string | null>(null);
  const [pinFilter, setPinFilter] = useState<MapPinFilterValue>('all');
  const [isAuthUser, setIsAuthUser] = useState(false);
  const [showLogoutOption, setShowLogoutOption] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showBetaModal, setShowBetaModal] = useState(false);
  const [showCreateSpotConfirmModal, setShowCreateSpotConfirmModal] = useState(false);
  const [pendingCreateSpotCoords, setPendingCreateSpotCoords] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const isFocused = useIsFocused();
  const onLongPressRef = useRef<(coords: { lat: number; lng: number }) => void>(() => {});

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

  const filteredSpots = useMemo(() => {
    if (pinFilter === 'all') return spots;
    if (pinFilter === 'saved') return spots.filter((s) => s.pinStatus === 'to_visit');
    return spots.filter((s) => s.pinStatus === 'visited');
  }, [spots, pinFilter]);

  /** Conteos derivados de spots (sin queries extra). */
  const pinCounts = useMemo(
    () => ({
      saved: spots.filter((s) => s.pinStatus === 'to_visit').length,
      visited: spots.filter((s) => s.pinStatus === 'visited').length,
    }),
    [spots]
  );

  /** Pins a renderizar en mapa (cap para no pintar miles). */
  const displayedSpots = useMemo(
    () => (filteredSpots.length > MAP_PIN_CAP ? filteredSpots.slice(0, MAP_PIN_CAP) : filteredSpots),
    [filteredSpots]
  );
  const showTooManyResultsHint = filteredSpots.length > MAP_PIN_CAP;

  const mapCore = useMapCore(selectedSpot, {
    onLongPress: (coords) => onLongPressRef.current?.(coords),
    skipCenterOnUser: !!params.created,
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

  /** Predeterminado sin texto: 10 spots más cercanos al usuario (o al centro fallback del mapa). */
  const defaultSpots = useMemo(() => {
    const ref = userCoords ?? { latitude: FALLBACK_VIEW.latitude, longitude: FALLBACK_VIEW.longitude };
    return [...filteredSpots]
      .sort(
        (a, b) =>
          distanceKm(ref.latitude, ref.longitude, a.latitude, a.longitude) -
          distanceKm(ref.latitude, ref.longitude, b.latitude, b.longitude)
      )
      .slice(0, 10);
  }, [filteredSpots, userCoords]);

  /** Search V2: strategy viewport → expanded → global + limit + cursor. */
  const spotsStrategyV2 = useMemo(
    () =>
      createSpotsStrategy({
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
    [filteredSpots, mapInstance, zoom]
  );

  const searchV2 = useSearchControllerV2<Spot>({
    mode: 'spots',
    isToggleable: true,
    defaultOpen: false,
    strategy: spotsStrategyV2 as import('@/hooks/search/useSearchControllerV2').SearchStrategy<Spot>,
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

  /** Vistos recientemente: spots abiertos desde search (orden por id reciente). */
  const recentViewedSpots = useMemo(() => {
    const ids = getRecentViewedSpotIds();
    return ids
      .map((id) => spots.find((s) => s.id === id))
      .filter((s): s is Spot => s != null);
  }, [spots]);

  useEffect(() => {
    if (
      selectedSpot &&
      !filteredSpots.some((s) => s.id === selectedSpot.id)
    ) {
      setSelectedSpot(null);
    }
  }, [pinFilter, filteredSpots, selectedSpot]);

  const refetchSpots = useCallback(async () => {
    const { data } = await supabase
      .from('spots')
      .select('id, title, description_short, cover_image_url, latitude, longitude')
      .eq('is_hidden', false);
    const list = (data ?? []) as Spot[];
    const pinMap = await getPinsForSpotsLegacy(list.map((s) => s.id));
    const withPins = list.map((s) => ({
      ...s,
      pinStatus: pinMap.get(s.id),
    }));
    setSpots(withPins);
    return withPins;
  }, []);

  useFocusEffect(
    useCallback(() => {
      const el = getAndClearSavedFocus();
      if (el?.focus) {
        requestAnimationFrame(() => el.focus());
      }
      refetchSpots();
      return () => {};
    }, [refetchSpots])
  );

  /** Al volver a esta pestaña (p. ej. desde Editar Spot), forzar resize del mapa para que ocupe todo el alto. */
  useFocusEffect(
    useCallback(() => {
      if (!mapInstance) return;
      const id = requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          try {
            mapInstance.resize();
          } catch {
            // ignore si el mapa ya fue destruido
          }
        });
      });
      return () => cancelAnimationFrame(id);
    }, [mapInstance])
  );

  useEffect(() => {
    const node = mapRootRef.current as unknown as HTMLElement | null;
    if (typeof document === 'undefined' || !node) return;
    if (isFocused) node.removeAttribute('inert');
    else node.setAttribute('inert', '');
  }, [isFocused, mapRootRef]);

  useEffect(() => {
    const createdId = params.created;
    if (!createdId) return;
    let cancelled = false;
    (async () => {
      const data = await refetchSpots();
      if (cancelled) return;
      const spot = (data as Spot[] | null)?.find((s) => s.id === createdId);
      if (spot) setSelectedSpot(spot);
      if (mapInstance && spot) {
        mapInstance.flyTo({
          center: [spot.longitude, spot.latitude],
          zoom: SPOT_FOCUS_ZOOM,
          duration: FIT_BOUNDS_DURATION_MS,
        });
        router.replace('/(tabs)' as const);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [params.created, refetchSpots, router, mapInstance]);

  /** Cuando volvemos con created y el mapa se monta después: encuadrar al spot creado y limpiar param. */
  useEffect(() => {
    const createdId = params.created;
    if (!createdId || !mapInstance || !selectedSpot || selectedSpot.id !== createdId) return;
    mapInstance.flyTo({
      center: [selectedSpot.longitude, selectedSpot.latitude],
      zoom: SPOT_FOCUS_ZOOM,
      duration: FIT_BOUNDS_DURATION_MS,
    });
    router.replace('/(tabs)' as const);
  }, [params.created, mapInstance, selectedSpot, router]);

  const toast = useToast();
  const { openAuthModal } = useAuthModal();
  const handleShare = useCallback(
    async (spot: Spot) => {
      const result = await shareSpot(spot.id, spot.title);
      if (result.copied) toast.show('Link copiado', { type: 'success' });
    },
    [toast]
  );
  const handleProfilePress = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user || user.is_anonymous) {
      openAuthModal({ message: AUTH_MODAL_MESSAGES.profile });
    } else {
      setShowLogoutOption((prev) => !prev);
    }
  }, [openAuthModal]);

  const handleLogoutPress = useCallback(() => {
    setShowLogoutConfirm(true);
  }, []);

  const handleLogoutConfirm = useCallback(async () => {
    setShowLogoutConfirm(false);
    setShowLogoutOption(false);
    await supabase.auth.signOut();
  }, []);
  /** Tap en pin: si ya está seleccionado → ir a spot detail; si no → seleccionar y mostrar card. */
  const handlePinClick = useCallback(
    (spot: Spot) => {
      if (selectedSpot?.id === spot.id) {
        saveFocusBeforeNavigate();
        blurActiveElement();
        (router.push as (href: string) => void)(`/spot/${spot.id}`);
      } else {
        setSelectedSpot(spot);
      }
    },
    [selectedSpot?.id, router]
  );

  /** Tap en el pin ya seleccionado (hit area sobre el mapa) → ir a spot detail. */
  const handleSelectedPinTap = useCallback(() => {
    if (!selectedSpot) return;
    saveFocusBeforeNavigate();
    blurActiveElement();
    (router.push as (href: string) => void)(`/spot/${selectedSpot.id}`);
  }, [selectedSpot, router]);

  const navigateToCreateSpotFromSearch = useCallback(
    async (
      place: { name: string; latitude: number; longitude: number } | null,
      fallbackName?: string
    ) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || user.is_anonymous) {
        openAuthModal({ message: AUTH_MODAL_MESSAGES.profile });
        return;
      }
      setSelectedSpot(null);
      searchV2.setOpen(false);
      blurActiveElement();
      if (place) {
        const params = new URLSearchParams({
          name: place.name,
          lat: String(place.latitude),
          lng: String(place.longitude),
          source: 'search',
        });
        (router.push as (href: string) => void)(`/create-spot?${params.toString()}`);
      } else {
        const params = new URLSearchParams({ source: 'search' });
        if (fallbackName?.trim()) params.set('name', fallbackName.trim());
        (router.push as (href: string) => void)(`/create-spot?${params.toString()}`);
      }
    },
    [router, searchV2, openAuthModal]
  );

  /** CTA Crear: resuelve lugar con Mapbox forward (solo para coords de creación); luego navega con o sin coords. */
  const handleCreateFromSearch = useCallback(async () => {
    const q = searchV2.query.trim();
    let place: { name: string; latitude: number; longitude: number } | null = null;
    if (q.length >= 3) {
      const proximity =
        userCoords
          ? { lat: userCoords.latitude, lng: userCoords.longitude }
          : mapInstance
            ? (() => {
                try {
                  const c = mapInstance.getCenter();
                  return { lat: c.lat, lng: c.lng };
                } catch {
                  return undefined;
                }
              })()
            : undefined;
      const bbox = mapInstance
        ? (() => {
            try {
              const b = mapInstance.getBounds();
              if (!b) return undefined;
              return {
                west: b.getWest(),
                south: b.getSouth(),
                east: b.getEast(),
                north: b.getNorth(),
              };
            } catch {
              return undefined;
            }
          })()
        : undefined;
      place = await resolvePlaceForCreate(q, proximity ? { proximity } : bbox ? { bbox } : undefined);
    }
    navigateToCreateSpotFromSearch(place, place ? undefined : q || undefined);
  }, [searchV2.query, userCoords, mapInstance, navigateToCreateSpotFromSearch]);

  /** Search V2: callbacks onSelect / onCreate. */
  useEffect(() => {
    searchV2.setOnSelect((spot: Spot) => {
      searchV2.setOpen(false);
      setSelectedSpot(spot);
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
    searchV2.setOnCreate(() => {
      handleCreateFromSearch();
    });
  }, [searchV2, handleCreateFromSearch]);

  const SKIP_CREATE_SPOT_CONFIRM_KEY = 'flowya_create_spot_skip_confirm';

  const navigateToCreateSpot = useCallback(
    async (coords: { lat: number; lng: number }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || user.is_anonymous) {
        openAuthModal({ message: AUTH_MODAL_MESSAGES.profile });
        return;
      }
      let query = `lat=${coords.lat}&lng=${coords.lng}`;
      if (mapInstance) {
        const center = mapInstance.getCenter();
        const zoom = mapInstance.getZoom();
        const bearing = mapInstance.getBearing();
        const pitch = mapInstance.getPitch();
        query += `&mapLng=${center.lng}&mapLat=${center.lat}&mapZoom=${zoom}`;
        if (bearing !== 0) query += `&mapBearing=${bearing}`;
        if (pitch !== 0) query += `&mapPitch=${pitch}`;
      }
      (router.push as (href: string) => void)(`/create-spot?${query}`);
    },
    [router, mapInstance, openAuthModal]
  );

  const handleMapLongPress = useCallback(
    (coords: { lat: number; lng: number }) => {
      setSelectedSpot(null);
      searchV2.setOpen(false);
      blurActiveElement();
      const skipConfirm =
        typeof localStorage !== 'undefined' &&
        localStorage.getItem(SKIP_CREATE_SPOT_CONFIRM_KEY) === 'true';
      if (skipConfirm) {
        navigateToCreateSpot(coords);
      } else {
        setPendingCreateSpotCoords(coords);
        setShowCreateSpotConfirmModal(true);
      }
    },
    [navigateToCreateSpot, searchV2]
  );

  useEffect(() => {
    onLongPressRef.current = handleMapLongPress;
  }, [handleMapLongPress]);

  const handleCreateSpotConfirm = useCallback(
    (dontShowAgain: boolean) => {
      if (pendingCreateSpotCoords === null) return;
      if (dontShowAgain && typeof localStorage !== 'undefined') {
        localStorage.setItem(SKIP_CREATE_SPOT_CONFIRM_KEY, 'true');
      }
      navigateToCreateSpot(pendingCreateSpotCoords);
      setPendingCreateSpotCoords(null);
      setShowCreateSpotConfirmModal(false);
    },
    [pendingCreateSpotCoords, navigateToCreateSpot]
  );

  const handleCreateSpotConfirmCancel = useCallback(() => {
    setPendingCreateSpotCoords(null);
    setShowCreateSpotConfirmModal(false);
  }, []);

  const handleSavePin = useCallback(
    async (spot: Spot) => {
      const current =
        spot.pinStatus === 'to_visit' || spot.pinStatus === 'visited' ? spot.pinStatus : null;
      if (current === 'visited') {
        const ok = await removePin(spot.id);
        if (ok) {
          setSpots((prev) =>
            prev.map((s) => (s.id === spot.id ? { ...s, pinStatus: undefined } : s))
          );
          setSelectedSpot((prev) =>
            prev?.id === spot.id ? (prev ? { ...prev, pinStatus: undefined } : null) : prev
          );
          toast.show('Pin quitado', { type: 'success' });
        }
      } else {
        const userId = await getCurrentUserId();
        if (!userId) {
          openAuthModal({
            message: AUTH_MODAL_MESSAGES.savePin,
            onSuccess: () => handleSavePin(spot),
          });
          return;
        }
        const next = nextPinStatus(current);
        const newStatus = await setPinStatus(spot.id, next);
        if (newStatus !== null) {
          setSpots((prev) =>
            prev.map((s) => (s.id === spot.id ? { ...s, pinStatus: newStatus } : s))
          );
          setSelectedSpot((prev) =>
            prev?.id === spot.id ? (prev ? { ...prev, pinStatus: newStatus } : null) : prev
          );
          toast.show(newStatus === 'to_visit' ? 'Por visitar' : 'Visitado', { type: 'success' });
        }
      }
    },
    [toast, openAuthModal]
  );

  if (!MAPBOX_TOKEN) {
    return (
      <View style={[styles.mapScreenRoot, styles.placeholder]}>
        <Text style={styles.placeholderText}>Set EXPO_PUBLIC_MAPBOX_TOKEN for the map.</Text>
      </View>
    );
  }

  const mapStyle =
    colorScheme === 'dark' ? 'mapbox://styles/mapbox/dark-v11' : 'mapbox://styles/mapbox/light-v11';

  const searchOverlayVisible = searchV2.isOpen;

  const stageLabel =
    searchV2.stage === 'viewport'
      ? 'En esta zona'
      : searchV2.stage === 'expanded'
        ? 'Cerca de aquí'
        : 'En todo el mapa';

  return (
    <View
      ref={mapRootRef}
      style={styles.mapScreenRoot}
      {...(Platform.OS === 'web' && { className: 'map-screen-root-dvh' })}
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
      />
      {selectedSpot && !searchOverlayVisible ? (
        <>
          {selectedPinScreenPos ? (
            <Pressable
              style={[
                styles.selectedPinHitArea,
                {
                  left: Math.round(selectedPinScreenPos.x) - SELECTED_PIN_HIT_RADIUS,
                  top: Math.round(selectedPinScreenPos.y) - SELECTED_PIN_HIT_RADIUS,
                },
              ]}
              onPress={handleSelectedPinTap}
              accessibilityLabel={`Ir al detalle de ${selectedSpot.title}`}
              accessibilityRole="button"
            />
          ) : null}
          <View
            style={[styles.cardOverlay, { pointerEvents: 'box-none' }]}
          >
            <SpotCard
              spot={selectedSpot}
              savePinState={
                selectedSpot.pinStatus === 'to_visit'
                  ? 'toVisit'
                  : selectedSpot.pinStatus === 'visited'
                    ? 'visited'
                    : 'default'
              }
              onSavePin={() => handleSavePin(selectedSpot)}
              onShare={() => handleShare(selectedSpot)}
              onClose={() => setSelectedSpot(null)}
            />
          </View>
        </>
      ) : null}
      <Pressable
        style={[styles.flowyaLabelWrap, WebTouchManipulation]}
        onPress={() => setShowBetaModal(true)}
        accessibilityLabel="FLOWYA Beta"
      >
        {({ pressed }) => (
          <Text
            style={[
              TypographyStyles.heading2,
              { color: colors.text, opacity: pressed ? 0.7 : 1 },
            ]}
          >
            FLOWYA
          </Text>
        )}
      </Pressable>
      <View
        style={[
          styles.filterOverlay,
          searchOverlayVisible && styles.filterOverlaySearchActive,
          { pointerEvents: 'box-none' },
        ]}
      >
        <View style={[styles.filterRowWrap, { pointerEvents: 'box-none' }]}>
          <MapPinFilter value={pinFilter} onChange={setPinFilter} counts={pinCounts} />
        </View>
        {searchOverlayVisible ? (
          <>
            <Pressable
              style={[
                StyleSheet.absoluteFill,
                styles.searchBackdropLayer,
                {
                  backgroundColor:
                    colorScheme === 'dark' ? 'rgba(0,0,0,0.55)' : 'rgba(255,255,255,0.72)',
                  pointerEvents: 'auto',
                },
              ]}
              onPress={() => searchV2.setOpen(false)}
            />
            <View style={[styles.searchPanelLayer, { pointerEvents: 'box-none' }]}>
            <View style={styles.searchInputWrap}>
              <SearchInputV2
                value={searchV2.query}
                onChangeText={searchV2.setQuery}
                onClear={searchV2.clear}
                placeholder="Buscar lugares…"
                autoFocus
              />
            </View>
            <View style={styles.searchResultsArea}>
              {(() => {
                const q = searchV2.query.trim();
                const len = q.length;
                const isEmpty = len === 0;
                const isPreSearch = len > 0 && len < 3;
                const isSearch = len >= 3;

                if (isEmpty) {
                  return (
                    <ScrollView
                      style={styles.searchResultsScroll}
                      contentContainerStyle={styles.searchResultsContent}
                      keyboardShouldPersistTaps="handled"
                      showsVerticalScrollIndicator
                    >
                      <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>Cercanos</Text>
                      {defaultSpots.length > 0 ? (
                        defaultSpots.map((spot) => (
                          <View key={spot.id} style={styles.searchResultItemWrap}>
                            <SearchResultCard
                              spot={spot}
                              savePinState={
                                spot.pinStatus === 'to_visit'
                                  ? 'toVisit'
                                  : spot.pinStatus === 'visited'
                                    ? 'visited'
                                    : 'default'
                              }
                              onPress={() => searchV2.onSelect(spot)}
                            />
                          </View>
                        ))
                      ) : (
                        <Text style={[styles.searchNoResultsText, { color: colors.textSecondary }]}>
                          No hay spots cercanos. Mantén pulsado el mapa para crear uno.
                        </Text>
                      )}
                    </ScrollView>
                  );
                }

                if (isPreSearch) {
                  return (
                    <ScrollView
                      style={styles.searchResultsScroll}
                      contentContainerStyle={styles.searchResultsContent}
                      keyboardShouldPersistTaps="handled"
                      showsVerticalScrollIndicator
                    >
                      <View style={styles.searchResultItemWrap}>
                        <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>
                          Búsquedas recientes
                        </Text>
                        {searchHistory.recentQueries.length > 0 ? (
                          searchHistory.recentQueries.slice(0, 5).map((queryItem) => (
                            <Pressable
                              key={queryItem}
                              style={styles.historyItem}
                              onPress={() => searchV2.setQuery(queryItem)}
                            >
                              <Text style={{ color: colors.text }}>{queryItem}</Text>
                            </Pressable>
                          ))
                        ) : (
                          <Text style={[styles.searchNoResultsText, { color: colors.textSecondary }]}>
                            No hay búsquedas recientes
                          </Text>
                        )}
                      </View>
                      <View style={styles.searchResultItemWrap}>
                        <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>
                          Vistos recientemente
                        </Text>
                        {recentViewedSpots.length > 0 ? (
                          recentViewedSpots.slice(0, 10).map((spot) => (
                            <Pressable
                              key={spot.id}
                              style={({ pressed }) => [
                                styles.historyItem,
                                { backgroundColor: pressed ? colors.borderSubtle : 'transparent' },
                              ]}
                              onPress={() => searchV2.onSelect(spot)}
                            >
                              <Text style={{ color: colors.text }}>{spot.title}</Text>
                            </Pressable>
                          ))
                        ) : (
                          <Text style={[styles.searchNoResultsText, { color: colors.textSecondary }]}>
                            No hay spots vistos recientemente
                          </Text>
                        )}
                      </View>
                    </ScrollView>
                  );
                }

                if (isSearch && searchV2.results.length > 0) {
                  return (
                    <>
                      <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>{stageLabel}</Text>
                      <SearchResultsListV2
                        sections={[]}
                        results={searchV2.results}
                        renderItem={(spot) => (
                          <SearchResultCard
                            spot={spot}
                            savePinState={
                              spot.pinStatus === 'to_visit'
                                ? 'toVisit'
                                : spot.pinStatus === 'visited'
                                  ? 'visited'
                                  : 'default'
                            }
                            onPress={() => searchV2.onSelect(spot)}
                          />
                        )}
                        onEndReached={searchV2.fetchMore}
                        hasMore={searchV2.hasMore}
                        isLoading={searchV2.isLoading}
                      />
                    </>
                  );
                }
                return (
                  <>
                    {searchV2.suggestions.length > 0 ? (
                      <View style={styles.suggestionsSection}>
                        <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>
                          Sugerencias
                        </Text>
                        {searchV2.suggestions.map((s) => (
                          <Pressable
                            key={s}
                            style={({ pressed }) => [
                              styles.suggestionRow,
                              { backgroundColor: pressed ? colors.borderSubtle : 'transparent' },
                            ]}
                            onPress={() => searchV2.onSuggestionTap(s)}
                            accessibilityLabel={`Buscar: ${s}`}
                            accessibilityRole="button"
                          >
                            <Text style={{ color: colors.text, fontSize: 16 }}>{s}</Text>
                          </Pressable>
                        ))}
                      </View>
                    ) : null}
                    <View style={styles.searchNoResults}>
                      <ButtonPrimary
                        onPress={() => searchV2.onCreate()}
                        accessibilityLabel={
                          searchV2.query.trim()
                            ? `Crear "${searchV2.query.trim()}"`
                            : 'Crear nuevo spot'
                        }
                      >
                        {searchV2.query.trim()
                          ? `Crear "${searchV2.query.trim()}"`
                          : 'Crear nuevo spot'}
                      </ButtonPrimary>
                    </View>
                  </>
                );
              })()}
            </View>
            </View>
          </>
        ) : null}
      </View>
      {!searchOverlayVisible ? (
        <View
          style={[styles.profileButtonOverlay, { pointerEvents: 'box-none' }]}
        >
        <IconButton
          variant="default"
          onPress={handleProfilePress}
          accessibilityLabel="Cuenta"
        >
          <User
            size={24}
            color={isAuthUser ? colors.primary : colors.text}
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
              <LogOut size={24} color={colors.stateError} strokeWidth={2} />
            </Pressable>
          </View>
        ) : null}
        </View>
      ) : null}
      {!searchOverlayVisible ? (
        <View
          style={[styles.controlsOverlay, { pointerEvents: 'box-none' }]}
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
      <ImageFullscreenModal
        visible={!!fullscreenImageUri}
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
      <FlowyaBetaModal
        visible={showBetaModal}
        onClose={() => setShowBetaModal(false)}
      />
      <CreateSpotConfirmModal
        visible={showCreateSpotConfirmModal}
        onConfirm={handleCreateSpotConfirm}
        onCancel={handleCreateSpotConfirmCancel}
      />
      <View style={styles.fabWrap}>
        {searchOverlayVisible ? (
          <Pressable
            style={({ pressed }) => [
              styles.fabSearchClose,
              { backgroundColor: colors.primary },
              pressed && styles.fabSearchClosePressed,
            ]}
            onPress={() => searchV2.setOpen(false)}
            accessibilityLabel="Cerrar búsqueda"
            accessibilityRole="button"
          >
            <X size={24} color="#fff" strokeWidth={2} />
          </Pressable>
        ) : (
          <IconButton
            variant="default"
            onPress={() => searchV2.setOpen(true)}
            accessibilityLabel="Buscar"
          >
            <Search size={24} color={colors.text} strokeWidth={2} />
          </IconButton>
        )}
      </View>
      {showTooManyResultsHint && !searchOverlayVisible ? (
        <View style={[styles.tooManyHint, { backgroundColor: colors.backgroundElevated }]}>
          <Text style={[styles.tooManyHintText, { color: colors.textSecondary }]}>
            Hay demasiados resultados, acerca el zoom para verlos.
          </Text>
        </View>
      ) : null}
    </View>
  );
}

/** Tab bar oculta: sin inset inferior; controles y card cerca del borde. */
const CARD_OVERLAY_BOTTOM = 16;
const CARD_OVERLAY_LEFT = 16;
const CARD_OVERLAY_RIGHT = 16;
/** Espacio reservado a la derecha para que la Spot Card no tape los controles del mapa. */
const CONTROLS_COLUMN_WIDTH = 56;
const CARD_RIGHT_INSET = CARD_OVERLAY_RIGHT + CONTROLS_COLUMN_WIDTH;
const CONTROLS_OVERLAY_BOTTOM = 16;
const CONTROLS_OVERLAY_RIGHT = 16;
const FILTER_OVERLAY_TOP = 16;
const PROFILE_BUTTON_TOP = 16;
const PROFILE_BUTTON_LEFT = 16;
const FAB_TOP = 16;
const FAB_RIGHT = 16;
const FLOWYA_LABEL_BOTTOM = 16;
const FLOWYA_LABEL_LEFT = 16;
const SEARCH_PANEL_PADDING = 16;
/** Radio del hit area del pin seleccionado (tap → spot detail). */
const SELECTED_PIN_HIT_RADIUS = 24;

const styles = StyleSheet.create({
  mapScreenRoot: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    ...Platform.select({
      web: {
        width: '100%',
        /* height / maxHeight / overflow vía clase .map-screen-root-dvh (100dvh + fallback 100vh) */
      },
      default: {},
    }),
  },
  map: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  selectedPinHitArea: {
    position: 'absolute',
    width: SELECTED_PIN_HIT_RADIUS * 2,
    height: SELECTED_PIN_HIT_RADIUS * 2,
    zIndex: 10,
    backgroundColor: 'transparent',
  },
  cardOverlay: {
    position: 'absolute',
    left: CARD_OVERLAY_LEFT,
    right: CARD_RIGHT_INSET,
    bottom: CARD_OVERLAY_BOTTOM,
    zIndex: 10,
  },
  filterOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: FILTER_OVERLAY_TOP,
    alignItems: 'center',
    zIndex: 10,
  },
  /** Filtros por encima del backdrop cuando search está abierto (zIndex 20, backdrop 10). */
  filterRowWrap: {
    position: 'relative',
    zIndex: 20,
    ...Platform.select({ android: { elevation: 4 } }),
  },
  /** Backdrop full-screen sobre el mapa; tap cierra search. Debajo de filtros y panel. */
  searchBackdropLayer: {
    zIndex: 10,
  },
  /** Input + lista + CTA; encima del backdrop, debajo de filtros para que filtros sean clicables. */
  searchPanelLayer: {
    position: 'relative',
    zIndex: 15,
    flex: 1,
    minHeight: 0,
  },
  /** Modo búsqueda: overlay a pantalla completa para que el listado use 100% del alto disponible. */
  filterOverlaySearchActive: {
    top: 0,
    bottom: 0,
    alignItems: 'stretch',
    flexDirection: 'column',
    paddingTop: FILTER_OVERLAY_TOP,
    paddingHorizontal: SEARCH_PANEL_PADDING,
  },
  searchInputWrap: {
    position: 'relative',
    marginTop: Spacing.sm,
  },
  searchResultsArea: {
    flex: 1,
    minHeight: 0,
    marginTop: Spacing.sm,
  },
  searchResultsScroll: {
    flex: 1,
  },
  searchResultsContent: {
    paddingBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  searchResultItemWrap: {
    width: '100%',
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  historyItem: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.base,
  },
  suggestionsSection: {
    marginBottom: Spacing.base,
  },
  suggestionRow: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.base,
    borderRadius: Radius.sm,
  },
  searchNoResults: {
    marginTop: Spacing.base,
    alignItems: 'center',
    gap: Spacing.base,
  },
  searchNoResultsText: {
    fontSize: 15,
    textAlign: 'center',
  },
  profileButtonOverlay: {
    position: 'absolute',
    top: PROFILE_BUTTON_TOP,
    left: PROFILE_BUTTON_LEFT,
    zIndex: 11,
  },
  logoutButtonWrap: {
    marginTop: 8,
  },
  logoutButtonFloating: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutButtonFloatingPressed: {
    opacity: 0.85,
  },
  controlsOverlay: {
    position: 'absolute',
    right: CONTROLS_OVERLAY_RIGHT,
    bottom: CONTROLS_OVERLAY_BOTTOM,
    zIndex: 10,
  },
  fabWrap: {
    position: 'absolute',
    top: FAB_TOP,
    right: FAB_RIGHT,
    zIndex: 10,
    flexDirection: 'column',
    gap: Spacing.xs,
  },
  fabSearchClose: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabSearchClosePressed: {
    opacity: 0.85,
  },
  flowyaLabelWrap: {
    position: 'absolute',
    left: FLOWYA_LABEL_LEFT,
    bottom: FLOWYA_LABEL_BOTTOM,
    zIndex: 5,
    alignSelf: 'flex-start',
    padding: 8,
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#eee',
  },
  placeholderText: {
    color: '#333',
    fontSize: 14,
  },
  tooManyHint: {
    position: 'absolute',
    left: SEARCH_PANEL_PADDING,
    right: SEARCH_PANEL_PADDING,
    bottom: CONTROLS_OVERLAY_BOTTOM + 60,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.base,
    borderRadius: Radius.md,
    alignSelf: 'center',
    maxWidth: 320,
    zIndex: 9,
  },
  tooManyHintText: {
    fontSize: 13,
    textAlign: 'center',
  },
});
