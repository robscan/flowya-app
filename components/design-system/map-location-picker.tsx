/**
 * Design System: MapLocationPicker (canónico).
 * Selección de ubicación en mapa: un solo pin, tap para colocar/mover.
 * Si hay ubicación del usuario, el pin inicia ahí; si no, región default.
 * Estados: empty | selecting | confirmed. Navegación solo por header (flecha atrás).
 */

import '@/styles/mapbox-attribution-overrides.css';
import type { Map as MapboxMap } from 'mapbox-gl';
import { useCallback, useEffect, useState } from 'react';
import type { MapEvent, MapMouseEvent } from 'react-map-gl/mapbox-legacy';
import { default as MapGL, Marker } from 'react-map-gl/mapbox-legacy';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, Radius, Spacing, WebTouchManipulation } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { reverseGeocode } from '@/lib/mapbox-geocoding';
import { getSpotsNearby, type SpotNearby } from '@/lib/spot-duplicate-check';

import { MapControls } from './map-controls';
import { MapPinCreating, MapPinExisting } from './map-pins';

const MAPBOX_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_TOKEN ?? '';
const FALLBACK_VIEW = { longitude: -87.2, latitude: 20.4, zoom: 10 };
const CTA_Z_INDEX = 9999;
const CONTROLS_Z_INDEX = 9998;
const CONTROLS_RIGHT = 16;
/** Controles por encima del botón CTA (botón pegado al borde inferior). */
const CONTROLS_BOTTOM = 80;

export type MapLocationPickerResult = {
  latitude: number;
  longitude: number;
  address: string | null;
};

export type MapLocationPickerState = 'empty' | 'selecting' | 'confirmed';

export type MapLocationPickerProps = {
  /** Llamado al confirmar ubicación (con reverse geocoding ya ejecutado). */
  onConfirm: (result: MapLocationPickerResult) => void;
  /** Opcional: cancelar (no se muestra botón; solo header atrás). */
  onCancel?: () => void;
  /** Opcional: nombre del spot en creación; se muestra debajo del pin cuando hay ubicación. */
  spotTitle?: string | null;
  /** Edit Spot: ubicación inicial del pin (sin centrar en usuario). */
  initialLatitude?: number;
  initialLongitude?: number;
  /** Entrada desde mapa (long-press): vista a preservar; no se hace flyTo ni centrado. */
  initialViewLongitude?: number;
  initialViewLatitude?: number;
  initialViewZoom?: number;
  initialViewBearing?: number;
  initialViewPitch?: number;
  /** S4: centro externo (ej. lugar elegido desde búsqueda). Al cambiar, flyTo + pin en esa posición. */
  externalCenter?: { lat: number; lng: number } | null;
};

function tryCenterOnUser(
  map: MapboxMap,
  onCoords?: (lng: number, lat: number) => void
) {
  if (typeof navigator === 'undefined' || !navigator.geolocation) return;
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const lng = pos.coords.longitude;
      const lat = pos.coords.latitude;
      map.flyTo({
        center: [lng, lat],
        zoom: 14,
        duration: 1500,
      });
      onCoords?.(lng, lat);
    },
    () => {},
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
  );
}

