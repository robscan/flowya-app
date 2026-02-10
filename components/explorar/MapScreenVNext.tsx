/**
 * MapScreenVNext — Explorar vNext: MapCore + MapControls + sheet placeholder.
 * Sin Search, SpotCard ni CreateSpot en este PR.
 */

import '@/styles/mapbox-attribution-overrides.css';
import '@/styles/viewport-dvh.css';
import 'mapbox-gl/dist/mapbox-gl.css';

import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BottomDock, DOCK_HEIGHT } from '@/components/explorar/BottomDock';
import { MapCoreView } from '@/components/explorar/MapCoreView';
import { SHEET_PEEK_HEIGHT, SpotSheet } from '@/components/explorar/SpotSheet';
import { MapControls } from '@/components/design-system/map-controls';
import {
  MapPinFilter,
  type MapPinFilterValue,
} from '@/components/design-system/map-pin-filter';
import type { SpotPinStatus } from '@/components/design-system/map-pins';
import { SearchResultCard } from '@/components/design-system/search-result-card';
import { SearchFloating } from '@/components/search';
import { ConfirmModal } from '@/components/ui/confirm-modal';
import { CreateSpotConfirmModal } from '@/components/ui/create-spot-confirm-modal';
import { AUTH_MODAL_MESSAGES, useAuthModal } from '@/contexts/auth-modal';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useMapCore } from '@/hooks/useMapCore';
import { useSearchControllerV2 } from '@/hooks/search/useSearchControllerV2';
import { useSearchHistory } from '@/hooks/search/useSearchHistory';
import { blurActiveElement, saveFocusBeforeNavigate } from '@/lib/focus-management';
import { distanceKm, getMapsDirectionsUrl } from '@/lib/geo-utils';
import { FALLBACK_VIEW } from '@/lib/map-core/constants';
import { createSpotsStrategy } from '@/lib/search/spotsStrategy';
import {
  getCurrentUserId,
  getPinsForSpots,
  setSaved,
  setVisited,
} from '@/lib/pins';
import { shareSpot } from '@/lib/share-spot';
import { addRecentViewedSpotId, getRecentViewedSpotIds } from '@/lib/storage/recentViewedSpots';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/toast';

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

