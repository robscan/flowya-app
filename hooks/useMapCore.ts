/**
 * useMapCore — hook que encapsula estado y handlers del núcleo del mapa (Explorar).
 * MapControls sigue en el contenedor; el core solo expone handlers y estado.
 */

import type { ActiveMapControl } from '@/components/design-system/map-controls';
import type { Map as MapboxMap } from 'mapbox-gl';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { MapEvent, MapMouseEvent, MapTouchEvent } from 'react-map-gl/mapbox-legacy';

import {
  applyGlobeAndAtmosphere,
  FIT_BOUNDS_DURATION_MS,
  hideNoiseLayers,
  LONG_PRESS_DRAG_THRESHOLD_PX,
  LONG_PRESS_MS,
  SPOT_FOCUS_ZOOM,
  tryCenterOnUser,
  type UserCoords,
  WORLD_BOUNDS,
} from '@/lib/map-core/constants';

export type MapCoreSelectedSpot = { id: string; longitude: number; latitude: number } | null;

export type UseMapCoreOptions = {
  onLongPress: (coords: { lat: number; lng: number }) => void;
  /** Si true, no se llama tryCenterOnUser en onMapLoad (ej. cuando params.created). */
  skipCenterOnUser?: boolean;
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

export function useMapCore(
  selectedSpot: MapCoreSelectedSpot,
  options: UseMapCoreOptions
) {
  const { onLongPress, skipCenterOnUser = false } = options;

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
      hideNoiseLayers(map);
      if (!skipCenterOnUser) {
        tryCenterOnUser(map, (coords) => {
          if (mountedRef.current) setUserCoords(coords);
        });
      }
    },
    [skipCenterOnUser]
  );

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
    return () => map.off('moveend', onMoveEnd);
  }, [mapInstance, selectedSpot]);

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
      const lngLat = 'lngLat' in e ? e.lngLat : (e as MapMouseEvent).lngLat;
      if (!lngLat) return;
      const { x, y } = getPointFromEvent(e);
      longPressLngLatRef.current = { lat: lngLat.lat, lng: lngLat.lng };
      longPressPointerStartRef.current = { x, y };
      longPressTimerRef.current = setTimeout(fireLongPress, LONG_PRESS_MS);
    },
    [fireLongPress]
  );

  const handleMapPointerMove = useCallback(
    (e: MapMouseEvent | MapTouchEvent) => {
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
    handleMapPointerDown,
    handleMapPointerMove,
    handleMapPointerUp,
  };
}
