/**
 * MapScreenVNext — Explorar vNext: MapCore + MapControls + sheet placeholder.
 * Sin Search, SpotCard ni CreateSpot en este PR.
 */

import '@/styles/mapbox-attribution-overrides.css';
import '@/styles/viewport-dvh.css';
import 'mapbox-gl/dist/mapbox-gl.css';

import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { MapCoreView } from '@/components/explorar/MapCoreView';
import { MapControls } from '@/components/design-system/map-controls';
import type { SpotPinStatus } from '@/components/design-system/map-pins';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useMapCore } from '@/hooks/useMapCore';
import { blurActiveElement, saveFocusBeforeNavigate } from '@/lib/focus-management';
import { FALLBACK_VIEW } from '@/lib/map-core/constants';
import { getPinsForSpots } from '@/lib/pins';
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