const MAPBOX_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_TOKEN ?? '';
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
  const [pinFilter, setPinFilter] = useState<MapPinFilterValue>('all');
  const [isAuthUser, setIsAuthUser] = useState(false);
  const [showLogoutOption, setShowLogoutOption] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [sheetState, setSheetState] = useState<'peek' | 'medium' | 'expanded'>('peek');
  const [sheetHeight, setSheetHeight] = useState(SHEET_PEEK_HEIGHT);
  const [showCreateSpotConfirmModal, setShowCreateSpotConfirmModal] = useState(false);
  const [pendingCreateSpotCoords, setPendingCreateSpotCoords] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

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

  const refetchSpots = useCallback(async () => {
    const { data } = await supabase
      .from('spots')
      .select('id, title, description_short, description_long, cover_image_url, address, latitude, longitude')
      .eq('is_hidden', false);
    const list = (data ?? []) as Omit<Spot, 'saved' | 'visited' | 'pinStatus'>[];
    const pinMap = await getPinsForSpots(list.map((s) => s.id));
    const withPins: Spot[] = list.map((s) => {
      const state = pinMap.get(s.id);
      const saved = state?.saved ?? false;
      const visited = state?.visited ?? false;
      return {
        ...s,
        saved,
        visited,
        pinStatus:
          visited ? 'visited' : saved ? 'to_visit' : ('default' as SpotPinStatus),
      };
    });
    setSpots(withPins);
    return withPins;
  }, []);

  useFocusEffect(
    useCallback(() => {
      refetchSpots();
      return () => {};
    }, [refetchSpots])
  );

  const onLongPressHandlerRef = useRef<(coords: { lat: number; lng: number }) => void>(() => {});
  const mapCore = useMapCore(selectedSpot, {
    onLongPress: (coords) => onLongPressHandlerRef.current?.(coords),
    skipCenterOnUser: false,
    onUserMapGestureStart: () => setSheetState('peek'),
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
    if (pinFilter === 'all') return spots;
    if (pinFilter === 'saved') return spots.filter((s) => s.saved);
    return spots.filter((s) => s.visited);
  }, [spots, pinFilter]);

  const pinCounts = useMemo(
    () => ({
      saved: spots.filter((s) => s.saved).length,
      visited: spots.filter((s) => s.visited).length,
    }),
    [spots]
  );

  const displayedSpots = useMemo(
    () =>
      filteredSpots.length > MAP_PIN_CAP ? filteredSpots.slice(0, MAP_PIN_CAP) : filteredSpots,
    [filteredSpots]
  );

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

  useEffect(() => {
    if (
      selectedSpot &&
      !filteredSpots.some((s) => s.id === selectedSpot.id)
    ) {
      setSelectedSpot(null);
      setSheetState('peek');
      setSheetHeight(SHEET_PEEK_HEIGHT);
    }
  }, [pinFilter, filteredSpots, selectedSpot]);

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

  const recentViewedSpots = useMemo(() => {
    const ids = getRecentViewedSpotIds();
    return ids
      .map((id) => spots.find((s) => s.id === id))
      .filter((s): s is Spot => s != null);
  }, [spots]);

  useEffect(() => {
    searchV2.setOnSelect((spot: Spot) => {
      searchV2.setOpen(false);
      setSelectedSpot(spot);
      setSheetState('medium');
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
    [openAuthModal]
  );

  useEffect(() => {
    searchV2.setOnCreate(async () => {
      if (!(await requireAuthOrModal(AUTH_MODAL_MESSAGES.createSpot))) return;
      (router.push as (href: string) => void)('/create-spot');
    });
  }, [searchV2, router, requireAuthOrModal]);

  const SKIP_CREATE_SPOT_CONFIRM_KEY = 'flowya_create_spot_skip_confirm';

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
    [router, mapInstance]
  );

  const handleMapLongPress = useCallback(
    async (coords: { lat: number; lng: number }) => {
      if (!(await requireAuthOrModal(AUTH_MODAL_MESSAGES.createSpot))) return;
      setSelectedSpot(null);
      searchV2.setOpen(false);
      blurActiveElement();
      const skipConfirm =
        typeof localStorage !== 'undefined' &&
        localStorage.getItem(SKIP_CREATE_SPOT_CONFIRM_KEY) === 'true';
      if (skipConfirm) {
        navigateToCreateSpotWithCoords(coords);
      } else {
        setPendingCreateSpotCoords(coords);
        setShowCreateSpotConfirmModal(true);
      }
    },
    [requireAuthOrModal, searchV2, navigateToCreateSpotWithCoords]
  );
  useEffect(() => {
    onLongPressHandlerRef.current = handleMapLongPress;
  }, [handleMapLongPress]);

  const handleCreateSpotConfirm = useCallback(
    (dontShowAgain: boolean) => {
      if (pendingCreateSpotCoords === null) return;
      if (dontShowAgain && typeof localStorage !== 'undefined') {
        localStorage.setItem(SKIP_CREATE_SPOT_CONFIRM_KEY, 'true');
      }
      navigateToCreateSpotWithCoords(pendingCreateSpotCoords);
      setPendingCreateSpotCoords(null);
      setShowCreateSpotConfirmModal(false);
    },
    [pendingCreateSpotCoords, navigateToCreateSpotWithCoords]
  );

  const handleCreateSpotConfirmCancel = useCallback(() => {
    setPendingCreateSpotCoords(null);
    setShowCreateSpotConfirmModal(false);
  }, []);

  const stageLabel =
    searchV2.stage === 'viewport'
      ? 'En esta zona'
      : searchV2.stage === 'expanded'
        ? 'Cerca de aquí'
        : 'En todo el mapa';

  const handlePinClick = useCallback(
    (spot: Spot) => {
      if (selectedSpot?.id === spot.id) {
        saveFocusBeforeNavigate();
        blurActiveElement();
        (router.push as (href: string) => void)(`/spot/${spot.id}`);
      } else {
        setSelectedSpot(spot);
        setSheetState('medium');
      }
    },
    [selectedSpot?.id, router, setSheetState]
  );

  const handleSelectedPinTap = useCallback(() => {
    if (!selectedSpot) return;
    saveFocusBeforeNavigate();
    blurActiveElement();
    (router.push as (href: string) => void)(`/spot/${selectedSpot.id}`);
  }, [selectedSpot, router]);

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
      const result = await shareSpot(spot.id, spot.title);
      if (result.copied) toast.show('Link copiado', { type: 'success' });
    },
    [toast]
  );

  const updateSpotPinState = useCallback(
    (spotId: string, next: { saved: boolean; visited: boolean }) => {
      const pinStatus: SpotPinStatus =
        next.visited ? 'visited' : next.saved ? 'to_visit' : 'default';
      setSpots((prev) =>
        prev.map((s) =>
          s.id === spotId ? { ...s, saved: next.saved, visited: next.visited, pinStatus } : s
        )
      );
      setSelectedSpot((prev) =>
        prev?.id === spotId
          ? prev
            ? { ...prev, saved: next.saved, visited: next.visited, pinStatus }
            : null
          : prev
      );
    },
    []
  );

  const handleSavePin = useCallback(
    async (spot: Spot) => {
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
        toast.show(nextState.saved ? 'Guardado' : 'Quitado de guardados', {
          type: 'success',
        });
      } else {
        updateSpotPinState(spot.id, { saved: false, visited: false });
        toast.show('Quitado de guardados', { type: 'success' });
      }
    },
    [toast, openAuthModal, updateSpotPinState]
  );

  const handleMarkVisited = useCallback(
    async (spot: Spot) => {
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
        toast.show(nextState.visited ? 'Marcado como visitado' : 'Desmarcado', {
          type: 'success',
        });
      } else {
        updateSpotPinState(spot.id, { saved: false, visited: false });
        toast.show('Desmarcado', { type: 'success' });
      }
    },
    [toast, openAuthModal, updateSpotPinState]
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
    }, [mapInstance])
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

  const showDock = selectedSpot == null && !searchV2.isOpen;
  const dockBottomOffset = 12;

  return (
    <View
      ref={mapRootRef as React.RefObject<View>}
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
      {selectedSpot && selectedPinScreenPos ? (
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
      <View style={[styles.filterOverlay, { pointerEvents: 'box-none' }]}>
        <View style={[styles.filterRowWrap, { pointerEvents: 'box-none' }]}>
          <MapPinFilter value={pinFilter} onChange={setPinFilter} counts={pinCounts} />
        </View>
      </View>
      {!searchV2.isOpen && sheetState !== 'expanded' ? (
        <View
          style={[
            styles.controlsOverlay,
            {
              pointerEvents: 'box-none',
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
          onOpenSearch={() => searchV2.setOpen(true)}
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
              spot.pinStatus === 'to_visit'
                ? 'toVisit'
                : spot.pinStatus === 'visited'
                  ? 'visited'
                  : 'default'
            }
            onPress={() => searchV2.onSelect(spot)}
          />
        )}
        stageLabel={stageLabel}
        scope="explorar"
        getItemKey={(s) => s.id}
      />
      {selectedSpot != null && !searchV2.isOpen ? (
        <SpotSheet
          spot={selectedSpot}
          onClose={() => {
            setSelectedSpot(null);
            setSheetState('peek');
            setSheetHeight(SHEET_PEEK_HEIGHT);
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
          onDirections={(s) => Linking.openURL(getMapsDirectionsUrl(s.latitude, s.longitude))}
          onEdit={(spotId) => (router.push as (href: string) => void)(`/spot/${spotId}?edit=1`)}
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
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    ...Platform.select({
      web: { width: '100%' },
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
  filterOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: FILTER_OVERLAY_TOP,
    alignItems: 'center',
    zIndex: 10,
  },
  filterRowWrap: {
    position: 'relative',
    zIndex: 20,
    ...Platform.select({ android: { elevation: 4 } }),
  },
  controlsOverlay: {
    position: 'absolute',
    right: CONTROLS_OVERLAY_RIGHT,
    zIndex: 10,
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
});
