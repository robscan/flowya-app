/**
 * Design System: MapLocationPicker (canónico).
 * Selección de ubicación en mapa: un solo pin, tap para colocar/mover.
 * El pin inicia en coordenadas iniciales (si existen) o en región default.
 * Estados: empty | selecting | confirmed. Navegación solo por header (flecha atrás).
 */

import '@/styles/mapbox-attribution-overrides.css';
import type { Map as MapboxMap } from 'mapbox-gl';
import { Search } from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import type { MapEvent, MapMouseEvent } from 'react-map-gl/mapbox-legacy';
import { default as MapGL, Marker } from 'react-map-gl/mapbox-legacy';
import type { DimensionValue, StyleProp, TextStyle, ViewStyle } from 'react-native';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useSystemStatus } from '@/components/ui/system-status-bar';
import { Colors, Radius, Spacing, WebTouchManipulation } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { requestCurrentLocation } from '@/lib/geolocation/request-user-location';
import { reverseGeocode } from '@/lib/mapbox-geocoding';
import { applyExploreCameraForPlace } from '@/lib/places/areaFraming';
import {
  searchPlaces,
  type PlaceResult,
} from '@/lib/places/searchPlaces';
import { getSpotsNearby, type SpotNearby } from '@/lib/spot-duplicate-check';