export function MapLocationPicker({
  onConfirm,
  spotTitle,
  initialLatitude,
  initialLongitude,
  initialViewLongitude,
  initialViewLatitude,
  initialViewZoom,
  initialViewBearing,
  initialViewPitch,
  externalCenter,
}: MapLocationPickerProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();
  const hasInitialCoords =
    initialLatitude != null && initialLongitude != null;
  const preserveView =
    initialViewLongitude != null &&
    initialViewLatitude != null &&
    initialViewZoom != null &&
    Number.isFinite(initialViewLongitude) &&
    Number.isFinite(initialViewLatitude) &&
    Number.isFinite(initialViewZoom);
  const [, setState] = useState<MapLocationPickerState>(
    hasInitialCoords ? 'selecting' : 'empty'
  );
  const [lngLat, setLngLat] = useState<{ lng: number; lat: number } | null>(
    hasInitialCoords && initialLatitude != null && initialLongitude != null
      ? { lng: initialLongitude, lat: initialLatitude }
      : null
  );
  const [nearbySpots, setNearbySpots] = useState<SpotNearby[]>([]);
  const [confirming, setConfirming] = useState(false);
  const [mapInstance, setMapInstance] = useState<MapboxMap | null>(null);
  const [confirmButtonFocused, setConfirmButtonFocused] = useState(false);

  useEffect(() => {
    if (!lngLat) {
      setNearbySpots([]);
      return;
    }
    let cancelled = false;
    getSpotsNearby(lngLat.lat, lngLat.lng).then((list) => {
      if (!cancelled) setNearbySpots(list);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- lngLat fields sufficient; full object causes re-fetch on ref change
  }, [lngLat?.lat, lngLat?.lng]);


  const onMapLoad = useCallback(
    (e: MapEvent) => {
      const map = e.target;
      setMapInstance(map);
      if (preserveView) {
        // Vista preservada desde mapa (long-press): no flyTo ni centrado.
        return;
      }
      if (hasInitialCoords && initialLatitude != null && initialLongitude != null) {
        map.flyTo({
          center: [initialLongitude, initialLatitude],
          zoom: 14,
          duration: 0,
        });
      } else {
        tryCenterOnUser(map, (lng, lat) => {
          setLngLat({ lng, lat });
          setState('selecting');
        });
      }
    },
    [preserveView, hasInitialCoords, initialLatitude, initialLongitude]
  );

  /** S4: cuando externalCenter cambia (ej. lugar desde búsqueda), centrar mapa y colocar pin. */
  useEffect(() => {
    if (!externalCenter || !mapInstance) return;
    const { lat, lng } = externalCenter;
    mapInstance.flyTo({
      center: [lng, lat],
      zoom: 14,
      duration: 600,
    });
    setLngLat({ lng, lat });
    setState('selecting');
    // eslint-disable-next-line react-hooks/exhaustive-deps -- externalCenter fields sufficient; full object causes re-run
  }, [externalCenter?.lat, externalCenter?.lng, mapInstance]);


  const onMapClick = useCallback((e: MapMouseEvent) => {
    e.originalEvent?.stopPropagation?.();

    const { lng, lat } = e.lngLat;
    setLngLat({ lng, lat });
    setState('selecting');
  }, []);

  const handleConfirm = useCallback(async () => {
    if (!lngLat) return;
    setConfirming(true);
    const address = await reverseGeocode(lngLat.lat, lngLat.lng);
    setState('confirmed');
    setConfirming(false);
    onConfirm({
      latitude: lngLat.lat,
      longitude: lngLat.lng,
      address,
    });
  }, [lngLat, onConfirm]);

  if (!MAPBOX_TOKEN) {
    return (
      <View style={[styles.container, styles.placeholder] as StyleProp<ViewStyle>}>
        <Text style={[styles.placeholderText, { color: colors.textSecondary }] as StyleProp<TextStyle>}>
          Set EXPO_PUBLIC_MAPBOX_TOKEN for the map.
        </Text>
      </View>
    );
  }

  const mapStyle =
    colorScheme === 'dark' ? 'mapbox://styles/mapbox/dark-v11' : 'mapbox://styles/mapbox/light-v11';

  const initialViewState = preserveView
    ? {
        longitude: initialViewLongitude!,
        latitude: initialViewLatitude!,
        zoom: initialViewZoom!,
        ...(initialViewBearing != null && Number.isFinite(initialViewBearing)
          ? { bearing: initialViewBearing }
          : {}),
        ...(initialViewPitch != null && Number.isFinite(initialViewPitch)
          ? { pitch: initialViewPitch }
          : {}),
      }
    : hasInitialCoords
      ? {
          longitude: initialLongitude!,
          latitude: initialLatitude!,
          zoom: 14,
        }
      : FALLBACK_VIEW;

  return (
    <View style={styles.container as StyleProp<ViewStyle>}>
      <MapGL
        key={mapStyle}
        mapboxAccessToken={MAPBOX_TOKEN}
        mapStyle={mapStyle}
        initialViewState={initialViewState}
        style={styles.map as React.CSSProperties}
        onClick={onMapClick}
        onLoad={onMapLoad}
      >
        {nearbySpots.map((spot) => (
          <Marker
            key={spot.id}
            longitude={spot.longitude}
            latitude={spot.latitude}
            anchor="center"
            draggable={false}
          >
            <MapPinExisting label={spot.title} colorScheme={colorScheme ?? undefined} />
          </Marker>
        ))}
        {lngLat ? (
          <Marker
            longitude={lngLat.lng}
            latitude={lngLat.lat}
            anchor="center"
            draggable={false}
          >
            <MapPinCreating label={spotTitle ?? undefined} colorScheme={colorScheme ?? undefined} />
          </Marker>
        ) : null}
      </MapGL>
      <View
        style={[styles.controlsOverlay, { zIndex: CONTROLS_Z_INDEX, pointerEvents: 'box-none' }] as StyleProp<ViewStyle>}
      >
        <MapControls map={mapInstance} />
      </View>
      {lngLat ? (
      <View
        style={
          [
            styles.ctaBar,
            {
              paddingBottom: Math.max(insets.bottom, Spacing.base),
              zIndex: CTA_Z_INDEX,
            },
          ] as StyleProp<ViewStyle>
        }
      >
          <Pressable
            style={({ pressed }: { pressed: boolean }) => [
                styles.confirmButton,
                {
                  backgroundColor:
                    confirming ? colors.border : pressed ? colors.text : colors.tint,
                },
                WebTouchManipulation,
                Platform.OS === 'web' && {
                  outlineWidth: 0,
                  outlineStyle: 'none' as const,
                  ...(confirmButtonFocused && {
                    boxShadow:
                      colorScheme === 'dark'
                        ? '0 0 0 2px rgba(41,151,255,0.35)'
                        : '0 0 0 2px rgba(0,113,227,0.35)',
                  }),
                },
              ]}
            onPress={handleConfirm}
            onFocus={() => setConfirmButtonFocused(true)}
            onBlur={() => setConfirmButtonFocused(false)}
            disabled={confirming}
            accessibilityLabel="Confirmar ubicación"
            accessibilityRole="button"
          >
            {confirming ? (
              <ActivityIndicator size="small" color={colors.background} />
            ) : (
              <Text style={[styles.confirmLabel, { color: colors.background }] as StyleProp<TextStyle>}>
                Confirmar ubicación
              </Text>
            )}
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    ...Platform.select({
      web: { minHeight: '40vh' },
      default: { minHeight: 300 },
    }),
  },
  map: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  placeholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 14,
  },
  controlsOverlay: {
    position: 'absolute',
    right: CONTROLS_RIGHT,
    bottom: CONTROLS_BOTTOM,
  },
  /** Barra del CTA pegada al borde inferior; sin envolvente, solo padding para el botón. */
  ctaBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.base,
  },
  confirmButton: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmLabel: {
    fontSize: 17,
    fontWeight: '600',
  },
});
