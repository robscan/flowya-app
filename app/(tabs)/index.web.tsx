import '@/styles/mapbox-attribution-overrides.css';
import '@/styles/viewport-dvh.css';
import 'mapbox-gl/dist/mapbox-gl.css';

import { useFocusEffect, useIsFocused } from '@react-navigation/native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MapPinPlus, User, X } from 'lucide-react-native';
import type { Map as MapboxMap } from 'mapbox-gl';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { MapEvent } from 'react-map-gl/mapbox-legacy';
import Map, { Marker } from 'react-map-gl/mapbox-legacy';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { IconButton } from '@/components/design-system/icon-button';
import { ImageFullscreenModal } from '@/components/design-system/image-fullscreen-modal';
import { MapControls } from '@/components/design-system/map-controls';
import {
    MapPinFilter,
    type MapPinFilterValue,
} from '@/components/design-system/map-pin-filter';
import type { SpotPinStatus } from '@/components/design-system/map-pins';
import { MapPinLocation, MapPinSpot } from '@/components/design-system/map-pins';
import { SpotCard } from '@/components/design-system/spot-card';
import { ConfirmModal } from '@/components/ui/confirm-modal';
import { useToast } from '@/components/ui/toast';
import { Colors } from '@/constants/theme';
import { AUTH_MODAL_MESSAGES, useAuthModal } from '@/contexts/auth-modal';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { blurActiveElement, getAndClearSavedFocus } from '@/lib/focus-management';
import { getCurrentUserId, getPinsForSpots, nextPinStatus, removePin, setPinStatus } from '@/lib/pins';
import { shareSpot } from '@/lib/share-spot';
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

// Fallback when geolocation is denied/unavailable: Riviera Maya
const FALLBACK_VIEW = { longitude: -87.2, latitude: 20.4, zoom: 10 };

/** Zoom mínimo para mostrar nombres de spots (como Mapbox: labels solo cuando hay espacio). */
const LABEL_MIN_ZOOM = 12;

// Layer ids to hide (commercial POIs, shops, restaurants, business labels)
const HIDE_LAYER_IDS = ['poi-label'];

function hideNoiseLayers(map: MapboxMap) {
  try {
    const style = map.getStyle();
    if (!style?.layers) return;
    for (const layer of style.layers) {
      if (HIDE_LAYER_IDS.includes(layer.id)) {
        map.setLayoutProperty(layer.id, 'visibility', 'none');
      }
    }
  } catch {
    // ignore if style/layers not ready
  }
}

function applyGlobeAndAtmosphere(map: MapboxMap) {
  try {
    map.setProjection('globe');
    map.setFog({
      range: [0.5, 10],
      color: 'rgb(186, 210, 235)',
      'high-color': 'rgb(36, 92, 223)',
      'horizon-blend': 0.02,
      'space-color': 'rgb(11, 11, 25)',
      'star-intensity': 0.35,
    });
  } catch {
    // ignore if style not ready
  }
}

type UserCoords = { latitude: number; longitude: number } | null;

function tryCenterOnUser(
  map: MapboxMap,
  onCoords: (coords: UserCoords) => void
) {
  if (typeof navigator === 'undefined' || !navigator.geolocation) return;
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const coords = {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      };
      onCoords(coords);
      map.flyTo({
        center: [coords.longitude, coords.latitude],
        zoom: 14,
        duration: 1500,
      });
    },
    () => {},
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
  );
}

