import '@/styles/mapbox-attribution-overrides.css';
import '@/styles/viewport-dvh.css';
import 'mapbox-gl/dist/mapbox-gl.css';

import { useFocusEffect, useIsFocused } from '@react-navigation/native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LogOut, Search, User, X } from 'lucide-react-native';
import type { Map as MapboxMap } from 'mapbox-gl';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { MapEvent, MapMouseEvent, MapTouchEvent } from 'react-map-gl/mapbox-legacy';
import { Map, Marker } from 'react-map-gl/mapbox-legacy';
import {
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';

import { ButtonPrimary } from '@/components/design-system/buttons';
import { IconButton } from '@/components/design-system/icon-button';
import { ImageFullscreenModal } from '@/components/design-system/image-fullscreen-modal';
import { MapControls } from '@/components/design-system/map-controls';
import {
    MapPinFilter,
    type MapPinFilterValue,
} from '@/components/design-system/map-pin-filter';
import type { SpotPinStatus } from '@/components/design-system/map-pins';
import { MapPinLocation, MapPinSpot } from '@/components/design-system/map-pins';
import { SearchResultCard } from '@/components/design-system/search-result-card';
import { SpotCard } from '@/components/design-system/spot-card';
import { TypographyStyles } from '@/components/design-system/typography';
import { ConfirmModal } from '@/components/ui/confirm-modal';
import { CreateSpotConfirmModal } from '@/components/ui/create-spot-confirm-modal';
import { FlowyaBetaModal } from '@/components/ui/flowya-beta-modal';
import { useToast } from '@/components/ui/toast';
import { Colors, Radius, Spacing, WebTouchManipulation } from '@/constants/theme';
import { AUTH_MODAL_MESSAGES, useAuthModal } from '@/contexts/auth-modal';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { blurActiveElement, getAndClearSavedFocus, saveFocusBeforeNavigate } from '@/lib/focus-management';
import { distanceKm } from '@/lib/geo-utils';
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

/** Bounds globales para el control "Ver el mundo" (límites Web Mercator). */
const WORLD_BOUNDS: [[number, number], [number, number]] = [
  [-180, -85.051129],
  [180, 85.051129],
];

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
  const [showBetaModal, setShowBetaModal] = useState(false);
  const [searchActive, setSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPinScreenPos, setSelectedPinScreenPos] = useState<{ x: number; y: number } | null>(
    null
  );
  const [showCreateSpotConfirmModal, setShowCreateSpotConfirmModal] = useState(false);
  const [pendingCreateSpotCoords, setPendingCreateSpotCoords] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [activeMapControl, setActiveMapControl] = useState<
    'world' | 'contextual' | 'location' | null
  >(null);
  const programmaticMoveRef = useRef(false);
  const mapRootRef = useRef<View>(null);
  const searchInputRef = useRef<TextInput>(null);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressLngLatRef = useRef<{ lat: number; lng: number } | null>(null);
  const longPressPointerStartRef = useRef<{ x: number; y: number } | null>(null);
  const isFocused = useIsFocused();

  const LONG_PRESS_MS = 3000;
  const LONG_PRESS_DRAG_THRESHOLD_PX = 10;

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

  /** Resultados de búsqueda: filteredSpots filtrados por query (solo por título, match simple). Sin texto no se muestran resultados. */
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return filteredSpots.filter((s) => s.title.toLowerCase().includes(q));
  }, [filteredSpots, searchQuery]);

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

  const FIT_BOUNDS_PADDING = 64;
  const FIT_BOUNDS_DURATION_MS = 1200;
  const SPOT_FOCUS_ZOOM = 15;

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

  const onMapLoad = useCallback(
    (e: MapEvent) => {
      const map = e.target;
      setMapInstance(map);
      setZoom(map.getZoom());
      applyGlobeAndAtmosphere(map);
      hideNoiseLayers(map);
      if (!params.created) tryCenterOnUser(map, setUserCoords);
    },
    [params.created]
  );

  const geoOptions = useMemo<PositionOptions>(
    () => ({
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 300000,
    }),
    []
  );

  /** Ubicación actual: refresca coords y centra en el usuario. Si getCurrentPosition falla, usa userCoords existentes y no bloquea. */
  const handleLocate = useCallback(() => {
    if (!mapInstance || typeof navigator === 'undefined' || !navigator.geolocation) return;
    programmaticMoveRef.current = true;
    setActiveMapControl('location');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords: UserCoords = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        };
        setUserCoords(coords);
        mapInstance.flyTo({
          center: [coords.longitude, coords.latitude],
          zoom: 15,
          duration: 1500,
        });
      },
      () => {
        if (userCoords) {
          mapInstance.flyTo({
            center: [userCoords.longitude, userCoords.latitude],
            zoom: 15,
            duration: 1500,
          });
        }
      },
      geoOptions
    );
  }, [mapInstance, userCoords, geoOptions]);

  /** Encuadra solo el spot seleccionado (zoom fijo). Solo se usa con spot seleccionado. */
  const handleReframeSpot = useCallback(() => {
    if (!mapInstance || !selectedSpot) return;
    programmaticMoveRef.current = true;
    setActiveMapControl('contextual');
    mapInstance.flyTo({
      center: [selectedSpot.longitude, selectedSpot.latitude],
      zoom: SPOT_FOCUS_ZOOM,
      duration: FIT_BOUNDS_DURATION_MS,
    });
  }, [mapInstance, selectedSpot]);

  /** Encuadra spot seleccionado + ubicación del usuario. Solo se usa con spot seleccionado. */
  const handleReframeSpotAndUser = useCallback(() => {
    if (!mapInstance || !selectedSpot) return;
    programmaticMoveRef.current = true;
    setActiveMapControl('contextual');
    const runReframe = (coords: UserCoords) => {
      const pts: { longitude: number; latitude: number }[] = coords
        ? [
            { longitude: selectedSpot.longitude, latitude: selectedSpot.latitude },
            { longitude: coords.longitude, latitude: coords.latitude },
          ]
        : [{ longitude: selectedSpot.longitude, latitude: selectedSpot.latitude }];
      if (pts.length === 1) {
        mapInstance.flyTo({
          center: [pts[0].longitude, pts[0].latitude],
          zoom: SPOT_FOCUS_ZOOM,
          duration: FIT_BOUNDS_DURATION_MS,
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
    };
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const c: UserCoords = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
          setUserCoords(c);
          runReframe(c);
        },
        () => runReframe(userCoords),
        geoOptions
      );
    } else {
      runReframe(userCoords);
    }
  }, [mapInstance, selectedSpot, userCoords, geoOptions]);

  /** Vista global (control "Ver el mundo"): fitBounds(world). Estado activo se desactiva en moveend si fue interacción del usuario. */
  const handleViewWorld = useCallback(() => {
    if (!mapInstance) return;
    programmaticMoveRef.current = true;
    setActiveMapControl('world');
    mapInstance.fitBounds(WORLD_BOUNDS, { duration: FIT_BOUNDS_DURATION_MS });
  }, [mapInstance]);

  useEffect(() => {
    const map = mapInstance;
    if (!map) return;
    const onMoveEnd = () => {
      if (programmaticMoveRef.current) {
        programmaticMoveRef.current = false;
      } else {
        setActiveMapControl(null);
      }
      setZoom(map.getZoom());
      if (selectedSpot) {
        try {
          const pt = map.project([selectedSpot.longitude, selectedSpot.latitude]);
          setSelectedPinScreenPos({ x: pt.x, y: pt.y });
        } catch {
          setSelectedPinScreenPos(null);
        }
      }
    };
    map.on('moveend', onMoveEnd);
    return () => {
      map.off('moveend', onMoveEnd);
    };
  }, [mapInstance, selectedSpot]);

  /** Posición en pantalla del pin seleccionado (para hit area que navega a detail). */
  useEffect(() => {
    if (!mapInstance || !selectedSpot) {
      setSelectedPinScreenPos(null);
      return;
    }
    try {
      const pt = mapInstance.project([selectedSpot.longitude, selectedSpot.latitude]);
      setSelectedPinScreenPos({ x: pt.x, y: pt.y });
    } catch {
      setSelectedPinScreenPos(null);
    }
  }, [mapInstance, selectedSpot]);

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
  const handleToggleSearch = useCallback(() => {
    setSearchActive((prev) => !prev);
  }, []);

  /** Cerrar solo la UI de búsqueda; no borra searchQuery ni searchResults (estado latente). */
  /** Botón clear: vacía el input y mantiene modo búsqueda; la X es el único mecanismo para cancelar explícitamente. */
  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
    if (searchInputRef.current && typeof searchInputRef.current.focus === 'function') {
      searchInputRef.current.focus();
    }
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

  /** Al seleccionar un resultado: salir de modo búsqueda (sin borrar texto), centrar pin y mostrar SpotCardMapSelection. */
  const handleSearchResultSelect = useCallback(
    (spot: Spot) => {
      setSearchActive(false);
      setSelectedSpot(spot);
      if (mapInstance) {
        mapInstance.flyTo({
          center: [spot.longitude, spot.latitude],
          zoom: 15,
          duration: 800,
        });
      }
    },
    [mapInstance]
  );

  const handleCreateSpotFromSearch = useCallback(() => {
    setSelectedSpot(null);
    setSearchActive(false);
    blurActiveElement();
    (router.push as (href: string) => void)('/create-spot?from=search');
  }, [router]);

  const clearLongPressTimer = useCallback(() => {
    if (longPressTimerRef.current !== null) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    longPressLngLatRef.current = null;
    longPressPointerStartRef.current = null;
  }, []);

  const SKIP_CREATE_SPOT_CONFIRM_KEY = 'flowya_create_spot_skip_confirm';

  const navigateToCreateSpot = useCallback(
    (coords: { lat: number; lng: number }) => {
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
    [router, mapInstance]
  );

  const handleMapLongPress = useCallback(() => {
    const coords = longPressLngLatRef.current;
    longPressLngLatRef.current = null;
    if (!coords) return;
    setSelectedSpot(null);
    setSearchActive(false);
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
  }, [navigateToCreateSpot]);

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

  const handleMapPointerDown = useCallback(
    (e: MapMouseEvent | MapTouchEvent) => {
      const lngLat = 'lngLat' in e ? e.lngLat : (e as MapMouseEvent).lngLat;
      if (!lngLat) return;
      const point = 'point' in e && e.point ? e.point : undefined;
      const x = point?.x ?? ('originalEvent' in e && e.originalEvent ? (e.originalEvent as { clientX?: number }).clientX ?? 0 : 0);
      const y = point?.y ?? ('originalEvent' in e && e.originalEvent ? (e.originalEvent as { clientY?: number }).clientY ?? 0 : 0);
      longPressLngLatRef.current = { lat: lngLat.lat, lng: lngLat.lng };
      longPressPointerStartRef.current = { x, y };
      longPressTimerRef.current = setTimeout(handleMapLongPress, LONG_PRESS_MS);
    },
    [handleMapLongPress]
  );

  const handleMapPointerMove = useCallback(
    (e: MapMouseEvent | MapTouchEvent) => {
      if (longPressTimerRef.current === null || longPressPointerStartRef.current === null) return;
      const point = 'point' in e && e.point ? e.point : undefined;
      const x = point?.x ?? ('originalEvent' in e && e.originalEvent ? (e.originalEvent as { clientX?: number }).clientX ?? 0 : 0);
      const y = point?.y ?? ('originalEvent' in e && e.originalEvent ? (e.originalEvent as { clientY?: number }).clientY ?? 0 : 0);
      const start = longPressPointerStartRef.current;
      const dist = Math.hypot(x - start.x, y - start.y);
      if (dist > LONG_PRESS_DRAG_THRESHOLD_PX) clearLongPressTimer();
    },
    [clearLongPressTimer]
  );

  const handleMapPointerUp = useCallback(() => {
    clearLongPressTimer();
  }, [clearLongPressTimer]);

  useEffect(() => {
    return () => {
      if (longPressTimerRef.current !== null) {
        clearTimeout(longPressTimerRef.current);
      }
    };
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
    >
      <Map
        key={mapStyle}
        mapboxAccessToken={MAPBOX_TOKEN}
        mapStyle={mapStyle}
        projection="globe"
        initialViewState={FALLBACK_VIEW}
        style={styles.map}
        onLoad={onMapLoad}
        onMouseDown={handleMapPointerDown}
        onMouseMove={handleMapPointerMove}
        onMouseUp={handleMapPointerUp}
        onMouseLeave={handleMapPointerUp}
        onTouchStart={handleMapPointerDown}
        onTouchMove={handleMapPointerMove}
        onTouchEnd={handleMapPointerUp}
      >
        {filteredSpots.map((spot) => (
          <Marker
            key={spot.id}
            latitude={spot.latitude}
            longitude={spot.longitude}
            anchor="center"
            onClick={() => handlePinClick(spot)}
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
        {userCoords ? (
          <Marker
            latitude={userCoords.latitude}
            longitude={userCoords.longitude}
            anchor="center"
          >
            <MapPinLocation />
          </Marker>
        ) : null}
      </Map>
      {selectedSpot && !searchActive ? (
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
          searchActive && styles.filterOverlaySearchActive,
          { pointerEvents: 'box-none' },
        ]}
      >
        <MapPinFilter value={pinFilter} onChange={setPinFilter} counts={pinCounts} />
        {searchActive ? (
          <>
            <View style={styles.searchInputWrap}>
              <TextInput
                ref={searchInputRef}
                style={[
                  styles.searchInput,
                  {
                    backgroundColor: colors.backgroundElevated,
                    borderColor: colors.borderSubtle,
                    color: colors.text,
                    paddingRight: searchQuery.length > 0 ? 44 : Spacing.base,
                  },
                  WebTouchManipulation,
                ]}
                placeholder="Buscar lugares…"
                placeholderTextColor={colors.textSecondary}
                value={searchQuery}
                onChangeText={setSearchQuery}
                accessibilityLabel="Buscar lugares"
              />
              {searchQuery.length > 0 ? (
                <Pressable
                  style={[styles.searchClearButton, { backgroundColor: colors.backgroundElevated }]}
                  onPress={handleClearSearch}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  accessibilityLabel="Limpiar búsqueda"
                  accessibilityRole="button"
                  {...WebTouchManipulation}
                >
                  <X size={20} color={colors.textSecondary} strokeWidth={2} />
                </Pressable>
              ) : null}
            </View>
            <View
              style={styles.searchResultsArea}
            >
              {searchQuery.trim() === '' ? (
                <ScrollView
                  style={styles.searchResultsScroll}
                  contentContainerStyle={styles.searchResultsContent}
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator
                >
                  {defaultSpots.map((spot) => (
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
                        onPress={() => handleSearchResultSelect(spot)}
                      />
                    </View>
                  ))}
                </ScrollView>
              ) : searchResults.length > 0 ? (
                <ScrollView
                  style={styles.searchResultsScroll}
                  contentContainerStyle={styles.searchResultsContent}
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator
                >
                  {searchResults.map((spot) => (
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
                        onPress={() => handleSearchResultSelect(spot)}
                      />
                    </View>
                  ))}
                </ScrollView>
              ) : (
                <View
                  style={styles.searchNoResults}
                >
                  <Text
                    style={[
                      styles.searchNoResultsText,
                      { color: colors.textSecondary },
                    ]}
                  >
                    ¿No encontraste lo que buscas?
                  </Text>
                  <ButtonPrimary
                    onPress={handleCreateSpotFromSearch}
                    accessibilityLabel="Crear nuevo spot"
                  >
                    Crear nuevo spot
                  </ButtonPrimary>
                </View>
              )}
            </View>
          </>
        ) : null}
      </View>
      {!searchActive ? (
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
      {!searchActive ? (
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
        {searchActive ? (
          <Pressable
            style={({ pressed }) => [
              styles.fabSearchClose,
              pressed && styles.fabSearchClosePressed,
            ]}
            onPress={handleToggleSearch}
            accessibilityLabel="Cerrar búsqueda"
            accessibilityRole="button"
          >
            <X size={24} color={colors.stateError} strokeWidth={2} />
          </Pressable>
        ) : (
          <IconButton
            variant="default"
            onPress={handleToggleSearch}
            accessibilityLabel="Buscar"
          >
            <Search size={24} color={colors.text} strokeWidth={2} />
          </IconButton>
        )}
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
  searchInput: {
    height: 44,
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.base,
    fontSize: 16,
  },
  searchClearButton: {
    position: 'absolute',
    right: Spacing.sm,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    width: 36,
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
    backgroundColor: '#000',
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
});
