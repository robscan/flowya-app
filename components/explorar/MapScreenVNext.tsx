/**
 * MapScreenVNext — Explorar vNext: MapCore + MapControls + sheet placeholder.
 * Sin Search, SpotCard ni CreateSpot en este PR.
 */

import '@/styles/mapbox-attribution-overrides.css';
import '@/styles/viewport-dvh.css';
import 'mapbox-gl/dist/mapbox-gl.css';

import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { Search } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { MapCoreView } from '@/components/explorar/MapCoreView';
import { MapControls } from '@/components/design-system/map-controls';
import type { SpotPinStatus } from '@/components/design-system/map-pins';
import { SearchResultCard } from '@/components/design-system/search-result-card';
import { IconButton } from '@/components/design-system/icon-button';
import { SearchFloating } from '@/components/search';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useMapCore } from '@/hooks/useMapCore';
import { useSearchControllerV2 } from '@/hooks/search/useSearchControllerV2';
import { useSearchHistory } from '@/hooks/search/useSearchHistory';
import { blurActiveElement, saveFocusBeforeNavigate } from '@/lib/focus-management';
import { distanceKm } from '@/lib/geo-utils';
import { FALLBACK_VIEW } from '@/lib/map-core/constants';
import { createSpotsStrategy } from '@/lib/search/spotsStrategy';
import { getPinsForSpots } from '@/lib/pins';
import { addRecentViewedSpotId, getRecentViewedSpotIds } from '@/lib/storage/recentViewedSpots';
import { supabase } from '@/lib/supabase';

type Spot = {
  id: string;
  title: string;
  description_short: string | null;
  cover_image_url: string | null;
  latitude: number;
  longitude: number;
  pinStatus?: SpotPinStatus;
};

const MAPBOX_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_TOKEN ?? '';
const MAP_PIN_CAP = 500;
const SELECTED_PIN_HIT_RADIUS = 24;
const CONTROLS_OVERLAY_BOTTOM = 16;
const CONTROLS_OVERLAY_RIGHT = 16;
const FAB_TOP = 16;
const FAB_RIGHT = 16;
const SHEET_PLACEHOLDER_HEIGHT = 80;

export function MapScreenVNext() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const [spots, setSpots] = useState<Spot[]>([]);
  const [selectedSpot, setSelectedSpot] = useState<Spot | null>(null);

  const refetchSpots = useCallback(async () => {
    const { data } = await supabase
      .from('spots')
      .select('id, title, description_short, cover_image_url, latitude, longitude')
      .eq('is_hidden', false);
    const list = (data ?? []) as Spot[];
    const pinMap = await getPinsForSpots(list.map((s) => s.id));
    const withPins = list.map((s) => ({
      ...s,
      pinStatus: pinMap.get(s.id),
    }));
    setSpots(withPins);
    return withPins;
  }, []);

  useFocusEffect(
    useCallback(() => {
      refetchSpots();
      return () => {};
    }, [refetchSpots])
  );

  const mapCore = useMapCore(selectedSpot, {
    onLongPress: () => {},
    skipCenterOnUser: false,
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

  const displayedSpots = useMemo(
    () => (spots.length > MAP_PIN_CAP ? spots.slice(0, MAP_PIN_CAP) : spots),
    [spots]
  );

  const defaultSpots = useMemo(() => {
    const ref = userCoords ?? { latitude: FALLBACK_VIEW.latitude, longitude: FALLBACK_VIEW.longitude };
    return [...spots]
      .sort(
        (a, b) =>
          distanceKm(ref.latitude, ref.longitude, a.latitude, a.longitude) -
          distanceKm(ref.latitude, ref.longitude, b.latitude, b.longitude)
      )
      .slice(0, 10);
  }, [spots, userCoords]);

  const spotsStrategyV2 = useMemo(
    () =>
      createSpotsStrategy({
        getFilteredSpots: () => spots,
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
    [spots, mapInstance, zoom]
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
    getFilters: () => 'all',
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
      (router.push as (href: string) => void)('/create-spot');
    });
  }, [searchV2, router]);

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
      }
    },
    [selectedSpot?.id, router]
  );

  const handleSelectedPinTap = useCallback(() => {
    if (!selectedSpot) return;
    saveFocusBeforeNavigate();
    blurActiveElement();
    (router.push as (href: string) => void)(`/spot/${selectedSpot.id}`);
  }, [selectedSpot, router]);

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

  const colors = Colors[colorScheme ?? 'light'];

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
      <View style={[styles.controlsOverlay, { pointerEvents: 'box-none' }]}>
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
      <SearchFloating<Spot>
        controller={searchV2}
        defaultItems={defaultSpots}
        recentQueries={searchHistory.recentQueries}
        recentViewedItems={recentViewedSpots}
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
      {!searchV2.isOpen ? (
        <View style={styles.fabWrap}>
          <IconButton
            variant="default"
            onPress={() => searchV2.setOpen(true)}
            accessibilityLabel="Buscar"
          >
            <Search size={24} color={colors.text} strokeWidth={2} />
          </IconButton>
        </View>
      ) : null}
      <View style={styles.sheetPlaceholder}>
        <Text style={styles.sheetPlaceholderText}>Explorar vNext — sheet placeholder</Text>
      </View>
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
  controlsOverlay: {
    position: 'absolute',
    right: CONTROLS_OVERLAY_RIGHT,
    bottom: CONTROLS_OVERLAY_BOTTOM + SHEET_PLACEHOLDER_HEIGHT,
    zIndex: 10,
  },
  fabWrap: {
    position: 'absolute',
    top: FAB_TOP,
    right: FAB_RIGHT,
    zIndex: 10,
  },
  sheetPlaceholder: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: SHEET_PLACEHOLDER_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    zIndex: 8,
  },
  sheetPlaceholderText: {
    fontSize: 14,
    color: '#666',
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