import { SearchInputV2 } from '@/components/search/SearchInputV2';

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
  /** Lugar Mapbox elegido en la lista; si se movió solo el pin, undefined/null. */
  selectedPlace?: PlaceResult | null;
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
  /** Mostrar buscador Mapbox encima del mapa (editar ubicación / crear). */
  showPlaceSearch?: boolean;
};

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
  showPlaceSearch = true,
}: MapLocationPickerProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();
  const toast = useSystemStatus();
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

  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchResults, setSearchResults] = useState<PlaceResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedFromSearch, setSelectedFromSearch] = useState<PlaceResult | null>(null);

  const proximityForSearch = useCallback(
    (): { lat: number; lng: number } => {
      if (lngLat) return { lat: lngLat.lat, lng: lngLat.lng };
      if (hasInitialCoords && initialLatitude != null && initialLongitude != null) {
        return { lat: initialLatitude, lng: initialLongitude };
      }
      return { lat: FALLBACK_VIEW.latitude, lng: FALLBACK_VIEW.longitude };
    },
    [lngLat, hasInitialCoords, initialLatitude, initialLongitude],
  );

  useEffect(() => {
    if (!showPlaceSearch) {
      setSearchResults([]);
      return;
    }
    const q = searchQuery.trim();
    if (q.length < 3) {
      setSearchResults([]);
      return;
    }
    let cancelled = false;
    const t = setTimeout(() => {
      (async () => {
        setSearchLoading(true);
        try {
          const prox = proximityForSearch();
          const results = await searchPlaces(q, { proximity: prox, limit: 8 });
          if (!cancelled) setSearchResults(results);
        } catch {
          if (!cancelled) setSearchResults([]);
        } finally {
          if (!cancelled) setSearchLoading(false);
        }
      })();
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [searchQuery, showPlaceSearch, proximityForSearch]);

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


  const flyToFromPlace = useCallback(
    (place: PlaceResult) => {
      if (!mapInstance) return;
      applyExploreCameraForPlace(mapInstance, place, (center, opts) => {
        mapInstance.flyTo({
          center: [center.lng, center.lat],
          zoom: opts?.zoom ?? 14,
          duration: opts?.duration ?? 600,
        });
      });
    },
    [mapInstance],
  );

  const handleSelectSearchResult = useCallback((place: PlaceResult) => {
    setLngLat({ lng: place.lng, lat: place.lat });
    setSelectedFromSearch(place);
    setState('selecting');
  }, []);

  useEffect(() => {
    if (!mapInstance || !selectedFromSearch) return;
    flyToFromPlace(selectedFromSearch);
  }, [mapInstance, selectedFromSearch, flyToFromPlace]);

  const onMapClick = useCallback((e: MapMouseEvent) => {
    e.originalEvent?.stopPropagation?.();

    const { lng, lat } = e.lngLat;
    setLngLat({ lng, lat });
    setSelectedFromSearch(null);
    setState('selecting');
  }, []);

  const handleConfirm = useCallback(async () => {
    if (!lngLat) return;
    setConfirming(true);
    let address: string | null;
    if (selectedFromSearch) {
      const a =
        selectedFromSearch.fullName?.trim() ||
        selectedFromSearch.name?.trim() ||
        null;
      address = a ?? (await reverseGeocode(lngLat.lat, lngLat.lng));
    } else {
      address = await reverseGeocode(lngLat.lat, lngLat.lng);
    }
    setState('confirmed');
    setConfirming(false);
    onConfirm({
      latitude: lngLat.lat,
      longitude: lngLat.lng,
      address,
      selectedPlace: selectedFromSearch,
    });
  }, [lngLat, onConfirm, selectedFromSearch]);

  const handleLocate = useCallback(async () => {
    if (!mapInstance) return;
    const result = await requestCurrentLocation();
    if (result.status === 'ok') {
      const { latitude, longitude } = result.coords;
      mapInstance.flyTo({
        center: [longitude, latitude],
        zoom: 14,
        duration: 1500,
      });
      setLngLat({ lng: longitude, lat: latitude });
      setState('selecting');
      return;
    }
    if (result.status === 'denied') {
      toast.show('Activa ubicación para este sitio en tu navegador y vuelve a intentar.', {
        type: 'default',
      });
      return;
    }
    if (result.status === 'timeout' || result.status === 'unavailable') {
      toast.show('No pudimos obtener tu ubicación. Intenta de nuevo.', { type: 'error' });
    }
  }, [mapInstance, toast]);

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
      {showPlaceSearch ? (
        <View
          style={[
            styles.searchPanel,
            { borderBottomColor: colors.borderSubtle, backgroundColor: colors.backgroundElevated },
          ]}
        >
          <View
            style={[
              styles.searchPillRow,
              {
                borderWidth: searchFocused ? 2 : 1,
                borderColor: searchFocused ? colors.tint : colors.borderSubtle,
                backgroundColor: colors.background,
              },
            ]}
          >
            <Search size={20} color={colors.textSecondary} strokeWidth={2} />
            <SearchInputV2
              value={searchQuery}
              onChangeText={setSearchQuery}
              onClear={() => setSearchQuery('')}
              embedded
              placeholder="Buscar lugar (mín. 3 letras)"
              accessibilityLabel="Buscar lugar"
              autoCorrect={false}
              autoCapitalize="none"
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
            />
          </View>
          {searchLoading ? (
            <View style={styles.searchLoadingRow}>
              <ActivityIndicator size="small" color={colors.tint} />
            </View>
          ) : null}
          {searchResults.length > 0 ? (
            <ScrollView
              style={styles.searchResultsScroll}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator
            >
              {searchResults.map((place) => (
                <Pressable
                  key={place.id}
                  onPress={() => handleSelectSearchResult(place)}
                  style={({ pressed }) =>
                    [
                      styles.searchResultRow,
                      {
                        borderBottomColor: colors.borderSubtle,
                        backgroundColor: pressed ? colors.backgroundElevated : 'transparent',
                      },
                    ] as ViewStyle[]
                  }
                  accessibilityRole="button"
                  accessibilityLabel={`Elegir ${place.name}`}
                >
                  <Text style={[styles.searchResultTitle, { color: colors.text }]} numberOfLines={2}>
                    {place.name}
                  </Text>
                  {place.fullName ? (
                    <Text
                      style={[styles.searchResultSub, { color: colors.textSecondary }]}
                      numberOfLines={2}
                    >
                      {place.fullName}
                    </Text>
                  ) : null}
                </Pressable>
              ))}
            </ScrollView>
          ) : null}
        </View>
      ) : null}
      <View style={styles.mapWrap}>
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
      </View>
      <View
        style={[styles.controlsOverlay, { zIndex: CONTROLS_Z_INDEX, pointerEvents: 'box-none' }] as StyleProp<ViewStyle>}
      >
        <MapControls map={mapInstance} onLocate={handleLocate} />
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
            style={({ pressed }: { pressed: boolean }) =>
              [
                styles.confirmButton,
                {
                  backgroundColor:
                    confirming ? colors.border : pressed ? colors.text : colors.tint,
                },
                WebTouchManipulation,
                Platform.OS === 'web'
                  ? {
                      outlineWidth: 0,
                      outlineStyle: 'none' as const,
                      ...(confirmButtonFocused && {
                        boxShadow:
                          colorScheme === 'dark'
                            ? '0 0 0 2px rgba(41,151,255,0.35)'
                            : '0 0 0 2px rgba(0,113,227,0.35)',
                      }),
                    }
                  : {},
              ] as ViewStyle[]
            }
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
      web: { minHeight: '40vh' as DimensionValue },
      default: { minHeight: 300 },
    }),
  } satisfies ViewStyle,
  searchPanel: {
    flexShrink: 0,
    borderBottomWidth: 1,
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.sm,
    maxHeight: 220,
    zIndex: 2,
  } satisfies ViewStyle,
  /** Misma cápsula que DS «Búsqueda en mapa — SearchInputV2 (embebido)». */
  searchPillRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    paddingLeft: Spacing.base,
    paddingRight: Spacing.sm,
    gap: Spacing.sm,
    borderRadius: 22,
  } satisfies ViewStyle,
  searchLoadingRow: {
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  } satisfies ViewStyle,
  searchResultsScroll: {
    maxHeight: 140,
    marginTop: Spacing.sm,
  } satisfies ViewStyle,
  searchResultRow: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
  } satisfies ViewStyle,
  searchResultTitle: {
    fontSize: 15,
    fontWeight: '600',
  } satisfies TextStyle,
  searchResultSub: {
    fontSize: 13,
    marginTop: 2,
  } satisfies TextStyle,
  mapWrap: {
    flex: 1,
    minHeight: 200,
    width: '100%',
  } satisfies ViewStyle,
  map: {
    flex: 1,
    width: '100%',
    height: '100%',
  } satisfies ViewStyle,
  placeholder: {
    justifyContent: 'center',
    alignItems: 'center',
  } satisfies ViewStyle,
  placeholderText: {
    fontSize: 14,
  } satisfies TextStyle,
  controlsOverlay: {
    position: 'absolute',
    right: CONTROLS_RIGHT,
    bottom: CONTROLS_BOTTOM,
  } satisfies ViewStyle,
  /** Barra del CTA pegada al borde inferior; sin envolvente, solo padding para el botón. */
  ctaBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.base,
  } satisfies ViewStyle,
  confirmButton: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  } satisfies ViewStyle,
  confirmLabel: {
    fontSize: 17,
    fontWeight: '600',
  } satisfies TextStyle,
});
