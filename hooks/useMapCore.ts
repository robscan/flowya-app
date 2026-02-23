/**
 * useMapCore — hook que encapsula estado y handlers del núcleo del mapa (Explorar).
 * MapControls sigue en el contenedor; el core solo expone handlers y estado.
 */

import type { ActiveMapControl } from '@/components/design-system/map-controls';
import type { Map as MapboxMap } from 'mapbox-gl';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { MapEvent, MapMouseEvent, MapTouchEvent } from 'react-map-gl/mapbox-legacy';

import MapboxLanguage from '@mapbox/mapbox-gl-language';
import {
  setupSpotsLayer,
  updateSpotsLayerData,
  type SpotForLayer,
} from '@/lib/map-core/spots-layer';
import {
  applyGlobeAndAtmosphere,
  applyWaterAndGreenspaceColors,
  enable3DBuildingsAndObjects,
  FIT_BOUNDS_DURATION_MS,
  hideCommercialPOIsViaConfig,
  hideNoiseLayers,
  INITIAL_PITCH,
  LONG_PRESS_DRAG_THRESHOLD_PX,
  LONG_PRESS_MS,
  set3DBuildingsEnabled,
  SPOT_FOCUS_ZOOM,
  showLandmarkLabels,
  tryCenterOnUser,
  type UserCoords,
  WORLD_BOUNDS,
} from '@/lib/map-core/constants';

export type MapCoreSelectedSpot = { id: string; longitude: number; latitude: number } | null;

export type UseMapCoreOptions = {
  onLongPress: (coords: { lat: number; lng: number }) => void;
  /** Si true, no se llama tryCenterOnUser en onMapLoad (ej. cuando params.created). */
  skipCenterOnUser?: boolean;
  /** Llamado cuando el usuario inicia pan/zoom (no programático). */
  onUserMapGestureStart?: () => void;
  /** Si true, activa showLandmarkIcons/showLandmarkIconLabels (estilo FLOWYA/Standard). */
  enableLandmarkLabels?: boolean;
  /** Si true, usa light-v11/dark-v11 y aplica plugin idioma + colores agua/naturaleza. */
  useCoreMapStyles?: boolean;
  /** true = modo oscuro (para colores agua/greenspace). */
  isDarkStyle?: boolean;
  /** Spots a dibujar como capa nativa debajo de POI. */
  spots?: SpotForLayer[];
  /** Spot actualmente seleccionado (para estilo y click). */
  selectedSpotId?: string | null;
  /** Llamado al hacer click en un spot de la capa. */
  onPinClick?: (spot: SpotForLayer) => void;
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

export function useMapCore(
  selectedSpot: MapCoreSelectedSpot,
  options: UseMapCoreOptions
) {
  const {
    onLongPress,
    skipCenterOnUser = false,
    onUserMapGestureStart,
    enableLandmarkLabels = false,
    useCoreMapStyles = false,
    isDarkStyle = false,
    spots = [],
    selectedSpotId = null,
    onPinClick,
  } = options;

  const spotsRef = useRef<SpotForLayer[]>(spots);
  const onPinClickRef = useRef(onPinClick);
  spotsRef.current = spots;
  onPinClickRef.current = onPinClick;

  const [mapInstance, setMapInstance] = useState<MapboxMap | null>(null);
  const [userCoords, setUserCoords] = useState<UserCoords>(null);
  const [zoom, setZoom] = useState(10);
  const [activeMapControl, setActiveMapControl] = useState<ActiveMapControl>(null);
  const [selectedPinScreenPos, setSelectedPinScreenPos] = useState<{
    x: number;
    y: number;
  } | null>(null);

  const programmaticMoveRef = useRef(false);
  const mapRootRef = useRef<unknown>(null);
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
      applyGlobeAndAtmosphere(map);
      // Plugin de idioma: funciona con FLOWYA (Standard basemap) y Mapbox Standard
      try {
        map.addControl(new MapboxLanguage());
      } catch {
        /* ignore */
      }
      if (useCoreMapStyles) {
        enable3DBuildingsAndObjects(map);
        applyWaterAndGreenspaceColors(map, isDarkStyle);
        hideCommercialPOIsViaConfig(map); // POIs comerciales vía config; no hideNoiseLayers (oculta landmarks)
      } else {
        hideNoiseLayers(map); // FLOWYA: oculta poi-label por capa
      }
      if (enableLandmarkLabels) {
        showLandmarkLabels(map);
      }
      if (!skipCenterOnUser) {
        tryCenterOnUser(map, (coords) => {
          if (mountedRef.current) setUserCoords(coords);
        });
      }
    },
    [skipCenterOnUser, enableLandmarkLabels, useCoreMapStyles, isDarkStyle]
  );

  useEffect(() => {
    const map = mapInstance;
    if (!map || !onPinClick) return;
    setupSpotsLayer(
      map,
      spots,
      selectedSpotId,
      zoom,
      isDarkStyle,
      (spotId) => {
        const s = spotsRef.current.find((sp) => sp.id === spotId);
        if (s) onPinClickRef.current?.(s);
      }
    );
  }, [mapInstance, onPinClick, isDarkStyle]);

  useEffect(() => {
    const map = mapInstance;
    if (!map || !map.getSource('flowya-spots')) return;
    updateSpotsLayerData(map, spots, selectedSpotId, zoom);
  }, [mapInstance, spots, selectedSpotId, zoom]);

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
      GEO_OPTIONS
    );
  }, [mapInstance, userCoords]);

  const handleReframeSpot = useCallback(() => {
    if (!mapInstance || !selectedSpot) return;
    programmaticMoveRef.current = true;
    setActiveMapControl('spot');
    mapInstance.flyTo({
      center: [selectedSpot.longitude, selectedSpot.latitude],
      zoom: SPOT_FOCUS_ZOOM,
      duration: FIT_BOUNDS_DURATION_MS,
    });
  }, [mapInstance, selectedSpot]);

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
  }, [mapInstance, selectedSpot, userCoords]);

  const handleViewWorld = useCallback(() => {
    if (!mapInstance) return;
    programmaticMoveRef.current = true;
    setActiveMapControl('world');
    mapInstance.fitBounds(WORLD_BOUNDS, { duration: FIT_BOUNDS_DURATION_MS });
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
        zoom: options?.zoom ?? 15,
        duration: options?.duration ?? 800,
      });
    },
    [mapInstance]
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
