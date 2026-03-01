/**
 * useMapCore — hook que encapsula estado y handlers del núcleo del mapa (Explorar).
 * MapControls sigue en el contenedor; el core solo expone handlers y estado.
 */

import type { ActiveMapControl } from '@/components/design-system/map-controls';
import type { Map as MapboxMap } from 'mapbox-gl';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { MapEvent, MapMouseEvent, MapTouchEvent } from 'react-map-gl/mapbox-legacy';

import {
  setupSpotsLayer,
  updateSpotsLayerData,
  type SpotForLayer,
} from '@/lib/map-core/spots-layer';
import {
  applyGlobeAndAtmosphere,
  FIT_BOUNDS_DURATION_MS,
  hideNoiseLayers,
  INITIAL_PITCH,
  LONG_PRESS_DRAG_THRESHOLD_PX,
  LONG_PRESS_MS,
  stripUnavailableLandmarkPoiTileset,
  setLandmarkLabelsEnabled,
  set3DBuildingsEnabled,
  SPOT_FOCUS_PADDING_BOTTOM,
  SPOT_FOCUS_ZOOM,
  tryCenterOnUser,
  type UserCoords,
  GLOBE_ZOOM_INITIAL,
  GLOBE_ZOOM_WORLD,
} from '@/lib/map-core/constants';
import { installStyleImageFallback } from '@/lib/map-core/style-image-fallback';

export type MapCoreSelectedSpot = { id: string; longitude: number; latitude: number } | null;

export type UseMapCoreOptions = {
  onLongPress: (coords: { lat: number; lng: number }) => void;
  /** Si true, no se llama tryCenterOnUser en onMapLoad (ej. cuando params.created). */
  skipCenterOnUser?: boolean;
  /** Guard dinámico evaluado cuando geoloc resuelve; permite bloquear auto-center tardío. */
  shouldCenterOnUser?: () => boolean;
  /** Llamado cuando el usuario inicia pan/zoom (no programático). */
  onUserMapGestureStart?: () => void;
  /** Si true, activa showLandmarkIcons/showLandmarkIconLabels (estilo FLOWYA/Standard). */
  enableLandmarkLabels?: boolean;
  /** true = modo oscuro (para estilo visual de capa Flowya: pins/labels). */
  isDarkStyle?: boolean;
  /** Spots a dibujar como capa nativa debajo de POI. */
  spots?: SpotForLayer[];
  /** Spot actualmente seleccionado (para estilo y click). */
  selectedSpotId?: string | null;
  /** Llamado al hacer click en un spot de la capa. */
  onPinClick?: (spot: SpotForLayer) => void;
  /** Si true, flyTo usa pitch 3D y padding para sheet. Si false, flyTo 2D (respeta preferencia usuario). */
  is3DEnabled?: boolean;
  /** Si true, muestra iconografía derivada de maki en pins guardados/visitados. */
  showMakiIcon?: boolean;
  /** Si false, oculta labels de spots Flowya para evitar competencia visual con labels externas. */
  showSpotLabels?: boolean;
};

const GEO_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 300000,
};

const FIT_BOUNDS_PADDING = 64;

function getPointFromEvent(e: MapMouseEvent | MapTouchEvent): { x: number; y: number } {
  const point = 'point' in e && e.point ? e.point : undefined;
  const x =
    point?.x ??
    ('originalEvent' in e && e.originalEvent
      ? (e.originalEvent as { clientX?: number }).clientX ?? 0
      : 0);
  const y =
    point?.y ??
    ('originalEvent' in e && e.originalEvent
      ? (e.originalEvent as { clientY?: number }).clientY ?? 0
      : 0);
  return { x, y };
}

/** Multi-touch: más de un dedo en pantalla. No iniciar long-press (evitar create spot con pinch/zoom). */
function isMultiTouch(e: MapMouseEvent | MapTouchEvent): boolean {
  const ev = 'originalEvent' in e ? e.originalEvent : null;
  if (!ev || typeof (ev as TouchEvent).touches === 'undefined') return false;
  return (ev as TouchEvent).touches.length > 1;
}

function isLandmarkTileset404Error(event: unknown): boolean {
  const e = event as {
    sourceId?: string;
    source?: { url?: string };
    tile?: { url?: string };
    error?: { status?: number; message?: string } | string;
    message?: string;
  };
  const status = typeof e?.error === 'object' ? e.error?.status : undefined;
  const message =
    `${typeof e?.message === 'string' ? e.message : ''} ` +
    `${typeof e?.error === 'string' ? e.error : ''} ` +
    `${typeof e?.error === 'object' && typeof e.error?.message === 'string' ? e.error.message : ''} ` +
    `${typeof e?.sourceId === 'string' ? e.sourceId : ''} ` +
    `${typeof e?.source?.url === 'string' ? e.source.url : ''} ` +
    `${typeof e?.tile?.url === 'string' ? e.tile.url : ''}`;
  const has404 = status === 404 || /404|not found/i.test(message);
  const isLandmarkTileset = /mapbox\.mapbox-landmark-pois-v1/i.test(message);
  return has404 && isLandmarkTileset;
}