export default function MapScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ created?: string }>();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [spots, setSpots] = useState<Spot[]>([]);
  const [selectedSpot, setSelectedSpot] = useState<Spot | null>(null);
  const [fullscreenImageUri, setFullscreenImageUri] = useState<string | null>(null);
  const [mapInstance, setMapInstance] = useState<MapboxMap | null>(null);
  const [userCoords, setUserCoords] = useState<UserCoords>(null);
  const [pinFilter, setPinFilter] = useState<MapPinFilterValue>('all');
  const [zoom, setZoom] = useState(FALLBACK_VIEW.zoom);
  const [isAuthUser, setIsAuthUser] = useState(false);
  const [showLogoutOption, setShowLogoutOption] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const mapRootRef = useRef<View>(null);
  const isFocused = useIsFocused();

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
    if (pinFilter === 'to_visit') return spots.filter((s) => s.pinStatus === 'to_visit');
    return spots.filter((s) => s.pinStatus === 'visited');
  }, [spots, pinFilter]);

  /** Conteos derivados de spots (sin queries extra). */
  const pinCounts = useMemo(
    () => ({
      to_visit: spots.filter((s) => s.pinStatus === 'to_visit').length,
      visited: spots.filter((s) => s.pinStatus === 'visited').length,
    }),
    [spots]
  );

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
      .select('id, title, description_short, cover_image_url, latitude, longitude');
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
  }, [isFocused]);

  useEffect(() => {
    const createdId = params.created;
    if (!createdId) return;
    let cancelled = false;
    (async () => {
      const data = await refetchSpots();
      if (cancelled) return;
      const spot = (data as Spot[] | null)?.find((s) => s.id === createdId);
      if (spot) setSelectedSpot(spot);
      router.replace('/(tabs)' as const);
    })();
    return () => {
      cancelled = true;
    };
  }, [params.created, refetchSpots, router]);

  const onMapLoad = useCallback((e: MapEvent) => {
    const map = e.target;
    setMapInstance(map);
    setZoom(map.getZoom());
    applyGlobeAndAtmosphere(map);
    hideNoiseLayers(map);
    tryCenterOnUser(map, setUserCoords);
  }, []);

  /** Padding para fitBounds (px). Generoso para evitar pins pegados al borde. */
  const FIT_BOUNDS_PADDING = 64;
  const FIT_BOUNDS_DURATION_MS = 1200;

  /**
   * Encuadra el mapa mostrando: ubicación del usuario (si existe) + spots visibles según filtro.
   * Nunca deja fuera al usuario. Comportamiento: "recentrar todo lo importante".
   */
  const handleViewAll = useCallback(() => {
    if (!mapInstance || filteredSpots.length === 0) return;
    const pts: { longitude: number; latitude: number }[] = userCoords
      ? [
          { longitude: userCoords.longitude, latitude: userCoords.latitude },
          ...filteredSpots.map((s) => ({ longitude: s.longitude, latitude: s.latitude })),
        ]
      : filteredSpots.map((s) => ({ longitude: s.longitude, latitude: s.latitude }));

    if (pts.length === 1) {
      mapInstance.flyTo({
        center: [pts[0].longitude, pts[0].latitude],
        zoom: 14,
        duration: FIT_BOUNDS_DURATION_MS / 1000,
      });
    } else {
      let minLng = Infinity;
      let minLat = Infinity;
      let maxLng = -Infinity;
      let maxLat = -Infinity;
      for (const p of pts) {
        minLng = Math.min(minLng, p.longitude);
        minLat = Math.min(minLat, p.latitude);
        maxLng = Math.max(maxLng, p.longitude);
        maxLat = Math.max(maxLat, p.latitude);
      }
      mapInstance.fitBounds(
        [
          [minLng, minLat],
          [maxLng, maxLat],
        ],
        { padding: FIT_BOUNDS_PADDING, duration: FIT_BOUNDS_DURATION_MS }
      );
    }
  }, [mapInstance, filteredSpots, userCoords]);

  useEffect(() => {
    const map = mapInstance;
    if (!map) return;
    const onMoveEnd = () => setZoom(map.getZoom());
    map.on('moveend', onMoveEnd);
    return () => {
      map.off('moveend', onMoveEnd);
    };
  }, [mapInstance]);

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

  return (
    <View
      ref={mapRootRef}
      style={styles.mapScreenRoot}
      {...(Platform.OS === 'web' && { className: 'map-screen-root-dvh' })}
      dataSet={{ flowya: 'map-screen-root' }}
    >
      <Map
        key={mapStyle}
        mapboxAccessToken={MAPBOX_TOKEN}
        mapStyle={mapStyle}
        projection="globe"
        initialViewState={FALLBACK_VIEW}
        style={styles.map}
        onLoad={onMapLoad}
      >
        {userCoords ? (
          <Marker
            latitude={userCoords.latitude}
            longitude={userCoords.longitude}
            anchor="center"
          >
            <MapPinLocation />
          </Marker>
        ) : null}
        {filteredSpots.map((spot) => (
          <Marker
            key={spot.id}
            latitude={spot.latitude}
            longitude={spot.longitude}
            anchor="center"
            onClick={() => setSelectedSpot(spot)}
          >
            <MapPinSpot
              status={spot.pinStatus ?? 'default'}
              label={
                zoom >= LABEL_MIN_ZOOM || selectedSpot?.id === spot.id
                  ? spot.title
                  : undefined
              }
              selected={selectedSpot?.id === spot.id}
            />
          </Marker>
        ))}
      </Map>
      {selectedSpot ? (
        <>
          <View
            dataSet={{ flowya: 'map-spot-card-backdrop' }}
            style={styles.cardBackdrop}
            onTouchMove={() => setSelectedSpot(null)}
            onMouseMove={(e) => {
              if (e.buttons !== 0) setSelectedSpot(null);
            }}
          >
            <Pressable
              style={StyleSheet.absoluteFill}
              onPress={() => setSelectedSpot(null)}
              accessibilityLabel="Cerrar selección"
              accessibilityRole="button"
            />
          </View>
          <View
            dataSet={{ flowya: 'map-spot-card-overlay' }}
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
            />
          </View>
        </>
      ) : null}
      {showLogoutOption && isAuthUser ? (
        <Pressable
          dataSet={{ flowya: 'map-logout-backdrop' }}
          style={styles.logoutBackdrop}
          onPress={() => setShowLogoutOption(false)}
          accessibilityLabel="Cerrar opción de salir"
          accessibilityRole="button"
        />
      ) : null}
      <View
        dataSet={{ flowya: 'map-pin-filter-overlay' }}
        style={[styles.filterOverlay, { pointerEvents: 'box-none' }]}
      >
        <MapPinFilter value={pinFilter} onChange={setPinFilter} counts={pinCounts} />
      </View>
      <View
        dataSet={{ flowya: 'map-profile-button-overlay' }}
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
            <IconButton
              variant="default"
              onPress={handleLogoutPress}
              accessibilityLabel="Salir de la cuenta"
            >
              <X size={24} color={colors.stateError} strokeWidth={2} />
            </IconButton>
          </View>
        ) : null}
      </View>
      <View
        dataSet={{ flowya: 'map-controls-overlay' }}
        style={[styles.controlsOverlay, { pointerEvents: 'box-none' }]}
      >
        <MapControls
          map={mapInstance}
          onViewAll={handleViewAll}
          hasVisibleSpots={filteredSpots.length > 0}
        />
      </View>
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
        onCancel={() => setShowLogoutConfirm(false)}
        dataSet={{ flowya: 'logout-confirm-modal' }}
      />
      <View style={styles.fabWrap}>
        <IconButton
          dataSet={{ flowya: 'map-create-spot-fab' }}
          variant="default"
          onPress={() => {
            blurActiveElement();
            (router.push as (href: string) => void)('/create-spot');
          }}
          accessibilityLabel="Crear spot"
        >
          <MapPinPlus size={24} color={colors.text} strokeWidth={2} />
        </IconButton>
      </View>
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
  cardBackdrop: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9,
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
  logoutBackdrop: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
    backgroundColor: 'transparent',
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