export function useMapCore(
  selectedSpot: MapCoreSelectedSpot,
  options: UseMapCoreOptions
) {
  const {
    onLongPress,
    skipCenterOnUser = false,
    shouldCenterOnUser,
    onUserMapGestureStart,
    enableLandmarkLabels = false,
    isDarkStyle = false,
    spots = [],
    selectedSpotId = null,
    onPinClick,
    is3DEnabled = false,
    showMakiIcon = false,
    showSpotLabels = true,
  } = options;

  const flyToOptions = useMemo(
    () => ({
      zoom: SPOT_FOCUS_ZOOM,
      duration: FIT_BOUNDS_DURATION_MS,
      ...(is3DEnabled && {
        pitch: INITIAL_PITCH,
        padding: { bottom: SPOT_FOCUS_PADDING_BOTTOM },
      }),
    }),
    [is3DEnabled],
  );

  const spotsRef = useRef<SpotForLayer[]>(spots);
  const onPinClickRef = useRef(onPinClick);
  spotsRef.current = spots;
  onPinClickRef.current = onPinClick;

  const [mapInstance, setMapInstance] = useState<MapboxMap | null>(null);
  const [userCoords, setUserCoords] = useState<UserCoords>(null);
  const [zoom, setZoom] = useState(10);
  const [activeMapControl, setActiveMapControl] = useState<ActiveMapControl>(null);
  const [viewportNonce, setViewportNonce] = useState(0);
  const [selectedPinScreenPos, setSelectedPinScreenPos] = useState<{
    x: number;
    y: number;
  } | null>(null);

  const programmaticMoveRef = useRef(false);
  const mapRootRef = useRef<unknown>(null);
  const worldZoomActiveRef = useRef(false);
  const locationSavedViewRef = useRef<{
    center: [number, number];
    zoom: number;
    bearing: number;
    pitch?: number;
  } | null>(null);
  const locationCycleRef = useRef<'idle' | 'location' | 'location-north'>('idle');
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressLngLatRef = useRef<{ lat: number; lng: number } | null>(null);
  const longPressPointerStartRef = useRef<{ x: number; y: number } | null>(null);
  const onLongPressRef = useRef(onLongPress);
  const mountedRef = useRef(true);
  onLongPressRef.current = onLongPress;

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const clearLongPressTimer = useCallback(() => {
    if (longPressTimerRef.current !== null) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    longPressLngLatRef.current = null;
    longPressPointerStartRef.current = null;
  }, []);

  const fireLongPress = useCallback(() => {
    const coords = longPressLngLatRef.current;
    longPressLngLatRef.current = null;
    if (coords) onLongPressRef.current(coords);
    clearLongPressTimer();
  }, [clearLongPressTimer]);

  const onMapLoad = useCallback(
    (e: MapEvent) => {
      const map = e.target;
      setMapInstance(map);
      setZoom(map.getZoom());
      if (!enableLandmarkLabels) {
        stripUnavailableLandmarkPoiTileset(map);
      }
      applyGlobeAndAtmosphere(map);
      hideNoiseLayers(map, { preservePoiLabels: enableLandmarkLabels });
      setLandmarkLabelsEnabled(map, enableLandmarkLabels);
      if (!skipCenterOnUser) {
        tryCenterOnUser(map, (coords) => {
          if (mountedRef.current) setUserCoords(coords);
        }, () => shouldCenterOnUser?.() ?? true);
      }
    },
    [skipCenterOnUser, enableLandmarkLabels, shouldCenterOnUser]
  );

  useEffect(() => {
    const map = mapInstance;
    if (!map) return;
    const reapply = () => {
      if (!enableLandmarkLabels) {
        stripUnavailableLandmarkPoiTileset(map);
      }
      hideNoiseLayers(map, { preservePoiLabels: enableLandmarkLabels });
      setLandmarkLabelsEnabled(map, enableLandmarkLabels);
    };
    map.on('styledata', reapply);
    return () => {
      map.off('styledata', reapply);
    };
  }, [mapInstance, enableLandmarkLabels]);

  useEffect(() => {
    const map = mapInstance;
    if (!map) return;
    return installStyleImageFallback(map);
  }, [mapInstance]);

  useEffect(() => {
    const map = mapInstance;
    if (!map) return;
    let landmarkFallbackApplied = false;
    const handleMapError = (event: unknown) => {
      if (landmarkFallbackApplied) return;
      if (!isLandmarkTileset404Error(event)) return;
      landmarkFallbackApplied = true;
      setLandmarkLabelsEnabled(map, false);
      stripUnavailableLandmarkPoiTileset(map);
      hideNoiseLayers(map, { preservePoiLabels: false });
    };
    map.on('error', handleMapError);
    return () => {
      map.off('error', handleMapError);
    };
  }, [mapInstance]);

  useEffect(() => {
    const map = mapInstance;
    if (!map || !onPinClick) return;
    setupSpotsLayer(
      map,
      spots,
      selectedSpotId,
      zoom,
      isDarkStyle,
      showMakiIcon,
      showSpotLabels,
      (spotId) => {
        const s = spotsRef.current.find((sp) => sp.id === spotId);
        if (s) onPinClickRef.current?.(s);
      }
    );
  }, [mapInstance, onPinClick, isDarkStyle, showMakiIcon, showSpotLabels]);

  useEffect(() => {
    const map = mapInstance;
    if (!map) return;
    let hasSpotsSource = false;
    try {
      hasSpotsSource = Boolean(map.getSource('flowya-spots'));
    } catch {
      hasSpotsSource = false;
    }
    if (!hasSpotsSource) return;
    updateSpotsLayerData(map, spots, selectedSpotId, zoom, showSpotLabels);
  }, [mapInstance, spots, selectedSpotId, zoom, showSpotLabels]);

  const handleLocate = useCallback(() => {
    if (!mapInstance) return;
    programmaticMoveRef.current = true;

    // Press 3 (north → location): restaurar vista guardada tras press 1
    if (locationCycleRef.current === 'location-north' && locationSavedViewRef.current) {
      const saved = locationSavedViewRef.current;
      mapInstance.flyTo({
        center: saved.center,
        zoom: saved.zoom,
        bearing: saved.bearing,
        pitch: saved.pitch ?? INITIAL_PITCH,
        duration: 800,
      });
      locationCycleRef.current = 'location';
      setActiveMapControl('location');
      return;
    }

    // Press 2 (location → north): orientación norte
    if (locationCycleRef.current === 'location') {
      mapInstance.easeTo({ bearing: 0, duration: 600 });
      locationCycleRef.current = 'location-north';
      setActiveMapControl('location-north');
      return;
    }

    // Press 1 (idle → location): flyTo user, guardar vista
    if (typeof navigator === 'undefined' || !navigator.geolocation) return;
    setActiveMapControl('location');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords: UserCoords = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        };
        setUserCoords(coords);
        const center: [number, number] = [coords.longitude, coords.latitude];
        locationSavedViewRef.current = {
          center,
          zoom: 15,
          bearing: mapInstance.getBearing(),
          pitch: mapInstance.getPitch(),
        };
        locationCycleRef.current = 'location';
        mapInstance.flyTo({
          center,
          zoom: 15,
          duration: 1500,
          ...(is3DEnabled && {
            pitch: INITIAL_PITCH,
            padding: { bottom: SPOT_FOCUS_PADDING_BOTTOM },
          }),
        });
      },
      () => {
        if (userCoords) {
          const center: [number, number] = [userCoords.longitude, userCoords.latitude];
          locationSavedViewRef.current = {
            center,
            zoom: 15,
            bearing: mapInstance.getBearing(),
            pitch: mapInstance.getPitch(),
          };
          locationCycleRef.current = 'location';
          mapInstance.flyTo({
            center,
            zoom: 15,
            duration: 1500,
            ...(is3DEnabled && {
              pitch: INITIAL_PITCH,
              padding: { bottom: SPOT_FOCUS_PADDING_BOTTOM },
            }),
          });
        }
      },
      GEO_OPTIONS
    );
  }, [mapInstance, userCoords, is3DEnabled]);

  const handleReframeSpot = useCallback(() => {
    if (!mapInstance || !selectedSpot) return;
    programmaticMoveRef.current = true;
    setActiveMapControl('spot');
    mapInstance.flyTo({
      center: [selectedSpot.longitude, selectedSpot.latitude],
      ...flyToOptions,
    });
  }, [mapInstance, selectedSpot, flyToOptions]);

  const handleReframeSpotAndUser = useCallback(() => {
    if (!mapInstance || !selectedSpot) return;
    programmaticMoveRef.current = true;
    setActiveMapControl('spot+user');
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
          ...flyToOptions,
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
          const c: UserCoords = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          };
          setUserCoords(c);
          runReframe(c);
        },
        () => runReframe(userCoords),
        GEO_OPTIONS
      );
    } else {
      runReframe(userCoords);
    }
  }, [mapInstance, selectedSpot, userCoords, flyToOptions]);

  const handleViewWorld = useCallback(() => {
    if (!mapInstance) return;
    programmaticMoveRef.current = true;
    const center = mapInstance.getCenter();
    if (worldZoomActiveRef.current) {
      // Volver a zoom inicial
      mapInstance.flyTo({
        center: [center.lng, center.lat],
        zoom: GLOBE_ZOOM_INITIAL,
        duration: FIT_BOUNDS_DURATION_MS,
      });
      worldZoomActiveRef.current = false;
      setActiveMapControl(null);
    } else {
      // Ver mundo: mantener posición, solo cambiar zoom
      mapInstance.flyTo({
        center: [center.lng, center.lat],
        zoom: GLOBE_ZOOM_WORLD,
        duration: FIT_BOUNDS_DURATION_MS,
      });
      worldZoomActiveRef.current = true;
      setActiveMapControl('world');
    }
  }, [mapInstance]);

  const handleToggle3D = useCallback(
    (enabled: boolean) => {
      if (!mapInstance) return;
      programmaticMoveRef.current = true;
      mapInstance.easeTo({ pitch: enabled ? INITIAL_PITCH : 0, duration: 600 });
      set3DBuildingsEnabled(mapInstance, enabled);
    },
    [mapInstance]
  );

  /** flyTo que no dispara onUserMapGestureStart (movestart se considera programático). */
  const programmaticFlyTo = useCallback(
    (center: { lng: number; lat: number }, options?: { zoom?: number; duration?: number }) => {
      if (!mapInstance) return;
      programmaticMoveRef.current = true;
      mapInstance.flyTo({
        center: [center.lng, center.lat],
        zoom: options?.zoom ?? SPOT_FOCUS_ZOOM,
        duration: options?.duration ?? FIT_BOUNDS_DURATION_MS,
        ...(is3DEnabled && {
          pitch: INITIAL_PITCH,
          padding: { bottom: SPOT_FOCUS_PADDING_BOTTOM },
        }),
      });
    },
    [mapInstance, is3DEnabled],
  );

  useEffect(() => {
    const map = mapInstance;
    if (!map) return;
    const onMoveStart = () => {
      if (!programmaticMoveRef.current && onUserMapGestureStart) onUserMapGestureStart();
    };
    const onMoveEnd = () => {
      if (programmaticMoveRef.current) {
        // Defer reset so any movestart that fires right after (e.g. flyTo follow-up) still sees programmatic
        const ref = programmaticMoveRef;
        setTimeout(() => {
          ref.current = false;
        }, 200);
      } else {
        worldZoomActiveRef.current = false;
        locationCycleRef.current = 'idle';
        setActiveMapControl(null);
      }
      setZoom(map.getZoom());
      setViewportNonce((prev) => prev + 1);
      if (selectedSpot) {
        try {
          const pt = map.project([selectedSpot.longitude, selectedSpot.latitude]);
          setSelectedPinScreenPos({ x: pt.x, y: pt.y });
        } catch {
          setSelectedPinScreenPos(null);
        }
      }
    };
    map.on('movestart', onMoveStart);
    map.on('moveend', onMoveEnd);
    return () => {
      map.off('movestart', onMoveStart);
      map.off('moveend', onMoveEnd);
    };
  }, [mapInstance, selectedSpot, onUserMapGestureStart]);

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

  const handleMapPointerDown = useCallback(
    (e: MapMouseEvent | MapTouchEvent) => {
      if (isMultiTouch(e)) {
        clearLongPressTimer();
        return;
      }
      const lngLat = 'lngLat' in e ? e.lngLat : (e as MapMouseEvent).lngLat;
      if (!lngLat) return;
      const { x, y } = getPointFromEvent(e);
      longPressLngLatRef.current = { lat: lngLat.lat, lng: lngLat.lng };
      longPressPointerStartRef.current = { x, y };
      longPressTimerRef.current = setTimeout(fireLongPress, LONG_PRESS_MS);
    },
    [fireLongPress, clearLongPressTimer]
  );

  const handleMapPointerMove = useCallback(
    (e: MapMouseEvent | MapTouchEvent) => {
      if (isMultiTouch(e)) {
        clearLongPressTimer();
        return;
      }
      if (longPressTimerRef.current === null || longPressPointerStartRef.current === null) return;
      const { x, y } = getPointFromEvent(e);
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

  return {
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
  };
}
